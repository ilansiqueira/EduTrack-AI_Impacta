import type { AcademicTask } from '../types/models';

export interface StoredTaskGrade {
  grade: number;
  weight: number;
}

export type TaskGradesMap = Record<string, StoredTaskGrade>;

const TASK_GRADES_KEY = 'edutrack_task_grades';

function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function loadTaskGrades(): TaskGradesMap {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(TASK_GRADES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as TaskGradesMap;
  } catch {
    return {};
  }
}

function writeTaskGrades(map: TaskGradesMap): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(TASK_GRADES_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota / privacy mode errors gracefully
  }
}

export function saveTaskGrade(taskId: number, grade: number, weight: number = 1): void {
  const numericGrade = Number(grade);
  const numericWeight = Number(weight);
  if (!Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > 10) return;

  const validWeight = Number.isFinite(numericWeight) && numericWeight > 0 ? numericWeight : 1;
  const map = loadTaskGrades();
  map[String(taskId)] = {
    grade: numericGrade,
    weight: validWeight,
  };
  writeTaskGrades(map);
}

export function removeTaskGrade(taskId: number): void {
  const map = loadTaskGrades();
  const key = String(taskId);
  if (key in map) {
    delete map[key];
    writeTaskGrades(map);
  }
}

export function mergeTaskWithStoredGrade(task: AcademicTask): AcademicTask {
  const hasServerGrade =
    task.grade !== null &&
    task.grade !== undefined &&
    Number.isFinite(Number(task.grade));

  if (hasServerGrade) {
    const normalizedGrade = Number(task.grade);
    const normalizedWeight =
      task.weight !== null &&
      task.weight !== undefined &&
      Number.isFinite(Number(task.weight)) &&
      Number(task.weight) > 0
        ? Number(task.weight)
        : 1;
    saveTaskGrade(task.id, normalizedGrade, normalizedWeight);
    return {
      ...task,
      grade: normalizedGrade,
      weight: normalizedWeight,
    };
  }

  const stored = loadTaskGrades()[String(task.id)];
  if (stored && Number.isFinite(stored.grade)) {
    return {
      ...task,
      grade: stored.grade,
      weight: stored.weight > 0 ? stored.weight : 1,
    };
  }

  return task;
}
