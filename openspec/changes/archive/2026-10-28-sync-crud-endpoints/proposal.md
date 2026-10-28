## Why

The backend CRUD endpoints for subjects and academic tasks belong to dedicated Xano API groups with specific URLs. Configuring these base URLs in the `.env` file and updating the communication adapters ensures direct and reliable synchronization between the Streamlit interface (Disciplinas and Tarefas) and the Xano backend tables.

## What Changes

- Save explicit CRUD endpoint base URLs in `.env`:
  - `XANO_SUBJECTS_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:XHzo28jo`
  - `XANO_TASKS_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:8O4izkGb`
- Update `services/xano_adapter.py` to resolve endpoint URLs per resource (`subjects` via `XANO_SUBJECTS_BASE_URL` and `academic_tasks` via `XANO_TASKS_BASE_URL`).
- Update `scripts/calculate_progress.py` to use `XANO_TASKS_BASE_URL`.
- Validate that `pages/1_📚_Disciplinas.py` and `pages/2_📝_Tarefas.py` synchronize with live Xano tables using these URLs.

## Capabilities

### Modified Capabilities
- `subjects-tasks-ui`: Synchronizes subjects and academic tasks using dedicated environment configuration URLs.

## Impact

- `.env` is updated with `XANO_SUBJECTS_BASE_URL` and `XANO_TASKS_BASE_URL`.
- `services/xano_adapter.py` resolves individual API group URLs.
- `scripts/calculate_progress.py` supports `XANO_TASKS_BASE_URL`.

