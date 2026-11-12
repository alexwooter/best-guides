// First-party analytics for every domain the server fronts.
// Rows go to Postgres when DATABASE_URL is set, otherwise to memory (dev only).
// No cookies: a visitor is sha256(daily salt + ip + user agent), truncated.
import { createHash, randomBytes } from "node:crypto";

// [user-agent fragment, category, vendor, live]. "live" marks fetchers that fire while an
// assistant answers a person (ChatGPT-User, Perplexity-User, Claude-User): a page being cited now.
const BOTS = [
  // AI companies
  ["GPTBot", "ai", "OpenAI", false], ["ChatGPT-User", "ai", "OpenAI", true], ["OAI-SearchBot", "ai", "OpenAI", false],
  ["ClaudeBot", "ai", "Anthropic", false], ["Claude-User", "ai", "Anthropic", true], ["Claude-SearchBot", "ai", "Anthropic", false],
  ["Claude-Web", "ai", "Anthropic", false], ["anthropic-ai", "ai", "Anthropic", false],
  ["PerplexityBot", "ai", "Perplexity", false], ["Perplexity-User", "ai", "Perplexity", true],
  ["Gemini-Deep-Research", "ai", "Google", true], ["Google-NotebookLM", "ai", "Google", true], ["Google-CloudVertexBot", "ai", "Google", false],
  ["GoogleOther", "ai", "Google", false], ["Google-Extended", "ai", "Google", false],
  ["xAI-Grok", "ai", "xAI", false], ["Grokbot", "ai", "xAI", false], ["Grok", "ai", "xAI", true],
  ["MistralAI-User", "ai", "Mistral", true], ["meta-externalagent", "ai", "Meta", false], ["meta-externalfetcher", "ai", "Meta", true],
  ["FacebookBot", "ai", "Meta", false], ["Amazonbot", "ai", "Amazon", false], ["bedrockbot", "ai", "Amazon", true],
  ["Applebot-Extended", "ai", "Apple", false], ["Bytespider", "ai", "ByteDance", false], ["TikTokSpider", "ai", "ByteDance", false],
  ["DuckAssistBot", "ai", "DuckDuckGo", true], ["CCBot", "ai", "Common Crawl", false], ["cohere-ai", "ai", "Cohere", false],
  ["cohere-training-data-crawler", "ai", "Cohere", false], ["YouBot", "ai", "You.com", false], ["AI2Bot", "ai", "AI2", false],
  ["Diffbot", "ai", "Diffbot", false], ["ImagesiftBot", "ai", "Hive", false], ["omgili", "ai", "Webz.io", false],
  ["Webzio-Extended", "ai", "Webz.io", false], ["Timpibot", "ai", "Timpi", false], ["PanguBot", "ai", "Huawei", false],
  ["iaskspider", "ai", "iAsk", false], ["Kangaroo Bot", "ai", "Kangaroo", false], ["Brightbot", "ai", "Bright Data", false],
  // Search engines
  ["Googlebot", "search", "Google", false], ["AdsBot-Google", "search", "Google", false], ["Google-InspectionTool", "search", "Google", false],
  ["Storebot-Google", "search", "Google", false], ["bingbot", "search", "Bing", false], ["BingPreview", "search", "Bing", false],
  ["Applebot", "search", "Apple", false], ["YandexBot", "search", "Yandex", false], ["DuckDuckBot", "search", "DuckDuckGo", false],
  ["Baiduspider", "search", "Baidu", false], ["Slurp", "search", "Yahoo", false], ["SeznamBot", "search", "Seznam", false],
  ["Qwantify", "search", "Qwant", false], ["PetalBot", "search", "Petal", false], ["Kagibot", "search", "Kagi", false],
  ["MojeekBot", "search", "Mojeek", false], ["Yeti", "search", "Naver", false], ["coccocbot", "search", "Coc Coc", false],
  // Everything else that is not a person
  ["AhrefsBot", "other", "SEO tools", false], ["SemrushBot", "other", "SEO tools", false], ["MJ12bot", "other", "SEO tools", false],
  ["DotBot", "other", "SEO tools", false], ["Screaming Frog", "other", "SEO tools", false],
  ["facebookexternalhit", "other", "Link previews", false], ["Twitterbot", "other", "Link previews", false],
  ["LinkedInBot", "other", "Link previews", false], ["Slackbot", "other", "Link previews", false],
  ["Discordbot", "other", "Link previews", false], ["TelegramBot", "other", "Link previews", false],
  ["WhatsApp", "other", "Link previews", false], ["Pinterestbot", "other", "Link previews", false],
  ["HeadlessChrome", "other", "Scripts", false], ["Lighthouse", "other", "Scripts", false], ["PageSpeed", "other", "Scripts", false],
  ["GTmetrix", "other", "Scripts", false], ["curl/", "other", "Scripts", false], ["Wget/", "other", "Scripts", false],
  ["python-requests", "other", "Scripts", false], ["Python/", "other", "Scripts", false], ["Go-http-client", "other", "Scripts", false],
  ["axios/", "other", "Scripts", false], ["node-fetch", "other", "Scripts", false], ["undici", "other", "Scripts", false],
  ["okhttp", "other", "Scripts", false], ["Java/", "other", "Scripts", false], ["libwww", "other", "Scripts", false],
  ["bot", "other", "Unnamed bots", false], ["crawler", "other", "Unnamed bots", false], ["spider", "other", "Unnamed bots", false],
  ["scraper", "other", "Unnamed bots", false], ["fetcher", "other", "Unnamed bots", false],
];

// Where a person came from, by referrer host.
const SOURCES = [
  [/^gemini\.google\.com$/, "Gemini", "ai"], [/^aistudio\.google\.com$/, "Gemini", "ai"], [/^notebooklm\.google\.com$/, "NotebookLM", "ai"],
  [/(^|\.)google\./, "Google", "search"], [/(^|\.)bing\.com$/, "Bing", "search"], [/(^|\.)duckduckgo\.com$/, "DuckDuckGo", "search"],
  [/(^|\.)yahoo\./, "Yahoo", "search"], [/(^|\.)yandex\./, "Yandex", "search"], [/(^|\.)brave\.com$/, "Brave", "search"],
  [/(^|\.)ecosia\.org$/, "Ecosia", "search"], [/(^|\.)kagi\.com$/, "Kagi", "search"],
  [/(^|\.)chatgpt\.com$/, "ChatGPT", "ai"], [/(^|\.)openai\.com$/, "ChatGPT", "ai"], [/(^|\.)perplexity\.ai$/, "Perplexity", "ai"],
  [/(^|\.)claude\.ai$/, "Claude", "ai"], [/(^|\.)anthropic\.com$/, "Claude", "ai"], 
  [/(^|\.)copilot\.microsoft\.com$/, "Copilot", "ai"], [/(^|\.)grok\.com$/, "Grok", "ai"], [/(^|\.)x\.ai$/, "Grok", "ai"],
  [/(^|\.)you\.com$/, "You.com", "ai"], [/(^|\.)mistral\.ai$/, "Mistral", "ai"], [/(^|\.)meta\.ai$/, "Meta AI", "ai"],
  [/(^|\.)x\.com$/, "X", "social"], [/(^|\.)twitter\.com$/, "X", "social"], [/^t\.co$/, "X", "social"],
  [/(^|\.)reddit\.com$/, "Reddit", "social"], [/(^|\.)linkedin\.com$/, "LinkedIn", "social"], [/^lnkd\.in$/, "LinkedIn", "social"],
  [/(^|\.)facebook\.com$/, "Facebook", "social"], [/(^|\.)instagram\.com$/, "Instagram", "social"], [/(^|\.)youtube\.com$/, "YouTube", "social"],
  [/(^|\.)tiktok\.com$/, "TikTok", "social"], [/(^|\.)threads\.net$/, "Threads", "social"], [/(^|\.)discord\.com$/, "Discord", "social"],
  [/(^|\.)t\.me$/, "Telegram", "social"], [/(^|\.)telegram\./, "Telegram", "social"],
  [/(^|\.)terminalup\.com$/, "TerminalUp", "owned"], [/(^|\.)wagerup\.com$/, "WagerUp", "owned"],
];

export function sourceOf(refHost = "") {
  if (!refHost) return { source: "Direct", group: "direct" };
  for (const [re, source, group] of SOURCES) if (re.test(refHost)) return { source, group };
  return { source: refHost, group: "other" };
}

export function classify(ua = "") {
  if (!ua) return { bot: "no-ua", cat: "other", vendor: "Unnamed bots", live: false };
  const lower = ua.toLowerCase();
  for (const [name, cat, vendor, live] of BOTS) {
    if (lower.includes(name.toLowerCase())) return { bot: name, cat, vendor, live };
  }
  return { bot: null, cat: null, vendor: null, live: false };
}

function clientIp(req) {
  const xf = (req.headers["x-forwarded-for"] ?? "").toString().split(",")[0].trim();
  return xf || req.socket?.remoteAddress || "";
}

// The salt rotates daily so a visitor id never links two days. It must be the same on every
// server instance, so it comes from a secret: ANALYTICS_SALT, else the database URL, else a
// per-process random value (dev only).
const SECRET = process.env.ANALYTICS_SALT || process.env.DATABASE_URL || randomBytes(16).toString("hex");
function dailySalt() {
  return createHash("sha256").update(`${SECRET}|${new Date().toISOString().slice(0, 10)}`).digest("hex");
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
  return { pageviews: 0, visitors: new Set(), ai: 0, aiLive: 0, search: 0, otherBots: 0, llms: 0, pages: 0,
    src: { search: 0, ai: 0, social: 0, owned: 0, direct: 0, other: 0 } };
}
function bump(agg, r) {
  if (r.kind === "beacon" && !r.bot) {
    agg.pageviews++; agg.visitors.add(r.visitor);
    const g = sourceOf(r.ref_host).group; agg.src[g] = (agg.src[g] ?? 0) + 1;
  }
  if (r.bot_cat === "ai") { agg.ai++; if (classify(r.bot).live) agg.aiLive++; }
  else if (r.bot_cat === "search") agg.search++;
  else if (r.bot_cat === "other") agg.otherBots++;
  if (r.path === "/llms.txt") agg.llms++;
  if (r.kind === "page") agg.pages++;
}
function finish(agg) { return { ...agg, visitors: agg.visitors.size }; }
function tally(map, key, init, fn) { if (!map.has(key)) map.set(key, init()); fn(map.get(key)); }

export async function stats({ days = 30, domains = [] } = {}) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await rowsSince(since);
  const byDay = new Map(), byHost = new Map(), today = new Map();
  const people = new Map(), refs = new Map(), aiVendors = new Map(), engines = new Map(), others = new Map();
  const todayKey = dayOf(new Date());
  for (const d of domains) byHost.set(d, blank());
  for (let i = days - 1; i >= 0; i--) byDay.set(dayOf(new Date(Date.now() - i * 86400000)), blank());
  const total = blank();
  for (const r of rows) {
    const day = dayOf(new Date(r.ts));
    tally(byDay, day, blank, (a) => bump(a, r));
    tally(byHost, r.host, blank, (a) => bump(a, r));
    if (day === todayKey) tally(today, r.host, blank, (a) => bump(a, r));
    bump(total, r);
    if (r.kind === "beacon" && !r.bot) {
      const { source, group } = sourceOf(r.ref_host);
      tally(people, source, () => ({ source, group, visits: 0, visitors: new Set() }), (a) => { a.visits++; a.visitors.add(r.visitor); });
      if (r.ref_host) refs.set(r.ref_host, (refs.get(r.ref_host) ?? 0) + 1);
    }
    if (r.bot_cat === "ai") {
      const c = classify(r.bot);
      tally(aiVendors, c.vendor, () => ({ vendor: c.vendor, hits: 0, live: 0, bots: new Map() }), (a) => {
        a.hits++; if (c.live) a.live++; a.bots.set(r.bot, (a.bots.get(r.bot) ?? 0) + 1);
      });
    } else if (r.bot_cat === "search") {
      const c = classify(r.bot);
      tally(engines, c.vendor, () => ({ engine: c.vendor, hits: 0 }), (a) => { a.hits++; });
    } else if (r.bot_cat === "other") {
      const c = classify(r.bot);
      tally(others, c.vendor, () => ({ kind: c.vendor, hits: 0 }), (a) => { a.hits++; });
    }
  }
  const groupOrder = { search: 0, ai: 1, social: 2, owned: 3, direct: 4, other: 5 };
  return {
    days, since: since.toISOString(), tz: TZ, rows: rows.length, storage: pool ? "postgres" : "memory",
    totals: finish(total),
    daily: [...byDay.entries()].map(([day, a]) => ({ day, ...finish(a) })),
    domains: [...byHost.entries()].map(([host, a]) => ({ host, ...finish(a), today: finish(today.get(host) ?? blank()) }))
      .sort((a, b) => b.visitors - a.visitors || b.ai - a.ai || b.pageviews - a.pageviews || a.host.localeCompare(b.host)),
    people: [...people.values()].map((p) => ({ ...p, visitors: p.visitors.size }))
      .sort((a, b) => b.visits - a.visits || groupOrder[a.group] - groupOrder[b.group]),
    aiVendors: [...aiVendors.values()].map((v) => ({ ...v, bots: [...v.bots.entries()].map(([bot, hits]) => ({ bot, hits })).sort((a, b) => b.hits - a.hits) }))
      .sort((a, b) => b.hits - a.hits),
    engines: [...engines.values()].sort((a, b) => b.hits - a.hits),
    otherBots: [...others.values()].sort((a, b) => b.hits - a.hits),
    referrers: [...refs.entries()].map(([host, hits]) => ({ host, hits, ...sourceOf(host) })).sort((a, b) => b.hits - a.hits).slice(0, 25),
  };
}
