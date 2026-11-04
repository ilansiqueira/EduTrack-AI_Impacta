## Context

See proposal.md - Why.
EduTrack AI has functional authentication, subjects management, academic tasks CRUD, and progress calculation logic. The user requested:
1. A Python script to generate a PDF summarizing the student's performance.
2. A Xano endpoint to download this report file.

## Goals / Non-Goals

**Goals:**
- Implement a Python script (`scripts/generate_student_report.py`) that gathers student performance data (student profile, enrolled subjects, tasks, and completion percentages) and compiles a clean, formatted PDF document.
- Support both CLI usage (`python scripts/generate_student_report.py <student_id> [output_path]`) and module importation (`generate_pdf_report(student_data, output_path)`).
- Create an authenticated XanoScript endpoint file (`apis/reports/download_student_report_GET.xs` or `api/reports/download_GET.xs`) that requires `auth = "user"`, fetches the student's academic records filtered by `$auth.id`, and returns the report file or download payload with proper headers (`Content-Type: application/pdf`, `Content-Disposition: attachment`).

**Non-Goals:**
- Automated email delivery of reports.
- UI redesign or extra unrequested endpoints (per Rule 1 of AGENTS.md).
- Push or deployment to remote Xano server (per Rule 2 of AGENTS.md).

## Decisions

- **Decision 1: Report Content and Metrics**
  - *Rationale*: The report will present student identity (name, email), date of generation, summary of enrolled subjects, breakdown of tasks per subject (total, pending, completed), and the global completion percentage calculated according to the logic in `scripts/calculate_progress.py`.
  - *Alternative considered*: Only raw task list; rejected because a performance report requires high-level metric summaries.

- **Decision 2: PDF Generation Library Strategy**
  - *Rationale*: Use ReportLab (or standard canvas generation / FPDF) in Python with graceful fallback to ensure cross-platform compatibility and clear formatting.
  - *Alternative considered*: HTML-to-PDF via headless browser; rejected due to unnecessary external binary dependencies.

- **Decision 3: Authenticated Xano Download Endpoint**
  - *Rationale*: Following XanoScript guidelines, the endpoint is created under `apis/reports/` with `auth = "user"`, ensuring multi-tenancy by filtering subjects and tasks where `user_id == $auth.id`.
  - *Alternative considered*: Public endpoint with user_id query param; rejected due to IDOR security risk.

## Risks / Trade-offs

- [Risk] Missing Python PDF library in execution environment → Mitigation: Include requirements or clear error messages with instructions (`pip install reportlab`), or pure Python canvas generation.
- [Risk] Empty academic data for newly registered student → Mitigation: Generate a valid PDF stating that no academic tasks or subjects have been registered yet, avoiding generation failure.

