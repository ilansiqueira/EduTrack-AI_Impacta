# user-auth Specification

## Purpose
Enables students and educators to register an account, log in securely, and inspect their profile in EduTrack AI using backend authentication endpoints.

## Requirements

### Requirement: User Registration
The system SHALL provide a user registration form in `pages/3_👤_Perfil.py` that submits user data (name, email, password) to the `auth/signup` endpoint and saves the user record in the `user` table.

#### Scenario: Successful user registration
- **WHEN** a user fills out the registration form with a valid name, email, and password and submits
- **THEN** the system SHALL call `auth/signup`, store the user in the `user` table, store the authentication token in session state, and display a success message

#### Scenario: Registration failure with duplicate email or invalid input
- **WHEN** a user submits registration details with an existing email or invalid fields
- **THEN** the system SHALL display an error message explaining why registration failed

### Requirement: User Login
The system SHALL provide a login form in `pages/3_👤_Perfil.py` that authenticates credentials (email, password) via the `auth/login` endpoint.

#### Scenario: Successful login
- **WHEN** a user provides valid email and password credentials and clicks login
- **THEN** the system SHALL authenticate with `auth/login`, store the auth token in session state, and update the view to show the authenticated profile

#### Scenario: Invalid login credentials
- **WHEN** a user provides invalid email or password credentials
- **THEN** the system SHALL display an authentication error message and remain unauthenticated

### Requirement: User Profile Inspection
The system SHALL allow an authenticated user to view their current profile data retrieved from the `auth/me` endpoint.

#### Scenario: View authenticated profile
- **WHEN** an authenticated user accesses `pages/3_👤_Perfil.py`
- **THEN** the system SHALL query `auth/me` using the auth token and display the user's name, email, and role

### Requirement: Environment Configuration for Auth Base URL
The system SHALL load the base URL for authentication endpoints from the `.env` file at the root of the project.

#### Scenario: Base URL loaded from environment
- **WHEN** the application initializes authentication requests
- **THEN** the system SHALL read the base URL configuration from the `.env` file
