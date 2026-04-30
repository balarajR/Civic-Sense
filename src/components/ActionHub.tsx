import React, { useState } from 'react';
import BoothFinder from './BoothFinder';
import CandidateComparator from './CandidateComparator';
import ECIGuidelines from './ECIGuidelines';
import LiveResults from './LiveResults';
import { cn } from '../lib/utils';
import { MapPin, Users, Gavel, Activity } from 'lucide-react';

enum ActionTool {
  BOOTH_LOCATOR = 'BOOTH_LOCATOR',
  CANDIDATE_COMPARE = 'CANDIDATE_COMPARE',
  ECI_GUIDELINES = 'ECI_GUIDELINES',
  LIVE_RESULTS = 'LIVE_RESULTS'
}

export default function ActionHub() {
  const [activeTool, setActiveTool] = useState<ActionTool>(ActionTool.LIVE_RESULTS);

  return (
    <div className="space-y-8">
      {/* Tool Selector Tabs */}
      <div className="flex flex-wrap border-4 border-black divide-x-4 divide-y-4 md:divide-y-0 divide-black bg-white bold-shadow">
        <button
          onClick={() => setActiveTool(ActionTool.LIVE_RESULTS)}
          className={cn(
            "w-1/2 md:w-1/4 py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all",
            activeTool === ActionTool.LIVE_RESULTS ? "bg-black text-white" : "hover:bg-slate-50 border-t-0"
          )}
        >
          <Activity size={14} strokeWidth={3} />
          LIVE DATA
        </button>
        <button
          onClick={() => setActiveTool(ActionTool.BOOTH_LOCATOR)}
          className={cn(
            "w-1/2 md:w-1/4 py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all",
            activeTool === ActionTool.BOOTH_LOCATOR ? "bg-black text-white" : "hover:bg-slate-50 border-t-0"
          )}
        >
          <MapPin size={14} strokeWidth={3} />
          BOOTHS
        </button>
        <button
          onClick={() => setActiveTool(ActionTool.CANDIDATE_COMPARE)}
          className={cn(
            "w-1/2 md:w-1/4 py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all",
            activeTool === ActionTool.CANDIDATE_COMPARE ? "bg-black text-white" : "hover:bg-slate-50"
          )}
        >
          <Users size={14} strokeWidth={3} />
          COMPARE
        </button>
        <button
          onClick={() => setActiveTool(ActionTool.ECI_GUIDELINES)}
          className={cn(
            "w-1/2 md:w-1/4 py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-all",
            activeTool === ActionTool.ECI_GUIDELINES ? "bg-black text-white" : "hover:bg-slate-50"
          )}
        >
          <Gavel size={14} strokeWidth={3} />
          RULES
        </button>
      </div>

      {/* active tool rendering */}
      <div className="pt-2">
        {activeTool === ActionTool.LIVE_RESULTS && <LiveResults />}
        {activeTool === ActionTool.BOOTH_LOCATOR && <BoothFinder />}
        {activeTool === ActionTool.CANDIDATE_COMPARE && <CandidateComparator />}
        {activeTool === ActionTool.ECI_GUIDELINES && <ECIGuidelines />}
      </div>
    </div>
  );
}
