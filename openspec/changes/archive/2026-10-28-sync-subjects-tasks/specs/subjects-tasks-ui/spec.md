# subjects-tasks-ui Specification

## Purpose

Enables students to manage their subjects and academic obligations by connecting the Streamlit user interface to authenticated Xano CRUD endpoints.

## ADDED Requirements

### Requirement: Disciplinas Screen Synchronization
The Disciplinas screen SHALL query live subject records from the `GET /subjects` endpoint for the authenticated user and support creating new subjects via `POST /subjects`.

#### Scenario: Authenticated user views subjects
- **WHEN** an authenticated user opens the Disciplinas page
- **THEN** the system SHALL fetch and display the user's subjects from Xano in the list view

#### Scenario: Authenticated user creates a subject
- **WHEN** an authenticated user fills the creation form and submits a new subject
- **THEN** the system SHALL send a POST request with the session token to create the subject and update the view

#### Scenario: Unauthenticated user visits Disciplinas
- **WHEN** a user visits Disciplinas without an active session token
- **THEN** the system SHALL present an authentication required warning prompting the user to login

### Requirement: Tarefas Screen Synchronization
The Tarefas screen SHALL query live academic tasks from `GET /academic_tasks` for the authenticated user, allow creating new tasks associated with user subjects, and allow updating task status.

#### Scenario: Authenticated user views tasks
- **WHEN** an authenticated user opens the Tarefas page
- **THEN** the system SHALL fetch and display all academic tasks owned by the user

#### Scenario: User filters tasks by status or subject
- **WHEN** an authenticated user selects a status or subject filter
- **THEN** the system SHALL filter the presented tasks according to the selection

#### Scenario: Authenticated user creates a task
- **WHEN** an authenticated user fills the task form with title and selected subject and submits
- **THEN** the system SHALL send a POST request to `/academic_tasks` with the auth token and display the new task

#### Scenario: Authenticated user toggles task completion
- **WHEN** an authenticated user marks a task as completed or pending
- **THEN** the system SHALL send a PATCH request to update the task status in Xano

#### Scenario: Unauthenticated user visits Tarefas
- **WHEN** a user visits Tarefas without an active session token
- **THEN** the system SHALL display an authentication warning directing the user to login

