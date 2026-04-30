import "dotenv/config";
import express, { Request, Response } from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { sanitizeInput, safeJsonParse } from "./src/server/utils";

// ────────────────────────────────────────────────────────────
// Types — Strictly typed API response shapes
// ────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant" | "model";
  content: string;
}

interface ChatResponse {
  reply: string;
  detectedPersona: string;
  currentMode: string;
  nextAction: string;
  uiData: Record<string, unknown>;
}

interface TimelineItem {
  title: string;
  date: string;
  description: string;
}

interface CandidateRecord {
  id: string;
  name: string;
  party: string;
  education: string;
  assets: string;
  criminalCases: number | string;
  profession: string;
  partyLogo: string;
  partyColor: string;
}

interface GovApiRecord {
  candidate_id?: string;
  candidate_name?: string;
  party_name?: string;
  education_qualifications?: string;
  total_assets?: string;
  criminal_cases?: number;
  profession?: string;
}

interface GovApiResponse {
  records?: GovApiRecord[];
}

interface ElectionParty {
  name: string;
  acronym: string;
  won: number;
  leading: number;
  total: number;
  color: string;
}

interface ElectionResults {
  timestamp: string;
  source: string;
  status: string;
  national: {
    totalConstituencies: number;
    declared: number;
    leading: number;
    parties: ElectionParty[];
  };
  turnout: {
    nationalAverage: string;
    highestState: { name: string; value: string };
    lowestState: { name: string; value: string };
  };
}

// ────────────────────────────────────────────────────────────
// In-Memory Cache — TTL-based response caching for efficiency
// ────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }
}

const cache = new ResponseCache();

const CACHE_TTL = {
  NEWS: 5 * 60 * 1000,       // 5 minutes
  TIMELINE: 10 * 60 * 1000,  // 10 minutes
  RESULTS: 2 * 60 * 1000,    // 2 minutes (semi-real-time)
  CANDIDATES: 15 * 60 * 1000, // 15 minutes
} as const;

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3000;
const MODEL_ID = "gemini-2.5-flash";
const DATA_GOV_BASE_URL = "https://api.data.gov.in/resource";

// ────────────────────────────────────────────────────────────
// Gemini AI Initialization (API Key — works on Cloud Run)
// ────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ────────────────────────────────────────────────────────────
// Utility: Fetch from data.gov.in Open Government Data API
// ────────────────────────────────────────────────────────────

async function fetchGovData(
  resourceId: string,
  filters: Record<string, string> = {}
): Promise<GovApiResponse | null> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL(`${DATA_GOV_BASE_URL}/${resourceId}`);
    url.searchParams.append("api-key", apiKey);
    url.searchParams.append("format", "json");
    url.searchParams.append("limit", "10");
    Object.entries(filters).forEach(([key, value]) =>
      url.searchParams.append(`filters[${key}]`, value)
    );

    const response = await fetch(url.toString());
    if (!response.ok) return null;
    return (await response.json()) as GovApiResponse;
  } catch (err) {
    console.error("Gov API fetch failed:", err);
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// System Instruction for the AI Assistant
// ────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `
You are CivicSence — an intelligent, politically neutral election education assistant built for India, with state-level awareness for Karnataka.
Your mission is to transform civic confusion into confident, informed action.

CRITICAL: Always query Google Search for the latest news regarding Indian elections and the Election Commission of India before answering, ensuring your responses are grounded in real-time, factual events.

PERSONAS:
- FIRST_TIME_VOTER: Plain language, metaphors, step-by-step.
- STUDENT_RESEARCHER: Structured, academic, comparative.
- ENGAGED_CITIZEN: Direct, dense, data-focused.
- ELECTION_OFFICIAL: Formal, cites legal sections (RPA 1951, MCC).

MODES:
- JOURNEY_SIMULATOR: 5 stages of voting.
- MYTH_BUSTER: FACT/MYTH/PARTIALLY TRUE checks.
- CIVIC_QUIZ: MCQs with difficulty levels.
- TIMELINE_BUILDER: Election milestones.
- ACTION_HUB: Links to ECI portals, booth finder.

STRICT NEUTRALITY RULES:
- NEVER characterize parties or leaders with opinions.
- NEVER express opinions on policies.
- Redirect party-specific questions to research tools.

RESPONSE FORMAT:
Return a JSON object with this exact structure (no markdown fences):
{
  "reply": "The conversational response in markdown",
  "detectedPersona": "one of the persona types",
  "currentMode": "one of the modes",
  "nextAction": "suggested CTA",
  "uiData": {}
}
`;

// ────────────────────────────────────────────────────────────
// Server Bootstrap
// ────────────────────────────────────────────────────────────

export async function createApp(): Promise<express.Express> {
  const app = express();

  // Trust Cloud Run / GCP load balancer proxy (fixes rate-limiter X-Forwarded-For warning)
  app.set("trust proxy", 1);

  // Gzip/Brotli Compression — reduces payload sizes by ~70%
  app.use(compression());
  
  // Security Hardening
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for development with Vite
  app.use(cors({ origin: process.env.APP_URL || "*" }));
  
  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  });
  
  app.use("/api/", apiLimiter);

  app.use(express.json({ limit: "1mb" }));

  // ── Health Check ────────────────────────────────────────
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      cacheKeys: cache["store"].size,
    });
  });

  // ── Chat Endpoint ───────────────────────────────────────
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { messages } = req.body as { messages?: ChatMessage[] };

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "Messages array is required and must not be empty." });
        return;
      }

      // Build Gemini-compatible history (must start with 'user' role)
      const history = messages.slice(0, -1).map((m: ChatMessage) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: sanitizeInput(String(m.content || "")) }],
      }));

      const firstUserIndex = history.findIndex((m) => m.role === "user");
      const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

      const chat = ai.chats.create({
        model: MODEL_ID,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} } as Record<string, unknown>],
        },
        history: validHistory,
      });

      const lastMsg = messages[messages.length - 1];
      const lastMessage = sanitizeInput(String(lastMsg?.content || ""));
      const response = await chat.sendMessage({ message: lastMessage });

      const fallback: ChatResponse = {
        reply: "I'm processing your request. Please try again in a moment.",
        detectedPersona: "UNKNOWN",
        currentMode: "GENERAL",
        nextAction: "Ask me about voter registration or election dates.",
        uiData: {},
      };

      const parsed = safeJsonParse<ChatResponse>(response.text || "{}", fallback);
      res.json(parsed);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Chat Error:", errMsg);
      res.status(500).json({ error: "Failed to generate response." });
    }
  });

  // ── Summarization Endpoint ──────────────────────────────
  app.post("/api/summarize", async (req: Request, res: Response) => {
    try {
      const { title, description, details } = req.body as {
        title?: string;
        description?: string;
        details?: string[];
      };

      if (!title || !description) {
        res.status(400).json({ error: "Title and description are required." });
        return;
      }

      const prompt = `
Summarize the following ECI guideline in exactly one concise, powerful sentence for an Indian citizen.
Focus on the practical implication for the voter or candidate.

Title: ${sanitizeInput(title)}
Context: ${sanitizeInput(description)}
Rules: ${Array.isArray(details) ? details.map(sanitizeInput).join(", ") : "N/A"}

Summary:`;

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
      });

      res.json({ summary: (response.text || "").trim() });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Summarize Error:", errMsg);
      res.status(500).json({ error: "Failed to summarize." });
    }
  });

  // ── Timeline Endpoint (Cached) ──────────────────────────
  app.get("/api/timeline", async (_req: Request, res: Response) => {
    // Check cache first
    const cached = cache.get<{ timeline: TimelineItem[] }>("timeline");
    if (cached) {
      res.set("X-Cache", "HIT");
      res.json(cached);
      return;
    }

    try {
      const prompt = `
Search for the current and upcoming major election milestones for the Indian Elections (e.g. Model Code of Conduct, Polling Phases, Counting Day).
Generate a strictly structured JSON array of 4 major election milestones based on the search results.
Each object must have 'title', 'date', and 'description' keys.
Only output the JSON array, no markdown blocks.`;

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: { tools: [{ googleSearch: {} } as Record<string, unknown>] },
      });

      const fallback: TimelineItem[] = [
        { title: "Election Announcement", date: "TBD", description: "Model Code of Conduct comes into effect." },
        { title: "Notification of Elections", date: "TBD", description: "Formal notification issued to constituencies." },
      ];

      const timeline = safeJsonParse<TimelineItem[]>(response.text || "[]", fallback);
      const result = { timeline };

      cache.set("timeline", result, CACHE_TTL.TIMELINE);
      res.set("X-Cache", "MISS");
      res.json(result);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Timeline Error:", errMsg);
      res.json({
        timeline: [
          { title: "Election Announcement", date: "TBD", description: "Model Code of Conduct comes into effect." },
          { title: "Notification of Elections", date: "TBD", description: "Formal notification issued to constituencies." },
        ],
      });
    }
  });

  // ── Candidates Endpoint (Cached) ────────────────────────
  app.get("/api/candidates", async (req: Request, res: Response) => {
    try {
      const constituency = sanitizeInput(String(req.query.constituency || "Bangalore South"));
      const cacheKey = `candidates:${constituency.toLowerCase()}`;

      const cached = cache.get<{ candidates: CandidateRecord[]; source: string }>(cacheKey);
      if (cached) {
        res.set("X-Cache", "HIT");
        res.json(cached);
        return;
      }

      // 1. Attempt official Government API first
      const govData = await fetchGovData("candidate-affidavits-resource-id", { constituency });

      if (govData?.records && govData.records.length > 0) {
        const candidates: CandidateRecord[] = govData.records.map((r: GovApiRecord) => ({
          id: r.candidate_id || crypto.randomUUID(),
          name: r.candidate_name || "Unknown",
          party: r.party_name || "Independent",
          education: r.education_qualifications || "N/A",
          assets: r.total_assets || "Unknown",
          criminalCases: r.criminal_cases || 0,
          profession: r.profession || "N/A",
          partyLogo: String(r.party_name || "IN").substring(0, 2).toUpperCase(),
          partyColor: "bg-slate-500",
        }));
        const result = { candidates, source: "data.gov.in" };
        cache.set(cacheKey, result, CACHE_TTL.CANDIDATES);
        res.set("X-Cache", "MISS");
        res.json(result);
        return;
      }

      // 2. Fallback to Gemini with Google Search Grounding
      const prompt = `
Search for the actual leading candidates contesting in the constituency of "${constituency}" in the most recent Indian election.
Create exactly 3 candidates based on the real data.
Return as a JSON array of objects with keys: 'id', 'name', 'party', 'education', 'assets', 'criminalCases', 'profession', 'partyLogo' (2 letters), 'partyColor' (tailwind bg class).
Only output the JSON array.`;

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: { tools: [{ googleSearch: {} } as Record<string, unknown>] },
      });

      const candidates = safeJsonParse<CandidateRecord[]>(response.text || "[]", []);
      const result = { candidates, source: "Google Search Grounding" };
      cache.set(cacheKey, result, CACHE_TTL.CANDIDATES);
      res.set("X-Cache", "MISS");
      res.json(result);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Candidates Error:", errMsg);
      res.status(500).json({ error: "Failed to fetch candidates." });
    }
  });

  // ── Live Election Results Endpoint (Cached) ─────────────
  app.get("/api/election-results", async (_req: Request, res: Response) => {
    const cached = cache.get<ElectionResults>("election-results");
    if (cached) {
      res.set("X-Cache", "HIT");
      res.json(cached);
      return;
    }

    try {
      const prompt = `
Search for the LATEST Indian General Election results or live counting trends from official sources like ECI.
Return a JSON object with:
- 'timestamp' (ISO string)
- 'source' (string)
- 'status' ("LIVE" or "FINAL")
- 'national' (object with 'totalConstituencies', 'declared', 'leading', 'parties' array)
- 'parties' items: 'name', 'acronym', 'won', 'leading', 'total', 'color' (tailwind class)
- 'turnout' (object with 'nationalAverage', 'highestState' {name, value}, 'lowestState' {name, value})
Only output the JSON object.`;

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: { tools: [{ googleSearch: {} } as Record<string, unknown>] },
      });

      const fallback: ElectionResults = {
        timestamp: new Date().toISOString(),
        source: "Fallback Data",
        status: "LIVE",
        national: {
          totalConstituencies: 543,
          declared: 0,
          leading: 0,
          parties: [
            { name: "Party A", acronym: "PA", won: 0, leading: 0, total: 0, color: "bg-emerald-500" },
            { name: "Party B", acronym: "PB", won: 0, leading: 0, total: 0, color: "bg-orange-600" },
          ],
        },
        turnout: {
          nationalAverage: "N/A",
          highestState: { name: "N/A", value: "N/A" },
          lowestState: { name: "N/A", value: "N/A" },
        },
      };

      const data = safeJsonParse<ElectionResults>(response.text || "{}", fallback);
      cache.set("election-results", data, CACHE_TTL.RESULTS);
      res.set("X-Cache", "MISS");
      res.json(data);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Live Results Error:", errMsg);
      res.json({
        timestamp: new Date().toISOString(),
        source: "Fallback Data",
        status: "OFFLINE",
        national: { totalConstituencies: 543, declared: 0, leading: 0, parties: [] },
        turnout: { nationalAverage: "N/A", highestState: { name: "N/A", value: "N/A" }, lowestState: { name: "N/A", value: "N/A" } },
      });
    }
  });

  // ── News Feed Endpoint (Cached) ─────────────────────────
  app.get("/api/news", async (_req: Request, res: Response) => {
    const cached = cache.get<{ news: string[] }>("news");
    if (cached) {
      res.set("X-Cache", "HIT");
      res.json(cached);
      return;
    }

    try {
      const prompt = `
Search for the latest breaking news headlines about the Election Commission of India (ECI) or Indian elections today.
Extract exactly 6 recent, factual news headlines.
Return as a JSON array of strings. Only output the JSON array.`;

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: { tools: [{ googleSearch: {} } as Record<string, unknown>] },
      });

      const fallback = [
        "ECI announces special summary revision of electoral rolls.",
        "Strict vigilance on social media to curb misinformation during MCC.",
        "Voter Turnout App updated with real-time trends.",
      ];

      const news = safeJsonParse<string[]>(response.text || "[]", fallback);
      const result = { news };
      cache.set("news", result, CACHE_TTL.NEWS);
      res.set("X-Cache", "MISS");
      res.json(result);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("News Error:", errMsg);
      res.json({
        news: [
          "ECI announces special summary revision of electoral rolls.",
          "Strict vigilance on social media to curb misinformation during MCC.",
          "Voter Turnout App updated with real-time trends.",
        ],
      });
    }
  });

  // ── Vite Middleware (Development) / Static (Production) ─
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        // Cache-busted assets get long cache, HTML always revalidated
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

// ── Start Listening ─────────────────────────────────────
async function startServer(): Promise<void> {
  const app = await createApp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ CivicSence server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer().catch((err) => {
    console.error("Fatal: Server failed to start.", err);
    process.exit(1);
  });
}
