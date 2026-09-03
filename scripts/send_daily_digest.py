#!/usr/bin/env python3
"""
Nexnews Daily AI Digest Email Dispatcher
----------------------------------------
Scans data/articles/ for articles published in the last 24 hours,
composes a daily AI digest email featuring top headlines,
and broadcasts the email to the 'Nexnews Subscribers' Resend Audience.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

AUDIENCE_NAME = "Nexnews Subscribers"
DEFAULT_FROM_EMAIL = "Nexnews Daily Digest <onboarding@resend.dev>"
DEFAULT_SITE_URL = "https://nexnews-nu.vercel.app"

def get_recent_articles(articles_dir: str, hours: int = 24) -> list:
    """
    Reads article JSON files from articles_dir published within the last `hours` hours.
    Returns articles sorted by publishedAt descending.
    """
    if not os.path.exists(articles_dir):
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    recent = []

    for filename in os.listdir(articles_dir):
        if not filename.endswith(".json"):
            continue

        filepath = os.path.join(articles_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                article = json.load(f)
                pub_str = article.get("publishedAt", "")
                if pub_str:
                    try:
                        pub_dt = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
                        if pub_dt >= cutoff:
                            recent.append((pub_dt, article))
                    except Exception:
                        pass
        except Exception as e:
            print(f"[-] Error reading article file '{filename}': {e}")

    # Sort descending by publishedAt
    recent.sort(key=lambda item: item[0], reverse=True)
    return [item[1] for item in recent]

def generate_digest_html(articles: list, site_url: str) -> str:
    """Composes a responsive HTML newsletter template for the top 5-10 articles."""
    site_url = site_url.rstrip("/")
    date_str = datetime.now(timezone.utc).strftime("%A, %B %d, %Y")

    items_html = ""
    for idx, article in enumerate(articles[:10]):
        title = article.get("title", "Breaking News")
        slug = article.get("slug", "")
        summary = article.get("summary", "")
        category = article.get("category", "Tech")
        read_time = article.get("readTime", "3 min read")
        article_url = f"{site_url}/news/{slug}" if slug else site_url

        border_class = "border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px;" if idx < len(articles[:10]) - 1 else ""

        items_html += f"""
        <div style="{border_class}">
          <div style="margin-bottom: 8px;">
            <span style="background-color: #2563eb; color: #ffffff; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              {category}
            </span>
            <span style="color: #64748b; font-size: 12px; margin-left: 8px;">• {read_time}</span>
          </div>
          <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; line-height: 1.4;">
            <a href="{article_url}" style="color: #0f172a; text-decoration: none;">{title}</a>
          </h2>
          <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px; line-height: 1.6;">
            {summary}
          </p>
          <div>
            <a href="{article_url}" style="color: #2563eb; font-size: 13px; font-weight: bold; text-decoration: none;">
              Read Full Story &rarr;
            </a>
          </div>
        </div>
        """

    unsubscribe_tag = "{{{ resend.unsubscribe }}}"

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nexnews Daily AI Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr>
      <td style="background-color: #0f172a; padding: 30px; text-align: center;">
        <div style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 900; font-size: 20px; width: 36px; height: 36px; line-height: 36px; border-radius: 8px; margin-bottom: 10px;">N</div>
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 6px 0; font-family: Georgia, serif;">Nexnews Daily AI Digest</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">{date_str} | AI-Curated Top Stories</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 30px;">
        <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.5;">
          Good morning! Here is your daily briefing of top breaking coverage synthesized across technology, world affairs, business, AI, and sports.
        </p>
        {items_html}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f1f5f9; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        <p style="margin: 0 0 8px 0;">You are receiving this email because you subscribed to Nexnews Daily AI Digest.</p>
        <p style="margin: 0;">
          <a href="{unsubscribe_tag}" style="color: #2563eb; text-decoration: underline;">Unsubscribe</a> |
          <a href="{site_url}" style="color: #2563eb; text-decoration: underline;">Visit Nexnews Platform</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    return html

def get_or_create_audience(api_key: str) -> str:
    """Fetches or creates the 'Nexnews Subscribers' audience ID via Resend API."""
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
        "User-Agent": "Nexnews-DailyDigest/1.0"
    }

    # 1. Fetch existing audiences
    req = urllib.request.Request("https://api.resend.com/audiences", headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            audiences = data.get("data", [])
            for aud in audiences:
                if aud.get("name") == AUDIENCE_NAME:
                    return aud.get("id")
    except Exception as e:
        print(f"[-] Could not list Resend audiences: {e}")

    # 2. Create audience if not found
    create_payload = json.dumps({"name": AUDIENCE_NAME}).encode('utf-8')
    req = urllib.request.Request("https://api.resend.com/audiences", data=create_payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            aud_id = data.get("id")
            if aud_id:
                print(f"[+] Created new Resend Audience '{AUDIENCE_NAME}' (ID: {aud_id})")
                return aud_id
    except Exception as e:
        print(f"[-] Error creating Resend Audience: {e}")

    raise RuntimeError("Failed to resolve Resend Audience ID.")

def send_digest_broadcast(api_key: str, audience_id: str, html_content: str, article_count: int, from_email: str = DEFAULT_FROM_EMAIL) -> bool:
    """Creates and triggers a Resend Broadcast campaign to the specified Audience."""
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
        "User-Agent": "Nexnews-DailyDigest/1.0"
    }
    date_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
    subject = f"Nexnews Daily AI Digest — {date_str} ({article_count} Top Stories)"

    broadcast_payload = json.dumps({
        "audience_id": audience_id,
        "from": from_email,
        "subject": subject,
        "html": html_content
    }).encode('utf-8')

    req = urllib.request.Request("https://api.resend.com/broadcasts", data=broadcast_payload, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            broadcast_id = data.get("id")
            print(f"[+] Created Resend Broadcast draft (ID: {broadcast_id})")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        print(f"[-] HTTP error {e.code} creating Resend Broadcast: {error_body}")
        return False
    except Exception as e:
        print(f"[-] Error creating Resend Broadcast: {e}")
        return False

    # Trigger sending of the broadcast
    send_url = f"https://api.resend.com/broadcasts/{broadcast_id}/send"
    send_req = urllib.request.Request(send_url, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(send_req, timeout=15) as resp:
            send_data = json.loads(resp.read().decode('utf-8'))
            print(f"[SUCCESS] Broadcast dispatch triggered! Response: {send_data}")
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        print(f"[-] HTTP error {e.code} sending Resend Broadcast: {error_body}")
        return False
    except Exception as e:
        print(f"[-] Error sending Resend Broadcast: {e}")
        return False

def main():
    print("==================================================")
    print("  Nexnews Daily AI Digest Dispatcher              ")
    print("==================================================")

    resend_key = os.environ.get("RESEND_API_KEY", "").strip()
    if not resend_key:
        print("[-] RESEND_API_KEY environment variable is missing. Aborting digest run.")
        sys.exit(1)

    site_url = os.environ.get("SITE_URL", DEFAULT_SITE_URL)
    from_email = os.environ.get("RESEND_FROM_EMAIL", DEFAULT_FROM_EMAIL)

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    articles_dir = os.path.join(repo_root, "data", "articles")

    print("[+] Scanning published articles from the last 24 hours...")
    recent_articles = get_recent_articles(articles_dir, hours=24)

    if not recent_articles:
        print("[+] Zero articles published in the last 24 hours. Skipping daily digest execution.")
        sys.exit(0)

    print(f"[+] Found {len(recent_articles)} article(s) published in the last 24 hours.")

    try:
        audience_id = get_or_create_audience(resend_key)
        print(f"[+] Target Resend Audience ID: {audience_id}")
    except Exception as e:
        print(f"[-] Failed to get or create Resend Audience: {e}")
        sys.exit(1)

    html_content = generate_digest_html(recent_articles, site_url)

    print("[+] Triggering Resend Broadcast delivery...")
    success = send_digest_broadcast(resend_key, audience_id, html_content, len(recent_articles), from_email)

    if success:
        print("[SUCCESS] Daily AI Digest sent successfully!")
        sys.exit(0)
    else:
        print("[-] Daily AI Digest sending failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
