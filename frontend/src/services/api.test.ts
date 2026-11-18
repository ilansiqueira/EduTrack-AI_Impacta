import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  resolveAuthUrl,
  resolveSubjectsUrl,
  resolveTasksUrl,
  apiRequest,
  setUnauthorizedHandler,
  ApiError,
} from './api';

describe('Xano API URL resolution and error handling', () => {
  afterEach(() => {
    setUnauthorizedHandler(null);
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
});
