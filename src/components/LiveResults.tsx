/**
 * @file   LiveResults.tsx
 * @module LiveResults
 * @description Real-time election results dashboard. Fetches live data from
 *              the server API and renders seat counts, party-wise leaderboard
 *              bars, voter turnout statistics, and auto-refresh polling.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies react, motion/react, lucide-react
 * @exports      LiveResults (default)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Activity, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

/** Minimum polling interval for live data refresh (ms). */
const POLL_INTERVAL_MS = 60_000;

/** Shape of a single party's election result entry. */
interface PartyResult {
  /** Full party name. */
  name: string;
  /** Party acronym (e.g. "BJP", "INC"). */
  acronym: string;
  /** Number of seats won (officially declared). */
  won: number;
  /** Number of seats currently leading. */
  leading: number;
  /** Total seats (won + leading). */
  total: number;
  /** Tailwind color class for the party bar. */
  color: string;
}

/** Shape of the election results API response. */
interface ApiResponse {
  /** ISO timestamp of the data snapshot. */
  timestamp: string;
  /** Data source attribution. */
  source: string;
  /** API status string. */
  status: string;
  /** National-level aggregated results. */
  national: {
    totalConstituencies: number;
    declared: number;
    leading: number;
    parties: PartyResult[];
  };
  /** Voter turnout statistics. */
  turnout: {
    nationalAverage: string;
    highestState: { name: string; value: string };
    lowestState: { name: string; value: string };
  };
}

/**
 * LiveResults — Real-time election results dashboard with auto-polling,
 * animated party leaderboard bars, and voter turnout metrics.
 *
 * @returns {React.JSX.Element} The live results panel.
 */
export default function LiveResults(): React.JSX.Element {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/election-results');
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // In a real app, this might poll every few minutes
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="p-8 border-4 border-black bg-red-50 text-center space-y-4" role="alert">
        <AlertCircle size={32} className="mx-auto text-red-500" aria-hidden="true" />
        <p className="font-bold text-sm">Failed to load real-time election data.</p>
        <button onClick={fetchData} className="px-4 py-2 bg-black text-white font-black text-xs uppercase hover:bg-slate-800 transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-slate-300" role="status" aria-live="polite">
        <RefreshCw size={32} className="animate-spin text-slate-400" aria-hidden="true" />
        <p className="font-black text-xs uppercase text-slate-400 italic">Establishing SECURE Connection to Govt API...</p>
      </div>
    );
  }

  // Calculate percentages for bars
  const parties = Array.isArray(data.national.parties) ? data.national.parties : [];
  const maxSeats = Math.max(1, ...parties.map(p => p.total));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Live Analytics</h3>
            <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 font-black uppercase flex items-center gap-1 animate-pulse">
              <Activity size={10} aria-hidden="true" /> Live
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 italic uppercase">Source: {data.source}</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          aria-label="Refresh election results data"
          className="p-2 border-2 border-black hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} aria-hidden="true" />
        </button>
      </div>

      {/* Top Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="group" aria-label="Election statistics overview">
        <div className="p-4 bg-slate-50 border-2 border-black bold-shadow-sm flex flex-col items-center text-center justify-center">
            <p className="text-[9px] font-black uppercase opacity-60 mb-1">Total Seats</p>
            <p className="text-xl font-black">{data.national.totalConstituencies}</p>
        </div>
        <div className="p-4 bg-slate-50 border-2 border-black bold-shadow-sm flex flex-col items-center text-center justify-center">
            <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Declared</p>
            <p className="text-xl font-black">{data.national.declared}</p>
        </div>
        <div className="p-4 bg-slate-50 border-2 border-black bold-shadow-sm flex flex-col items-center text-center justify-center">
            <p className="text-[9px] font-black uppercase text-orange-600 mb-1">Leading</p>
            <p className="text-xl font-black">{data.national.leading}</p>
        </div>
         <div className="p-4 bg-black text-white border-2 border-black bold-shadow-sm flex flex-col items-center text-center justify-center relative overflow-hidden">
            <p className="text-[9px] font-black uppercase opacity-60 mb-1 z-10">Voter Turnout</p>
            <p className="text-xl font-black text-yellow-400 z-10">{data.turnout.nationalAverage}</p>
        </div>
      </div>

      {/* Party Leaderboard */}
      <div className="border-4 border-black p-4 md:p-6 bg-white bold-shadow">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={18} strokeWidth={3} aria-hidden="true" />
          <h4 className="text-sm font-black uppercase">National Trends</h4>
        </div>

        <div className="space-y-4">
          {parties.length === 0 && (
            <div className="p-6 border-2 border-dashed border-slate-300 text-center">
              <p className="text-xs font-black uppercase text-slate-500">No party trend data available yet.</p>
            </div>
          )}

          {parties.map((party, idx) => {
            const widthPct = (party.total / maxSeats) * 100;
            
            return (
              <motion.div 
                key={party.acronym}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                <div className="flex justify-between items-end mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 border border-black", party.color)}></div>
                    <p className="text-xs font-black uppercase">{party.name} ({party.acronym})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black leading-none">{party.total}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">
                      {party.won} Won / {party.leading} Lead
                    </p>
                  </div>
                </div>
                {/* Bar */}
                <div className="h-4 w-full bg-slate-100 border-2 border-black overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 + 0.2 }}
                    className={cn("h-full border-r-2 border-black", party.color)}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      
      <div className="bg-slate-100 border-x-2 border-b-2 border-black p-3 -mt-6">
        <p className="text-[9px] font-bold text-slate-500 italic flex items-center gap-1 uppercase">
            <Eye size={12} aria-hidden="true" /> Last synced: {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </div>

    </div>
  );
}
