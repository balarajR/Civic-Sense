import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, CheckCircle2, ChevronRight, Info, AlertTriangle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InteractionMode, Message, Persona } from '../types';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  detectedPersona: Persona;
}

export default function ChatInterface({ messages, onSendMessage, isLoading, detectedPersona }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const getPersonaBadge = (persona: Persona) => {
    const badges = {
      [Persona.FIRST_TIME_VOTER]: { label: 'FIRST_TIME_VOTER', color: 'bg-black text-white' },
      [Persona.STUDENT_RESEARCHER]: { label: 'STUDENT_RESEARCHER', color: 'bg-blue-600 text-white' },
      [Persona.ENGAGED_CITIZEN]: { label: 'ENGAGED_CITIZEN', color: 'bg-orange-500 text-black' },
      [Persona.ELECTION_OFFICIAL]: { label: 'ELECTION_OFFICIAL', color: 'bg-purple-600 text-white' },
      [Persona.UNKNOWN]: { label: 'GUEST_USER', color: 'bg-slate-200 text-slate-800' },
    };
    const badge = badges[persona] || badges[Persona.UNKNOWN];
    return (
      <span className={cn("text-[10px] uppercase font-black px-2 py-0.5 border-2 border-black", badge.color)}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <header className="p-4 border-b-2 border-black bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Live Terminal</h2>
        </div>
        <div className="flex items-center gap-3">
            {detectedPersona !== Persona.UNKNOWN && (
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    {getPersonaBadge(detectedPersona)}
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
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="TYPE_YOUR_QUERY_HERE..."
            className="flex-1 bg-slate-50 border-2 border-black p-4 text-sm font-bold uppercase placeholder:opacity-30 focus:outline-none focus:bg-white transition-all shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-orange-500 text-black border-2 border-black px-6 font-black uppercase text-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bold-shadow disabled:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SEND →
          </button>
        </div>
      </form>
    </div>
  );
}
