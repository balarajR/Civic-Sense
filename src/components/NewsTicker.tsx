import React from 'react';
import { motion } from 'motion/react';
import { Radio } from 'lucide-react';

interface NewsTickerProps {
  news: string[];
}

export default function NewsTicker({ news }: NewsTickerProps) {
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
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="flex whitespace-nowrap"
        >
          {/* We repeat the content to ensure seamless loop */}
          <div className="flex items-center">
            {news.map((item, idx) => (
              <span key={`news-1-${idx}`} className="text-white text-[10px] font-bold uppercase italic flex items-center">
                <span className="mx-6 text-orange-500 font-black">•</span>
                {item}
              </span>
            ))}
          </div>
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
