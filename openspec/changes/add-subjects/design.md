## Context

See proposal.md - Why.
EduTrack AI currently has a Streamlit frontend (`app.py`) with placeholder sections and metrics. The project integrates with Xano as a backend database and API layer.

## Goals / Non-Goals

**Goals:**
- Provide a clean data model for academic subjects (ID, name, professor, semester, status, creation timestamp).
- Implement an interactive UI in `app.py` for listing subjects, viewing details, and submitting new subjects via a form.
- Dynamically link the Dashboard metric "Disciplinas Ativas" to the real count of active subjects.
- Define backend specifications (Xano table/API) for subject persistence.

**Non-Goals:**
- Automated grade calculation, grading scales, or attendance tracking (future scope).
- Complex role-based permissions or multi-institution management.

## Decisions

- **Decision 1: Streamlit State with Graceful Backend Integration**
  - *Rationale*: Manage subjects in Streamlit's `st.session_state` with initial mock/seed data, while preparing the endpoint adapter for Xano API calls. This enables immediate testing and UI interactivity even when working offline or prior to API deployment.
  - *Alternative considered*: Hard-requiring active live API calls immediately, which would block frontend development/testing if backend credentials or endpoints are in transition.

- **Decision 2: Schema Design for Subjects**
  - *Rationale*: A `subjects` entity containing `id` (int/uuid), `name` (text, required), `professor` (text, optional), `semester` (text, optional), `status` (enum: "active", "completed", "archived"), and `created_at` (timestamp).
  - *Alternative considered*: Storing subjects as unstructured JSON inside user profiles; rejected because relational linkage to tasks and assignments will be needed later.

- **Decision 3: User Interface Pattern in Streamlit**
  - *Rationale*: Use `st.form` for subject creation with clean input validation and feedback alerts (`st.success`, `st.error`). Display subjects as organized cards/expanders or a formatted data table.
  - *Alternative considered*: Separate page/multipage navigation; rejected for now to maintain simplicity within the current single-script radio menu navigation.

## Risks / Trade-offs

- [Risk] Backend offline or credentials not configured → Mitigation: Session-state fallback ensures the user experience remains testable and functional.
- [Risk] Duplicate subject entries → Mitigation: Validate that subject name is non-empty and case-insensitively unique before adding.

