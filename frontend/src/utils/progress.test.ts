import { describe, it, expect } from 'vitest';
import { computeProgressMetrics, computeGradeMetrics, getGradeBadgeTone, normalizeTaskStatus, isTaskOverdue, formatDateBR } from './progress';
import type { AcademicTask } from '../types/models';

describe('Progress calculation and status normalization', () => {
  it('handles empty task arrays without division-by-zero', () => {
    const metrics = computeProgressMetrics([]);
    expect(metrics).toEqual({
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      progressPercentage: 0,
    });
  });

  it('normalizes English and Portuguese task statuses accurately', () => {
    expect(normalizeTaskStatus('completed')).toBe('completed');
    expect(normalizeTaskStatus('Concluída')).toBe('completed');
    expect(normalizeTaskStatus('concluida')).toBe('completed');
    expect(normalizeTaskStatus('in_progress')).toBe('in_progress');
    expect(normalizeTaskStatus('Em Andamento')).toBe('in_progress');
    expect(normalizeTaskStatus('pending')).toBe('pending');
    expect(normalizeTaskStatus('')).toBe('pending');
  });

  it('calculates completion percentages and overdue tasks accurately', () => {
    const tasks: AcademicTask[] = [
      { id: 1, title: 'T1', status: 'completed', subject_id: 1, due_date: '2026-10-01' },
      { id: 2, title: 'T2', status: 'concluída', subject_id: 1, due_date: '2026-10-10' },
      { id: 3, title: 'T3', status: 'in_progress', subject_id: 1, due_date: '2026-10-15' },
      { id: 4, title: 'T4', status: 'pending', subject_id: 2, due_date: '2026-12-20' },
    ];

    const metrics = computeProgressMetrics(tasks, '2026-11-17');
    expect(metrics.totalTasks).toBe(4);
    expect(metrics.completedTasks).toBe(2);
    expect(metrics.inProgressTasks).toBe(1);
    expect(metrics.pendingTasks).toBe(1);
    expect(metrics.overdueTasks).toBe(1); // T3 is past 2026-11-17 and not completed
    expect(metrics.progressPercentage).toBe(50);
  });

  it('formats YYYY-MM-DD dates in Brazilian format without timezone shift', () => {
    expect(formatDateBR('2026-11-17')).toBe('17/11/2026');
    expect(formatDateBR(null)).toBe('Sem prazo');
    expect(
      isTaskOverdue({ id: 9, title: 'Late', status: 'pending', subject_id: 1, due_date: '2026-01-01' }, '2026-11-17')
    ).toBe(true);
  });
});


describe('Grade metrics', () => {
  it('returns zero metrics for tasks without grades', () => {
    const tasks: AcademicTask[] = [
      { id: 1, title: 'T1', status: 'completed', subject_id: 1 },
      { id: 2, title: 'T2', status: 'pending', subject_id: 1 },
    ];
    const gm = computeGradeMetrics(tasks);
    expect(gm.gradedTasks).toBe(0);
    expect(gm.weightedAverage).toBe(0);
  });

  it('computes weighted average correctly', () => {
    const tasks: AcademicTask[] = [
      { id: 1, title: 'Prova', status: 'completed', subject_id: 1, grade: 8, weight: 3 },
      { id: 2, title: 'Trabalho', status: 'completed', subject_id: 1, grade: 6, weight: 1 },
      { id: 3, title: 'Pendente', status: 'pending', subject_id: 1, grade: null },
    ];
    const gm = computeGradeMetrics(tasks);
    expect(gm.gradedTasks).toBe(2);
    // (8*3 + 6*1) / (3+1) = 30/4 = 7.5
    expect(gm.weightedAverage).toBe(7.5);
    expect(gm.totalWeight).toBe(4);
  });

  it('assigns correct badge tones', () => {
    expect(getGradeBadgeTone(8.5)).toBe('emerald');
    expect(getGradeBadgeTone(6.0)).toBe('amber');
    expect(getGradeBadgeTone(3.0)).toBe('rose');
  });
});
