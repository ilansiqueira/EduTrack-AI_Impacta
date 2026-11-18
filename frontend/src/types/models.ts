export interface User {
  id?: number;
  name: string;
  email: string;
  role?: string;
  account_id?: number;
  created_at?: number | string;
}

export interface Subject {
  id: number;
  name: string;
  teacher?: string | null;
  hours?: number | null;
  user_id?: number;
  created_at?: number | string;
}

export type CanonicalTaskStatus = 'pending' | 'in_progress' | 'completed';

export interface AcademicTask {
  id: number;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: string;
  subject_id: number;
  user_id?: number;
  created_at?: number | string;
  grade?: number | null;
  weight?: number | null;
}

export interface ProgressMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  progressPercentage: number;
}

export interface GradeMetrics {
  gradedTasks: number;
  weightedAverage: number;
  totalWeight: number;
}

// ── Flashcards ──────────────────────────────────────────────

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
}

export interface FlashcardDeck {
  id: string;
  subjectId: number;
  subjectName: string;
  topic: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface FlashcardSession {
  deckId: string;
  results: Array<{ cardId: string; correct: boolean }>;
  score: number;
  total: number;
  completedAt: string;
}
