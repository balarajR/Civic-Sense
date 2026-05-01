/**
 * @file   validators.test.ts
 * @module ValidatorsTest
 * @description Unit tests for input validation functions.
 *              Tests happy path, boundary conditions, and injection attempts.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 */

import { describe, it, expect } from 'vitest';
import {
  validateChatMessages,
  validateSummarizeInput,
  validateConstituency,
} from './validators';

describe('validateChatMessages', () => {
  it('accepts valid chat messages array', () => {
    const msgs = [
      { role: 'user', content: 'What is the election date?' },
    ];
    const result = validateChatMessages(msgs);
    expect(result).toEqual(msgs);
    expect(result).toHaveLength(1);
  });

  it('accepts multiple messages', () => {
    const msgs = [
      { role: 'user', content: 'Hello' },
      { role: 'model', content: 'Hi there' },
      { role: 'user', content: 'Tell me about elections' },
    ];
    const result = validateChatMessages(msgs);
    expect(result).toHaveLength(3);
  });

  it('throws on empty array', () => {
    expect(() => validateChatMessages([])).toThrow('Messages array is required');
  });

  it('throws on null/undefined input', () => {
    expect(() => validateChatMessages(null)).toThrow();
    expect(() => validateChatMessages(undefined)).toThrow();
  });

  it('throws on non-array input', () => {
    expect(() => validateChatMessages('not an array')).toThrow();
    expect(() => validateChatMessages(42)).toThrow();
    expect(() => validateChatMessages({})).toThrow();
  });

  it('throws when a message is missing role', () => {
    expect(() => validateChatMessages([{ content: 'hello' }])).toThrow('index 0');
  });

  it('throws when a message is missing content', () => {
    expect(() => validateChatMessages([{ role: 'user' }])).toThrow('index 0');
  });

  it('throws when a message has non-string role', () => {
    expect(() => validateChatMessages([{ role: 123, content: 'test' }])).toThrow();
  });

  it('throws when a message is null inside the array', () => {
    expect(() => validateChatMessages([null])).toThrow();
  });
});

describe('validateSummarizeInput', () => {
  it('accepts valid input with title and description', () => {
    const body = { title: 'EVM Machines', description: 'How EVMs work in elections' };
    const result = validateSummarizeInput(body);
    expect(result.title).toBe('EVM Machines');
    expect(result.description).toBe('How EVMs work in elections');
  });

  it('accepts input with optional details array', () => {
    const body = {
      title: 'Test',
      description: 'Desc',
      details: ['detail 1', 'detail 2'],
    };
    const result = validateSummarizeInput(body);
    expect(result.details).toEqual(['detail 1', 'detail 2']);
  });

  it('throws on null body', () => {
    expect(() => validateSummarizeInput(null)).toThrow('must be a JSON object');
  });

  it('throws on non-object body', () => {
    expect(() => validateSummarizeInput('string')).toThrow();
  });

  it('throws when title is missing', () => {
    expect(() => validateSummarizeInput({ description: 'desc' })).toThrow('Title is required');
  });

  it('throws when title is empty string', () => {
    expect(() => validateSummarizeInput({ title: '', description: 'desc' })).toThrow('Title');
  });

  it('throws when description is missing', () => {
    expect(() => validateSummarizeInput({ title: 'title' })).toThrow('Description');
  });

  it('throws when details is not an array', () => {
    expect(() =>
      validateSummarizeInput({ title: 'title', description: 'desc', details: 'bad' }),
    ).toThrow('Details must be an array');
  });
});

describe('validateConstituency', () => {
  const DEFAULT = 'Bangalore South';

  it('returns the trimmed constituency for valid input', () => {
    expect(validateConstituency('  Mumbai North  ', DEFAULT)).toBe('Mumbai North');
  });

  it('returns default for empty string', () => {
    expect(validateConstituency('', DEFAULT)).toBe(DEFAULT);
  });

  it('returns default for null/undefined', () => {
    expect(validateConstituency(null, DEFAULT)).toBe(DEFAULT);
    expect(validateConstituency(undefined, DEFAULT)).toBe(DEFAULT);
  });

  it('returns default for non-string input', () => {
    expect(validateConstituency(42, DEFAULT)).toBe(DEFAULT);
    expect(validateConstituency({}, DEFAULT)).toBe(DEFAULT);
  });

  it('truncates excessively long constituency names to 100 chars', () => {
    const long = 'A'.repeat(200);
    const result = validateConstituency(long, DEFAULT);
    expect(result.length).toBe(100);
  });

  it('returns exact string for normal-length input', () => {
    expect(validateConstituency('Chennai Central', DEFAULT)).toBe('Chennai Central');
  });
});
