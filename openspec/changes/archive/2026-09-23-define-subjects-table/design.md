## Context

See proposal.md - Why.
According to `AGENTS.md`, the orchestrator agent plans and coordinates development, while specialized agents implement XanoScript components. The database already contains the authentication table in `tables/757777_user.xs` (`table user`).

## Goals / Non-Goals

**Goals:**
- Formulate the XanoScript schema definition for `table subjects` adhering strictly to Xano platform best practices.
- Define fields requested by user: `id` (auto/int), `name` (text), `teacher` (text), `hours` (int), and `user_id` (foreign key to `user`).
- Define indexing strategy for optimal relational lookups (`user_id`) and chronological sorting (`created_at`).
- Formulate delegation plan and prompt for the specialized **Xano Table Designer** agent.

**Non-Goals:**
- Creating API endpoints or Streamlit UI changes in this specific change (handled in separate API/Frontend workflows).
- Modifying the existing `user` table structure.

## Decisions

- **Decision 1: Strict Agent Delegation per AGENTS.md**
  - *Rationale*: AGENTS.md establishes that the orchestrator must not directly edit `.xs` files. The orchestrator produces the verified schema contract and hands off implementation to the **Xano Table Designer**.
  - *Alternative considered*: Writing `tables/subjects.xs` directly; rejected as it violates the core rule in `AGENTS.md`.

- **Decision 2: Target Schema Specification**
  - *Rationale*: The exact target structure for `subjects`:
    ```xs
    table subjects {
      auth = false

      schema {
        int id
        timestamp created_at?=now {
          visibility = "private"
        }

        text name filters=trim
        text teacher? filters=trim
        int hours?

        // Foreign key referencing the authentication user table
        int user_id {
          table = "user"
        }
      }

      index = [
        {type: "primary", field: [{name: "id"}]}
        {type: "btree", field: [{name: "created_at", op: "desc"}]}
        {type: "btree", field: [{name: "user_id", op: "asc"}]}
      ]
    }
    ```
  - *Alternative considered*: Storing teacher and hours in an unstructured object; rejected for relational querying.

- **Decision 3: Foreign Key Target Confirmation**
  - *Rationale*: Checked existing codebase (`tables/757777_user.xs`); the table is declared as `table user`. Therefore, `table = "user"` is the exact reference identifier.

## Risks / Trade-offs

- [Risk] Direct edits by orchestrator violating user rules → Mitigation: Provide clear instructions for the Xano Table Designer subagent to execute the file creation and push.
- [Risk] Missing foreign key resolution if table references are circular → Mitigation: `user` table already exists with ID 757777, so `subjects` can safely reference `table = "user"`.

