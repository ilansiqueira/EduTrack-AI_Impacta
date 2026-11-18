import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  resolveAuthUrl,
  resolveSubjectsUrl,
  resolveTasksUrl,
  apiRequest,
  fetchAllAcademicTasksForSubjectsApi,
  updateAcademicTaskApi,
  isNonCriticalValidationError,
  setUnauthorizedHandler,
  ApiError,
} from './api';
import {
  loadTaskGrades,
  mergeTaskWithStoredGrade,
  removeTaskGrade,
  saveTaskGrade,
} from './taskGradesStorage';

describe('Xano API URL resolution and error handling', () => {
  afterEach(() => {
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('normalizes auth URLs with or without trailing /auth', () => {
    expect(
      resolveAuthUrl('auth/login', {
        VITE_XANO_AUTH_BASE_URL: 'https://demo.xano.io/api:abc123/',
      })
    ).toBe('https://demo.xano.io/api:abc123/auth/login');

    expect(
      resolveAuthUrl('auth/me', {
        VITE_XANO_AUTH_BASE_URL: 'https://demo.xano.io/api:abc123/auth',
      })
    ).toBe('https://demo.xano.io/api:abc123/auth/me');
  });

  it('rejects placeholder example URLs cleanly', () => {
    expect(
      resolveAuthUrl('auth/login', {
        VITE_XANO_AUTH_BASE_URL: 'https://your-instance.xano.io/api:example',
      })
    ).toBe('');
  });

  it('normalizes subjects and tasks URLs with fallback to VITE_XANO_API_BASE_URL', () => {
    const env = { VITE_XANO_API_BASE_URL: 'https://demo.xano.io/api:root/' };
    expect(resolveSubjectsUrl('', env)).toBe('https://demo.xano.io/api:root/subjects');
    expect(resolveSubjectsUrl('42', env)).toBe('https://demo.xano.io/api:root/subjects/42');
    expect(resolveTasksUrl('', 7, env)).toBe(
      'https://demo.xano.io/api:root/academic_tasks?subject_id=7'
    );
  });

  it('invokes unauthorized handler on HTTP 401 when bearer token is present', async () => {
    const onUnauth = vi.fn();
    setUnauthorizedHandler(onUnauth);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: 'Invalid token' }),
      })
    );

    await expect(
      apiRequest('https://demo.xano.io/api:abc/subjects', { token: 'expired-jwt' })
    ).rejects.toThrow(ApiError);

    expect(onUnauth).toHaveBeenCalledTimes(1);
  });

  it('skips network calls when subjectIds is empty and queries scoped ?subject_id= for active subjects', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: string) => {
      if (input.includes('subject_id=1')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify([
              { id: 10, title: 'Prova 1', status: 'pending', subject_id: 1, due_date: '2026-11-25' },
              { id: 11, title: 'Lista sem prazo', status: 'pending', subject_id: 1, due_date: null },
            ]),
        };
      }
      if (input.includes('subject_id=2')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify([
              { id: 10, title: 'Prova 1', status: 'pending', subject_id: 1, due_date: '2026-11-25' },
              { id: 12, title: 'Trabalho 2', status: 'completed', subject_id: 2, due_date: '2026-11-20' },
            ]),
        };
      }
      return { ok: true, status: 200, text: async () => '[]' };
    });

    vi.stubGlobal('fetch', fetchMock);
    const env = { VITE_XANO_TASKS_BASE_URL: 'https://demo.xano.io/api:tasks' };

    const emptyResult = await fetchAllAcademicTasksForSubjectsApi('jwt', [], env);
    expect(emptyResult).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();

    const tasks = await fetchAllAcademicTasksForSubjectsApi('jwt', [1, 2, 1, 0, -5], env);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://demo.xano.io/api:tasks/academic_tasks?subject_id=1',
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://demo.xano.io/api:tasks/academic_tasks?subject_id=2',
      expect.objectContaining({ method: 'GET' })
    );
    expect(tasks.map((t) => t.id)).toEqual([12, 10, 11]);
  });

  it('always serializes subject_id on PATCH and omits null grade/weight', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ id: 5, title: 'Entrega', status: 'completed', subject_id: 3 }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const env = { VITE_XANO_TASKS_BASE_URL: 'https://demo.xano.io/api:tasks' };

    await expect(
      updateAcademicTaskApi(5, { status: 'completed' }, 'jwt', env)
    ).rejects.toThrow('Selecione uma disciplina válida para atualizar a tarefa.');
    expect(fetchMock).not.toHaveBeenCalled();

    await updateAcademicTaskApi(
      5,
      { status: 'completed', subject_id: 3, grade: null, weight: null },
      'jwt',
      env
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(String(init.body));
    expect(sentBody).toEqual({ subject_id: 3, status: 'completed' });
    expect('grade' in sentBody).toBe(false);
    expect('weight' in sentBody).toBe(false);
  });

  it('preserves rawMessage and param on translated Xano validation errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            code: 'ERROR_CODE_INPUT_ERROR',
            message: 'Value is less than the minimum value of 1',
            payload: { param: 'subject_id' },
          }),
      })
    );

    let caught: unknown = null;
    try {
      await apiRequest('https://demo.xano.io/api:tasks/academic_tasks', { token: 'jwt' });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiError);
    const apiErr = caught as ApiError;
    expect(apiErr.status).toBe(400);
    expect(apiErr.message).toBe('Selecione uma disciplina válida para a tarefa.');
    expect(apiErr.rawMessage).toBe('Value is less than the minimum value of 1');
    expect(apiErr.param).toBe('subject_id');
    expect(isNonCriticalValidationError(apiErr)).toBe(true);
  });
});

describe('Hybrid local task grades storage', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => {
        store.set(key, String(val));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('preserves saved grades when Xano omits or returns null grade, and removes cleanly', () => {
    saveTaskGrade(42, 9.5, 2);
    expect(loadTaskGrades()['42']).toEqual({ grade: 9.5, weight: 2 });

    const hydrated = mergeTaskWithStoredGrade({
      id: 42,
      title: 'Seminar',
      status: 'completed',
      subject_id: 1,
      grade: null,
    });
    expect(hydrated.grade).toBe(9.5);
    expect(hydrated.weight).toBe(2);

    const serverWins = mergeTaskWithStoredGrade({
      id: 42,
      title: 'Seminar',
      status: 'completed',
      subject_id: 1,
      grade: 8,
      weight: 3,
    });
    expect(serverWins.grade).toBe(8);
    expect(serverWins.weight).toBe(3);
    expect(loadTaskGrades()['42']).toEqual({ grade: 8, weight: 3 });

    removeTaskGrade(42);
    expect(loadTaskGrades()['42']).toBeUndefined();
  });
});
