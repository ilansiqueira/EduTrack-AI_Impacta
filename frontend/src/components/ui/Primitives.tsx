import React, { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm hover:shadow-glow border border-transparent dark:bg-brand-600 dark:hover:bg-brand-500',
    secondary:
      'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100 border border-transparent',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-transparent shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-5 py-3 text-base rounded-2xl gap-2.5',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
    </button>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft transition-colors dark:border-slate-800/90 dark:bg-slate-900 ${className}`}
  >
    {children}
  </div>
);

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'brand' | 'emerald' | 'amber' | 'rose' | 'slate';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'slate', className = '' }) => {
  const tones = {
    brand:
      'bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-400/25',
    emerald:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
    amber:
      'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25',
    rose:
      'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25',
    slate:
      'bg-slate-100 text-slate-700 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, id, className = '', ...rest }) => {
  const inputId = id || rest.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
            : 'border-slate-200 dark:border-slate-800'
        } ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, description, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-50"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Fechar janela"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/90 bg-slate-50/60 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900/40">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);
