import React, { useState } from 'react';
import { SubjectId, AISolveResult } from '../types';
import { SUBJECTS } from '../data/pastQuestions';
import { X, Sparkles, Loader2, BookOpen, CheckCircle2, AlertTriangle, Lightbulb, PenTool } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomQuestionSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScratchpad: () => void;
}

export const CustomQuestionSolverModal: React.FC<CustomQuestionSolverModalProps> = ({
  isOpen,
  onClose,
  onOpenScratchpad,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('mathematics');
  const [questionText, setQuestionText] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [solveMode, setSolveMode] = useState<'step-by-step' | 'explain-like-ten' | 'quick-check'>('step-by-step');

  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<AISolveResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setSolution(null);

    // Parse options if provided
    const optionsArray = optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const subjectMeta = SUBJECTS.find((s) => s.id === selectedSubject);

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText.trim(),
          subject: subjectMeta?.name || 'Mathematics',
          options: optionsArray,
          solveMode,
        }),
      });

      if (!res.ok) {
        throw new Error('Could not solve question. Please verify connection.');
      }

      const data = await res.json();
      setSolution(data);
      try {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.6 },
        });
      } catch (err) {}
    } catch (err: any) {
      console.error('Error solving custom question:', err);
      setErrorMessage(err.message || 'Failed to solve question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions: Record<SubjectId, { q: string; opts: string }> = {
    mathematics: {
      q: 'A man is 4 times as old as his son. In 10 years time, the sum of their ages will be 70 years. How old is the son now?',
      opts: 'A) 8 years\nB) 10 years\nC) 12 years\nD) 15 years\nE) 20 years',
    },
    english: {
      q: 'Choose the word that correctly completes the sentence: "The children were warned not to play _______ the heavy rain."',
      opts: 'A) inside\nB) under\nC) in\nD) upon\nE) by',
    },
    quantitative: {
      q: 'If 2 # 3 = 13 and 4 # 1 = 17, what is the value of 5 # 3?',
      opts: 'A) 34\nB) 30\nC) 28\nD) 15\nE) 40',
    },
    verbal: {
      q: 'Find the odd word out: Sparrow, Eagle, Ostrich, Hawk, Falcon.',
      opts: 'A) Sparrow\nB) Eagle\nC) Ostrich\nD) Hawk\nE) Falcon',
    },
    science: {
      q: 'What is the boiling point of pure water at standard atmospheric pressure in degrees Celsius?',
      opts: 'A) 0°C\nB) 50°C\nC) 100°C\nD) 120°C\nE) 212°C',
    },
    'social-studies': {
      q: 'Which branch of government is responsible for making laws in a democratic country?',
      opts: 'A) The Judiciary\nB) The Legislature\nC) The Executive\nD) The Civil Service\nE) The Police',
    },
    vocational: {
      q: 'Which of the following is a cutting tool used for harvesting cereal crops like rice and wheat?',
      opts: 'A) Hoe\nB) Sickle\nC) Spade\nD) Rake\nE) Pickaxe',
    },
  };

  const loadSample = (subId: SubjectId) => {
    setSelectedSubject(subId);
    setQuestionText(sampleQuestions[subId].q);
    setOptionsText(sampleQuestions[subId].opts);
    setSolution(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-indigo-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display leading-tight">
                Common Entrance Past Question Solver
              </h2>
              <p className="text-xs text-indigo-200">
                Type or paste any past question from your exam booklet or homework
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick preset samples */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-500 whitespace-nowrap">Try Sample:</span>
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSample(s.id)}
                className={`px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap transition-colors ${
                  selectedSubject === s.id
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {s.shortName}
              </button>
            ))}
          </div>

          <form onSubmit={handleSolve} className="space-y-4">
            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Approved Subject:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectId)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Question Prompt:
                </label>
                <button
                  type="button"
                  onClick={onOpenScratchpad}
                  className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-medium"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Open Scratchpad for Rough Work
                </button>
              </div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. Find the simple interest on ₦40,000 for 3 years at 5% per annum..."
                rows={3}
                required
                className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {/* Options (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Multiple-Choice Options (Optional, one per line):
              </label>
              <textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="A) ₦6,000&#10;B) ₦8,000&#10;C) ₦5,500&#10;D) ₦12,000&#10;E) ₦4,000"
                rows={3}
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Solver Style */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Explanation Style:</span>
                <button
                  type="button"
                  onClick={() => setSolveMode('step-by-step')}
                  className={`px-2.5 py-1 rounded-lg border ${
                    solveMode === 'step-by-step'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Step-by-Step
                </button>
                <button
                  type="button"
                  onClick={() => setSolveMode('explain-like-ten')}
                  className={`px-2.5 py-1 rounded-lg border ${
                    solveMode === 'explain-like-ten'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Explain for 10-Year-Old
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !questionText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Teacher Ayo is solving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Solve Step-by-Step</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Solution Output */}
          {solution && (
            <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-emerald-100 text-emerald-800 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Solution & Explanation
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Answer: {solution.correctOption}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                {solution.shortSummary}
              </p>

              {/* Numbered Steps */}
              <div className="space-y-3">
                {solution.steps.map((st, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-800 font-mono text-[11px]">
                        {st.stepNumber || i + 1}
                      </span>
                      <span>{st.title}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-7">
                      {st.explanation}
                    </p>
                    {st.calculationOrFormula && (
                      <div className="ml-7 mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900">
                        {st.calculationOrFormula}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Key Concept & Memory Tip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Key Concept
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{solution.keyConcept}</p>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    Kid Pro Tip
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{solution.kidTip}</p>
                </div>
              </div>

              {/* Trap Analysis */}
              {solution.whyOthersAreWrong && solution.whyOthersAreWrong.length > 0 && (
                <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-rose-800">Why common mistakes happen:</span>
                  <ul className="space-y-1 text-slate-700 mt-1">
                    {solution.whyOthersAreWrong.map((t, idx) => (
                      <li key={idx}>
                        <strong>{t.option}:</strong> {t.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
