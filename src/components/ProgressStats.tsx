import React from 'react';
import { UserProgress } from '../types';
import { SUBJECTS } from '../data/pastQuestions';
import { Award, Zap, CheckCircle2, RotateCcw, Target } from 'lucide-react';

interface ProgressStatsProps {
  progress: UserProgress;
  onResetProgress: () => void;
  onSelectSubjectToDrill: (subjectId: string) => void;
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({
  progress,
  onResetProgress,
  onSelectSubjectToDrill,
}) => {
  const totalAttempted = progress.solvedQuestionIds.length;
  const totalCorrect = progress.correctQuestionIds.length;
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Candidate Study Progress & Subject Mastery
        </h2>
        <p className="text-sm text-slate-600">
          Track question accuracy, consistency streak, and areas for quick revision.
        </p>
      </div>

      {/* Top metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempted</div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{totalAttempted}</div>
          <div className="text-[11px] text-slate-400">Total past questions</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Correct</div>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono">{totalCorrect}</div>
          <div className="text-[11px] text-slate-400">Solved accurately</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accuracy</div>
          <div className="text-3xl font-extrabold text-indigo-600 font-mono">{accuracy}%</div>
          <div className="text-[11px] text-slate-400">Overall success rate</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Streak</div>
          <div className="text-3xl font-extrabold text-amber-500 font-mono flex items-center justify-center gap-1">
            <Zap className="w-6 h-6 fill-amber-500 text-amber-500" />
            <span>{progress.streakDays}</span>
          </div>
          <div className="text-[11px] text-slate-400">Consecutive days</div>
        </div>
      </div>

      {/* Subject by subject mastery cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Subject Mastery Breakdown
          </h3>
          <span className="text-xs text-slate-500">Click a subject to practice questions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUBJECTS.map((sub) => {
            const stat = progress.subjectStats[sub.id] || { attempted: 0, correct: 0 };
            const subAccuracy = stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0;

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubjectToDrill(sub.id)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{sub.name}</span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {stat.correct}/{stat.attempted} ({subAccuracy}%)
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      subAccuracy >= 75 ? 'bg-emerald-500' : subAccuracy >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${stat.attempted > 0 ? subAccuracy : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{sub.topics.length} Syllabus topics</span>
                  <span className="font-semibold text-indigo-600 hover:underline">Practice Now →</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Data is securely saved in your browser storage.</span>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset your study progress?')) {
                onResetProgress();
              }
            }}
            className="flex items-center gap-1 text-rose-600 hover:text-rose-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>
    </div>
  );
};
