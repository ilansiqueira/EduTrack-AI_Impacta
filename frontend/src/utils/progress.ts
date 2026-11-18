import type { AcademicTask, CanonicalTaskStatus, GradeMetrics, ProgressMetrics } from '../types/models';

export function normalizeTaskStatus(raw?: string | null): CanonicalTaskStatus {
  const clean = String(raw ?? '')
    .trim()
    .toLowerCase();

  if (clean === 'completed' || clean === 'concluida' || clean === 'concluída' || clean === 'done') {
    return 'completed';
  }
  if (
    clean === 'in_progress' ||
    clean === 'em_andamento' ||
    clean === 'em andamento' ||
    clean === 'doing'
  ) {
    return 'in_progress';
  }
  return 'pending';
}

export function getStatusLabel(status?: string | null): string {
  const canonical = normalizeTaskStatus(status);
  if (canonical === 'completed') return 'Concluída';
  if (canonical === 'in_progress') return 'Em Andamento';
  return 'Pendente';
}

export function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isTaskOverdue(task: AcademicTask, todayIso: string = getLocalTodayIso()): boolean {
  if (normalizeTaskStatus(task.status) === 'completed') return false;
  if (!task.due_date) return false;
  const datePart = String(task.due_date).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return false;
  return datePart < todayIso;
}

export function formatDateBR(isoDate?: string | null): string {
  if (!isoDate) return 'Sem prazo';
  const clean = String(isoDate).slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return String(isoDate);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function computeProgressMetrics(
  tasks: AcademicTask[],
  todayIso: string = getLocalTodayIso()
): ProgressMetrics {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const totalTasks = safeTasks.length;

  let completedTasks = 0;
  let inProgressTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;

  for (const task of safeTasks) {
    const status = normalizeTaskStatus(task.status);
    if (status === 'completed') {
      completedTasks += 1;
    } else if (status === 'in_progress') {
      inProgressTasks += 1;
    } else {
      pendingTasks += 1;
    }

    if (isTaskOverdue(task, todayIso)) {
      overdueTasks += 1;
    }
  }

  const progressPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 1000) / 10;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    progressPercentage,
  };
}


// ── Grade helpers ───────────────────────────────────────────

export function computeGradeMetrics(tasks: AcademicTask[]): GradeMetrics {
  const graded = (Array.isArray(tasks) ? tasks : []).filter(
    (t) =>
      normalizeTaskStatus(t.status) === 'completed' &&
      t.grade !== null &&
      t.grade !== undefined &&
      !Number.isNaN(Number(t.grade))
  );

  if (graded.length === 0) {
    return { gradedTasks: 0, weightedAverage: 0, totalWeight: 0 };
  }

  let sumWG = 0;
  let sumW = 0;
  for (const t of graded) {
    const w = t.weight != null && !Number.isNaN(Number(t.weight)) ? Number(t.weight) : 1;
    sumWG += Number(t.grade!) * w;
    sumW += w;
  }

  return {
    gradedTasks: graded.length,
    weightedAverage: sumW > 0 ? Math.round((sumWG / sumW) * 100) / 100 : 0,
    totalWeight: sumW,
  };
}

export type GradeBadgeTone = 'emerald' | 'amber' | 'rose';

export function getGradeBadgeTone(avg: number): GradeBadgeTone {
  if (avg >= 7) return 'emerald';
  if (avg >= 5) return 'amber';
  return 'rose';
}
