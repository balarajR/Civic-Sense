/**
 * @file   server.ts
 * @module Server
 * @description Express server for the CivicSense AI election assistant.
 *              Provides REST API endpoints for chat (Vertex AI Gemini), candidate data
 *              (data.gov.in + AI fallback), election timeline, live results,
 *              ECI guideline summarization, and news headlines. All responses
 *              are cached with configurable TTLs for performance.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies express, compression, helmet, cors, express-rate-limit, @google/genai, dotenv
 * @exports      createApp (for testing)
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import net from 'node:net';
import { GoogleGenAI } from '@google/genai';
import { buildLocalElectionAnswer, sanitizeInput, safeJsonParse } from './src/server/utils';
import { logger } from './src/utils/logger';
import { validateChatMessages, validateSummarizeInput, validateConstituency } from './src/utils/validators';
import { ValidationError } from './src/utils/errors';
import {
  DEFAULT_PORT,
  MODEL_ID,
  DATA_GOV_BASE_URL,
  DEFAULT_GCP_REGION,
  VERTEX_AI_API_VERSION,
  CACHE_TTL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  MAX_REQUEST_BODY_SIZE,
  GOV_API_RESULT_LIMIT,
  GOV_API_FORMAT,
  TOTAL_LOK_SABHA_CONSTITUENCIES,
  DEFAULT_CONSTITUENCY,
  AI_CANDIDATE_COUNT,
  AI_NEWS_HEADLINE_COUNT,
  AI_TIMELINE_MILESTONE_COUNT,
  FALLBACK_SUMMARY,
} from './src/config/constants';

// ────────────────────────────────────────────────────────────
// Types — Strictly typed API response shapes
// ────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
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

/**
 * Simple TTL-based in-memory cache for API responses.
 * Automatically evicts expired entries on read.
 */
class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Retrieves a cached value if it exists and has not expired.
   *
   * @param {string} key - Cache key to look up.
   * @returns {T | null} Cached data, or null if missing/expired.
   *
   * @example
   *   const data = cache.get<{ news: string[] }>('news');
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Stores a value in the cache with a specified TTL.
   *
   * @param {string} key   - Cache key.
   * @param {T}      data  - Data to cache.
   * @param {number} ttlMs - Time-to-live in milliseconds.
   * @returns {void}
   *
   * @example
   *   cache.set('timeline', { timeline: [] }, CACHE_TTL.TIMELINE);
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }
}

const cache = new ResponseCache();

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

const DEFAULT_HMR_PORT = 24678;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(preferredPort: number): Promise<number> {
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error) => reject(error));
    server.once('listening', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to resolve an available port.')));
        return;
      }

      const { port } = address;
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        resolve(port);
      });
    });

    server.listen(0, '0.0.0.0');
  });
}

// ────────────────────────────────────────────────────────────
// Vertex AI / Gemini Enterprise initialization.
// ────────────────────────────────────────────────────────────

let aiClient: GoogleGenAI | null = null;

/**
 * Returns the singleton Gemini AI client, initializing it on first call.
 * Uses Vertex AI Enterprise mode with Application Default Credentials.
 *
 * @returns {GoogleGenAI} Configured Gemini AI client.
 * @throws {Error} If GOOGLE_CLOUD_PROJECT is not set in environment.
 *
 * @example
 *   const ai = getAiClient();
 *   const response = await ai.models.generateContent({ model: MODEL_ID, contents: '...' });
 */
function getAiClient(): GoogleGenAI {
  if (aiClient) return aiClient;

  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GCP_REGION || DEFAULT_GCP_REGION;

  if (!project) {
    throw new Error('Vertex AI project is not configured. Set GOOGLE_CLOUD_PROJECT.');
  }

  aiClient = new GoogleGenAI({
    enterprise: true,
    project,
    location,
    apiVersion: VERTEX_AI_API_VERSION,
  });

  logger.info('Gemini AI client initialized', { project, location });
  return aiClient;
}

// ────────────────────────────────────────────────────────────
// Utility: Fetch from data.gov.in Open Government Data API
// ────────────────────────────────────────────────────────────

/**
 * Fetches data from the Indian Government Open Data Platform (data.gov.in).
 * Returns null gracefully on any failure — never throws.
 *
 * @param {string} resourceId               - data.gov.in resource identifier.
 * @param {Record<string, string>} filters  - Key-value filters for the query.
 * @returns {Promise<GovApiResponse | null>} Parsed API response or null on failure.
 *
 * @example
 *   const data = await fetchGovData('candidate-affidavits', { constituency: 'Bangalore South' });
 */
async function fetchGovData(
  resourceId: string,
  filters: Record<string, string> = {}
): Promise<GovApiResponse | null> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL(`${DATA_GOV_BASE_URL}/${resourceId}`);
    url.searchParams.append('api-key', apiKey);
    url.searchParams.append('format', GOV_API_FORMAT);
    url.searchParams.append('limit', GOV_API_RESULT_LIMIT);
    Object.entries(filters).forEach(([key, value]) =>
      url.searchParams.append(`filters[${key}]`, value)
    );

    const response = await fetch(url.toString());
    if (!response.ok) return null;
    return (await response.json()) as GovApiResponse;
  } catch (err) {
    logger.error('Gov API fetch failed', {
      resourceId,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// System Instruction for the AI Assistant
// ────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `
You are CivicSense — an intelligent, politically neutral election education assistant built for India, with state-level awareness for Karnataka.
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
// Fallback Data — used when AI or external APIs are unavailable
// ────────────────────────────────────────────────────────────

/** Fallback timeline entries when Gemini is unavailable. */
const FALLBACK_TIMELINE: TimelineItem[] = [
  { title: 'Election Announcement', date: 'TBD', description: 'Model Code of Conduct comes into effect.' },
  { title: 'Notification of Elections', date: 'TBD', description: 'Formal notification issued to constituencies.' },
];

/** Fallback news headlines when Gemini is unavailable. */
const FALLBACK_NEWS = [
  'ECI announces special summary revision of electoral rolls.',
  'Strict vigilance on social media to curb misinformation during MCC.',
  'Voter Turnout App updated with real-time trends.',
];

/**
 * Builds a fallback ElectionResults object when the AI endpoint fails.
 *
 * @returns {ElectionResults} Skeleton election results with zero counts.
 */
function buildFallbackResults(): ElectionResults {
  return {
    timestamp: new Date().toISOString(),
    source: 'Fallback Data',
    status: 'OFFLINE',
    national: {
      totalConstituencies: TOTAL_LOK_SABHA_CONSTITUENCIES,
      declared: 0,
      leading: 0,
      parties: [],
    },
    turnout: {
      nationalAverage: 'N/A',
      highestState: { name: 'N/A', value: 'N/A' },
      lowestState: { name: 'N/A', value: 'N/A' },
    },
  };
}

// ────────────────────────────────────────────────────────────
// Server Bootstrap
// ────────────────────────────────────────────────────────────

/**
 * Creates and configures the Express application with all middleware
 * and API routes. Exported for integration testing.
 *
 * @returns {Promise<express.Express>} Configured Express app instance.
 *
 * @example
 *   const app = await createApp();
 *   const res = await request(app).get('/api/health');
 */
export async function createApp(): Promise<express.Express> {
  const app = express();
  const requestedHmrPort = Number(process.env.HMR_PORT) || DEFAULT_HMR_PORT;
  const hmrPort = await findAvailablePort(requestedHmrPort);
  const isProduction = process.env.NODE_ENV === 'production';

  // Trust Cloud Run / GCP load balancer proxy (fixes rate-limiter X-Forwarded-For warning)
  app.set('trust proxy', 1);

  // Gzip/Brotli Compression — reduces payload sizes by ~70%
  app.use(compression());

  // Security Hardening — CSP with allowlists for Google Maps, Firebase, Gemini
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  isProduction ? ["'self'", 'https://maps.googleapis.com'] : ["'self'", "'unsafe-inline'", 'https://maps.googleapis.com'],
        styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc:     ["'self'", 'data:', 'https://maps.gstatic.com', 'https://maps.googleapis.com'],
        connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseio.com', 'https://firestore.googleapis.com', 'ws:', 'wss:'],
        fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
        frameSrc:   ["'self'", 'https://www.google.com'],
        objectSrc:  ["'none'"],
      },
    },
    hsts:           { maxAge: 31_536_000, includeSubDomains: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // CORS — restrict to known origins (never wildcard in production)
  const ALLOWED_ORIGINS = [
    process.env.APP_URL,
    'https://civicsense.app',
    'https://www.civicsense.app',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:5173'] : []),
  ].filter(Boolean) as string[];

  app.use(cors({
    origin: (origin, callback) => {
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
      if (!origin || ALLOWED_ORIGINS.includes(origin) || (process.env.NODE_ENV !== 'production' && isLocalhost)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials:    true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge:         86400,
  }));

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  app.use('/api/', apiLimiter);

  app.use(express.json({ limit: MAX_REQUEST_BODY_SIZE }));

  // ── Health Check ────────────────────────────────────────
  /**
   * GET /api/health — Returns server health status and cache statistics.
   */
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      cacheKeys: cache['store'].size,
    });
  });

  // ── Chat Endpoint ───────────────────────────────────────
  /**
   * POST /api/chat — Processes a multi-turn conversation via Gemini AI.
   * Falls back to rule-based local answers when Gemini is unavailable.
   */
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const messages = validateChatMessages((req.body as Record<string, unknown>).messages) as ChatMessage[];

      // Build Gemini-compatible history (must start with 'user' role)
      const history = messages.slice(0, -1).map((m: ChatMessage) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: sanitizeInput(String(m.content || '')) }],
      }));

      const firstUserIndex = history.findIndex((m) => m.role === 'user');
      const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

      const chat = getAiClient().chats.create({
        model: MODEL_ID,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} } as Record<string, unknown>],
        },
        history: validHistory,
      });

      const lastMsg = messages[messages.length - 1];
      const lastMessage = sanitizeInput(String(lastMsg?.content || ''));
      const response = await chat.sendMessage({ message: lastMessage });

      const fallback: ChatResponse = buildLocalElectionAnswer(lastMessage);
      const parsed = safeJsonParse<ChatResponse>(response.text || '{}', fallback);
      res.json(parsed);
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message, code: error.code });
        return;
      }
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Chat endpoint failed', { endpoint: '/api/chat', error: errMsg });
      const lastMsg = (req.body as { messages?: ChatMessage[] }).messages?.at(-1);
      res.status(200).json(buildLocalElectionAnswer(sanitizeInput(String(lastMsg?.content || ''))));
    }
  });

  // ── Summarization Endpoint ──────────────────────────────
  /**
   * POST /api/summarize — Summarizes an ECI guideline into one sentence using Gemini.
   */
  app.post('/api/summarize', async (req: Request, res: Response) => {
    try {
      const { title, description, details } = validateSummarizeInput(req.body);

      const prompt = `
Summarize the following ECI guideline in exactly one concise, powerful sentence for an Indian citizen.
Focus on the practical implication for the voter or candidate.

Title: ${sanitizeInput(title)}
Context: ${sanitizeInput(description)}
Rules: ${Array.isArray(details) ? details.map(sanitizeInput).join(', ') : 'N/A'}

Summary:`;

      const response = await getAiClient().models.generateContent({
        model: MODEL_ID,
        contents: prompt,
      });

      res.json({ summary: (response.text || '').trim() });
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message, code: error.code });
        return;
      }
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Summarize endpoint failed', { endpoint: '/api/summarize', error: errMsg });
      res.json({ summary: FALLBACK_SUMMARY });
    }
  });

  // ── Timeline Endpoint (Cached) ──────────────────────────
  /**
   * GET /api/timeline — Returns major election milestones via Gemini + Google Search.
   */
  app.get('/api/timeline', async (_req: Request, res: Response) => {
    const cached = cache.get<{ timeline: TimelineItem[] }>('timeline');
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    try {
      const prompt = `
Search for the current and upcoming major election milestones for the Indian Elections (e.g. Model Code of Conduct, Polling Phases, Counting Day).
Generate a strictly structured JSON array of ${AI_TIMELINE_MILESTONE_COUNT} major election milestones based on the search results.
Each object must have 'title', 'date', and 'description' keys.
Only output the JSON array, no markdown blocks.`;

      const response = await getAiClient().models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: { tools: [{ googleSearch: {} } as Record<string, unknown>] },
      });

      const timeline = safeJsonParse<TimelineItem[]>(response.text || '[]', FALLBACK_TIMELINE);
      const result = { timeline };

      cache.set('timeline', result, CACHE_TTL.TIMELINE);
      res.set('X-Cache', 'MISS');
      res.json(result);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Timeline endpoint failed', { endpoint: '/api/timeline', error: errMsg });
      res.json({ timeline: FALLBACK_TIMELINE });
    }
  });

  // ── Candidates Endpoint (Cached) ────────────────────────
  /**
   * GET /api/candidates — Returns candidate data for a constituency.
   * Attempts data.gov.in first, falls back to Gemini + Google Search.
   */
  app.get('/api/candidates', async (req: Request, res: Response) => {
    try {
      const constituency = validateConstituency(req.query.constituency, DEFAULT_CONSTITUENCY);
      const sanitizedConstituency = sanitizeInput(constituency);
      const cacheKey = `candidates:${sanitizedConstituency.toLowerCase()}`;

      const cached = cache.get<{ candidates: CandidateRecord[]; source: string }>(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        res.json(cached);
        return;
      }

      // 1. Attempt official Government API first
      const govData = await fetchGovData('candidate-affidavits-resource-id', { constituency: sanitizedConstituency });

      if (govData?.records && govData.records.length > 0) {
        const candidates: CandidateRecord[] = govData.records.map((r: GovApiRecord) => ({
          id: r.candidate_id || crypto.randomUUID(),
          name: r.candidate_name || 'Unknown',
          party: r.party_name || 'Independent',
          education: r.education_qualifications || 'N/A',
          assets: r.total_assets || 'Unknown',
          criminalCases: r.criminal_cases || 0,
          profession: r.profession || 'N/A',
          partyLogo: String(r.party_name || 'IN').substring(0, 2).toUpperCase(),
          partyColor: 'bg-slate-500',
        }));
        const result = { candidates, source: 'data.gov.in' };
        cache.set(cacheKey, result, CACHE_TTL.CANDIDATES);
        res.set('X-Cache', 'MISS');
        res.json(result);
        return;
      }

      // 2. Fallback to Gemini with Google Search Grounding
      const prompt = `
Search for the actual leading candidates contesting in the constituency of "${sanitizedConstituency}" in the most recent Indian election.
Create exactly ${AI_CANDIDATE_COUNT} candidates based on the real data.
Return as a JSON array of objects with keys: 'id', 'name', 'party', 'education', 'assets', 'criminalCases', 'profession', 'partyLogo' (2 letters), 'partyColor' (tailwind bg class).
Only output the JSON array.`;

      const response = await getAiClient().models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: { tools: [{ googleSearch: {} } as Record<string, unknown>] },
      });

      const candidates = safeJsonParse<CandidateRecord[]>(response.text || '[]', []);
      const result = { candidates, source: 'Google Search Grounding' };
      cache.set(cacheKey, result, CACHE_TTL.CANDIDATES);
      res.set('X-Cache', 'MISS');
      res.json(result);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Candidates endpoint failed', { endpoint: '/api/candidates', error: errMsg });
      res.json({
        candidates: [],
        source: 'Unavailable - verify candidate affidavits on the official ECI portal.',
      });
    }
  });

  // ── Live Election Results Endpoint (Cached) ─────────────
  /**
   * GET /api/election-results — Returns live or recent election results via Gemini.
   */
  app.get('/api/election-results', async (_req: Request, res: Response) => {
    const cached = cache.get<ElectionResults>('election-results');
    if (cached) {
      res.set('X-Cache', 'HIT');
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

      const response = await getAiClient().models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: { tools: [{ googleSearch: {} } as Record<string, unknown>] },
      });

      const fallback: ElectionResults = {
        timestamp: new Date().toISOString(),
        source: 'Fallback Data',
        status: 'LIVE',
        national: {
          totalConstituencies: TOTAL_LOK_SABHA_CONSTITUENCIES,
          declared: 0,
          leading: 0,
          parties: [
            { name: 'Party A', acronym: 'PA', won: 0, leading: 0, total: 0, color: 'bg-emerald-500' },
            { name: 'Party B', acronym: 'PB', won: 0, leading: 0, total: 0, color: 'bg-orange-600' },
          ],
        },
        turnout: {
          nationalAverage: 'N/A',
          highestState: { name: 'N/A', value: 'N/A' },
          lowestState: { name: 'N/A', value: 'N/A' },
        },
      };

      const data = safeJsonParse<ElectionResults>(response.text || '{}', fallback);
      cache.set('election-results', data, CACHE_TTL.RESULTS);
      res.set('X-Cache', 'MISS');
      res.json(data);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Election results endpoint failed', { endpoint: '/api/election-results', error: errMsg });
      res.json(buildFallbackResults());
    }
  });

  // ── News Feed Endpoint (Cached) ─────────────────────────
  /**
   * GET /api/news — Returns recent election news headlines via Gemini + Google Search.
   */
  app.get('/api/news', async (_req: Request, res: Response) => {
    const cached = cache.get<{ news: string[] }>('news');
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    try {
      const prompt = `
Search for the latest breaking news headlines about the Election Commission of India (ECI) or Indian elections today.
Extract exactly ${AI_NEWS_HEADLINE_COUNT} recent, factual news headlines.
Return as a JSON array of strings. Only output the JSON array.`;

      const response = await getAiClient().models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: { tools: [{ googleSearch: {} } as Record<string, unknown>] },
      });

      const news = safeJsonParse<string[]>(response.text || '[]', FALLBACK_NEWS);
      const result = { news };
      cache.set('news', result, CACHE_TTL.NEWS);
      res.set('X-Cache', 'MISS');
      res.json(result);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('News endpoint failed', { endpoint: '/api/news', error: errMsg });
      res.json({ news: FALLBACK_NEWS });
    }
  });

  // ── Vite Middleware (Development) / Static (Production) ─
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: hmrPort },
      },
      appType: 'spa',
    });

    if (hmrPort !== requestedHmrPort) {
      logger.warn('Preferred Vite HMR port unavailable, using a fallback port', {
        requestedPort: requestedHmrPort,
        selectedPort: hmrPort,
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        // Cache-busted assets get long cache, HTML always revalidated
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// ── Start Listening ─────────────────────────────────────

/**
 * Bootstraps the server: creates the Express app and starts listening.
 *
 * @returns {Promise<void>}
 * @throws {Error} If server creation or binding fails.
 */
async function startServer(): Promise<void> {
  const requestedPort = Number(process.env.PORT) || DEFAULT_PORT;
  const port = await findAvailablePort(requestedPort);
  const app = await createApp();
  app.listen(port, '0.0.0.0', () => {
    if (port !== requestedPort) {
      logger.warn('Preferred app port unavailable, using a fallback port', {
        requestedPort,
        selectedPort: port,
      });
    }

    logger.info('CivicSense server started', { port, url: `http://localhost:${port}` });
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error('Fatal: Server failed to start', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
}
