// Gives every sites/<domain>.json a stored `look` so the design stays stable, spreading
// palettes and type pairings across the set. Run after adding sites: node scripts/assign-looks.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { assignLooks } from "../templates/looks.mjs";
const root = new URL("..", import.meta.url).pathname;
const files = readdirSync(join(root, "sites")).filter((f) => f.endsWith(".json"));
const sites = files.map((f) => ({ f, s: JSON.parse(readFileSync(join(root, "sites", f), "utf8")) }));
const existing = Object.fromEntries(sites.filter((x) => x.s.look).map((x) => [x.s.domain, x.s.look]));
const looks = assignLooks(sites.map((x) => x.s.domain), existing);
let n = 0;
for (const { f, s } of sites) {
  if (s.look) continue;
  s.look = looks[s.domain];
  delete s.theme;
  writeFileSync(join(root, "sites", f), JSON.stringify(s, null, 2) + "\n");
  n++;
}
const pal = {}; for (const l of Object.values(looks)) pal[l.palette] = (pal[l.palette] ?? 0) + 1;
console.log(`${n} sites assigned; palette use:`, pal);
