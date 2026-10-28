# subjects-tasks-ui Specification

## ADDED Requirements

### Requirement: Dedicated CRUD Endpoint Configuration
The system SHALL support configuring dedicated base URLs for subjects (`XANO_SUBJECTS_BASE_URL`) and academic tasks (`XANO_TASKS_BASE_URL`) via the `.env` configuration file.

#### Scenario: Dedicated endpoints configured in environment
- **WHEN** the application loads `XANO_SUBJECTS_BASE_URL` and `XANO_TASKS_BASE_URL` from `.env`
- **THEN** the system SHALL dispatch subject queries to `XANO_SUBJECTS_BASE_URL` and task queries to `XANO_TASKS_BASE_URL` using Bearer authentication

#### Scenario: Fallback endpoint handling
- **WHEN** a dedicated endpoint is not set in `.env` but a generic `XANO_API_BASE_URL` is available
- **THEN** the system SHALL fallback to the generic API base URL

