import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  BarChart3,
  FileDown,
  AlertTriangle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isApiConfigured } from '../services/api';
import { Button, Input } from '../components/ui/Primitives';

interface AuthPageProps {
  mode: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const { isAuthenticated, login, signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const configured = isApiConfigured();
  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setErrorMessage('Informe seu nome completo para criar a conta.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('As senhas informadas não coincidem.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Não foi possível concluir a autenticação.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-12 dark:bg-slate-950">
      {/* Left Hero Showcase Panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-800 p-12 text-white lg:col-span-6 lg:flex lg:flex-col lg:justify-between xl:p-16">
        {/* Decorative ambient glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-[28rem] w-[28rem] rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">EduTrack AI</span>
            <span className="ml-2 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-blue-100">
              Impacta
            </span>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-8 py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-blue-100 ring-1 ring-white/20 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-sky-300" />
            Workspace Acadêmico Inteligente
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Organize matérias, prazos e metas em um único lugar.
          </h1>

          <p className="text-base leading-relaxed text-blue-100/90">
            Acompanhe cada disciplina em tempo real, alterne entre visão de lista e quadro Kanban
            instantâneo, e exporte relatórios executivos de desempenho em PDF com um clique.
          </p>

          {/* Floating Preview Cards */}
          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-md">
              <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-300" />
              <p className="text-sm font-semibold">Kanban & Lista</p>
              <p className="mt-0.5 text-xs text-blue-100/80">Status ágeis sem recarregar</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-md">
              <BarChart3 className="mb-2 h-5 w-5 text-sky-300" />
              <p className="text-sm font-semibold">Métricas Vivas</p>
              <p className="mt-0.5 text-xs text-blue-100/80">Progresso real por matéria</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-md">
              <FileDown className="mb-2 h-5 w-5 text-amber-300" />
              <p className="text-sm font-semibold">Relatório PDF</p>
              <p className="mt-0.5 text-xs text-blue-100/80">Exportação instantânea</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-blue-100/75">
          <span>Innovation Lab • Faculdade Impacta</span>
          <span>Integrado ao Xano Cloud</span>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-6 xl:p-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:invisible">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">EduTrack AI</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-xs transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Alternar tema claro ou escuro"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                Modo Claro
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-600" />
                Modo Escuro
              </>
            )}
          </button>
        </div>

        <div className="mx-auto my-10 w-full max-w-md">
          {/* Mode Switch Pills */}
          <div className="mb-8 grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-900">
            <Link
              to="/login"
              className={`rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Entrar na Conta
            </Link>
            <Link
              to="/cadastro"
              className={`rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Criar Nova Conta
            </Link>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta acadêmica'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {isLogin
                ? 'Acesse suas disciplinas, tarefas e métricas salvas na nuvem.'
                : 'Comece a organizar seu semestre com acompanhamento inteligente.'}
            </p>
          </div>

          {!configured && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold">Configuração de API pendente</p>
                <p className="mt-0.5 opacity-90">
                  Defina <code className="font-mono">VITE_XANO_AUTH_BASE_URL</code>,{' '}
                  <code className="font-mono">VITE_XANO_SUBJECTS_BASE_URL</code> e{' '}
                  <code className="font-mono">VITE_XANO_TASKS_BASE_URL</code> no arquivo{' '}
                  <code className="font-mono">.env.local</code> ou no painel da Vercel.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <Input
                label="Nome completo *"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Ex: Ilan Silva Siqueira"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <Input
              label="E-mail acadêmico ou pessoal *"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Senha *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder={isLogin ? 'Digite sua senha' : 'Mínimo de 6 caracteres'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-11 pl-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2.5 my-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <Input
                label="Confirme sua senha *"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repita a senha escolhida"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                loading={submitting}
                className="w-full"
              >
                {isLogin ? 'Entrar na Plataforma' : 'Criar Minha Conta'}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? 'Ainda não tem cadastro? ' : 'Já possui uma conta? '}
            <Link
              to={isLogin ? '/cadastro' : '/login'}
              className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {isLogin ? 'Cadastre-se gratuitamente' : 'Fazer login'}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} EduTrack AI • Sessão criptografada via Bearer Token
        </p>
      </div>
    </div>
  );
};
