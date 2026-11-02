import React from 'react';
import { GraduationCap, Sparkles, BookOpen, Clock, PenTool } from 'lucide-react';

interface NavbarProps {
  activeTab: 'browse' | 'mock-exam' | 'bookmarks' | 'stats';
  setActiveTab: (tab: 'browse' | 'mock-exam' | 'bookmarks' | 'stats') => void;
  onOpenCustomSolver: () => void;
  onOpenScratchpad: () => void;
  bookmarkedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCustomSolver,
  onOpenScratchpad,
  bookmarkedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => setActiveTab('browse')}
          className="flex items-center gap-2.5 text-left group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap">
              AceCommonEntrance
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('browse')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'browse'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Past Questions Bank
          </button>
          <button
            onClick={() => setActiveTab('mock-exam')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'mock-exam'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Timed Mock Exam
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'bookmarks'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Revision List {bookmarkedCount > 0 && `(${bookmarkedCount})`}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'stats'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            My Progress
          </button>
          <button
            onClick={onOpenScratchpad}
            className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 whitespace-nowrap shrink-0 transition-colors py-1"
            title="Open Rough Work Scratchpad"
          >
            <PenTool className="w-4 h-4" />
            Rough Work Pad
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCustomSolver}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Solve Any Question</span>
          </button>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-white px-2 py-2 text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-2 py-1 rounded ${activeTab === 'browse' ? 'text-indigo-600 font-bold bg-indigo-50' : ''}`}
        >
          Questions
        </button>
        <button
          onClick={() => setActiveTab('mock-exam')}
          className={`px-2 py-1 rounded ${activeTab === 'mock-exam' ? 'text-indigo-600 font-bold bg-indigo-50' : ''}`}
        >
          Mock Exam
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-2 py-1 rounded ${activeTab === 'bookmarks' ? 'text-indigo-600 font-bold bg-indigo-50' : ''}`}
        >
          Saved ({bookmarkedCount})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-2 py-1 rounded ${activeTab === 'stats' ? 'text-indigo-600 font-bold bg-indigo-50' : ''}`}
        >
          Progress
        </button>
        <button
          onClick={onOpenScratchpad}
          className="px-2 py-1 rounded text-amber-700 bg-amber-50"
        >
          Scratchpad
        </button>
      </div>
    </header>
  );
};
