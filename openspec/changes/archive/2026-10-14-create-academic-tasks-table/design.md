## Context

See proposal.md - Why.
Following the EduTrack AI guidelines in AGENTS.md, table schemas in Xano must link to authenticated students via `user_id`, maintain clean foreign keys to related entities (here, `subjects`), and task scope must be strictly restricted to the explicit user request (creation of the table).

## Goals / Non-Goals

**Goals:**
- Formulate the XanoScript table schema definition for `academic_tasks`:
  ```xs
  table academic_tasks {
    auth = false
    tags = ["tasks", "academics"]

    schema {
      int id
      timestamp created_at?=now { visibility = "private" }
      text title filters=trim
      text description? filters=trim
      date due_date?
      text status?="pending" filters=trim
      int subject_id { table = "subjects" }
      int user_id { table = "user" }
    }

    index = [
      {type: "primary", field: [{name: "id"}]},
      {type: "btree", field: [{name: "created_at", op: "desc"}]},
      {type: "btree", field: [{name: "user_id", op: "asc"}]},
      {type: "btree", field: [{name: "subject_id", op: "asc"}]},
      {type: "btree", field: [{name: "due_date", op: "asc"}]}
    ]
  }
  ```
- Incorporate all fields requested by user: `title` (text), `description` (text), `due_date` (date), `status` (text), and `subject_id` (reference to `subjects`), alongside primary `id`, `created_at`, and `user_id` (reference to `user` per AGENTS.md schema guidelines).
- Keep the task scope strictly restricted to table creation per AGENTS.md Rule 1.

**Non-Goals:**
- Creating CRUD APIs (GET/POST/PATCH/DELETE) or Streamlit frontend implementations in this change, as they were not explicitly requested.
- Deploying or pushing changes to remote Xano (Rule 2 of AGENTS.md).

## Decisions

- **Decision 1: Strict Task Scope per AGENTS.md Rule 1**
  - *Rationale*: AGENTS.md Rule 1 dictates that only explicitly requested items are added to `tasks.md`. The user only requested planning the creation of the table `academic_tasks`.
  - *Alternative considered*: Adding task APIs and UI components; rejected as a direct violation of Rule 1.

- **Decision 2: Foreign Key Linkages**
  - *Rationale*: `subject_id` references `table = "subjects"`, and `user_id` references `table = "user"`. This ensures tasks are categorized by course and filtered per student.
  - *Alternative considered*: Omit `user_id` and rely only on `subject_id`; rejected because AGENTS.md explicitly mandates `user_id` on queryable entities for security and filtering.

- **Decision 3: Default Status and Filters**
  - *Rationale*: Use `text status?="pending"` to provide a clean default lifecycle status for new tasks, with `filters=trim` on text fields.

## Risks / Trade-offs

- [Risk] Orphaned tasks if a subject is deleted → Mitigation: Xano relational integrity handles foreign key constraints.
- [Risk] Performance degradation on large task lists → Mitigation: Composite indexes on `[user_id]`, `[subject_id]`, and `[due_date]` allow fast filtering and sorting.

