## Why

Students need visibility into their academic progress for each subject. Calculating the completion rate of academic obligations (tasks, exams, assignments) enables students to track their performance and remaining workload for a specific subject in EduTrack AI.

## What Changes

- Create a Python script `scripts/calculate_progress.py` that interfaces with the academic tasks CRUD endpoint.
- Implement a progress calculation function that fetches tasks for a given subject and calculates the completion percentage (`completed_tasks / total_tasks * 100`).
- Handle edge cases gracefully (e.g., subjects with zero tasks return 0.0% progress without division-by-zero errors).
- Output the calculation result as a structured JSON object containing subject ID, task counts, and the calculated percentage.

## Capabilities

### New Capabilities
- `progress-calculation`: Calculation of subject progress based on task completion status fetched via CRUD endpoints.

### Modified Capabilities

## Impact

- New file `scripts/calculate_progress.py`.
- Integrates with the existing `GET /academic_tasks` CRUD endpoint (with `subject_id` filter and user authentication token).
- Standard library dependencies (`json`, `urllib.request`, `os`).

