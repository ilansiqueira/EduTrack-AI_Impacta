import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  User as UserIcon,
  Clock,
  Pencil,
  Trash2,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import type { Subject } from '../types/models';
import { useAcademic } from '../context/AcademicContext';
import { computeProgressMetrics } from '../utils/progress';
import { Badge, Button, Card, EmptyState, Input, Modal } from '../components/ui/Primitives';

export const SubjectsPage: React.FC = () => {
  const { subjects, tasks, addSubject, editSubject, removeSubject } = useAcademic();

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [hours, setHours] = useState('60');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.teacher && s.teacher.toLowerCase().includes(q))
    );
  }, [subjects, query]);

  const openCreateModal = () => {
    setEditingSubject(null);
    setName('');
    setTeacher('');
    setHours('60');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (subj: Subject) => {
    setEditingSubject(subj);
    setName(subj.name || '');
    setTeacher(subj.teacher || '');
    setHours(subj.hours !== null && subj.hours !== undefined ? String(subj.hours) : '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('O nome da disciplina é obrigatório.');
      return;
    }

    const parsedHours = hours.trim() ? Number(hours) : null;
    if (parsedHours !== null && (Number.isNaN(parsedHours) || parsedHours < 0 || parsedHours > 1000)) {
      setFormError('Informe uma carga horária válida (0 a 1000 horas).');
      return;
    }

    setSaving(true);
    try {
      if (editingSubject) {
        await editSubject(editingSubject.id, {
          name: name.trim(),
          teacher: teacher.trim() || null,
          hours: parsedHours && parsedHours > 0 ? parsedHours : null,
        });
      } else {
        await addSubject({
          name: name.trim(),
          teacher: teacher.trim() || null,
          hours: parsedHours && parsedHours > 0 ? parsedHours : null,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar disciplina.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSubject) return;
    setDeleting(true);
    try {
      await removeSubject(deletingSubject.id);
      setDeletingSubject(null);
    } finally {
      setDeleting(false);
    }
  };

  const linkedTasksForDelete = deletingSubject
    ? tasks.filter((t) => t.subject_id === deletingSubject.id).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Disciplinas
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cadastre suas matérias, edite professores e cargas horárias, e monitore o progresso individual.
          </p>
        </div>

        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Nova Disciplina
        </Button>
      </div>

      {/* Search Bar */}
      {subjects.length > 0 && (
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por disciplina ou professor..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      )}

      {/* Subject Cards Grid */}
      {filteredSubjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={
            subjects.length === 0
              ? 'Sua grade curricular está vazia'
              : 'Nenhuma disciplina corresponde à busca'
          }
          description={
            subjects.length === 0
              ? 'Adicione as matérias do semestre para começar a organizar suas atividades acadêmicas.'
              : 'Tente outro termo de pesquisa ou limpe o filtro.'
          }
          action={
            subjects.length === 0 ? (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
                Cadastrar Disciplina
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setQuery('')}>
                Limpar busca
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSubjects.map((subj) => {
            const subjTasks = tasks.filter((t) => t.subject_id === subj.id);
            const subjMetrics = computeProgressMetrics(subjTasks);

            return (
              <Card
                key={subj.id}
                className="group relative flex flex-col justify-between overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-300 dark:hover:border-brand-500/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(subj)}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Editar disciplina"
                        aria-label={`Editar ${subj.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSubject(subj)}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                        title="Excluir disciplina"
                        aria-label={`Excluir ${subj.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                    {subj.name}
                  </h3>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                      {subj.teacher || 'Professor não informado'}
                    </span>
                    {subj.hours ? (
                      <Badge tone="slate">
                        <Clock className="h-3 w-3" />
                        {subj.hours}h
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      {subjMetrics.completedTasks} de {subjMetrics.totalTasks} tarefas concluídas
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {subjMetrics.progressPercentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-500 dark:bg-brand-500"
                      style={{ width: `${Math.min(100, subjMetrics.progressPercentage)}%` }}
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      to={`/tarefas?disciplina=${subj.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      Ver tarefas da matéria
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? 'Editar Disciplina' : 'Nova Disciplina'}
        description={
          editingSubject
            ? 'Atualize as informações da matéria selecionada.'
            : 'Preencha os dados para adicionar uma matéria à sua grade.'
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {formError}
            </div>
          )}

          <Input
            label="Nome da Disciplina *"
            placeholder="Ex: Engenharia de Software"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <Input
            label="Professor(a)"
            placeholder="Ex: Prof. Dr. Silva"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
          />

          <Input
            label="Carga Horária (horas)"
            type="number"
            min={0}
            max={1000}
            step={10}
            placeholder="Ex: 80"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingSubject ? 'Salvar Alterações' : 'Cadastrar Disciplina'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingSubject)}
        onClose={() => setDeletingSubject(null)}
        title="Excluir Disciplina"
        description={`Tem certeza que deseja remover "${deletingSubject?.name ?? ''}"?`}
      >
        <div className="space-y-4">
          {linkedTasksForDelete > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p>
                Existem <strong>{linkedTasksForDelete} tarefa(s)</strong> vinculadas a esta
                disciplina. Caso exclua a matéria, essas tarefas ficarão sem disciplina ativa.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeletingSubject(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={handleConfirmDelete}
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
