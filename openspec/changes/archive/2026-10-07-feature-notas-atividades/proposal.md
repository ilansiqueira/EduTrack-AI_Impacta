## Why

Professors need the ability to submit and record grades for students on specific academic activities within EduTrack AI. Currently, there is no backend structure or API endpoint to persist student grades for evaluated coursework.

## What Changes

- Create the `activity_grades` database table schema to store student grades associated with specific activities.
- Create the API endpoint `POST /activity_grades` allowing professors to submit grades for students on specific activities.

## Capabilities

### New Capabilities
- `activity-grades`: Capability allowing professors to submit activity grades for students on specific assignments.

### Modified Capabilities

## Impact

- Database: New table `activity_grades`
- Backend API: New endpoint `POST /activity_grades`

