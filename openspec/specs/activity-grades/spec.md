# activity-grades Specification

## Purpose
Enables professors to submit and register grades for students on specific academic activities in EduTrack AI.

## Requirements

### Requirement: Record Student Activity Grade
The system SHALL allow professors to submit and store a grade for a student on a specific activity.

#### Scenario: Successful grade submission
- **WHEN** a professor submits a valid grade with associated student ID and activity ID
- **THEN** the system SHALL record the grade in the database and return confirmation

#### Scenario: Grade submission with missing required fields
- **WHEN** a professor attempts to submit a grade missing either student ID, activity ID, or grade value
- **THEN** the system SHALL reject the submission and return a validation error
