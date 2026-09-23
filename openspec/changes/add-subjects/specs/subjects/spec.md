## Purpose

Enables students to manage academic subjects, track active coursework, and organize academic information within EduTrack AI.

## ADDED Requirements

### Requirement: List Academic Subjects
The system SHALL display all registered academic subjects to the user, showing their title, professor name, and status.

#### Scenario: Subjects exist
- **WHEN** the user navigates to the "Disciplinas" section and subjects are registered
- **THEN** the system displays the list of registered subjects with their details

#### Scenario: No subjects registered
- **WHEN** the user navigates to the "Disciplinas" section and no subjects have been created yet
- **THEN** the system displays an empty-state message indicating no subjects have been added

### Requirement: Create New Subject
The system SHALL allow users to create a new subject by providing the subject name, optional professor name, and workload or semester.

#### Scenario: Successful creation with valid details
- **WHEN** the user submits the subject creation form with a valid subject name
- **THEN** the system stores the new subject and immediately updates the subject list and active subjects metric

#### Scenario: Creation attempt with empty name
- **WHEN** the user attempts to submit the subject creation form without providing a subject name
- **THEN** the system rejects the submission and displays a validation error message requiring a subject name

### Requirement: Active Subjects Metric on Dashboard
The system SHALL calculate and display the total number of active subjects on the Dashboard.

#### Scenario: Display active subject count
- **WHEN** the user views the Dashboard
- **THEN** the "Disciplinas Ativas" metric accurately displays the count of active subjects

