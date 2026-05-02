/**
 * @file   ChatInterface.tsx
 * @module ChatInterface
 * @description Real-time chat interface component for the CivicSense AI assistant.
 *              Renders conversation history with markdown support, starter prompts,
 *              auto-scrolling, persona badges, and a loading indicator.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies react, lucide-react, motion/react, react-markdown
 * @exports      ChatInterface (default)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, CalendarDays, MapPinned, UserPlus, BadgeHelp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Message } from '../types';
import { Persona } from '../types';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

/** Props accepted by the ChatInterface component. */
interface ChatInterfaceProps {
  /** Array of conversation messages to render. */
  messages: Message[];
  /** Callback invoked when the user sends a new message. */
  onSendMessage: (content: string) => void;
  /** Whether an AI response is currently being generated. */
  isLoading: boolean;
  /** Currently detected user persona for badge display. */
  detectedPersona: Persona;
}

/** Starter prompt configuration for quick-action buttons. */
const STARTER_PROMPTS = [
  { label: 'Register', prompt: 'Walk me through voter registration step by step.', icon: UserPlus },
  { label: 'Timeline', prompt: 'Build an election timeline with each major step.', icon: CalendarDays },
  { label: 'Booth', prompt: 'How do I find my polling booth and what should I carry?', icon: MapPinned },
  { label: 'Myth', prompt: 'Help me fact-check an election claim neutrally.', icon: BadgeHelp },
] as const;

/**
 * Maps a Persona enum value to a styled badge configuration.
 *
 * @param {Persona} persona - The detected user persona.
 * @returns {{ label: string; color: string }} Badge label and Tailwind color classes.
 */
function getPersonaBadge(persona: Persona): { label: string; color: string } {
  const badges: Record<Persona, { label: string; color: string }> = {
    [Persona.FIRST_TIME_VOTER]: { label: 'FIRST_TIME_VOTER', color: 'bg-black text-white' },
    [Persona.STUDENT_RESEARCHER]: { label: 'STUDENT_RESEARCHER', color: 'bg-blue-600 text-white' },
    [Persona.ENGAGED_CITIZEN]: { label: 'ENGAGED_CITIZEN', color: 'bg-orange-500 text-black' },
    [Persona.ELECTION_OFFICIAL]: { label: 'ELECTION_OFFICIAL', color: 'bg-purple-600 text-white' },
    [Persona.UNKNOWN]: { label: 'GUEST_USER', color: 'bg-slate-200 text-slate-800' },
  };
  return badges[persona] || badges[Persona.UNKNOWN];
}

/**
 * ChatInterface — renders the main conversation UI with message history,
 * starter prompts, a text input, and a loading animation.
 *
 * @param {ChatInterfaceProps} props - Component props.
 * @returns {React.JSX.Element} The chat interface panel.
 */
export default function ChatInterface({ messages, onSendMessage, isLoading, detectedPersona }: ChatInterfaceProps): React.JSX.Element {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  /** Auto-scroll to the latest message whenever messages change. */
  useEffect(() => {
    /* v8 ignore start */
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    /* v8 ignore stop */
  }, [messages, isLoading]);

  /**
   * Handles form submission — sends the current input and clears the field.
   *
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const badge = getPersonaBadge(detectedPersona);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <header className="p-4 border-b-2 border-black bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Live Terminal</h2>
          <p className="text-[10px] font-bold uppercase text-slate-500 mt-1">Ask for steps, dates, booth help, or myth checks</p>
        </div>
        <div className="flex items-center gap-3">
            {detectedPersona !== Persona.UNKNOWN && (
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <span className={cn("text-[10px] uppercase font-black px-2 py-0.5 border-2 border-black", badge.color)}>
                      {badge.label}
                    </span>
                </motion.div>
            )}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase">Secure</span>
                <div className="w-2 h-2 bg-green-500 animate-pulse" />
            </div>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
        role="log"
        aria-label="Conversation with CivicSense"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex gap-4",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                m.role === 'user' ? "bg-black text-white" : "bg-orange-500 text-black"
              )}>
                {m.role === 'user' ? <User size={20} strokeWidth={3} /> : <Bot size={20} strokeWidth={3} />}
              </div>
              <div className={cn(
                "max-w-[80%] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                m.role === 'user' 
                  ? "bg-slate-50 text-slate-900" 
                  : "bg-white text-slate-900 italic font-medium"
              )}>
                <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-strong:font-black">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 border-2 border-black bg-orange-500 text-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Bot size={20} strokeWidth={3} className="animate-spin-slow" />
            </div>
            <div className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex gap-2 items-center">
              <span className="w-2 h-2 bg-black animate-pulse" />
              <span className="w-2 h-2 bg-black animate-pulse [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-black animate-pulse [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 border-t-2 border-black bg-white">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4" aria-label="Suggested election questions">
          {STARTER_PROMPTS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSendMessage(item.prompt)}
              disabled={isLoading}
              className="min-h-11 border-2 border-black bg-slate-50 px-3 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase hover:bg-black hover:text-white disabled:opacity-50 transition-all"
            >
              <item.icon size={14} strokeWidth={3} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="TYPE_YOUR_QUERY_HERE..."
            aria-label="Type your query to CivicSense assistant"
            autoComplete="off"
            className="flex-1 bg-slate-50 border-2 border-black p-4 text-sm font-bold uppercase placeholder:opacity-30 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="bg-orange-500 text-black border-2 border-black px-5 sm:px-6 font-black uppercase text-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bold-shadow disabled:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            SEND <Send size={16} strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
