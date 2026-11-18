import { jsPDF } from 'jspdf';
import type { AcademicTask, Subject, User } from '../types/models';
import { computeProgressMetrics, formatDateBR, normalizeTaskStatus } from './progress';

export interface ReportPayload {
  student?: User | null;
  subjects: Subject[];
  tasks: AcademicTask[];
  emittedAt?: Date;
}

function sanitizePdfText(value?: string | number | null): string {
  if (value === undefined || value === null) return '';
  // jsPDF core Helvetica supports WinAnsi (Latin-1), which covers Portuguese accents (á, ã, ç, é, ê, í, ó, õ, ú).
  // Strip emojis or unsupported astral symbols so text metrics stay clean.
  return String(value).replace(/[\u{10000}-\u{10FFFF}]/gu, '').trim();
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

export function createStudentReportDoc({
  student,
  subjects = [],
  tasks = [],
  emittedAt = new Date(),
}: ReportPayload): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth(); // ~595.28
  const pageHeight = doc.internal.pageSize.getHeight(); // ~841.89
  const left = 40;
  const contentWidth = pageWidth - left * 2;
  const bottomLimit = pageHeight - 65;

  const overall = computeProgressMetrics(tasks);

  // Group tasks by subject
  const subjectIds = new Set(subjects.map((s) => s.id));
  const tasksBySubject = new Map<number, AcademicTask[]>();
  for (const s of subjects) {
    tasksBySubject.set(s.id, []);
  }
  const unassignedTasks: AcademicTask[] = [];

  for (const t of tasks) {
    if (subjectIds.has(t.subject_id)) {
      tasksBySubject.get(t.subject_id)?.push(t);
    } else {
      unassignedTasks.push(t);
    }
  }

  let y = 40;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = 45;
    }
  };

  // 1. Header Banner
  doc.setFillColor(37, 99, 235); // brand-600
  doc.roundedRect(left, y, contentWidth, 56, 8, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('EduTrack AI', left + 18, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(sanitizePdfText('Relatório Executivo de Desempenho Acadêmico'), left + 18, y + 43);

  const dateFormatted = emittedAt.toLocaleDateString('pt-BR');
  const timeFormatted = emittedAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(9.5);
  doc.text(
    sanitizePdfText(`Emissão: ${dateFormatted} ${timeFormatted}`),
    left + contentWidth - 18,
    y + 34,
    { align: 'right' }
  );

  y += 72;

  // 2. Student Profile Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(left, y, contentWidth, 64, 6, 6, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DADOS DO ESTUDANTE', left + 16, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const studentName = sanitizePdfText(student?.name) || 'Estudante';
  const studentEmail = sanitizePdfText(student?.email) || 'Não informado';
  const studentId = student?.id !== undefined ? String(student.id) : '-';

  doc.text(`Nome: ${truncateText(studentName, 55)}`, left + 16, y + 38);
  doc.text(`E-mail: ${truncateText(studentEmail, 55)}`, left + 16, y + 53);
  doc.text(`ID de Usuário: ${studentId}`, left + 350, y + 38);
  doc.text(
    sanitizePdfText(`Perfil: ${student?.role || 'Aluno'}`),
    left + 350,
    y + 53
  );

  y += 80;

  // 3. Overall Summary Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(left, y, contentWidth, 76, 6, 6, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMO DE DESEMPENHO GERAL', left + 16, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Disciplinas Matriculadas: ${subjects.length}`, left + 16, y + 39);
  doc.text(`Total de Tarefas: ${overall.totalTasks}`, left + 16, y + 55);

  doc.text(sanitizePdfText(`Concluídas: ${overall.completedTasks}`), left + 195, y + 39);
  doc.text(
    sanitizePdfText(`Pendentes / Em Andamento: ${overall.pendingTasks + overall.inProgressTasks}`),
    left + 195,
    y + 55
  );

  // Progress bar + percentage
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text(`Progresso: ${overall.progressPercentage.toFixed(1)}%`, left + 365, y + 38);

  const barX = left + 365;
  const barY = y + 47;
  const barW = 132;
  const barH = 9;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(barX, barY, barW, barH, 4, 4, 'F');

  const fillW = Math.max(0, Math.min(barW, barW * (overall.progressPercentage / 100)));
  if (fillW > 0) {
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(barX, barY, fillW, barH, 4, 4, 'F');
  }

  y += 96;

  // 4. Section Title: Detalhamento por Disciplina
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DETALHAMENTO POR DISCIPLINA', left, y);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.2);
  doc.line(left, y + 6, left + contentWidth, y + 6);

  y += 22;

  const renderTaskRows = (taskList: AcademicTask[]) => {
    if (taskList.length === 0) {
      ensureSpace(22);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('- Nenhuma tarefa cadastrada nesta disciplina.', left + 14, y + 12);
      y += 22;
      return;
    }

    for (const task of taskList) {
      ensureSpace(20);
      const status = normalizeTaskStatus(task.status);
      const statusLabel =
        status === 'completed'
          ? '[CONCLUÍDA]'
          : status === 'in_progress'
            ? '[ANDAMENTO]'
            : '[PENDENTE]';

      if (status === 'completed') {
        doc.setTextColor(16, 185, 129);
      } else if (status === 'in_progress') {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(100, 116, 139);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(sanitizePdfText(statusLabel), left + 12, y + 12);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(
        truncateText(sanitizePdfText(task.title) || 'Tarefa sem título', 52),
        left + 86,
        y + 12
      );

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8.5);
      doc.text(
        sanitizePdfText(`Prazo: ${formatDateBR(task.due_date)}`),
        left + contentWidth - 10,
        y + 12,
        { align: 'right' }
      );

      y += 18;
    }
  };

  if (subjects.length === 0) {
    ensureSpace(30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizePdfText('Nenhuma disciplina cadastrada até o momento.'), left + 8, y + 12);
    y += 28;
  } else {
    for (const subj of subjects) {
      ensureSpace(48);
      const sTasks = tasksBySubject.get(subj.id) || [];
      const sMetrics = computeProgressMetrics(sTasks);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(left, y, contentWidth, 24, 4, 4, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(
        truncateText(sanitizePdfText(subj.name).toUpperCase() || 'DISCIPLINA', 34),
        left + 10,
        y + 15.5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const teacherLabel = sanitizePdfText(subj.teacher) || 'Não informado';
      const hoursLabel = subj.hours ? ` • ${subj.hours}h` : '';
      doc.text(
        truncateText(`Prof: ${teacherLabel}${hoursLabel}`, 34),
        left + 225,
        y + 15.5
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
      doc.text(
        `Progresso: ${sMetrics.progressPercentage.toFixed(1)}%`,
        left + contentWidth - 10,
        y + 15.5,
        { align: 'right' }
      );

      y += 28;
      renderTaskRows(sTasks);
      y += 10;
    }
  }

  if (unassignedTasks.length > 0) {
    ensureSpace(48);
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(left, y, contentWidth, 24, 4, 4, 'F');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('TAREFAS SEM DISCIPLINA VINCULADA', left + 10, y + 15.5);
    y += 28;
    renderTaskRows(unassignedTasks);
  }

  // 5. Stamp accurate Footer with Page X of Y across all pages
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    doc.line(left, pageHeight - 42, left + contentWidth, pageHeight - 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      sanitizePdfText('EduTrack AI — Sistema de Gestão Acadêmica Inteligente'),
      left,
      pageHeight - 27
    );
    doc.text(
      sanitizePdfText(`Página ${page} de ${totalPages}`),
      left + contentWidth,
      pageHeight - 27,
      { align: 'right' }
    );
  }

  return doc;
}

export function buildStudentReportPdfBytes(payload: ReportPayload): Uint8Array {
  const doc = createStudentReportDoc(payload);
  const buffer = doc.output('arraybuffer');
  return new Uint8Array(buffer);
}

export function downloadStudentReportPdf(
  payload: ReportPayload,
  fileName: string = 'relatorio_desempenho.pdf'
): void {
  const doc = createStudentReportDoc(payload);
  doc.save(fileName);
}
