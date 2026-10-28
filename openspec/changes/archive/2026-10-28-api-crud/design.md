## Context

See proposal.md - Why.
In EduTrack AI, backend security and multi-tenancy are governed by the strict guidelines in `AGENTS.md`:
1. Every query and mutation MUST filter by the authenticated user's `user_id` (`$auth.id`).
2. Endpoints follow standard RESTful paths and methods (`GET`, `POST`, `PATCH`, `DELETE`).
3. Implementation of XanoScript API files (`apis/`) is delegated to the specialized **Xano API Query Writer** agent.

## Goals / Non-Goals

**Goals:**
- Design complete RESTful CRUD endpoints for `subjects`:
  - `GET /subjects`: Query all subjects with condition `user_id == $auth.id`.
  - `POST /subjects`: Insert subject setting `user_id = $auth.id`.
  - `PATCH /subjects/{id}`: Update subject filtered by `id == $input.id AND user_id == $auth.id`.
  - `DELETE /subjects/{id}`: Delete subject filtered by `id == $input.id AND user_id == $auth.id`.
- Design complete RESTful CRUD endpoints for `academic_tasks`:
  - `GET /academic_tasks`: Query all tasks with condition `user_id == $auth.id` (supports `subject_id` filter).
  - `POST /academic_tasks`: Insert task verifying `subject_id` ownership and setting `user_id = $auth.id`.
  - `PATCH /academic_tasks/{id}`: Update task filtered by `id == $input.id AND user_id == $auth.id`.
  - `DELETE /academic_tasks/{id}`: Delete task filtered by `id == $input.id AND user_id == $auth.id`.
- Enforce authentication requirement (`auth = true`) on all endpoints.
- Return standard HTTP status codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403/404 Not Found).

**Non-Goals:**
- Admin cross-tenant visibility endpoints.
- Batch import/export CSV endpoints.
- Executing push or deployment to remote Xano (Rule 2 of AGENTS.md).

## Decisions

- **Decision 1: Composite Tenant Filtering on All Resource Lookups**
  - *Rationale*: To prevent IDOR (Insecure Direct Object Reference) vulnerabilities, every operation targeting an ID (`PATCH /subjects/{id}`, `DELETE /subjects/{id}`, etc.) must apply the composite condition `WHERE id = $id AND user_id = $auth.id`.
  - *Alternative considered*: Filtering only on listing; rejected because users could manipulate IDs on patch/delete to modify other users' data.

- **Decision 2: Cross-Resource Validation on Task Creation**
  - *Rationale*: When creating a task linked to a `subject_id`, the endpoint must verify that the specified `subject_id` actually belongs to the authenticated user before creating the record.
  - *Alternative considered*: Blindly trusting the `subject_id`; rejected because users could attach tasks to other users' subjects.

- **Decision 3: Agent Delegation per AGENTS.md**
  - *Rationale*: The orchestrator formalizes the contracts and requirements. Generation of endpoint files in `apis/` is delegated to the **Xano API Query Writer**.

## Risks / Trade-offs

- [Risk] Accidental deletion of cascade items → Mitigation: Xano relational integrity handles foreign key constraints between `academic_tasks` and `subjects`.
- [Risk] Performance on large task listings → Mitigation: Existing indexes on `academic_tasks(user_id)` and `subjects(user_id)` ensure index-backed fast queries.

