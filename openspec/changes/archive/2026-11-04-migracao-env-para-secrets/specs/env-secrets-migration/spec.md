# env-secrets-migration Specification

## Purpose

Define the configuration retrieval mechanism migrating from `.env` file reading to native Streamlit secrets (`st.secrets` and `.streamlit/secrets.toml`) with fallback support.

## ADDED Requirements

### Requirement: Read Configuration from Streamlit Secrets
The system SHALL retrieve backend URLs and service configuration from Streamlit secrets (`st.secrets`) when running the application.

#### Scenario: Secrets defined in Streamlit secrets
- **WHEN** the application queries service base URLs (`XANO_AUTH_BASE_URL`, `XANO_SUBJECTS_BASE_URL`, `XANO_TASKS_BASE_URL`)
- **THEN** the system SHALL resolve the values from `st.secrets`

#### Scenario: Fallback to environment variables
- **WHEN** a configuration key is not found in `st.secrets` or Streamlit secrets are not accessible
- **THEN** the system SHALL fall back to reading from environment variables via `os.getenv` without failing

### Requirement: Exclude Secrets from Version Control
The system SHALL maintain secret parameters in `.streamlit/secrets.toml` and keep the file ignored by version control.

#### Scenario: Check git ignore rules
- **WHEN** checking git status for tracked files
- **THEN** the system SHALL ensure `.streamlit/` or `.streamlit/secrets.toml` is excluded by `.gitignore`

