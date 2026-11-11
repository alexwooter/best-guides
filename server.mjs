// Serves dist/<hostname>/ by the request's Host header. One deployment, many domains.
// On the deployment's own hostname (or localhost) it lists every site and serves
// previews at /_/<domain>/. `PORT` defaults to 8080.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, normalize } from "node:path";

const root = new URL(".", import.meta.url).pathname;
const dist = join(root, "dist");
const PORT = Number(process.env.PORT ?? 8080);
const TYPES = { ".html": "text/html; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json; charset=utf-8" };

function manifest() {
  try { return JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8")); } catch { return []; }
}
let registeredCache = null;
function registered() {
  if (registeredCache) return registeredCache;
  try {
    registeredCache = new Set(readFileSync(join(root, "data/domains.txt"), "utf8").split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean));
  } catch { registeredCache = new Set(); }
  return registeredCache;
}
// IndexNow: every host serves /<key>.txt, and live hosts are submitted to api.indexnow.org
// (Bing, Yandex, Naver, Seznam share one endpoint). The key is public by design.
function indexNowKey() {
  try { return readFileSync(join(root, "data/indexnow-key.txt"), "utf8").trim(); } catch { return ""; }
}
// Google Search Console HTML-file verification. One token per Google account, served on every host.
function googleVerification() {
  try { return readFileSync(join(root, "data/google-site-verification.txt"), "utf8").trim(); } catch { return ""; }
}
async function isLive(domain, key) {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(`https://${domain}/${key}.txt`, { signal: ctl.signal, redirect: "manual" });
    clearTimeout(t);
    return r.ok && (await r.text()).trim() === key;
  } catch { return false; }
}
let lastIndexNow = 0;
async function submitIndexNow({ force = false } = {}) {
  const key = indexNowKey();
  if (!key) return { skipped: "no key" };
  if (!force && Date.now() - lastIndexNow < 10 * 60 * 1000) return { skipped: "ran recently" };
  lastIndexNow = Date.now();
  const out = { submitted: [], notLive: [], failed: [] };
  for (const site of manifest()) {
    const domain = site.domain;
    if (!(await isLive(domain, key))) { out.notLive.push(domain); continue; }
    try {
      const r = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: domain, key, keyLocation: `https://${domain}/${key}.txt`, urlList: [`https://${domain}/`] }),
      });
      (r.ok || r.status === 202 ? out.submitted : out.failed).push(`${domain} ${r.status}`);
    } catch (e) { out.failed.push(`${domain} ${e.message}`); }
  }
  console.log("indexnow", JSON.stringify(out));
  return out;
}

function hostOf(req) {
  const raw = (req.headers["x-forwarded-host"] ?? req.headers.host ?? "").toString().split(",")[0].trim().toLowerCase();
  return raw.replace(/:\d+$/, "").replace(/^www\./, "");
}
function send(res, status, body, type = "text/plain; charset=utf-8", extra = {}) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "public, max-age=300", ...extra });
  res.end(body);
}
function serveFile(res, dir, file) {
  const path = normalize(join(dir, file));
  if (!path.startsWith(dir) || !existsSync(path) || !statSync(path).isFile()) return false;
  const ext = path.slice(path.lastIndexOf("."));
  send(res, 200, readFileSync(path), TYPES[ext] ?? "application/octet-stream");
  return true;
}
function routeFile(pathname) {
  if (pathname === "/" || pathname === "/index.html") return "index.html";
  const allowed = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt", "/favicon.svg"]);
  return allowed.has(pathname) ? pathname.slice(1) : null;
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  if (url.pathname === "/healthz") return send(res, 200, "ok");
  const host = hostOf(req);
  const siteDir = join(dist, host);
  const key = indexNowKey();
  if (key && url.pathname === `/${key}.txt`) return send(res, 200, key, "text/plain; charset=utf-8", { "Cache-Control": "no-store" });
  const gsv = googleVerification();
  if (gsv && url.pathname === `/${gsv}.html`) return send(res, 200, `google-site-verification: ${gsv}.html`, "text/html; charset=utf-8", { "Cache-Control": "no-store" });

  if (existsSync(siteDir) && host.includes(".")) {
    const file = routeFile(url.pathname);
    if (file && serveFile(res, siteDir, file)) return;
    return send(res, 404, "Not found", "text/plain; charset=utf-8", { "Cache-Control": "no-store" });
  }

  // A registered domain whose page is not built yet: a holding page that search engines are told to skip.
  if (registered().has(host)) {
    if (url.pathname === "/robots.txt") return send(res, 200, "User-agent: *\nDisallow: /\n", "text/plain; charset=utf-8", { "Cache-Control": "no-store" });
    const name = host.replace(/^best/, "best ").replace(/\.com$/, "");
    return send(res, 503, `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>${name}</title><style>body{font:16px/1.6 system-ui;max-width:560px;margin:80px auto;padding:0 20px;color:#17212b}</style><h1>${name}</h1><p>This guide is being written and will be published shortly.</p>`, "text/html; charset=utf-8", { "Cache-Control": "no-store", "Retry-After": "86400" });
  }

  // Fallback host: index of all sites, previews, and the IndexNow trigger.
  if (url.pathname === "/_/indexnow") {
    submitIndexNow({ force: url.searchParams.has("force") }).then((r) => send(res, 200, JSON.stringify(r, null, 2), "application/json; charset=utf-8", { "Cache-Control": "no-store" }));
    return;
  }
  const m = /^\/_\/([a-z0-9.-]+)\/?(.*)$/.exec(url.pathname);
  if (m) {
    const dir = join(dist, m[1]);
    const file = routeFile("/" + m[2]) ?? (m[2] === "" ? "index.html" : null);
    if (existsSync(dir) && file && serveFile(res, dir, file)) return;
    return send(res, 404, "No such site");
  }
  if (url.pathname === "/") {
    const rows = manifest().map((s) => `<li><a href="/_/${s.domain}/">${s.domain}</a> <small>${s.template}, ~${s.words} words</small> · <a href="https://${s.domain}/">live</a></li>`).join("\n");
    return send(res, 200, `<!doctype html><meta charset="utf-8"><title>Sites</title><style>body{font:15px/1.6 system-ui;max-width:720px;margin:40px auto;padding:0 20px}small{color:#666}</style><h1>${manifest().length} sites</h1><ul>${rows}</ul>`, "text/html; charset=utf-8", { "Cache-Control": "no-store" });
  }
  send(res, 404, "Not found");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`serving ${manifest().length} sites on :${PORT}`);
  if (process.env.INDEXNOW !== "off") {
    setTimeout(() => submitIndexNow().catch(() => {}), 90 * 1000);
    setInterval(() => submitIndexNow().catch(() => {}), 24 * 60 * 60 * 1000).unref?.();
  }
});
