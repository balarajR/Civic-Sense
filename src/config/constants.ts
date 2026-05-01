/**
 * @file   constants.ts
 * @module Constants
 * @description Centralized constants for the CivicSense application.
 *              Every magic number, string, and configuration value lives here
 *              so that no inline literals appear in business logic.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 *
 * @dependencies none
 * @exports      All application constants
 */

// ── Server Configuration ───────────────────────────────────
/** Default server port when PORT env var is not set. */
export const DEFAULT_PORT = 3000;

/** Gemini model identifier used for all AI requests. */
export const MODEL_ID = 'gemini-2.5-flash';

/** Base URL for the Indian Government Open Data API. */
export const DATA_GOV_BASE_URL = 'https://api.data.gov.in/resource';

/** Default GCP region for Vertex AI. */
export const DEFAULT_GCP_REGION = 'us-central1';

/** Vertex AI API version. */
export const VERTEX_AI_API_VERSION = 'v1';

// ── Cache TTL (milliseconds) ───────────────────────────────
/** Cache time-to-live values for each endpoint category. */
export const CACHE_TTL = {
  NEWS: 5 * 60 * 1000,         // 5 minutes
  TIMELINE: 10 * 60 * 1000,   // 10 minutes
  RESULTS: 2 * 60 * 1000,     // 2 minutes (semi-real-time)
  CANDIDATES: 15 * 60 * 1000, // 15 minutes
} as const;

// ── Rate Limiting ──────────────────────────────────────────
/** Rate limiter window duration in milliseconds (15 minutes). */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/** Maximum requests per IP per rate-limit window. */
export const RATE_LIMIT_MAX_REQUESTS = 100;

// ── Input Sanitization ─────────────────────────────────────
/** Maximum character length for sanitized user input. */
export const MAX_INPUT_LENGTH = 2000;

/** Maximum request body size for Express JSON parser. */
export const MAX_REQUEST_BODY_SIZE = '1mb';

// ── Government API ─────────────────────────────────────────
/** Default result limit for data.gov.in queries. */
export const GOV_API_RESULT_LIMIT = '10';

/** Default response format for data.gov.in API. */
export const GOV_API_FORMAT = 'json';

// ── Election Data ──────────────────────────────────────────
/** Total number of Lok Sabha constituencies in India. */
export const TOTAL_LOK_SABHA_CONSTITUENCIES = 543;

/** Default constituency when none is specified. */
export const DEFAULT_CONSTITUENCY = 'Bangalore South';

/** Number of candidate results to generate via AI. */
export const AI_CANDIDATE_COUNT = 3;

/** Number of news headlines to extract via AI. */
export const AI_NEWS_HEADLINE_COUNT = 6;

/** Number of timeline milestones to generate. */
export const AI_TIMELINE_MILESTONE_COUNT = 4;

// ── Quiz Data ──────────────────────────────────────────────
/** Difficulty levels available for the CivicQuiz feature. */
export const QUIZ_DIFFICULTY_LEVELS = Object.freeze(['easy', 'medium', 'hard']);

// ── UI Constants ───────────────────────────────────────────
/** Fallback news headlines when the API is unavailable. */
export const FALLBACK_NEWS_HEADLINES = Object.freeze([
  'ECI launches nationwide voter awareness campaign for 2026',
  'Digital voter ID cards now accepted at polling booths across India',
  'Record 67.4% voter turnout in recent Karnataka local body elections',
]);

/** Official ECI portal links used across the application. */
export const OFFICIAL_ECI_LINKS = Object.freeze([
  '- Voter registration/status: https://voters.eci.gov.in',
  '- Electoral roll search: https://electoralsearch.eci.gov.in',
  '- Voter Helpline App: https://eci.gov.in/voter/voter-helpline-app',
  '- Results portal: https://results.eci.gov.in',
]);

/** Default fallback summary when the AI summarizer fails. */
export const FALLBACK_SUMMARY =
  'Follow this ECI guideline using official records first, and verify the latest rule on eci.gov.in before acting.';
