# web-design-system Specification

## Purpose

Defines the visual foundation, typography, responsive layout shell, theme behavior, and Single-Page Application hosting configuration for the EduTrack AI web frontend.

## Requirements

### Requirement: Google Sans Primary Typography
The web application SHALL apply Google Sans as the primary typeface across headings, body text, form controls, and interactive elements, with clean geometric sans-serif fallbacks when Google Sans is unavailable on the device.

#### Scenario: Application renders typography
- **WHEN** a user loads any public or authenticated screen of the web application
- **THEN** the interface SHALL render text using the Google Sans font family stack with consistent hierarchy and legibility

### Requirement: Responsive Application Shell
The web application SHALL provide a responsive navigation shell for authenticated screens with a persistent sidebar on desktop viewports and a collapsible drawer or bottom navigation bar on mobile viewports.

#### Scenario: Desktop viewport navigation
- **WHEN** an authenticated user accesses the application on a desktop viewport
- **THEN** the system SHALL display a fixed navigation sidebar showing active route highlights, user profile summary, and theme controls

#### Scenario: Mobile viewport navigation
- **WHEN** an authenticated user accesses the application on a narrow mobile viewport
- **THEN** the system SHALL adapt navigation into a compact mobile header and accessible menu without horizontal overflow

### Requirement: Light and Dark Theme Switching
The web application SHALL support switching between light and dark color themes and persist the user's selected theme across browser reloads.

#### Scenario: User toggles color theme
- **WHEN** a user switches between light mode and dark mode
- **THEN** the interface SHALL immediately update surface, text, and accent tokens and retain that preference on subsequent visits

### Requirement: SPA Deep-Link Routing and Environment Configuration
The web deployment configuration SHALL rewrite client-side routes to the application entrypoint and resolve dedicated Xano service base URLs from build-time environment variables with fallback to a generic API base URL.

#### Scenario: Direct navigation to a client route in production
- **WHEN** a user refreshes or directly opens a nested route such as `/disciplinas` or `/tarefas` on the hosted deployment
- **THEN** the hosting configuration SHALL serve the Single-Page Application entrypoint without returning a 404 HTTP error

#### Scenario: Missing API environment configuration
- **WHEN** the web application runs without valid Xano API base URLs configured
- **THEN** the interface SHALL display a clear configuration notice instead of crashing with an unhandled exception
