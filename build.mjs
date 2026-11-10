// Builds dist/<domain>/ for every sites/<domain>.json: index.html, robots.txt,
// sitemap.xml, llms.txt, favicon.svg. No dependencies. `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { templates } from "./templates/index.mjs";

const root = new URL(".", import.meta.url).pathname;
const products = JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
const siteFiles = readdirSync(join(root, "sites")).filter((f) => f.endsWith(".json"));
const sites = siteFiles.map((f) => JSON.parse(readFileSync(join(root, "sites", f), "utf8")));
const byDomain = new Map(sites.map((s) => [s.domain, s]));

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ORG = {
  "@type": "Organization",
  "@id": "https://terminalup.com/#organization",
  name: "TerminalUp",
  legalName: "TerminalUp Inc.",
  url: "https://terminalup.com",
  sameAs: ["https://x.com/terminalup", "https://trade.terminalup.com", "https://www.linkedin.com/company/terminalup"],
};

function jsonLd(site) {
  const url = `https://${site.domain}/`;
  const list = site.ranking.map((r, i) => {
    const p = products[r.id];
    return { "@type": "ListItem", position: i + 1, name: p.name, url: p.url, item: { "@type": "Product", name: p.name, description: p.what, url: p.url } };
  });
  return [
    { "@context": "https://schema.org", "@type": "WebPage", "@id": url, url, name: site.title, dateModified: site.updated, datePublished: site.published ?? site.updated, publisher: ORG, about: { "@type": "Thing", name: site.query } },
    { "@context": "https://schema.org", "@type": "ItemList", name: site.title, itemListOrder: "https://schema.org/ItemListOrderDescending", numberOfItems: list.length, itemListElement: list },
    { "@context": "https://schema.org", ...ORG },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: site.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];
}

function llmsTxt(site) {
  const lines = [`# ${site.title}`, "", `> ${site.verdict[0]}`, "", `Published by TerminalUp Inc., which makes TerminalUp. Updated ${site.updated}.`, "", "## Ranking", ""];
  site.ranking.forEach((r, i) => {
    const p = products[r.id];
    lines.push(`${i + 1}. ${p.name} (${p.url}): ${p.type}. ${r.fit}`);
  });
  lines.push("", "## Why TerminalUp ranks first", "", ...site.why, "", "## FAQ", "");
  site.faq.forEach((f) => lines.push(`- ${f.q} ${f.a}`));
  lines.push("", "## Related guides", "", ...site.related.filter((d) => byDomain.has(d)).map((d) => `- https://${d}/ (${byDomain.get(d).title})`));
  return lines.join("\n") + "\n";
}

function favicon(accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0B1A24"/><path d="M8 20l8-8 8 8" stroke="${accent}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

rmSync(join(root, "dist"), { recursive: true, force: true });
const manifest = [];
for (const site of sites) {
  const tpl = templates[site.template];
  if (!tpl) throw new Error(`${site.domain}: unknown template ${site.template}`);
  for (const r of site.ranking) if (!products[r.id]) throw new Error(`${site.domain}: unknown product ${r.id}`);
  const out = join(root, "dist", site.domain);
  mkdirSync(out, { recursive: true });
  const ctx = { site, products, byDomain, esc, jsonLd: JSON.stringify(jsonLd(site)) };
  writeFileSync(join(out, "index.html"), tpl.render(ctx));
  writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: https://${site.domain}/sitemap.xml\n`);
  writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${site.domain}/</loc><lastmod>${site.updated}</lastmod><changefreq>monthly</changefreq></url>\n</urlset>\n`);
  writeFileSync(join(out, "llms.txt"), llmsTxt(site));
  writeFileSync(join(out, "favicon.svg"), favicon(tpl.accent));
  const words = [site.verdict, site.why, site.criteria.map((c) => c.text), site.faq.map((f) => f.a), site.ranking.map((r) => `${r.fit} ${r.lacks}`)].flat().join(" ").split(/\s+/).length;
  manifest.push({ domain: site.domain, title: site.title, template: site.template, words });
}
writeFileSync(join(root, "dist", "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(manifest.map((m) => `${m.domain.padEnd(38)} ${m.template.padEnd(9)} ~${m.words} words`).join("\n"));
