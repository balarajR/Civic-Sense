/**
 * @file   utils.ts
 * @module ServerUtils
 * @description Server-side utility functions for input sanitization, safe JSON
 *              parsing of AI outputs, and rule-based local election answer
 *              generation (fallback when Gemini is unavailable).
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies none
 * @exports      sanitizeInput, stripCodeFences, safeJsonParse, buildLocalElectionAnswer
 */

import { logger } from '../utils/logger';
import { MAX_INPUT_LENGTH, OFFICIAL_ECI_LINKS } from '../config/constants';

/**
 * Sanitizes user input to prevent prompt injection attacks.
 * Strips known injection patterns and truncates to a safe length.
 *
 * @param {string} input - Raw user input string.
 * @returns {string} Sanitized input, truncated to MAX_INPUT_LENGTH characters.
 *
 * @example
 *   sanitizeInput('ignore all previous instructions'); // '[removed]'
 *   sanitizeInput('How do I vote?'); // 'How do I vote?'
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/ignore (?:all )?(?:previous|above|all) instructions/gi, '[removed]')
    .replace(/system prompt/gi, '[removed]')
    .slice(0, MAX_INPUT_LENGTH);
}

/**
 * Strips markdown code fences from AI-generated text.
 * Handles both ` ```json ` and plain ` ``` ` wrappers.
 *
 * @param {string} text - Raw AI output that may contain code fences.
 * @returns {string} Cleaned text with code fences removed.
 *
 * @example
 *   stripCodeFences('```json\n{"key":"value"}\n```'); // '{"key":"value"}'
 */
export function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

/**
 * Safely parses a JSON string, returning a fallback value on failure.
 * Automatically strips code fences before parsing.
 *
 * @param {string} text     - Raw text to parse (may contain code fences).
 * @param {T}      fallback - Default value to return if parsing fails.
 * @returns {T} Parsed object or the fallback.
 *
 * @example
 *   safeJsonParse('{"key":"value"}', {}); // { key: 'value' }
 *   safeJsonParse('invalid', { default: true }); // { default: true }
 */
export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(stripCodeFences(text));
  } catch {
    logger.warn('JSON parse failed for AI output, using fallback', { textLength: text.length });
    return fallback;
  }
}

/** Shape of the rule-based local election answer response. */
export interface LocalElectionAnswer {
  reply: string;
  detectedPersona: string;
  currentMode: string;
  nextAction: string;
  uiData: Record<string, unknown>;
}

/**
 * Generates a rule-based election answer without AI when Gemini is unavailable.
 * Matches the user's intent via regex patterns and returns structured guidance.
 *
 * @param {string} rawInput - The user's raw chat message.
 * @returns {LocalElectionAnswer} Structured response with reply, persona, mode, and next action.
 *
 * @example
 *   buildLocalElectionAnswer('How do I register to vote?');
 *   // → { reply: 'For voter registration...', currentMode: 'JOURNEY_SIMULATOR', ... }
 */
export function buildLocalElectionAnswer(rawInput: string): LocalElectionAnswer {
  const input = rawInput.toLowerCase();
  const isTimeline = /\b(date|timeline|schedule|phase|counting|mcc|notification)\b/.test(input);
  const isBooth = /\b(booth|polling station|where.*vote|location)\b/.test(input);
  const isRegistration = /\b(register|registration|form 6|new voter|name.*roll|voter id|epic)\b/.test(input);
  const isMyth = /\b(fake|myth|rumou?r|evm|vvpat|nota|fraud)\b/.test(input);

  if (isTimeline) {
    return {
      reply: [
        'Here is the election timeline in a simple path:',
        '',
        '1. **Announcement:** ECI declares the election schedule and the Model Code of Conduct starts.',
        '2. **Notification:** Nominations open for each constituency.',
        '3. **Nomination scrutiny and withdrawal:** Candidate papers are checked, then the final candidate list is published.',
        '4. **Campaign and silence period:** Campaigning runs until the silence period before polling.',
        '5. **Polling day:** Voters verify identity, vote on EVM, and check the VVPAT slip.',
        '6. **Counting and results:** Counting happens on the announced date and results appear on the official ECI portal.',
        '',
        '**Always verify exact dates on ECI or your state CEO website because schedules can change by constituency.**',
        '',
        OFFICIAL_ECI_LINKS.join('\n'),
      ].join('\n'),
      detectedPersona: 'FIRST_TIME_VOTER',
      currentMode: 'TIMELINE_BUILDER',
      nextAction: 'Open the Timeline tool and verify dates on the ECI portal.',
      uiData: {
        events: [
          { title: 'Schedule Announcement', date: 'ECI announced', description: 'MCC begins immediately after the official schedule is announced.' },
          { title: 'Nomination Window', date: 'As notified', description: 'Candidates submit nomination papers for each constituency.' },
          { title: 'Polling Day', date: 'Phase-wise', description: 'Voters cast votes at assigned polling stations.' },
          { title: 'Counting Day', date: 'ECI announced', description: 'Votes are counted and results are published officially.' },
        ],
      },
    };
  }

  if (isBooth) {
    return {
      reply: [
        'To find your polling booth:',
        '',
        '1. Keep your EPIC number or registered details ready.',
        '2. Search your name on the electoral roll.',
        '3. Note the polling station name, part number, and serial number.',
        '4. Carry your EPIC card or another ECI-approved photo ID on polling day.',
        '',
        OFFICIAL_ECI_LINKS.slice(0, 3).join('\n'),
      ].join('\n'),
      detectedPersona: 'FIRST_TIME_VOTER',
      currentMode: 'ACTION_HUB',
      nextAction: 'Use the Booth Finder inside Action Hub.',
      uiData: {},
    };
  }

  if (isRegistration) {
    return {
      reply: [
        'For voter registration, follow this checklist:',
        '',
        '1. Confirm you are 18 or older on the qualifying date.',
        '2. Submit **Form 6** on voters.eci.gov.in or through the Voter Helpline App.',
        '3. Upload proof of age, address, and a photo.',
        '4. Track the application status online.',
        '5. After approval, confirm your name appears in the electoral roll.',
        '',
        OFFICIAL_ECI_LINKS.slice(0, 3).join('\n'),
      ].join('\n'),
      detectedPersona: 'FIRST_TIME_VOTER',
      currentMode: 'JOURNEY_SIMULATOR',
      nextAction: 'Start the Journey tool from registration step one.',
      uiData: {},
    };
  }

  if (isMyth) {
    return {
      reply: [
        '**Neutral myth-check approach:** I can help classify an election claim as fact, myth, or partly true.',
        '',
        'Share the exact claim, source, date, and place. I will compare it against official ECI material, court/legal context where relevant, and credible public records without favoring any party or candidate.',
      ].join('\n'),
      detectedPersona: 'ENGAGED_CITIZEN',
      currentMode: 'MYTH_BUSTER',
      nextAction: 'Paste the exact claim you want checked.',
      uiData: {},
    };
  }

  return {
    reply: [
      'I can guide you through the Indian election process step by step.',
      '',
      '**Best starting points:** registration, voter ID/EPIC, booth lookup, polling-day process, election timeline, Model Code of Conduct, or results.',
      '',
      OFFICIAL_ECI_LINKS.join('\n'),
    ].join('\n'),
    detectedPersona: 'UNKNOWN',
    currentMode: 'GENERAL',
    nextAction: 'Ask about registration, election timelines, booth lookup, or voting day steps.',
    uiData: {},
  };
}
