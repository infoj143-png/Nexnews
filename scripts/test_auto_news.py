#!/usr/bin/env python3
import os
import sys
import json
import unittest
from unittest.mock import patch, MagicMock

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(__file__))

import auto_news

class TestGeminiModelDiscovery(unittest.TestCase):
    def setUp(self):
        # Reset cached model state before each test
        auto_news._CACHED_GEMINI_MODEL = None
        if "GEMINI_MODEL" in os.environ:
            del os.environ["GEMINI_MODEL"]

    def tearDown(self):
        auto_news._CACHED_GEMINI_MODEL = None
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

        model = auto_news.get_current_gemini_model("fake-api-key")
        self.assertEqual(model, "gemini-custom-env-model")

    @patch("urllib.request.urlopen")
    def test_list_models_failure_falls_to_hardcoded_default(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("Network error")

        model = auto_news.get_current_gemini_model("fake-api-key")
        self.assertEqual(model, "gemini-2.5-flash")

    def test_no_api_key_uses_env_var(self):
        os.environ["GEMINI_MODEL"] = "gemini-env-override"
        model = auto_news.get_current_gemini_model(None)
        self.assertEqual(model, "gemini-env-override")

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

if __name__ == "__main__":
    unittest.main()
