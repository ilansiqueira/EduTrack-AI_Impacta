# Proposal

## Why

The current Streamlit interface looks generic and prototype-like—suffering from full-page reruns on every interaction, ephemeral login state lost on browser refresh, incomplete edit workflows, and rigid table layouts. Building a dedicated modern React (Vite + Tailwind CSS) Single-Page Application ready for zero-config Vercel deployment delivers a polished, commercial-grade SaaS experience styled around **Google Sans** typography while reusing 100% of the existing Xano REST backend.

## What Changes

- Introduce a new standalone React + TypeScript + Vite + Tailwind CSS application under `frontend/` without breaking or removing the existing Streamlit app or Xano scripts.
- Establish a modern SaaS design system featuring **Google Sans** as the primary typeface, refined color tokens, subtle elevation/glassmorphism accents, responsive mobile/desktop navigation, smooth micro-interactions, and dark/light mode support.
- Implement a dedicated split-screen Authentication experience (`auth/login`, `auth/signup`, `auth/me`) with persistent browser session storage (`localStorage`), route protection, and automatic `401` session expiration handling.
- Build a live **Academic Dashboard** displaying real-time KPIs (enrolled subjects, pending/in-progress/completed tasks, overall completion rate), per-subject progress bars, and upcoming/overdue task highlights.
- Build full **Subjects (Disciplinas) CRUD** with visual subject cards, per-subject task progress indicators, and modal dialogs for creating, editing (`PATCH`), and deleting subjects.
- Build a rich **Academic Tasks (Tarefas) Workspace** supporting both Card List and Kanban Board (`Pendente`, `Em Andamento`, `Concluída`) views, instant client-side search and filters, full create/edit/delete modals, one-click status transitions, and client-side **PDF Performance Report** generation with multi-page pagination.
- Add Vercel SPA routing configuration (`frontend/vercel.json`) and `.env.example` documenting `VITE_XANO_AUTH_BASE_URL`, `VITE_XANO_SUBJECTS_BASE_URL`, `VITE_XANO_TASKS_BASE_URL`, and optional `VITE_XANO_API_BASE_URL`.

## Capabilities

### New Capabilities
- `web-design-system`: Modern React + Vite + Tailwind UI foundation using Google Sans as the primary font, responsive app shell, theme support, and Vercel SPA deployment configuration.
- `web-auth-session`: Client-side authentication views (login, signup, profile inspection) with persistent token storage, `auth/me` session hydration, and protected routing against Xano Auth endpoints.
- `web-academic-workspace`: Interactive Dashboard, full Subjects CRUD, full Academic Tasks CRUD (list and Kanban views with `pending`, `in_progress`, and `completed` states), and browser-generated Student Performance PDF export.

### Modified Capabilities

## Impact

- **New Directory**: `frontend/` containing the Vite + React + TypeScript + Tailwind CSS project, `package.json`, `vercel.json`, and `.env.example`.
- **Backend / APIs**: Consumes existing Xano REST endpoints (`auth/login`, `auth/signup`, `auth/me`, `/subjects`, `/academic_tasks`) via Bearer token authentication—no backend schema or XanoScript breaking changes required.
- **Existing Code**: Preserves `app.py`, `pages/`, `services/`, and `scripts/` intact for backwards compatibility.
- **Deployment**: Ready for direct deployment on Vercel by setting Root Directory to `frontend` and configuring `VITE_XANO_*` environment variables.
