import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckSquare,
  Columns3,
  List,
  Plus,
  Search,
  Calendar,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  FileDown,
  BookOpen,
  Star,
} from 'lucide-react';
import type { AcademicTask, CanonicalTaskStatus } from '../types/models';
import { useAuth } from '../context/AuthContext';
import { useAcademic } from '../context/AcademicContext';
import {
  computeProgressMetrics,
  formatDateBR,
  getLocalTodayIso,
  isTaskOverdue,
  normalizeTaskStatus,
} from '../utils/progress';
import { downloadStudentReportPdf } from '../utils/pdfReport';
import { Badge, Button, Card, EmptyState, Input, Modal } from '../components/ui/Primitives';
import { GradeInput } from '../components/GradeInput';

type ViewMode = 'kanban' | 'list';
type StatusFilter = 'all' | CanonicalTaskStatus;

const KANBAN_COLUMNS: Array<{
  id: CanonicalTaskStatus;
  title: string;
  dotColor: string;
}> = [
  { id: 'pending', title: 'Pendente', dotColor: 'bg-slate-400' },
  { id: 'in_progress', title: 'Em Andamento', dotColor: 'bg-amber-500' },
  { id: 'completed', title: 'Concluída', dotColor: 'bg-emerald-500' },
];

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const {
    subjects,
    tasks,
    subjectMap,
    addTask,
    editTask,
    setTaskStatus,
    gradeTask,
    removeTask,
  } = useAcademic();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubjParam = searchParams.get('disciplina') || 'all';

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjParam);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Drag & drop state for Kanban
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dropTargetCol, setDropTargetCol] = useState<CanonicalTaskStatus | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AcademicTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<AcademicTask | null>(null);
  const [gradingTaskId, setGradingTaskId] = useState<number | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(getLocalTodayIso());
  const [status, setStatus] = useState<CanonicalTaskStatus>('pending');
  const [description, setDescription] = useState('');
  const [taskGrade, setTaskGrade] = useState('');
  const [taskWeight, setTaskWeight] = useState('1');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const param = searchParams.get('disciplina');
    if (param) {
      setSelectedSubjectId(param);
    }
  }, [searchParams]);

  const handleSubjectFilterChange = (val: string) => {
    setSelectedSubjectId(val);
    if (val === 'all') {
      searchParams.delete('disciplina');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ disciplina: val }, { replace: true });
    }
  };

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (selectedSubjectId !== 'all' && String(task.subject_id) !== selectedSubjectId) {
        return false;
      }
      const canonical = normalizeTaskStatus(task.status);
      if (statusFilter !== 'all' && canonical !== statusFilter) {
        return false;
      }
      if (q) {
        const inTitle = task.title.toLowerCase().includes(q);
        const inDesc = (task.description || '').toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });
  }, [tasks, selectedSubjectId, statusFilter, searchQuery]);

  const filteredMetrics = useMemo(() => computeProgressMetrics(filteredTasks), [filteredTasks]);

  const openCreateModal = (presetStatus: CanonicalTaskStatus = 'pending') => {
    setEditingTask(null);
    setTitle('');
    const defaultSubj =
      selectedSubjectId !== 'all'
        ? selectedSubjectId
        : subjects[0]
          ? String(subjects[0].id)
          : '';
    setSubjectId(defaultSubj);
    setDueDate(getLocalTodayIso());
    setStatus(presetStatus);
    setDescription('');
    setTaskGrade('');
    setTaskWeight('1');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (task: AcademicTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setSubjectId(String(task.subject_id));
    setDueDate(task.due_date ? String(task.due_date).slice(0, 10) : '');
    setStatus(normalizeTaskStatus(task.status));
    setDescription(task.description || '');
    setTaskGrade(task.grade !== null && task.grade !== undefined ? String(task.grade) : '');
    setTaskWeight(task.weight !== null && task.weight !== undefined ? String(task.weight) : '1');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('O título da tarefa é obrigatório.');
      return;
    }
    if (!subjectId) {
      setFormError('Selecione uma disciplina vinculada.');
      return;
    }

    let parsedGrade: number | null = null;
    if (taskGrade.trim()) {
      const candidateGrade = Number(taskGrade);
      if (Number.isNaN(candidateGrade) || candidateGrade < 0 || candidateGrade > 10) {
        setFormError('Informe uma nota válida entre 0 e 10.');
        return;
      }
      parsedGrade = candidateGrade;
    }

    const parsedWeight = taskWeight.trim() ? Number(taskWeight) : 1;
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 10) {
      setFormError('O peso da atividade deve ser maior que zero (até 10).');
      return;
    }

    setSaving(true);
    try {
      if (editingTask) {
        await editTask(editingTask.id, {
          title: title.trim(),
          subject_id: Number(subjectId),
          due_date: dueDate || null,
          status,
          description: description.trim() || null,
          grade: parsedGrade,
          weight: parsedWeight,
        });
      } else {
        await addTask({
          title: title.trim(),
          subject_id: Number(subjectId),
          due_date: dueDate || null,
          status,
          description: description.trim() || null,
          grade: parsedGrade,
          weight: parsedWeight,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar tarefa.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setDeleting(true);
    try {
      await removeTask(deletingTask.id);
      setDeletingTask(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleCompleteTask = async (task: AcademicTask) => {
    try {
      await setTaskStatus(task.id, 'completed');
      setGradingTaskId(task.id);
    } catch {
      // Error toast and rollback are already handled by AcademicContext
    }
  };

  const handleDropOnColumn = async (targetStatus: CanonicalTaskStatus) => {
    setDropTargetCol(null);
    if (draggedTaskId === null) return;
    const targetTask = tasks.find((t) => t.id === draggedTaskId);
    setDraggedTaskId(null);
    if (!targetTask) return;
    if (normalizeTaskStatus(targetTask.status) === targetStatus) return;
    if (targetStatus === 'completed') {
      await handleCompleteTask(targetTask);
    } else {
      try {
        await setTaskStatus(targetTask.id, targetStatus);
      } catch {
        // Error toast and rollback are already handled by AcademicContext
      }
    }
  };

  const gradingTask = useMemo(
    () => tasks.find((t) => t.id === gradingTaskId) ?? null,
    [tasks, gradingTaskId]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Tarefas Acadêmicas
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Organize entregas, mova cartões entre etapas no Kanban ou filtre prazos instantaneamente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
          </div>

          <Button
            variant="secondary"
            leftIcon={<FileDown className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
            onClick={() => downloadStudentReportPdf({ student: user, subjects, tasks })}
          >
            Exportar PDF
          </Button>

          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            disabled={subjects.length === 0}
            onClick={() => openCreateModal('pending')}
          >
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Zero Subjects Guard Banner */}
      {subjects.length === 0 && (
        <Card className="flex flex-col items-start justify-between gap-4 border-amber-200 bg-amber-50/70 sm:flex-row sm:items-center dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Cadastre uma disciplina primeiro
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Cada tarefa acadêmica precisa estar associada a uma matéria da sua grade.
              </p>
            </div>
          </div>
          <Link to="/disciplinas">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Ir para Disciplinas
            </Button>
          </Link>
        </Card>
      )}

      {/* Filter & Summary Strip */}
      <Card className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por título ou descrição..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectFilterChange(e.target.value)}
              aria-label="Filtrar por disciplina"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">Todas as disciplinas</option>
              {subjects.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filtrar por status"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluída</option>
            </select>
          </div>
        </div>

        {/* Live Filtered Progress Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
            <span>
              Exibindo <strong className="text-slate-900 dark:text-white">{filteredTasks.length}</strong>{' '}
              tarefa(s)
            </span>
            <span>•</span>
            <span>
              Concluídas:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {filteredMetrics.completedTasks}
              </strong>
            </span>
            <span>•</span>
            <span>
              Progresso:{' '}
              <strong className="text-brand-600 dark:text-brand-400">
                {filteredMetrics.progressPercentage.toFixed(1)}%
              </strong>
            </span>
          </div>

          {(searchQuery || selectedSubjectId !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                handleSubjectFilterChange('all');
                setStatusFilter('all');
              }}
              className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </Card>

      {/* Main Content: Kanban or List */}
      {filteredTasks.length === 0 && viewMode === 'list' ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title="Nenhuma tarefa encontrada"
          description={
            tasks.length === 0
              ? 'Adicione sua primeira tarefa acadêmica para organizar prazos e acompanhar o progresso.'
              : 'Nenhuma tarefa corresponde aos filtros aplicados no momento.'
          }
          action={
            subjects.length > 0 ? (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openCreateModal()}>
                Criar Tarefa
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'kanban' ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter(
              (t) => normalizeTaskStatus(t.status) === col.id
            );
            const isDropActive = dropTargetCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetCol(col.id);
                }}
                onDragLeave={() => setDropTargetCol(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleDropOnColumn(col.id);
                }}
                className={`flex min-h-[26rem] flex-col rounded-3xl border p-4 transition ${
                  isDropActive
                    ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-500/10'
                    : 'border-slate-200/80 bg-slate-100/70 dark:border-slate-800/90 dark:bg-slate-900/50'
                }`}
              >
                <div className="mb-4 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {col.title}
                    </h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-2xs dark:bg-slate-800 dark:text-slate-300">
                      {colTasks.length}
                    </span>
                  </div>

                  {subjects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openCreateModal(col.id)}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      title={`Adicionar em ${col.title}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300/70 p-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
                      Arraste uma tarefa para cá ou clique em +
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const overdue = isTaskOverdue(task);
                      const subjName =
                        subjectMap.get(task.subject_id)?.name ||
                        `Disciplina #${task.subject_id}`;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => setDraggedTaskId(task.id)}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDropTargetCol(null);
                          }}
                          className="group cursor-grab rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-brand-300 hover:shadow-md active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Badge tone="brand" className="max-w-[13rem] truncate">
                              {subjName}
                            </Badge>
                            <div className="flex items-center gap-0.5 opacity-80 transition group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                title="Editar tarefa"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTask(task)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                                title="Excluir tarefa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4
                            className={`mt-2.5 text-sm font-semibold leading-snug ${
                              col.id === 'completed'
                                ? 'text-slate-400 line-through dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                              {task.description}
                            </p>
                          )}

                          {col.id === 'completed' && task.grade != null && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <Star className="h-3 w-3 text-amber-500" />
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {task.grade}/10
                              </span>
                              {task.weight != null && task.weight !== 1 && (
                                <span className="text-[10px] text-slate-400">
                                  (peso {task.weight})
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${
                                overdue
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateBR(task.due_date)}
                              {overdue && ' • Atrasada'}
                            </span>

                            {/* Quick Status Pills */}
                            <div className="flex items-center gap-1">
                              {col.id !== 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => void setTaskStatus(task.id, 'pending')}
                                  className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                  title="Mover para Pendente"
                                >
                                  Pendente
                                </button>
                              )}
                              {col.id !== 'in_progress' && (
                                <button
                                  type="button"
                                  onClick={() => void setTaskStatus(task.id, 'in_progress')}
                                  className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300"
                                  title="Mover para Em Andamento"
                                >
                                  Andamento
                                </button>
                              )}
                              {col.id !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => void handleCompleteTask(task)}
                                  className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300"
                                  title="Concluir tarefa"
                                >
                                  Concluir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Card List View */
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const canonical = normalizeTaskStatus(task.status);
            const isCompleted = canonical === 'completed';
            const overdue = isTaskOverdue(task);
            const subjName =
              subjectMap.get(task.subject_id)?.name || `Disciplina #${task.subject_id}`;

            return (
              <Card
                key={task.id}
                className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() =>
                      isCompleted
                        ? void setTaskStatus(task.id, 'pending')
                        : void handleCompleteTask(task)
                    }
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-300 text-transparent hover:border-brand-500 dark:border-slate-700'
                    }`}
                    aria-label={isCompleted ? 'Reabrir tarefa' : 'Concluir tarefa'}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-base font-semibold ${
                          isCompleted
                            ? 'text-slate-400 line-through dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <Badge tone="brand">{subjName}</Badge>
                      {overdue && <Badge tone="rose">Atrasada</Badge>}
                      {canonical === 'completed' ? (
                        <Badge tone="emerald">Concluída</Badge>
                      ) : canonical === 'in_progress' ? (
                        <Badge tone="amber">
                          <Clock className="h-3 w-3" />
                          Em Andamento
                        </Badge>
                      ) : (
                        <Badge tone="slate">
                          <Circle className="h-2.5 w-2.5" />
                          Pendente
                        </Badge>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {task.description}
                      </p>
                    )}

                    <p className="flex items-center gap-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      Prazo: {formatDateBR(task.due_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={canonical}
                    onChange={(e) => {
                      const next = e.target.value as CanonicalTaskStatus;
                      if (next === 'completed') {
                        void handleCompleteTask(task);
                      } else {
                        void setTaskStatus(task.id, next);
                      }
                    }}
                    aria-label="Alterar status da tarefa"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluída</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(task)}
                    aria-label={`Editar ${task.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingTask(task)}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/15"
                    aria-label={`Excluir ${task.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Editar Tarefa Acadêmica' : 'Nova Tarefa Acadêmica'}
        description="Defina a disciplina, prazo de entrega e status atual da atividade."
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {formError}
            </div>
          )}

          <Input
            label="Título da Tarefa *"
            placeholder="Ex: Entrega do Protótipo Funcional"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="space-y-1.5">
            <label
              htmlFor="task-subject"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Disciplina Vinculada *
            </label>
            <select
              id="task-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="" disabled>
                Selecione uma disciplina...
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prazo de Entrega"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CanonicalTaskStatus)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluída</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="task-desc"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Descrição / Instruções
            </label>
            <textarea
              id="task-desc"
              rows={3}
              placeholder="Capítulos, links de referência ou critérios de avaliação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Grade & Weight (optional) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nota (0–10)"
              type="number"
              min={0}
              max={10}
              step={0.1}
              placeholder="Ex: 8.5"
              value={taskGrade}
              onChange={(e) => setTaskGrade(e.target.value)}
              hint="Opcional — preencha ao receber a nota"
            />
            <Input
              label="Peso da Atividade"
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              placeholder="1.0"
              value={taskWeight}
              onChange={(e) => setTaskWeight(e.target.value)}
              hint="Default 1.0 para média ponderada"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Task Confirmation Modal */}
      <Modal
        open={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        title="Excluir Tarefa"
        description={`Tem certeza que deseja excluir "${deletingTask?.title ?? ''}"? Esta ação não pode ser desfeita.`}
      >
        <div className="flex justify-end gap-2.5 pt-3">
          <Button type="button" variant="secondary" onClick={() => setDeletingTask(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={deleting}
            onClick={handleConfirmDelete}
          >
            Excluir Tarefa
          </Button>
        </div>
      </Modal>

      {/* Grade Prompt Modal — shown after completing a task */}
      <Modal
        open={gradingTaskId !== null}
        onClose={() => setGradingTaskId(null)}
        title="Registrar Nota"
        description="A tarefa foi concluída! Deseja registrar a nota recebida?"
      >
        {gradingTaskId !== null && (
          <GradeInput
            key={gradingTaskId}
            initialGrade={gradingTask?.grade}
            initialWeight={gradingTask?.weight}
            onSkip={() => setGradingTaskId(null)}
            onSubmit={async (g, w) => {
              if (gradingTaskId !== null && g !== null) {
                await gradeTask(gradingTaskId, g, w);
              }
              setGradingTaskId(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};
