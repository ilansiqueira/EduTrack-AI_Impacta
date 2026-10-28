# subjects-api Specification

## Purpose
Provides secure RESTful CRUD API endpoints for managing academic subjects in EduTrack AI, ensuring strict user isolation so that users only access and modify their own records.

## Requirements

### Requirement: List Subjects
The API SHALL provide a `GET /subjects` endpoint that returns all subjects belonging to the authenticated user.

#### Scenario: Authenticated user requests subjects list
- **WHEN** an authenticated user calls `GET /subjects`
- **THEN** the system SHALL return only subjects where `user_id` matches the authenticated user ID

#### Scenario: Unauthenticated request to list subjects
- **WHEN** a request without a valid auth token is made to `GET /subjects`
- **THEN** the system SHALL reject the request with a 401 Unauthorized error

### Requirement: Create Subject
The API SHALL provide a `POST /subjects` endpoint that validates inputs and creates a new subject automatically associating it with the authenticated user.

#### Scenario: Successful subject creation
- **WHEN** an authenticated user calls `POST /subjects` with valid subject data
- **THEN** the system SHALL create the subject with `user_id` set to the authenticated user ID and return the created record

#### Scenario: Missing required subject name
- **WHEN** an authenticated user calls `POST /subjects` without providing a subject name
- **THEN** the system SHALL reject the request with a 400 Bad Request error

### Requirement: Update Subject
The API SHALL provide a `PATCH /subjects/{id}` endpoint that updates fields of a specific subject owned by the authenticated user.

#### Scenario: Owner updates subject
- **WHEN** an authenticated user calls `PATCH /subjects/{id}` for a subject they own
- **THEN** the system SHALL update the subject fields and return the updated record

#### Scenario: User attempts to update another user's subject
- **WHEN** an authenticated user calls `PATCH /subjects/{id}` for a subject owned by another user
- **THEN** the system SHALL return a 403 Forbidden or 404 Not Found error

### Requirement: Delete Subject
The API SHALL provide a `DELETE /subjects/{id}` endpoint that deletes a specific subject owned by the authenticated user.

#### Scenario: Owner deletes subject
- **WHEN** an authenticated user calls `DELETE /subjects/{id}` for a subject they own
- **THEN** the system SHALL remove the subject and return success

#### Scenario: User attempts to delete another user's subject
- **WHEN** an authenticated user calls `DELETE /subjects/{id}` for a subject owned by another user
- **THEN** the system SHALL reject the deletion with a 403 Forbidden or 404 Not Found error
