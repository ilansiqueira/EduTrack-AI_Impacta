# web-auth-session Specification

## Purpose

Manages user authentication, account registration, profile inspection, persistent browser sessions, and route protection in the EduTrack AI web frontend.

## Requirements

### Requirement: Dedicated Authentication Experience
The web application SHALL present unauthenticated users with a dedicated login and account registration interface isolated from restricted workspace navigation.

#### Scenario: Unauthenticated user visits protected workspace
- **WHEN** a user without an active session navigates to a protected route
- **THEN** the system SHALL redirect the user to the authentication screen without exposing restricted academic views

### Requirement: Web Account Login
The web application SHALL authenticate existing users against the `POST auth/login` endpoint and hydrate their user profile via `GET auth/me`.

#### Scenario: Successful login with valid credentials
- **WHEN** a user submits valid email and password credentials on the login form
- **THEN** the system SHALL store the returned bearer token, load the user's profile, and navigate to the main Dashboard

#### Scenario: Login attempt with invalid credentials
- **WHEN** a user submits invalid email or password credentials
- **THEN** the system SHALL remain on the login view and display a clear authentication error message

### Requirement: Web Account Registration
The web application SHALL register new student accounts via `POST auth/signup` with client-side validation for required fields, minimum password length, and password confirmation match.

#### Scenario: Successful new account registration
- **WHEN** a user submits a valid name, email, and matching password of at least 6 characters
- **THEN** the system SHALL create the account via `auth/signup`, establish an authenticated session, and redirect to the Dashboard

#### Scenario: Mismatched password confirmation
- **WHEN** a user submits a registration form where password and confirmation do not match
- **THEN** the system SHALL block form submission and display a validation message before making a network request

### Requirement: Persistent Session Hydration and Expiration Handling
The web application SHALL persist the authentication token across browser refreshes and automatically clear the session if the backend rejects the token as expired or unauthorized.

#### Scenario: Browser page reload while authenticated
- **WHEN** an authenticated user reloads the browser tab
- **THEN** the system SHALL restore the saved token, verify the session via `auth/me`, and keep the user signed in

#### Scenario: Expired or revoked bearer token
- **WHEN** an authenticated API call returns an HTTP 401 Unauthorized response
- **THEN** the system SHALL clear stored session credentials and redirect the user to the login screen with a session-expired notice
