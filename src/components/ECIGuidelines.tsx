import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gavel, Users, UserCheck, ShieldCheck, ChevronRight, Info, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Guideline {
  id: string;
  title: string;
  description: string;
  category: 'MCC' | 'VOTER' | 'CANDIDATE';
  details: string[];
}

const GUIDELINES: Guideline[] = [
  {
    id: 'mcc-1',
    category: 'MCC',
    title: 'Model Code of Conduct (MCC)',
    description: 'Guidelines for political parties and candidates during the election period.',
    details: [
      'No use of government transport or machinery for campaigning.',
      'Constructive criticism only on policies/programs, not personal life.',
      'Places of worship shall not be used as forums for election propaganda.',
      'Ministers shall not combine their official visit with electioneering work.'
    ]
  },
  {
    id: 'voter-1',
    category: 'VOTER',
    title: 'Voter Conduct & Rights',
    description: 'Essential rules for citizens to ensure a fair and safe voting experience.',
    details: [
      'Right to secret ballot is absolute; do not show your marked ballot to anyone.',
      'Bribery or intimidation of voters is a punishable offense.',
      'Carrying mobile phones inside the polling booth is strictly prohibited.',
      'Voters must present an EPIC (Voter ID) or one of 12 approved alternatives.'
    ]
  },
  {
    id: 'candidate-1',
    category: 'CANDIDATE',
    title: 'Candidate Guidelines',
    description: 'Legal requirements and ethical standards for those contesting elections.',
    details: [
      'Submission of affidavit (Form 26) disclosing assets, liabilities, and education.',
      'Strict adherence to the limit of election expenses for the constituency.',
      'Obtaining prior permission for all meetings, rallies, and loudspeakers.',
      'Ensuring no communal or caste-based appeals are made during the campaign.'
    ]
  }
];

export default function ECIGuidelines() {
  const [selectedCategory, setSelectedCategory] = useState<Guideline['category'] | 'ALL'>('ALL');
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const handleSummarize = async (g: Guideline) => {
    if (summaries[g.id]) return;
    
    setLoadingIds(prev => new Set(prev).add(g.id));
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: g.title,
          description: g.description,
          details: g.details
        })
      });
      const data = await response.json();
      setSummaries(prev => ({ ...prev, [g.id]: data.summary }));
    } catch (error) {
      console.error("Summarization failed:", error);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(g.id);
        return next;
      });
    }
  };

  const filteredGuidelines = selectedCategory === 'ALL' 
    ? GUIDELINES 
    : GUIDELINES.filter(g => g.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Legal Framework</h3>
        <p className="text-xs font-bold text-slate-500 italic">Essential ECI directives for dynamic governance.</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'MCC', 'VOTER', 'CANDIDATE'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as any)}
            className={cn(
              "px-4 py-2 border-2 border-black font-black text-[10px] uppercase transition-all",
              selectedCategory === cat ? "bg-black text-white" : "bg-white hover:bg-slate-50"
            )}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredGuidelines.map((g) => (
          <motion.div
            layout
            key={g.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-black bg-white bold-shadow p-6"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center shrink-0">
                {g.category === 'MCC' && <Gavel size={24} strokeWidth={3} />}
                {g.category === 'VOTER' && <Users size={24} strokeWidth={3} />}
                {g.category === 'CANDIDATE' && <UserCheck size={24} strokeWidth={3} />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-lg font-black italic uppercase leading-none">{g.title}</h4>
                  <button
                    onClick={() => handleSummarize(g)}
                    disabled={loadingIds.has(g.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 border border-black text-[9px] font-black uppercase transition-all",
                      summaries[g.id] 
                        ? "bg-orange-500 text-white border-orange-600" 
                        : "hover:bg-slate-100 disabled:opacity-50"
                    )}
                  >
                    {loadingIds.has(g.id) ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Sparkles size={10} />
                    )}
                    {summaries[g.id] ? "Summarized" : "AI Summarize"}
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-500 italic">{g.description}</p>
              </div>
            </div>

            <AnimatePresence>
              {summaries[g.id] && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mb-6 p-3 bg-black text-white border-l-4 border-orange-500"
                >
                  <p className="text-[10px] font-black uppercase opacity-50 mb-1">AI Summary</p>
                  <p className="text-xs font-bold leading-tight italic">"{summaries[g.id]}"</p>
                </motion.div>
              )}
            </AnimatePresence>

            <ul className="space-y-3">
              {g.details.map((detail, idx) => (
                <li key={idx} className="flex gap-3 text-[11px] font-bold leading-snug">
                  <ChevronRight size={14} strokeWidth={3} className="shrink-0 text-orange-500 mt-0.5" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="bg-orange-50 border-2 border-black p-4 flex gap-3 text-[10px] font-bold text-black uppercase italic leading-tight">
        <ShieldCheck size={18} strokeWidth={3} className="shrink-0 text-orange-600" />
        <p>Compliance Notice: Violations can lead to disqualification or legal action under the Representation of the People Act, 1951.</p>
      </div>

      <a 
        href="https://eci.gov.in/important-instructions/" 
        target="_blank" 
        className="w-full flex items-center justify-center gap-2 border-2 border-black py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all bold-shadow-hover"
      >
        FULL MANUALS AT ECI.GOV.IN <Info size={14} strokeWidth={3} />
      </a>
    </div>
  );
}
