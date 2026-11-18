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
}

export interface ProgressMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  progressPercentage: number;
}
