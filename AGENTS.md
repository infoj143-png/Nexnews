# Nexnews Agent Guide & Architecture Notes

## Platform Overview
Nexnews is an autonomous Next.js 16 (App Router) news publishing platform deployed on Vercel. Its goal is to capture high-volume trending search traffic by automatically generating SEO and GEO-optimized articles centered around real-time search queries.

## Architecture & Autonomous News Pipeline
* **Active Pipeline:** `scripts/auto_news.py`, executed on a scheduled cron trigger (every 4 hours) via GitHub Actions (`.github/workflows/auto-news.yml`).
* **Trend Capture & Ranking:** The Python script fetches real-time Google Trends RSS feeds across 13 major global GEOs (US, GB, IN, PK, CA, AU, AE, SA, DE, FR, JP, BR, MX), ranks candidates by search traffic volume (`ht:approx_traffic`), and deduplicates against existing articles from the past 72 hours.
* **LLM Synthesis & Categorization:** Articles are synthesized via Gemini 2.5 Flash / OpenAI APIs. Category classification is determined directly by the AI response (`Tech`, `World`, `Business`, `AI`, `Sports`).
* **Deprecated Pipeline:** The TypeScript Vercel Cron route `/api/cron/auto-news` was retired to avoid duplicate publishing.

## Design Decisions & Persistence Behavior
1. **No Manual Review Gate:** Articles are published live immediately upon generation to capture real-time search velocity while trends are hot. Do not introduce an approval gate or moderation queue.
2. **File-Based & GitHub API Persistence:**
   - **Python Cron Pipeline (`scripts/auto_news.py`):** Durably persists articles by creating `data/articles/<slug>.json` and committing the JSON files directly to the Git repository via GitHub Actions workflow.
   - **Next.js Admin UI & API Routes (`addArticle` & `deleteArticle` in `src/lib/data.ts` / `/api/generate-news` / `/api/articles`):** Commits or removes `data/articles/<slug>.json` directly in the Git repository using the GitHub REST API (`PUT` / `DELETE /repos/{owner}/{repo}/contents/{path}`). In addition, if `VERCEL_DEPLOY_HOOK_URL` is configured, it triggers an automatic Vercel redeploy. Local disk write/unlink operations are also attempted for in-memory and local development environments.

## Environment Variables Required
* `ADMIN_SESSION_SECRET` - Server-only secret key for signing admin JWT cookies.
* `ADMIN_PASSWORD_HASH` / `ADMIN_PASSWORD` - Server environment variable for admin login authentication.
* `GEMINI_API_KEY` - Key for Google Gemini 2.5 Flash article generation.
* `OPENAI_API_KEY` - Fallback key for OpenAI GPT generation.
* `GITHUB_REPOSITORY` - Target repository (`owner/repo`) for GitHub Actions commits.
