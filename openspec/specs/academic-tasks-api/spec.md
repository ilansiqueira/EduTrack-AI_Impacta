# academic-tasks-api Specification

## Purpose
Provides secure RESTful CRUD API endpoints for managing academic tasks in EduTrack AI, ensuring strict user isolation so that users only access and modify their own records.

## Requirements

### Requirement: List Academic Tasks
The API SHALL provide a `GET /academic_tasks` endpoint that returns all academic tasks belonging to the authenticated user, supporting optional filtering by `subject_id`.

#### Scenario: Authenticated user requests tasks list
- **WHEN** an authenticated user calls `GET /academic_tasks`
- **THEN** the system SHALL return only tasks where `user_id` matches the authenticated user ID

#### Scenario: Unauthenticated request to list tasks
- **WHEN** a request without a valid auth token is made to `GET /academic_tasks`
- **THEN** the system SHALL reject the request with a 401 Unauthorized error

### Requirement: Create Academic Task
The API SHALL provide a `POST /academic_tasks` endpoint that validates inputs and creates a new academic task associated with the authenticated user and a valid subject.

#### Scenario: Successful task creation
- **WHEN** an authenticated user calls `POST /academic_tasks` with valid task data and a subject owned by the user
- **THEN** the system SHALL create the task with `user_id` set to the authenticated user ID and return the created record

#### Scenario: Missing required task title
- **WHEN** an authenticated user calls `POST /academic_tasks` without a task title
- **THEN** the system SHALL reject the request with a 400 Bad Request error

### Requirement: Update Academic Task
The API SHALL provide a `PATCH /academic_tasks/{id}` endpoint that updates fields (status, due date, description, title) of a task owned by the authenticated user.

#### Scenario: Owner updates task
- **WHEN** an authenticated user calls `PATCH /academic_tasks/{id}` for a task they own
- **THEN** the system SHALL update the task fields and return the updated record

#### Scenario: User attempts to update another user's task
- **WHEN** an authenticated user calls `PATCH /academic_tasks/{id}` for a task owned by another user
- **THEN** the system SHALL return a 403 Forbidden or 404 Not Found error

### Requirement: Delete Academic Task
The API SHALL provide a `DELETE /academic_tasks/{id}` endpoint that deletes an academic task owned by the authenticated user.

#### Scenario: Owner deletes task
- **WHEN** an authenticated user calls `DELETE /academic_tasks/{id}` for a task they own
- **THEN** the system SHALL remove the task and return success

#### Scenario: User attempts to delete another user's task
- **WHEN** an authenticated user calls `DELETE /academic_tasks/{id}` for a task owned by another user
- **THEN** the system SHALL reject the deletion with a 403 Forbidden or 404 Not Found error
