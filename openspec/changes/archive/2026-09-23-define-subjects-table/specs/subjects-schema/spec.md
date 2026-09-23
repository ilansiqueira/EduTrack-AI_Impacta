## Purpose

Defines the schema structure, data types, constraints, and relationships for the subjects table in the Xano backend database.

## ADDED Requirements

### Requirement: Subjects Table Schema
The Xano database schema for the `subjects` table SHALL include the primary key `id` (int), `created_at` (timestamp, private), `name` (text, non-empty), `teacher` (text, optional), `hours` (integer, workload), and `user_id` (integer foreign key).

#### Scenario: Valid table schema definition
- **WHEN** the `subjects` table is inspected in Xano
- **THEN** the schema contains `id` as primary key, `name` as text with trim filter, `teacher` as optional text, `hours` as integer, and `user_id` referencing table `user`

### Requirement: Relational Integrity with User Table
The `user_id` field in the `subjects` table SHALL maintain a foreign key reference to the `id` field of the `user` authentication table.

#### Scenario: Associate subject with authenticated user
- **WHEN** a record is created in the `subjects` table with a valid `user_id`
- **THEN** the record establishes a relationship to the corresponding record in table `user`

#### Scenario: Query filtering by user
- **WHEN** querying subjects for an authenticated user
- **THEN** the database allows filtering subjects matching the user's `id`

### Requirement: Database Indexing
The `subjects` table SHALL define a primary index on `id` and secondary btree indexes on `user_id` and `created_at` for optimal query performance.

#### Scenario: Index existence
- **WHEN** query execution plans filter by `user_id` or sort by `created_at`
- **THEN** the queries utilize the defined btree indexes

