/**
 * @file   types.ts
 * @module Types
 * @description Shared TypeScript type definitions and enumerations for the
 *              CivicSense application. Provides a single source of truth for
 *              all domain models used across client and server code.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies none
 * @exports      Persona, InteractionMode, Message, QuizQuestion, TimelineEvent
 */

/** Detected user persona — drives adaptive UX and response depth. */
export enum Persona {
  FIRST_TIME_VOTER = 'FIRST_TIME_VOTER',
  STUDENT_RESEARCHER = 'STUDENT_RESEARCHER',
  ENGAGED_CITIZEN = 'ENGAGED_CITIZEN',
  ELECTION_OFFICIAL = 'ELECTION_OFFICIAL',
  UNKNOWN = 'UNKNOWN'
}

/** Current interaction mode — determines which tool panel is active. */
export enum InteractionMode {
  JOURNEY_SIMULATOR = 'JOURNEY_SIMULATOR',
  MYTH_BUSTER = 'MYTH_BUSTER',
  CIVIC_QUIZ = 'CIVIC_QUIZ',
  TIMELINE_BUILDER = 'TIMELINE_BUILDER',
  ACTION_HUB = 'ACTION_HUB',
  GENERAL = 'GENERAL'
}

/** A single chat message in the conversation history. */
export interface Message {
  /** Unique identifier for the message. */
  id: string;
  /** Whether the message was sent by the user or the AI assistant. */
  role: 'user' | 'assistant';
  /** Markdown-formatted message content. */
  content: string;
  /** Timestamp when the message was created. */
  timestamp: Date;
  /** AI-detected user persona (assistant messages only). */
  persona?: Persona;
  /** Suggested interaction mode transition (assistant messages only). */
  mode?: InteractionMode;
  /** Additional structured data for UI rendering (e.g. timeline events). */
  metadata?: Record<string, unknown>;
}

/** A single quiz question with options, correct answer, and explanation. */
export interface QuizQuestion {
  /** The question text displayed to the user. */
  question: string;
  /** Array of answer options. */
  options: string[];
  /** Zero-based index of the correct option. */
  correctIndex: number;
  /** Educational explanation shown after answering. */
  explanation: string;
}

/** A single event in the election timeline. */
export interface TimelineEvent {
  /** Event title (e.g. "Nomination Period"). */
  title: string;
  /** Date or date range string. */
  date: string;
  /** Brief description of the event. */
  description: string;
  /** Optional call-to-action label. */
  cta?: string;
}
