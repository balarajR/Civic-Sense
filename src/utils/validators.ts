/**
 * @file   validators.ts
 * @module Validators
 * @description Input validation schemas and guard functions for all public
 *              API boundaries. Uses Zod-style manual validation to avoid
 *              adding a runtime dependency while still enforcing strict types.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 *
 * @dependencies none
 * @exports      validateChatMessages, validateSummarizeInput, validateConstituency
 */

import { ValidationError } from './errors';

/** Shape of a single chat message from the client. */
interface ChatMessageInput {
  role: string;
  content: string;
}

/** Shape of the summarize endpoint request body. */
interface SummarizeInput {
  title: string;
  description: string;
  details?: string[];
}

/**
 * Validates the chat messages array from the /api/chat endpoint.
 * Ensures the array is non-empty and each message has role and content.
 *
 * @param {unknown} messages - Raw messages from request body.
 * @returns {ChatMessageInput[]} Validated messages array.
 * @throws {ValidationError} If messages is not a non-empty array with valid entries.
 *
 * @example
 *   const msgs = validateChatMessages(req.body.messages);
 */
export function validateChatMessages(messages: unknown): ChatMessageInput[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ValidationError('Messages array is required and must not be empty.');
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg.role !== 'string' || typeof msg.content !== 'string') {
      throw new ValidationError(`Message at index ${i} must have 'role' (string) and 'content' (string).`);
    }
  }

  return messages as ChatMessageInput[];
}

/**
 * Validates the summarize endpoint request body.
 * Ensures title and description are present non-empty strings.
 *
 * @param {unknown} body - Raw request body.
 * @returns {SummarizeInput} Validated summarize input.
 * @throws {ValidationError} If title or description is missing.
 *
 * @example
 *   const input = validateSummarizeInput(req.body);
 */
export function validateSummarizeInput(body: unknown): SummarizeInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const { title, description, details } = body as Record<string, unknown>;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new ValidationError('Title is required and must be a non-empty string.');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new ValidationError('Description is required and must be a non-empty string.');
  }

  if (details !== undefined && !Array.isArray(details)) {
    throw new ValidationError('Details must be an array of strings when provided.');
  }

  return { title: title as string, description: description as string, details: details as string[] | undefined };
}

/**
 * Validates and sanitizes a constituency query parameter.
 * Returns a safe, trimmed string or the default constituency.
 *
 * @param {unknown} raw              - Raw query parameter value.
 * @param {string}  defaultValue     - Fallback constituency name.
 * @returns {string} Validated constituency name.
 *
 * @example
 *   const constituency = validateConstituency(req.query.constituency, 'Bangalore South');
 */
export function validateConstituency(raw: unknown, defaultValue: string): string {
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    return defaultValue;
  }
  return raw.trim().slice(0, 100);
}
