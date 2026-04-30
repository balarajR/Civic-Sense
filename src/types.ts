export enum Persona {
  FIRST_TIME_VOTER = 'FIRST_TIME_VOTER',
  STUDENT_RESEARCHER = 'STUDENT_RESEARCHER',
  ENGAGED_CITIZEN = 'ENGAGED_CITIZEN',
  ELECTION_OFFICIAL = 'ELECTION_OFFICIAL',
  UNKNOWN = 'UNKNOWN'
}

export enum InteractionMode {
  JOURNEY_SIMULATOR = 'JOURNEY_SIMULATOR',
  MYTH_BUSTER = 'MYTH_BUSTER',
  CIVIC_QUIZ = 'CIVIC_QUIZ',
  TIMELINE_BUILDER = 'TIMELINE_BUILDER',
  ACTION_HUB = 'ACTION_HUB',
  GENERAL = 'GENERAL'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  persona?: Persona;
  mode?: InteractionMode;
  metadata?: Record<string, unknown>;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TimelineEvent {
  title: string;
  date: string;
  description: string;
  cta?: string;
}
