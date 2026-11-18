import type { AcademicTask, Subject, User } from '../types/models';

export interface EnvConfig {
  VITE_XANO_AUTH_BASE_URL?: string;
  VITE_XANO_SUBJECTS_BASE_URL?: string;
  VITE_XANO_TASKS_BASE_URL?: string;
  VITE_XANO_API_BASE_URL?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function getEnv(override?: EnvConfig): EnvConfig {
  if (override) return override;
  return {
    VITE_XANO_AUTH_BASE_URL: import.meta.env.VITE_XANO_AUTH_BASE_URL,
    VITE_XANO_SUBJECTS_BASE_URL: import.meta.env.VITE_XANO_SUBJECTS_BASE_URL,
    VITE_XANO_TASKS_BASE_URL: import.meta.env.VITE_XANO_TASKS_BASE_URL,
    VITE_XANO_API_BASE_URL: import.meta.env.VITE_XANO_API_BASE_URL,
  };
}

export function isInvalidOrPlaceholderUrl(url?: string): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  return trimmed.includes('your-instance') || trimmed.includes('api:example');
}

export function isApiConfigured(override?: EnvConfig): boolean {
  const env = getEnv(override);
  const authBase = env.VITE_XANO_AUTH_BASE_URL || env.VITE_XANO_API_BASE_URL;
  return !isInvalidOrPlaceholderUrl(authBase);
}

export function resolveAuthUrl(path: string, override?: EnvConfig): string {
  const env = getEnv(override);
  const rawBase = (env.VITE_XANO_AUTH_BASE_URL || env.VITE_XANO_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (isInvalidOrPlaceholderUrl(rawBase)) return '';

  let cleanPath = path.replace(/^\/+/, '');
  if (rawBase.endsWith('/auth') && cleanPath.startsWith('auth/')) {
    cleanPath = cleanPath.slice(5);
  }
  return cleanPath ? `${rawBase}/${cleanPath}` : rawBase;
}

export function resolveSubjectsUrl(path: string = '', override?: EnvConfig): string {
  const env = getEnv(override);
  const rawBase = (env.VITE_XANO_SUBJECTS_BASE_URL || env.VITE_XANO_API_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (isInvalidOrPlaceholderUrl(rawBase)) return '';

  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  if (rawBase.endsWith('/subjects')) {
    return cleanPath ? `${rawBase}/${cleanPath}` : rawBase;
  }
  return cleanPath ? `${rawBase}/subjects/${cleanPath}` : `${rawBase}/subjects`;
}

export function resolveTasksUrl(
  path: string = '',
  subjectId?: number | null,
  override?: EnvConfig
): string {
  const env = getEnv(override);
  const rawBase = (env.VITE_XANO_TASKS_BASE_URL || env.VITE_XANO_API_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (isInvalidOrPlaceholderUrl(rawBase)) return '';

  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const baseWithGroup = rawBase.endsWith('/academic_tasks')
    ? cleanPath
      ? `${rawBase}/${cleanPath}`
      : rawBase
    : cleanPath
      ? `${rawBase}/academic_tasks/${cleanPath}`
      : `${rawBase}/academic_tasks`;

  if (subjectId !== undefined && subjectId !== null) {
    return `${baseWithGroup}?subject_id=${encodeURIComponent(String(subjectId))}`;
  }
  return baseWithGroup;
}

export function buildHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  notifyOnUnauthorized?: boolean;
}

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  if (!url) {
    throw new ApiError(
      'URL da API Xano não configurada. Defina as variáveis VITE_XANO_* no ambiente.',
      0
    );
  }

  const { method = 'GET', body, token, notifyOnUnauthorized = true } = options;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(token),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Erro desconhecido';
    throw new ApiError(`Falha na conexão com o servidor: ${detail}`, 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && notifyOnUnauthorized && unauthorizedHandler) {
      unauthorizedHandler();
    }
    const message =
      parsed && typeof parsed === 'object' && 'message' in parsed && typeof parsed.message === 'string'
        ? parsed.message
        : typeof parsed === 'string' && parsed
          ? parsed
          : `Erro HTTP ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return parsed as T;
}

// ============================================================================
// Auth API
// ============================================================================

export interface AuthTokenResponse {
  authToken?: string;
  token?: string;
  access_token?: string;
  user_id?: number;
}

export function extractAuthToken(resp: AuthTokenResponse): string | null {
  return resp.authToken || resp.token || resp.access_token || null;
}

export async function loginApi(email: string, password: string): Promise<{ token: string; userId?: number }> {
  const url = resolveAuthUrl('auth/login');
  const data = await apiRequest<AuthTokenResponse>(url, {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
    notifyOnUnauthorized: false,
  });
  const token = extractAuthToken(data);
  if (!token) {
    throw new ApiError('Token de autenticação não retornado pela API.', 500);
  }
  return { token, userId: data.user_id };
}

export async function signupApi(
  name: string,
  email: string,
  password: string
): Promise<{ token: string | null; userId?: number }> {
  const url = resolveAuthUrl('auth/signup');
  const data = await apiRequest<AuthTokenResponse>(url, {
    method: 'POST',
    body: { name: name.trim(), email: email.trim().toLowerCase(), password },
    notifyOnUnauthorized: false,
  });
  return { token: extractAuthToken(data), userId: data.user_id };
}

export async function getCurrentUserApi(token: string): Promise<User> {
  const url = resolveAuthUrl('auth/me');
  return apiRequest<User>(url, { method: 'GET', token });
}

// ============================================================================
// Subjects API
// ============================================================================

export interface SubjectInput {
  name: string;
  teacher?: string | null;
  hours?: number | null;
}

export async function fetchSubjectsApi(token: string): Promise<Subject[]> {
  const url = resolveSubjectsUrl();
  const data = await apiRequest<Subject[]>(url, { method: 'GET', token });
  return Array.isArray(data) ? data : [];
}

export async function createSubjectApi(input: SubjectInput, token: string): Promise<Subject> {
  const url = resolveSubjectsUrl();
  const payload: Record<string, unknown> = { name: input.name.trim() };
  if (input.teacher && input.teacher.trim()) {
    payload.teacher = input.teacher.trim();
  }
  if (input.hours !== undefined && input.hours !== null && !Number.isNaN(Number(input.hours))) {
    payload.hours = Number(input.hours);
  }
  return apiRequest<Subject>(url, { method: 'POST', body: payload, token });
}

export async function updateSubjectApi(
  subjectId: number,
  fields: Partial<SubjectInput>,
  token: string
): Promise<Subject> {
  const url = resolveSubjectsUrl(String(subjectId));
  const payload: Record<string, unknown> = {};
  if (fields.name !== undefined) payload.name = fields.name.trim();
  if (fields.teacher !== undefined) payload.teacher = fields.teacher ? fields.teacher.trim() : null;
  if (fields.hours !== undefined) payload.hours = fields.hours !== null ? Number(fields.hours) : null;
  return apiRequest<Subject>(url, { method: 'PATCH', body: payload, token });
}

export async function deleteSubjectApi(subjectId: number, token: string): Promise<void> {
  const url = resolveSubjectsUrl(String(subjectId));
  await apiRequest<unknown>(url, { method: 'DELETE', token });
}

// ============================================================================
// Academic Tasks API
// ============================================================================

export interface AcademicTaskInput {
  title: string;
  subject_id: number;
  description?: string | null;
  due_date?: string | null;
  status?: string;
}

export async function fetchAcademicTasksApi(
  token: string,
  subjectId?: number | null
): Promise<AcademicTask[]> {
  const url = resolveTasksUrl('', subjectId);
  const data = await apiRequest<AcademicTask[]>(url, { method: 'GET', token });
  return Array.isArray(data) ? data : [];
}

export async function createAcademicTaskApi(
  input: AcademicTaskInput,
  token: string
): Promise<AcademicTask> {
  const url = resolveTasksUrl();
  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    subject_id: Number(input.subject_id),
    status: input.status?.trim() || 'pending',
  };
  if (input.description && input.description.trim()) {
    payload.description = input.description.trim();
  }
  if (input.due_date) {
    payload.due_date = input.due_date;
  }
  return apiRequest<AcademicTask>(url, { method: 'POST', body: payload, token });
}

export async function updateAcademicTaskApi(
  taskId: number,
  fields: Partial<AcademicTaskInput>,
  token: string
): Promise<AcademicTask> {
  const url = resolveTasksUrl(String(taskId));
  const payload: Record<string, unknown> = {};
  if (fields.title !== undefined) payload.title = fields.title.trim();
  if (fields.subject_id !== undefined) payload.subject_id = Number(fields.subject_id);
  if (fields.description !== undefined) {
    payload.description = fields.description ? fields.description.trim() : '';
  }
  if (fields.due_date !== undefined) payload.due_date = fields.due_date || null;
  if (fields.status !== undefined) payload.status = fields.status;
  return apiRequest<AcademicTask>(url, { method: 'PATCH', body: payload, token });
}

export async function deleteAcademicTaskApi(taskId: number, token: string): Promise<void> {
  const url = resolveTasksUrl(String(taskId));
  await apiRequest<unknown>(url, { method: 'DELETE', token });
}
