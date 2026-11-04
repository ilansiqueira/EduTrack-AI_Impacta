"""
Unit tests for scripts/generate_student_report.py
"""

import os
import unittest
from pathlib import Path
from scripts.generate_student_report import generate_pdf_report, generate_pdf_bytes, PDFCanvas

class TestGenerateStudentReport(unittest.TestCase):
    def setUp(self):
        self.test_output = Path(__file__).parent / "test_report.pdf"

    def tearDown(self):
        if self.test_output.exists():
            try:
                os.remove(self.test_output)
            except OSError:
                pass

    def test_pdf_canvas_structure(self):
        """PDFCanvas should output valid PDF-1.4 header and trailer."""
        canvas = PDFCanvas()
        canvas.set_font("Helvetica-Bold", 14)
        canvas.draw_text(50, 750, "Test Document")
        pdf_bytes = canvas.build_pdf_bytes()

        self.assertTrue(pdf_bytes.startswith(b"%PDF-1.4"))
        self.assertTrue(b"%%EOF" in pdf_bytes)

    def test_generate_report_empty_data(self):
        """Generating report with no subjects and no tasks should succeed without errors."""
        res_path = generate_pdf_report(
            student={"name": "Aluno Teste", "email": "teste@exemplo.com", "id": 1},
            subjects=[],
            tasks=[],
            output_path=str(self.test_output)
        )
        self.assertTrue(os.path.exists(res_path))
        self.assertGreater(os.path.getsize(res_path), 500)

        with open(res_path, "rb") as f:
            content = f.read()
        self.assertTrue(content.startswith(b"%PDF-1.4"))
        self.assertTrue(b"%%EOF" in content)

    def test_generate_report_with_subjects_and_tasks(self):
        """Generating report with populated subjects and tasks."""
        student = {"name": "Maria Santos", "email": "maria@exemplo.com", "id": 42}
        subjects = [
            {"id": 1, "name": "Algoritmos e Estrutura de Dados", "teacher": "Prof. Alan", "hours": 80},
            {"id": 2, "name": "Banco de Dados", "teacher": "Prof. Codd", "hours": 60}
        ]
        tasks = [
            {"id": 101, "subject_id": 1, "title": "Lista de Arvores", "status": "completed", "due_date": "2026-03-01"},
            {"id": 102, "subject_id": 1, "title": "Trabalho Grafos", "status": "pending", "due_date": "2026-03-15"},
            {"id": 103, "subject_id": 2, "title": "Modelagem ER", "status": "completed", "due_date": "2026-03-10"}
        ]

        res_path = generate_pdf_report(
            student=student,
            subjects=subjects,
            tasks=tasks,
            output_path=str(self.test_output)
        )
        self.assertTrue(os.path.exists(res_path))
        self.assertGreater(os.path.getsize(res_path), 1000)

        with open(res_path, "rb") as f:
            content = f.read()
        self.assertTrue(content.startswith(b"%PDF-1.4"))
        self.assertTrue(b"%%EOF" in content)

    def test_generate_pdf_bytes_in_memory(self):
        """generate_pdf_bytes should return valid PDF bytes without writing to disk."""
        pdf_bytes = generate_pdf_bytes(
            student={"name": "Carlos Aluno", "id": 5},
            subjects=[{"id": 1, "name": "Matematica"}],
            tasks=[{"id": 1, "subject_id": 1, "title": "Prova 1", "status": "completed"}]
        )
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-1.4"))
        self.assertTrue(b"%%EOF" in pdf_bytes)


if __name__ == "__main__":
    unittest.main()

