// First-party analytics for every domain the server fronts.
// Rows go to Postgres when DATABASE_URL is set, otherwise to memory (dev only).
// No cookies: a visitor is sha256(daily salt + ip + user agent), truncated.
import { createHash, randomBytes } from "node:crypto";

const BOTS = [
  // AI crawlers and AI answer fetchers. ChatGPT-User, Perplexity-User and Claude-User fire
  // when an assistant reads the page while answering someone; those are the ones to watch.
  ["GPTBot", "ai"], ["ChatGPT-User", "ai"], ["OAI-SearchBot", "ai"], ["ClaudeBot", "ai"], ["Claude-User", "ai"],
  ["Claude-SearchBot", "ai"], ["anthropic-ai", "ai"], ["PerplexityBot", "ai"], ["Perplexity-User", "ai"],
  ["Amazonbot", "ai"], ["Applebot-Extended", "ai"], ["Bytespider", "ai"], ["CCBot", "ai"], ["cohere-ai", "ai"],
  ["Diffbot", "ai"], ["meta-externalagent", "ai"], ["meta-externalfetcher", "ai"], ["YouBot", "ai"],
  ["DuckAssistBot", "ai"], ["MistralAI-User", "ai"], ["Google-CloudVertexBot", "ai"], ["AI2Bot", "ai"],
  ["ImagesiftBot", "ai"], ["omgili", "ai"], ["Timpibot", "ai"], ["PanguBot", "ai"],
  // Search engines.
  ["Googlebot", "search"], ["AdsBot-Google", "search"], ["Google-InspectionTool", "search"], ["Storebot-Google", "search"],
  ["bingbot", "search"], ["BingPreview", "search"], ["Applebot", "search"], ["YandexBot", "search"], ["DuckDuckBot", "search"],
  ["Baiduspider", "search"], ["Slurp", "search"], ["SeznamBot", "search"], ["Qwantify", "search"], ["PetalBot", "search"],
  ["Kagibot", "search"], ["MojeekBot", "search"], ["Yeti", "search"], ["coccocbot", "search"],
  // Everything else that is not a person.
  ["AhrefsBot", "other"], ["SemrushBot", "other"], ["MJ12bot", "other"], ["DotBot", "other"], ["Screaming Frog", "other"],
  ["facebookexternalhit", "other"], ["Twitterbot", "other"], ["LinkedInBot", "other"], ["Slackbot", "other"],
  ["Discordbot", "other"], ["TelegramBot", "other"], ["WhatsApp", "other"], ["Pinterestbot", "other"],
  ["HeadlessChrome", "other"], ["Lighthouse", "other"], ["PageSpeed", "other"], ["GTmetrix", "other"],
  ["curl/", "other"], ["Wget/", "other"], ["python-requests", "other"], ["Python/", "other"], ["Go-http-client", "other"],
  ["axios/", "other"], ["node-fetch", "other"], ["undici", "other"], ["okhttp", "other"], ["Java/", "other"], ["libwww", "other"],
  ["bot", "other"], ["crawler", "other"], ["spider", "other"], ["scraper", "other"], ["fetcher", "other"],
];

export function classify(ua = "") {
  if (!ua) return { bot: "no-ua", cat: "other" };
  const lower = ua.toLowerCase();
  for (const [name, cat] of BOTS) {
    if (lower.includes(name.toLowerCase())) return { bot: name, cat };
  }
  return { bot: null, cat: null };
}

function clientIp(req) {
  const xf = (req.headers["x-forwarded-for"] ?? "").toString().split(",")[0].trim();
  return xf || req.socket?.remoteAddress || "";
}

let saltDay = "", salt = "";
function dailySalt() {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== saltDay) { saltDay = day; salt = (process.env.ANALYTICS_SALT ?? "") + day + randomBytes(8).toString("hex"); }
  return salt;
}

export function visitorId(req) {
  const ua = (req.headers["user-agent"] ?? "").toString();
  return createHash("sha256").update(`${dailySalt()}|${clientIp(req)}|${ua}`).digest("hex").slice(0, 16);
}

export function refHost(ref = "") {
  try { return ref ? new URL(ref).hostname.replace(/^www\./, "") : ""; } catch { return ""; }
}

// ---------- storage ----------
let pool = null;
const mem = [];
const queue = [];
let ready = false;

export async function initAnalytics() {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const pg = (await import("pg")).default;
      pool = new pg.Pool({ connectionString: url, max: 3, ssl: url.includes("sslmode=") ? undefined : { rejectUnauthorized: false } });
      await pool.query(`CREATE TABLE IF NOT EXISTS hits (
        id bigserial PRIMARY KEY,
        ts timestamptz NOT NULL DEFAULT now(),
        host text NOT NULL,
        path text NOT NULL,
        kind text NOT NULL,
        bot text,
        bot_cat text,
        visitor text,
        ref_host text,
        ua text
      )`);
      await pool.query(`CREATE INDEX IF NOT EXISTS hits_ts ON hits (ts)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS hits_host_ts ON hits (host, ts)`);
      console.log("analytics: postgres ready");
    } catch (e) {
      console.error("analytics: postgres unavailable, using memory", e.message);
      pool = null;
    }
  } else {
    console.log("analytics: no DATABASE_URL, using memory");
  }
  ready = true;
  setInterval(() => flush().catch((e) => console.error("analytics flush", e.message)), 5000).unref?.();
}

export function record({ req, host, path, kind, ref = "" }) {
  if (!host || !host.includes(".")) return;
  const ua = (req.headers["user-agent"] ?? "").toString().slice(0, 300);
  const { bot, cat } = classify(ua);
  queue.push({
    ts: new Date(), host, path: String(path).slice(0, 200), kind, bot, bot_cat: cat,
    visitor: visitorId(req), ref_host: refHost(ref).slice(0, 120), ua,
  });
  if (queue.length >= 100) flush().catch(() => {});
}

export async function flush() {
  if (!queue.length) return;
  const rows = queue.splice(0, queue.length);
  if (!pool) {
    mem.push(...rows);
    if (mem.length > 100000) mem.splice(0, mem.length - 100000);
    return;
  }
  const values = [], params = [];
  rows.forEach((r, i) => {
    const b = i * 9;
    values.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`);
    params.push(r.ts, r.host, r.path, r.kind, r.bot, r.bot_cat, r.visitor, r.ref_host, r.ua);
  });
  await pool.query(`INSERT INTO hits (ts, host, path, kind, bot, bot_cat, visitor, ref_host, ua) VALUES ${values.join(",")}`, params);
}

async function rowsSince(since) {
  await flush().catch(() => {});
  if (!pool) return mem.filter((r) => r.ts >= since);
  const { rows } = await pool.query(
    `SELECT ts, host, path, kind, bot, bot_cat, visitor, ref_host FROM hits WHERE ts >= $1 ORDER BY ts`, [since],
  );
  return rows;
}

// ---------- aggregation ----------
const TZ = process.env.ANALYTICS_TZ ?? "America/New_York";
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
export function dayOf(ts) { return dayFmt.format(ts); }

function blank() {
  return { pageviews: 0, visitors: new Set(), ai: 0, search: 0, otherBots: 0, llms: 0, pages: 0 };
}
function bump(agg, r) {
  if (r.kind === "beacon" && !r.bot) { agg.pageviews++; agg.visitors.add(r.visitor); }
  if (r.bot_cat === "ai") agg.ai++;
  else if (r.bot_cat === "search") agg.search++;
  else if (r.bot_cat === "other") agg.otherBots++;
  if (r.path === "/llms.txt") agg.llms++;
  if (r.kind === "page") agg.pages++;
}
function finish(agg) { return { ...agg, visitors: agg.visitors.size }; }

export async function stats({ days = 30, domains = [] } = {}) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await rowsSince(since);
  const byDay = new Map(), byHost = new Map(), aiBots = new Map(), refs = new Map(), today = new Map();
  const todayKey = dayOf(new Date());
  for (const d of domains) byHost.set(d, blank());
  // Fill every day in range so the chart has no holes.
  for (let i = days - 1; i >= 0; i--) byDay.set(dayOf(new Date(Date.now() - i * 86400000)), blank());
  for (const r of rows) {
    const day = dayOf(new Date(r.ts));
    if (!byDay.has(day)) byDay.set(day, blank());
    bump(byDay.get(day), r);
    if (!byHost.has(r.host)) byHost.set(r.host, blank());
    bump(byHost.get(r.host), r);
    if (day === todayKey) { if (!today.has(r.host)) today.set(r.host, blank()); bump(today.get(r.host), r); }
    if (r.bot_cat === "ai") aiBots.set(r.bot, (aiBots.get(r.bot) ?? 0) + 1);
    if (r.kind === "beacon" && !r.bot && r.ref_host) refs.set(r.ref_host, (refs.get(r.ref_host) ?? 0) + 1);
  }
  const total = blank();
  for (const r of rows) bump(total, r);
  return {
    days, since: since.toISOString(), tz: TZ, rows: rows.length, storage: pool ? "postgres" : "memory",
    totals: finish(total),
    daily: [...byDay.entries()].map(([day, a]) => ({ day, ...finish(a) })),
    domains: [...byHost.entries()].map(([host, a]) => ({ host, ...finish(a), today: finish(today.get(host) ?? blank()) }))
      .sort((a, b) => b.visitors - a.visitors || b.ai - a.ai || b.pageviews - a.pageviews || a.host.localeCompare(b.host)),
    aiBots: [...aiBots.entries()].map(([bot, hits]) => ({ bot, hits })).sort((a, b) => b.hits - a.hits),
    referrers: [...refs.entries()].map(([host, hits]) => ({ host, hits })).sort((a, b) => b.hits - a.hits).slice(0, 20),
  };
}
