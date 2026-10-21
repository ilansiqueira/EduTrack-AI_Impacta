## Context

See proposal.md - Why.
EduTrack AI has a multi-page Streamlit application where `pages/3_👤_Perfil.py` is reserved for user account profile management. The authentication backend uses standard Xano auth endpoints (`auth/signup`, `auth/login`, and `auth/me`) operating on the `user` table.

## Goals / Non-Goals

**Goals:**
- Store the authentication base endpoint URL in the `.env` file at the root of the project (`XANO_AUTH_BASE_URL`).
- Implement Python helper functions to perform REST calls (`POST auth/signup`, `POST auth/login`, `GET auth/me`).
- Create an intuitive Streamlit interface in `pages/3_👤_Perfil.py`:
  - When unauthenticated: Provide "Entrar" (Login) and "Cadastrar" (Signup) tabs with input validation.
  - When authenticated: Display user profile information (Name, Email, ID, Role) fetched from `auth/me` with a "Sair" (Logout) button.
- Manage tokens securely using `st.session_state`.
- Include graceful error handling for invalid credentials or network connection failures.

**Non-Goals:**
- Social logins (Google, GitHub OAuth).
- Password reset and email verification workflows.
- Altering the backend `user` table structure.

## Decisions

- **Decision 1: Environment File Configuration (`.env`)**
  - *Rationale*: Storing `XANO_AUTH_BASE_URL` in `.env` allows developers to set their specific Xano instance URL without hardcoding secrets in source code.
  - *Alternative considered*: Hardcoding the URL in Python; rejected for security and portability.

- **Decision 2: Token and Session Management**
  - *Rationale*: Store `auth_token` and `user_data` in Streamlit's `st.session_state`. This preserves login status across pages during the active browser session.
  - *Alternative considered*: Storing tokens in local cookies; rejected to keep implementation simple and framework-native.

- **Decision 3: Fallback and Error Handling**
  - *Rationale*: When the base URL is not yet configured in `.env`, the UI displays a clear guidance box explaining how to add the URL in `.env`.
  - *Alternative considered*: Crashing on startup if `.env` is empty; rejected to allow seamless developer onboarding.

## Risks / Trade-offs

- [Risk] Network timeouts or unavailable backend → Mitigation: Wrap all requests with try/except and display informative `st.error` alerts.
- [Risk] Session reset on page refresh → Mitigation: Standard Streamlit behavior; user can easily re-authenticate.

