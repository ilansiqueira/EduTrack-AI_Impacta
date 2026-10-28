## Context

See proposal.md - Why.
EduTrack AI currently has CRUD endpoints for academic tasks (`GET /academic_tasks`) with user authentication and optional filtering by `subject_id`. The application needs a standalone and reusable Python component to compute academic progress metrics for individual subjects.

## Goals / Non-Goals

**Goals:**
- Create `scripts/calculate_progress.py` providing a clean, reusable function `calculate_subject_progress(subject_id, auth_token=None)`.
- Query `GET /academic_tasks?subject_id={subject_id}` using standard library (`urllib.request`) and authentication headers.
- Calculate:
  - `total_tasks`: total count of tasks for the subject.
  - `completed_tasks`: count of tasks where status is marked as completed (handling case-insensitive `"completed"` and `"concluída"`).
  - `progress_percentage`: `(completed_tasks / total_tasks) * 100`, rounded to 2 decimal places.
  - Edge case: return `0.0` when `total_tasks == 0` without division errors.
- Return the output as a valid JSON string (or dictionary when imported).
- Provide CLI support: `python scripts/calculate_progress.py <subject_id>` outputting JSON to standard output.

**Non-Goals:**
- Direct modification of Xano database tables or backend endpoints.
- Integration into Streamlit UI pages (deferred to future page-level integration tasks).

## Decisions

- **Decision 1: Standard Library Only**
  - *Rationale*: Rely exclusively on `json`, `os`, `sys`, and `urllib.request` to ensure zero additional external dependencies and seamless portability.
  - *Alternative considered*: Using `requests`; rejected to avoid adding new package requirements when `urllib.request` is already established in `services/xano_adapter.py`.

- **Decision 2: Flexible Status Matching**
  - *Rationale*: Tasks may have status in English (`"completed"`) or Portuguese (`"concluída"`). The function normalizes and checks both variations to maintain consistency.
  - *Alternative considered*: Strict English only; rejected because UI may submit localized status strings.

- **Decision 3: Dual Interface (CLI and Importable Module)**
  - *Rationale*: The script can be executed as a command-line utility or imported as a helper function across services.
  - *Alternative considered*: CLI only; rejected because Streamlit pages will need to import the calculation logic directly.

## Risks / Trade-offs

- [Risk] Network or API failure when querying endpoint → Mitigation: Implement try/except block returning a structured JSON error response (`{"error": "...", "status_code": 500}`).
- [Risk] Subject with no tasks triggers division by zero → Mitigation: Guard clause checking if `total_tasks == 0` before calculating division.

