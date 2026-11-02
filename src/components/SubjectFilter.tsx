import React from 'react';
import { SubjectId, SubjectMeta } from '../types';
import { SUBJECTS } from '../data/pastQuestions';
import { Search, Filter, BookOpen, Layers } from 'lucide-react';

interface SubjectFilterProps {
  selectedSubject: SubjectId | 'all';
  onSelectSubject: (subject: SubjectId | 'all') => void;
  selectedYear: number | 'all';
  onSelectYear: (year: number | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableYears: number[];
  totalQuestionsCount: number;
}

export const SubjectFilter: React.FC<SubjectFilterProps> = ({
  selectedSubject,
  onSelectSubject,
  selectedYear,
  onSelectYear,
  searchQuery,
  onSearchChange,
  availableYears,
  totalQuestionsCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-8 space-y-5">
      {/* Search and Year bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search questions by topic, keyword (e.g. 'fractions', 'digestive', 'antonym')..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1 py-0.5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Year Filter Segment */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Year:
          </span>
          <button
            onClick={() => onSelectYear('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedYear === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            All Years
          </button>
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => onSelectYear(year)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedYear === year
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Filter Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Select Approved Subject ({totalQuestionsCount} questions)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSelectSubject('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              selectedSubject === 'all'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Approved Subjects
          </button>

          {SUBJECTS.map((sub: SubjectMeta) => {
            const isSelected = selectedSubject === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubject(sub.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
