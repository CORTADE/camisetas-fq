# Runbook — Upgrade Sveltia login from Access Token to GitHub OAuth (Cloudflare Worker)

**Created:** 2026-05-23
**Status:** Optional future upgrade. Current site uses Access Token method (zero-infra).

## Why upgrade

The current login flow asks the editor to paste a GitHub Personal Access Token (PAT) the first time they enter `/admin`. After the first time it's remembered in their browser, so it's a one-off friction. If you want the editor to log in with a single GitHub click forever — no PATs to manage — deploy your own Sveltia auth Worker.

**Estimated time:** 15-20 minutes the first time.
**Cost:** Free (Cloudflare Workers free tier: 100k requests/day; this CMS will use ~5/month).

## Prerequisites

- A free Cloudflare account: https://dash.cloudflare.com/sign-up
- Admin access to the GitHub repo `CORTADE/camisetas-fq`
- Admin access to the Netlify site `camisetas-fq.netlify.app`

## Steps

### 1. Deploy the Sveltia auth Worker to Cloudflare

1. Sign up / log in to https://dash.cloudflare.com
2. Open https://github.com/sveltia/sveltia-cms-auth in another tab
3. Click the "Deploy to Cloudflare Workers" button in the README → follow the prompts (it forks the repo + sets up the deploy automatically)
4. Once deployed, Cloudflare gives you a Worker URL like `https://sveltia-cms-auth.<your-subdomain>.workers.dev` — **copy this URL**, you need it in steps 2 and 4

### 2. Register a GitHub OAuth App

1. Go to https://github.com/settings/applications/new
2. Fill in:
   - **Application name:** `Camisetas FQ Admin`
   - **Homepage URL:** `https://camisetas-fq.netlify.app`
   - **Application description:** (leave blank)
   - **Authorization callback URL:** `<YOUR_WORKER_URL>/callback` (the URL from step 1 + `/callback`)
3. Click **Register application**
4. On the next page, click **Generate a new client secret**
5. Copy both **Client ID** (looks like `Iv1.xxxxxxxxxxxx`) and **Client Secret** (long hex string) — save them in your password manager

### 3. Configure the Worker with your Client ID / Secret

1. Back in Cloudflare dashboard → Workers & Pages → click `sveltia-cms-auth`
2. Settings → Variables → "Add variable":
   - `GITHUB_CLIENT_ID` = (the Client ID from step 2)
   - `GITHUB_CLIENT_SECRET` = (the Client Secret from step 2) → click **Encrypt**
   - `ALLOWED_DOMAINS` = `camisetas-fq.netlify.app`
3. Save and Deploy

### 4. Update Sveltia config to use the Worker

Edit `public/admin/config.yml` and replace the `backend:` block with:

```yaml
backend:
  name: github
  repo: CORTADE/camisetas-fq
  branch: main
  base_url: <YOUR_WORKER_URL>
  auth_endpoint: oauth
```

Where `<YOUR_WORKER_URL>` is the URL from step 1 (e.g. `https://sveltia-cms-auth.cortade.workers.dev`).

Commit + push:
```bash
git add public/admin/config.yml
git commit -m "feat(cms): switch to GitHub OAuth via own Cloudflare Worker"
git push
```

Netlify will rebuild in ~90 seconds.

### 5. Test

1. Open https://camisetas-fq.netlify.app/admin
2. Pulse **"Sign In with GitHub"** (previously dormant)
3. Authorize the app → should drop you into the CMS panel
4. The PAT-based login still works as fallback, no need to delete tokens

## Rollback

If something breaks, revert the `config.yml` change:
```bash
git revert HEAD
git push
```

Site goes back to PAT-based login in ~90s.

## When NOT to upgrade

- If the PAT flow is fine for the current editor
- If you don't want to manage a Cloudflare account
- If you're planning to migrate to a different CMS / hosting setup in the next few months

## Notes

- GitHub announced client-side PKCE support for OAuth (planned Q4 2025). Once shipped and adopted by Sveltia, this Worker becomes unnecessary — Sveltia will be able to authenticate directly with GitHub. Track https://github.com/github/roadmap/issues/1153
- The Worker is forever-free for our usage volumes
