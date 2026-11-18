import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AcademicTask, CanonicalTaskStatus, ProgressMetrics, Subject } from '../types/models';
import {
  createAcademicTaskApi,
  createSubjectApi,
  deleteAcademicTaskApi,
  deleteSubjectApi,
  fetchAllAcademicTasksForSubjectsApi,
  fetchSubjectsApi,
  isNonCriticalValidationError,
  updateAcademicTaskApi,
  updateSubjectApi,
  type AcademicTaskInput,
  type SubjectInput,
} from '../services/api';
import {
  mergeTaskWithStoredGrade,
  removeTaskGrade,
  saveTaskGrade,
} from '../services/taskGradesStorage';
import { computeProgressMetrics } from '../utils/progress';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface AcademicContextValue {
  subjects: Subject[];
  tasks: AcademicTask[];
  loading: boolean;
  error: string | null;
  metrics: ProgressMetrics;
  subjectMap: Map<number, Subject>;
  refreshAll: (silent?: boolean) => Promise<void>;
  addSubject: (input: SubjectInput) => Promise<Subject>;
  editSubject: (id: number, fields: Partial<SubjectInput>) => Promise<Subject>;
  removeSubject: (id: number) => Promise<void>;
  addTask: (input: AcademicTaskInput) => Promise<AcademicTask>;
  editTask: (id: number, fields: Partial<AcademicTaskInput>) => Promise<AcademicTask>;
  setTaskStatus: (id: number, nextStatus: CanonicalTaskStatus) => Promise<void>;
  gradeTask: (id: number, grade: number | null, weight?: number) => Promise<void>;
  removeTask: (id: number) => Promise<void>;
}

const AcademicContext = createContext<AcademicContextValue | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(
    async (silent: boolean = false) => {
      if (!token) {
        setSubjects([]);
        setTasks([]);
        return;
      }
      if (!silent) setLoading(true);
      setError(null);
      try {
        // 1) Fetch subjects first — they're needed to validate tasks
        const loadedSubjects = await fetchSubjectsApi(token);
        setSubjects(loadedSubjects);

        // 2) Fetch tasks scoped by each enrolled subject_id >= 1
        if (loadedSubjects.length > 0) {
          try {
            const loadedTasks = await fetchAllAcademicTasksForSubjectsApi(
              token,
              loadedSubjects.map((s) => s.id)
            );
            setTasks(loadedTasks.map(mergeTaskWithStoredGrade));
          } catch (taskErr) {
            // Xano validation errors (e.g. "minimum value of 1") degrade gracefully
            if (isNonCriticalValidationError(taskErr)) {
              setTasks([]);
            } else {
              throw taskErr;
            }
          }
        } else {
          setTasks([]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar dados acadêmicos.';
        setError(msg);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (isAuthenticated && token) {
      void refreshAll(false);
    } else {
      setSubjects([]);
      setTasks([]);
      setError(null);
    }
  }, [isAuthenticated, token, refreshAll]);

  const addSubject = useCallback(
    async (input: SubjectInput) => {
      if (!token) throw new Error('Sessão não autenticada.');
      const created = await createSubjectApi(input, token);
      setSubjects((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      showToast(`Disciplina "${created.name}" cadastrada!`, 'success');
      return created;
    },
    [token, showToast]
  );

  const editSubject = useCallback(
    async (id: number, fields: Partial<SubjectInput>) => {
      if (!token) throw new Error('Sessão não autenticada.');
      const updated = await updateSubjectApi(id, fields, token);
      setSubjects((prev) =>
        prev
          .map((item) => (item.id === id ? { ...item, ...updated } : item))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      showToast('Disciplina atualizada com sucesso!', 'success');
      return updated;
    },
    [token, showToast]
  );

  const removeSubject = useCallback(
    async (id: number) => {
      if (!token) throw new Error('Sessão não autenticada.');
      await deleteSubjectApi(id, token);
      setSubjects((prev) => prev.filter((item) => item.id !== id));
      showToast('Disciplina removida.', 'info');
    },
    [token, showToast]
  );

  const addTask = useCallback(
    async (input: AcademicTaskInput) => {
      if (!token) throw new Error('Sessão não autenticada.');
      const created = await createAcademicTaskApi(input, token);
      let resolvedTask = mergeTaskWithStoredGrade(created);
      if (input.grade !== undefined && input.grade !== null) {
        const numericGrade = Number(input.grade);
        const numericWeight =
          input.weight !== undefined && input.weight !== null && Number(input.weight) > 0
            ? Number(input.weight)
            : 1;
        saveTaskGrade(created.id, numericGrade, numericWeight);
        resolvedTask = { ...created, grade: numericGrade, weight: numericWeight };
      }
      setTasks((prev) => [...prev, resolvedTask]);
      showToast(`Tarefa "${resolvedTask.title}" adicionada!`, 'success');
      return resolvedTask;
    },
    [token, showToast]
  );

  const editTask = useCallback(
    async (id: number, fields: Partial<AcademicTaskInput>) => {
      if (!token) throw new Error('Sessão não autenticada.');
      const existing = tasks.find((t) => t.id === id);
      const subjectId = fields.subject_id ?? existing?.subject_id;
      const updated = await updateAcademicTaskApi(id, { ...fields, subject_id: subjectId }, token);

      let resolvedTask: AcademicTask;
      if (fields.grade === null) {
        removeTaskGrade(id);
        resolvedTask = { ...updated, grade: null, weight: fields.weight ?? null };
      } else if (fields.grade !== undefined) {
        const numericGrade = Number(fields.grade);
        const numericWeight =
          fields.weight !== undefined && fields.weight !== null && Number(fields.weight) > 0
            ? Number(fields.weight)
            : existing?.weight ?? 1;
        saveTaskGrade(id, numericGrade, numericWeight);
        resolvedTask = { ...updated, grade: numericGrade, weight: numericWeight };
      } else {
        resolvedTask = mergeTaskWithStoredGrade(updated);
      }

      setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, ...resolvedTask } : item)));
      showToast('Tarefa atualizada!', 'success');
      return resolvedTask;
    },
    [token, tasks, showToast]
  );

  const setTaskStatus = useCallback(
    async (id: number, nextStatus: CanonicalTaskStatus) => {
      if (!token) throw new Error('Sessão não autenticada.');
      const existing = tasks.find((t) => t.id === id);
      const previous = tasks;
      // Optimistic update for instant feedback
      setTasks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
      );
      try {
        const updated = await updateAcademicTaskApi(
          id,
          { status: nextStatus, subject_id: existing?.subject_id },
          token
        );
        const merged = mergeTaskWithStoredGrade(updated);
        setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, ...merged } : item)));
      } catch (err) {
        setTasks(previous);
        const msg = err instanceof Error ? err.message : 'Falha ao atualizar status da tarefa.';
        showToast(msg, 'error');
        throw err;
      }
    },
    [token, tasks, showToast]
  );

  const gradeTask = useCallback(
    async (id: number, grade: number | null, weight: number = 1) => {
      if (!token) throw new Error('Sessão não autenticada.');
      if (grade === null) return;
      const existing = tasks.find((t) => t.id === id);
      const normalizedWeight = Number(weight) > 0 ? Number(weight) : 1;

      try {
        saveTaskGrade(id, grade, normalizedWeight);
        const updated = await updateAcademicTaskApi(
          id,
          {
            subject_id: existing?.subject_id,
            status: existing?.status || 'completed',
            grade,
            weight: normalizedWeight,
          },
          token
        );
        setTasks((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, ...updated, grade, weight: normalizedWeight } : item
          )
        );
        showToast(`Nota ${grade} registrada!`, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao salvar nota.';
        showToast(msg, 'error');
        throw err;
      }
    },
    [token, tasks, showToast]
  );

  const removeTask = useCallback(
    async (id: number) => {
      if (!token) throw new Error('Sessão não autenticada.');
      await deleteAcademicTaskApi(id, token);
      removeTaskGrade(id);
      setTasks((prev) => prev.filter((item) => item.id !== id));
      showToast('Tarefa excluída.', 'info');
    },
    [token, showToast]
  );

  const metrics = useMemo(() => computeProgressMetrics(tasks), [tasks]);
  const subjectMap = useMemo(() => {
    const map = new Map<number, Subject>();
    for (const s of subjects) {
      map.set(s.id, s);
    }
    return map;
  }, [subjects]);

  return (
    <AcademicContext.Provider
      value={{
        subjects,
        tasks,
        loading,
        error,
        metrics,
        subjectMap,
        refreshAll,
        addSubject,
        editSubject,
        removeSubject,
        addTask,
        editTask,
        setTaskStatus,
        gradeTask,
        removeTask,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export function useAcademic(): AcademicContextValue {
  const ctx = useContext(AcademicContext);
  if (!ctx) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return ctx;
}
