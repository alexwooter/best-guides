// Server-rendered traffic dashboard. No client dependencies; the chart is inline SVG.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const n = (v) => Number(v).toLocaleString("en-US");

function chart(daily) {
  const W = 920, H = 220, L = 44, R = 12, T = 14, B = 30;
  const max = Math.max(1, ...daily.map((d) => Math.max(d.visitors, d.ai, d.pageviews)));
  const x = (i) => L + (i * (W - L - R)) / Math.max(1, daily.length - 1);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const line = (key) => daily.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((f) => {
    const v = Math.round(max * f);
    return `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="tick">${n(v)}</text><line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/>`;
  }).join("");
  const step = Math.max(1, Math.ceil(daily.length / 10));
  const labels = daily.map((d, i) => (i % step === 0 || i === daily.length - 1)
    ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="tick">${d.day.slice(5)}</text>` : "").join("");
  const dots = (key, cls) => daily.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(d[key]).toFixed(1)}" r="2.5" class="${cls}"><title>${d.day}: ${n(d[key])} ${key}</title></circle>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Daily visitors, pageviews and AI crawler hits">
${ticks}${labels}
<path d="${line("pageviews")}" class="l-pv"/><path d="${line("visitors")}" class="l-vis"/><path d="${line("ai")}" class="l-ai"/>
${dots("pageviews", "d-pv")}${dots("visitors", "d-vis")}${dots("ai", "d-ai")}
</svg>
<div class="legend"><span><i class="sw sw-vis"></i>Visitors</span><span><i class="sw sw-pv"></i>Pageviews</span><span><i class="sw sw-ai"></i>AI crawler hits</span></div>`;
}

export function renderDashboard(s, { key = "", path = "/_/dashboard" } = {}) {
  const q = (days) => `${path}?days=${days}${key ? `&key=${encodeURIComponent(key)}` : ""}`;
  const range = [1, 7, 30, 90].map((d) => `<a href="${q(d)}" class="${s.days === d ? "on" : ""}">${d === 1 ? "Today" : `${d} days`}</a>`).join("");
  const t = s.totals;
  const rows = s.domains.map((d) => `<tr>
<td><a href="https://${esc(d.host)}/" target="_blank" rel="noopener">${esc(d.host)}</a></td>
<td class="num">${n(d.visitors)}</td><td class="num">${n(d.pageviews)}</td><td class="num">${n(d.ai)}</td><td class="num">${n(d.search)}</td><td class="num">${n(d.llms)}</td>
<td class="num muted">${n(d.today.visitors)} / ${n(d.today.ai)}</td></tr>`).join("");
  const bots = s.aiBots.length ? s.aiBots.map((b) => `<tr><td>${esc(b.bot)}</td><td class="num">${n(b.hits)}</td></tr>`).join("") : `<tr><td colspan="2" class="muted">None yet</td></tr>`;
  const refs = s.referrers.length ? s.referrers.map((r) => `<tr><td>${esc(r.host)}</td><td class="num">${n(r.hits)}</td></tr>`).join("") : `<tr><td colspan="2" class="muted">None yet</td></tr>`;
  const quiet = s.domains.filter((d) => d.visitors === 0 && d.ai === 0 && d.search === 0).length;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Best guides traffic</title>
<style>
:root{--bg:#0d1117;--card:#161b22;--line:#30363d;--fg:#e6edf3;--muted:#8b949e;--vis:#58a6ff;--pv:#8b949e;--ai:#3fb950;--on:#1f6feb}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 20px 60px}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:28px 0 10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.sub{color:var(--muted);margin:0 0 18px}
.range a{display:inline-block;padding:6px 12px;border:1px solid var(--line);border-radius:6px;color:var(--fg);text-decoration:none;margin-right:6px}.range a.on{background:var(--on);border-color:var(--on)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0}
.tile{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 14px}.tile b{display:block;font-size:24px;font-weight:600}.tile span{color:var(--muted);font-size:12px}
.chart{width:100%;height:auto;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:6px}
.grid{stroke:var(--line);stroke-width:1}.tick{fill:var(--muted);font-size:11px}
.l-pv{fill:none;stroke:var(--pv);stroke-width:1.5;stroke-dasharray:4 3}.l-vis{fill:none;stroke:var(--vis);stroke-width:2}.l-ai{fill:none;stroke:var(--ai);stroke-width:2}
.d-pv{fill:var(--pv)}.d-vis{fill:var(--vis)}.d-ai{fill:var(--ai)}
.legend{display:flex;gap:18px;color:var(--muted);font-size:12px;margin:8px 2px 0}.sw{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}.sw-vis{background:var(--vis)}.sw-pv{background:var(--pv)}.sw-ai{background:var(--ai)}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:8px;overflow:hidden}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{color:var(--muted);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.03em}
tr:last-child td{border-bottom:0}.num{text-align:right;font-variant-numeric:tabular-nums}.muted{color:var(--muted)}
td a{color:var(--fg);text-decoration:none}td a:hover{text-decoration:underline}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:720px){.cols{grid-template-columns:1fr}.tiles{grid-template-columns:repeat(2,1fr)}}
.wrap{overflow-x:auto}
</style></head><body><main>
<h1>Best guides traffic</h1>
<p class="sub">${s.domains.length} domains · last ${s.days === 1 ? "day" : `${s.days} days`} · days in ${esc(s.tz)} · ${n(s.rows)} requests logged · storage: ${esc(s.storage)}</p>
<div class="range">${range}</div>
<div class="tiles">
<div class="tile"><b>${n(t.visitors)}</b><span>Visitors (people)</span></div>
<div class="tile"><b>${n(t.pageviews)}</b><span>Pageviews (people)</span></div>
<div class="tile"><b>${n(t.ai)}</b><span>AI crawler hits</span></div>
<div class="tile"><b>${n(t.search)}</b><span>Search bot hits</span></div>
<div class="tile"><b>${n(t.llms)}</b><span>llms.txt fetches</span></div>
<div class="tile"><b>${n(quiet)}</b><span>Domains with no traffic</span></div>
</div>
${chart(s.daily)}
<h2>Per domain</h2>
<div class="wrap"><table><thead><tr><th>Domain</th><th class="num">Visitors</th><th class="num">Pageviews</th><th class="num">AI hits</th><th class="num">Search hits</th><th class="num">llms.txt</th><th class="num">Today vis / AI</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="cols">
<div><h2>AI crawlers</h2><table><thead><tr><th>Bot</th><th class="num">Hits</th></tr></thead><tbody>${bots}</tbody></table></div>
<div><h2>Referrers (people)</h2><table><thead><tr><th>Source</th><th class="num">Visits</th></tr></thead><tbody>${refs}</tbody></table></div>
</div>
<p class="muted" style="margin-top:24px">Visitors are counted without cookies: one person is one hash of IP, browser and day. AI hits include GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot and the "-User" fetchers that fire when an assistant reads a page to answer someone. JSON: <code>${esc(path.replace("dashboard", "stats.json"))}?days=${s.days}</code>.</p>
</main></body></html>`;
}
