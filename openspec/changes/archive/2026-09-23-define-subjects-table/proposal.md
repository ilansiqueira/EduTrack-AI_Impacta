## Why

In order to persist academic subject data linked to authenticated students in EduTrack AI, a dedicated database table `subjects` must be defined in Xano. Per AGENTS.md guidelines, the schema structure, fields, and relationships must be formally planned and specified before handing off the XanoScript file generation to the specialized Xano Table Designer agent.

## What Changes

- Define the schema structure for the `subjects` table in Xano:
  - `id`: integer primary key (auto-incrementing)
  - `created_at`: timestamp (default `now`, private visibility)
  - `name`: text (required, trim filter)
  - `teacher`: text (optional, trim filter)
  - `hours`: integer (workload in hours)
  - `user_id`: integer foreign key referencing the `user` table
- Specify indexes for optimal query performance (primary on `id`, btree on `user_id`, btree on `created_at`).
- Outline the role delegation to the **Xano Table Designer** agent in accordance with AGENTS.md.

## Capabilities

### New Capabilities
- `subjects-schema`: Schema definition and relational integrity rules for the `subjects` table in Xano.

### Modified Capabilities

## Impact

- Database / Backend: New table `subjects` defined for Xano backend (`tables/`)
- Relational integrity: Foreign key link between `subjects.user_id` and `user.id`
- Workflow: Coordinated handoff to the Xano Table Designer agent

