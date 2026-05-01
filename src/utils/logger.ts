/**
 * @file   logger.ts
 * @module Logger
 * @description Structured JSON logger that replaces raw console calls throughout
 *              the application. Outputs machine-parseable log lines with level,
 *              timestamp, and optional metadata for production observability.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 *
 * @dependencies none
 * @exports      logger
 */

/** Supported log severity levels. */
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Builds a structured JSON log entry and writes it to the appropriate console stream.
 *
 * @param {LogLevel} level - Severity level of the log entry.
 * @param {string}   msg   - Human-readable log message.
 * @param {object}   meta  - Optional key-value metadata to include.
 * @returns {void}
 *
 * @example
 *   writeLog('error', 'Chat endpoint failed', { userId: '123', error: 'timeout' });
 */
function writeLog(level: LogLevel, msg: string, meta: Record<string, unknown> = {}): void {
  const entry = JSON.stringify({
    level,
    msg,
    ...meta,
    ts: new Date().toISOString(),
  });

  switch (level) {
    case 'error':
      console.error(entry);
      break;
    case 'warn':
      console.warn(entry);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(entry);
      }
      break;
    default:
      console.log(entry);
  }
}

/**
 * Application-wide structured logger.
 * Use this instead of raw `console.log` / `console.error` calls.
 *
 * @example
 *   logger.info('Server started', { port: 3000 });
 *   logger.error('Request failed', { endpoint: '/api/chat', error: err.message });
 */
export const logger = {
  /** Log informational messages (startup, request completed, cache hit). */
  info:  (msg: string, meta: Record<string, unknown> = {}): void => writeLog('info', msg, meta),

  /** Log warning conditions (fallback used, deprecated feature). */
  warn:  (msg: string, meta: Record<string, unknown> = {}): void => writeLog('warn', msg, meta),

  /** Log error conditions with context for debugging. */
  error: (msg: string, meta: Record<string, unknown> = {}): void => writeLog('error', msg, meta),

  /** Log debug info — suppressed in production. */
  debug: (msg: string, meta: Record<string, unknown> = {}): void => writeLog('debug', msg, meta),
};
