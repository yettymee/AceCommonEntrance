import React from 'react';
import { Sparkles, Clock, BookOpen, PenTool } from 'lucide-react';

interface HeroBannerProps {
  onStartPracticing: () => void;
  onStartMockExam: () => void;
  onOpenCustomSolver: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onStartPracticing,
  onStartMockExam,
  onOpenCustomSolver,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white mb-8 border border-slate-800 shadow-lg">
      {/* Background illustration */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_entrance_prep_1793133305125.jpg"
          alt="Kids happily learning and solving common entrance past questions"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity filter blur-xs"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-4xl space-y-6">
        {/* Unboxed natural kicker */}
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
          <span>National Common Entrance Examination (NCEE) & State Prep</span>
          <span aria-hidden="true">·</span>
          <span>Ages 9–12 / Grades 5–6</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-white leading-tight">
          Solve Common Entrance Past Questions with Step-by-Step Confidence
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          Solve real exam questions across all approved subjects—Mathematics, English Language, Quantitative Aptitude, Verbal Aptitude, Basic Science & Technology, and Social Studies. Learn with friendly explanations, built-in rough work pad, and AI tutor support.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onStartPracticing}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            <span>Start Practice Questions</span>
          </button>

          <button
            onClick={onStartMockExam}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold rounded-xl text-sm transition-all backdrop-blur-xs border border-white/10"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Take Timed Mock Exam</span>
          </button>

          <button
            onClick={onOpenCustomSolver}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-950" />
            <span>Solve Any Question with AI</span>
          </button>
        </div>

        {/* Quantitative Rigor Strip */}
        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="font-mono text-lg font-bold text-white">7 Subjects</div>
            <div className="text-slate-400">All Approved Curriculums</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-amber-400">100% Step-by-Step</div>
            <div className="text-slate-400">No Memorization Shortcuts</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-white">Digital Scratchpad</div>
            <div className="text-slate-400">For Math & Quant Rough Work</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-emerald-400">Printable Badges</div>
            <div className="text-slate-400">Score & Readiness Certificates</div>
          </div>
        </div>
      </div>
    </div>
  );
};
