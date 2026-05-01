/**
 * @file   errors.ts
 * @module Errors
 * @description Custom error hierarchy for the CivicSense application.
 *              Provides typed, code-bearing error classes that carry
 *              structured context for logging and user-facing messages.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 *
 * @dependencies none
 * @exports      AppError, ValidationError, ApiError, NotFoundError
 */

/**
 * Base application error with a machine-readable code and HTTP status.
 *
 * @example
 *   throw new AppError('CACHE_MISS', 'Cache entry expired', 500);
 */
export class AppError extends Error {
  /** Machine-readable error code (e.g. 'VALIDATION_ERROR'). */
  public readonly code: string;

  /** HTTP status code to return to the client. */
  public readonly statusCode: number;

  /** Whether this is an operational (expected) error vs. a programmer bug. */
  public readonly isOperational: boolean;

  /**
   * Creates a new AppError.
   *
   * @param {string} code       - Machine-readable error code.
   * @param {string} message    - Human-readable error description.
   * @param {number} statusCode - HTTP status code (default 500).
   * @param {object} options    - Standard Error options (e.g. { cause }).
   * @returns {AppError}
   */
  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

/**
 * Thrown when input data fails schema or business-rule validation.
 *
 * @example
 *   throw new ValidationError('Messages array is required and must not be empty.');
 */
export class ValidationError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super('VALIDATION_ERROR', message, 400, options);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when an external API call (Gemini, data.gov.in) fails.
 *
 * @example
 *   throw new ApiError('Gemini API returned 503');
 */
export class ApiError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super('API_ERROR', message, 502, options);
    this.name = 'ApiError';
  }
}

/**
 * Thrown when a requested resource (candidate, timeline entry) is not found.
 *
 * @example
 *   throw new NotFoundError('Constituency "XYZ" not found');
 */
export class NotFoundError extends AppError {
  constructor(resource: string, options?: ErrorOptions) {
    super('NOT_FOUND', `${resource} not found`, 404, options);
    this.name = 'NotFoundError';
  }
}
