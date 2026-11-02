import React, { useState, useEffect, useMemo } from 'react';
import { SubjectId, UserProgress } from './types';
import { PAST_QUESTIONS, SUBJECTS } from './data/pastQuestions';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { SubjectFilter } from './components/SubjectFilter';
import { QuestionCard } from './components/QuestionCard';
import { Scratchpad } from './components/Scratchpad';
import { CustomQuestionSolverModal } from './components/CustomQuestionSolverModal';
import { MockExamView } from './components/MockExamView';
import { ProgressStats } from './components/ProgressStats';
import { BookOpen, BookmarkCheck, Sparkles, HelpCircle, GraduationCap } from 'lucide-react';

const STORAGE_KEY = 'ace_common_entrance_progress_v1';

const defaultProgress: UserProgress = {
  solvedQuestionIds: [],
  correctQuestionIds: [],
  bookmarkedQuestionIds: [],
  subjectStats: {
    mathematics: { attempted: 0, correct: 0 },
    english: { attempted: 0, correct: 0 },
    quantitative: { attempted: 0, correct: 0 },
    verbal: { attempted: 0, correct: 0 },
    science: { attempted: 0, correct: 0 },
    'social-studies': { attempted: 0, correct: 0 },
    vocational: { attempted: 0, correct: 0 },
  },
  streakDays: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'browse' | 'mock-exam' | 'bookmarks' | 'stats'>('browse');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadTitle, setScratchpadTitle] = useState('Rough Work Scratchpad');
  const [isCustomSolverOpen, setIsCustomSolverOpen] = useState(false);

  // User Progress
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load progress from localStorage');
    }
    return defaultProgress;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage');
    }
  }, [progress]);

  // Update streak on day change
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (progress.lastActiveDate !== today) {
      const last = new Date(progress.lastActiveDate);
      const now = new Date(today);
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setProgress((prev) => ({
        ...prev,
        lastActiveDate: today,
        streakDays: diffDays === 1 ? prev.streakDays + 1 : 1,
      }));
    }
  }, []);

  const handleToggleBookmark = (questionId: string) => {
    setProgress((prev) => {
      const exists = prev.bookmarkedQuestionIds.includes(questionId);
      const updated = exists
        ? prev.bookmarkedQuestionIds.filter((id) => id !== questionId)
        : [...prev.bookmarkedQuestionIds, questionId];
      return { ...prev, bookmarkedQuestionIds: updated };
    });
  };

  const handleRecordAnswer = (questionId: string, subjectId: SubjectId, isCorrect: boolean) => {
    setProgress((prev) => {
      const isNewSolved = !prev.solvedQuestionIds.includes(questionId);
      const isNewCorrect = isCorrect && !prev.correctQuestionIds.includes(questionId);

      const subCurrent = prev.subjectStats[subjectId] || { attempted: 0, correct: 0 };
      const updatedSub = {
        attempted: isNewSolved ? subCurrent.attempted + 1 : subCurrent.attempted,
        correct: isNewCorrect ? subCurrent.correct + 1 : subCurrent.correct,
      };

      return {
        ...prev,
        solvedQuestionIds: isNewSolved ? [...prev.solvedQuestionIds, questionId] : prev.solvedQuestionIds,
        correctQuestionIds: isNewCorrect ? [...prev.correctQuestionIds, questionId] : prev.correctQuestionIds,
        subjectStats: {
          ...prev.subjectStats,
          [subjectId]: updatedSub,
        },
      };
    });
  };

  const handleResetProgress = () => {
    setProgress(defaultProgress);
  };

  const openScratchpadWithCustomTitle = (title: string) => {
    setScratchpadTitle(title);
    setIsScratchpadOpen(true);
  };

  // Available exam years in the question dataset
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(PAST_QUESTIONS.map((q) => q.year))).sort((a, b) => b - a);
    return years;
  }, []);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return PAST_QUESTIONS.filter((q) => {
      // Subject filter
      if (selectedSubject !== 'all' && q.subjectId !== selectedSubject) {
        return false;
      }
      // Year filter
      if (selectedYear !== 'all' && q.year !== selectedYear) {
        return false;
      }
      // Search query (matches topic, questionText, or passageText)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inQuestion = q.questionText.toLowerCase().includes(query);
        const inTopic = q.topic.toLowerCase().includes(query);
        const inPassage = q.passageText ? q.passageText.toLowerCase().includes(query) : false;
        if (!inQuestion && !inTopic && !inPassage) return false;
      }
      return true;
    });
  }, [selectedSubject, selectedYear, searchQuery]);

  // Bookmarked questions list
  const bookmarkedQuestions = useMemo(() => {
    return PAST_QUESTIONS.filter((q) => progress.bookmarkedQuestionIds.includes(q.id));
  }, [progress.bookmarkedQuestionIds]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navigation Bar with strict Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCustomSolver={() => setIsCustomSolverOpen(true)}
        onOpenScratchpad={() => openScratchpadWithCustomTitle('Rough Work Scratchpad')}
        bookmarkedCount={progress.bookmarkedQuestionIds.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: BROWSE PAST QUESTIONS */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <HeroBanner
              onStartPracticing={() => {
                const el = document.getElementById('questions-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onStartMockExam={() => setActiveTab('mock-exam')}
              onOpenCustomSolver={() => setIsCustomSolverOpen(true)}
            />

            {/* Filter controls */}
            <div id="questions-section">
              <SubjectFilter
                selectedSubject={selectedSubject}
                onSelectSubject={setSelectedSubject}
                selectedYear={selectedYear}
                onSelectYear={setSelectedYear}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                availableYears={availableYears}
                totalQuestionsCount={filteredQuestions.length}
              />
            </div>

            {/* Questions list */}
            {filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                {filteredQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    isBookmarked={progress.bookmarkedQuestionIds.includes(q.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onRecordAnswer={handleRecordAnswer}
                    onOpenScratchpadWithTitle={openScratchpadWithCustomTitle}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No past questions matched your filter</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing the search query or selecting "All Approved Subjects" to view the full question bank.
                </p>
                <button
                  onClick={() => {
                    setSelectedSubject('all');
                    setSelectedYear('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TIMED MOCK EXAM */}
        {activeTab === 'mock-exam' && (
          <MockExamView
            onOpenScratchpad={openScratchpadWithCustomTitle}
            onRecordAnswer={handleRecordAnswer}
          />
        )}

        {/* TAB 3: BOOKMARKED REVISION QUESTIONS */}
        {activeTab === 'bookmarks' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold font-display text-slate-900">
                  Revision List ({bookmarkedQuestions.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Questions saved for further study, review, and extra drill practice
                </p>
              </div>
            </div>

            {bookmarkedQuestions.length > 0 ? (
              <div className="space-y-4">
                {bookmarkedQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    isBookmarked={true}
                    onToggleBookmark={handleToggleBookmark}
                    onRecordAnswer={handleRecordAnswer}
                    onOpenScratchpadWithTitle={openScratchpadWithCustomTitle}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <BookmarkCheck className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Your revision list is empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  While solving questions in the Past Questions Bank, click the bookmark icon to save tricky questions here.
                </p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                >
                  Go to Past Questions Bank
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY PROGRESS & MASTERY */}
        {activeTab === 'stats' && (
          <ProgressStats
            progress={progress}
            onResetProgress={handleResetProgress}
            onSelectSubjectToDrill={(subId) => {
              setSelectedSubject(subId as SubjectId);
              setActiveTab('browse');
            }}
          />
        )}
      </main>

      {/* Global Interactive Rough-Work Scratchpad Modal */}
      <Scratchpad
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        title={scratchpadTitle}
      />

      {/* Custom Question Solver Modal */}
      <CustomQuestionSolverModal
        isOpen={isCustomSolverOpen}
        onClose={() => setIsCustomSolverOpen(false)}
        onOpenScratchpad={() => openScratchpadWithCustomTitle('Rough Work Scratchpad')}
      />

      {/* Quiet, clean educational footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800">AceCommonEntrance</span>
            <span>— Approved Common Entrance Curriculum Solver for Primary 5 & 6 Pupils</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Mathematics</span>
            <span>·</span>
            <span>English</span>
            <span>·</span>
            <span>Quantitative</span>
            <span>·</span>
            <span>Verbal</span>
            <span>·</span>
            <span>Science</span>
            <span>·</span>
            <span>Social Studies</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
