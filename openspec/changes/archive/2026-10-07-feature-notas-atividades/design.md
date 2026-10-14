## Context

See proposal.md - Why.
Following the strict guidelines in AGENTS.md, the functionality is focused exclusively on allowing professors to submit grades for students on specific activities.

## Goals / Non-Goals

**Goals:**
- Define the schema for the `activity_grades` database table in Xano:
  - `id`: integer primary key
  - `created_at`: timestamp (default `now`, private visibility)
  - `student_id`: integer foreign key referencing the student
  - `activity_id`: integer foreign key referencing the evaluated activity
  - `grade`: decimal (numerical grade, e.g., 0.00 to 10.00)
  - `feedback`: text optional (professor's feedback/comments)
  - `user_id` / `graded_by`: integer foreign key referencing the authenticated professor
- Define the API contract for `POST /activity_grades` to submit and store grades.
- Keep the task scope strictly restricted to what was explicitly requested (Rule 1 of AGENTS.md).

**Non-Goals:**
- Creating GET endpoints to list grades (`GET /academic_tasks/{id}/grades` or `GET /users/{id}/grades`), which are explicitly out of scope per AGENTS.md Rule 1.
- Statistical grade curves, averages calculation, or GPA tracking.

## Decisions

- **Decision 1: Strict Adherence to AGENTS.md Scope (Rule 1)**
  - *Rationale*: AGENTS.md specifically highlights this exact feature as an example of scope control: do NOT create GET listing endpoints unless explicitly requested by the user.
  - *Alternative considered*: Adding full CRUD; rejected as a direct violation of Rule 1.

- **Decision 2: Relational Schema for `activity_grades`**
  - *Rationale*: Relate grade to the student (`student_id`), the task (`activity_id`), and the evaluating professor (`graded_by` / `user_id`).
  - *Alternative considered*: Embedding grades inside user or task records; rejected to maintain clean normalized data modeling.

- **Decision 3: Agent Delegation per AGENTS.md**
  - *Rationale*: The orchestrator specifies the architecture; Xano Table Designer handles table creation, and Xano API Query Writer handles the POST endpoint.

## Risks / Trade-offs

- [Risk] Multiple grade submissions for the same activity and student → Mitigation: Compound unique index on `[activity_id, student_id]` to enforce data integrity or update existing grade on re-submission.

