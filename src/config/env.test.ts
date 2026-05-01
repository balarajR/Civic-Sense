/**
 * @file   env.test.ts
 * @module EnvConfigTest
 * @description Unit tests for environment variable validation and configuration.
 *              Tests happy path, missing required vars, and missing optional vars.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEnv, getEnvConfig } from '../config/env';

describe('validateEnv', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to clean state
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not throw when GOOGLE_CLOUD_PROJECT is set', () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
    expect(() => validateEnv()).not.toThrow();
  });

  it('does not throw when GCP_PROJECT_ID (alternate) is set', () => {
    delete process.env.GOOGLE_CLOUD_PROJECT;
    process.env.GCP_PROJECT_ID = 'alt-project';
    expect(() => validateEnv()).not.toThrow();
  });

  it('throws an error when neither GOOGLE_CLOUD_PROJECT nor GCP_PROJECT_ID is set', () => {
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GCP_PROJECT_ID;
    expect(() => validateEnv()).toThrow(/Missing required environment variable/);
  });
});

describe('getEnvConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns a complete config object with correct types', () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'my-project';
    process.env.PORT = '8080';
    const config = getEnvConfig();

    expect(config.googleCloudProject).toBe('my-project');
    expect(config.port).toBe(8080);
    expect(typeof config.googleCloudLocation).toBe('string');
  });

  it('uses GCP_PROJECT_ID when GOOGLE_CLOUD_PROJECT is absent', () => {
    delete process.env.GOOGLE_CLOUD_PROJECT;
    process.env.GCP_PROJECT_ID = 'alt-project';
    const config = getEnvConfig();

    expect(config.googleCloudProject).toBe('alt-project');
  });

  it('uses default port 3000 when PORT is not set', () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'my-project';
    delete process.env.PORT;
    const config = getEnvConfig();
    expect(config.port).toBe(3000);
  });

  it('uses default GCP region when GOOGLE_CLOUD_LOCATION is not set', () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'my-project';
    delete process.env.GOOGLE_CLOUD_LOCATION;
    delete process.env.GCP_REGION;
    const config = getEnvConfig();
    expect(config.googleCloudLocation).toBe('us-central1');
  });

  it('returns undefined for optional keys when not set', () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'my-project';
    delete process.env.DATA_GOV_IN_API_KEY;
    delete process.env.APP_URL;
    const config = getEnvConfig();
    expect(config.dataGovApiKey).toBeUndefined();
    expect(config.appUrl).toBeUndefined();
  });

  it('reads APP_URL when provided', () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'my-project';
    process.env.APP_URL = 'https://civicsense.app';
    const config = getEnvConfig();
    expect(config.appUrl).toBe('https://civicsense.app');
  });
});
