"""
Unit tests for services/xano_adapter.py
"""

import unittest
from unittest.mock import patch, MagicMock
from services.xano_adapter import (
    get_auth_headers,
    fetch_subjects,
    create_subject,
    fetch_academic_tasks,
    create_academic_task,
    update_academic_task,
    delete_academic_task
)

class TestXanoAdapter(unittest.TestCase):
    def test_get_auth_headers(self):
        """Header contains Authorization Bearer token when provided."""
        headers_no_token = get_auth_headers()
        self.assertNotIn("Authorization", headers_no_token)
        self.assertEqual(headers_no_token["Content-Type"], "application/json")

        headers_with_token = get_auth_headers("jwt_token_123")
        self.assertEqual(headers_with_token["Authorization"], "Bearer jwt_token_123")

    @patch("services.xano_adapter.get_api_base_url", return_value="https://api.example.com")
    @patch("services.xano_adapter.urllib.request.urlopen")
    def test_fetch_subjects_success(self, mock_urlopen, mock_base_url):
        """fetch_subjects returns data on successful HTTP 200 response."""
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = b'[{"id": 1, "name": "Calculo"}]'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        ok, data = fetch_subjects(auth_token="test_token")
        self.assertTrue(ok)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["name"], "Calculo")

    @patch("services.xano_adapter.get_api_base_url", return_value="https://api.example.com")
    @patch("services.xano_adapter.urllib.request.urlopen")
    def test_create_subject_success(self, mock_urlopen, mock_base_url):
        """create_subject serializes payload and returns created record."""
        mock_response = MagicMock()
        mock_response.status = 201
        mock_response.read.return_value = b'{"id": 2, "name": "Fisica", "hours": 60}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        ok, data = create_subject(name="Fisica", hours=60, auth_token="test_token")
        self.assertTrue(ok)
        self.assertEqual(data["name"], "Fisica")

    @patch("services.xano_adapter.get_api_base_url", return_value="https://api.example.com")
    @patch("services.xano_adapter.urllib.request.urlopen")
    def test_fetch_academic_tasks_with_subject_filter(self, mock_urlopen, mock_base_url):
        """fetch_academic_tasks appends subject_id parameter to URL."""
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = b'[{"id": 10, "title": "Lista 1", "subject_id": 5}]'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        ok, data = fetch_academic_tasks(subject_id=5, auth_token="test_token")
        self.assertTrue(ok)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Lista 1")

    @patch("services.xano_adapter.get_api_base_url", return_value="https://api.example.com")
    @patch("services.xano_adapter.urllib.request.urlopen")
    def test_update_academic_task(self, mock_urlopen, mock_base_url):
        """update_academic_task sends PATCH request with updated fields."""
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = b'{"id": 10, "status": "completed"}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        ok, data = update_academic_task(10, {"status": "completed"}, auth_token="test_token")
        self.assertTrue(ok)
        self.assertEqual(data["status"], "completed")


if __name__ == "__main__":
    unittest.main()

