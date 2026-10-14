## Why

Students using EduTrack AI need to record and manage their academic obligations (homework, exams, projects) linked to their registered subjects. Currently, no database structure exists in Xano to persist academic task records. Creating the `academic_tasks` table provides structured relational storage linked to subjects and authenticated students.

## What Changes

- Define the schema for the `academic_tasks` table in Xano:
  - `id`: integer primary key
  - `created_at`: timestamp (default `now`, private visibility)
  - `title`: text (required, trimmed)
  - `description`: text (optional, trimmed)
  - `due_date`: date (deadline for the task)
  - `status`: text (e.g., "pending", "in_progress", "completed")
  - `subject_id`: integer foreign key referencing the `subjects` table
  - `user_id`: integer foreign key referencing the `user` table (per AGENTS.md requirements)
- Define indexes for primary lookup (`id`), student filtering (`user_id`), subject grouping (`subject_id`), and deadline sorting (`due_date`).
- Establish the implementation tasks strictly scoped to creating the table schema per AGENTS.md Rule 1.

## Capabilities

### New Capabilities
- `academic-tasks-schema`: Database table schema and relationship definitions for academic tasks in Xano.

### Modified Capabilities

## Impact

- Database: New table `academic_tasks` defined in Xano (`tables/`)
- Relational integrity: Foreign key link to `subjects` (`subject_id`) and to `user` (`user_id`)

