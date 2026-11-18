import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  User as UserIcon,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  FileDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAcademic } from '../context/AcademicContext';
import { downloadStudentReportPdf } from '../utils/pdfReport';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { subjects, tasks, metrics } = useAcademic();
  const [mobileOpen, setMobileOpen] = useState(false);

  const openTasksCount = metrics.pendingTasks + metrics.inProgressTasks;

  const initials = (user?.name || 'Estudante')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/disciplinas',
      label: 'Disciplinas',
      icon: BookOpen,
      badge: subjects.length > 0 ? String(subjects.length) : undefined,
    },
    {
      to: '/tarefas',
      label: 'Tarefas',
      icon: CheckSquare,
      badge: openTasksCount > 0 ? String(openTasksCount) : undefined,
    },
    {
      to: '/flashcards',
      label: 'Flashcards',
      icon: Sparkles,
    },
    {
      to: '/perfil',
      label: 'Meu Perfil',
      icon: UserIcon,
    },
  ];

  const renderSidebarContent = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="space-y-7">
        {/* Brand */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                EduTrack AI
              </p>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Gestão Acadêmica
              </p>
            </div>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={onNavigate}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Semester Progress Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Rendimento Geral
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {metrics.progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.progressPercentage)}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => downloadStudentReportPdf({ student: user, subjects, tasks })}
            className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileDown className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            Baixar Relatório PDF
          </button>
        </div>
      </div>

      {/* Bottom Controls: Theme + User Profile */}
      <div className="space-y-3 border-t border-slate-200/80 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-500" />
            )}
            {theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          </span>
        </button>

        <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-slate-100/80 p-2.5 dark:bg-slate-800/60">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-xs font-bold text-white">
              {initials || 'ED'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                {user?.name || 'Estudante'}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {user?.email || 'Sessão ativa'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout('Você saiu da sua conta.')}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-rose-600 dark:hover:bg-slate-900 dark:hover:text-rose-400"
            title="Sair da conta"
            aria-label="Sair da conta"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white dark:lg:border-slate-800/90 dark:lg:bg-slate-900">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">EduTrack AI</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-10 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {renderSidebarContent(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
