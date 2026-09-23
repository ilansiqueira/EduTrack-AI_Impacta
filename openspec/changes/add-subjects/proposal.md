## Why

Students using EduTrack AI need to manage their academic subjects (disciplinas) to track progress, link tasks, and view active coursework on the dashboard. Currently, the "Disciplinas" menu option only displays placeholder text, and active subject metrics remain hardcoded to zero. Introducing subject management provides the foundational structure for organizing coursework and academic schedules.

## What Changes

- Create subject management functionality allowing students to create, view, and manage academic subjects (e.g., name, professor, semester, workload/status).
- Update the Streamlit UI in `app.py` under the "Disciplinas" tab to display existing subjects and include a form to add new subjects.
- Connect the Dashboard metric ("Disciplinas Ativas") to reflect real subject counts.
- Define data structures and backend API/table requirements for subjects storage and retrieval.

## Capabilities

### New Capabilities
- `subjects`: Academic subject (disciplina) management enabling students to register, list, and monitor academic subjects.

### Modified Capabilities

## Impact

- Frontend: `app.py` (Streamlit application - "Disciplinas" tab and Dashboard metrics)
- Backend: Subjects schema / table and API endpoints for listing and creating subjects
- Dependencies: Streamlit (existing)

