## Why

Currently, EduTrack AI reads backend API URLs and connection parameters from a local `.env` file via custom parser functions (`load_env()` and `_load_env()`). Streamlit provides native secrets management (`st.secrets` backed by `.streamlit/secrets.toml`), which aligns with standard Streamlit deployment workflows, enhances cloud security, and simplifies configuration management across environments.

## What Changes

- Migrate application configuration and environment variable loading from custom `.env` parsing to Streamlit secrets (`st.secrets`).
- Ensure `.streamlit/secrets.toml` defines the Xano service URLs (`XANO_AUTH_BASE_URL`, `XANO_SUBJECTS_BASE_URL`, `XANO_TASKS_BASE_URL`).
- Update services (`services/auth_service.py`, `services/xano_adapter.py`) to retrieve configuration values primarily from `st.secrets` with fallback to `os.getenv()` / environment variables for robustness and backwards compatibility.
- Update scripts (`scripts/calculate_progress.py`, `scripts/generate_student_report.py`) to prioritize `st.secrets` while maintaining standalone CLI execution support.
- Ensure `.gitignore` ignores `.streamlit/secrets.toml` to prevent sensitive credentials from being committed.

## Capabilities

### New Capabilities
- `env-secrets-migration`: Centralized and native retrieval of application secrets and service base URLs using Streamlit secrets (`st.secrets`) with environment fallback.

### Modified Capabilities

## Impact

- `services/auth_service.py`: URL retrieval functions now read from `st.secrets` first.
- `services/xano_adapter.py`: URL retrieval functions now read from `st.secrets` first.
- `scripts/calculate_progress.py`: Tasks endpoint resolver reads from `st.secrets` first.
- `scripts/generate_student_report.py`: Relies on updated configuration resolution.
- `.streamlit/secrets.toml`: Contains active API URLs for Xano services.
- `.gitignore`: Ensures secrets are excluded from version control.

