/**
 * @file   TimelineBuilder.tsx
 * @module TimelineBuilder
 * @description Visual election timeline component. Fetches timeline events from
 *              the API (or uses fallback data) and renders them as a vertical
 *              timeline with animated transitions and ECI verification notices.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies react, motion/react, lucide-react
 * @exports      TimelineBuilder (default)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Info, Clock, AlertCircle } from 'lucide-react';
import { TimelineEvent } from '../types';

/** Props accepted by the TimelineBuilder component. */
interface TimelineBuilderProps {
  /** Optional initial events to display (skips API fetch if provided). */
  events?: TimelineEvent[];
}

/** Fallback timeline data used when the API is unreachable. */
const FALLBACK_TIMELINE: TimelineEvent[] = [
  { title: 'Schedule Announcement', date: 'ECI notified', description: 'The official election schedule is announced and the Model Code of Conduct begins.', cta: 'Verify on ECI' },
  { title: 'Nomination Period', date: 'Constituency-wise', description: 'Candidates file nominations, papers are scrutinized, and withdrawals close before the final list.' },
  { title: 'Polling Window', date: 'Phase-wise', description: 'Voters cast their vote at assigned polling stations using EVM and VVPAT verification.' },
  { title: 'Counting & Results', date: 'ECI notified', description: 'Votes are counted and constituency-wise results are published on the official results portal.' },
];

/**
 * TimelineBuilder — Vertical timeline visualization of election milestones
 * with animated entries, API data fetching, and ECI verification notices.
 *
 * @param {TimelineBuilderProps} props - Component props.
 * @returns {React.JSX.Element} The timeline panel.
 */
export default function TimelineBuilder({ events: initialEvents }: TimelineBuilderProps): React.JSX.Element {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents || []);
  const [loading, setLoading] = useState<boolean>(!initialEvents || initialEvents.length === 0);

  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setEvents(initialEvents);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/timeline')
      .then(res => res.json())
      .then(data => {
        if (data.timeline) {
          setEvents(data.timeline);
        }
      })
      .catch(() => {
        setEvents(FALLBACK_TIMELINE);
      })
      .finally(() => setLoading(false));
  }, [initialEvents]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-300">
        <Clock size={48} strokeWidth={3} className="opacity-10 mb-4 animate-spin-slow" />
        <p className="text-sm font-black uppercase italic text-slate-400">Fetching Timeline...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <Clock size={48} strokeWidth={3} className="opacity-10 mb-4" />
        <p className="text-sm font-black uppercase italic">No schedule announced.</p>
        <p className="text-xs mt-1 font-bold">Awaiting ECI official notification.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-1 before:bg-black before:pointer-events-none">
      {events.map((event, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="relative pl-12"
        >
          <div className="absolute left-0 w-8 h-8 bg-white border-2 border-black flex items-center justify-center z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Calendar size={14} strokeWidth={3} className="text-black" />
          </div>
          
          <div className="bg-white border-2 border-black p-5 bold-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-black uppercase italic text-slate-900">{event.title}</h4>
              <span className="text-[10px] font-black text-white uppercase bg-black px-2 py-0.5 border border-black">{event.date}</span>
            </div>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              {event.description}
            </p>
            {event.cta && (
              <button className="mt-4 text-[10px] font-black uppercase text-orange-600 flex items-center gap-1 hover:underline">
                <Info size={12} strokeWidth={3} />
                {event.cta}
              </button>
            )}
          </div>
        </motion.div>
      ))}

      <div className="bg-orange-100 border-2 border-black p-4 flex gap-3 text-[10px] font-bold text-black uppercase italic leading-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <AlertCircle size={16} strokeWidth={3} className="shrink-0" />
        <p>Verification Required: Dates are subject to change by ECI. Always check eci.gov.in and your state CEO portal before acting.</p>
      </div>
    </div>
  );
}
