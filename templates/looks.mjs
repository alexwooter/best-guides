// Per-site design: palette, type, layout, heading style, section order, labels and favicon.
// A site's look is stored in its JSON (`look`) so it stays stable; `assignLooks` spreads the
// combinations across the whole set so no two sites share more than one or two traits.

export const PALETTES = [
  { id: "ivory-green", mode: "light", bg: "#fbfaf7", panel: "#f1efe8", ink: "#17212b", muted: "#5c6975", line: "#d9dee3", acc: "#1f6f43", onacc: "#ffffff", soft: "#eef6f0" },
  { id: "white-blue", mode: "light", bg: "#ffffff", panel: "#f3f4f6", ink: "#111827", muted: "#6b7280", line: "#e5e7eb", acc: "#1d4ed8", onacc: "#ffffff", soft: "#eff6ff" },
  { id: "paper-rust", mode: "light", bg: "#f6f1e9", panel: "#fffdf9", ink: "#1d1b18", muted: "#6d665c", line: "#e4dccf", acc: "#b5471b", onacc: "#ffffff", soft: "#fbeee6" },
  { id: "slate-lime", mode: "dark", bg: "#0d1117", panel: "#131a22", ink: "#e6edf3", muted: "#8b98a5", line: "#263040", acc: "#3bd324", onacc: "#0b1a24", soft: "#15231a" },
  { id: "navy-gold", mode: "dark", bg: "#0b1a24", panel: "#122633", ink: "#e8eef2", muted: "#8fa3b0", line: "#1f3542", acc: "#f0b429", onacc: "#0b1a24", soft: "#1a2e3a" },
  { id: "mint", mode: "light", bg: "#f4faf7", panel: "#e7f3ec", ink: "#0f2a1f", muted: "#4f6b5e", line: "#cfe3d8", acc: "#0e7c5b", onacc: "#ffffff", soft: "#dff0e7" },
  { id: "sand-black", mode: "light", bg: "#faf7f0", panel: "#f0eadc", ink: "#121212", muted: "#5f5a4e", line: "#e0d8c6", acc: "#111111", onacc: "#ffffff", soft: "#ebe4d3" },
  { id: "gray-violet", mode: "light", bg: "#f7f7fb", panel: "#ececf5", ink: "#1b1b2f", muted: "#5f5f7a", line: "#d9d9ea", acc: "#5b3fd9", onacc: "#ffffff", soft: "#e6e1fa" },
  { id: "charcoal-orange", mode: "dark", bg: "#161616", panel: "#1f1f1f", ink: "#f2f2f2", muted: "#9a9a9a", line: "#2e2e2e", acc: "#ff7a1a", onacc: "#111111", soft: "#2a2118" },
  { id: "white-brick", mode: "light", bg: "#ffffff", panel: "#f4f6fa", ink: "#0f172a", muted: "#64748b", line: "#e2e8f0", acc: "#c2410c", onacc: "#ffffff", soft: "#fff1e8" },
  { id: "forest", mode: "dark", bg: "#0f1a14", panel: "#16241c", ink: "#e4efe8", muted: "#8ea89a", line: "#243a2e", acc: "#8fd14f", onacc: "#0f1a14", soft: "#1c3024" },
  { id: "wine", mode: "light", bg: "#fdfafa", panel: "#f6ecec", ink: "#2a1317", muted: "#7a5a60", line: "#e9d6d9", acc: "#8b1e3f", onacc: "#ffffff", soft: "#f7e3e8" },
  { id: "sky", mode: "light", bg: "#f3f8fc", panel: "#e5eff8", ink: "#10233a", muted: "#52697f", line: "#cfdeec", acc: "#0369a1", onacc: "#ffffff", soft: "#dcebf7" },
  { id: "graphite-teal", mode: "dark", bg: "#101418", panel: "#171d23", ink: "#e7ecf0", muted: "#8c98a4", line: "#27313b", acc: "#2dd4bf", onacc: "#0c1215", soft: "#15262a" },
  { id: "cream-navy", mode: "light", bg: "#fffdf5", panel: "#f5f0dc", ink: "#0a1f3d", muted: "#4b5a73", line: "#e6dfc4", acc: "#0a1f3d", onacc: "#fffdf5", soft: "#ebe6cf" },
  { id: "plum", mode: "dark", bg: "#16101c", panel: "#1f1727", ink: "#efe8f5", muted: "#a393b3", line: "#2f2440", acc: "#e879f9", onacc: "#16101c", soft: "#2a1e36" },
  { id: "stone-red", mode: "light", bg: "#f5f5f4", panel: "#e7e5e4", ink: "#1c1917", muted: "#57534e", line: "#d6d3d1", acc: "#b91c1c", onacc: "#ffffff", soft: "#fee2e2" },
  { id: "ice-indigo", mode: "light", bg: "#f8fafc", panel: "#eef2ff", ink: "#1e1b4b", muted: "#4c4f7a", line: "#dde2f3", acc: "#4338ca", onacc: "#ffffff", soft: "#e0e7ff" },
];

// Body and heading pairings. All system stacks; no web fonts, so pages stay fast.
export const TYPE = [
  { id: "georgia", body: 'Georgia,"Times New Roman",serif', head: 'Georgia,"Times New Roman",serif', size: 17 },
  { id: "system", body: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif', head: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif', size: 16 },
  { id: "palatino", body: '"Iowan Old Style","Palatino Linotype",Palatino,serif', head: '"Iowan Old Style","Palatino Linotype",Palatino,serif', size: 18 },
  { id: "inter", body: 'Inter,system-ui,sans-serif', head: 'Inter,system-ui,sans-serif', size: 16 },
  { id: "charter-sans", body: 'Charter,"Bitstream Charter","Sitka Text",Cambria,serif', head: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif', size: 17 },
  { id: "sans-serifhead", body: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif', head: 'Georgia,"Times New Roman",serif', size: 16 },
  { id: "avenir", body: '"Avenir Next",Avenir,"Helvetica Neue",Helvetica,Arial,sans-serif', head: '"Avenir Next",Avenir,"Helvetica Neue",Helvetica,Arial,sans-serif', size: 16 },
  { id: "baskerville", body: 'Baskerville,"Libre Baskerville","Times New Roman",serif', head: 'Baskerville,"Libre Baskerville","Times New Roman",serif', size: 18 },
  { id: "verdana", body: 'Verdana,Geneva,Tahoma,sans-serif', head: 'Verdana,Geneva,Tahoma,sans-serif', size: 15 },
  { id: "gill", body: '"Gill Sans","Gill Sans MT",Calibri,"Trebuchet MS",sans-serif', head: '"Gill Sans","Gill Sans MT",Calibri,"Trebuchet MS",sans-serif', size: 17 },
  { id: "monohead", body: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', head: 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace', size: 16 },
  { id: "palatino-sans", body: '"Iowan Old Style","Palatino Linotype",Palatino,serif', head: '"Avenir Next",Avenir,"Helvetica Neue",Helvetica,Arial,sans-serif', size: 17 },
];

export const H2 = ["plain", "rule-top", "underline", "numbered", "left-bar", "smallcaps"];
export const LAYOUTS = ["column", "sidebar", "hero", "compact", "split"];
export const ORDERS = ["A", "B", "C"];
export const RADII = [0, 4, 8, 14];
export const WIDTHS = [760, 820, 880, 940];
export const FAVICONS = ["chevron", "dot", "square", "bars", "slash", "ring", "tri"];

export const LABELS = {
  kickerArticle: ["Explainer", "Field guide", "Reference", "Primer", "Notes", "Briefing", "Handbook", "Guide"],
  kickerGuide: ["A buyer's guide", "Ranked", "The shortlist", "Compared", "Field guide", "Reviewed", "Rankings", "The list"],
  answer: ["Short answer", "In one paragraph", "The answer", "Quick answer", "Bottom line", "First, the answer", "In brief", "Summary"],
  takeaways: ["Key takeaways", "In short", "What to remember", "The short version", "Five things to keep", "If you read nothing else", "Recap", "Essentials"],
  faq: ["Questions people ask", "FAQ", "Common questions", "Before you go", "Asked often", "Questions", "People also ask", "Quick answers"],
  related: ["Related guides", "Keep reading", "More on this", "Elsewhere", "Further reading", "Next", "See also", "More guides"],
  tu: ["Where TerminalUp fits", "How TerminalUp handles this", "The TerminalUp approach", "A note on TerminalUp", "Doing this with TerminalUp", "TerminalUp and this problem", "Our product, briefly", "Disclosure and a tool"],
  footer: [
    "Published by {legal}, which makes {name}. Every other product is described from its own public materials. {disc} Updated {date}.",
    "{site} is published by {legal}, the company behind {name}. Other products are described from their own public materials. {disc} Last updated {date}.",
    "A {legal} publication. {legal} makes {name}; competitors are described from their own public materials. {disc} Updated {date}.",
    "Written and maintained by {legal}, maker of {name}. Descriptions of other products come from their public materials. {disc} Updated {date}.",
    "{legal} publishes this page and makes {name}. Everything said about other products comes from those products' own materials. {disc} Revised {date}.",
  ],
};

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

const pick = (arr, n) => arr[n % arr.length];

// Deterministic default when a site has no stored look.
export function defaultLook(domain) {
  const h = hashStr(domain);
  return {
    palette: pick(PALETTES, h).id, type: pick(TYPE, h >>> 3).id, h2: pick(H2, h >>> 6), layout: pick(LAYOUTS, h >>> 9), order: pick(ORDERS, h >>> 12),
    radius: pick(RADII, h >>> 14), width: pick(WIDTHS, h >>> 16), favicon: pick(FAVICONS, h >>> 18), label: (h >>> 20) % 8, footer: (h >>> 23) % LABELS.footer.length,
  };
}

// Spread looks across a set of domains so palette+type pairs never repeat and palettes are
// used as evenly as possible. Returns a map domain -> look. Existing looks are kept.
export function assignLooks(domains, existing = {}) {
  const out = { ...existing };
  const usedPair = new Set(Object.values(existing).map((l) => `${l.palette}|${l.type}`));
  const paletteCount = Object.fromEntries(PALETTES.map((p) => [p.id, 0]));
  for (const l of Object.values(existing)) if (l.palette in paletteCount) paletteCount[l.palette]++;
  const todo = domains.filter((d) => !out[d]).sort((a, b) => hashStr(a) - hashStr(b));
  todo.forEach((d, i) => {
    const h = hashStr(d);
    // least-used palette, ties broken by hash
    const minUse = Math.min(...Object.values(paletteCount));
    const candidates = PALETTES.filter((p) => paletteCount[p.id] === minUse);
    let palette = pick(candidates, h).id;
    let typeIdx = (h >>> 3) % TYPE.length;
    let tries = 0;
    while (usedPair.has(`${palette}|${TYPE[typeIdx].id}`) && tries < TYPE.length * PALETTES.length) {
      typeIdx = (typeIdx + 1) % TYPE.length;
      if (tries % TYPE.length === TYPE.length - 1) palette = PALETTES[(PALETTES.findIndex((p) => p.id === palette) + 1) % PALETTES.length].id;
      tries++;
    }
    usedPair.add(`${palette}|${TYPE[typeIdx].id}`);
    paletteCount[palette]++;
    out[d] = {
      palette, type: TYPE[typeIdx].id, h2: H2[i % H2.length], layout: LAYOUTS[(i + (h >>> 9)) % LAYOUTS.length], order: ORDERS[(h >>> 12) % ORDERS.length],
      radius: RADII[(h >>> 14) % RADII.length], width: WIDTHS[(i + (h >>> 16)) % WIDTHS.length], favicon: FAVICONS[(i + (h >>> 18)) % FAVICONS.length],
      label: (i + (h >>> 20)) % 8, footer: (i + (h >>> 23)) % LABELS.footer.length,
    };
  });
  return out;
}

export function resolveLook(site) {
  const l = { ...defaultLook(site.domain), ...(site.look ?? {}) };
  const palette = PALETTES.find((p) => p.id === l.palette) ?? PALETTES[0];
  const type = TYPE.find((t) => t.id === l.type) ?? TYPE[1];
  return { ...l, palette, type };
}

// CSS variables and the heading/shape rules shared by every layout.
export function lookCss(look) {
  const p = look.palette, t = look.type;
  const r = look.radius;
  const h2 = {
    "plain": "",
    "rule-top": "h2{border-top:1px solid var(--line);padding-top:20px}",
    "underline": "h2{padding-bottom:6px;border-bottom:3px solid var(--acc);display:inline-block}",
    "numbered": "main{counter-reset:h2}main h2::before{counter-increment:h2;content:counter(h2,decimal-leading-zero);display:block;font:700 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;color:var(--acc);margin-bottom:8px}",
    "left-bar": "h2{border-left:4px solid var(--acc);padding-left:14px}",
    "smallcaps": "h2{font-size:.95em;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:700}",
  }[look.h2] ?? "";
  return `:root{--bg:${p.bg};--panel:${p.panel};--card:${p.panel};--soft:${p.soft};--ink:${p.ink};--muted:${p.muted};--line:${p.line};--rule:${p.line};--acc:${p.acc};--onacc:${p.onacc};--r:${r}px;--w:${look.width}px}
body{font-family:${t.body};font-size:${t.size}px;color:var(--ink);background:var(--bg)}h1,h2,h3,h4{font-family:${t.head}}
.cta{border-radius:${r === 14 ? 999 : r}px;color:var(--onacc)}.rank tr.top td{background:var(--soft)}
${h2}`;
}

export function labels(look, kind) {
  const n = look.label ?? 0;
  const L = LABELS;
  return {
    kicker: pick(kind === "guide" ? L.kickerGuide : L.kickerArticle, n),
    answer: pick(L.answer, n), takeaways: pick(L.takeaways, n), faq: pick(L.faq, n), related: pick(L.related, n), tu: pick(L.tu, n),
    footer: L.footer[(look.footer ?? 0) % L.footer.length],
  };
}

export function faviconSvg(look) {
  const a = look.palette.acc, bg = look.palette.mode === "dark" ? look.palette.panel : look.palette.ink;
  const shapes = {
    chevron: `<path d="M8 20l8-8 8 8" stroke="${a}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    dot: `<circle cx="16" cy="16" r="7" fill="${a}"/>`,
    square: `<rect x="9" y="9" width="14" height="14" fill="${a}" transform="rotate(45 16 16)"/>`,
    bars: `<rect x="7" y="18" width="4" height="7" fill="${a}"/><rect x="14" y="12" width="4" height="13" fill="${a}"/><rect x="21" y="7" width="4" height="18" fill="${a}"/>`,
    slash: `<path d="M10 24L22 8" stroke="${a}" stroke-width="4" stroke-linecap="round"/>`,
    ring: `<circle cx="16" cy="16" r="8" stroke="${a}" stroke-width="3.5" fill="none"/>`,
    tri: `<path d="M16 8l9 16H7z" fill="${a}"/>`,
  };
  const rx = look.radius === 0 ? 2 : look.radius >= 14 ? 16 : 6;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="${rx}" fill="${bg}"/>${shapes[look.favicon] ?? shapes.chevron}</svg>`;
}
