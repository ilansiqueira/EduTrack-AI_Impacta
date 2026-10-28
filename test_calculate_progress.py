"""
Unit tests for calculate_progress.py
"""

import json
import unittest
from scripts.calculate_progress import compute_progress, calculate_subject_progress, calculate_progress_json

class TestCalculateProgress(unittest.TestCase):
    def test_zero_tasks(self):
        """Zero tasks should return 0.0% progress without division by zero."""
        result = compute_progress([])
        self.assertEqual(result["total_tasks"], 0)
        self.assertEqual(result["completed_tasks"], 0)
        self.assertEqual(result["progress_percentage"], 0.0)

    def test_all_tasks_completed(self):
        """All completed tasks should return 100.0% progress."""
        tasks = [
            {"id": 1, "title": "Task 1", "status": "completed"},
            {"id": 2, "title": "Task 2", "status": "Concluída"},
            {"id": 3, "title": "Task 3", "status": "COMPLETED"}
        ]
        result = compute_progress(tasks)
        self.assertEqual(result["total_tasks"], 3)
        self.assertEqual(result["completed_tasks"], 3)
        self.assertEqual(result["progress_percentage"], 100.0)

    def test_partial_progress(self):
        """Partial completion percentage calculation."""
        tasks = [
            {"id": 1, "title": "Task 1", "status": "completed"},
            {"id": 2, "title": "Task 2", "status": "pending"},
            {"id": 3, "title": "Task 3", "status": "in_progress"},
            {"id": 4, "title": "Task 4", "status": "completed"}
        ]
        result = compute_progress(tasks)
        self.assertEqual(result["total_tasks"], 4)
        self.assertEqual(result["completed_tasks"], 2)
        self.assertEqual(result["progress_percentage"], 50.0)

    def test_calculate_subject_progress_with_provided_tasks(self):
        """calculate_subject_progress returns expected dictionary structure."""
        tasks = [
            {"id": 10, "status": "completed"},
            {"id": 11, "status": "pending"}
        ]
        data = calculate_subject_progress(subject_id=42, tasks=tasks)
        self.assertEqual(data["subject_id"], 42)
        self.assertEqual(data["total_tasks"], 2)
        self.assertEqual(data["completed_tasks"], 1)
        self.assertEqual(data["progress_percentage"], 50.0)

    def test_calculate_progress_json(self):
        """calculate_progress_json produces valid JSON string."""
        tasks = [
            {"id": 1, "status": "completed"}
        ]
        json_str = calculate_progress_json(subject_id=1, tasks=tasks)
        parsed = json.loads(json_str)
        self.assertEqual(parsed["subject_id"], 1)
        self.assertEqual(parsed["progress_percentage"], 100.0)

    def test_invalid_subject_id(self):
        """Invalid subject ID returns 400 error in dict."""
        data = calculate_subject_progress("invalid_id", tasks=[])
        self.assertIn("error", data)
        self.assertEqual(data["status_code"], 400)


if __name__ == "__main__":
    unittest.main()

