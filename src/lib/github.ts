import { Article, isValidSlug } from './data';

export async function saveArticleToGitHub(article: Article): Promise<boolean> {
  if (!isValidSlug(article.slug)) {
    console.error(`[GitHub API] Invalid slug for article save: '${article.slug}'`);
    return false;
  }
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.warn('[GitHub API] GITHUB_TOKEN is not configured. Skipping GitHub repository commit.');
    return false;
  }

  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    console.warn('[GitHub API] GITHUB_REPOSITORY is not configured. Skipping GitHub repository commit.');
    return false;
  }

  const path = `data/articles/${article.slug}.json`;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const jsonContent = JSON.stringify(article, null, 2);
  const base64Content = Buffer.from(jsonContent, 'utf8').toString('base64');

  try {
    let sha: string | undefined = undefined;

    // Check if file already exists to get its SHA for update
    const getRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Nexnews-App'
      }
    });

    if (getRes.ok) {
      const getData = await getRes.json();
      sha = getData.sha;
    }

    const body: Record<string, unknown> = {
      message: `feat(article): save article ${article.slug} via API`,
      content: base64Content
    };

    if (sha) {
      body.sha = sha;
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Nexnews-App'
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.error(`[GitHub API] Failed to commit article '${article.slug}': HTTP ${putRes.status} - ${errText}`);
      return false;
    }

    console.log(`[GitHub API] Successfully committed article '${article.slug}' to repo '${repo}'.`);

    // Trigger Vercel Deploy Hook if configured
    const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (deployHookUrl) {
      try {
        console.log('[GitHub API] Triggering Vercel Deploy Hook for redeployment...');
        await fetch(deployHookUrl, { method: 'POST' });
      } catch (hookErr) {
        console.error('[GitHub API] Error triggering Vercel Deploy Hook:', hookErr);
      }
    }

    return true;
  } catch (err) {
    console.error(`[GitHub API] Exception while saving article '${article.slug}' to GitHub:`, err);
    return false;
  }
}

export async function deleteArticleFromGitHub(slug: string): Promise<boolean> {
  if (!isValidSlug(slug)) {
    console.error(`[GitHub API] Invalid slug for article delete: '${slug}'`);
    return false;
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.warn('[GitHub API] GITHUB_TOKEN is not configured. Skipping GitHub repository delete.');
    return false;
  }

  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    console.warn('[GitHub API] GITHUB_REPOSITORY is not configured. Skipping GitHub repository delete.');
    return false;
  }

  const path = `data/articles/${slug}.json`;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  try {
    const getRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Nexnews-App'
      }
    });

    if (!getRes.ok) {
      console.warn(`[GitHub API] File 'data/articles/${slug}.json' not found on GitHub repository (HTTP ${getRes.status}).`);
      return false;
    }

    const getData = await getRes.json();
    const sha = getData.sha;

    const delRes = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Nexnews-App'
      },
      body: JSON.stringify({
        message: `fix(article): delete article ${slug} via API`,
        sha
      })
    });

    if (!delRes.ok) {
      const errText = await delRes.text();
      console.error(`[GitHub API] Failed to delete article '${slug}': HTTP ${delRes.status} - ${errText}`);
      return false;
    }

    console.log(`[GitHub API] Successfully deleted article '${slug}' from repo '${repo}'.`);

    const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (deployHookUrl) {
      try {
        console.log('[GitHub API] Triggering Vercel Deploy Hook for redeployment...');
        await fetch(deployHookUrl, { method: 'POST' });
      } catch (hookErr) {
        console.error('[GitHub API] Error triggering Vercel Deploy Hook:', hookErr);
      }
    }

    return true;
  } catch (err) {
    console.error(`[GitHub API] Exception while deleting article '${slug}' from GitHub:`, err);
    return false;
  }
}
