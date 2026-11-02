export type SubjectId = 
  | 'mathematics'
  | 'english'
  | 'quantitative'
  | 'verbal'
  | 'science'
  | 'social-studies'
  | 'vocational';

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  color: string;
  bgLight: string;
  borderLight: string;
  totalAvailableQuestions: number;
  topics: string[];
}

export interface Question {
  id: string;
  subjectId: SubjectId;
  year: number;
  questionNumber: number;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
  passageText?: string; // For English comprehension
  questionText: string;
  diagramSvg?: string; // For quantitative puzzles or science diagrams
  options: {
    letter: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  standardSolution: {
    steps: {
      stepNumber: number;
      title: string;
      explanation: string;
      mathWork?: string;
    }[];
    keyConcept: string;
    kidTip: string;
    whyOthersAreWrong?: {
      option: string;
      reason: string;
    }[];
  };
}

export interface AISolveResult {
  correctOption: string;
  shortSummary: string;
  steps: {
    stepNumber: number;
    title: string;
    explanation: string;
    calculationOrFormula?: string;
  }[];
  keyConcept: string;
  kidTip: string;
  whyOthersAreWrong?: {
    option: string;
    reason: string;
  }[];
}

export interface UserProgress {
  solvedQuestionIds: string[];
  correctQuestionIds: string[];
  bookmarkedQuestionIds: string[];
  subjectStats: Record<SubjectId, { attempted: number; correct: number }>;
  streakDays: number;
  lastActiveDate: string;
}

export interface MockExamResult {
  id: string;
  timestamp: string;
  studentName: string;
  totalQuestions: number;
  totalCorrect: number;
  scorePercentage: number;
  durationSeconds: number;
  subjectBreakdown: Record<SubjectId, { total: number; correct: number }>;
}
