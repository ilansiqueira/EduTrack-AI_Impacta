# Design

## Context

See `proposal.md - Why` for motivation. EduTrack AI already has a working Xano backend organized into separate API groups (`XANO_AUTH_BASE_URL`, `XANO_SUBJECTS_BASE_URL`, `XANO_TASKS_BASE_URL`, with optional `XANO_API_BASE_URL` fallback). Inspection of the XanoScript definitions shows:
- `POST auth/login` and `POST auth/signup` return `{ authToken, user_id }`, while `GET auth/me` returns the authenticated `user` profile (`id`, `name`, `email`, `role`).
- `GET/POST/PATCH/DELETE /subjects` and `/academic_tasks` enforce `auth = "user"` via `Authorization: Bearer <token>`.
- `GET reports/student_performance` on Xano returns a JSON payload (`{ student, subjects, tasks }`) rather than binary PDF bytes; actual PDF layout was previously rendered in Python (`scripts/generate_student_report.py`).
- Existing Python/Streamlit files at the repository root must remain functional and untouched.

## Goals / Non-Goals

**Goals:**
- Isolate the new frontend cleanly inside `frontend/` with zero interference with the root Python environment.
- Deliver an instant, zero-flicker SaaS interface anchored by **Google Sans** typography, refined spacing, dark/light themes, and responsive desktop/mobile layouts.
- Maintain 100% URL-format compatibility with the existing Xano base URL conventions (whether the configured base URL already ends with `/auth`, `/subjects`, `/academic_tasks`, or only the API group root).
- Provide complete CRUD coverage (including Subject and Task editing via `PATCH`, which was missing in Streamlit) plus client-side vector PDF export with accurate multi-page numbering.

**Non-Goals:**
- Modifying Xano database schemas (`.xs` tables) or breaking existing Xano REST endpoints.
- Removing or rewriting the legacy Streamlit app (`app.py`, `pages/`).
- Server-side rendering (SSR) or custom Node backend proxies.

## Decisions

### 1. Vite + React + TypeScript SPA in `frontend/` over Next.js
- **Choice**: Vite + React + TypeScript + Tailwind CSS + `react-router-dom` + `lucide-react` inside `frontend/`.
- **Rationale**: Every data and auth operation already runs directly against Xano REST APIs. A static SPA builds in seconds, deploys to Vercel's global CDN with zero cold-start latency, and avoids unnecessary SSR server complexity.
- **Alternatives considered**:
  - *Next.js App Router*: Adds server runtime overhead and extra routing complexity with no SEO requirement (authenticated student workspace).
  - *Streamlit Custom Components*: Retains Streamlit's iframe constraints and Python rerun latency.

### 2. Google Sans Typography & Visual Design System
- **Choice**: Configure `--font-sans: 'Google Sans', 'Google Sans Text', 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif` in CSS/Tailwind, loading webfont stylesheets with `Plus Jakarta Sans` metric-compatible fallback so devices without local/webfont Google Sans still preserve clean geometric proportions.
- **Visual Direction**:
  - **Surfaces**: Crisp slate/alabaster light theme (`#F8FAFC` canvas, `#FFFFFF` elevated cards with `1px` subtle borders) and deep obsidian dark theme (`#0B1120` canvas, `#111827` cards).
  - **Brand & Status Palette**: Academic Royal Blue (`#2563EB` / `#3B82F6`) primary actions, Emerald (`completed`), Amber (`in_progress`), Slate/Indigo (`pending`), and Rose (`overdue` tasks past `due_date`).
  - **Layout Shell**: Split-screen visual hero + form card for `/login` and `/cadastro`; collapsible glass-accented sidebar + top action bar on desktop and bottom/drawer navigation on mobile for `/`, `/disciplinas`, `/tarefas`, and `/perfil`.

### 3. Unified Xano HTTP Adapter (`src/services/api.ts`)
- **Choice**: Centralize `fetch` calls, endpoint URL normalization, Bearer token injection, and error parsing in one typed adapter module.
- **Rationale**: Mirrors the defensive URL suffix handling in `services/auth_service.py` and `services/xano_adapter.py` (preventing double `/auth/auth` or `/subjects/subjects` paths) and intercepts `HTTP 401` globally to clear `localStorage` and redirect cleanly to `/login`.
- **Alternatives considered**: Scattering `axios` or raw `fetch` calls per component, which duplicates error/token logic.

### 4. Shared Workspace State Cache (`AcademicContext`)
- **Choice**: Provide an authenticated `AcademicProvider` holding `subjects` and `tasks` in memory with optimistic status toggles and targeted mutations (`create`, `update`, `delete`, `refresh`).
- **Rationale**: Switching between Dashboard, Disciplinas, and Tarefas (List or Kanban) becomes instantaneous without redundant Xano round-trips on every keystroke or tab click.

### 5. Browser Vector PDF Report (`jspdf`)
- **Choice**: Generate `relatorio_desempenho.pdf` client-side in TypeScript using `jspdf` directly from `{ user, subjects, tasks }`.
- **Rationale**: Eliminates dependency on Python runtime, renders multi-page headers/footers with accurate `Página X de Y` numbering, includes unassigned tasks safely, and works offline/instantly once workspace data is loaded.
- **Alternatives considered**: `window.print()` CSS print stylesheets (inconsistent browser headers/margins across devices).

## Risks / Trade-offs

- **[Google Sans availability across OSes]** → Declare `'Google Sans'` and `'Google Sans Display'` first in the font stack alongside Google Fonts stylesheet links and `'Plus Jakarta Sans'` as an automatic geometric fallback so typography stays cohesive everywhere.
- **[Xano CORS policies on browser requests]** → Xano API groups enable CORS (`Access-Control-Allow-Origin: *`) by default; use standard `Content-Type: application/json` and `Authorization: Bearer <token>` headers without custom non-standard headers.
- **[Deleting a subject that still has linked tasks]** → Display a confirmation dialog warning how many tasks belong to that subject before calling `DELETE /subjects/{id}`, and gracefully label any remaining orphaned tasks in the UI and PDF report.
- **[SPA 404 on page refresh in Vercel]** → Include `frontend/vercel.json` rewriting `/(.*)` to `/index.html`.

## Migration Plan

1. Scaffold `frontend/` with Vite (React + TypeScript), Tailwind CSS, `react-router-dom`, `lucide-react`, and `jspdf`.
2. Configure `frontend/.env.example` (and local `frontend/.env.local` ignored by `.gitignore`) mapping `VITE_XANO_AUTH_BASE_URL`, `VITE_XANO_SUBJECTS_BASE_URL`, and `VITE_XANO_TASKS_BASE_URL`.
3. Verify production build locally via `npm run build` inside `frontend/`.
4. Deploy on Vercel: import repository `ilansiqueira/EduTrack-AI_Impacta`, set **Root Directory** to `frontend`, add the `VITE_XANO_*` environment variables, and deploy.
5. **Rollback**: Since the root Python/Streamlit files and Xano backend remain unchanged, the Streamlit Cloud deployment continues operating independently as an immediate fallback.
