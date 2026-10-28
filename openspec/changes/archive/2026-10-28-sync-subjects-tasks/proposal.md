## Why

With user authentication and backend CRUD endpoints now available, the Streamlit frontend pages for Disciplinas and Tarefas must transition from mockups to live data synchronization with Xano tables (`subjects` and `academic_tasks`), allowing users to manage their own academic records in real time.

## What Changes

- Update `services/xano_adapter.py` to support CRUD operations for `academic_tasks` (fetch, create, update status, delete) and align with `subjects` endpoints using Bearer authentication.
- Synchronize `pages/1_📚_Disciplinas.py` with Xano:
  - Fetch and list user subjects via `GET /subjects`.
  - Create new subjects via `POST /subjects` bound to the authenticated user.
  - Require user authentication from `st.session_state.auth_token`.
- Synchronize `pages/2_📝_Tarefas.py` with Xano:
  - Fetch and list user academic tasks via `GET /academic_tasks` with optional filtering by status or subject.
  - Create new academic tasks via `POST /academic_tasks` selecting from user's subjects.
  - Update task completion status via `PATCH /academic_tasks/{id}`.
  - Require user authentication from `st.session_state.auth_token`.

## Capabilities

### New Capabilities
- `subjects-tasks-ui`: Frontend integration synchronizing Streamlit Disciplinas and Tarefas screens with authenticated Xano CRUD endpoints.

### Modified Capabilities

## Impact

- `pages/1_📚_Disciplinas.py`: Replaces hardcoded mock data with dynamic API queries and creation form.
- `pages/2_📝_Tarefas.py`: Replaces static expander with real task list, filter by status/subject, creation modal/form, and status toggle.
- `services/xano_adapter.py`: Adds client helper methods for academic tasks CRUD operations.
- Interoperability with session state (`st.session_state.auth_token`).

