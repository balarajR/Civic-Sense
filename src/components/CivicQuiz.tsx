import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, CheckCircle2, XCircle, Award, RefreshCw } from 'lucide-react';
import { QuizQuestion } from '../types';
import { cn } from '../lib/utils';

interface CivicQuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export default function CivicQuiz({ questions, onComplete }: CivicQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return <div className="p-8 text-center font-bold">No questions available.</div>;
  }

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === currentQuestion.correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      onComplete(Math.round((score / questions.length) * 100));
    }
  };

  if (showResult) {
    const finalScore = Math.round((score / questions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-10 bg-white border-4 border-black bold-shadow space-y-8"
      >
        <div className="w-24 h-24 bg-orange-500 border-2 border-black flex items-center justify-center mx-auto bold-shadow">
          <Award size={48} strokeWidth={3} className="text-black" />
        </div>
        <div>
          <h3 className="text-3xl font-black uppercase italic leading-tight">Civic Readiness: {finalScore}%</h3>
          <p className="text-sm font-bold opacity-60 mt-2 uppercase tracking-wide">
            {finalScore === 100 ? "Master Citizen status achieved." : "Voter training in progress."}
          </p>
        </div>
        <button 
            onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setShowResult(false);
                setSelectedOption(null);
                setIsAnswered(false);
            }}
            className="w-full bg-black text-white py-4 font-black uppercase text-sm bold-shadow-hover transition-all"
        >
            RESTART_SIMULATION ↻
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white border-4 border-black overflow-hidden bold-shadow">
      <div className="p-4 bg-black flex justify-between items-center text-[10px] font-black text-white uppercase tracking-widest leading-none">
        <span>UNIT {currentIndex + 1} / {questions.length}</span>
        <span className="text-orange-500">ACCURACY: {score}/{questions.length}</span>
      </div>

      <div className="p-8">
        <h3 className="text-xl font-black mb-8 leading-tight italic uppercase">
          {currentQuestion.question}
        </h3>

        <div className="space-y-4">
          {currentQuestion.options.map((option, idx) => {
            const isCorrect = idx === currentQuestion.correctIndex;
            const isSelected = idx === selectedOption;
            
            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(idx)}
                className={cn(
                  "w-full p-4 text-left text-sm font-bold uppercase rounded-none border-2 transition-all flex items-center justify-between",
                  !isAnswered && "border-black bg-white hover:bg-slate-50 hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                  isAnswered && isCorrect && "bg-emerald-500 border-black text-black",
                  isAnswered && isSelected && !isCorrect && "bg-red-500 border-black text-black",
                  isAnswered && !isCorrect && !isSelected && "opacity-30 border-black grayscale"
                )}
              >
                <span>{option}</span>
                {isAnswered && isCorrect && <CheckCircle2 size={20} strokeWidth={3} />}
                {isAnswered && isSelected && !isCorrect && <XCircle size={20} strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-8 pt-8 border-t-2 border-black"
            >
              <div className="bg-slate-100 p-5 border-l-4 border-orange-500 text-xs font-bold leading-relaxed text-black italic">
                {currentQuestion.explanation}
              </div>
              <button
                onClick={handleNext}
                className="w-full mt-6 bg-black text-white py-4 font-black uppercase text-sm bold-shadow-hover shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                {currentIndex === questions.length - 1 ? "FINISH_MODULE" : "NEXT_CHALLENGE →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
