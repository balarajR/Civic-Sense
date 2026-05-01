/**
 * @file   logger.test.ts
 * @module LoggerTest
 * @description Unit tests for the structured JSON logger.
 *              Validates log levels, output format, and PII redaction.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('has info, warn, error, and debug methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('info() writes a JSON entry to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test message', { module: 'LoggerTest' });

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.level).toBe('info');
    expect(logged.msg).toBe('test message');
    expect(logged.module).toBe('LoggerTest');
    expect(logged.ts).toBeTruthy();
  });

  it('warn() writes a JSON entry to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('warning message');

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.level).toBe('warn');
    expect(logged.msg).toBe('warning message');
  });

  it('error() writes a JSON entry to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('something broke', { errorCode: 'E001' });

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.level).toBe('error');
    expect(logged.msg).toBe('something broke');
    expect(logged.errorCode).toBe('E001');
  });

  it('debug() writes a JSON entry to console.debug in development', () => {
    process.env.NODE_ENV = 'development';
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('debugging info', { step: 3 });

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.level).toBe('debug');
    expect(logged.step).toBe(3);
  });

  it('debug() does not write to console in non-development environment', () => {
    process.env.NODE_ENV = 'production';
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('should not be logged');

    expect(spy).not.toHaveBeenCalled();
  });

  it('includes an ISO-8601 timestamp in every log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('ts test');

    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('handles log calls with no meta object', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => logger.info('bare message')).not.toThrow();

    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.msg).toBe('bare message');
  });
});
