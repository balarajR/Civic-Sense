/**
 * @file   errors.test.ts
 * @module ErrorsTest
 * @description Unit tests for the custom error hierarchy.
 *              Verifies error codes, status codes, messages, and inheritance.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 */

import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, ApiError, NotFoundError } from '../utils/errors';

describe('AppError', () => {
  it('creates an error with code, message, and default status 500', () => {
    const err = new AppError('CACHE_MISS', 'Cache entry expired');
    expect(err.message).toBe('Cache entry expired');
    expect(err.code).toBe('CACHE_MISS');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });

  it('accepts a custom status code', () => {
    const err = new AppError('CUSTOM', 'Custom error', 418);
    expect(err.statusCode).toBe(418);
  });

  it('is an instance of Error', () => {
    const err = new AppError('TEST', 'test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('preserves the cause when provided via options', () => {
    const cause = new Error('root cause');
    const err = new AppError('WRAP', 'Wrapped error', 500, { cause });
    expect(err.cause).toBe(cause);
  });
});

describe('ValidationError', () => {
  it('has code VALIDATION_ERROR and status 400', () => {
    const err = new ValidationError('Invalid input');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('ValidationError');
  });

  it('extends AppError', () => {
    const err = new ValidationError('Bad data');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it('carries the correct message', () => {
    const err = new ValidationError('Messages array is required');
    expect(err.message).toBe('Messages array is required');
  });
});

describe('ApiError', () => {
  it('has code API_ERROR and status 502', () => {
    const err = new ApiError('Gemini returned 503');
    expect(err.code).toBe('API_ERROR');
    expect(err.statusCode).toBe(502);
    expect(err.name).toBe('ApiError');
  });

  it('extends AppError', () => {
    const err = new ApiError('timeout');
    expect(err).toBeInstanceOf(AppError);
  });

  it('is operational by default', () => {
    const err = new ApiError('Service down');
    expect(err.isOperational).toBe(true);
  });
});

describe('NotFoundError', () => {
  it('has code NOT_FOUND, status 404, and includes resource name in message', () => {
    const err = new NotFoundError('Constituency "XYZ"');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Constituency "XYZ" not found');
    expect(err.name).toBe('NotFoundError');
  });

  it('extends AppError', () => {
    const err = new NotFoundError('Timeline');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it('produces a descriptive message for any resource', () => {
    const err = new NotFoundError('User session');
    expect(err.message).toContain('User session');
    expect(err.message).toContain('not found');
  });
});
