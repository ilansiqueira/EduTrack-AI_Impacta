import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Hash,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Badge, Button, Card } from '../components/ui/Primitives';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);

  const initials = (user?.name || 'Estudante')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleSync = async () => {
    setSyncing(true);
    try {
      await refreshProfile();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Meu Perfil & Sessão
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gerencie suas informações autenticadas no Xano e preferências visuais do workspace.
        </p>
      </div>

      {/* Main Profile Hero Card */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-brand-600/15 via-indigo-500/10 to-sky-500/15 dark:from-brand-500/20 dark:via-indigo-500/15 dark:to-sky-500/10" />

        <div className="relative flex flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-xl font-bold text-white shadow-md">
              {initials || 'ED'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {user?.name || 'Estudante'}
                </h2>
                <Badge tone="emerald">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sessão Ativa
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {user?.email || 'E-mail não informado'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              loading={syncing}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={handleSync}
            >
              Sincronizar dados
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={() => logout('Você saiu da sua conta.')}
            >
              Sair da conta
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <UserIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              Nome Completo
            </div>
            <p className="mt-1.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.name || 'Estudante'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Mail className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              E-mail Vinculado
            </div>
            <p className="mt-1.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.email || '-'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Hash className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              ID de Usuário (Xano)
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.id ?? 'Sincronizado'}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              Perfil de Acesso
            </div>
            <p className="mt-1.5 capitalize text-sm font-semibold text-slate-900 dark:text-slate-100">
              {user?.role || 'Aluno'}
            </p>
          </div>
        </div>
      </Card>

      {/* Theme Preferences Card */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Aparência da Interface
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Escolha o tema visual que preferir para suas sessões de estudo. A preferência fica salva neste navegador.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition ${
              theme === 'light'
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-500/10'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Modo Claro</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alto contraste em superfícies claras
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition ${
              theme === 'dark'
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-500/10'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Modo Escuro</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conforto visual para estudos noturnos
              </p>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
};
