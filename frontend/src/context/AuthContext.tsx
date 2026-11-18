import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '../types/models';
import {
  getCurrentUserApi,
  loginApi,
  setUnauthorizedHandler,
  signupApi,
  ApiError,
} from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: (reasonMessage?: string) => void;
}

const TOKEN_STORAGE_KEY = 'edutrack_auth_token';
const USER_STORAGE_KEY = 'edutrack_auth_user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [initializing, setInitializing] = useState<boolean>(() => Boolean(token));

  const persistSession = useCallback((nextToken: string | null, nextUser: User | null) => {
    setToken(nextToken);
    setUser(nextUser);
    try {
      if (nextToken) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      if (nextUser) {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const logout = useCallback(
    (reasonMessage?: string) => {
      persistSession(null, null);
      if (reasonMessage) {
        showToast(reasonMessage, 'info');
      }
    },
    [persistSession, showToast]
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      persistSession(null, null);
      showToast('Sua sessão expirou. Faça login novamente para continuar.', 'error');
    });
    return () => setUnauthorizedHandler(null);
  }, [persistSession, showToast]);

  // Hydrate profile via auth/me on initial load if a saved token exists
  useEffect(() => {
    let active = true;
    if (!token) {
      setInitializing(false);
      return;
    }

    (async () => {
      try {
        const me = await getCurrentUserApi(token);
        if (active) {
          persistSession(token, me);
        }
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          persistSession(null, null);
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [token, persistSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: newToken } = await loginApi(email, password);
      let resolvedUser: User = {
        email: email.trim().toLowerCase(),
        name: email.split('@')[0] || 'Estudante',
      };
      try {
        resolvedUser = await getCurrentUserApi(newToken);
      } catch {
        // fallback to basic user metadata if auth/me fails transiently
      }
      persistSession(newToken, resolvedUser);
      showToast(`Bem-vindo(a), ${resolvedUser.name}!`, 'success');
    },
    [persistSession, showToast]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const { token: newToken } = await signupApi(name, email, password);
      let activeToken = newToken;
      if (!activeToken) {
        const logged = await loginApi(email, password);
        activeToken = logged.token;
      }
      let resolvedUser: User = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      };
      try {
        resolvedUser = await getCurrentUserApi(activeToken);
      } catch {
        // fallback to submitted profile
      }
      persistSession(activeToken, resolvedUser);
      showToast('Conta criada com sucesso!', 'success');
    },
    [persistSession, showToast]
  );

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const me = await getCurrentUserApi(token);
    persistSession(token, me);
    showToast('Dados do perfil sincronizados com sucesso!', 'success');
  }, [token, persistSession, showToast]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        initializing,
        isAuthenticated: Boolean(token),
        login,
        signup,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
