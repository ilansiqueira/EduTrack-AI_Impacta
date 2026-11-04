# Design: Migração de .env para Secrets do Streamlit

## Context

EduTrack AI was initially relying on custom file parsing of `.env` across different Python modules (`services/auth_service.py`, `services/xano_adapter.py`, `scripts/calculate_progress.py`, `scripts/generate_student_report.py`).
Streamlit has built-in secrets management through `st.secrets`, which loads configuration from `.streamlit/secrets.toml` locally and through the cloud dashboard in deployed environments.

## Architecture Decisions

### 1. Unified Configuration Helper or Safe Resolution
Streamlit secrets can be read via `st.secrets.get(key)` or `st.secrets[key]`.
To ensure compatibility both when running inside the Streamlit runtime and when running standalone scripts or automated unit tests, configuration access will implement a safe lookup:
1. Attempt to access `st.secrets[key]`.
2. Catch any `Exception` (e.g. `FileNotFoundError`, `StreamlitAPIException`, or `KeyError` if running outside Streamlit context or key not present).
3. Fall back to `os.getenv(key, default)`.

### 2. Backward Compatibility
The legacy `load_env()` and `_load_env()` functions will be retained to maintain backward compatibility with external test runners (such as `test_auth.py`), but their execution will only complement configuration if not already resolved.

### 3. File Organization
- Active local configuration: `.streamlit/secrets.toml`
- Excluded from git: `.gitignore` contains `.streamlit/`

