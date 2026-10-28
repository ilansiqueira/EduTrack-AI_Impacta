## Context

See proposal.md - Why.
The EduTrack AI Streamlit frontend currently contains mockup pages for Disciplinas (`pages/1_📚_Disciplinas.py`) and Tarefas (`pages/2_📝_Tarefas.py`). User authentication is managed in `pages/3_👤_Perfil.py` storing the JWT in `st.session_state.auth_token`. The backend endpoints (`GET/POST /subjects` and `GET/POST/PATCH/DELETE /academic_tasks`) are defined and ready for communication.

## Goals / Non-Goals

**Goals:**
- Expand `services/xano_adapter.py` with standard helper functions for:
  - `fetch_subjects(auth_token)`
  - `create_subject(name, teacher=None, hours=None, auth_token=None)`
  - `fetch_academic_tasks(subject_id=None, auth_token=None)`
  - `create_academic_task(title, subject_id, description=None, due_date=None, status="pending", auth_token=None)`
  - `update_academic_task(task_id, fields, auth_token=None)`
- Update `pages/1_📚_Disciplinas.py` to:
  - Enforce authentication check using `st.session_state.auth_token`.
  - List live subjects retrieved from Xano.
  - Create new subjects matching `subjects` schema (`name`, `teacher`, `hours`).
- Update `pages/2_📝_Tarefas.py` to:
  - Enforce authentication check using `st.session_state.auth_token`.
  - List live tasks with filters for subject and status.
  - Provide an interactive form to create a new task associated with one of the user's subjects.
  - Allow toggling completion status with live PATCH updates.

**Non-Goals:**
- Offline caching database (local SQLite or IndexedDB).
- Server-side push or deployment to remote Xano instance (Rule 2).

## Decisions

- **Decision 1: Centralized Adapter Methods in `services/xano_adapter.py`**
  - *Rationale*: Consolidate HTTP requests, JSON parsing, error handling, and authorization header injection in a single service layer rather than duplicating HTTP calls across Streamlit page scripts.
  - *Alternative considered*: Direct `urllib` calls in page files; rejected due to maintenance overhead and duplication.

- **Decision 2: Strict Session Guard on Protected Pages**
  - *Rationale*: Since the Xano endpoints require `auth = "user"`, querying without a valid token will fail. Displaying a friendly warning directing the user to login provides immediate guidance.
  - *Alternative considered*: Silent failure; rejected because users wouldn't know why data isn't loading.

- **Decision 3: Schema Alignment for Form Fields**
  - *Rationale*: Form inputs must map directly to Xano schema definitions (`subjects`: `name`, `teacher`, `hours`; `academic_tasks`: `title`, `description`, `due_date`, `status`, `subject_id`).
  - *Alternative considered*: Generic dynamic dictionaries; rejected to ensure strict typing and field validation.

## Risks / Trade-offs

- [Risk] User has no subjects registered when creating a task → Mitigation: In Tarefas page, check if subjects list is empty and prompt user to create a subject in Disciplinas first before adding tasks.
- [Risk] Network latency during Streamlit reruns → Mitigation: Use concise API payloads and clear loading state indicators (`st.spinner`).

