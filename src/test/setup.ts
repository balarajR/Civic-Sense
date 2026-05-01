/**
 * @file   setup.ts
 * @module TestSetup
 * @description Global test setup for Vitest. Resets all mocks between tests
 *              and suppresses console noise for clean test output.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 */

import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Reset all mocks between tests — prevents state leakage
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Suppress console noise in test output (errors are intentionally triggered)
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});
