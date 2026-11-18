import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => {
          const Icon =
            toast.variant === 'success'
              ? CheckCircle2
              : toast.variant === 'error'
                ? AlertCircle
                : Info;
          const palette =
            toast.variant === 'success'
              ? 'border-emerald-200 bg-white text-slate-900 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-slate-100'
              : toast.variant === 'error'
                ? 'border-rose-200 bg-white text-slate-900 dark:border-rose-500/30 dark:bg-slate-900 dark:text-slate-100'
                : 'border-brand-200 bg-white text-slate-900 dark:border-brand-500/30 dark:bg-slate-900 dark:text-slate-100';
          const iconColor =
            toast.variant === 'success'
              ? 'text-emerald-600 dark:text-emerald-400'
              : toast.variant === 'error'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-brand-600 dark:text-brand-400';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg backdrop-blur-md transition-all ${palette}`}
              role="status"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
              <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
