## Why

To allow authenticated students to manage their academic data remotely, EduTrack AI requires complete RESTful CRUD endpoints for both the `subjects` and `academic_tasks` tables. Strict data isolation is mandatory so that each user can only query, create, update, and delete their own records.

## What Changes

- Implement RESTful CRUD API endpoints for the `subjects` table:
  - `POST /subjects`: Create a new subject associated with the authenticated user.
  - `GET /subjects`: Retrieve all subjects belonging to the authenticated user.
  - `PATCH /subjects/{id}`: Update an existing subject owned by the authenticated user.
  - `DELETE /subjects/{id}`: Delete a subject owned by the authenticated user.
- Implement RESTful CRUD API endpoints for the `academic_tasks` table:
  - `POST /academic_tasks`: Create a new academic task associated with the authenticated user and subject.
  - `GET /academic_tasks`: Retrieve all academic tasks belonging to the authenticated user.
  - `PATCH /academic_tasks/{id}`: Update an existing academic task owned by the authenticated user.
  - `DELETE /academic_tasks/{id}`: Delete an academic task owned by the authenticated user.
- Enforce mandatory tenant isolation on all queries and mutations using the authenticated `user_id`.

## Capabilities

### New Capabilities
- `subjects-api`: RESTful CRUD API endpoints for managing academic subjects with user isolation.
- `academic-tasks-api`: RESTful CRUD API endpoints for managing academic tasks with user isolation.

### Modified Capabilities

## Impact

- Backend APIs: New endpoint definitions in `apis/subjects/` and `apis/academic_tasks/`
- Database access: Queries enforce `user_id` filtering from the auth token
- Security: Unauthorized access to records owned by other users is strictly rejected

