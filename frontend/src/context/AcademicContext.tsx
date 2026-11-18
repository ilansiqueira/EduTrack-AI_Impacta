import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AcademicTask, CanonicalTaskStatus, ProgressMetrics, Subject } from '../types/models';
import {
  createAcademicTaskApi,
  createSubjectApi,
  deleteAcademicTaskApi,
  deleteSubjectApi,
  fetchAcademicTasksApi,
  fetchSubjectsApi,
  updateAcademicTaskApi,
  updateSubjectApi,
  type AcademicTaskInput,
  type SubjectInput,
} from '../services/api';
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
        const [loadedSubjects, loadedTasks] = await Promise.all([
          fetchSubjectsApi(token),
          fetchAcademicTasksApi(token),
        ]);
        setSubjects(loadedSubjects);
        setTasks(loadedTasks);
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
      setTasks((prev) => [...prev, created]);
      showToast(`Tarefa "${created.title}" adicionada!`, 'success');
      return created;
    },
    [token, showToast]
  );

  const editTask = useCallback(
    async (id: number, fields: Partial<AcademicTaskInput>) => {
      if (!token) throw new Error('Sessão não autenticada.');
      const updated = await updateAcademicTaskApi(id, fields, token);
      setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      showToast('Tarefa atualizada!', 'success');
      return updated;
    },
    [token, showToast]
  );

  const setTaskStatus = useCallback(
    async (id: number, nextStatus: CanonicalTaskStatus) => {
      if (!token) throw new Error('Sessão não autenticada.');
      const previous = tasks;
      // Optimistic update for instant feedback
      setTasks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
      );
      try {
        const updated = await updateAcademicTaskApi(id, { status: nextStatus }, token);
        setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      } catch (err) {
        setTasks(previous);
        const msg = err instanceof Error ? err.message : 'Falha ao atualizar status da tarefa.';
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
