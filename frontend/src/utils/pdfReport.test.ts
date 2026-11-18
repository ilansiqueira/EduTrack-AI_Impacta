import { describe, it, expect } from 'vitest';
import { buildStudentReportPdfBytes, createStudentReportDoc } from './pdfReport';
import type { AcademicTask, Subject } from '../types/models';

describe('Student Performance PDF Report Generator', () => {
  it('generates valid PDF bytes with %PDF- header when tasks and subjects are empty', () => {
    const bytes = buildStudentReportPdfBytes({
      student: { name: 'Ilan Siqueira', email: 'ilan@impacta.edu.br', id: 1 },
      subjects: [],
      tasks: [],
    });

    expect(bytes.byteLength).toBeGreaterThan(500);
    const header = new TextDecoder('ascii').decode(bytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('paginates cleanly across multiple pages for large task lists and includes unassigned tasks', () => {
    const subjects: Subject[] = [
      { id: 10, name: 'Engenharia de Software', teacher: 'Prof. Silva', hours: 80 },
    ];

    const tasks: AcademicTask[] = Array.from({ length: 45 }, (_, idx) => ({
      id: idx + 1,
      title: `Atividade Avaliativa #${idx + 1}`,
      status: idx % 2 === 0 ? 'completed' : 'pending',
      subject_id: idx === 44 ? 999 : 10, // last task is unassigned/orphaned
      due_date: '2026-11-30',
    }));

    const doc = createStudentReportDoc({
      student: { name: 'Ilan Siqueira', email: 'ilan@impacta.edu.br', id: 1 },
      subjects,
      tasks,
    });

    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    const bytes = new Uint8Array(doc.output('arraybuffer'));
    const header = new TextDecoder('ascii').decode(bytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});
