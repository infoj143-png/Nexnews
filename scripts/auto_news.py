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
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

_CACHED_GEMINI_CANDIDATES = None

STANDARD_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
]

def clean_model_name(model_name: str) -> str:
    """
    Cleans up a model name by stripping any leading 'models/' or '/' prefixes
    to prevent double prefix issues (e.g. 'models/models/gemini...').
    """
    if not model_name:
        return ""
    cleaned = model_name.strip()
    changed = True
    while changed:
        changed = False
        if cleaned.startswith("/"):
            cleaned = cleaned[1:].strip()
            changed = True
        if cleaned.startswith("models/"):
            cleaned = cleaned[len("models/"):].strip()
            changed = True
    return cleaned

def get_gemini_candidate_models(api_key: str = None) -> list:
    """
    Dynamically discovers Gemini models supporting generateContent via Google's ListModels API.
    Returns an ordered list of clean candidate model names (highest performing / highest version first),
    followed by the GEMINI_MODEL environment variable (if set) and an ordered fallback array of standard models.
    Result is cached for the duration of the run.
    """
    global _CACHED_GEMINI_CANDIDATES
    if _CACHED_GEMINI_CANDIDATES is not None:
        return _CACHED_GEMINI_CANDIDATES

    candidates = []
    seen = set()

    def add_candidate(m_name: str):
        c_name = clean_model_name(m_name)
        if c_name and c_name not in seen:
            seen.add(c_name)
            candidates.append(c_name)

    # 1. Query ListModels API if key is available
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
            req = urllib.request.Request(url, headers={"User-Agent": "Nexnews-AutoNews/1.0"})
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    models = data.get("models", [])
                    matching_models = []

                    excluded_keywords = ["preview", "exp", "experimental", "tuning", "thinking"]

                    for m in models:
                        methods = m.get("supportedGenerationMethods", [])
                        if "generateContent" not in methods:
                            continue

                        raw_name = m.get("name", "")
                        clean_name = clean_model_name(raw_name)
                        clean_name_lower = clean_name.lower()

                        if any(kw in clean_name_lower for kw in excluded_keywords):
                            continue

                        # Extract numeric version
                        match = re.search(r'gemini-(\d+(?:\.\d+)?)', clean_name, re.IGNORECASE)
                        if match:
                            try:
                                version = float(match.group(1))
                            except ValueError:
                                version = 0.0
                        else:
                            version = 0.0

                        # Preference: Flash models prioritized for speed/cost, higher version first, shorter name length
                        is_flash = 1 if "flash" in clean_name_lower else 0
                        matching_models.append((is_flash, version, -len(clean_name), clean_name))

                    if matching_models:
                        # Sort descending: flash preference, highest version, shortest clean name
                        matching_models.sort(reverse=True)
                        for item in matching_models:
                            add_candidate(item[3])
                        print(f"[+] [GEMINI MODEL SELECTION] Auto-discovered {len(matching_models)} candidate model(s) via ListModels API: {candidates}")
                    else:
                        print("[-] [GEMINI MODEL SELECTION] ListModels API call succeeded but no matching stable generateContent model was found.")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8', errors='ignore')
            print(f"[-] [GEMINI MODEL SELECTION] ListModels API HTTP error {e.code} ({e.reason}): {error_body}")
        except Exception as e:
            print(f"[-] [GEMINI MODEL SELECTION] ListModels API call failed: {e}")

    # 2. Add GEMINI_MODEL environment variable if set
    env_model = os.environ.get("GEMINI_MODEL")
    if env_model and env_model.strip():
        add_candidate(env_model.strip())

    # 3. Add ordered standard fallback models
    for fb in STANDARD_FALLBACK_MODELS:
        add_candidate(fb)

    _CACHED_GEMINI_CANDIDATES = candidates
    return candidates

def get_current_gemini_model(api_key: str = None) -> str:
    """
    Returns the top candidate model name for backwards compatibility.
    """
    candidates = get_gemini_candidate_models(api_key)
    return candidates[0] if candidates else "gemini-2.5-flash"

VALID_CATEGORIES = ["Tech", "World", "Business", "AI", "Sports"]

CATEGORY_IMAGE_POOLS = {
    "AI": [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1655720828018-edd2daec9349?auto=format&fit=crop&w=1200&q=80"
    ],
    "Tech": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80"
    ],
    "World": [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80"
    ],
    "Business": [
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80"
    ],
    "Sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80"
    ]
}

CATEGORY_IMAGES = {cat: pool[0] for cat, pool in CATEGORY_IMAGE_POOLS.items()}

def get_category_fallback_image(category: str, headline: str = "") -> str:
    pool = CATEGORY_IMAGE_POOLS.get(category, CATEGORY_IMAGE_POOLS["Tech"])
    if not headline:
        return pool[0]
    idx = abs(hash(headline)) % len(pool)
    return pool[idx]

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "up", "about", "into", "over", "after", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "should", "could", "can", "may", "might", "must", "shall", "this", "that", "these",
    "those", "trending", "search", "analysis", "news", "vs", "versus", "live", "today",
    "yesterday", "tomorrow", "2024", "2025", "2026", "2027", "2028", "day", "days",
    "month", "months", "week", "weeks", "year", "years", "time", "schedule", "update",
    "updates", "updated", "start", "starts", "started", "starting", "later", "earlier",
    "usual", "unusual", "delay", "delayed", "delays", "release", "releases", "released",
    "releasing", "launch", "launches", "launched", "launching", "announce", "announces",
    "announced", "announcing", "unveil", "unveils", "unveiled", "leak", "leaks", "leaked",
    "rumor", "rumors", "report", "reports", "reported", "says", "say", "according",
    "pre", "post", "order", "orders", "price", "cost", "buy", "sale", "sales", "stock",
    "shares", "market", "deal", "best", "worst", "high", "low", "big", "more", "most",
    "show", "shows", "watch", "match", "game", "scorecard", "win", "wins", "won", "lost",
    "loss", "beat", "beats", "box", "office", "weekend", "gross", "earns", "earned",
    "pro", "max", "mini", "plus", "ultra", "lite", "first", "second", "new", "latest",
    "top", "hn", "opentie", "openxwa", "breaking", "than", "then", "other", "another",
    "each", "every", "some", "any", "all", "both", "few", "such", "no", "nor", "not",
    "only", "own", "same", "so", "too", "very", "just"
}

SYNONYMS = {
    "iphone": ["iphone", "apple", "smartphone", "mobile", "ios"],
    "ipad": ["ipad", "apple", "tablet"],
    "macbook": ["macbook", "apple", "laptop"],
    "nvidia": ["nvidia", "chip", "gpu", "semiconductor", "technology", "ai"],
    "dune": ["dune", "movie", "film", "cinema", "theater", "poster", "actor"],
    "cricket": ["cricket", "stadium", "match", "batsman", "bowler", "wicket", "sports"],
    "india": ["india", "cricket", "indian", "stadium", "delhi", "mumbai"],
    "australia": ["australia", "cricket", "australian", "stadium", "sydney", "melbourne"]
}

def extract_search_keywords(headline: str, trending_keyword: str = "", category: str = "Tech") -> tuple:
    """
    Extracts entity-prioritized search queries and core entity terms from headline / trending topic / category.
    Returns tuple: (queries: list[str], core_entities: list[str])
    """
    combined = f"{trending_keyword} {headline}".strip()
    words = combined.split()

    proper_nouns = []
    current_pn = []

    for w in words:
        clean_w = re.sub(r'[^\w-]', '', w)
        if not clean_w:
            continue
        clean_lower = clean_w.lower()
        if (clean_w[0].isupper() or any(c.isdigit() for c in clean_w) or clean_lower == 'vs') and clean_lower not in STOP_WORDS:
            current_pn.append(clean_w)
        else:
            if current_pn:
                proper_nouns.append(' '.join(current_pn))
                current_pn = []
    if current_pn:
        proper_nouns.append(' '.join(current_pn))

    cleaned_all = re.sub(r'[^\w\s]', ' ', combined)
    meaningful = [w for w in cleaned_all.split() if w.lower() not in STOP_WORDS and len(w) > 2 and not w.isdigit()]

    core_entities = []
    queries = []

    for pn in proper_nouns:
        pn_words = [w for w in pn.split() if w.lower() not in STOP_WORDS or w.lower() in ['vs', 'iphone', 'ipad', 'macbook']]
        if pn_words:
            clean_pn = ' '.join(pn_words)
            if len(clean_pn) > 2:
                queries.append(clean_pn)
                for w in pn_words:
                    if w.lower() not in STOP_WORDS and len(w) > 2 and not w.isdigit():
                        core_entities.append(w.lower())

    for m in meaningful:
        if m.lower() not in core_entities:
            core_entities.append(m.lower())

    primary_entity = core_entities[0] if core_entities else ""
    if primary_entity:
        if primary_entity == "iphone":
            queries.insert(0, "iPhone smartphone")
        elif primary_entity in ["dune"]:
            queries.insert(0, f"{primary_entity.title()} movie")
        elif category == "Sports" or primary_entity in ["india", "australia", "test"]:
            queries.insert(0, "India vs Australia cricket" if ("india" in core_entities or "australia" in core_entities) else f"{primary_entity.title()} cricket")
        elif category in ["Tech", "AI"] and primary_entity == "nvidia":
            queries.insert(0, "Nvidia technology")

    if len(core_entities) >= 2:
        queries.append(" ".join([e.title() for e in core_entities[:2]]))
    if core_entities:
        queries.append(core_entities[0].title())

    seen = set()
    final_queries = []
    for q in queries:
        q_norm = q.lower().strip()
        if q_norm and q_norm not in seen:
            seen.add(q_norm)
            final_queries.append(q)

    unique_entities = list(dict.fromkeys(core_entities))
    return final_queries, unique_entities

def is_image_relevant(img_metadata: str, core_entities: list, category: str = "Tech") -> bool:
    """Verifies image metadata against core entity terms and category context."""
    if not img_metadata:
        return False
    meta_lower = img_metadata.lower()

    # Disambiguation for movie/entertainment titles (e.g. Dune movie vs sand dune)
    movie_context = any(m in meta_lower for m in ["movie", "film", "cinema", "theater", "poster", "actor", "hollywood", "box office", "director"])
    if "dune" in core_entities and not movie_context:
        return False

    if core_entities:
        for entity in core_entities:
            ent_lower = entity.lower()
            if len(ent_lower) >= 3 and ent_lower in meta_lower:
                return True
            syns = SYNONYMS.get(ent_lower, [])
            for syn in syns:
                if syn in meta_lower:
                    return True
        return False

    category_keywords = {
        "Tech": ["technology", "tech", "phone", "computer", "device", "electronic", "chip", "software", "gadget"],
        "AI": ["ai", "robot", "chip", "technology", "artificial", "computing", "network"],
        "Sports": ["sport", "stadium", "cricket", "ball", "match", "player", "arena"],
        "Business": ["business", "finance", "market", "office", "company", "trade"],
        "World": ["world", "global", "news", "city", "movie", "film", "cinema"]
    }

    cat_words = category_keywords.get(category, [])
    for cw in cat_words:
        if cw in meta_lower:
            return True

    return False

def fetch_unsplash_api_image(query: str, access_key: str, core_entities: list, category: str) -> str:
    """Queries Unsplash API using access_key with relevance check."""
    if not access_key or not query:
        return None
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://api.unsplash.com/search/photos?query={encoded}&per_page=3&orientation=landscape"
        print(f"[+] [IMAGE SEARCH] Querying Unsplash API with query: '{query}'")
        req = urllib.request.Request(url, headers={"Authorization": f"Client-ID {access_key}", "User-Agent": "Nexnews/1.0"})
        with urllib.request.urlopen(req, timeout=8) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                results = data.get("results", [])
                for photo in results:
                    img_url = photo.get("urls", {}).get("regular")
                    alt = photo.get("alt_description") or photo.get("description") or ""
                    metadata = f"{alt} {query}"
                    if img_url and is_image_relevant(metadata, core_entities, category):
                        print(f"[+] [IMAGE SEARCH] Unsplash result accepted for '{query}': '{alt}' -> {img_url}")
                        return img_url
                    else:
                        print(f"[-] [IMAGE SEARCH] Unsplash result rejected by relevance check for query '{query}': '{alt}'")
    except Exception as e:
        print(f"[-] [IMAGE SEARCH] Unsplash API query error for '{query}': {e}")
    return None

def fetch_pexels_api_image(query: str, api_key: str, core_entities: list, category: str) -> str:
    """Queries Pexels API using api_key with relevance check."""
    if not api_key or not query:
        return None
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://api.pexels.com/v1/search?query={encoded}&per_page=3&orientation=landscape"
        print(f"[+] [IMAGE SEARCH] Querying Pexels API with query: '{query}'")
        req = urllib.request.Request(url, headers={"Authorization": api_key, "User-Agent": "Nexnews/1.0"})
        with urllib.request.urlopen(req, timeout=8) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                photos = data.get("photos", [])
                for photo in photos:
                    src = photo.get("src", {})
                    img_url = src.get("landscape") or src.get("large2x") or src.get("large")
                    alt = photo.get("alt") or photo.get("url") or ""
                    metadata = f"{alt} {query}"
                    if img_url and is_image_relevant(metadata, core_entities, category):
                        print(f"[+] [IMAGE SEARCH] Pexels result accepted for '{query}': '{alt}' -> {img_url}")
                        return img_url
                    else:
                        print(f"[-] [IMAGE SEARCH] Pexels result rejected by relevance check for query '{query}': '{alt}'")
    except Exception as e:
        print(f"[-] [IMAGE SEARCH] Pexels API query error for '{query}': {e}")
    return None

def fetch_wikimedia_image(query: str, core_entities: list, category: str) -> str:
    """Queries Wikimedia Commons API for a topically relevant raster image with relevance check."""
    if not query:
        return None
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={encoded}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime&format=json"
        print(f"[+] [IMAGE SEARCH] Querying Wikimedia Commons API with query: '{query}'")
        req = urllib.request.Request(url, headers={"User-Agent": "NexnewsBot/1.0 (https://nexnews.vercel.app)"})
        with urllib.request.urlopen(req, timeout=8) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                pages = data.get("query", {}).get("pages", {})
                for pid, page in pages.items():
                    ii = page.get("imageinfo", [])
                    if ii:
                        img_url = ii[0].get("url", "")
                        mime = ii[0].get("mime", "")
                        title = page.get("title", "")
                        metadata = f"{title} {img_url}"
                        if mime in ["image/jpeg", "image/png", "image/webp"] and not any(x in img_url.lower() for x in [".svg", ".tif", "coin.jpg", "logo", "icon", "map"]):
                            if is_image_relevant(metadata, core_entities, category):
                                print(f"[+] [IMAGE SEARCH] Wikimedia result accepted for '{query}': '{title}' -> {img_url}")
                                return img_url
                            else:
                                print(f"[-] [IMAGE SEARCH] Wikimedia result rejected by relevance check for query '{query}': '{title}'")
    except Exception as e:
        print(f"[-] [IMAGE SEARCH] Wikimedia search error for '{query}': {e}")
    return None

def fetch_article_image(headline: str, trending_keyword: str = "", category: str = "Tech") -> tuple:
    """
    Dynamically fetches an article image based on headline/keywords.
    Checks UNSPLASH_ACCESS_KEY, PEXELS_API_KEY, Wikimedia Commons, and falls back to CATEGORY_IMAGES.
    Returns (image_url, image_caption).
    """
    unsplash_key = os.environ.get("UNSPLASH_ACCESS_KEY")
    pexels_key = os.environ.get("PEXELS_API_KEY")

    queries, core_entities = extract_search_keywords(headline, trending_keyword, category)
    print(f"[+] [IMAGE SEARCH] Headline: '{headline}' | Category: '{category}'")
    print(f"[+] [IMAGE SEARCH] Extracted search queries: {queries}")
    print(f"[+] [IMAGE SEARCH] Core entity terms: {core_entities}")

    for query in queries:
        # 1. Try Unsplash API if key exists
        if unsplash_key:
            img_url = fetch_unsplash_api_image(query, unsplash_key, core_entities, category)
            if img_url:
                print(f"[+] [IMAGE SEARCH] Found keyword image via Unsplash API for '{query}': {img_url}")
                return img_url, f"Visual representation for '{headline}' ({query})"

        # 2. Try Pexels API if key exists
        if pexels_key:
            img_url = fetch_pexels_api_image(query, pexels_key, core_entities, category)
            if img_url:
                print(f"[+] [IMAGE SEARCH] Found keyword image via Pexels API for '{query}': {img_url}")
                return img_url, f"Visual representation for '{headline}' ({query})"

        # 3. Try Wikimedia Commons search
        img_url = fetch_wikimedia_image(query, core_entities, category)
        if img_url:
            print(f"[+] [IMAGE SEARCH] Found keyword image via Wikimedia for '{query}': {img_url}")
            return img_url, f"Media coverage visual for '{headline}'"

    # 4. Fallback path to category pool
    default_url = get_category_fallback_image(category, headline)
    first_q = queries[0] if queries else (trending_keyword or headline)
    print(f"[-] [IMAGE SEARCH] Keyword search failed/returned no relevant results for '{first_q}'. Falling back to '{category}' category fallback pool: {default_url}")

    return default_url, f"Category visual for '{headline}' ({category})"

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

import bleach

ALLOWED_TAGS = [
    'p', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote',
    'strong', 'em', 'b', 'i', 'a', 'span', 'br'
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'target', 'rel', 'class'],
    'p': ['class'],
    'h2': ['class'],
    'h3': ['class'],
    'ul': ['class'],
    'ol': ['class'],
    'li': ['class'],
    'blockquote': ['class'],
    'strong': ['class'],
    'em': ['class'],
    'b': ['class'],
    'i': ['class'],
    'span': ['class'],
    'br': ['class']
}

def sanitize_article_content(html_str: str) -> str:
    """Sanitizes HTML content server-side using bleach library with allowlist policy."""
    if not html_str:
        return ""
    clean = bleach.clean(
        html_str,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )
    return clean

def sanitize_prompt_input(input_str: str, max_len: int = 300) -> str:
    """Strips control characters and instruction override phrases from external inputs before prompt insertion."""
    if not input_str:
        return ""
    clean = re.sub(r'[\r\n\t]+', ' ', input_str)
    clean = re.sub(r'["`\\]', '', clean)
    clean = re.sub(r'ignore previous instructions', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'system prompt', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'you are an ai', '', clean, flags=re.IGNORECASE)
    clean = clean.strip()
    return clean[:max_len]

def validate_article_output(data: dict) -> bool:
    """Defensive schema and heuristic validation on LLM JSON output."""
    if not data or not isinstance(data, dict):
        return False

    title = data.get("title", "")
    summary = data.get("summary", "")
    content = data.get("content", "")
    category = data.get("category", "")

    if not isinstance(title, str) or len(title.strip()) < 5:
        return False
    if not isinstance(summary, str) or len(summary.strip()) < 5:
        return False
    if not isinstance(content, str) or len(content.strip()) < 20:
        return False
    if category and category not in VALID_CATEGORIES:
        return False

    content_lower = content.lower()
    suspicious_patterns = [
        "as an ai",
        "i cannot fulfill",
        "system prompt",
        "ignore all previous",
        "jailbreak",
        "<script"
    ]
    for pattern in suspicious_patterns:
        if pattern in content_lower:
            print(f"[-] [DEFENSIVE CHECK] Article output rejected due to suspicious pattern: '{pattern}'")
            return False

    return True

def generate_article_gemini(topic: dict, api_key: str, candidate_models: list = None) -> dict:
    """
    Generates an SEO/GEO optimized article centered around high-demand search intent using Google Gemini API.
    Iterates through candidate models until generation succeeds or all candidates are exhausted.
    """
    if candidate_models is None:
        candidate_models = get_gemini_candidate_models(api_key)
    elif isinstance(candidate_models, str):
        candidate_models = [candidate_models]

    trending_kw = sanitize_prompt_input(topic.get("trending_keyword") or topic.get("title"))
    traffic = sanitize_prompt_input(topic.get("approx_traffic") or "High Search Demand")
    headline = sanitize_prompt_input(topic.get("headline") or topic.get("title"))
    source = sanitize_prompt_input(topic.get("source") or "Nexnews Trend Radar")
    desc = sanitize_prompt_input(topic.get("description") or "")

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

    for model_item in candidate_models:
        clean_name = clean_model_name(model_item)
        if not clean_name:
            continue

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_name}:generateContent?key={api_key}"

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]

                raw_text = re.sub(r'^```json\s*', '', raw_text, flags=re.MULTILINE)
                raw_text = re.sub(r'^```\s*', '', raw_text, flags=re.MULTILINE)
                raw_text = re.sub(r'\s*```$', '', raw_text, flags=re.MULTILINE)

                parsed = json.loads(raw_text.strip())
                if validate_article_output(parsed):
                    print(f"  [+] Gemini article generated successfully using model: '{clean_name}'")
                    parsed["_used_model"] = clean_name
                    return parsed
                else:
                    print(f"  [-] Model '{clean_name}' returned response that failed defensive validation.")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8', errors='ignore')
            print(f"  [-] Gemini HTTP error {e.code} ({e.reason}) with model '{clean_name}': {error_body}")
        except Exception as e:
            print(f"  [-] Gemini API call error with model '{clean_name}': {e}")

    print("  [-] All Gemini candidate models failed for this topic.")
    return None

def generate_article_openai(topic: dict, api_key: str) -> dict:
    """Generates an SEO/GEO optimized article using OpenAI API."""
    url = "https://api.openai.com/v1/chat/completions"

    trending_kw = sanitize_prompt_input(topic.get("trending_keyword") or topic.get("title"))
    headline = sanitize_prompt_input(topic.get('headline') or topic.get('title'))
    source = sanitize_prompt_input(topic.get('source', 'Nexnews Trend Radar'))
    desc = sanitize_prompt_input(topic.get('description', ''))

    prompt = f"""
You are a senior SEO journalist for Nexnews. Create an in-depth news article targeting the trending search query:
TRENDING KEYWORD: "{trending_kw}"
HEADLINE: "{headline}"
SOURCE: "{source}"
DESCRIPTION: "{desc}"

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

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            raw_text = res_data["choices"][0]["message"]["content"]
            parsed = json.loads(raw_text.strip())
            return parsed if validate_article_output(parsed) else None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        print(f"  [-] OpenAI HTTP error {e.code} ({e.reason}): {error_body}")
        return None
    except Exception as e:
        print(f"  [-] OpenAI API call error: {e}")
        return None

def main():
    print("==================================================")
    print("  Nexnews Worldwide Autonomous News Generator     ")
    print("==================================================")

    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    gemini_candidate_models = None
    if gemini_key:
        gemini_candidate_models = get_gemini_candidate_models(gemini_key)

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    articles_dir = os.path.join(repo_root, "data", "articles")
    os.makedirs(articles_dir, exist_ok=True)

    print("[+] Fetching worldwide candidate pool from Google Trends RSS...")
    candidates = fetch_worldwide_candidates()

    if not candidates:
        print("[-] Genuine total fetch failure: No candidates retrieved across worldwide RSS feeds. Skipping run.")
        sys.exit(1)

    print(f"[+] Total worldwide candidates fetched & ranked: {len(candidates)}")

    recent_topics = get_recent_published_topics(articles_dir)
    print(f"[+] Found {len(recent_topics)} recently published topic keys for duplicate check.")

    selected_topic = None
    generated_article_data = None

    # Fall through candidate list to find top non-duplicate item and generate article
    for idx, candidate in enumerate(candidates):
        print(f"[*] Checking candidate #{idx+1}: '{candidate['trending_keyword']}' ({candidate['approx_traffic']}) from {candidate['source']}")

        try:
            if is_duplicate_candidate(candidate, recent_topics):
                print(f"  [-] Candidate '{candidate['trending_keyword']}' is a near-duplicate of recent publication. Falling through...")
                continue

            print(f"  [+] Candidate accepted: '{candidate['trending_keyword']}'. Triggering AI generation...")

            article_data = None
            if gemini_key:
                try:
                    article_data = generate_article_gemini(candidate, gemini_key, gemini_candidate_models)
                except Exception as e:
                    print(f"  [-] Gemini generation error for candidate: {e}")

            if not article_data and openai_key:
                try:
                    article_data = generate_article_openai(candidate, openai_key)
                    if article_data:
                        article_data["_used_model"] = "gpt-4o-mini"
                except Exception as e:
                    print(f"  [-] OpenAI generation error for candidate: {e}")

            # Defensive validation of LLM response
            if article_data and isinstance(article_data, dict):
                content = article_data.get("content", "").strip()
                title = article_data.get("title", "").strip()

                if content and title:
                    selected_topic = candidate
                    generated_article_data = article_data
                    used_model = article_data.get("_used_model", "unknown")
                    print(f"  [SUCCESS] Successfully generated article: '{title}' using model: '{used_model}'")
                    break
                else:
                    print("  [-] LLM returned missing/empty content or title. Treating as candidate failure and falling through...")
        except Exception as e:
            print(f"  [-] Unexpected error processing candidate '{candidate.get('trending_keyword', 'unknown')}': {e}. Falling through to next candidate...")
            continue

    if not generated_article_data or not selected_topic:
        print("[-] Skipping run: All candidate items were either duplicates or failed AI content generation.")
        sys.exit(1)

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

    source_name = selected_topic.get("source")
    source_url = selected_topic.get("url")
    if source_name or source_url:
        attribution_html = ""
        if source_url and source_name:
            attribution_html = f'<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="{source_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">{source_name}</a>.</p>'
        elif source_name:
            attribution_html = f'<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via {source_name}.</p>'
        elif source_url:
            attribution_html = f'<p class="mt-6 text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 font-serif">Coverage compiled via <a href="{source_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">Original Source</a>.</p>'

        if attribution_html:
            content += "\n" + attribution_html

    tags = generated_article_data.get("tags", [cat, "News", "AI-Generated"])

    published_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    article_id = str(int(time.time() * 1000))

    image_url, image_caption = fetch_article_image(
        headline=title,
        trending_keyword=selected_topic.get("trending_keyword", ""),
        category=cat
    )

    full_article = {
        "id": article_id,
        "title": title,
        "slug": slug,
        "summary": summary,
        "content": content,
        "category": cat,
        "author": {
            "name": "Nexnews Desk",
            "avatar": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
            "role": "Editorial Desk"
        },
        "publishedAt": published_at,
        "readTime": "4 min read",
        "imageUrl": image_url,
        "imageCaption": image_caption,
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

    # Backup newly published article JSON to Google Drive
    backup_to_google_drive(file_path)

    # Automatically submit newly published article to Google Indexing API
    site_url = os.environ.get("SITE_URL", "https://nexnews-nu.vercel.app").rstrip("/")
    article_url = f"{site_url}/news/{slug}"
    submit_to_google_indexing(article_url)

def backup_to_google_drive(file_path: str) -> bool:
    """
    Uploads a copy of the specified article JSON file to Google Drive folder specified by GDRIVE_FOLDER_ID.
    Uses GDRIVE_SERVICE_ACCOUNT_KEY (JSON string or path to JSON file) for authentication.
    Logs errors gracefully without throwing exceptions.
    """
    gdrive_sa_key = os.environ.get("GDRIVE_SERVICE_ACCOUNT_KEY")
    if gdrive_sa_key:
        gdrive_sa_key = gdrive_sa_key.strip()

    gdrive_folder_id = os.environ.get("GDRIVE_FOLDER_ID")
    if gdrive_folder_id:
        gdrive_folder_id = gdrive_folder_id.strip()

    if not gdrive_sa_key or not gdrive_folder_id:
        print("[-] GDRIVE_SERVICE_ACCOUNT_KEY or GDRIVE_FOLDER_ID is missing or empty. Skipping Google Drive backup.")
        return False

    if not os.path.exists(file_path):
        print(f"[-] Article file does not exist at path: {file_path}. Skipping Google Drive backup.")
        return False

    scopes = ["https://www.googleapis.com/auth/drive.file"]

    try:
        if os.path.isfile(gdrive_sa_key):
            credentials = service_account.Credentials.from_service_account_file(
                gdrive_sa_key, scopes=scopes
            )
        else:
            sa_info = json.loads(gdrive_sa_key)
            credentials = service_account.Credentials.from_service_account_info(
                sa_info, scopes=scopes
            )

        drive_service = build("drive", "v3", credentials=credentials)
        filename = os.path.basename(file_path)

        file_metadata = {
            "name": filename,
            "parents": [gdrive_folder_id]
        }
        media = MediaFileUpload(file_path, mimetype="application/json")

        uploaded_file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id",
            supportsAllDrives=True
        ).execute()

        file_id = uploaded_file.get("id")
        print(f"[SUCCESS] Uploaded backup copy of '{filename}' to Google Drive (ID: {file_id}).")
        return True
    except Exception as e:
        print(f"[-] Error uploading '{file_path}' to Google Drive: {e}")
        return False

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
