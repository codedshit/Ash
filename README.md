# Ash — unified site + dashboard

One project, one deployment, one free subdomain. Your public site lives
at the root URL; your password-protected editor lives at `/admin`. No
more juggling two repos or two Vercel projects.

- `public/index.html` — the live site (everything visitors see)
- `public/admin/index.html` — your login + editor (theme, bg video,
  identity/avatar/frame, songs, badges, Discord status, effects)
- `api/` — serverless functions (login, logout, authenticated read/write
  config, and a public read-only config endpoint the site itself uses)
- `config.json` — the data file everything reads from/writes to

## 1. Push this to one GitHub repo

Create a single repo (e.g. `ash-site`) and push everything in this
folder to it — `public/`, `api/`, `lib/`, `config.json`, `package.json`.

## 2. Get a GitHub token

1. GitHub → profile photo → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Repository access → **Only select repositories** → pick this repo.
3. Permissions → **Contents** → **Read and write**.
4. Generate, copy the token.

(This lets the dashboard commit changes to `config.json` in this same
repo. Nothing else has access to it.)

## 3. Deploy to Vercel

1. https://vercel.com → sign up/log in with GitHub (free).
2. **Add New → Project** → import this repo.
3. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `DASHBOARD_PASSWORD` | a password only you know |
   | `SESSION_SECRET` | any long random string (40+ characters) |
   | `GITHUB_TOKEN` | the token from step 2 |
   | `GITHUB_OWNER` | your GitHub username |
   | `GITHUB_REPO` | this repo's name |
   | `GITHUB_BRANCH` | `main` |

4. **Deploy.** Vercel gives you a free subdomain like
   `ash-site.vercel.app` — that's your whole site, live.
   - Site: `ash-site.vercel.app`
   - Editor: `ash-site.vercel.app/admin`

   You can rename the project in Vercel's settings to change the
   subdomain, or attach your own custom domain for free later (DNS-only
   cost, Vercel doesn't charge for it).

## 4. Use it

Go to `/admin`, enter your `DASHBOARD_PASSWORD`, edit whatever you want,
hit Save. The live site picks it up on next page load — no rebuild
step, no waiting on GitHub Pages.

## How this differs from the old two-repo setup

Before: GitHub Pages served the static site, and it read `config.json`
as a static file that only updated after a full Pages rebuild. Now: the
site calls `/api/public-config` on load, which reads `config.json` live
from GitHub via the API — so saves reflect on refresh immediately,
same server, same domain, one login.

## Security notes

- Password is checked server-side, never shipped to the browser.
- Login sets an `HttpOnly` cookie (unreadable by injected JS), valid 12
  hours.
- The GitHub token lives only in Vercel's environment variables.
- The repo can be public — it holds no secrets, just code and cosmetic
  config (colors, name, songs, badges).

## What's new

- **Fixed:** avatar/pfp size now applies identically on mobile and
  desktop (a leftover mobile CSS rule was silently forcing 96px
  regardless of the admin setting).
- **Fixed:** background video uploads now show a live progress bar and
  a specific error message instead of failing silently — most
  failures are the Cloudinary preset not being set to *Unsigned*, or a
  file over the free unsigned-upload size cap (~100MB).
- **Badges** are now icon-only circles; hover (desktop) or tap
  (mobile) to see the label as a tooltip. Glow color is still
  per-badge, set in the Badges tab.
- **Card transparency:** Appearance tab → two new sliders control how
  see-through cards are (0–1) and how visible their edges/borders are
  (0 removes them entirely).
- **Fonts:** upload a `.ttf`/`.otf`/`.woff`/`.woff2` file in the Fonts
  tab and it's committed straight to `public/fonts/` in your repo,
  then appears as an option for the heading font, tagline font, and a
  dedicated "Click to enter" screen font. Takes ~30–60s to go live
  after uploading (same as any other change, since it's a small
  deploy).
- **Discord widgets:** beyond the inline status line, you can enable a
  richer profile card (avatar + live status) and a server widget
  (member count + avatars + invite link). The server widget needs
  **Server Widget** turned on in that server's Settings → Widget.
- **Custom tabs & widgets:** add whole new tabs next to Intel/Vibe/
  Music, each with its own set of free-form cards (title + icon +
  body text) — for hobbies, more about-you sections, anything.
- **Admin UI:** rebuilt as a sidebar dashboard (Design / Content /
  Layout / Integrations) instead of a single column of wrapping tab
  buttons.
