import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Info, ChevronRight, Scale, GraduationCap, Briefcase, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Candidate {
  id: string;
  name: string;
  party: string;
  education: string;
  assets: string;
  criminalCases: number;
  profession: string;
  partyLogo: string;
  partyColor: string;
}

export default function CandidateComparator() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [constituency, setConstituency] = useState('Bangalore South');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/candidates?constituency=${encodeURIComponent(constituency)}`)
      .then(res => res.json())
      .then(data => {
        if(data.candidates) {
          setCandidates(data.candidates);
          // Auto select first 2
          setSelectedIds(data.candidates.slice(0, 2).map((c: Candidate) => c.id));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [constituency]);

  const toggleCandidate = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 2) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedCandidates = candidates.filter(c => selectedIds.includes(c.id));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Affidavit Analyzer</h3>
        <p className="text-xs font-bold text-slate-500 italic">Compare candidate transparency data (Form 26).</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4">
        <input 
          type="text" 
          placeholder="Enter Constituency (e.g. Varanasi, Wayanad)"
          className="border-2 border-black p-3 font-bold text-xs uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:outline-none"
          value={constituency}
          onChange={(e) => setConstituency(e.target.value)}
        />
      </div>

      {/* Candidate Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
            <div className="col-span-full p-8 text-center border-2 border-dashed border-slate-300 font-bold text-xs uppercase italic text-slate-500">
                Fetching Data for {constituency}...
            </div>
        ) : candidates.map((c) => (
          <button
            key={c.id}
            onClick={() => toggleCandidate(c.id)}
            className={cn(
              "p-4 border-2 border-black text-left transition-all bold-shadow-hover relative group overflow-hidden",
              selectedIds.includes(c.id) ? "bg-black text-white" : "bg-white"
            )}
          >
            <div className={cn(
                "absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black text-[10px]",
                c.partyColor,
                selectedIds.includes(c.id) ? "text-white" : "text-white"
            )}>
                {c.partyLogo}
            </div>
            <p className="text-[9px] font-black opacity-40 uppercase leading-none mb-1 tracking-tighter">Political Party</p>
            <div className="flex items-center gap-1.5 mb-2">
              <div className={cn("w-2 h-2 border border-black shrink-0", c.partyColor)} />
              <p className="text-[11px] font-black uppercase pr-8 leading-none">{c.party}</p>
            </div>
            <p className="text-sm font-black italic leading-none">{c.name}</p>
            {selectedIds.includes(c.id) && (
              <p className="text-[9px] font-black text-orange-500 mt-2 uppercase">Selected [X]</p>
            )}
          </button>
        ))}
      </div>

      {/* Comparison View */}
      <div className="min-h-[300px]">
        {selectedIds.length === 2 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-px bg-black border-2 border-black bold-shadow">
              {selectedCandidates.map((c) => (
                <div key={c.id} className="bg-white p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-[9px] font-black opacity-40 uppercase tracking-tighter leading-none mb-1">Affiliation</p>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 border border-black shrink-0", c.partyColor)} />
                          <p className="text-[10px] font-black text-white bg-black px-2 py-0.5 inline-block italic uppercase">
                          {c.party}
                          </p>
                        </div>
                    </div>
                    <div className={cn(
                        "w-12 h-12 rounded-full border-4 border-black flex items-center justify-center font-black text-xs text-white bold-shadow-sm",
                        c.partyColor
                    )}>
                        {c.partyLogo}
                    </div>
                  </div>
                  <h4 className="text-xl font-black italic uppercase leading-none mb-6">{c.name}</h4>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-3">
                      <GraduationCap size={18} strokeWidth={3} className="shrink-0 text-orange-500" />
                      <div>
                        <p className="text-[10px] font-black opacity-50 uppercase">Education</p>
                        <p className="text-xs font-bold">{c.education}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Briefcase size={18} strokeWidth={3} className="shrink-0 text-orange-500" />
                      <div>
                        <p className="text-[10px] font-black opacity-50 uppercase">Profession</p>
                        <p className="text-xs font-bold">{c.profession}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Scale size={18} strokeWidth={3} className="shrink-0 text-orange-500" />
                      <div>
                        <p className="text-[10px] font-black opacity-50 uppercase">Total Assets</p>
                        <p className="text-sm font-black text-black">{c.assets}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} strokeWidth={3} className={cn("shrink-0", c.criminalCases > 0 ? "text-red-600" : "text-emerald-500")} />
                      <div>
                        <p className="text-[10px] font-black opacity-50 uppercase">Criminal Cases</p>
                        <p className={cn("text-xs font-black", c.criminalCases > 0 ? "text-red-600" : "text-emerald-600")}>
                          {c.criminalCases === 0 ? "NIL" : `${c.criminalCases} REPORTED`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-100 border-2 border-black p-4 flex gap-3 text-[10px] font-bold text-black uppercase italic leading-tight">
              <Info size={16} strokeWidth={3} className="shrink-0" />
              <p>Data Source: Self-declared affidavits filed with ECI. Comparative data is for descriptive purposes only.</p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border-4 border-dashed border-black/10 p-12 text-center">
            <Users size={64} strokeWidth={3} className="opacity-10 mb-4" />
            <p className="text-sm font-black uppercase italic text-slate-400">Selection Pending</p>
            <p className="text-xs font-bold text-slate-400 mt-2">Select exactly (2) candidates to trigger side-by-side analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
