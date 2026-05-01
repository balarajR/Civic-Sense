/**
 * @file   constants.test.ts
 * @module ConstantsTest
 * @description Unit tests for centralized application constants.
 *              Verifies that all exported constants have correct types,
 *              values, and immutability where expected.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PORT,
  MODEL_ID,
  DATA_GOV_BASE_URL,
  DEFAULT_GCP_REGION,
  VERTEX_AI_API_VERSION,
  CACHE_TTL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  MAX_INPUT_LENGTH,
  MAX_REQUEST_BODY_SIZE,
  GOV_API_RESULT_LIMIT,
  GOV_API_FORMAT,
  TOTAL_LOK_SABHA_CONSTITUENCIES,
  DEFAULT_CONSTITUENCY,
  AI_CANDIDATE_COUNT,
  AI_NEWS_HEADLINE_COUNT,
  AI_TIMELINE_MILESTONE_COUNT,
  QUIZ_DIFFICULTY_LEVELS,
  FALLBACK_NEWS_HEADLINES,
  OFFICIAL_ECI_LINKS,
  FALLBACK_SUMMARY,
} from '../config/constants';

describe('Server configuration constants', () => {
  it('exports a valid default port number', () => {
    expect(DEFAULT_PORT).toBe(3000);
    expect(typeof DEFAULT_PORT).toBe('number');
  });

  it('exports a non-empty Gemini model ID', () => {
    expect(MODEL_ID).toBeTruthy();
    expect(typeof MODEL_ID).toBe('string');
    expect(MODEL_ID.length).toBeGreaterThan(0);
  });

  it('exports a valid data.gov.in base URL', () => {
    expect(DATA_GOV_BASE_URL).toMatch(/^https:\/\/api\.data\.gov\.in/);
  });
});

describe('Cache TTL constants', () => {
  it('has TTLs for all endpoint categories', () => {
    expect(CACHE_TTL).toHaveProperty('NEWS');
    expect(CACHE_TTL).toHaveProperty('TIMELINE');
    expect(CACHE_TTL).toHaveProperty('RESULTS');
    expect(CACHE_TTL).toHaveProperty('CANDIDATES');
  });

  it('all TTLs are positive numbers in milliseconds', () => {
    Object.values(CACHE_TTL).forEach((ttl) => {
      expect(typeof ttl).toBe('number');
      expect(ttl).toBeGreaterThan(0);
    });
  });

  it('RESULTS TTL is shorter than CANDIDATES TTL (semi-real-time)', () => {
    expect(CACHE_TTL.RESULTS).toBeLessThan(CACHE_TTL.CANDIDATES);
  });
});

describe('Rate limiting constants', () => {
  it('has a positive window duration', () => {
    expect(RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
  });

  it('has a reasonable max request count', () => {
    expect(RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
    expect(RATE_LIMIT_MAX_REQUESTS).toBeLessThanOrEqual(1000);
  });

  it('window is 15 minutes in milliseconds', () => {
    expect(RATE_LIMIT_WINDOW_MS).toBe(15 * 60 * 1000);
  });
});

describe('Input sanitization constants', () => {
  it('MAX_INPUT_LENGTH is a positive number', () => {
    expect(MAX_INPUT_LENGTH).toBeGreaterThan(0);
    expect(typeof MAX_INPUT_LENGTH).toBe('number');
  });

  it('MAX_REQUEST_BODY_SIZE is a non-empty string', () => {
    expect(MAX_REQUEST_BODY_SIZE).toBeTruthy();
    expect(typeof MAX_REQUEST_BODY_SIZE).toBe('string');
  });
});

describe('Election data constants', () => {
  it('TOTAL_LOK_SABHA_CONSTITUENCIES is 543', () => {
    expect(TOTAL_LOK_SABHA_CONSTITUENCIES).toBe(543);
  });

  it('DEFAULT_CONSTITUENCY is a non-empty string', () => {
    expect(DEFAULT_CONSTITUENCY).toBeTruthy();
    expect(typeof DEFAULT_CONSTITUENCY).toBe('string');
  });

  it('AI count constants are positive integers', () => {
    expect(AI_CANDIDATE_COUNT).toBeGreaterThan(0);
    expect(AI_NEWS_HEADLINE_COUNT).toBeGreaterThan(0);
    expect(AI_TIMELINE_MILESTONE_COUNT).toBeGreaterThan(0);
  });
});

describe('UI constants', () => {
  it('QUIZ_DIFFICULTY_LEVELS contains expected levels', () => {
    expect(QUIZ_DIFFICULTY_LEVELS).toContain('easy');
    expect(QUIZ_DIFFICULTY_LEVELS).toContain('medium');
    expect(QUIZ_DIFFICULTY_LEVELS).toContain('hard');
  });

  it('QUIZ_DIFFICULTY_LEVELS is frozen (immutable)', () => {
    expect(Object.isFrozen(QUIZ_DIFFICULTY_LEVELS)).toBe(true);
  });

  it('FALLBACK_NEWS_HEADLINES is a non-empty frozen array', () => {
    expect(Array.isArray(FALLBACK_NEWS_HEADLINES)).toBe(true);
    expect(FALLBACK_NEWS_HEADLINES.length).toBeGreaterThan(0);
    expect(Object.isFrozen(FALLBACK_NEWS_HEADLINES)).toBe(true);
  });

  it('OFFICIAL_ECI_LINKS contains valid ECI URLs', () => {
    expect(OFFICIAL_ECI_LINKS.length).toBeGreaterThan(0);
    OFFICIAL_ECI_LINKS.forEach((link) => {
      expect(link).toMatch(/eci\.gov\.in/);
    });
  });

  it('FALLBACK_SUMMARY is a non-empty string', () => {
    expect(FALLBACK_SUMMARY).toBeTruthy();
    expect(typeof FALLBACK_SUMMARY).toBe('string');
    expect(FALLBACK_SUMMARY.length).toBeGreaterThan(10);
  });
});

describe('GCP and API constants', () => {
  it('DEFAULT_GCP_REGION is a valid GCP region', () => {
    expect(DEFAULT_GCP_REGION).toMatch(/^[a-z]+-[a-z]+\d+$/);
  });

  it('VERTEX_AI_API_VERSION starts with "v"', () => {
    expect(VERTEX_AI_API_VERSION).toMatch(/^v\d+/);
  });

  it('GOV_API_FORMAT is "json"', () => {
    expect(GOV_API_FORMAT).toBe('json');
  });

  it('GOV_API_RESULT_LIMIT is a numeric string', () => {
    expect(Number(GOV_API_RESULT_LIMIT)).toBeGreaterThan(0);
  });
});
