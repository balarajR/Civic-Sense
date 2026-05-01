/**
 * @file   env.ts
 * @module EnvConfig
 * @description Validates all required environment variables at server startup.
 *              Fails fast with actionable error messages if any critical
 *              variable is missing, preventing silent runtime failures.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 *
 * @dependencies none
 * @exports      validateEnv, getEnvConfig
 */

import { logger } from '../utils/logger';

/** Shape of the validated environment configuration. */
export interface EnvConfig {
  /** GCP project ID for Vertex AI. */
  googleCloudProject: string;
  /** GCP region for Vertex AI (defaults to us-central1). */
  googleCloudLocation: string;
  /** Server port (defaults to 3000). */
  port: number;
  /** Optional data.gov.in API key. */
  dataGovApiKey: string | undefined;
  /** Optional CORS origin override. */
  appUrl: string | undefined;
}

/**
 * Validates that all required environment variables are present.
 * Logs warnings for optional variables that are missing.
 * Throws an Error if any required variable is absent.
 *
 * @returns {void}
 * @throws {Error} If GOOGLE_CLOUD_PROJECT (or GCP_PROJECT_ID) is not set.
 *
 * @example
 *   validateEnv(); // throws if required vars missing
 */
export function validateEnv(): void {
  const requiredVars = [
    { key: 'GOOGLE_CLOUD_PROJECT', alt: 'GCP_PROJECT_ID', label: 'GCP Project' },
  ];

  for (const { key, alt, label } of requiredVars) {
    if (!process.env[key] && !process.env[alt]) {
      throw new Error(
        `Missing required environment variable: ${key} (or ${alt}). ${label} must be configured.`
      );
    }
  }

  const optionalVars = ['DATA_GOV_IN_API_KEY', 'VITE_GOOGLE_MAPS_API_KEY'];
  for (const key of optionalVars) {
    if (!process.env[key]) {
      logger.warn(`Optional environment variable ${key} is not set`, { variable: key });
    }
  }
}

/**
 * Builds a typed configuration object from validated environment variables.
 *
 * @returns {EnvConfig} The validated environment configuration.
 *
 * @example
 *   const config = getEnvConfig();
 *   console.log(config.googleCloudProject);
 */
export function getEnvConfig(): EnvConfig {
  return {
    googleCloudProject: (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID)!,
    googleCloudLocation: process.env.GOOGLE_CLOUD_LOCATION || process.env.GCP_REGION || 'us-central1',
    port: Number(process.env.PORT) || 3000,
    dataGovApiKey: process.env.DATA_GOV_IN_API_KEY,
    appUrl: process.env.APP_URL,
  };
}
