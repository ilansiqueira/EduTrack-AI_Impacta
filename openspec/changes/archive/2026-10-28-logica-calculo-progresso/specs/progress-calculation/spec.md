# progress-calculation Specification

## Purpose

Provides business logic to calculate academic progress for a subject based on its associated tasks fetched from CRUD endpoints, returning structured JSON metrics.

## ADDED Requirements

### Requirement: Calculate Subject Progress
The system SHALL calculate the percentage of completed tasks relative to total tasks for a specified subject.

#### Scenario: Subject has both completed and pending tasks
- **WHEN** progress calculation is requested for a subject with 2 completed tasks out of 4 total tasks
- **THEN** the system SHALL compute the progress percentage as 50.0%

#### Scenario: All tasks in subject are completed
- **WHEN** progress calculation is requested for a subject where all tasks have status "completed"
- **THEN** the system SHALL compute the progress percentage as 100.0%

#### Scenario: Subject has zero tasks
- **WHEN** progress calculation is requested for a subject with no registered tasks
- **THEN** the system SHALL return 0 total tasks, 0 completed tasks, and 0.0% progress without error

### Requirement: Format Progress Result as JSON
The system SHALL serialize and return the calculation results as a valid JSON object.

#### Scenario: Valid calculation output
- **WHEN** progress calculation completes successfully
- **THEN** the system SHALL output a JSON object containing `subject_id`, `total_tasks`, `completed_tasks`, and `progress_percentage`

#### Scenario: Missing or invalid subject ID
- **WHEN** progress calculation is invoked with an invalid or missing subject ID
- **THEN** the system SHALL return a JSON object with an error message and status code

