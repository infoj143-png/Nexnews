#!/usr/bin/env python3
"""
Nexnews Autonomous Background News Generation Script
-----------------------------------------------------
Fetches trending news keywords/topics from worldwide Google Trends RSS feeds,
ranks candidate items by worldwide search traffic, deduplicates against recently published articles,
generates an SEO/GEO-optimized news article using an LLM API (Gemini / OpenAI),
sanitizes HTML output, and writes structured article JSON to data/articles/<slug>.json.
Submits new URLs to Google Indexing API upon publication.
"""

import os
import sys
import json
import re
import time
from datetime import datetime, timezone, timedelta
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

VALID_CATEGORIES = ["Tech", "World", "Business", "AI", "Sports"]

CATEGORY_IMAGES = {
    "AI": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    "Tech": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "World": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    "Business": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    "Sports": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80"
}

# Supported Google Trends GEO codes for broad worldwide coverage
GOOGLE_TRENDS_GEOS = ["US", "GB", "IN", "PK", "CA", "AU", "AE", "SA", "DE", "FR", "JP", "BR", "MX"]

NON_TREND_FEEDS = [
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

def slugify(text: str) -> str:
    """Converts a title into a URL-friendly slug."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

def parse_approx_traffic(traffic_str: str) -> int:
    """Parses traffic strings like '1M+', '200K+', '50K+' into numerical values for ranking."""
    if not traffic_str:
        return 0
    clean = traffic_str.upper().replace('+', '').replace(',', '').strip()
    try:
        if 'M' in clean:
            num = float(clean.replace('M', ''))
            return int(num * 1_000_000)
        elif 'K' in clean:
            num = float(clean.replace('K', ''))
            return int(num * 1_000)
        return int(float(clean))
    except ValueError:
        return 0

def fetch_worldwide_candidates() -> list:
    """
    Fetches Google Trends RSS feeds from all configured worldwide GEOs,
    extracts traffic metrics, ranks them descending by volume,
    and appends non-trend feeds as lower-tier candidates.
    """
    candidates = []
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Nexnews-AutoNews/1.0"}
    ns = {'ht': 'https://trends.google.com/trending/rss'}

    # 1. Fetch Google Trends RSS across worldwide GEOs
    for geo in GOOGLE_TRENDS_GEOS:
        feed_url = f"https://trends.google.com/trending/rss?geo={geo}"
        source_name = f"Google Trends ({geo})"
        try:
            req = urllib.request.Request(feed_url, headers=headers)
            with urllib.request.urlopen(req, timeout=6) as response:
                if response.status == 200:
                    xml_data = response.read().decode('utf-8', errors='ignore')
                    root = ET.fromstring(xml_data)
                    items = root.findall('.//item')

                    for item in items:
                        title_elem = item.find('title')
                        desc_elem = item.find('description')

                        raw_keyword = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
                        desc = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ""
                        desc = re.sub(r'<[^>]+>', '', desc)

                        traffic_elem = item.find('ht:approx_traffic', ns)
                        approx_traffic = traffic_elem.text.strip() if traffic_elem is not None and traffic_elem.text else ""

                        news_item = item.find('ht:news_item', ns)
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

                        trending_keyword = raw_keyword or news_headline
                        description = news_snippet or desc or news_headline or raw_keyword
                        title = news_headline or (f"Trending Search Analysis: {raw_keyword.title()}" if raw_keyword else "")

                        if title and len(title) > 3:
                            traffic_num = parse_approx_traffic(approx_traffic)
                            candidates.append({
                                "title": title,
                                "trending_keyword": trending_keyword,
                                "approx_traffic": approx_traffic or "High Search Volume",
                                "traffic_num": traffic_num,
                                "headline": news_headline or title,
                                "description": description,
                                "category": "Tech",
                                "source": news_source or source_name,
                                "url": news_url,
                                "tier": 1
                            })
        except Exception as e:
            print(f"[-] Could not fetch Google Trends RSS ({geo}): {e}")

    # Deduplicate candidates by trending_keyword / headline before sorting
    unique_candidates = []
    seen_keywords = set()

    # Sort Google Trends candidates by traffic score (highest first)
    candidates.sort(key=lambda x: x["traffic_num"], reverse=True)

    for c in candidates:
        key = slugify(c["trending_keyword"])
        if key and key not in seen_keywords:
            seen_keywords.add(key)
            unique_candidates.append(c)

    # 2. Append non-trend RSS feeds as Tier 2 fallbacks
    for feed in NON_TREND_FEEDS:
        try:
            req = urllib.request.Request(feed["url"], headers=headers)
            with urllib.request.urlopen(req, timeout=6) as response:
                if response.status == 200:
                    xml_data = response.read().decode('utf-8', errors='ignore')
                    root = ET.fromstring(xml_data)
                    items = root.findall('.//item')
                    for item in items[:3]:
                        title_elem = item.find('title')
                        desc_elem = item.find('description')
                        link_elem = item.find('link')

                        t = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
                        d = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ""
                        d = re.sub(r'<[^>]+>', '', d)
                        l = link_elem.text.strip() if link_elem is not None and link_elem.text else ""

                        if t and len(t) > 3:
                            key = slugify(t)
                            if key not in seen_keywords:
                                seen_keywords.add(key)
                                unique_candidates.append({
                                    "title": t,
                                    "trending_keyword": t,
                                    "approx_traffic": "General News Feed",
                                    "traffic_num": 0,
                                    "headline": t,
                                    "description": d or t,
                                    "category": feed["default_category"],
                                    "source": feed["source"],
                                    "url": l,
                                    "tier": 2
                                })
        except Exception as e:
            print(f"[-] Could not fetch non-trend feed {feed['source']}: {e}")

    return unique_candidates

def get_recent_published_topics(articles_dir: str) -> set:
    """Reads existing article JSON files published within the last 72 hours to build a duplicate-check set."""
    recent_slugs_and_titles = set()
    if not os.path.exists(articles_dir):
        return recent_slugs_and_titles

    cutoff = datetime.now(timezone.utc) - timedelta(hours=72)

    for filename in os.listdir(articles_dir):
        if filename.endswith(".json"):
            filepath = os.path.join(articles_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    pub_str = data.get("publishedAt", "")
                    # Parse published date if present
                    if pub_str:
                        try:
                            pub_dt = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
                            if pub_dt < cutoff:
                                continue
                        except Exception:
                            pass

                    title = data.get("title", "")
                    slug = data.get("slug", "")
                    if slug:
                        recent_slugs_and_titles.add(slug.lower())
                    if title:
                        recent_slugs_and_titles.add(slugify(title))
            except Exception:
                continue

    return recent_slugs_and_titles

def is_duplicate_candidate(candidate: dict, recent_topics: set) -> bool:
    """Checks if a candidate is a duplicate of recently published articles."""
    cand_slug = slugify(candidate["title"])
    kw_slug = slugify(candidate["trending_keyword"])

    if cand_slug in recent_topics or kw_slug in recent_topics:
        return True

    # Check substring / word overlap with recent topics
    for recent in recent_topics:
        if len(recent) > 5 and (recent in cand_slug or cand_slug in recent):
            return True
        if len(kw_slug) > 5 and (kw_slug in recent or recent in kw_slug):
            return True

    return False

def sanitize_article_content(html_str: str) -> str:
    """Sanitizes HTML content server-side by stripping scripts, style tags, and inline event handlers."""
    if not html_str:
        return ""
    # Strip script and style blocks
    clean = re.sub(r'<(script|style)[^>]*>[\s\S]*?</\1>', '', html_str, flags=re.IGNORECASE)
    # Strip inline event handlers (onerror=, onclick=, etc.)
    clean = re.sub(r'\s+on[a-z]+\s*=\s*(("[^"]*")|(\'[^\']*\')|([^\s>]+))', '', clean, flags=re.IGNORECASE)
    # Strip javascript: URLs
    clean = re.sub(r'href\s*=\s*["\']?\s*javascript:[^"\' >]*["\']?', 'href="#"', clean, flags=re.IGNORECASE)
    return clean

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

### SEARCH INTENT & SEO / GEO OPTIMIZATION MANDATES:
1. Search Keyword Targeting: The main title and opening paragraph must seamlessly integrate the high-demand keyword "{trending_kw}" to capture maximum organic search traffic.
2. User Intent Resolution: Resolve the user's search query immediately in the lead paragraph by addressing what happened, key developments, and real-world implications.
3. Structural Hierarchy: Use clear <h2> and <h3> HTML tags for clean scanning and search engine indexing.
4. Key Takeaways & Metrics: Include a bulleted <ul> list with concrete statistics, quantitative metrics, or key event timeline points.
5. High-Intent FAQ Section: Include a "Key Questions Answered" or FAQ section using <h3> headings that answer long-tail search questions users ask about "{trending_kw}".
6. Category Classification: Classify the article into exactly one of these categories: "Tech", "World", "Business", "AI", "Sports" based on the headline/content.
7. HTML Formatting Standards: Wrap paragraphs in <p class="mb-4">, main sections in <h2 class="text-2xl font-bold mt-6 mb-3">, sub-headings in <h3 class="text-xl font-semibold mt-4 mb-2">, lists in <ul class="list-disc pl-6 my-4 space-y-2">, and blockquotes in <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">.

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

        raw_text = re.sub(r'^```json\s*', '', raw_text, flags=re.MULTILINE)
        raw_text = re.sub(r'^```\s*', '', raw_text, flags=re.MULTILINE)
        raw_text = re.sub(r'\s*```$', '', raw_text, flags=re.MULTILINE)

        parsed = json.loads(raw_text.strip())
        return parsed

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

Optimize title and content to resolve user search intent for "{trending_kw}".
Classify category as one of: Tech, World, Business, AI, Sports.
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

def main():
    print("==================================================")
    print("  Nexnews Worldwide Autonomous News Generator     ")
    print("==================================================")

    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    articles_dir = os.path.join(repo_root, "data", "articles")
    os.makedirs(articles_dir, exist_ok=True)

    print("[+] Fetching worldwide candidate pool from Google Trends RSS...")
    candidates = fetch_worldwide_candidates()

    if not candidates:
        print("[-] Genuine total fetch failure: No candidates retrieved across worldwide RSS feeds. Skipping run.")
        sys.exit(0)

    print(f"[+] Total worldwide candidates fetched & ranked: {len(candidates)}")

    recent_topics = get_recent_published_topics(articles_dir)
    print(f"[+] Found {len(recent_topics)} recently published topic keys for duplicate check.")

    selected_topic = None
    generated_article_data = None

    # Fall through candidate list to find top non-duplicate item and generate article
    for idx, candidate in enumerate(candidates):
        print(f"[*] Checking candidate #{idx+1}: '{candidate['trending_keyword']}' ({candidate['approx_traffic']}) from {candidate['source']}")

        if is_duplicate_candidate(candidate, recent_topics):
            print(f"  [-] Candidate '{candidate['trending_keyword']}' is a near-duplicate of recent publication. Falling through...")
            continue

        print(f"  [+] Candidate accepted: '{candidate['trending_keyword']}'. Triggering AI generation...")

        article_data = None
        if gemini_key:
            try:
                article_data = generate_article_gemini(candidate, gemini_key)
            except Exception as e:
                print(f"  [-] Gemini generation error for candidate: {e}")

        if not article_data and openai_key:
            try:
                article_data = generate_article_openai(candidate, openai_key)
            except Exception as e:
                print(f"  [-] OpenAI generation error for candidate: {e}")

        # Defensive validation of LLM response
        if article_data and isinstance(article_data, dict):
            content = article_data.get("content", "").strip()
            title = article_data.get("title", "").strip()

            if content and title:
                selected_topic = candidate
                generated_article_data = article_data
                print(f"  [SUCCESS] Successfully generated article: '{title}'")
                break
            else:
                print("  [-] LLM returned missing/empty content or title. Treating as candidate failure and falling through...")

    if not generated_article_data or not selected_topic:
        print("[-] Skipping run: All candidate items were either duplicates or failed AI content generation.")
        sys.exit(0)

    # Validate category from LLM response (Gemini JSON response is source of truth)
    cat = generated_article_data.get("category")
    if cat not in VALID_CATEGORIES:
        cat = selected_topic.get("category")
        if cat not in VALID_CATEGORIES:
            cat = "Tech"

    slug = slugify(generated_article_data.get("slug") or generated_article_data.get("title") or selected_topic["title"])
    title = generated_article_data.get("title", selected_topic["title"])
    summary = generated_article_data.get("summary", selected_topic["description"])
    raw_content = generated_article_data.get("content", "")
    content = sanitize_article_content(raw_content)
    tags = generated_article_data.get("tags", [cat, "News", "AI-Generated"])

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

    file_path = os.path.join(articles_dir, f"{slug}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(full_article, f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Article published and saved to: {file_path}")
    print(f" - Title: {title}")
    print(f" - Slug: {slug}")
    print(f" - Category: {cat}")

    target_repo = os.environ.get("GITHUB_REPOSITORY")
    if not target_repo and os.environ.get("CI"):
        print("[-] GITHUB_REPOSITORY environment variable is not configured in CI environment.")

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
