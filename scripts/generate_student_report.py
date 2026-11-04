"""
Student Performance PDF Report Generator for EduTrack AI.
Compiles student performance metrics, subjects, and tasks into a formatted PDF document.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# Add project root to sys.path to enable internal imports
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from scripts.calculate_progress import compute_progress, _load_env, _get_secret

_load_env()


class PDFCanvas:
    """
    Lightweight, zero-dependency PDF generator conforming to PDF-1.4 specification.
    Produces valid standard PDF files using core Type 1 fonts (Helvetica / Helvetica-Bold).
    """

    def __init__(self, page_width=595, page_height=842):
        # A4 dimensions in points (595 x 842 pt)
        self.width = page_width
        self.height = page_height
        self.pages = []  # list of list of stream commands
        self.current_stream = []
        self._new_page()

    def _new_page(self):
        if self.current_stream:
            self.pages.append(self.current_stream)
        self.current_stream = []

    def set_font(self, font_name, size):
        font_ref = "/F2" if "Bold" in font_name else "/F1"
        self.current_stream.append(f"{font_ref} {size} Tf")

    def set_color(self, r, g, b):
        self.current_stream.append(f"{r:.3f} {g:.3f} {b:.3f} rg")

    def set_stroke_color(self, r, g, b):
        self.current_stream.append(f"{r:.3f} {g:.3f} {b:.3f} RG")

    def draw_text(self, x, y, text):
        clean_text = self._escape_text(text)
        self.current_stream.append(f"BT {x:.2f} {y:.2f} Td ({clean_text}) Tj ET")

    def draw_line(self, x1, y1, x2, y2, width=1.0):
        self.current_stream.append(f"{width:.2f} w {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")

    def draw_rect(self, x, y, w, h, fill=False, stroke=True):
        op = "B" if (fill and stroke) else ("f" if fill else "S")
        self.current_stream.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re {op}")

    def _escape_text(self, text):
        # Escape characters per PDF specification and handle Latin-1 encodable characters
        if text is None:
            return ""
        s = str(text)
        # Normalize special Portuguese characters to ASCII/Latin-1 safe equivalents
        replacements = {
            "á": "a", "à": "a", "ã": "a", "â": "a",
            "é": "e", "ê": "e",
            "í": "i",
            "ó": "o", "õ": "o", "ô": "o",
            "ú": "u", "ü": "u",
            "ç": "c",
            "Á": "A", "À": "A", "Ã": "A", "Â": "A",
            "É": "E", "Ê": "E",
            "Í": "I",
            "Ó": "O", "Õ": "O", "Ô": "O",
            "Ú": "U", "Ü": "U",
            "Ç": "C"
        }
        for orig, rep in replacements.items():
            s = s.replace(orig, rep)

        res = []
        for ch in s:
            if ch in ("\\", "(", ")"):
                res.append("\\" + ch)
            elif ord(ch) < 32 or ord(ch) > 126:
                res.append(" ")
            else:
                res.append(ch)
        return "".join(res)

    def build_pdf_bytes(self):
        if self.current_stream:
            self.pages.append(self.current_stream)
            self.current_stream = []

        total_pages = len(self.pages)
        if total_pages == 0:
            self.pages = [[]]
            total_pages = 1

        objects = []
        # obj 1: Catalog
        # obj 2: Pages
        # obj 3.. (Page objects)
        # obj (Content streams)
        # Font objects
        content_obj_indices = []
        page_obj_indices = []

        # Object index tracker
        next_obj_id = 1
        catalog_id = next_obj_id; next_obj_id += 1
        pages_id = next_obj_id; next_obj_id += 1

        # Allocate page IDs and content IDs
        for _ in range(total_pages):
            page_obj_indices.append(next_obj_id); next_obj_id += 1
            content_obj_indices.append(next_obj_id); next_obj_id += 1

        font1_id = next_obj_id; next_obj_id += 1
        font2_id = next_obj_id; next_obj_id += 1

        body_parts = []
        body_parts.append(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

        offsets = {}

        # 1: Catalog
        offsets[catalog_id] = sum(len(p) for p in body_parts)
        body_parts.append(f"{catalog_id} 0 obj\n<< /Type /Catalog /Pages {pages_id} 0 R >>\nendobj\n".encode("latin1"))

        # 2: Pages
        kids_refs = " ".join(f"{pid} 0 R" for pid in page_obj_indices)
        offsets[pages_id] = sum(len(p) for p in body_parts)
        body_parts.append(f"{pages_id} 0 obj\n<< /Type /Pages /Kids [{kids_refs}] /Count {total_pages} >>\nendobj\n".encode("latin1"))

        # Page objects and Content objects
        for i in range(total_pages):
            pid = page_obj_indices[i]
            cid = content_obj_indices[i]
            stream_data = "\n".join(self.pages[i]).encode("latin1")
            stream_len = len(stream_data)

            # Page obj
            offsets[pid] = sum(len(p) for p in body_parts)
            page_str = (
                f"{pid} 0 obj\n"
                f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {self.width} {self.height}] "
                f"/Contents {cid} 0 R /Resources << /Font << /F1 {font1_id} 0 R /F2 {font2_id} 0 R >> >> >>\n"
                f"endobj\n"
            )
            body_parts.append(page_str.encode("latin1"))

            # Content obj
            offsets[cid] = sum(len(p) for p in body_parts)
            content_header = f"{cid} 0 obj\n<< /Length {stream_len} >>\nstream\n".encode("latin1")
            content_footer = b"\nendstream\nendobj\n"
            body_parts.append(content_header + stream_data + content_footer)

        # Font 1: Helvetica
        offsets[font1_id] = sum(len(p) for p in body_parts)
        body_parts.append(f"{font1_id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n".encode("latin1"))

        # Font 2: Helvetica-Bold
        offsets[font2_id] = sum(len(p) for p in body_parts)
        body_parts.append(f"{font2_id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n".encode("latin1"))

        # Xref table
        xref_offset = sum(len(p) for p in body_parts)
        total_objects = next_obj_id
        xref_parts = [f"xref\n0 {total_objects}\n0000000000 65535 f \n"]
        for oid in range(1, total_objects):
            offset = offsets[oid]
            xref_parts.append(f"{offset:010d} 00000 n \n")

        trailer_str = (
            f"trailer\n<< /Size {total_objects} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        )

        body_parts.append("".join(xref_parts).encode("latin1"))
        body_parts.append(trailer_str.encode("latin1"))

        return b"".join(body_parts)


def generate_pdf_report(student=None, subjects=None, tasks=None, output_path="relatorio_desempenho.pdf"):
    """
    Generate a student performance PDF report from provided data structures.
    Saves the PDF to output_path and returns the output file path.
    """
    student = student or {}
    subjects = subjects or []
    tasks = tasks or []

    # Calculate overall progress metrics
    metrics = compute_progress(tasks)
    total_tasks = metrics["total_tasks"]
    completed_tasks = metrics["completed_tasks"]
    pending_tasks = total_tasks - completed_tasks
    progress_pct = metrics["progress_percentage"]

    # Map subjects to their tasks
    subject_map = {s.get("id"): s for s in subjects}
    subject_tasks = {s.get("id"): [] for s in subjects}
    unassigned_tasks = []

    for t in tasks:
        s_id = t.get("subject_id")
        if s_id in subject_tasks:
            subject_tasks[s_id].append(t)
        else:
            unassigned_tasks.append(t)

    canvas = PDFCanvas()

    # Colors
    c_primary = (0.08, 0.35, 0.75)      # Deep Academic Blue
    c_dark = (0.15, 0.15, 0.15)         # Charcoal text
    c_muted = (0.45, 0.45, 0.45)        # Subdued gray
    c_card_bg = (0.95, 0.96, 0.98)      # Light gray/blue card
    c_card_border = (0.80, 0.84, 0.90)  # Border
    c_green = (0.10, 0.60, 0.25)        # Success green
    c_bar_bg = (0.85, 0.88, 0.92)       # Progress bar bg

    # Page Margins & Header
    left = 40
    top = 800
    y = top

    # Header Bar
    canvas.set_color(*c_primary)
    canvas.draw_rect(left, y - 5, 515, 45, fill=True, stroke=False)

    canvas.set_color(1.0, 1.0, 1.0)
    canvas.set_font("Helvetica-Bold", 18)
    canvas.draw_text(left + 15, y + 16, "EduTrack AI")

    canvas.set_font("Helvetica", 11)
    canvas.draw_text(left + 15, y + 2, "Relatorio de Desempenho Academico")

    # Emission Date (Right aligned in header)
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    canvas.draw_text(left + 350, y + 10, f"Emissao: {now_str}")

    y -= 35

    # Student Information Card
    canvas.set_color(*c_card_bg)
    canvas.set_stroke_color(*c_card_border)
    canvas.draw_rect(left, y - 65, 515, 60, fill=True, stroke=True)

    canvas.set_color(*c_dark)
    canvas.set_font("Helvetica-Bold", 11)
    canvas.draw_text(left + 15, y - 20, "DADOS DO ALUNO")

    canvas.set_font("Helvetica", 10)
    nome = student.get("name") or "Estudante"
    email = student.get("email") or "Nao informado"
    user_id = student.get("id") or "-"

    canvas.draw_text(left + 15, y - 38, f"Nome: {nome}")
    canvas.draw_text(left + 15, y - 52, f"E-mail: {email}")
    canvas.draw_text(left + 350, y - 38, f"ID de Usuario: {user_id}")

    y -= 85

    # Overall Metrics Card
    canvas.set_color(*c_card_bg)
    canvas.set_stroke_color(*c_card_border)
    canvas.draw_rect(left, y - 75, 515, 70, fill=True, stroke=True)

    canvas.set_color(*c_dark)
    canvas.set_font("Helvetica-Bold", 11)
    canvas.draw_text(left + 15, y - 20, "RESUMO DE DESEMPENHO GERAL")

    canvas.set_font("Helvetica", 10)
    canvas.draw_text(left + 15, y - 38, f"Disciplinas Matriculadas: {len(subjects)}")
    canvas.draw_text(left + 15, y - 52, f"Total de Tarefas: {total_tasks}")

    canvas.draw_text(left + 200, y - 38, f"Concluidas: {completed_tasks}")
    canvas.draw_text(left + 200, y - 52, f"Pendentes: {pending_tasks}")

    canvas.set_font("Helvetica-Bold", 12)
    canvas.set_color(*c_primary)
    canvas.draw_text(left + 360, y - 38, f"Progresso: {progress_pct:.1f}%")

    # Progress bar representation
    bar_x = left + 360
    bar_y = y - 55
    bar_w = 135
    bar_h = 10
    canvas.set_color(*c_bar_bg)
    canvas.draw_rect(bar_x, bar_y, bar_w, bar_h, fill=True, stroke=False)

    filled_w = max(0.0, min(bar_w, bar_w * (progress_pct / 100.0)))
    if filled_w > 0:
        canvas.set_color(*c_green)
        canvas.draw_rect(bar_x, bar_y, filled_w, bar_h, fill=True, stroke=False)

    y -= 95

    # Section: Detalhamento por Disciplina
    canvas.set_color(*c_primary)
    canvas.set_font("Helvetica-Bold", 13)
    canvas.draw_text(left, y - 10, "DETALHAMENTO POR DISCIPLINA")

    canvas.set_stroke_color(*c_primary)
    canvas.draw_line(left, y - 15, left + 515, y - 15, width=1.5)

    y -= 30

    if not subjects:
        canvas.set_color(*c_muted)
        canvas.set_font("Helvetica", 10)
        canvas.draw_text(left + 10, y - 10, "Nenhuma disciplina cadastrada ate o momento.")
        y -= 25
    else:
        for s in subjects:
            s_name = s.get("name") or "Disciplina sem nome"
            s_prof = s.get("teacher") or "Nao informado"
            s_hours = s.get("hours")
            s_tasks = subject_tasks.get(s.get("id"), [])
            
            s_metrics = compute_progress(s_tasks)
            s_pct = s_metrics["progress_percentage"]

            # Subject Header Box
            canvas.set_color(0.92, 0.94, 0.97)
            canvas.draw_rect(left, y - 22, 515, 22, fill=True, stroke=False)

            canvas.set_color(*c_dark)
            canvas.set_font("Helvetica-Bold", 10)
            canvas.draw_text(left + 8, y - 14, f"{s_name.upper()}")

            canvas.set_font("Helvetica", 9)
            canvas.set_color(*c_muted)
            hours_str = f" | {s_hours}h" if s_hours else ""
            canvas.draw_text(left + 220, y - 14, f"Prof: {s_prof}{hours_str}")

            canvas.set_color(*c_primary)
            canvas.set_font("Helvetica-Bold", 9)
            canvas.draw_text(left + 420, y - 14, f"Progresso: {s_pct:.1f}%")

            y -= 32

            # List tasks under this subject
            if not s_tasks:
                canvas.set_color(*c_muted)
                canvas.set_font("Helvetica", 9)
                canvas.draw_text(left + 20, y - 5, "- Nenhuma tarefa cadastrada nesta disciplina.")
                y -= 16
            else:
                for t in s_tasks:
                    t_title = t.get("title") or "Tarefa"
                    t_status = str(t.get("status", "")).strip().lower()
                    is_done = t_status in ("completed", "concluida", "concluída")
                    status_label = "[CONCLUIDA]" if is_done else "[PENDENTE]"
                    due_date = t.get("due_date") or "-"

                    canvas.set_color(*(c_green if is_done else c_muted))
                    canvas.set_font("Helvetica-Bold", 8)
                    canvas.draw_text(left + 20, y - 5, status_label)

                    canvas.set_color(*c_dark)
                    canvas.set_font("Helvetica", 9)
                    canvas.draw_text(left + 95, y - 5, f"{t_title}")

                    canvas.set_color(*c_muted)
                    canvas.draw_text(left + 400, y - 5, f"Prazo: {due_date}")

                    y -= 16

                    if y < 70:  # New page if close to bottom
                        canvas._new_page()
                        y = top

            y -= 12

    # Footer
    canvas.set_stroke_color(*c_card_border)
    canvas.draw_line(left, 40, left + 515, 40, width=0.5)

    canvas.set_color(*c_muted)
    canvas.set_font("Helvetica", 8)
    canvas.draw_text(left, 28, "EduTrack AI - Sistema de Gestao Academica Inteligente")
    canvas.draw_text(left + 420, 28, "Pagina 1 de 1")

    # Write output PDF
    pdf_bytes = canvas.build_pdf_bytes()
    if output_path is None:
        return pdf_bytes

    out_file = Path(output_path).resolve()
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "wb") as f:
        f.write(pdf_bytes)

    return str(out_file)


def generate_pdf_bytes(student=None, subjects=None, tasks=None):
    """
    Generate and return student performance PDF report as raw bytes in memory.
    Ideal for direct web streaming and Streamlit st.download_button.
    """
    return generate_pdf_report(student=student, subjects=subjects, tasks=tasks, output_path=None)


def fetch_and_generate_report(auth_token=None, output_path="relatorio_desempenho.pdf"):
    """
    Fetch student data from live APIs and generate the PDF report.
    """
    from services.auth_service import get_current_user
    from services.xano_adapter import fetch_subjects, fetch_academic_tasks

    student = {}
    subjects = []
    tasks = []

    if auth_token:
        # Get user profile
        u_ok, u_resp = get_current_user(auth_token)
        if u_ok and isinstance(u_resp, dict):
            student = u_resp

        # Get subjects
        s_ok, s_resp = fetch_subjects(auth_token=auth_token)
        if s_ok and isinstance(s_resp, list):
            subjects = s_resp

        # Get tasks
        t_ok, t_resp = fetch_academic_tasks(auth_token=auth_token)
        if t_ok and isinstance(t_resp, list):
            tasks = t_resp

    return generate_pdf_report(student=student, subjects=subjects, tasks=tasks, output_path=output_path)


def main():
    """CLI execution entrypoint."""
    output_path = sys.argv[1] if len(sys.argv) > 1 else "relatorio_desempenho.pdf"
    auth_token = sys.argv[2] if len(sys.argv) > 2 else _get_secret("AUTH_TOKEN")

    print(f"Gerando relatorio de desempenho academico em '{output_path}'...")
    pdf_path = fetch_and_generate_report(auth_token=auth_token, output_path=output_path)
    print(f"Relatorio gerado com sucesso: {pdf_path}")


if __name__ == "__main__":
    main()

