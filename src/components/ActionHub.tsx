/**
 * @file   ActionHub.tsx
 * @module ActionHub
 * @description Multi-tool dashboard component that provides tabbed access to
 *              Live Results, Booth Locator, Candidate Comparator, and ECI
 *              Guidelines tools.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies react, lucide-react
 * @exports      ActionHub (default)
 */

import React, { useState } from 'react';
import BoothFinder from './BoothFinder';
import CandidateComparator from './CandidateComparator';
import ECIGuidelines from './ECIGuidelines';
import LiveResults from './LiveResults';
import { cn } from '../lib/utils';
import { MapPin, Users, Gavel, Activity } from 'lucide-react';

/** Available tool panels within the Action Hub. */
enum ActionTool {
  BOOTH_LOCATOR = 'BOOTH_LOCATOR',
  CANDIDATE_COMPARE = 'CANDIDATE_COMPARE',
  ECI_GUIDELINES = 'ECI_GUIDELINES',
  LIVE_RESULTS = 'LIVE_RESULTS'
}

/**
 * ActionHub — Multi-tool dashboard providing tabbed access to Live Results,
 * Booth Locator, Candidate Comparator, and ECI Guidelines.
 *
 * @returns {React.JSX.Element} The tabbed dashboard panel.
 */
export default function ActionHub(): React.JSX.Element {
  const [activeTool, setActiveTool] = useState<ActionTool>(ActionTool.LIVE_RESULTS);

  return (
    <div className="space-y-8" role="region" aria-label="Action Hub tools">
      {/* Tool Selector Tabs */}
      <div className="flex flex-wrap border-4 border-black divide-x-4 divide-y-4 md:divide-y-0 divide-black bg-white bold-shadow" role="tablist" aria-label="Action Hub tool selector">
        <button
          role="tab"
          onClick={() => setActiveTool(ActionTool.LIVE_RESULTS)}
          aria-selected={activeTool === ActionTool.LIVE_RESULTS}
          aria-label="View live election data"
          className={cn(
            "w-1/2 md:w-1/4 py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all",
            activeTool === ActionTool.LIVE_RESULTS ? "bg-black text-white" : "hover:bg-slate-50 border-t-0"
          )}
        >
          <Activity size={14} strokeWidth={3} aria-hidden="true" />
          LIVE DATA
        </button>
        <button
          role="tab"
          onClick={() => setActiveTool(ActionTool.BOOTH_LOCATOR)}
          aria-selected={activeTool === ActionTool.BOOTH_LOCATOR}
          aria-label="Find your polling booth"
          className={cn(
            "w-1/2 md:w-1/4 py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all",
            activeTool === ActionTool.BOOTH_LOCATOR ? "bg-black text-white" : "hover:bg-slate-50 border-t-0"
          )}
        >
          <MapPin size={14} strokeWidth={3} aria-hidden="true" />
          BOOTHS
        </button>
        <button
          role="tab"
          onClick={() => setActiveTool(ActionTool.CANDIDATE_COMPARE)}
          aria-selected={activeTool === ActionTool.CANDIDATE_COMPARE}
          aria-label="Compare candidates"
          className={cn(
            "w-1/2 md:w-1/4 py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all",
            activeTool === ActionTool.CANDIDATE_COMPARE ? "bg-black text-white" : "hover:bg-slate-50"
          )}
        >
          <Users size={14} strokeWidth={3} aria-hidden="true" />
          COMPARE
        </button>
        <button
          role="tab"
          onClick={() => setActiveTool(ActionTool.ECI_GUIDELINES)}
          aria-selected={activeTool === ActionTool.ECI_GUIDELINES}
          aria-label="View ECI election rules and guidelines"
          className={cn(
            "w-1/2 md:w-1/4 py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all",
            activeTool === ActionTool.ECI_GUIDELINES ? "bg-black text-white" : "hover:bg-slate-50"
          )}
        >
          <Gavel size={14} strokeWidth={3} aria-hidden="true" />
          RULES
        </button>
      </div>

      {/* Active tool panel */}
      <div className="pt-2" role="tabpanel" aria-label="Active tool content">
        {activeTool === ActionTool.LIVE_RESULTS && <LiveResults />}
        {activeTool === ActionTool.BOOTH_LOCATOR && <BoothFinder />}
        {activeTool === ActionTool.CANDIDATE_COMPARE && <CandidateComparator />}
        {activeTool === ActionTool.ECI_GUIDELINES && <ECIGuidelines />}
      </div>
    </div>
  );
}
