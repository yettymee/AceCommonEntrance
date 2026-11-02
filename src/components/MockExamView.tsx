import React, { useState, useEffect } from 'react';
import { Question, SubjectId, MockExamResult } from '../types';
import { PAST_QUESTIONS, SUBJECTS } from '../data/pastQuestions';
import {
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  Printer,
  Sparkles,
  PenTool,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MockExamViewProps {
  onOpenScratchpad: (title: string) => void;
  onRecordAnswer: (questionId: string, subjectId: SubjectId, isCorrect: boolean) => void;
}

export const MockExamView: React.FC<MockExamViewProps> = ({
  onOpenScratchpad,
  onRecordAnswer,
}) => {
  const [examState, setExamState] = useState<'setup' | 'active' | 'results'>('setup');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [studentName, setStudentName] = useState('Bright Scholar');

  // Exam session data
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);

  // Result data
  const [examResult, setExamResult] = useState<MockExamResult | null>(null);

  // Timer countdown
  useEffect(() => {
    if (examState !== 'active') return;

    if (secondsRemaining <= 0) {
      finishExam();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examState, secondsRemaining]);

  const startExam = () => {
    let pool = [...PAST_QUESTIONS];
    if (selectedSubjectFilter !== 'all') {
      pool = pool.filter((q) => q.subjectId === selectedSubjectFilter);
    }

    // Shuffle questions
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, pool.length));

    // Calculate time: 1.5 minutes per question
    const totalTime = selected.length * 90;

    setExamQuestions(selected);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedIds(new Set());
    setSecondsRemaining(totalTime);
    setTotalDurationSeconds(totalTime);
    setExamState('active');
  };

  const handleSelectAnswer = (letter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const currentQ = examQuestions[currentIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: letter,
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const finishExam = () => {
    let correctCount = 0;
    const breakdown: Record<SubjectId, { total: number; correct: number }> = {
      mathematics: { total: 0, correct: 0 },
      english: { total: 0, correct: 0 },
      quantitative: { total: 0, correct: 0 },
      verbal: { total: 0, correct: 0 },
      science: { total: 0, correct: 0 },
      'social-studies': { total: 0, correct: 0 },
      vocational: { total: 0, correct: 0 },
    };

    examQuestions.forEach((q) => {
      const chosen = userAnswers[q.id];
      const isCorrect = chosen === q.correctAnswer;
      if (isCorrect) correctCount++;

      if (breakdown[q.subjectId]) {
        breakdown[q.subjectId].total += 1;
        if (isCorrect) breakdown[q.subjectId].correct += 1;
      }

      onRecordAnswer(q.id, q.subjectId, isCorrect);
    });

    const percent = Math.round((correctCount / examQuestions.length) * 100);
    const result: MockExamResult = {
      id: `result-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      studentName: studentName.trim() || 'Candidate',
      totalQuestions: examQuestions.length,
      totalCorrect: correctCount,
      scorePercentage: percent,
      durationSeconds: totalDurationSeconds - secondsRemaining,
      subjectBreakdown: breakdown,
    };

    setExamResult(result);
    setExamState('results');

    if (percent >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- SETUP SCREEN ---
  if (examState === 'setup') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Common Entrance Timed Mock Exam
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Test your exam speed, confidence, and accuracy under real examination conditions.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Candidate / Student Name:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter student name..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Exam Subject Pool:
              </label>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value as SubjectId | 'all')}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
              >
                <option value="all">Full National Common Entrance Mock (All Subjects)</option>
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} Only
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Number of Questions:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { count: 10, label: '10 Questions', duration: '15 Mins (Quick Sprint)' },
                { count: 15, label: '15 Questions', duration: '22 Mins (Standard)' },
                { count: 20, label: '20 Questions', duration: '30 Mins (Comprehensive)' },
              ].map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setQuestionCount(opt.count)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    questionCount === opt.count
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.duration}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Exam Guidelines for Candidates:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700">
              <li>Each question has only ONE correct answer (Option A to E).</li>
              <li>You can flag difficult questions and come back to them anytime before submitting.</li>
              <li>Use the built-in Scratchpad to work out your math and quantitative questions.</li>
              <li>Your detailed subject breakdown score certificate will be generated upon completion!</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={startExam}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 active:scale-95 shadow-md transition-all"
            >
              <span>Begin Timed Mock Exam</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE EXAM SCREEN ---
  if (examState === 'active' && examQuestions.length > 0) {
    const currentQ = examQuestions[currentIndex];
    const isFlagged = flaggedIds.has(currentQ.id);
    const chosenAnswer = userAnswers[currentQ.id];
    const isLowTime = secondsRemaining < 120; // under 2 mins

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Exam Live Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Question {currentIndex + 1} of {examQuestions.length}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
              {SUBJECTS.find((s) => s.id === currentQ.subjectId)?.name || 'General'}
            </span>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${
              isLowTime
                ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Time Left: {formatTime(secondsRemaining)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenScratchpad(`Rough Work Q${currentIndex + 1}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
            >
              <PenTool className="w-3.5 h-3.5 text-amber-600" />
              <span>Scratchpad</span>
            </button>

            <button
              onClick={finishExam}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Submit Exam
            </button>
          </div>
        </div>

        {/* Question Palette Strip */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {examQuestions.map((q, idx) => {
            const isAnswered = !!userAnswers[q.id];
            const isFlag = flaggedIds.has(q.id);
            const isCurrent = currentIndex === idx;

            let btnStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            if (isCurrent) {
              btnStyle = 'ring-2 ring-indigo-600 bg-indigo-600 text-white font-bold';
            } else if (isFlag) {
              btnStyle = 'bg-amber-100 border border-amber-400 text-amber-800 font-bold';
            } else if (isAnswered) {
              btnStyle = 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-mono shrink-0 transition-all flex items-center justify-center relative ${btnStyle}`}
              >
                {idx + 1}
                {isFlag && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Question Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {currentQ.passageText && (
            <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-800 italic leading-relaxed">
              <span className="block font-bold text-sky-900 not-italic mb-1">Passage:</span>
              {currentQ.passageText}
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
              {currentQ.questionText}
            </h3>

            <button
              onClick={() => toggleFlag(currentQ.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                isFlagged
                  ? 'bg-amber-100 text-amber-800 font-bold'
                  : 'text-slate-400 hover:text-slate-700 bg-slate-50'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-600' : ''}`} />
              <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
            </button>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = chosenAnswer === opt.letter;
              return (
                <button
                  key={opt.letter}
                  onClick={() => handleSelectAnswer(opt.letter)}
                  className={`w-full flex items-center gap-3.5 p-4 rounded-xl border text-left text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-600/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-800'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    {opt.letter}
                  </span>
                  <span className="leading-snug">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < examQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finishExam}
                className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <span>Submit & View Results</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RESULTS & CERTIFICATE SCREEN ---
  if (examState === 'results' && examResult) {
    const isPass = examResult.scorePercentage >= 50;
    const isDistinction = examResult.scorePercentage >= 80;

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Results Overview Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm ${
                  isDistinction
                    ? 'bg-amber-100 text-amber-800'
                    : isPass
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Common Entrance Mock Result
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  {examResult.studentName}
                </h2>
                <p className="text-xs text-slate-500">Completed on {examResult.timestamp}</p>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
                {examResult.scorePercentage}%
              </div>
              <p className="text-xs font-semibold text-slate-600">
                {examResult.totalCorrect} of {examResult.totalQuestions} Questions Correct
              </p>
              <span
                className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${
                  isDistinction
                    ? 'bg-amber-100 text-amber-900'
                    : isPass
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-rose-100 text-rose-900'
                }`}
              >
                {isDistinction ? '★ Grade: Distinction' : isPass ? '✓ Grade: Credit Pass' : 'Needs More Practice'}
              </span>
            </div>
          </div>

          {/* Subject Breakdown Bars */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Performance by Approved Subject:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(examResult.subjectBreakdown).map(([subKey, stat]) => {
                if (stat.total === 0) return null;
                const subjectMeta = SUBJECTS.find((s) => s.id === subKey);
                const pct = Math.round((stat.correct / stat.total) * 100);

                return (
                  <div key={subKey} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-800 mb-1.5">
                      <span>{subjectMeta?.name || subKey}</span>
                      <span className="font-mono font-bold">
                        {stat.correct}/{stat.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Printable Preview Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-50/50 to-white border-2 border-amber-300 text-center space-y-3 relative overflow-hidden print:m-0">
            <div className="text-xs uppercase tracking-widest text-amber-800 font-bold">
              National Common Entrance Readiness
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
              Certificate of Accomplishment
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              This certifies that <strong>{examResult.studentName}</strong> has demonstrated academic rigor in solving approved Common Entrance past questions with an overall score of{' '}
              <strong>{examResult.scorePercentage}%</strong>.
            </p>
            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-500">
              <span>Date: {examResult.timestamp}</span>
              <span>·</span>
              <span>Common Entrance Preparation Board</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Certificate</span>
            </button>

            <button
              onClick={() => setExamState('setup')}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all ml-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake / Try Another Mock</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 font-display">
            Full Question Review with Step-by-Step Solutions:
          </h3>

          {examQuestions.map((q, idx) => {
            const userPick = userAnswers[q.id];
            const isCorrect = userPick === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border bg-white shadow-2xs space-y-3 ${
                  isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">Question {idx + 1}</span>
                  <div className="flex items-center gap-1.5">
                    {isCorrect ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Correct (+1)
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Incorrect (Picked {userPick || 'None'})
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900">{q.questionText}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt) => (
                    <div
                      key={opt.letter}
                      className={`p-2.5 rounded-lg border ${
                        opt.letter === q.correctAnswer
                          ? 'bg-emerald-50 border-emerald-400 font-semibold text-emerald-950'
                          : opt.letter === userPick
                          ? 'bg-rose-50 border-rose-300 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-bold mr-1.5">{opt.letter})</span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1 border border-slate-200">
                  <span className="font-bold text-indigo-700">How to solve:</span>
                  <p>{q.standardSolution.steps.map((s) => s.explanation).join(' ')}</p>
                  <p className="text-amber-800 font-medium">Tip: {q.standardSolution.kidTip}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
