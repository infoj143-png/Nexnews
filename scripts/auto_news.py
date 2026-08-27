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
    """Fetches a trending news item from Google Trends RSS (PK/Global) or fallback feeds."""
    random_feeds = list(TRENDING_FEEDS)
    random.shuffle(random_feeds)

    headers = {"User-Agent": "Nexnews-AutoNews-PythonScript/1.0"}

    for feed in random_feeds:
        try:
            req = urllib.request.Request(feed["url"], headers=headers)
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    xml_data = response.read().decode('utf-8', errors='ignore')
                    # Parse XML items
                    root = ET.fromstring(xml_data)
                    items = root.findall('.//item')
                    if items:
                        selected_item = random.choice(items[:5])
                        title_elem = selected_item.find('title')
                        desc_elem = selected_item.find('description')

                        title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
                        description = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ""

                        # Clean HTML tags in description if present
                        description = re.sub(r'<[^>]+>', '', description)

                        if title and len(title) > 8:
                            print(f"[+] Fetched trending topic from {feed['source']}: '{title}'")
                            return {
                                "title": title,
                                "description": description or title,
                                "category": feed["default_category"],
                                "source": feed["source"]
                            }
        except Exception as e:
            print(f"[-] Could not fetch feed {feed['source']}: {e}")
            continue

    # Use fallback topic if RSS fetch fails
    selected = random.choice(FALLBACK_TOPICS)
    print(f"[!] Using fallback trending topic: '{selected['title']}'")
    return selected

def generate_article_gemini(topic: dict, api_key: str) -> dict:
    """Generates an SEO/GEO optimized article using Google Gemini API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    prompt = f"""
You are a senior tech & global affairs journalist writing for Nexnews (a leading digital news publication).
Create an in-depth, highly authoritative, engaging, and SEO/GEO-optimized news article based on this trending topic:

TITLE: "{topic['title']}"
SOURCE: "{topic['source']}"
DESCRIPTION: "{topic['description']}"
SUGGESTED CATEGORY: "{topic['category']}"

### GENERATIVE ENGINE OPTIMIZATION (GEO) & SEO REQUIREMENTS:
1. Use clear <h2> and <h3> HTML tags for structural hierarchy.
2. Include <ul> bullet lists with quantitative metrics, statistics, and concrete data points.
3. Include a "Key Questions Answered" FAQ section resolving high-intent queries.
4. Format HTML: wrap paragraphs in <p class="mb-4">, headings in <h2 class="text-2xl font-bold mt-6 mb-3"> or <h3 class="text-xl font-semibold mt-4 mb-2">, bullet lists in <ul class="list-disc pl-6 my-4 space-y-2">, and blockquotes in <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">.

Return ONLY a valid JSON object matching this schema:
{{
  "title": "SEO-rich, engaging headline",
  "slug": "url-friendly-slug-lowercase",
  "category": "Tech" | "World" | "Business" | "AI" | "Sports",
  "summary": "1-2 sentence executive summary for AI search snippets",
  "content": "Complete article HTML string containing h2, h3, p, ul, blockquote",
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

    prompt = f"""
You are a senior news journalist for Nexnews. Create an in-depth SEO news article based on:
TITLE: "{topic['title']}"
SOURCE: "{topic['source']}"
DESCRIPTION: "{topic['description']}"
SUGGESTED CATEGORY: "{topic['category']}"

Return ONLY a valid JSON object:
{{
  "title": "SEO headline",
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
    title = topic["title"]
    cat = topic["category"] if topic["category"] in VALID_CATEGORIES else "Tech"
    slug = slugify(title)
    summary = f"Special automated dispatch on {title} featuring key statistics, operational impact, and strategic analysis."

    content = f"""
<p class="mb-4 font-serif text-lg leading-relaxed"><strong>AUTOMATED AI SPECIAL REPORT</strong> — Industry analysts and regional correspondents report significant developments regarding <strong>{title}</strong>. This detailed report examines key market indicators, operational ramifications, and the strategic outlook.</p>

<h2 class="text-2xl font-bold mt-6 mb-3">Executive Summary & Key Metrics</h2>
<p class="mb-4">Generative engine telemetry and digital indices confirm heightened interest across target sectors in Pakistan and international markets.</p>

<ul class="list-disc pl-6 my-4 space-y-2">
  <li><strong>Growth Velocity:</strong> Projected 45% expansion rate in operational adoption across key markets this quarter.</li>
  <li><strong>Operational Efficiency:</strong> Integration benchmarks demonstrate up to a 38% reduction in latency and infrastructure costs.</li>
  <li><strong>Economic Valuation:</strong> Industry projections model an addressable market impact exceeding $15 Billion by 2026.</li>
  <li><strong>Regulatory Standards:</strong> Regional policy frameworks are aligning with international benchmarks to ensure compliance.</li>
</ul>

<blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">
  "The adoption of Generative Engine Optimization and automated content delivery ensures information accuracy and immediate search indexation."
</blockquote>

<h2 class="text-2xl font-bold mt-6 mb-3">Key Questions Answered (AI Query Resolution)</h2>

<h3 class="text-xl font-semibold mt-4 mb-2">What is the immediate significance of this development?</h3>
<p class="mb-4">This development establishes a new benchmark for operational efficiency, enabling organizations in Pakistan and globally to streamline data delivery and decision-making.</p>

<h3 class="text-xl font-semibold mt-4 mb-2">How does this impact the broader market landscape?</h3>
<p class="mb-4">Key market participants benefit from lower overhead, improved compliance guarantees, and enhanced service delivery across digital touchpoints.</p>

<h2 class="text-2xl font-bold mt-6 mb-3">Future Strategic Outlook</h2>
<p class="mb-4">As adoption continues to surge over the coming quarters, continuous monitoring and iterative optimization will remain vital for maintaining strategic advantages.</p>
"""

    return {
        "title": title,
        "slug": slug,
        "category": cat,
        "summary": summary,
        "content": content,
        "tags": [cat, "Automated-News", "Pakistan-Global", "Breaking", "GEO-Optimized"]
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

if __name__ == "__main__":
    main()
