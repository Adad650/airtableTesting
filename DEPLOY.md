# Deploying Securely: GitHub Pages + Render.com

Your Airtable token must **never** be in the frontend or in GitHub. This setup keeps the token on Render and serves the UI from GitHub Pages.

## 1. Revoke the old token

If the token that was in `index.html` was ever committed or deployed:

1. Go to [Airtable → Account → Developer → Personal access tokens](https://airtable.com/create/tokens).
2. Revoke that token and create a new one. Use the new one only in Render (below).

## 2. Deploy the backend on Render.com

1. Push this repo to GitHub (without any tokens in the code).
2. In [Render](https://render.com): **New → Web Service**.
3. Connect the repo and set:
   - **Root Directory:** (leave blank if `server.js` is at repo root)
   - **Runtime:** Node
   - **Build Command:** (leave blank)
   - **Start Command:** `node server.js`
4. In **Environment** add:
   - `AIRTABLE_TOKEN` = your Airtable Personal Access Token
   - `AIRTABLE_BASE_ID` = e.g. `appL556FTBYkztWbM`
   - `AIRTABLE_TABLE_NAME` = e.g. `tblF7mEDeuWGoqKKk`
5. Deploy. Note the URL, e.g. `https://your-app-name.onrender.com`.

## 3. Deploy the frontend on GitHub Pages

1. In your GitHub repo: **Settings → Pages**.
2. **Source:** Deploy from a branch.
3. **Branch:** e.g. `main`, folder **/ (root)**.
4. Save. Your site will be at `https://<username>.github.io/<repo-name>/` (or `https://<username>.github.io/<repo-name>` if it’s the project site).

## 4. Use the app

1. Open your GitHub Pages URL.
2. In **Backend API URL** enter your Render URL, e.g. `https://your-app-name.onrender.com`.
3. Click **Connect**. The page talks to your Render proxy; the proxy calls Airtable with the token.

## Optional: Lock the frontend to your backend

To avoid users entering a different backend URL, you can hardcode the Render URL in `index.html` (e.g. in the `apiBase` input’s placeholder or value). The token still stays only on Render.

## Local development

- **Backend:** `AIRTABLE_TOKEN=xxx AIRTABLE_BASE_ID=yyy AIRTABLE_TABLE_NAME=zzz node server.js` (runs on port 3000).
- **Frontend:** Open `index.html` (e.g. with Live Server) and set Backend API URL to `http://localhost:3000`.
