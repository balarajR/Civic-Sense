/**
 * @file   NewsTicker.tsx
 * @module NewsTicker
 * @description Horizontally scrolling news ticker that displays live election
 *              headlines. Uses infinite CSS animation via Framer Motion for a
 *              seamless loop effect.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies react, motion/react, lucide-react
 * @exports      NewsTicker (default)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Radio } from 'lucide-react';

/** Scroll animation duration in seconds. */
const TICKER_DURATION_SECONDS = 30;

/** Props accepted by the NewsTicker component. */
interface NewsTickerProps {
  /** Array of headline strings to display in the ticker. */
  news: string[];
}

/**
 * NewsTicker — renders a horizontally scrolling marquee of election headlines.
 * The content is duplicated to create a seamless infinite loop.
 *
 * @param {NewsTickerProps} props - Component props.
 * @returns {React.JSX.Element | null} The ticker element, or null if no headlines.
 */
export default function NewsTicker({ news }: NewsTickerProps): React.JSX.Element | null {
  if (!news || news.length === 0) return null;

  return (
    <div className="bg-black border-y-2 border-black h-10 flex items-center overflow-hidden relative">
      {/* Live Label */}
      <div className="bg-red-600 h-full flex items-center px-4 gap-2 z-10 shrink-0 border-r-2 border-black">
        <Radio size={14} className="text-white animate-pulse" />
        <span className="text-[10px] font-black text-white uppercase tracking-tighter">LIVE_FEED</span>
      </div>

      {/* Scrolling Text Container */}
      <div className="flex-1 overflow-hidden relative">
        <motion.div 
          initial={{ x: "0%" }}
          animate={{ x: "-50%" }}
          transition={{ 
            duration: TICKER_DURATION_SECONDS, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="flex whitespace-nowrap"
        >
          {/* First copy of headlines */}
          <div className="flex items-center">
            {news.map((item, idx) => (
              <span key={`news-1-${idx}`} className="text-white text-[10px] font-bold uppercase italic flex items-center">
                <span className="mx-6 text-orange-500 font-black">•</span>
                {item}
              </span>
            ))}
          </div>
          {/* Duplicate for seamless loop */}
          <div className="flex items-center">
            {news.map((item, idx) => (
              <span key={`news-2-${idx}`} className="text-white text-[10px] font-bold uppercase italic flex items-center">
                <span className="mx-6 text-orange-500 font-black">•</span>
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Timestamp */}
      <div className="hidden md:flex bg-slate-100 h-full items-center px-4 z-10 shrink-0 border-l-2 border-black italic">
        <span className="text-[8px] font-black opacity-60 uppercase">GEN_TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}
