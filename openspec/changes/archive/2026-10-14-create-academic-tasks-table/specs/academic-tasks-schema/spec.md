# academic-tasks-schema Specification

## Purpose

Defines the database schema, field constraints, relationships, and indexing for the academic_tasks table in Xano.

## ADDED Requirements

### Requirement: Academic Tasks Table Structure
The system SHALL define the `academic_tasks` database table with an auto-incrementing integer `id` as primary key, `created_at` timestamp with private visibility, `title` text field, `description` text field, `due_date` date field, `status` text field, `subject_id` integer referencing table `subjects`, and `user_id` integer referencing table `user`.

#### Scenario: Valid table schema definition
- **WHEN** the `academic_tasks` table is inspected in the backend database
- **THEN** the schema contains `id` as primary key, `title` as text, `description` as optional text, `due_date` as date, `status` as text, `subject_id` referencing table `subjects`, and `user_id` referencing table `user`

### Requirement: Relational Integrity with Subjects and Users
The `academic_tasks` table SHALL enforce foreign key references from `subject_id` to the `subjects` table, and from `user_id` to the authentication `user` table.

#### Scenario: Associate task with a subject and student
- **WHEN** a record is created in `academic_tasks` with valid `subject_id` and `user_id`
- **THEN** the record establishes foreign key relationships linking the task to the respective subject and student

#### Scenario: Query filtering by subject and student
- **WHEN** tasks are queried by student ID or subject ID
- **THEN** the system isolates and filters tasks strictly matching those relational keys

### Requirement: Table Indexing
The system SHALL define a primary index on `id` and secondary btree indexes on `user_id`, `subject_id`, and `due_date` for efficient lookups and deadline sorting.

#### Scenario: Task indexing
- **WHEN** database queries filter by student or subject, or sort by due date
- **THEN** the execution utilizes the defined btree indexes

