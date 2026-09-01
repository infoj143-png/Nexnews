#!/usr/bin/env python3
import os
import sys
import json
import urllib.error
import unittest
from unittest.mock import patch, MagicMock

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(__file__))

import auto_news

class TestCleanModelName(unittest.TestCase):
    def test_clean_model_name_variations(self):
        self.assertEqual(auto_news.clean_model_name("models/gemini-2.5-flash"), "gemini-2.5-flash")
        self.assertEqual(auto_news.clean_model_name("models/models/gemini-2.5-flash"), "gemini-2.5-flash")
        self.assertEqual(auto_news.clean_model_name("/models/gemini-2.5-flash"), "gemini-2.5-flash")
        self.assertEqual(auto_news.clean_model_name("gemini-2.5-flash"), "gemini-2.5-flash")
        self.assertEqual(auto_news.clean_model_name(""), "")

class TestGeminiModelDiscovery(unittest.TestCase):
    def setUp(self):
        # Reset cached model state before each test
        auto_news._CACHED_GEMINI_CANDIDATES = None
        if "GEMINI_MODEL" in os.environ:
            del os.environ["GEMINI_MODEL"]

    def tearDown(self):
        auto_news._CACHED_GEMINI_CANDIDATES = None
        if "GEMINI_MODEL" in os.environ:
            del os.environ["GEMINI_MODEL"]

    @patch("urllib.request.urlopen")
    def test_list_models_success_highest_version_and_tiebreak(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps({
            "models": [
                {
                    "name": "models/gemini-1.5-flash",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/gemini-2.5-pro",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/gemini-2.5-flash-preview",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/gemini-2.5-flash",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/gemini-3.0-flash-lite",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/gemini-3.0-flash",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/gemini-3.5-flash-exp",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/gemini-3.0-flash-no-gen",
                    "supportedGenerationMethods": ["embedContent"]
                }
            ]
        }).encode('utf-8')

        # Context manager mock
        mock_urlopen.return_value.__enter__.return_value = mock_response

        model = auto_news.get_current_gemini_model("fake-api-key")
        self.assertEqual(model, "gemini-3.0-flash")

    @patch("urllib.request.urlopen")
    def test_list_models_failure_falls_to_env_var(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("Network error")
        os.environ["GEMINI_MODEL"] = "gemini-custom-env-model"

        candidates = auto_news.get_gemini_candidate_models("fake-api-key")
        self.assertEqual(candidates[0], "gemini-custom-env-model")
        self.assertIn("gemini-2.5-flash", candidates)

    @patch("urllib.request.urlopen")
    def test_list_models_failure_falls_to_hardcoded_default(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("Network error")

        model = auto_news.get_current_gemini_model("fake-api-key")
        self.assertEqual(model, "gemini-2.5-flash")

    def test_no_api_key_uses_env_var(self):
        os.environ["GEMINI_MODEL"] = "gemini-env-override"
        candidates = auto_news.get_gemini_candidate_models(None)
        self.assertEqual(candidates[0], "gemini-env-override")

    def test_no_api_key_uses_hardcoded_default(self):
        model = auto_news.get_current_gemini_model(None)
        self.assertEqual(model, "gemini-2.5-flash")

    @patch("urllib.request.urlopen")
    def test_caching_behavior(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps({
            "models": [
                {
                    "name": "models/gemini-2.5-flash",
                    "supportedGenerationMethods": ["generateContent"]
                }
            ]
        }).encode('utf-8')
        mock_urlopen.return_value.__enter__.return_value = mock_response

        model1 = auto_news.get_current_gemini_model("fake-key")
        model2 = auto_news.get_current_gemini_model("fake-key")
        self.assertEqual(model1, "gemini-2.5-flash")
        self.assertEqual(model2, "gemini-2.5-flash")
        # urlopen should only be called once due to caching
        self.assertEqual(mock_urlopen.call_count, 1)

class TestResilientExecutionLoop(unittest.TestCase):
    @patch("urllib.request.urlopen")
    def test_gemini_retries_on_404_and_succeeds_on_fallback(self, mock_urlopen):
        # 1st candidate returns HTTP 404, 2nd candidate succeeds
        mock_err_response = MagicMock()
        mock_err_response.read.return_value = b"Model not found"
        http_404_error = urllib.error.HTTPError(
            url="http://fake", code=404, msg="Not Found", hdrs={}, fp=mock_err_response
        )

        mock_success_response = MagicMock()
        mock_success_response.status = 200
        mock_success_response.read.return_value = json.dumps({
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": json.dumps({
                            "title": "Valid Test Title",
                            "slug": "valid-test-title",
                            "category": "Tech",
                            "summary": "This is a valid summary for testing.",
                            "content": "<p class=\"mb-4\">Valid test article content with sufficient length for validation.</p>",
                            "tags": ["Test"]
                        })
                    }]
                }
            }]
        }).encode('utf-8')

        ctx_success = MagicMock()
        ctx_success.__enter__.return_value = mock_success_response

        mock_urlopen.side_effect = [http_404_error, ctx_success]

        topic = {"title": "Test Topic", "trending_keyword": "Test"}
        result = auto_news.generate_article_gemini(topic, "fake-key", ["models/models/gemini-bad", "gemini-2.5-flash"])

        self.assertIsNotNone(result)
        self.assertEqual(result["title"], "Valid Test Title")
        self.assertEqual(result["_used_model"], "gemini-2.5-flash")

class TestGoogleDriveBackup(unittest.TestCase):
    def setUp(self):
        self.env_patches = {
            "GDRIVE_SERVICE_ACCOUNT_KEY": "{\"type\": \"service_account\", \"project_id\": \"test\"}",
            "GDRIVE_FOLDER_ID": "test_folder_123"
        }
        for k in list(os.environ.keys()):
            if k.startswith("GDRIVE_"):
                del os.environ[k]

    def tearDown(self):
        for k in list(os.environ.keys()):
            if k.startswith("GDRIVE_"):
                del os.environ[k]

    def test_backup_to_google_drive_missing_env_vars(self):
        self.assertFalse(auto_news.backup_to_google_drive("/dummy/path.json"))

        os.environ["GDRIVE_SERVICE_ACCOUNT_KEY"] = "some_key"
        self.assertFalse(auto_news.backup_to_google_drive("/dummy/path.json"))

    def test_backup_to_google_drive_whitespace_env_vars(self):
        os.environ["GDRIVE_SERVICE_ACCOUNT_KEY"] = "   \n "
        os.environ["GDRIVE_FOLDER_ID"] = "   \n "
        self.assertFalse(auto_news.backup_to_google_drive("/dummy/path.json"))

    @patch("os.path.exists")
    def test_backup_to_google_drive_file_not_found(self, mock_exists):
        os.environ["GDRIVE_SERVICE_ACCOUNT_KEY"] = "some_key"
        os.environ["GDRIVE_FOLDER_ID"] = "some_folder"
        mock_exists.return_value = False

        self.assertFalse(auto_news.backup_to_google_drive("/dummy/nonexistent.json"))

    @patch("auto_news.MediaFileUpload")
    @patch("auto_news.build")
    @patch("google.oauth2.service_account.Credentials.from_service_account_info")
    @patch("os.path.exists")
    def test_backup_to_google_drive_success_json_string(
        self, mock_exists, mock_cred_info, mock_build, mock_media
    ):
        os.environ["GDRIVE_SERVICE_ACCOUNT_KEY"] = "  " + json.dumps({"type": "service_account"}) + "\n "
        os.environ["GDRIVE_FOLDER_ID"] = "  folder_xyz \n"
        mock_exists.return_value = True

        mock_drive_service = MagicMock()
        mock_create_req = MagicMock()
        mock_create_req.execute.return_value = {"id": "file_drive_id_999"}
        mock_drive_service.files().create.return_value = mock_create_req
        mock_build.return_value = mock_drive_service

        result = auto_news.backup_to_google_drive("/data/articles/test-article.json")

        self.assertTrue(result)
        mock_cred_info.assert_called_once()
        mock_build.assert_called_once_with("drive", "v3", credentials=mock_cred_info.return_value)
        mock_drive_service.files().create.assert_called_once_with(
            body={"name": "test-article.json", "parents": ["folder_xyz"]},
            media_body=mock_media.return_value,
            fields="id",
            supportsAllDrives=True
        )

    @patch("auto_news.MediaFileUpload")
    @patch("auto_news.build")
    @patch("google.oauth2.service_account.Credentials.from_service_account_file")
    @patch("os.path.isfile")
    @patch("os.path.exists")
    def test_backup_to_google_drive_success_file_path(
        self, mock_exists, mock_isfile, mock_cred_file, mock_build, mock_media
    ):
        os.environ["GDRIVE_SERVICE_ACCOUNT_KEY"] = "/path/to/sa_key.json"
        os.environ["GDRIVE_FOLDER_ID"] = "folder_abc"

        def exists_side_effect(path):
            return True

        def isfile_side_effect(path):
            return path == "/path/to/sa_key.json"

        mock_exists.side_effect = exists_side_effect
        mock_isfile.side_effect = isfile_side_effect

        mock_drive_service = MagicMock()
        mock_create_req = MagicMock()
        mock_create_req.execute.return_value = {"id": "file_drive_id_111"}
        mock_drive_service.files().create.return_value = mock_create_req
        mock_build.return_value = mock_drive_service

        result = auto_news.backup_to_google_drive("/data/articles/test-article-2.json")

        self.assertTrue(result)
        mock_cred_file.assert_called_once_with("/path/to/sa_key.json", scopes=["https://www.googleapis.com/auth/drive.file"])

    @patch("os.path.exists")
    @patch("google.oauth2.service_account.Credentials.from_service_account_info")
    def test_backup_to_google_drive_exception_handling(self, mock_cred_info, mock_exists):
        os.environ["GDRIVE_SERVICE_ACCOUNT_KEY"] = json.dumps({"type": "service_account"})
        os.environ["GDRIVE_FOLDER_ID"] = "folder_xyz"
        mock_exists.return_value = True

        mock_cred_info.side_effect = Exception("Auth API failure")

        result = auto_news.backup_to_google_drive("/data/articles/test-article.json")
        self.assertFalse(result)

if __name__ == "__main__":
    unittest.main()
