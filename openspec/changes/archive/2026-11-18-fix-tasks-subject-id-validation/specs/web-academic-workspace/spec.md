# web-academic-workspace Specification

## Purpose

Provides the interactive Dashboard, full Subjects CRUD, full Academic Tasks management across list and Kanban views, and downloadable PDF performance reports in the EduTrack AI web frontend.

## MODIFIED Requirements

### Requirement: Academic Tasks List and Kanban Management
The Tasks screen SHALL allow students to switch between a filtered Card List view and a three-column Kanban view (`Pendente`, `Em Andamento`, `Concluída`), supporting task creation, editing, deletion, instant search, status transitions that always include a valid positive `subject_id`, and optional post-completion grading.

#### Scenario: Student filters tasks by text, subject, or status
- **WHEN** an authenticated student enters a search query or selects a subject or status filter
- **THEN** the system SHALL immediately filter the visible tasks without reloading the browser page

#### Scenario: Student creates or edits an academic task
- **WHEN** an authenticated student submits the task form with a title, linked subject, optional description, due date, and status
- **THEN** the system SHALL persist the task via `POST` or `PATCH` `/academic_tasks` and update task progress metrics immediately

#### Scenario: Student transitions task status
- **WHEN** an authenticated student toggles or moves a task between `pending`, `in_progress`, and `completed`
- **THEN** the system SHALL send a `PATCH` request to `/academic_tasks/{id}` including the task's `subject_id >= 1` so Xano input validation succeeds, persist the new status without rolling back, and recalculate completion metrics

#### Scenario: Student completes a task and optionally records or skips grade
- **WHEN** an authenticated student transitions a task to `completed` and awaits confirmation from the status update
- **THEN** the system SHALL open the optional grade modal only after the status update succeeds, validate any submitted grade in the `0..10` range and weight `> 0`, persist grades reliably with hybrid local fallback, and close without sending a redundant `PATCH` request if the student skips grading

## ADDED Requirements

### Requirement: Subject-Scoped Academic Task Loading
The web application SHALL load academic tasks scoped by each enrolled subject's positive `subject_id` (`GET /academic_tasks?subject_id={id}`) instead of calling `GET /academic_tasks` without `subject_id`, preventing Xano `filters=min:1` validation errors whether the student has zero or multiple enrolled subjects.

#### Scenario: Student has one or more active subjects
- **WHEN** an authenticated student with one or more enrolled subjects opens the Dashboard or Tasks workspace
- **THEN** the system SHALL query `GET /academic_tasks?subject_id={id}` for each subject with `id >= 1`, merge and deduplicate the tasks without triggering `"Value is less than the minimum value of 1"`, and display all tasks ordered by due date

#### Scenario: Student has zero active subjects
- **WHEN** an authenticated student has zero enrolled subjects
- **THEN** the system SHALL avoid calling `GET /academic_tasks` without `subject_id`, resolve an empty task list with zero validation errors, and guide the student to create their first subject
