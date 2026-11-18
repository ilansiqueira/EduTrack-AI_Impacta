import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  FileDown,
  ArrowRight,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAcademic } from '../context/AcademicContext';
import {
  computeProgressMetrics,
  formatDateBR,
  isTaskOverdue,
  normalizeTaskStatus,
} from '../utils/progress';
import { downloadStudentReportPdf } from '../utils/pdfReport';
import { Badge, Button, Card, EmptyState } from '../components/ui/Primitives';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, tasks, metrics, loading, error, subjectMap, setTaskStatus, refreshAll } =
    useAcademic();

  const firstName = (user?.name || 'Estudante').split(' ')[0];
  const totalWorkloadHours = subjects.reduce((acc, s) => acc + (Number(s.hours) || 0), 0);

  // Upcoming & overdue incomplete tasks sorted by due_date ascending (nulls last)
  const upcomingTasks = [...tasks]
    .filter((t) => normalizeTaskStatus(t.status) !== 'completed')
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 6);

  const handleExportPdf = () => {
    downloadStudentReportPdf({ student: user, subjects, tasks });
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {getTimeGreeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Aqui está o panorama ao vivo das suas disciplinas, entregas e progresso acadêmico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            loading={loading}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => refreshAll(false)}
          >
            Atualizar
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<FileDown className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
            onClick={handleExportPdf}
          >
            Relatório PDF
          </Button>
          <Link to="/tarefas">
            <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
              Nova Tarefa
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refreshAll(false)}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* 4 KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Disciplinas Ativas
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{subjects.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {totalWorkloadHours > 0
                ? `${totalWorkloadHours}h de carga horária total`
                : 'Matriculadas neste período'}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Tarefas Concluídas
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {metrics.completedTasks}
              <span className="ml-1.5 text-base font-medium text-slate-400">
                / {metrics.totalTasks}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Entregas finalizadas com sucesso
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Em Aberto
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2.5">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {metrics.pendingTasks + metrics.inProgressTasks}
              </p>
              {metrics.overdueTasks > 0 && (
                <Badge tone="rose">{metrics.overdueTasks} atrasada(s)</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {metrics.inProgressTasks} em andamento • {metrics.pendingTasks} pendente(s)
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Progresso Geral
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {metrics.progressPercentage.toFixed(1)}%
            </p>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.progressPercentage)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Split: Per-Subject Progress + Upcoming Deadlines */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Subject Progress Breakdown */}
        <Card className="lg:col-span-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Desempenho por Disciplina
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o avanço das tarefas em cada matéria cadastrada
              </p>
            </div>
            <Link
              to="/disciplinas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Gerenciar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {subjects.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="Nenhuma disciplina cadastrada"
              description="Comece adicionando as matérias que você está cursando neste semestre para vincular tarefas e acompanhar seu rendimento."
              action={
                <Link to="/disciplinas">
                  <Button leftIcon={<Plus className="h-4 w-4" />}>Cadastrar 1ª Disciplina</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {subjects.map((subj) => {
                const subjTasks = tasks.filter((t) => t.subject_id === subj.id);
                const subjMetrics = computeProgressMetrics(subjTasks);
                return (
                  <div
                    key={subj.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/50 dark:hover:border-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link
                          to={`/tarefas?disciplina=${subj.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400"
                        >
                          {subj.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {subj.teacher ? `Prof. ${subj.teacher}` : 'Professor não informado'}
                          {subj.hours ? ` • ${subj.hours}h` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {subjMetrics.completedTasks}/{subjMetrics.totalTasks} tarefas
                        </span>
                        <Badge
                          tone={
                            subjMetrics.progressPercentage === 100 && subjMetrics.totalTasks > 0
                              ? 'emerald'
                              : 'brand'
                          }
                        >
                          {subjMetrics.progressPercentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all duration-500 dark:bg-brand-500"
                        style={{ width: `${Math.min(100, subjMetrics.progressPercentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Upcoming & Overdue Tasks */}
        <Card className="lg:col-span-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Próximas Entregas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atividades pendentes ordenadas por prazo
              </p>
            </div>
            <Link
              to="/tarefas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {upcomingTasks.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-6 w-6" />}
              title={tasks.length === 0 ? 'Sem tarefas ainda' : 'Tudo em dia!'}
              description={
                tasks.length === 0
                  ? 'Adicione atividades, trabalhos ou provas para visualizar seus próximos prazos aqui.'
                  : 'Você concluiu todas as tarefas pendentes. Excelente trabalho!'
              }
              action={
                subjects.length > 0 ? (
                  <Link to="/tarefas">
                    <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                      Criar tarefa
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task) => {
                const overdue = isTaskOverdue(task);
                const status = normalizeTaskStatus(task.status);
                const subjName =
                  subjectMap.get(task.subject_id)?.name || `Disciplina #${task.subject_id}`;

                return (
                  <div
                    key={task.id}
                    className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-950/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {overdue ? (
                          <Badge tone="rose">Atrasada</Badge>
                        ) : status === 'in_progress' ? (
                          <Badge tone="amber">Em andamento</Badge>
                        ) : (
                          <Badge tone="slate">Pendente</Badge>
                        )}
                        <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                          {subjName}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {task.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateBR(task.due_date)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void setTaskStatus(task.id, 'completed')}
                      title="Marcar como concluída"
                      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-400"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
