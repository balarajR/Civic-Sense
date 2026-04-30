import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, MapPin, Search, Calendar, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

interface JourneySimulatorProps {
  currentStage: number;
  onNext: () => void;
}

const stages = [
  {
    id: 1,
    title: "Voter Registration",
    description: "The first step is getting on the electoral roll. You'll need Form 6 if you're a new voter.",
    action: "Visit voters.eci.gov.in",
    icon: UserPlus,
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "EPIC Card / Voter ID",
    description: "Ensure your Aadhaar is linked and you have your EPIC number ready for identification.",
    action: "Link Aadhaar via 1950",
    icon: Search,
    color: "bg-indigo-500"
  },
  {
    id: 3,
    title: "Booth Lookup",
    description: "Find exactly where you'll cast your vote. Polling stations are usually within 2KM of home.",
    action: "Use Booth Finder",
    icon: MapPin,
    color: "bg-purple-500"
  },
  {
    id: 4,
    title: "Election Day",
    description: "Visit your booth with ID. You'll use an EVM and see your vote on the VVPAT screen.",
    action: "Know EVM Process",
    icon: CheckCircle2,
    color: "bg-emerald-500"
  },
  {
    id: 5,
    title: "The Result",
    description: "Votes are counted after all phases end. Results are published on the ECI Results portal.",
    action: "View Live Results",
    icon: Calendar,
    color: "bg-orange-500"
  }
];

export default function JourneySimulator({ currentStage, onNext }: JourneySimulatorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Voting Pipeline</h3>
        <span className="text-[10px] font-black bg-black text-white px-2 py-0.5">STEP {currentStage} / 5</span>
      </div>

      <div className="space-y-4">
        {stages.map((stage) => {
          const isCompleted = stage.id < currentStage;
          const isActive = stage.id === currentStage;
          const isPending = stage.id > currentStage;

          return (
            <motion.div
              key={stage.id}
              initial={false}
              animate={{
                opacity: isPending ? 0.3 : 1,
                x: isActive ? 10 : 0
              }}
              className={cn(
                "relative flex gap-4 p-4 border-2 border-black transition-all",
                isActive ? "bg-white bold-shadow ring-1 ring-black/5" : "bg-slate-50",
                isCompleted && "bg-slate-100"
              )}
            >
              <div className={cn(
                "w-12 h-12 border-2 border-black flex items-center justify-center shrink-0 text-black",
                isActive ? stage.color : "bg-white",
                isCompleted && "bg-black text-white"
              )}>
                {isCompleted ? <CheckCircle2 size={24} strokeWidth={3} /> : <stage.icon size={24} strokeWidth={3} />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn("text-sm font-black uppercase italic", isActive ? "text-black" : "text-slate-600")}>
                    {stage.title}
                  </h4>
                  {isCompleted && (
                    <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 border border-black leading-none">
                      DONE
                    </span>
                  )}
                </div>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden mt-2"
                  >
                    <p className="text-xs font-bold text-slate-700 leading-relaxed mb-4">
                      {stage.description}
                    </p>
                    <button 
                      onClick={onNext}
                      className="w-full bg-orange-500 text-black border-2 border-black py-3 text-sm font-black uppercase bold-border bold-shadow-hover bold-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                    >
                      {stage.action} →
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
