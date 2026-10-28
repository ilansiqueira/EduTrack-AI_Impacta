"""
Progress Calculation Script for EduTrack AI.
Calculates task completion progress (completed / total) for a subject and returns JSON.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

# Load .env variables if .env exists
def _load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))
        except Exception:
            pass

_load_env()

XANO_API_BASE_URL = os.getenv("XANO_API_BASE_URL", "")


def get_auth_headers(token=None):
    """Generate request headers including Authorization if token is provided."""
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def fetch_academic_tasks(subject_id, auth_token=None):
    """
    Fetch academic tasks for a given subject_id using the CRUD endpoint.
    Returns a list of tasks, or raises an error / returns empty list.
    """
    if not XANO_API_BASE_URL:
        # If API URL is not set, raise ValueError with descriptive message
        raise ValueError("XANO_API_BASE_URL environment variable is not configured.")

    endpoint = f"{XANO_API_BASE_URL}/academic_tasks?subject_id={subject_id}"
    req = urllib.request.Request(endpoint, headers=get_auth_headers(auth_token), method="GET")

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                return data if isinstance(data, list) else []
            else:
                raise RuntimeError(f"HTTP request returned status {response.status}")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        raise RuntimeError(f"Failed to fetch tasks from API: {e}")


def compute_progress(tasks):
    """
    Calculate progress metrics from a list of task records.
    Returns a dictionary with total_tasks, completed_tasks, and progress_percentage.
    Handles zero tasks gracefully by returning 0.0% without division-by-zero error.
    """
    if not isinstance(tasks, list):
        tasks = []

    total_tasks = len(tasks)
    
    # Check status against both English and Portuguese completion labels
    completed_tasks = sum(
        1 for task in tasks
        if str(task.get("status", "")).strip().lower() in ("completed", "concluida", "concluída")
    )

    if total_tasks == 0:
        progress_percentage = 0.0
    else:
        progress_percentage = round((completed_tasks / total_tasks) * 100.0, 2)

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "progress_percentage": progress_percentage
    }


def calculate_subject_progress(subject_id, auth_token=None, tasks=None):
    """
    Calculate progress for a specific subject.
    If 'tasks' list is provided directly, it bypasses the network fetch (useful for offline/tests).
    Otherwise, it queries the CRUD endpoint.
    Returns a dictionary representing the progress or error state.
    """
    try:
        subject_id_int = int(subject_id)
    except (ValueError, TypeError):
        return {
            "error": "Invalid subject_id. Must be a valid integer.",
            "status_code": 400
        }

    if tasks is None:
        try:
            tasks = fetch_academic_tasks(subject_id_int, auth_token)
        except Exception as err:
            return {
                "subject_id": subject_id_int,
                "error": str(err),
                "status_code": 500
            }

    metrics = compute_progress(tasks)

    return {
        "subject_id": subject_id_int,
        "total_tasks": metrics["total_tasks"],
        "completed_tasks": metrics["completed_tasks"],
        "progress_percentage": metrics["progress_percentage"]
    }


def calculate_progress_json(subject_id, auth_token=None, tasks=None, indent=2):
    """
    Calculate progress for a subject and format the result as a valid JSON string.
    """
    result = calculate_subject_progress(subject_id, auth_token=auth_token, tasks=tasks)
    return json.dumps(result, indent=indent, ensure_ascii=False)


def main():
    """CLI entrypoint."""
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python calculate_progress.py <subject_id> [auth_token]"
        }, indent=2))
        sys.exit(1)

    subject_id = sys.argv[1]
    auth_token = sys.argv[2] if len(sys.argv) > 2 else os.getenv("AUTH_TOKEN")

    json_output = calculate_progress_json(subject_id, auth_token=auth_token)
    print(json_output)


if __name__ == "__main__":
    main()

