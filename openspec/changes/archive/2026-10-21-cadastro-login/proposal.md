## Why

Users of EduTrack AI need a dedicated authentication interface to sign up and log in securely. Currently, `pages/3_👤_Perfil.py` is an empty placeholder, and the application lacks user registration, session management, and integration with the backend authentication endpoints.

## What Changes

- Configure the base API URL in a `.env` file at the root of the project.
- Implement authentication helper functions connecting to `auth/signup`, `auth/login`, and `auth/me` to store and retrieve data from the `user` table.
- Build the user interface in `pages/3_👤_Perfil.py` with tabs or options for Login, Signup, and authenticated Profile display.
- Manage user authentication state and tokens across Streamlit's `st.session_state`.

## Capabilities

### New Capabilities
- `user-auth`: User signup, login, session state, and profile inspection using Xano authentication endpoints.

### Modified Capabilities

## Impact

- Environment: `.env` file at the workspace root
- Frontend: `pages/3_👤_Perfil.py` (Streamlit signup/login/profile views)
- Authentication: Storage and handling of auth tokens linked to table `user`

