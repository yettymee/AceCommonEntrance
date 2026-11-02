import React, { useState } from 'react';
import { Question, SubjectId, AISolveResult } from '../types';
import { SUBJECTS } from '../data/pastQuestions';
import {
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Sparkles,
  PenTool,
  Send,
  Loader2,
  AlertTriangle,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuestionCardProps {
  question: Question;
  isBookmarked: boolean;
  onToggleBookmark: (questionId: string) => void;
  onRecordAnswer: (questionId: string, subjectId: SubjectId, isCorrect: boolean) => void;
  onOpenScratchpadWithTitle?: (title: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isBookmarked,
  onToggleBookmark,
  onRecordAnswer,
  onOpenScratchpadWithTitle,
}) => {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // AI Tutor & Solver state
  const [isSolvingAI, setIsSolvingAI] = useState(false);
  const [aiSolution, setAiSolution] = useState<AISolveResult | null>(null);
  const [tutorQuery, setTutorQuery] = useState('');
  const [isAskingTutor, setIsAskingTutor] = useState(false);
  const [tutorConversation, setTutorConversation] = useState<{ role: 'kid' | 'tutor'; text: string }[]>([]);

  // Similar practice question state
  const [similarQuestion, setSimilarQuestion] = useState<{
    question: string;
    options: string[];
    correctAnswer: string;
    topic?: string;
    hint: string;
    explanation: string;
  } | null>(null);
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);
  const [similarSelected, setSimilarSelected] = useState<string | null>(null);
  const [showSimilarResult, setShowSimilarResult] = useState(false);

  const subject = SUBJECTS.find((s) => s.id === question.subjectId) || SUBJECTS[0];

  const handleSelectOption = (letter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (selectedOption !== null) return; // Prevent multiple clicks on practice
    setSelectedOption(letter);
    const isCorrect = letter === question.correctAnswer;
    onRecordAnswer(question.id, question.subjectId, isCorrect);

    if (isCorrect) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#4f46e5', '#f59e0b', '#10b981'],
        });
      } catch (err) {
        // ignore if canvas-confetti fails
      }
    }
    // Auto-reveal solution so kids learn immediately
    setShowSolution(true);
  };

  // Text to speech readout
  const handleToggleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();

    let fullSpeech = `${subject.name}. Year ${question.year}. Question ${question.questionNumber}. `;
    if (question.passageText) {
      fullSpeech += `Story passage: ${question.passageText}. `;
    }
    fullSpeech += `${question.questionText}. `;
    fullSpeech += `Option A: ${question.options.find((o) => o.letter === 'A')?.text || ''}. `;
    fullSpeech += `Option B: ${question.options.find((o) => o.letter === 'B')?.text || ''}. `;
    fullSpeech += `Option C: ${question.options.find((o) => o.letter === 'C')?.text || ''}. `;
    fullSpeech += `Option D: ${question.options.find((o) => o.letter === 'D')?.text || ''}. `;
    if (question.options.some((o) => o.letter === 'E')) {
      fullSpeech += `Option E: ${question.options.find((o) => o.letter === 'E')?.text || ''}. `;
    }

    const utterance = new SpeechSynthesisUtterance(fullSpeech);
    utterance.rate = 0.95; // Slightly slower, clear pace for kids
    utterance.pitch = 1.05;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // Request deep AI breakdown from Teacher Ayo
  const handleSolveWithAI = async () => {
    setIsSolvingAI(true);
    setShowSolution(true);
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.questionText,
          subject: subject.name,
          options: question.options.map((o) => `${o.letter}) ${o.text}`),
          selectedAnswer: selectedOption ? `${selectedOption}) ${question.options.find((o) => o.letter === selectedOption)?.text}` : undefined,
          correctAnswer: `${question.correctAnswer}) ${question.options.find((o) => o.letter === question.correctAnswer)?.text}`,
          solveMode: 'step-by-step',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSolution(data);
      }
    } catch (err) {
      console.error('Error fetching AI solve:', err);
    } finally {
      setIsSolvingAI(false);
    }
  };

  // Ask Teacher Ayo a question
  const handleAskTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorQuery.trim() || isAskingTutor) return;

    const queryText = tutorQuery.trim();
    setTutorQuery('');
    setTutorConversation((prev) => [...prev, { role: 'kid', text: queryText }]);
    setIsAskingTutor(true);

    try {
      const res = await fetch('/api/ask-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionContext: question.questionText,
          studentQuery: queryText,
          subject: subject.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTutorConversation((prev) => [
          ...prev,
          { role: 'tutor', text: data.reply || 'Great question! Keep working step by step.' },
        ]);
      }
    } catch (err) {
      console.error('Error asking tutor:', err);
      setTutorConversation((prev) => [
        ...prev,
        { role: 'tutor', text: 'Let’s check our steps again! Remember to write down each number clearly.' },
      ]);
    } finally {
      setIsAskingTutor(false);
    }
  };

  // Generate similar practice question
  const handleGenerateSimilar = async () => {
    setIsGeneratingSimilar(true);
    setSimilarSelected(null);
    setShowSimilarResult(false);
    try {
      const res = await fetch('/api/generate-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.name,
          topic: question.topic,
          difficulty: question.difficulty,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimilarQuestion(data);
      }
    } catch (err) {
      console.error('Error generating similar question:', err);
    } finally {
      setIsGeneratingSimilar(false);
    }
  };

  const activeSteps = aiSolution ? aiSolution.steps : question.standardSolution.steps;
  const activeKeyConcept = aiSolution ? aiSolution.keyConcept : question.standardSolution.keyConcept;
  const activeKidTip = aiSolution ? aiSolution.kidTip : question.standardSolution.kidTip;
  const activeTraps = aiSolution?.whyOthersAreWrong || question.standardSolution.whyOthersAreWrong || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden mb-6">
      {/* Question Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-800">{subject.name}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 font-medium">{question.year} NCEE</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">Q.{question.questionNumber}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{question.topic}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Read aloud button */}
          <button
            onClick={handleToggleReadAloud}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              isPlayingAudio
                ? 'bg-amber-100 text-amber-800 animate-pulse'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
            title={isPlayingAudio ? 'Stop reading' : 'Read question aloud'}
          >
            {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlayingAudio ? 'Stop' : 'Read Aloud'}</span>
          </button>

          {/* Rough work scratchpad */}
          <button
            onClick={() =>
              onOpenScratchpadWithTitle?.(
                `Rough Work: Q${question.questionNumber} (${question.topic})`
              )
            }
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
            title="Open scratchpad for this question"
          >
            <PenTool className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Rough Work</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onToggleBookmark(question.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
            }`}
            title={isBookmarked ? 'Remove from revision list' : 'Save for revision'}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Reading Comprehension Story Box (if applicable) */}
        {question.passageText && (
          <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl space-y-2 text-slate-800 text-sm leading-relaxed">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read the story passage carefully:</span>
            </div>
            <p className="italic font-serif">{question.passageText}</p>
          </div>
        )}

        {/* Question Prompt */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
            {question.questionText}
          </h3>
        </div>

        {/* Multiple Choice Options Grid */}
        <div className="grid grid-cols-1 gap-2.5">
          {question.options.map((opt) => {
            const isSelected = selectedOption === opt.letter;
            const isCorrect = opt.letter === question.correctAnswer;
            const hasAnswered = selectedOption !== null;

            let optionStyle = 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-800';

            if (hasAnswered) {
              if (isCorrect) {
                optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'border-rose-400 bg-rose-50 text-rose-950 ring-1 ring-rose-400';
              } else {
                optionStyle = 'border-slate-200 bg-white opacity-60 text-slate-500';
              }
            } else if (isSelected) {
              optionStyle = 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-1 ring-indigo-600';
            }

            return (
              <button
                key={opt.letter}
                onClick={() => handleSelectOption(opt.letter)}
                disabled={hasAnswered}
                className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left text-sm font-medium transition-all ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      hasAnswered && isCorrect
                        ? 'bg-emerald-600 text-white'
                        : hasAnswered && isSelected && !isCorrect
                        ? 'bg-rose-600 text-white'
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt.letter}
                  </span>
                  <span className="text-sm sm:text-base leading-snug">{opt.text}</span>
                </div>

                {hasAnswered && (
                  <div className="shrink-0 ml-3">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Correct
                      </span>
                    ) : isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Selected
                      </span>
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Result Feedback Banner */}
        {selectedOption !== null && (
          <div
            className={`p-3.5 rounded-xl text-sm flex items-center justify-between gap-3 ${
              selectedOption === question.correctAnswer
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {selectedOption === question.correctAnswer ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Superb! You nailed it. Option {question.correctAnswer} is right.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    The correct answer is <strong>Option {question.correctAnswer}</strong>. Let's see the step-by-step working!
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => setShowSolution(!showSolution)}
              className="text-xs font-bold underline hover:no-underline whitespace-nowrap"
            >
              {showSolution ? 'Hide Working' : 'View Working'}
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>{showSolution ? 'Hide Step-by-Step Solution' : 'Show Step-by-Step Solution'}</span>
            </button>

            <button
              onClick={handleSolveWithAI}
              disabled={isSolvingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              {isSolvingAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Solving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Explain with Teacher Ayo</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleGenerateSimilar}
            disabled={isGeneratingSimilar}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors ml-auto"
          >
            {isGeneratingSimilar ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Making practice question...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Practice Similar Question</span>
              </>
            )}
          </button>
        </div>

        {/* Step-by-Step Solution Panel */}
        {showSolution && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                  ★
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Step-by-Step Solution Breakdown
                </h4>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Correct: Option {question.correctAnswer}
              </span>
            </div>

            {/* Steps list */}
            <div className="space-y-3">
              {activeSteps.map((step: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-800 font-mono text-[11px]">
                      {step.stepNumber || idx + 1}
                    </span>
                    <span>{step.title}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pl-7">
                    {step.explanation}
                  </p>
                  {(step.mathWork || step.calculationOrFormula) && (
                    <div className="ml-7 mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900">
                      {step.mathWork || step.calculationOrFormula}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Key Concept & Memory Tip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Key Rule / Concept
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{activeKeyConcept}</p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Kid Exam Hall Tip
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{activeKidTip}</p>
              </div>
            </div>

            {/* Common Traps (Why other options are wrong) */}
            {activeTraps.length > 0 && (
              <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl space-y-1.5 text-xs">
                <span className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Examiner Traps to Avoid
                </span>
                <ul className="space-y-1 text-slate-700">
                  {activeTraps.map((trap: any, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">·</span>
                      <span>
                        <strong>{trap.option}:</strong> {trap.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ask Teacher Ayo Interactive Question Box */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Still stuck? Ask Teacher Ayo about this question:
                </span>
              </div>

              {/* Chat thread if any */}
              {tutorConversation.length > 0 && (
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                  {tutorConversation.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl text-xs ${
                        msg.role === 'kid'
                          ? 'bg-indigo-100 text-indigo-900 ml-6'
                          : 'bg-white border border-slate-200 text-slate-800 mr-6'
                      }`}
                    >
                      <div className="font-bold mb-0.5 text-[11px] text-slate-500">
                        {msg.role === 'kid' ? 'You asked:' : 'Teacher Ayo:'}
                      </div>
                      <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAskTutor} className="flex gap-2">
                <input
                  type="text"
                  value={tutorQuery}
                  onChange={(e) => setTutorQuery(e.target.value)}
                  placeholder="e.g., 'Why did we multiply by 1/2?' or 'Explain like I am 8'"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!tutorQuery.trim() || isAskingTutor}
                  className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 transition-colors"
                >
                  {isAskingTutor ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Ask</span>
                      <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Live Similar Practice Question Drill */}
        {similarQuestion && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Extra Practice Drill (Topic: {similarQuestion.topic})
              </span>
              <button
                onClick={() => setSimilarQuestion(null)}
                className="text-xs text-amber-700 hover:text-amber-900 font-medium"
              >
                Close Drill
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-900">{similarQuestion.question}</p>

            <div className="grid grid-cols-1 gap-2">
              {similarQuestion.options.map((optStr, idx) => {
                const letter = optStr.charAt(0);
                const isCorrect = optStr.trim().startsWith(similarQuestion.correctAnswer.charAt(0));
                const isPicked = similarSelected === letter;

                let optClass = 'bg-white border-amber-200 text-slate-800 hover:bg-amber-100/40';
                if (showSimilarResult) {
                  if (isCorrect) optClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                  else if (isPicked) optClass = 'bg-rose-50 border-rose-400 text-rose-900';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSimilarSelected(letter);
                      setShowSimilarResult(true);
                      if (isCorrect) {
                        confetti({ particleCount: 30, spread: 50 });
                      }
                    }}
                    disabled={showSimilarResult}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium flex items-center justify-between ${optClass}`}
                  >
                    <span>{optStr}</span>
                    {showSimilarResult && isCorrect && (
                      <span className="text-emerald-700 font-bold">✓ Right</span>
                    )}
                  </button>
                );
              })}
            </div>

            {showSimilarResult && (
              <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-amber-900">Explanation:</p>
                <p>{similarQuestion.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
