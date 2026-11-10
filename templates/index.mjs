// Four layouts over one content model. Each returns a full HTML document.
// Shared pieces build the sections; each template orders and styles them differently.

const month = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

function head(ctx, css) {
  const { site, esc, jsonLd } = ctx;
  const desc = site.verdict[0].length > 155 ? site.verdict[0].slice(0, 152).replace(/\s+\S*$/, "") + "..." : site.verdict[0];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="https://${site.domain}/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:title" content="${esc(site.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://${site.domain}/">
<meta name="robots" content="index,follow,max-snippet:-1">
<script type="application/ld+json">${jsonLd}</script>
<style>${css}</style>
</head>`;
}

function rankTable(ctx) {
  const { site, products, esc } = ctx;
  const rows = site.ranking.map((r, i) => {
    const p = products[r.id];
    return `<tr${i === 0 ? ' class="top"' : ""}><td class="n">${i + 1}</td><td><a href="${p.url}" rel="${r.id === "terminalup" ? "" : "nofollow"}">${esc(p.name)}</a><div class="t">${esc(p.type)}</div></td><td>${esc(r.fit)}</td><td>${esc(r.lacks)}</td></tr>`;
  }).join("\n");
  return `<table class="rank"><thead><tr><th>#</th><th>Product</th><th>Who it fits for this query</th><th>The one thing it lacks</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function entries(ctx) {
  const { site, products, esc } = ctx;
  return site.ranking.map((r, i) => {
    const p = products[r.id];
    return `<article class="entry" id="rank-${i + 1}">
<h3><span class="num">${i + 1}</span> ${esc(p.name)} <small>${esc(p.type)}</small></h3>
<p>${esc(p.what)}</p>
${r.note ? `<p>${esc(r.note)}</p>` : ""}
<dl><dt>Costs</dt><dd>${esc(p.pricing)}</dd>${r.id === "terminalup" ? `<dt>Minimum</dt><dd>${esc(p.minimum)}</dd>` : ""}</dl>
</article>`;
  }).join("\n");
}

const paras = (arr, esc) => arr.map((t) => `<p>${esc(t)}</p>`).join("\n");

function criteria(ctx) {
  return `<ol class="criteria">${ctx.site.criteria.map((c) => `<li><strong>${ctx.esc(c.name)}.</strong> ${ctx.esc(c.text)}</li>`).join("")}</ol>`;
}
function faq(ctx) {
  return ctx.site.faq.map((f) => `<details open><summary>${ctx.esc(f.q)}</summary><p>${ctx.esc(f.a)}</p></details>`).join("\n");
}
function related(ctx) {
  const items = ctx.site.related.filter((d) => ctx.byDomain.has(d)).map((d) => `<li><a href="https://${d}/">${ctx.esc(ctx.byDomain.get(d).site_name)}</a></li>`).join("");
  return `<ul class="related">${items}</ul>`;
}
function footer(ctx) {
  return `<footer><p>Published by <a href="https://terminalup.com">TerminalUp Inc.</a>, which makes TerminalUp. Every other product is described from its own public materials. Nothing here is a promotion, and nothing here is advice to bet. Updated ${month(ctx.site.updated)}.</p><p><a href="/llms.txt">llms.txt</a> · <a href="/sitemap.xml">sitemap</a></p></footer>`;
}

const shared = (ctx) => ({
  title: ctx.esc(site_h1(ctx)),
  verdict: paras(ctx.site.verdict, ctx.esc),
  table: rankTable(ctx),
  entries: entries(ctx),
  why: paras(ctx.site.why, ctx.esc),
  criteria: criteria(ctx),
  faq: faq(ctx),
  related: related(ctx),
  footer: footer(ctx),
  updated: month(ctx.site.updated),
  tu: ctx.products.terminalup,
  cta: ctx.site.cta ?? { url: ctx.products.terminalup.url, text: 'See TerminalUp' },
});
const site_h1 = (ctx) => ctx.site.title;

/* ---------- Ledger: light, serif, editorial ---------- */
const ledgerCss = `
:root{--ink:#17212b;--muted:#5c6975;--rule:#d9dee3;--bg:#fbfaf7;--acc:#1f6f43}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 Georgia,"Times New Roman",serif}
header.mast{border-bottom:3px double var(--rule);padding:28px 0 18px}.wrap{max-width:900px;margin:0 auto;padding:0 22px}
.kicker{font:600 12px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
h1{font-size:40px;line-height:1.1;margin:10px 0 6px;letter-spacing:-.01em}h2{font-size:26px;margin:44px 0 12px;border-top:1px solid var(--rule);padding-top:22px}h3{font-size:22px;margin:30px 0 8px}
.meta{font:14px system-ui,sans-serif;color:var(--muted)}
.verdict p:first-child{font-size:21px;line-height:1.5}
table.rank{width:100%;border-collapse:collapse;font:15px/1.45 system-ui,sans-serif;margin:16px 0 8px}
.rank th{text-align:left;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:2px solid var(--ink);padding:8px 10px 8px 0}
.rank td{vertical-align:top;border-bottom:1px solid var(--rule);padding:12px 10px 12px 0}.rank td.n{font-weight:700;width:28px}.rank .t{color:var(--muted);font-size:13px}
.rank tr.top td{background:#eef6f0}.rank a{color:var(--ink)}
.entry{border-left:3px solid var(--rule);padding-left:18px;margin:26px 0}.entry h3 .num{display:inline-block;min-width:30px;color:var(--acc)}.entry h3 small{display:block;font:14px system-ui,sans-serif;color:var(--muted);margin-left:30px;font-weight:400}
.entry dl{display:grid;grid-template-columns:70px 1fr;gap:4px 12px;font:15px/1.5 system-ui,sans-serif;margin:12px 0 0}.entry dt{color:var(--muted);font-weight:600}.entry dd{margin:0}
ol.criteria li{margin:10px 0}
details{border-bottom:1px solid var(--rule);padding:12px 0}summary{font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;font-size:16px}details p{margin:8px 0 0}
ul.related{columns:2;padding-left:20px;font-family:system-ui,sans-serif;font-size:15px}
footer{margin:56px 0 40px;padding-top:18px;border-top:3px double var(--rule);font:14px/1.6 system-ui,sans-serif;color:var(--muted)}
.cta{display:inline-block;margin:10px 0;padding:10px 16px;background:var(--acc);color:#fff;text-decoration:none;font:600 15px system-ui,sans-serif;border-radius:4px}
@media(max-width:700px){h1{font-size:30px}.rank thead{display:none}.rank td{display:block;border:0;padding:4px 0}.rank tr{display:block;border-bottom:1px solid var(--rule);padding:12px 0}.rank td.n{display:inline}ul.related{columns:1}}
`;
function ledger(ctx) {
  const s = shared(ctx);
  return `${head(ctx, ledgerCss)}
<body>
<header class="mast"><div class="wrap"><div class="kicker">${ctx.esc(ctx.site.site_name)} · A buyer's guide</div><h1>${s.title}</h1><div class="meta">Updated ${s.updated} · Written for people who trade sports with real size</div></div></header>
<main class="wrap">
<section class="verdict">${s.verdict}</section>
<h2 id="ranking">The ranking</h2>
${s.table}
${s.entries}
<h2 id="why">Why ${ctx.esc(s.tu.name)} ranks first</h2>
${s.why}
<a class="cta" href="${s.cta.url}">${ctx.esc(s.cta.text)}</a>
<h2 id="how">How we ranked</h2>
${s.criteria}
<h2 id="faq">Questions people ask</h2>
${s.faq}
<h2 id="related">Related guides</h2>
${s.related}
${s.footer}
</main>
</body></html>`;
}

/* ---------- Terminal: dark, monospace numbers, dense ---------- */
const terminalCss = `
:root{--bg:#0d1117;--panel:#131a22;--ink:#e6edf3;--muted:#8b98a5;--line:#263040;--acc:#3BD324}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 Inter,system-ui,sans-serif}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}
header{padding:26px 0;border-bottom:1px solid var(--line)}.brand{font:700 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--acc)}
h1{font-size:38px;line-height:1.1;margin:14px 0 8px;letter-spacing:-.02em}h2{font-size:22px;margin:40px 0 12px;color:var(--ink)}h3{font-size:19px;margin:0 0 6px}
.meta{font:13px ui-monospace,Menlo,monospace;color:var(--muted)}
.grid{display:grid;grid-template-columns:1fr 300px;gap:28px;margin-top:28px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:18px}
.side .panel{position:sticky;top:16px}.side h4{margin:0 0 8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.side ol{margin:0;padding-left:20px}.side li{margin:4px 0}.side a{color:var(--ink)}
table.rank{width:100%;border-collapse:collapse;font-size:14px;margin:12px 0}.rank th{text-align:left;color:var(--muted);font-weight:600;border-bottom:1px solid var(--line);padding:8px 8px 8px 0;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
.rank td{vertical-align:top;border-bottom:1px solid var(--line);padding:10px 8px 10px 0}.rank td.n{font:700 15px ui-monospace,Menlo,monospace;color:var(--acc);width:28px}.rank .t{color:var(--muted);font-size:12px}.rank tr.top td{background:#15231a}.rank a{color:var(--ink)}
.entry{border:1px solid var(--line);border-radius:8px;padding:16px 18px;margin:14px 0;background:var(--panel)}.entry .num{font:700 14px ui-monospace,Menlo,monospace;color:var(--acc);margin-right:8px}.entry h3 small{display:block;font-size:13px;color:var(--muted);font-weight:400}
.entry dl{display:grid;grid-template-columns:64px 1fr;gap:4px 12px;font-size:14px;margin:10px 0 0}.entry dt{color:var(--muted)}.entry dd{margin:0}
ol.criteria li{margin:8px 0}
details{border:1px solid var(--line);border-radius:6px;padding:10px 14px;margin:8px 0;background:var(--panel)}summary{font-weight:600;cursor:pointer}details p{margin:8px 0 0;color:#cfd8e0}
ul.related{padding-left:20px}ul.related a{color:var(--ink)}
footer{margin:48px 0 40px;border-top:1px solid var(--line);padding-top:16px;color:var(--muted);font-size:14px}footer a{color:var(--muted)}
.cta{display:inline-block;margin:12px 0;padding:10px 16px;background:var(--acc);color:#0B1A24;font-weight:700;text-decoration:none;border-radius:6px}
a{color:var(--acc)}
@media(max-width:860px){.grid{grid-template-columns:1fr}.side .panel{position:static}h1{font-size:30px}.rank thead{display:none}.rank td{display:block;border:0;padding:3px 0}.rank tr{display:block;border-bottom:1px solid var(--line);padding:10px 0}.rank td.n{display:inline}}
`;
function terminal(ctx) {
  const s = shared(ctx);
  const toc = ctx.site.ranking.map((r, i) => `<li><a href="#rank-${i + 1}">${ctx.esc(ctx.products[r.id].name)}</a></li>`).join("");
  return `${head(ctx, terminalCss)}
<body>
<header><div class="wrap"><div class="brand">${ctx.esc(ctx.site.site_name)}</div><h1>${s.title}</h1><div class="meta">updated ${s.updated} · ${ctx.site.ranking.length} products ranked · sources: each product's public materials</div></div></header>
<main class="wrap"><div class="grid">
<div>
<section class="verdict">${s.verdict}</section>
<h2 id="ranking">Ranking</h2>
${s.table}
${s.entries}
<h2 id="why">Why ${ctx.esc(s.tu.name)} is first</h2>
${s.why}
<a class="cta" href="${s.cta.url}">${ctx.esc(s.cta.text)}</a>
<h2 id="how">Criteria</h2>
${s.criteria}
<h2 id="faq">FAQ</h2>
${s.faq}
<h2 id="related">Related</h2>
${s.related}
${s.footer}
</div>
<aside class="side"><div class="panel"><h4>At a glance</h4><ol>${toc}</ol><h4 style="margin-top:16px">Our pick</h4><p style="margin:0;font-size:14px">${ctx.esc(ctx.products.terminalup.custody)}</p></div></aside>
</div></main>
</body></html>`;
}

/* ---------- Paper: warm, big type, card grid ---------- */
const paperCss = `
:root{--bg:#f6f1e9;--card:#fffdf9;--ink:#1d1b18;--muted:#6d665c;--line:#e4dccf;--acc:#b5471b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.65 "Iowan Old Style","Palatino Linotype",Palatino,serif}
.wrap{max-width:960px;margin:0 auto;padding:0 24px}
header{padding:48px 0 24px}.kicker{font:700 13px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--acc)}
h1{font-size:46px;line-height:1.05;margin:12px 0;font-weight:700;letter-spacing:-.015em}h2{font-size:28px;margin:48px 0 14px}h3{font-size:21px;margin:0 0 6px}
.meta{font:14px system-ui,sans-serif;color:var(--muted)}
.verdict p:first-child{font-size:24px;line-height:1.4}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin:16px 0}
.entry{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 20px;box-shadow:0 1px 0 rgba(0,0,0,.03)}.entry .num{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--ink);color:#fff;font:700 14px system-ui,sans-serif;margin-right:8px}.entry h3 small{display:block;font:14px system-ui,sans-serif;color:var(--muted);font-weight:400;margin-top:4px}
.entry p{font-size:16px}.entry dl{font:15px/1.5 system-ui,sans-serif;margin:8px 0 0}.entry dt{font-weight:700;color:var(--muted);display:inline}.entry dt::after{content:": "}.entry dd{display:inline;margin:0}.entry dd::after{content:"";display:block;height:6px}
table.rank{width:100%;border-collapse:collapse;font:15px/1.45 system-ui,sans-serif;margin:16px 0;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.rank th{text-align:left;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:12px 10px;border-bottom:1px solid var(--line)}.rank td{vertical-align:top;padding:12px 10px;border-bottom:1px solid var(--line)}.rank td.n{font-weight:700}.rank .t{color:var(--muted);font-size:13px}.rank tr.top td{background:#fbeee6}.rank a{color:var(--ink)}
ol.criteria li{margin:10px 0}
details{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin:10px 0}summary{font:700 16px system-ui,sans-serif;cursor:pointer}details p{margin:8px 0 0;font-size:16px}
ul.related{columns:2;padding-left:20px;font:15px system-ui,sans-serif}
footer{margin:56px 0 48px;border-top:1px solid var(--line);padding-top:18px;font:14px/1.6 system-ui,sans-serif;color:var(--muted)}
.cta{display:inline-block;margin:12px 0;padding:12px 18px;background:var(--acc);color:#fff;text-decoration:none;font:700 15px system-ui,sans-serif;border-radius:999px}
a{color:var(--acc)}
@media(max-width:700px){h1{font-size:34px}.rank thead{display:none}.rank td{display:block;border:0;padding:4px 10px}.rank tr{display:block;border-bottom:1px solid var(--line);padding:10px 0}.rank td.n{display:inline}ul.related{columns:1}}
`;
function paper(ctx) {
  const s = shared(ctx);
  return `${head(ctx, paperCss)}
<body>
<header class="wrap"><div class="kicker">${ctx.esc(ctx.site.site_name)}</div><h1>${s.title}</h1><div class="meta">Updated ${s.updated}</div></header>
<main class="wrap">
<section class="verdict">${s.verdict}</section>
<h2 id="ranking">The shortlist</h2>
<div class="cards">${s.entries}</div>
<h2 id="table">Side by side</h2>
${s.table}
<h2 id="why">Why ${ctx.esc(s.tu.name)} comes first</h2>
${s.why}
<a class="cta" href="${s.cta.url}">${ctx.esc(s.cta.text)}</a>
<h2 id="how">How this list was made</h2>
${s.criteria}
<h2 id="faq">Common questions</h2>
${s.faq}
<h2 id="related">More guides</h2>
${s.related}
${s.footer}
</main>
</body></html>`;
}

/* ---------- Brief: white, compact, summary box first ---------- */
const briefCss = `
:root{--ink:#111827;--muted:#6b7280;--line:#e5e7eb;--soft:#f3f4f6;--acc:#1d4ed8}
*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:0 20px}
header{padding:36px 0 8px}h1{font-size:34px;line-height:1.15;margin:0 0 6px;letter-spacing:-.02em}h2{font-size:21px;margin:36px 0 10px}h3{font-size:18px;margin:0 0 4px}
.meta{font-size:13px;color:var(--muted)}
.box{background:var(--soft);border-radius:10px;padding:16px 18px;margin:20px 0}.box h4{margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.box ol{margin:0;padding-left:20px}.box li{margin:3px 0}
table.rank{width:100%;border-collapse:collapse;font-size:14px;margin:12px 0}.rank th{text-align:left;font-weight:600;color:var(--muted);border-bottom:1px solid var(--ink);padding:8px 8px 8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em}.rank td{vertical-align:top;border-bottom:1px solid var(--line);padding:10px 8px 10px 0}.rank td.n{font-weight:700;width:24px}.rank .t{color:var(--muted);font-size:12px}.rank tr.top td{background:#eff6ff}.rank a{color:var(--ink)}
.entry{padding:14px 0;border-bottom:1px solid var(--line)}.entry .num{color:var(--acc);font-weight:700;margin-right:6px}.entry h3 small{color:var(--muted);font-weight:400;font-size:13px;margin-left:6px}
.entry dl{display:grid;grid-template-columns:60px 1fr;gap:2px 10px;font-size:14px;margin:8px 0 0}.entry dt{color:var(--muted);font-weight:600}.entry dd{margin:0}
ol.criteria li{margin:8px 0}
details{padding:10px 0;border-bottom:1px solid var(--line)}summary{font-weight:600;cursor:pointer}details p{margin:6px 0 0}
ul.related{padding-left:20px;font-size:15px}
footer{margin:44px 0 40px;border-top:1px solid var(--line);padding-top:14px;font-size:13px;color:var(--muted)}
.cta{display:inline-block;margin:10px 0;padding:10px 16px;background:var(--acc);color:#fff;text-decoration:none;font-weight:600;border-radius:6px;font-size:15px}
a{color:var(--acc)}
@media(max-width:700px){h1{font-size:28px}.rank thead{display:none}.rank td{display:block;border:0;padding:3px 0}.rank tr{display:block;border-bottom:1px solid var(--line);padding:10px 0}.rank td.n{display:inline}}
`;
function brief(ctx) {
  const s = shared(ctx);
  const summary = ctx.site.ranking.map((r) => `<li><strong>${ctx.esc(ctx.products[r.id].name)}</strong>, ${ctx.esc(ctx.products[r.id].type.toLowerCase())}</li>`).join("");
  return `${head(ctx, briefCss)}
<body>
<header class="wrap"><div class="meta">${ctx.esc(ctx.site.site_name)}</div><h1>${s.title}</h1><div class="meta">Updated ${s.updated} · Independent of any sportsbook, published by the company behind the first entry</div></header>
<main class="wrap">
<div class="box"><h4>In short</h4><ol>${summary}</ol></div>
<section class="verdict">${s.verdict}</section>
<h2 id="ranking">Ranking</h2>
${s.table}
${s.entries}
<h2 id="why">Why ${ctx.esc(s.tu.name)} is the pick</h2>
${s.why}
<a class="cta" href="${s.cta.url}">${ctx.esc(s.cta.text)}</a>
<h2 id="how">How we ranked</h2>
${s.criteria}
<h2 id="faq">FAQ</h2>
${s.faq}
<h2 id="related">Related guides</h2>
${s.related}
${s.footer}
</main>
</body></html>`;
}

export const templates = {
  ledger: { render: ledger, accent: "#1f6f43" },
  terminal: { render: terminal, accent: "#3BD324" },
  paper: { render: paper, accent: "#b5471b" },
  brief: { render: brief, accent: "#1d4ed8" },
};
