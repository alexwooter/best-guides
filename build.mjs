// Builds dist/<domain>/ for every sites/<domain>.json: index.html, robots.txt,
// sitemap.xml, llms.txt, favicon.svg. No dependencies. `node build.mjs`.
// Two content models: guides (a ranking of products) and articles (an explainer,
// how-to or calculator). data/redirects.json maps a domain to the domain it 301s to.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { templates, articleWords } from "./templates/index.mjs";
import { resolveLook, labels, faviconSvg } from "./templates/looks.mjs";

const root = new URL(".", import.meta.url).pathname;
const products = JSON.parse(readFileSync(join(root, "data/products.json"), "utf8"));
// Who publishes these guides and which product is the house product. Change this file to fork the play for another company.
const publisher = JSON.parse(readFileSync(join(root, "data/publisher.json"), "utf8"));
if (!products[publisher.product]) throw new Error(`data/publisher.json: product "${publisher.product}" is not in data/products.json`);
const redirects = existsSync(join(root, "data/redirects.json")) ? JSON.parse(readFileSync(join(root, "data/redirects.json"), "utf8")) : {};
const siteFiles = readdirSync(join(root, "sites")).filter((f) => f.endsWith(".json"));
const sites = siteFiles.map((f) => JSON.parse(readFileSync(join(root, "sites", f), "utf8")));
for (const s of sites) s.kind = s.kind ?? (s.ranking ? "guide" : "article");
const byDomain = new Map(sites.map((s) => [s.domain, s]));

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ORG = {
  "@type": "Organization",
  "@id": `${publisher.url}/#organization`,
  name: publisher.name,
  legalName: publisher.legalName,
  url: publisher.url,
  sameAs: publisher.sameAs ?? [],
};

const faqLd = (site) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: site.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });

function jsonLd(site) {
  const url = `https://${site.domain}/`;
  const page = { "@context": "https://schema.org", "@type": "WebPage", "@id": url, url, name: site.title, dateModified: site.updated, datePublished: site.published ?? site.updated, publisher: ORG, about: { "@type": "Thing", name: site.query } };
  if (site.kind === "guide") {
    const list = site.ranking.map((r, i) => {
      const p = products[r.id];
      return { "@type": "ListItem", position: i + 1, name: p.name, url: p.url };
    });
    return [page,
      { "@context": "https://schema.org", "@type": "ItemList", name: site.title, itemListOrder: "https://schema.org/ItemListOrderDescending", numberOfItems: list.length, itemListElement: list },
      { "@context": "https://schema.org", ...ORG }, faqLd(site)];
  }
  const out = [page,
    { "@context": "https://schema.org", "@type": "Article", "@id": `${url}#article`, headline: site.title, description: site.answer, datePublished: site.published ?? site.updated, dateModified: site.updated,
      author: ORG, publisher: ORG, mainEntityOfPage: url, about: { "@type": "Thing", name: site.query }, wordCount: articleWords(site), inLanguage: "en" },
    { "@context": "https://schema.org", ...ORG }, faqLd(site)];
  if (site.steps) out.push({ "@context": "https://schema.org", "@type": "HowTo", name: site.steps_title ?? site.title, description: site.answer, step: site.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })) });
  if (site.calculator) out.push({ "@context": "https://schema.org", "@type": "WebApplication", name: site.calculator_name ?? site.title, url, applicationCategory: "FinanceApplication", operatingSystem: "Any", browserRequirements: "Requires JavaScript", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, publisher: ORG });
  if (site.venues) out.push({ "@context": "https://schema.org", "@type": "ItemList", name: site.venues_title ?? "Venues", numberOfItems: site.venues.length, itemListElement: site.venues.map((v, i) => ({ "@type": "ListItem", position: i + 1, name: products[v.id].name, url: products[v.id].url })) });
  return out;
}

function llmsTxt(site) {
  const lines = [`# ${site.title}`, ""];
  if (site.kind === "guide") {
    lines.push(`> ${site.verdict[0]}`, "", `Published by ${publisher.legalName}, which makes ${publisher.name}. Updated ${site.updated}.`, "", "## Ranking", "");
    site.ranking.forEach((r, i) => { const p = products[r.id]; lines.push(`${i + 1}. ${p.name} (${p.url}): ${p.type}. ${r.fit}`); });
    lines.push("", `## Why ${publisher.name} ranks first`, "", ...site.why);
    for (const sec of site.sections ?? []) {
      lines.push("", `## ${sec.h2}`, "");
      for (const b of sec.blocks ?? []) {
        if (b.p) lines.push(b.p, "");
        else if (b.h3) lines.push(`### ${b.h3}`, "");
        else if (b.callout) lines.push(`> ${b.callout}`, "");
        else if (b.list) lines.push(...b.list.map((i) => `- ${i}`), "");
        else if (b.ol) lines.push(...b.ol.map((i, n) => `${n + 1}. ${i}`), "");
        else if (b.table) lines.push(`| ${b.table.head.join(" | ")} |`, `| ${b.table.head.map(() => "---").join(" | ")} |`, ...b.table.rows.map((r) => `| ${r.join(" | ")} |`), "");
        else if (b.source) lines.push(`${b.source.text} ${b.source.url}`, "");
      }
    }
  } else {
    lines.push(`> ${site.answer}`, "", `Published by ${publisher.legalName}, which makes ${publisher.name}. Updated ${site.updated}.`, "");
    for (const p of site.intro ?? []) lines.push(p, "");
    for (const sec of site.sections ?? []) {
      lines.push(`## ${sec.h2}`, "");
      for (const b of sec.blocks ?? []) {
        if (b.p) lines.push(b.p, "");
        else if (b.h3) lines.push(`### ${b.h3}`, "");
        else if (b.callout) lines.push(`> ${b.callout}`, "");
        else if (b.list) lines.push(...b.list.map((i) => `- ${i}`), "");
        else if (b.ol) lines.push(...b.ol.map((i, n) => `${n + 1}. ${i}`), "");
        else if (b.table) lines.push(`| ${b.table.head.join(" | ")} |`, `| ${b.table.head.map(() => "---").join(" | ")} |`, ...b.table.rows.map((r) => `| ${r.join(" | ")} |`), "");
        else if (b.source) lines.push(`${b.source.text} ${b.source.url}`, "");
      }
    }
    if (site.steps) lines.push(`## ${site.steps_title ?? "Step by step"}`, "", ...site.steps.map((s, i) => `${i + 1}. ${s.name}: ${s.text}`), "");
    if (site.venues) lines.push(`## ${site.venues_title ?? "Where to do it"}`, "", ...site.venues.map((v) => `- ${products[v.id].name} (${products[v.id].url}): ${v.note}${v.access ? ` ${v.access}` : ""}`), "");
    if (site.takeaways) lines.push("## Key takeaways", "", ...site.takeaways.map((t) => `- ${t}`), "");
    if (site.terminalup) lines.push(`## ${site.terminalup_title ?? `Where ${publisher.name} fits`}`, "", ...site.terminalup, "");
  }
  lines.push("", "## FAQ", "");
  site.faq.forEach((f) => lines.push(`- ${f.q} ${f.a}`));
  lines.push("", "## Related guides", "", ...site.related.filter((d) => byDomain.has(d)).map((d) => `- https://${d}/ (${byDomain.get(d).title})`));
  return lines.join("\n") + "\n";
}


function check(site) {
  const need = site.kind === "guide" ? ["domain", "template", "query", "site_name", "title", "updated", "verdict", "ranking", "why", "criteria", "faq", "related"]
    : ["domain", "template", "query", "site_name", "title", "updated", "answer", "sections", "faq", "related"];
  for (const k of need) if (site[k] === undefined) throw new Error(`${site.domain}: missing ${k}`);
  for (const r of site.ranking ?? []) if (!products[r.id]) throw new Error(`${site.domain}: unknown product ${r.id}`);
  for (const v of site.venues ?? []) if (!products[v.id]) throw new Error(`${site.domain}: unknown venue ${v.id}`);
  for (const d of site.related) if (!byDomain.has(d) && !redirects[d]) console.warn(`${site.domain}: related ${d} is not built (dropped)`);
  if (redirects[site.domain]) throw new Error(`${site.domain} has a page and a redirect`);
}

rmSync(join(root, "dist"), { recursive: true, force: true });
const manifest = [];
for (const site of sites) {
  const tpl = templates[site.template];
  if (!tpl) throw new Error(`${site.domain}: unknown template ${site.template}`);
  check(site);
  const out = join(root, "dist", site.domain);
  mkdirSync(out, { recursive: true });
  const look = resolveLook(site);
  const ctx = { site, products, publisher, byDomain, esc, jsonLd: JSON.stringify(jsonLd(site)), look, labels: labels(look, site.kind) };
  writeFileSync(join(out, "index.html"), tpl.render(ctx));
  writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: https://${site.domain}/sitemap.xml\n`);
  writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${site.domain}/</loc><lastmod>${site.updated}</lastmod><changefreq>monthly</changefreq></url>\n</urlset>\n`);
  writeFileSync(join(out, "llms.txt"), llmsTxt(site));
  writeFileSync(join(out, "favicon.svg"), faviconSvg(look));
  const words = site.kind === "guide"
    ? [site.verdict, site.why, site.criteria.map((c) => c.text), site.faq.map((f) => f.a), site.ranking.map((r) => `${r.fit} ${r.lacks}`),
        (site.sections ?? []).flatMap((sec) => [sec.h2, ...(sec.blocks ?? []).flatMap((b) => [b.p, b.h3, b.callout, ...(b.list ?? []), ...(b.ol ?? []), ...(b.table ? b.table.rows.flat() : [])])]).filter(Boolean)].flat().join(" ").split(/\s+/).length
    : articleWords(site);
  manifest.push({ domain: site.domain, title: site.title, template: site.template, kind: site.kind, words, look: `${look.palette.id}/${look.type.id}/${site.kind === "guide" ? site.template : (site.layout ?? look.layout)}/${look.h2}` });
}
for (const [from, to] of Object.entries(redirects)) if (!byDomain.has(to)) throw new Error(`redirect ${from} -> ${to}: target has no page`);
writeFileSync(join(root, "dist", "manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(join(root, "dist", "redirects.json"), JSON.stringify(redirects, null, 2));
console.log(manifest.map((m) => `${m.domain.padEnd(40)} ${m.kind.padEnd(7)} ${m.look.padEnd(44)} ~${m.words} words`).join("\n"));
console.log(`${manifest.length} pages, ${Object.keys(redirects).length} redirects`);
