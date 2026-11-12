# Exact-match domain playbook

How this repo was built and shipped for TerminalUp, written so the same play can be run for another company (AGS, Collectors Club, WagerUp) in a fresh Claude chat. Everything below was done once already; the gotchas are real.

## What it is

One Node server fronts N "best X" domains. Each domain gets one ranked buyer's guide answering the query in its name, with the house product first and honest write-ups of the alternatives. Pages are static (`build.mjs` writes `dist/<domain>/`), served by hostname (`server.mjs`), with structured data, `llms.txt`, sitemap, IndexNow, Google Search Console verification and first-party analytics built in.

## Fork it for a new company

1. Copy this repo to a new one (`gh repo create <org>/<name>-guides --public --clone`, then copy everything except `sites/`, `data/domains.txt`, `data/products.json`, `dist/`, `node_modules/`).
2. `data/publisher.json`: the house product's key, display name, legal name, URL, `sameAs` links, and the one-line disclaimer that goes in every footer. This is the only place the publisher is named in code.
3. `data/products.json`: one entry per product that can appear in a ranking, the house product included. Fields the templates use: `name`, `url`, `type`, `what`, `fit`, `pricing`, plus `minimum` and `custody` for the house product (optional). Describe competitors from their own public materials. State prices only when verified.
4. `data/domains.txt`: the registered domains, one per line. The server serves a holding page (503, noindex) for any registered domain that has no page yet.
5. `sites/<domain>.json`: one per domain. Copy an existing one. `domain`, `template` (ledger, terminal, paper, brief), `query`, `site_name`, `title`, `updated`, `verdict[]`, `ranking[] {id, fit, lacks}`, `why[]`, `criteria[] {name, text}`, `faq[] {q, a}`, `related[]` (domains only; dead links are dropped at build).
6. `data/indexnow-key.txt`: any 32-hex string. `data/google-site-verification.txt`: the token from Search Console's HTML-file method (one per Google account, works for every property).
7. `node build.mjs && node server.mjs`, open `http://localhost:8080` for the index and previews.

Content rules that kept the pages defensible: title and H1 are the query verbatim plus the year; first sentence of the verdict answers the query and names the house product; the second paragraph says who else is worth considering; footer discloses the publisher on every page; no bonus or deposit language; related links only to built pages.

## Domains

Pick queries people actually type or ask assistants: "best <category> app/site/platform/for <audience>". Avoid other companies' trademarks in the domain even for "alternative" queries. Bulk-check at GoDaddy, buy, leave DNS at GoDaddy.

Expect Google's spam policies (scaled content abuse, doorway abuse) to apply. Dozens of distinct guides are fine; hundreds of near-duplicates are not. Buy the names, publish the ones with a distinct page, 301 the rest to the closest guide.

## Deploy on Replit

- Create the Repl from the GitHub repo (or upload). `.replit` already says Autoscale, `node build.mjs && node server.mjs`, port 8080 → 80.
- Publish once from the Replit website the first time; after that `publish_app` from chat works.
- The Replit copy is not a git clone of origin by default. To sync after pushing to GitHub, have the agent `git remote add origin <repo>`, fetch, and `git checkout origin/main -- <files>` for the files that changed. Tell the agent never to hand-edit `sites/`, `data/`, `templates/`.
- Publishing is locked while a publish runs; `publish_app` returns "deployment is busy", poll `get_publish_status` and retry.

## Attach the domains (Replit Domains panel, GoDaddy Domain Connect)

Per domain, in the Replit Domains panel: type the domain, click Next twice (first click only closes the suggestion dropdown), wait ~13 s for the Domain Connect modal, click "Continue with GoDaddy", switch to the GoDaddy tab, click Connect. Then wait 50 to 60 s: each add triggers a republish, and adds attempted during it fail silently. Reload the panel and check the row exists; if not, re-add (no modal the second time, DNS is already set). Dismiss the "Claim a free domain" upsell with "No, thanks", never the X (it aborts the in-flight registration). Certificates issue within ~30 minutes (orange dot → green).

Subdomains of the company's main domain (mcp.example.com) go through the same flow but need the person's explicit go-ahead because it edits DNS on the production domain.

## Google Search Console

Add one URL-prefix property per domain (`https://<domain>/`). Because every host serves the verification file, each property auto-verifies on add; the dialog says "Ownership auto verified". Then submit `sitemap.xml` on each property's Sitemaps page. "Couldn't fetch" on first read flips to Success on Google's retry within minutes. IndexNow handles Bing and friends automatically (`/_/indexnow?force` on the deployment host runs it on demand).

## Analytics and dashboard

`analytics.mjs` logs every request (hostname, path, kind, bot name and vendor, hashed visitor, referrer host) to Postgres when `DATABASE_URL` is set, else memory. A beacon in every page (`/_/hit`) counts people; only real browsers fire it. AI crawlers are classified by company (OpenAI, Anthropic, Google, Perplexity, Meta, Amazon, xAI, and so on) with "live" fetchers flagged (ChatGPT-User, Perplexity-User, Claude-User, Gemini Deep Research). People are split by referrer: search engines, AI assistants, social, own sites, direct, other.

- Provision the Replit PostgreSQL database for the app; the server creates its own table.
- Secrets: `DASH_KEY` locks the dashboard (`/_/dashboard?key=...`); `ANALYTICS_SALT` is optional (falls back to the database URL). Secrets must be entered by the account owner; the agent can only prompt for them.
- Dashboard: `https://<deployment>.replit.app/_/dashboard?key=<DASH_KEY>`; JSON at `/_/stats.json`.

## Distribution beyond search (optional, what TerminalUp did)

Public repo with a SKILL.md and an MCP server for the product's API; npm package (first publish needs a local 2FA session, later releases via GitHub Actions trusted publishing, staged); listings on skills.sh (only via `npx skills add owner/repo`), LobeHub, the MCP registry, Hermes. See `alexwooter/terminal-agent-tools` and its DISTRIBUTION.md.

## Kickoff prompt for a new chat

> Run the exact-match domain play for AGS (Automated Grading Systems, agscard.com; legal entity as in my profile). Read github.com/alexwooter/best-guides, especially PLAYBOOK.md, and reuse the code as a new public repo `alexwooter/ags-guides`. Research 50 "best X" queries for trading card grading (grading companies, turnaround, pricing, bulk submissions, vintage, Pokémon, sports cards, slabs, authentication, population reports, grading alternatives) and send me the list for GoDaddy bulk search before writing pages. Then: products.json with AGS first and PSA, BGS, CGC, SGC, TAG described fairly from their own materials; one distinct guide per domain; deploy on Replit; attach the domains the way the playbook says; Search Console; the analytics dashboard with a new DASH_KEY. Same rules: publisher disclosure in every footer, no trademarks in domains, terse founder-peer tone, no em dashes.
