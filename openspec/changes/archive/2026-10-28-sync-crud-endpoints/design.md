## Context

See proposal.md - Why.
In Xano, API groups have unique canonical paths:
- Auth API Group: `https://x8ki-letl-twmt.n7.xano.io/api:ofuaVoV6`
- Subjects API Group: `https://x8ki-letl-twmt.n7.xano.io/api:XHzo28jo`
- Academic Tasks API Group: `https://x8ki-letl-twmt.n7.xano.io/api:8O4izkGb`

## Goals / Non-Goals

**Goals:**
- Store `XANO_SUBJECTS_BASE_URL` and `XANO_TASKS_BASE_URL` in `.env`.
- Update `services/xano_adapter.py` with dedicated resolvers:
  - `get_subjects_base_url()`
  - `get_tasks_base_url()`
- Update `scripts/calculate_progress.py` to use `XANO_TASKS_BASE_URL`.
- Ensure `pages/1_📚_Disciplinas.py` and `pages/2_📝_Tarefas.py` consume live endpoints through the adapter.

**Non-Goals:**
- Modifying backend schemas or Xano server configurations.
- Pushing/deploying code to Xano (Rule 2 of AGENTS.md).

## Decisions

- **Decision 1: Individual Resource Resolvers with Fallback**
  - *Rationale*: Because Xano groups endpoints by distinct API group tokens, separate helper functions `get_subjects_base_url()` and `get_tasks_base_url()` allow cleanly targeting each group while falling back to a shared base URL if needed.
  - *Alternative considered*: A single global base URL; rejected because the user provided two distinct group endpoints.

- **Decision 2: Seamless .env Loading**
  - *Rationale*: Both `services/xano_adapter.py` and `scripts/calculate_progress.py` automatically load `.env` on startup, ensuring that local executions immediately recognize the new URLs.

## Risks / Trade-offs

- [Risk] Formatting variations in .env (quotes, trailing slashes) → Mitigation: Apply `.strip().strip('"').strip("'").rstrip("/")` in parsing functions.

