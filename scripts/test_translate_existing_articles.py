#!/usr/bin/env python3
import unittest
import json
import os
from scripts.translate_existing_articles import (
    is_non_english_article,
    process_article_translation
)

class TestTranslateExistingArticles(unittest.TestCase):

    def test_is_non_english_article_detection(self):
        english_article = {
            "title": "US Open Day 3: Madison Keys Navigates Rain Delays",
            "summary": "Madison Keys secured a hard-fought victory amidst weather delays.",
            "content": "<p>Action unfolded at Flushing Meadows as rain disrupted early play.</p>",
            "tags": ["Tennis", "US Open", "Sports"]
        }
        self.assertFalse(is_non_english_article(english_article))

        spanish_article = {
            "title": "Clima Tijuana: Pronóstico detallado para hoy martes",
            "summary": "Conoce el estado del clima en Tijuana hoy 1 de septiembre.",
            "content": "<p>El clima tijuana para hoy presenta una transición térmica moderada.</p>",
            "tags": ["clima tijuana", "Baja California"]
        }
        self.assertTrue(is_non_english_article(spanish_article))

        arabic_article = {
            "title": "عاجل: الهلال يخطط لمفاجأة الأهلي بصفقة قادر ميتي",
            "summary": "يتحرك نادي الهلال بقوة في سوق الانتقالات",
            "content": "<p>يتصدر نادي الهلال السعودي المشهد الرياضي مجدداً</p>",
            "tags": ["الهلال", "الاهلي"]
        }
        self.assertTrue(is_non_english_article(arabic_article))

        german_article = {
            "title": "ARD Live: So sehen Sie das Spiel des Jahres",
            "summary": "VfL Osnabrück empfängt den FC Bayern München",
            "content": "<p>Es ist das absolute Highlight-Spiel der Saison</p>",
            "tags": ["ARD live", "VfL Osnabrück"]
        }
        self.assertTrue(is_non_english_article(german_article))

        japanese_article = {
            "title": "あさ イチ 山口馬木也が生出演で明かした意外な過去",
            "summary": "NHKの人気情報番組にあさ イチに出演",
            "content": "<p>大ヒット映画侍タイムスリッパーで話題</p>",
            "tags": ["あさ イチ", "山口馬木也"]
        }
        self.assertTrue(is_non_english_article(japanese_article))

        hindi_article = {
            "title": "Team India में बड़ा बदलाव: सिर्फ एक महीने में बदली टीम",
            "summary": "भारतीय क्रिकेट टीम में सिर्फ एक महीने के भीतर बड़े बदलाव देखने को मिले हैं",
            "content": "<p>भारतीय क्रिकेट में बदलाव की बयार बेहद तेज हो चुकी है</p>",
            "tags": ["Team India", "Cricket"]
        }
        self.assertTrue(is_non_english_article(hindi_article))

    def test_critical_fields_preservation(self):
        sample_article = {
            "id": "1788644730290",
            "title": "Clima Tijuana: Pronóstico detallado para hoy martes 1 de septiembre de 2026",
            "slug": "clima-tijuana-pronostico-hoy-1-septiembre-2026",
            "summary": "Conoce el estado del clima en Tijuana hoy 1 de septiembre de 2026.",
            "content": "<p>El clima tijuana para hoy presenta una transición térmica.</p>",
            "category": "World",
            "publishedAt": "2026-09-01T12:00:00Z",
            "url": "https://nexnews.vercel.app/news/clima-tijuana-pronostico-hoy-1-septiembre-2026",
            "tags": ["clima tijuana", "Baja California"],
            "keyTakeaways": ["Clima moderado en la frontera norte."],
            "faqs": [{"question": "¿Habrá lluvia?", "answer": "No se pronostican lluvias."}]
        }

        updated, translated = process_article_translation("clima-tijuana-pronostico-hoy-1-septiembre-2026.json", sample_article, api_key=None)

        self.assertTrue(translated)
        # CRITICAL REQUIREMENTS CHECK:
        self.assertEqual(updated["id"], "1788644730290")
        self.assertEqual(updated["slug"], "clima-tijuana-pronostico-hoy-1-septiembre-2026")
        self.assertEqual(updated["publishedAt"], "2026-09-01T12:00:00Z")
        self.assertEqual(updated["url"], "https://nexnews.vercel.app/news/clima-tijuana-pronostico-hoy-1-septiembre-2026")

        # TRANSLATED FIELDS CHECK:
        self.assertEqual(updated["title"], "Tijuana Weather: Detailed Forecast for Today, September 1, 2026")
        self.assertIn("Tijuana", updated["summary"])
        self.assertIn("Tijuana", updated["content"])
        self.assertIn("Tijuana Weather", updated["tags"])

if __name__ == "__main__":
    unittest.main()
