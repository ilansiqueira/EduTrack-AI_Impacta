## Why

Students and academic advisors need a tangible, exportable summary of academic progress and performance. Generating a structured PDF report and providing a secure Xano endpoint to download it allows students to export and archive their performance history outside the application.

## What Changes

- Create a Python script (`scripts/generate_student_report.py` or similar) to compile student performance (enrolled subjects, completed/pending tasks, progress percentage) and render it into a formatted PDF document.
- Create an authenticated Xano API endpoint (e.g., `GET /reports/student_performance` or `GET /student_report/download`) to serve or stream the student performance report file for download.
- Ensure strict multi-tenancy by filtering all exported academic performance data by the authenticated user's ID (`$auth.id`).

## Capabilities

### New Capabilities
- `student-performance-report`: Python script for compiling and rendering student performance PDF reports and authenticated Xano endpoint for downloading the report.

### Modified Capabilities

## Impact

- New script in `scripts/generate_student_report.py`.
- New Xano API endpoint query file in `api/reports/` / `apis/reports/`.
- Requires Python PDF generation capability (e.g. `reportlab` or standard canvas/HTML-to-PDF or minimal pure Python PDF generator / FPDF).
- Connects to existing user data, subjects, and academic tasks filtered by authenticated user.

