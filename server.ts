import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Initialization
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing from environment variables.");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey || "");

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      
      const systemInstruction = `
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

STRICT NEUTRALITY:
- NEVER characterize parties/leaders.
- NEVER express opinions on policies.
- Redirect party-specific questions to research tools.

RESPONSE FORMAT:
- Short persona responses: 2-3 sentences max before a follow-up.
- Use numbered stages and bold key terms.
- Return a JSON object with:
  {
    "reply": "The conversational response in markdown",
    "detectedPersona": "one of the persona types",
    "currentMode": "one of the modes",
    "nextAction": "suggested CTA",
    "uiData": { ... any data for rich components ... }
  }
`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} } as any]
      });

      // Gemini history must start with a 'user' message.
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const firstUserIndex = history.findIndex((m: any) => m.role === 'user');
      const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

      const chat = model.startChat({
        history: validHistory,
        generationConfig: {
            responseMimeType: "application/json",
        }
      });

      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Summarization API
  app.post("/api/summarize", async (req, res) => {
    try {
      const { title, description, details } = req.body;
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Summarize the following ECI guideline in exactly one concise, powerful sentence for an Indian citizen. 
        Focus on the practical implication for the voter or candidate.
        
        Title: ${title}
        Context: ${description}
        Rules: ${details.join(", ")}
        
        Summary:
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ summary: response.text().trim() });
    } catch (error) {
      console.error("Summarize Error:", error);
      res.status(500).json({ error: "Failed to summarize" });
    }
  });

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Timeline API
  app.get("/api/timeline", async (req, res) => {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        tools: [{ googleSearch: {} } as any]
      });
      const prompt = `
        Search for the current and upcoming major election milestones for the Indian Elections (e.g. Model Code of Conduct, Polling Phases, Counting Day).
        Generate a strictly structured JSON array of 4 major election milestones based on the search results.
        Format requirements: A JSON array of objects, each with 'title', 'date', and 'description' keys.
        Only output the JSON array, no markdown blocks.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if(text.startsWith('```json')) {
        text = text.substring(7);
      }
      if(text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      const timeline = JSON.parse(text);
      res.json({ timeline });
    } catch (error) {
      console.error("Timeline Error:", error);
      res.json({
        timeline: [
          { title: "Election Announcement", date: "TBD", description: "The Model Code of Conduct (MCC) comes into force immediately upon announcement." },
          { title: "Notification of Elections", date: "TBD", description: "Formal notification is issued, calling upon constituencies to elect their representatives." }
        ]
      });
    }
  });

  // Gov API wrapper for data.gov.in
  const fetchGovData = async (resourceId: string, filters: Record<string, string> = {}) => {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (!apiKey) return null;
    
    try {
      const url = new URL(`https://api.data.gov.in/resource/${resourceId}`);
      url.searchParams.append("api-key", apiKey);
      url.searchParams.append("format", "json");
      url.searchParams.append("limit", "10");
      Object.entries(filters).forEach(([k, v]) => url.searchParams.append(`filters[${k}]`, v));
      
      const response = await fetch(url.toString());
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error("Gov API fetch failed", err);
      return null;
    }
  };

  // Candidates API
  app.get("/api/candidates", async (req, res) => {
    try {
      const constituency = req.query.constituency || "Bangalore South";
      
      // 1. Attempt to fetch from Official Indian Government API
      // Note: resource ID would be the actual dataset ID for candidate affidavits on data.gov.in
      const govData = await fetchGovData("candidate-affidavits-resource-id", { constituency: constituency as string });
      
      if (govData && govData.records && govData.records.length > 0) {
        const candidates = govData.records.map((r: any) => ({
          id: r.candidate_id || Math.random().toString(),
          name: r.candidate_name,
          party: r.party_name,
          education: r.education_qualifications || "N/A",
          assets: r.total_assets || "Unknown",
          criminalCases: r.criminal_cases || 0,
          profession: r.profession || "N/A",
          partyLogo: r.party_name.substring(0, 2).toUpperCase(),
          partyColor: "bg-slate-500"
        }));
        return res.json({ candidates, source: "data.gov.in" });
      }

      // 2. Fallback to Gemini with Google Search Grounding for real-time data
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        tools: [{ googleSearch: {} } as any]
      });
      const prompt = `
        Search for the actual leading candidates contesting in the constituency of "${constituency}" in the most recent Indian election. 
        Create exactly 3 candidates based on the real data.
        Return as a strictly structured JSON array of objects.
        Object keys must be: 'id' (string), 'name' (string), 'party' (string), 'education' (string), 'assets' (string like "₹X Crores"), 'criminalCases' (number), 'profession' (string), 'partyLogo' (2 letters), 'partyColor' (a valid tailwind bg color class like 'bg-red-500', 'bg-blue-600', 'bg-orange-500').
        Only output the JSON array, no markdown blocks, no prefix/suffix.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if(text.startsWith('```json')) {
        text = text.substring(7);
      }
      if(text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      const candidates = JSON.parse(text);
      res.json({ candidates, source: "Google Search Grounding" });
    } catch (error) {
      console.error("Candidates Error:", error);
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  // Real-Time Election Results API (Gov / Grounded)
  app.get("/api/election-results", async (req, res) => {
    try {
      // 1. Attempt to hit an official ECI results JSON or Data.gov.in API
      const eciApiUrl = "https://results.eci.gov.in/api/v1/results"; // Example Endpoint
      // For production, we would use fetch() here and handle parsing.
      // Since ECI API changes, we use Gemini Search Grounding to aggregate real-time live counting data from News/ECI sources.
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        tools: [{ googleSearch: {} } as any]
      });
      
      const prompt = `
        Search for the LATEST, real-time Indian General Election results or live counting trends today from official sources like ECI.
        Return a strictly structured JSON object.
        Object keys must be:
        - 'timestamp' (ISO string of current time)
        - 'source' (string, e.g., "Google Search (Live News/ECI)")
        - 'status' (string, "LIVE" or "FINAL")
        - 'national' (object with 'totalConstituencies', 'declared', 'leading', 'parties' array)
        - 'parties' array objects must have 'name', 'acronym', 'won', 'leading', 'total', 'color' (tailwind class e.g. 'bg-orange-500')
        - 'turnout' (object with 'nationalAverage', 'highestState' (name, value), 'lowestState' (name, value))
        Only output the JSON object, no markdown blocks, no prefix/suffix.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if(text.startsWith('```json')) text = text.substring(7);
      if(text.endsWith('```')) text = text.substring(0, text.length - 3);
      
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("Live Election Results Error:", error);
      // 2. Fallback to cached/simulated data if search grounding fails
      res.json({
        timestamp: new Date().toISOString(),
        source: "data.gov.in (Simulated Fallback)",
        status: "LIVE",
        national: {
          totalConstituencies: 543,
          declared: 154,
          leading: 389,
          parties: [
            { name: "Lok Seva Dal", acronym: "LSD", won: 75, leading: 140, total: 215, color: "bg-emerald-500" },
            { name: "Bharat Vikas", acronym: "BV", won: 60, leading: 120, total: 180, color: "bg-orange-600" },
            { name: "United Front", acronym: "UF", won: 15, leading: 80, total: 95, color: "bg-blue-600" },
            { name: "Others", acronym: "OTH", won: 4, leading: 49, total: 53, color: "bg-slate-500" }
          ]
        },
        turnout: {
          nationalAverage: "67.4%",
          highestState: { name: "Kerala", value: "74.2%" },
          lowestState: { name: "Bihar", value: "58.1%" }
        }
      });
    }
  });

  // News Feed API
  app.get("/api/news", async (req, res) => {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        tools: [{ googleSearch: {} } as any]
      });
      const prompt = `
        Search for the latest breaking news headlines about the Election Commission of India (ECI) or Indian elections today.
        Based on the real-time search results, extract exactly 6 recent, factual news headlines.
        It should sound like breaking news ticker items.
        Return as a strictly structured JSON array of strings.
        Only output the JSON array, no markdown blocks, no prefix/suffix.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if(text.startsWith('```json')) {
        text = text.substring(7);
      }
      if(text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      const news = JSON.parse(text);
      res.json({ news });
    } catch (error) {
      console.error("News Error:", error);
      res.json({ news: [
        "ECI announces special summary revision of electoral rolls.",
        "Strict vigilance on social media to curb misinformation during MCC.",
        "Voter Turnout App updated with real-time trends."
      ]});
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
