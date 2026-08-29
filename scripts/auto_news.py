#!/usr/bin/env python3
"""
Nexnews Autonomous Background News Generation Script
-----------------------------------------------------
Fetches trending news keywords/topics (targeting Pakistan and Global regions),
generates an SEO/GEO-optimized news article using an LLM API (Gemini / OpenAI),
and writes the structured article JSON directly to data/articles/<slug>.json.
"""

import os
import sys
import json
import re
import random
import time
from datetime import datetime, timezone
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

import requests
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

# Category image fallbacks (Unsplash)
CATEGORY_IMAGES = {
    "AI": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    "Tech": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "World": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    "Business": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    "Sports": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80"
}

VALID_CATEGORIES = ["Tech", "World", "Business", "AI", "Sports"]

# RSS feeds targeting Pakistan & Global topics
TRENDING_FEEDS = [
    {
        "url": "https://trends.google.com/trending/rss?geo=PK",
        "source": "Google Trends Pakistan",
        "default_category": "World"
    },
    {
        "url": "https://trends.google.com/trending/rss?geo=US",
        "source": "Google Trends Global",
        "default_category": "Tech"
    },
    {
        "url": "https://techcrunch.com/feed/",
        "source": "TechCrunch",
        "default_category": "Tech"
    },
    {
        "url": "http://feeds.bbci.co.uk/news/world/rss.xml",
        "source": "BBC News World",
        "default_category": "World"
    },
    {
        "url": "http://feeds.bbci.co.uk/news/business/rss.xml",
        "source": "BBC Business",
        "default_category": "Business"
    }
]

# Fallback topics (targeting Pakistan & Global trends) if RSS feeds fail
FALLBACK_TOPICS = [
    {
        "title": "Pakistan Tech Ecosystem Accelerates Growth in AI and Cloud Infrastructure",
        "description": "Local IT sector sees surging export revenues and foreign investment in AI research and software engineering infrastructure.",
        "category": "Tech",
        "source": "Nexnews Trend Radar (Pakistan)"
    },
    {
        "title": "Autonomous AI Agents Revolutionize Global Enterprise Software Development",
        "description": "Next-generation reasoning models are automatically managing codebases, running regression tests, and deploying cloud infrastructure.",
        "category": "AI",
        "source": "Nexnews Trend Radar"
    },
    {
        "title": "Global Renewable Energy Grid Surpasses 60% Total Capacity Threshold",
        "description": "Solid-state battery storage grid deployments accelerate transition to net-zero power networks in major metropolitan areas.",
        "category": "World",
        "source": "Nexnews Trend Radar"
    },
    {
        "title": "State Bank of Pakistan Integrates New Digital Currency Settlement Protocols",
        "description": "Financial institutions roll out real-time cross-border payment settlements using digital currency infrastructure.",
        "category": "Business",
        "source": "Nexnews Trend Radar (Pakistan)"
    },
    {
        "title": "Pakistan Super League Introduces AI Bio-Tracking Sensors for Player Recovery",
        "description": "Sports science departments adopt real-time biometric analysis to optimize athletic recovery speed during tournament matches.",
        "category": "Sports",
        "source": "Nexnews Trend Radar (Pakistan)"
    }
]

def slugify(text: str) -> str:
    """Converts a title into a URL-friendly slug."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

def fetch_trending_topic() -> dict:
    """Fetches real-time search keywords and news headlines from Google Trends RSS or news feeds."""
    random_feeds = list(TRENDING_FEEDS)
    random.shuffle(random_feeds)

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Nexnews-AutoNews/1.0"}
    ns = {'ht': 'https://trends.google.com/trending/rss'}

    for feed in random_feeds:
        try:
            req = urllib.request.Request(feed["url"], headers=headers)
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status == 200:
                    xml_data = response.read().decode('utf-8', errors='ignore')
                    root = ET.fromstring(xml_data)
                    items = root.findall('.//item')
                    if items:
                        selected_item = random.choice(items[:5])
                        title_elem = selected_item.find('title')
                        desc_elem = selected_item.find('description')

                        raw_keyword = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
                        desc = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ""
                        desc = re.sub(r'<[^>]+>', '', desc)

                        # Extract Google Trends specific namespace elements
                        traffic_elem = selected_item.find('ht:approx_traffic', ns)
                        approx_traffic = traffic_elem.text.strip() if traffic_elem is not None and traffic_elem.text else ""

                        news_item = selected_item.find('ht:news_item', ns)
                        news_headline = ""
                        news_source = ""
                        news_snippet = ""
                        news_url = ""

                        if news_item is not None:
                            ht_title = news_item.find('ht:news_item_title', ns)
                            ht_source = news_item.find('ht:news_item_source', ns)
                            ht_snippet = news_item.find('ht:news_item_snippet', ns)
                            ht_url = news_item.find('ht:news_item_url', ns)

                            if ht_title is not None and ht_title.text:
                                news_headline = re.sub(r'<[^>]+>', '', ht_title.text.strip())
                            if ht_source is not None and ht_source.text:
                                news_source = ht_source.text.strip()
                            if ht_snippet is not None and ht_snippet.text:
                                news_snippet = re.sub(r'<[^>]+>', '', ht_snippet.text.strip())
                            if ht_url is not None and ht_url.text:
                                news_url = ht_url.text.strip()

                        source_name = news_source or feed["source"]
                        trending_keyword = raw_keyword or news_headline
                        description = news_snippet or desc or news_headline or raw_keyword

                        # Construct article title context
                        if news_headline:
                            title = news_headline
                        elif raw_keyword:
                            title = f"Trending Search Analysis: {raw_keyword.title()}"
                        else:
                            title = ""

                        if title and len(title) > 3:
                            print(f"[+] Fetched trending topic from {feed['source']}: '{trending_keyword}' ({approx_traffic} searches)")
                            return {
                                "title": title,
                                "trending_keyword": trending_keyword,
                                "approx_traffic": approx_traffic or "High Search Volume",
                                "headline": news_headline or title,
                                "description": description,
                                "category": feed["default_category"],
                                "source": source_name,
                                "url": news_url
                            }
        except Exception as e:
            print(f"[-] Could not fetch feed {feed['source']}: {e}")
            continue

    # Use fallback topic if RSS fetch fails
    selected = random.choice(FALLBACK_TOPICS)
    fallback_keyword = selected.get("trending_keyword", selected["title"].split(":")[0])
    selected["trending_keyword"] = fallback_keyword
    selected["approx_traffic"] = "100K+ Search Volume"
    selected["headline"] = selected["title"]
    print(f"[!] Using fallback trending topic: '{selected['title']}'")
    return selected

def generate_article_gemini(topic: dict, api_key: str) -> dict:
    """Generates an SEO/GEO optimized article centered around high-demand search intent using Google Gemini API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    trending_kw = topic.get("trending_keyword") or topic.get("title")
    traffic = topic.get("approx_traffic") or "High Search Demand"
    headline = topic.get("headline") or topic.get("title")

    prompt = f"""
You are an expert SEO editor and senior news journalist at Nexnews.
Create an in-depth, authoritative, engaging, and search-intent-optimized news article based on this real-time trending search query:

TARGET TRENDING SEARCH KEYWORD: "{trending_kw}"
ESTIMATED SEARCH DEMAND: "{traffic}"
BREAKING HEADLINE / CONTEXT: "{headline}"
SOURCE DISPATCH: "{topic.get('source', 'Nexnews Trend Radar')}"
SUMMARY CONTEXT: "{topic.get('description', '')}"
TARGET CATEGORY: "{topic.get('category', 'Tech')}"

### SEARCH INTENT & SEO / GEO OPTIMIZATION MANDATES:
1. Search Keyword Targeting: The main title and opening paragraph must seamlessly integrate the high-demand keyword "{trending_kw}" to capture maximum organic search traffic.
2. User Intent Resolution: Resolve the user's search query immediately in the lead paragraph by addressing what happened, key developments, and real-world implications.
3. Structural Hierarchy: Use clear <h2> and <h3> HTML tags for clean scanning and search engine indexing.
4. Key Takeaways & Metrics: Include a bulleted <ul> list with concrete statistics, quantitative metrics, or key event timeline points.
5. High-Intent FAQ Section: Include a "Key Questions Answered" or FAQ section using <h3> headings that answer long-tail search questions users ask about "{trending_kw}".
6. HTML Formatting Standards: Wrap paragraphs in <p class="mb-4">, main sections in <h2 class="text-2xl font-bold mt-6 mb-3">, sub-headings in <h3 class="text-xl font-semibold mt-4 mb-2">, lists in <ul class="list-disc pl-6 my-4 space-y-2">, and blockquotes in <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">.

Return ONLY a valid JSON object matching this schema:
{{
  "title": "SEO-rich, high-CTR headline containing target search terms",
  "slug": "url-friendly-slug-lowercase",
  "category": "Tech" | "World" | "Business" | "AI" | "Sports",
  "summary": "1-2 sentence search snippet optimized executive summary",
  "content": "Complete article HTML string containing h2, h3, p, ul, blockquote, direct search query resolutions",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
}}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]

        # Clean JSON block wrapper if present
        raw_text = re.sub(r'^```json\s*', '', raw_text, flags=re.MULTILINE)
        raw_text = re.sub(r'^```\s*', '', raw_text, flags=re.MULTILINE)
        raw_text = re.sub(r'\s*```$', '', raw_text, flags=re.MULTILINE)

        return json.loads(raw_text.strip())

def generate_article_openai(topic: dict, api_key: str) -> dict:
    """Generates an SEO/GEO optimized article using OpenAI API."""
    url = "https://api.openai.com/v1/chat/completions"

    trending_kw = topic.get("trending_keyword") or topic.get("title")

    prompt = f"""
You are a senior SEO journalist for Nexnews. Create an in-depth news article targeting the trending search query:
TRENDING KEYWORD: "{trending_kw}"
HEADLINE: "{topic.get('headline') or topic['title']}"
SOURCE: "{topic['source']}"
DESCRIPTION: "{topic['description']}"
SUGGESTED CATEGORY: "{topic['category']}"

Optimize title and content to resolve user search intent for "{trending_kw}".
Include h2, h3 FAQ sections, p, ul with stats, and blockquotes.

Return ONLY a valid JSON object:
{{
  "title": "SEO headline targeting {trending_kw}",
  "slug": "url-friendly-slug",
  "category": "Tech" | "World" | "Business" | "AI" | "Sports",
  "summary": "1-2 sentence summary",
  "content": "HTML article content with h2, h3, p, ul, blockquote",
  "tags": ["Tag1", "Tag2", "Tag3"]
}}
"""

    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"}
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        raw_text = res_data["choices"][0]["message"]["content"]
        return json.loads(raw_text.strip())

def generate_fallback_article(topic: dict) -> dict:
    """Generates a structured GEO fallback article when LLM API keys are absent or fail."""
    trending_kw = topic.get("trending_keyword") or topic.get("title")
    headline = topic.get("headline") or topic.get("title")
    title = headline if headline else f"Trending Search Analysis: {trending_kw}"
    cat = topic["category"] if topic.get("category") in VALID_CATEGORIES else "Tech"
    slug = slugify(title)
    traffic = topic.get("approx_traffic") or "High Search Volume"
    summary = f"High-demand search trend analysis for '{trending_kw}' ({traffic}): Key developments, analysis, and strategic breakdown."

    content = f"""
<p class="mb-4 font-serif text-lg leading-relaxed"><strong>AUTOMATED AI SEARCH TREND REPORT</strong> — Real-time search engine telemetry confirms surging query volumes for <strong>"{trending_kw}"</strong> ({traffic}). This special dispatch analyzes breaking news developments, underlying market forces, and search intent indicators behind this trend.</p>

<h2 class="text-2xl font-bold mt-6 mb-3">Breaking Overview & Search Intent Metrics</h2>
<p class="mb-4">Digital intelligence networks report heightened interest across regional and global digital platforms regarding <strong>{title}</strong>.</p>

<ul class="list-disc pl-6 my-4 space-y-2">
  <li><strong>Search Volume Velocity:</strong> Registered {traffic} in real-time search queries across primary search indices.</li>
  <li><strong>Key Focus Area:</strong> {topic.get('description', title)}</li>
  <li><strong>Market Sentiment:</strong> Positive engagement and rapid indexation across leading digital media channels.</li>
  <li><strong>Regional & Global Reach:</strong> Sourced via {topic.get('source', 'Nexnews Trend Radar')}.</li>
</ul>

<blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">
  "Aligning real-time search intent with Generative Engine Optimization ensures immediate content relevance and authority for high-demand topics."
</blockquote>

<h2 class="text-2xl font-bold mt-6 mb-3">Key Questions Answered (Search Query Resolution)</h2>

<h3 class="text-xl font-semibold mt-4 mb-2">Why is "{trending_kw}" trending right now?</h3>
<p class="mb-4">Surging interest in "{trending_kw}" is driven by breaking developments reported by {topic.get('source', 'major news outlets')}, highlighting significant shifts and immediate user interest.</p>

<h3 class="text-xl font-semibold mt-4 mb-2">What are the primary takeaways for readers?</h3>
<p class="mb-4">This trending event underscores key industry changes, offering crucial insights for audience members tracking real-time updates and strategic market analysis.</p>

<h2 class="text-2xl font-bold mt-6 mb-3">Future Outlook & Ongoing Coverage</h2>
<p class="mb-4">Nexnews will continue tracking real-time telemetry and search demand patterns for "{trending_kw}" as further details unfold.</p>
"""

    return {
        "title": title,
        "slug": slug,
        "category": cat,
        "summary": summary,
        "content": content,
        "tags": [cat, trending_kw, "Trending-Search", "Breaking-News", "SEO-Optimized"]
    }

def main():
    print("==================================================")
    print("  Nexnews Autonomous News Generator Pipeline  ")
    print("==================================================")

    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    topic = fetch_trending_topic()
    article_data = None

    if gemini_key:
        print("[+] Generating article via Gemini API...")
        try:
            article_data = generate_article_gemini(topic, gemini_key)
        except Exception as e:
            print(f"[-] Gemini API generation error: {e}")

    if not article_data and openai_key:
        print("[+] Generating article via OpenAI API...")
        try:
            article_data = generate_article_openai(topic, openai_key)
        except Exception as e:
            print(f"[-] OpenAI API generation error: {e}")

    if not article_data:
        print("[!] API keys not found or API requests failed. Generating fallback GEO news article...")
        article_data = generate_fallback_article(topic)

    # Validate category & slug
    cat = article_data.get("category")
    if cat not in VALID_CATEGORIES:
        cat = topic.get("category", "Tech")
        if cat not in VALID_CATEGORIES:
            cat = "Tech"

    slug = slugify(article_data.get("slug") or article_data.get("title") or topic["title"])
    title = article_data.get("title", topic["title"])
    summary = article_data.get("summary", topic["description"])
    content = article_data.get("content", "")
    tags = article_data.get("tags", [cat, "News", "AI-Generated"])

    published_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    article_id = str(int(time.time() * 1000))

    full_article = {
        "id": article_id,
        "title": title,
        "slug": slug,
        "summary": summary,
        "content": content,
        "category": cat,
        "author": {
            "name": "Nexnews Autonomous Script",
            "avatar": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
            "role": "Background Python Automation Pipeline"
        },
        "publishedAt": published_at,
        "readTime": "4 min read",
        "imageUrl": CATEGORY_IMAGES.get(cat, CATEGORY_IMAGES["Tech"]),
        "imageCaption": f"Visual representation for '{title}'",
        "isFeatured": True,
        "isTrending": True,
        "isBreaking": True,
        "views": 0,
        "status": "published",
        "tags": tags,
        "aiGenerated": True
    }

    # Ensure data/articles directory exists
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    articles_dir = os.path.join(repo_root, "data", "articles")
    os.makedirs(articles_dir, exist_ok=True)

    file_path = os.path.join(articles_dir, f"{slug}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(full_article, f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Article published and saved to: {file_path}")
    print(f" - Title: {title}")
    print(f" - Slug: {slug}")
    print(f" - Category: {cat}")

    # Automatically submit newly published article to Google Indexing API
    site_url = os.environ.get("SITE_URL", "https://nexnews-nu.vercel.app").rstrip("/")
    article_url = f"{site_url}/news/{slug}"
    submit_to_google_indexing(article_url)

def submit_to_google_indexing(article_url: str) -> bool:
    """
    Retrieves service account JSON credentials from GCP_SA_KEY,
    authenticates using Google Indexing API scope, and submits a POST request to publish the URL.
    """
    gcp_sa_key = os.environ.get("GCP_SA_KEY")
    if not gcp_sa_key:
        print("[-] GCP_SA_KEY environment variable is not set. Skipping Google Indexing API submission.")
        return False

    scopes = ["https://www.googleapis.com/auth/indexing"]
    endpoint = "https://indexing.googleapis.com/v3/urlNotifications:publish"

    try:
        if os.path.isfile(gcp_sa_key):
            credentials = service_account.Credentials.from_service_account_file(
                gcp_sa_key, scopes=scopes
            )
        else:
            sa_info = json.loads(gcp_sa_key)
            credentials = service_account.Credentials.from_service_account_info(
                sa_info, scopes=scopes
            )

        session = AuthorizedSession(credentials)
        payload = {
            "url": article_url,
            "type": "URL_UPDATED"
        }
        response = session.post(endpoint, json=payload, timeout=15)

        if response.status_code == 200:
            print(f"[SUCCESS] Successfully submitted '{article_url}' to Google Indexing API.")
            print(f" - Response: {response.text}")
            return True
        else:
            print(f"[-] Failed to submit '{article_url}' to Google Indexing API. Status code: {response.status_code}")
            print(f" - Response: {response.text}")
            return False
    except Exception as e:
        print(f"[-] Error submitting '{article_url}' to Google Indexing API: {e}")
        return False

if __name__ == "__main__":
    main()
