import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  MapPin, 
  Calendar, 
  Search, 
  HelpCircle, 
  Award, 
  ArrowRight,
  ShieldCheck,
  Languages,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChatInterface from './components/ChatInterface';
import JourneySimulator from './components/JourneySimulator';
import CivicQuiz from './components/CivicQuiz';
import { Message, Persona, InteractionMode, QuizQuestion, TimelineEvent } from './types';
import { cn } from './lib/utils';

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: "Namaste! I am **CivicSence**, your intelligent guide to Indian elections. 🗳️\n\nI can help you register to vote, find your booth in Karnataka, or bust myths you've heard. \n\n**What shall we start with?**",
  timestamp: new Date(),
};

const DUMMY_QUIZ: QuizQuestion[] = [
    {
        question: "What is the minimum age to vote in Indian elections?",
        options: ["16 years", "18 years", "21 years"],
        correctIndex: 1,
        explanation: "The voting age was lowered from 21 to 18 by the 61st Amendment Act, 1988."
    },
    {
        question: "How can you check if your name is on the electoral roll?",
        options: ["Visit local Police Station", "Check Voter Helpline App / NVSP", "Wait for letter from Government"],
        correctIndex: 1,
        explanation: "The ECI provides the Voter Helpline App and voters.eci.gov.in for immediate verification."
    },
    {
        question: "What does NOTA stand for on an EVM?",
        options: ["None Of The Above", "No Options To Apply", "Not Official To Admit"],
        correctIndex: 0,
        explanation: "NOTA allows citizens to express that they do not support any of the candidates contesting."
    }
];

import TimelineBuilder from './components/TimelineBuilder';
import ActionHub from './components/ActionHub';
import NewsTicker from './components/NewsTicker';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedPersona, setDetectedPersona] = useState<Persona>(Persona.UNKNOWN);
  const [currentMode, setCurrentMode] = useState<InteractionMode>(InteractionMode.GENERAL);
  const [news, setNews] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => setNews(data.news))
      .catch(err => console.error("News fetch error:", err));
  }, []);

  const [journeyStage, setJourneyStage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [civicScore, setCivicScore] = useState<number | null>(null);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        persona: data.detectedPersona as Persona,
        mode: data.currentMode as InteractionMode,
        metadata: data.uiData
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (data.detectedPersona) setDetectedPersona(data.detectedPersona as Persona);
      if (data.currentMode) setCurrentMode(data.currentMode as InteractionMode);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble connecting directly to the election data center. Please ensure your API key is correctly configured in settings.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F2F2F2] font-sans text-[#1A1A1A]">
      {/* Header */}
      <header className="h-20 border-b-4 border-black flex items-center justify-between px-8 bg-white shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tighter">CIVICSENCE</span>
          <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5">V.2.4</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 font-bold uppercase text-sm">
          <div className="flex border-2 border-black divide-x-2 divide-black">
            <button className="px-3 py-1 bg-black text-white cursor-default">ENG</button>
            <button className="px-3 py-1 hover:bg-black hover:text-white transition-colors">ಕೆನ</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs">LIVE: KARNATAKA ELECTION DATA</span>
          </div>
        </div>

        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2">
          <Menu size={24} strokeWidth={3} />
        </button>
      </header>

      <NewsTicker news={news} />

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex flex-col w-[320px] border-r-4 border-black bg-white overflow-y-auto">
          <div className="p-8 space-y-10">
            {/* Persona Section */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Detected Persona</p>
              <h2 className="text-2xl font-black leading-tight italic uppercase">{detectedPersona === Persona.UNKNOWN ? "Guest User" : detectedPersona}</h2>
              <p className="text-xs leading-relaxed opacity-70">
                {detectedPersona === Persona.FIRST_TIME_VOTER ? "Welcome, citizen! We've adapted your guide to be step-by-step and action-oriented." : "Personalized guidance enabled for your voter profile."}
              </p>
            </div>

            {/* Navigation Buttons */}
            <nav className="space-y-4">
              {[
                { id: '01', icon: Vote, label: "JOURNEY", mode: InteractionMode.JOURNEY_SIMULATOR },
                { id: '02', icon: ShieldCheck, label: "MYTH BUSTER", mode: InteractionMode.GENERAL },
                { id: '03', icon: Award, label: "CIVIC QUIZ", mode: InteractionMode.CIVIC_QUIZ },
                { id: '04', icon: Calendar, label: "TIMELINE", mode: InteractionMode.TIMELINE_BUILDER },
                { id: '05', icon: Search, label: "ACTION HUB", mode: InteractionMode.ACTION_HUB },
              ].map((tool) => (
                <button
                  key={tool.label}
                  onClick={() => setCurrentMode(tool.mode)}
                  className={cn(
                    "w-full text-left p-4 border-2 border-black font-black flex justify-between items-center transition-all bold-shadow-hover",
                    currentMode === tool.mode ? "bg-black text-white" : "bg-white hover:bg-slate-50"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[10px] opacity-50">{tool.id}</span>
                    {tool.label}
                  </span>
                  <ArrowRight size={18} strokeWidth={3} />
                </button>
              ))}
            </nav>

            {/* Pro Tip */}
            <div className="p-6 bg-orange-100 border-2 border-black bold-shadow">
              <p className="text-[10px] font-bold uppercase mb-2">Pro Tip</p>
              <p className="text-xs leading-relaxed font-bold">
                Carry one of 12 approved ID proofs if you don't have your EPIC card yet.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row relative">
            <div className="absolute top-0 right-0 p-4 lg:p-12 text-[120px] lg:text-[240px] font-black text-slate-100 select-none leading-none pointer-events-none z-0">
                VOTE
            </div>

            <div className="relative z-10 flex-1 grid grid-cols-12 overflow-y-auto lg:overflow-hidden">
                {/* Chat Section */}
                <div className={cn(
                    "p-4 lg:p-10 flex flex-col min-h-[600px] lg:h-full transition-all duration-300",
                    currentMode === InteractionMode.GENERAL ? "col-span-12" : "col-span-12 lg:col-span-7"
                )}>
                    <div className="mb-6 lg:mb-12">
                        <h1 className="text-4xl lg:text-7xl font-black leading-[0.85] tracking-tighter mb-4">
                            YOUR VOTING<br />CONSULTANT.
                        </h1>
                        <div className="flex items-center gap-4">
                        <span className="bg-black text-white px-4 py-1 font-bold text-xs uppercase letter-spacing-1">Interactive System</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-h-0 bold-border-heavy bold-shadow bg-white">
                        <ChatInterface 
                            messages={messages} 
                            onSendMessage={handleSendMessage} 
                            isLoading={isLoading}
                            detectedPersona={detectedPersona}
                        />
                    </div>
                </div>

                {/* Tool Detail Section */}
                <AnimatePresence>
                    {currentMode !== InteractionMode.GENERAL && (
                        <motion.div 
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            className="col-span-12 lg:col-span-5 p-4 lg:p-10 bg-white lg:border-l-4 border-black border-t-4 lg:border-t-0 overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black uppercase italic">Tools: {currentMode.replace('_', ' ')}</h3>
                                <button 
                                    onClick={() => setCurrentMode(InteractionMode.GENERAL)}
                                    className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {currentMode === InteractionMode.JOURNEY_SIMULATOR && (
                                    <JourneySimulator 
                                        currentStage={journeyStage} 
                                        onNext={() => setJourneyStage(s => Math.min(s + 1, 5))} 
                                    />
                                )}
                                {currentMode === InteractionMode.CIVIC_QUIZ && (
                                    <CivicQuiz 
                                        questions={DUMMY_QUIZ} 
                                        onComplete={(score) => setCivicScore(score)} 
                                    />
                                )}
                                {currentMode === InteractionMode.TIMELINE_BUILDER && (
                                    <TimelineBuilder events={messages.find(m => m.mode === InteractionMode.TIMELINE_BUILDER)?.metadata?.events} />
                                )}
                                {currentMode === InteractionMode.ACTION_HUB && (
                                    <ActionHub />
                                )}
                                {civicScore !== null && currentMode === InteractionMode.CIVIC_QUIZ && (
                                    <div className="p-8 border-4 border-black bg-orange-500 text-white text-center bold-shadow">
                                        <p className="text-xl font-black">Score: {civicScore}%</p>
                                        <p className="text-xs uppercase font-bold mt-1">READINESS CERTIFIED</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t-4 border-black bg-black text-white flex items-center px-4 lg:px-8 justify-between text-[10px] font-bold tracking-widest uppercase shrink-0">
        <div className="hidden sm:flex gap-8">
          <span>Neutrality: Certified</span>
          <span>Last Update: 14:32 IST</span>
        </div>
        <div>CivicSence &copy; 2026 • Built for Democracy</div>
      </footer>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden" 
                />
                <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    className="fixed inset-y-0 left-0 w-[85%] bg-white z-[70] lg:hidden flex flex-col border-r-4 border-black"
                >
                    <div className="p-6 border-b-4 border-black flex justify-between items-center">
                        <span className="text-2xl font-black italic">CIVICSENCE</span>
                        <button onClick={() => setIsSidebarOpen(false)}>
                            <X size={24} strokeWidth={3} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                        <nav className="space-y-4">
                            {[
                                { label: "01 JOURNEY", mode: InteractionMode.JOURNEY_SIMULATOR },
                                { label: "02 MYTH BUSTER", mode: InteractionMode.GENERAL },
                                { label: "03 CIVIC QUIZ", mode: InteractionMode.CIVIC_QUIZ },
                                { label: "04 TIMELINE", mode: InteractionMode.TIMELINE_BUILDER },
                                { label: "05 ACTION HUB", mode: InteractionMode.ACTION_HUB },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => { setCurrentMode(item.mode); setIsSidebarOpen(false); }}
                                    className="w-full text-left p-4 border-2 border-black font-black hover:bg-black hover:text-white transition-all flex justify-between items-center"
                                >
                                    {item.label}
                                    <ArrowRight size={18} strokeWidth={3} />
                                </button>
                            ))}
                        </nav>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
