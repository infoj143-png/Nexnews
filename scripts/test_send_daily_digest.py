#!/usr/bin/env python3
import os
import sys
import json
import unittest
import urllib.error
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(__file__))

import send_daily_digest

class TestDailyDigest(unittest.TestCase):
    def test_get_recent_articles(self):
        # Create dummy directory structure in memory/mock
        now = datetime.now(timezone.utc)
        recent_date = (now - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
        old_date = (now - timedelta(hours=30)).strftime("%Y-%m-%dT%H:%M:%SZ")

        art1 = {"id": "1", "title": "Recent Article", "slug": "recent-article", "publishedAt": recent_date}
        art2 = {"id": "2", "title": "Old Article", "slug": "old-article", "publishedAt": old_date}

        with patch("os.path.exists", return_value=True), \
             patch("os.listdir", return_value=["art1.json", "art2.json", "invalid.txt"]), \
             patch("builtins.open") as mock_open:

            # Setup mock json loading
            def open_side_effect(filepath, *args, **kwargs):
                mock_file = MagicMock()
                if "art1.json" in filepath:
                    mock_file.__enter__.return_value.read.return_value = json.dumps(art1)
                elif "art2.json" in filepath:
                    mock_file.__enter__.return_value.read.return_value = json.dumps(art2)
                return mock_file

            mock_open.side_effect = open_side_effect

            articles = send_daily_digest.get_recent_articles("/dummy/dir", hours=24)
            self.assertEqual(len(articles), 1)
            self.assertEqual(articles[0]["title"], "Recent Article")

    def test_generate_digest_html(self):
        articles = [
            {
                "title": "Test Breaking News Title",
                "slug": "test-breaking-news-title",
                "summary": "This is a test summary for digest generation.",
                "category": "AI",
                "readTime": "4 min read"
            }
        ]
        html = send_daily_digest.generate_digest_html(articles, "https://nexnews-nu.vercel.app")
        self.assertIn("Test Breaking News Title", html)
        self.assertIn("https://nexnews-nu.vercel.app/news/test-breaking-news-title", html)
        self.assertIn("{{{ resend.unsubscribe }}}", html)

    @patch("urllib.request.urlopen")
    def test_get_or_create_audience_existing(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps({
            "data": [
                {"id": "aud_12345", "name": "Nexnews Subscribers"}
            ]
        }).encode('utf-8')
        mock_urlopen.return_value.__enter__.return_value = mock_response

        aud_id = send_daily_digest.get_or_create_audience("fake_key")
        self.assertEqual(aud_id, "aud_12345")

    @patch("urllib.request.urlopen")
    def test_get_or_create_audience_new(self, mock_urlopen):
        # 1st call return empty audience list, 2nd call creates new audience
        mock_resp_list = MagicMock()
        mock_resp_list.read.return_value = json.dumps({"data": []}).encode('utf-8')
        ctx_list = MagicMock()
        ctx_list.__enter__.return_value = mock_resp_list

        mock_resp_create = MagicMock()
        mock_resp_create.read.return_value = json.dumps({"id": "aud_new_999"}).encode('utf-8')
        ctx_create = MagicMock()
        ctx_create.__enter__.return_value = mock_resp_create

        mock_urlopen.side_effect = [ctx_list, ctx_create]

        aud_id = send_daily_digest.get_or_create_audience("fake_key")
        self.assertEqual(aud_id, "aud_new_999")

    @patch("urllib.request.urlopen")
    def test_send_digest_broadcast_success(self, mock_urlopen):
        mock_create = MagicMock()
        mock_create.read.return_value = json.dumps({"id": "broadcast_777"}).encode('utf-8')
        ctx_create = MagicMock()
        ctx_create.__enter__.return_value = mock_create

        mock_send = MagicMock()
        mock_send.read.return_value = json.dumps({"status": "queued"}).encode('utf-8')
        ctx_send = MagicMock()
        ctx_send.__enter__.return_value = mock_send

        mock_urlopen.side_effect = [ctx_create, ctx_send]

        result = send_daily_digest.send_digest_broadcast("fake_key", "aud_12345", "<html></html>", 5)
        self.assertTrue(result)

if __name__ == "__main__":
    unittest.main()
