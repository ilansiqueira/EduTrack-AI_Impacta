# Tasks

## 1. Project Scaffolding & Design System Foundation

- [x] 1.1 Initialize the Vite + React + TypeScript project inside `frontend/` with Tailwind CSS, `react-router-dom`, `lucide-react`, `jspdf`, and `vitest`, and verify `npm install` completes cleanly in `frontend/`.
- [x] 1.2 Configure **Google Sans** primary typography (`Google Sans`, `Google Sans Display`, `Plus Jakarta Sans` fallback), light/dark theme CSS variables, and reusable UI primitives (Button, Card, Modal, Badge, Input, EmptyState), and verify `index.html` and global stylesheet load the font stack and theme tokens.
- [x] 1.3 Add `frontend/vercel.json` SPA rewrite rules, `frontend/.env.example`, and `.gitignore` rules for `node_modules/`, `dist/`, and `.env.local`, and verify expected files exist without exposing secrets in `git status`.

## 2. Xano API Client & Authentication Session

- [x] 2.1 Implement `frontend/src/services/api.ts` covering URL normalization (`VITE_XANO_AUTH_BASE_URL`, `VITE_XANO_SUBJECTS_BASE_URL`, `VITE_XANO_TASKS_BASE_URL`, `VITE_XANO_API_BASE_URL`), Bearer token headers, `401` interception, and typed Auth/Subjects/Tasks methods, and verify unit tests for URL resolution and error handling pass via `npm test`.
- [x] 2.2 Implement `AuthProvider` (`localStorage` token persistence, `auth/me` hydration on boot, login, signup, logout) and `ProtectedRoute` guard, and verify unauthenticated navigation redirects to `/login`.
- [x] 2.3 Build the split-screen `/login` and `/cadastro` pages plus `/perfil` account view with client-side validation and API configuration notices, and verify form validation and profile rendering compile cleanly.

## 3. Academic Workspace (Dashboard, Subjects, Tasks & PDF Export)

- [x] 3.1 Implement `AcademicProvider` workspace store (`subjects`, `tasks`, progress computation helper, optimistic status toggle, CRUD actions) and verify progress calculation unit tests (including 0-task division safety and status normalization) pass via `npm test`.
- [x] 3.2 Build the live **Dashboard** page (`/`) with real-time KPI cards, overall and per-subject progress bars, overdue/upcoming task alerts, and empty-state CTAs, and verify it renders both populated and zero-data states.
- [x] 3.3 Build the **Disciplinas** page (`/disciplinas`) with subject cards, workload/teacher badges, progress bars, and Create/Edit/Delete modals (with linked-task warning on delete), and verify full CRUD wiring against `AcademicProvider`.
- [x] 3.4 Build the **Tarefas** page (`/tarefas`) with instant search, subject/status filters, List vs. 3-column Kanban (`Pendente`, `Em Andamento`, `Concluída`) switcher, quick status transitions, and Create/Edit/Delete modals, and verify task filtering and status transitions work without page reloads.
- [x] 3.5 Implement client-side PDF report generator (`frontend/src/utils/pdfReport.ts`) producing `relatorio_desempenho.pdf` with multi-page numbering and unassigned-task support, and verify unit test generates non-empty `%PDF-` bytes for both populated and empty task lists.

## 4. Responsive Shell, Documentation & Build Verification

- [x] 4.1 Wire the responsive `AppShell` (desktop sidebar + mobile navigation drawer, theme toggle, quick PDF export button, toast notifications) across all authenticated routes and verify desktop and mobile layouts have no TypeScript or layout errors.
- [x] 4.2 Document local setup and Vercel deployment instructions (`Root Directory: frontend` and `VITE_XANO_*` variables) in `frontend/README.md` and root `README.md`, and verify the documented commands match `frontend/package.json`.
- [x] 4.3 Run end-to-end verification (`npm test` and `npm run build` in `frontend/`) and verify zero TypeScript errors and a production `frontend/dist/` bundle ready for Vercel.
