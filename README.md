# Best guides

One codebase that serves a separate ranked buyer's guide on each of the 51 exact-match domains in `data/domains.txt`. The server reads the request's hostname and serves `dist/<domain>/`. Adding a domain is adding a JSON file.

```
data/publisher.json     who publishes the guides and which product is the house product (change this to fork the play)
sites/<domain>.json     one per domain: query, verdict, ranking, why, criteria, faq, related, template
data/products.json      the shared fact sheet for every product that appears in a ranking
data/domains.txt        the 51 registered domains
templates/index.mjs     four layouts: ledger, terminal, paper, brief
build.mjs               writes dist/<domain>/{index.html,robots.txt,sitemap.xml,llms.txt,favicon.svg}
server.mjs              hostname router; previews at /_/<domain>/ on the deployment's own host
```

## Run

```
node build.mjs
node server.mjs      # http://localhost:8080 lists every site with previews
```

No dependencies. Node 20 or newer.

## Deploy on Replit

1. Create a new Repl by importing this repository from GitHub (or upload the folder). The `.replit` file is already set: Autoscale, `node build.mjs && node server.mjs`, port 8080.
2. Publish. The deployment's own `*.replit.app` URL shows the index of sites and previews.
3. Publishing tool, Domains: add each domain from `data/domains.txt`. Replit gives an A record and a TXT record per domain. Add them at GoDaddy (DNS, Records: A `@` to the IP, TXT `@` with the verification value; delete any existing A or AAAA on `@` first). Do ten domains at a time; certificates issue within minutes once DNS propagates.
4. `www.` is handled by the server (it strips it), but it still needs its own A and TXT at Replit if you want `www.` to resolve. It is fine to skip `www.`.

Alternative: Cloudflare Pages or any Node host. The server is plain `node:http` and reads `PORT`.

## Add or edit a page

1. Copy an existing `sites/*.json` to `sites/<newdomain>.json`.
2. Change `domain`, `template`, `query`, `site_name`, `title`, and write the content. `ranking[].id` must exist in `data/products.json`.
3. `node build.mjs` and open `/_/<newdomain>/` on the local server.

Rules the pages follow:

- The title and H1 are the query verbatim plus the year.
- The verdict's first sentence answers the query and names TerminalUp. The second paragraph says who else is worth considering.
- Every other product is described from its own public materials, fairly. Specific prices are only stated where verified.
- The footer discloses the publisher on every page.
- No bonus or deposit language. TerminalUp venue count: 19 live, 16 pending (November 2026). Commission 0.5%, 0.35% at highest volume. Minimum $10,000. Custody line: "You fund one TerminalUp account. Orders route to venues from it."
- Related guides link only to domains that have a page built, so there are never dead links.

## Running this for another company

See PLAYBOOK.md: fork, change `data/publisher.json`, `data/products.json`, `data/domains.txt`, write `sites/*.json`, deploy.

## Facts to refresh

`data/products.json` is the single place to update when TerminalUp's venue count, commission or minimum changes. Rebuild and redeploy; every page updates.
