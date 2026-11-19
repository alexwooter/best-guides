// Calculator widgets embedded in article pages. Each widget is plain HTML plus a small
// inline script. The math lives in SHARED, which is also exported so the build can test it
// in Node without a browser.

// Odds math. American <-> decimal <-> fractional <-> implied probability.
export const SHARED = `
function toDec(s){s=String(s).trim().replace(/\\s+/g,"");if(!s)return NaN;
 if(/^[+-]\\d+(\\.\\d+)?$/.test(s)){var a=parseFloat(s);if(Math.abs(a)<100)return NaN;return a>0?1+a/100:1+100/Math.abs(a);}
 if(/^\\d+(\\.\\d+)?\\/\\d+(\\.\\d+)?$/.test(s)){var p=s.split("/");var d=parseFloat(p[1]);if(!d)return NaN;return 1+parseFloat(p[0])/d;}
 if(/^\\d+(\\.\\d+)?%$/.test(s)){var q=parseFloat(s)/100;return q>0&&q<1?1/q:NaN;}
 if(/^\\d+(\\.\\d+)?$/.test(s)){var v=parseFloat(s);if(v>=100)return 1+v/100;if(v>1)return v;return NaN;}
 return NaN;}
function toAm(d){if(!(d>1))return NaN;return d>=2?Math.round((d-1)*100):Math.round(-100/(d-1));}
function amStr(d){var a=toAm(d);if(isNaN(a))return "\\u2014";return (a>0?"+":"")+a;}
function toFrac(d){if(!(d>1))return "\\u2014";var x=d-1,best=[1,1],err=1e9;for(var q=1;q<=100;q++){var p=Math.round(x*q);var e=Math.abs(x-p/q);if(e<err-1e-12){err=e;best=[p,q];}}return best[0]+"/"+best[1];}
function prob(d){return d>1?1/d:NaN;}
function pct(x,n){return isNaN(x)?"\\u2014":(x*100).toFixed(n==null?2:n)+"%";}
function money(x){if(isNaN(x))return "\\u2014";var s=Math.abs(x).toFixed(2).replace(/\\B(?=(\\d{3})+(?!\\d))/g,",");return (x<0?"-$":"$")+s;}
function num(x,n){return isNaN(x)?"\\u2014":x.toFixed(n==null?3:n);}
function devig(ds){var ps=ds.map(prob);var s=ps.reduce(function(a,b){return a+b},0);return {over:s-1,fair:ps.map(function(p){return p/s}),fairDec:ps.map(function(p){return s/p})};}
function $(id){return document.getElementById(id);}
function val(id){return $(id).value;}
function out(id,v){$(id).textContent=v;}
function bind(ids,fn){ids.forEach(function(i){$(i).addEventListener("input",fn);});fn();}
`;

const field = (id, label, value, hint = "", type = "text") => `<label class="f"><span>${label}</span><input id="${id}" type="${type}" inputmode="decimal" value="${value}" autocomplete="off"${hint ? ` placeholder="${hint}"` : ""}></label>`;
const res = (id, label, big = false) => `<div class="r${big ? " big" : ""}"><span>${label}</span><output id="${id}">—</output></div>`;

export const WIDGETS = {
  // Implied probability + conversion for one price, and a two-way no-vig view.
  implied: {
    name: "Implied probability calculator",
    html: `
<div class="calc" id="calc">
<h2>Implied probability calculator</h2>
<p class="hint">Type odds in any format: American (-110, +150), decimal (1.91), fractional (10/11) or a percentage. The two-way section removes the vig so you can see the fair probability.</p>
<div class="row">${field("o1", "Odds", "-110")}</div>
<div class="grid3">${res("p1", "Implied probability", true)}${res("d1", "Decimal")}${res("a1", "American")}${res("f1", "Fractional")}${res("b1", "Break-even win rate")}</div>
<h3>Two-way market, vig removed</h3>
<div class="row">${field("s1", "Side A odds", "-110")}${field("s2", "Side B odds", "-110")}</div>
<div class="grid3">${res("ov", "Vig (overround)", true)}${res("fa", "Fair probability A")}${res("fb", "Fair probability B")}${res("fao", "Fair odds A")}${res("fbo", "Fair odds B")}${res("hold", "Hold on a balanced book")}</div>
</div>`,
    js: `
function run(){var d=toDec(val("o1"));out("p1",pct(prob(d)));out("d1",num(d));out("a1",amStr(d));out("f1",toFrac(d));out("b1",pct(prob(d)));
 var a=toDec(val("s1")),b=toDec(val("s2"));if(a>1&&b>1){var v=devig([a,b]);out("ov",pct(v.over));out("fa",pct(v.fair[0]));out("fb",pct(v.fair[1]));out("fao",amStr(v.fairDec[0])+" ("+num(v.fairDec[0])+")");out("fbo",amStr(v.fairDec[1])+" ("+num(v.fairDec[1])+")");out("hold",pct(v.over/(1+v.over)));}else{["ov","fa","fb","fao","fbo","hold"].forEach(function(i){out(i,"\\u2014")});}}
bind(["o1","s1","s2"],run);`,
  },

  // Vig / hold across two or three outcomes.
  vig: {
    name: "Vig calculator",
    html: `
<div class="calc" id="calc">
<h2>Vig calculator</h2>
<p class="hint">Enter the price on each side of a market. Leave the third box empty for a two-way market. The calculator shows the overround, the hold, and the fair (no-vig) price for each side.</p>
<div class="row">${field("v1", "Outcome 1", "-110")}${field("v2", "Outcome 2", "-110")}${field("v3", "Outcome 3 (optional)", "", "e.g. +240")}</div>
<div class="grid3">${res("vo", "Vig (overround)", true)}${res("vh", "Hold", true)}${res("vp", "Implied total")}${res("f1", "Fair price 1")}${res("f2", "Fair price 2")}${res("f3", "Fair price 3")}</div>
<p class="hint">Overround is the sum of implied probabilities minus 100%. Hold is the book's expected margin on balanced action: overround divided by (1 + overround). Fair prices use the multiplicative method, which scales each side by the same factor.</p>
</div>`,
    js: `
function run(){var ds=[val("v1"),val("v2"),val("v3")].map(toDec).filter(function(d){return d>1});
 if(ds.length<2){["vo","vh","vp","f1","f2","f3"].forEach(function(i){out(i,"\\u2014")});return;}
 var v=devig(ds);out("vo",pct(v.over));out("vh",pct(v.over/(1+v.over)));out("vp",pct(1+v.over));
 ["f1","f2","f3"].forEach(function(id,i){out(id,i<ds.length?amStr(v.fairDec[i])+" ("+pct(v.fair[i])+")":"\\u2014");});}
bind(["v1","v2","v3"],run);`,
  },

  // Hedge: equal profit either way, or lock a chosen amount.
  hedge: {
    name: "Hedge calculator",
    html: `
<div class="calc" id="calc">
<h2>Hedge calculator</h2>
<p class="hint">Your original bet and the price now available on the other side. The calculator gives the hedge stake that pays the same either way, and what you keep.</p>
<div class="row">${field("hs", "Original stake ($)", "100")}${field("ho", "Original odds", "+300")}${field("hh", "Hedge odds (other side)", "-150")}</div>
<div class="grid3">${res("hst", "Hedge stake for equal profit", true)}${res("hp", "Locked profit", true)}${res("hr", "Locked return on total risk")}${res("hw1", "If the original wins, net")}${res("hw2", "If the hedge wins, net")}${res("hb", "Break-even hedge odds")}</div>
<p class="hint">Equal-profit hedge stake = (original stake x original decimal odds) / hedge decimal odds. If the hedge price is worse than the break-even odds, hedging locks a loss; sometimes the right move is to hedge part of it or not at all.</p>
</div>`,
    js: `
function run(){var s=parseFloat(val("hs")),o=toDec(val("ho")),h=toDec(val("hh"));
 if(!(s>0)||!(o>1)||!(h>1)){["hst","hp","hr","hw1","hw2","hb"].forEach(function(i){out(i,"\\u2014")});return;}
 var payout=s*o,hs=payout/h,profit=payout-s-hs;out("hst",money(hs));out("hp",money(profit));out("hr",pct(profit/(s+hs)));
 out("hw1",money(payout-s-hs));out("hw2",money(hs*h-hs-s));var be=payout/(payout-s);out("hb",amStr(be)+" ("+num(be)+")");}
bind(["hs","ho","hh"],run);`,
  },

  // Expected value with an optional fair line from a sharp source.
  ev: {
    name: "EV calculator",
    html: `
<div class="calc" id="calc">
<h2>Expected value calculator</h2>
<p class="hint">Enter the odds you can bet and your estimate of the true win probability. Or paste a sharp two-way line and the calculator takes the fair probability from it, vig removed.</p>
<div class="row">${field("eo", "Odds you can bet", "+105")}${field("es", "Stake ($)", "100")}${field("ep", "Your win probability (%)", "52.4")}</div>
<div class="row">${field("ea", "Sharp line, your side (optional)", "", "e.g. -105")}${field("eb", "Sharp line, other side (optional)", "", "e.g. -115")}</div>
<div class="grid3">${res("evd", "EV per bet", true)}${res("evp", "EV as % of stake", true)}${res("efp", "Fair probability used")}${res("ebe", "Break-even probability at your odds")}${res("eedge", "Edge (fair minus break-even)")}${res("efo", "Fair odds")}</div>
<p class="hint">EV = (win probability x profit if it wins) minus (loss probability x stake). A positive number means the price is better than the true chance; it says nothing about any single result.</p>
</div>`,
    js: `
function run(){var o=toDec(val("eo")),s=parseFloat(val("es")),p=parseFloat(val("ep"))/100,a=toDec(val("ea")),b=toDec(val("eb"));
 var src="your estimate";if(a>1&&b>1){p=devig([a,b]).fair[0];src="sharp line, no-vig";}
 if(!(o>1)||!(s>0)||!(p>0&&p<1)){["evd","evp","efp","ebe","eedge","efo"].forEach(function(i){out(i,"\\u2014")});return;}
 var ev=p*s*(o-1)-(1-p)*s;out("evd",money(ev));out("evp",pct(ev/s));out("efp",pct(p)+" ("+src+")");out("ebe",pct(1/o));out("eedge",pct(p-1/o));out("efo",amStr(1/p)+" ("+num(1/p)+")");}
bind(["eo","es","ep","ea","eb"],run);`,
  },

  // Kelly stake with fractional options.
  kelly: {
    name: "Kelly calculator",
    html: `
<div class="calc" id="calc">
<h2>Kelly criterion calculator</h2>
<p class="hint">Bankroll, the odds on offer and your win probability. Full Kelly maximises long-run growth but swings hard; most people who use it bet a quarter or a half of it.</p>
<div class="row">${field("kb", "Bankroll ($)", "10000")}${field("ko", "Odds", "-110")}${field("kp", "Win probability (%)", "55")}</div>
<div class="grid3">${res("kf", "Full Kelly stake", true)}${res("kh", "Half Kelly")}${res("kq", "Quarter Kelly")}${res("kpc", "Full Kelly as % of bankroll")}${res("ke", "Edge at these odds")}${res("kg", "Expected growth per bet, full Kelly")}</div>
<p class="hint">Kelly fraction = (b x p - q) / b, where b is the decimal odds minus 1, p the win probability and q = 1 - p. A negative result means the bet has no edge and the stake is zero.</p>
</div>`,
    js: `
function run(){var B=parseFloat(val("kb")),o=toDec(val("ko")),p=parseFloat(val("kp"))/100;
 if(!(B>0)||!(o>1)||!(p>0&&p<1)){["kf","kh","kq","kpc","ke","kg"].forEach(function(i){out(i,"\\u2014")});return;}
 var b=o-1,q=1-p,f=(b*p-q)/b;if(f<0)f=0;out("kf",money(B*f));out("kh",money(B*f/2));out("kq",money(B*f/4));out("kpc",pct(f));out("ke",pct(p-1/o));
 var g=f>0?p*Math.log(1+f*b)+q*Math.log(1-f):0;out("kg",pct(g,3));}
bind(["kb","ko","kp"],run);`,
  },

  // Closing line value: price taken vs closing price, vig removed when both sides are given.
  clv: {
    name: "Closing line value calculator",
    html: `
<div class="calc" id="calc">
<h2>Closing line value calculator</h2>
<p class="hint">The price you took and the price the market closed at. Add the other side of the closing line to remove the vig and get a cleaner read.</p>
<div class="row">${field("cb", "Odds you bet", "-105")}${field("cc", "Closing odds, your side", "-120")}${field("co", "Closing odds, other side (optional)", "", "e.g. +100")}</div>
<div class="grid3">${res("clv", "CLV (probability points)", true)}${res("clvp", "CLV as % of implied probability", true)}${res("cbp", "Implied probability you bet")}${res("ccp", "Closing probability")}${res("cev", "Implied EV at the close")}${res("cf", "Fair closing price")}</div>
<p class="hint">Positive CLV means you beat the close: the market later priced your side as more likely than when you bet it. Over hundreds of bets it is the most reliable sign of an edge.</p>
</div>`,
    js: `
function run(){var b=toDec(val("cb")),c=toDec(val("cc")),o=toDec(val("co"));
 if(!(b>1)||!(c>1)){["clv","clvp","cbp","ccp","cev","cf"].forEach(function(i){out(i,"\\u2014")});return;}
 var pb=prob(b),pc=prob(c),fairDec=c;if(o>1){var v=devig([c,o]);pc=v.fair[0];fairDec=v.fairDec[0];}
 out("clv",pct(pc-pb));out("clvp",pct((pc-pb)/pb));out("cbp",pct(pb));out("ccp",pct(pc));out("cev",pct(pc*(b-1)-(1-pc)));out("cf",amStr(fairDec)+" ("+num(fairDec)+")");}
bind(["cb","cc","co"],run);`,
  },

  // Converter: one price, every format, used on the "how to read odds" page.
  converter: {
    name: "Odds converter",
    html: `
<div class="calc" id="calc">
<h2>Odds converter</h2>
<p class="hint">Enter a price in any format and read it in the others. Profit and payout assume a $100 stake.</p>
<div class="row">${field("x1", "Odds", "+150")}</div>
<div class="grid3">${res("xa", "American", true)}${res("xd", "Decimal", true)}${res("xf", "Fractional", true)}${res("xp", "Implied probability")}${res("xw", "Profit on $100")}${res("xr", "Total return on $100")}</div>
</div>`,
    js: `
function run(){var d=toDec(val("x1"));out("xa",amStr(d));out("xd",num(d));out("xf",toFrac(d));out("xp",pct(prob(d)));out("xw",money(d>1?(d-1)*100:NaN));out("xr",money(d>1?d*100:NaN));}
bind(["x1"],run);`,
  },

  // Unit sizing for the bankroll page: flat units and a Kelly cross-check.
  units: {
    name: "Bankroll unit calculator",
    html: `
<div class="calc" id="calc">
<h2>Bankroll and unit size calculator</h2>
<p class="hint">Pick a unit size as a percentage of bankroll, then see what a losing run does to it. The Kelly line shows what the math would size a 55% bet at -110 for comparison.</p>
<div class="row">${field("ub", "Bankroll ($)", "10000")}${field("uu", "Unit size (% of bankroll)", "1")}${field("ul", "Losing streak to test (bets)", "10")}</div>
<div class="grid3">${res("u1", "One unit", true)}${res("ud", "Bankroll after the losing streak", true)}${res("udd", "Drawdown")}${res("ur", "Bets to lose half the bankroll at this size")}${res("uk", "Full Kelly for a 55% bet at -110")}${res("uq", "Quarter Kelly for the same bet")}</div>
<p class="hint">Flat staking at 1 to 2% of bankroll is the common professional range. Half the bankroll lost at 1% units takes about 69 straight losses; at 5% units it takes 14.</p>
</div>`,
    js: `
function run(){var B=parseFloat(val("ub")),u=parseFloat(val("uu"))/100,L=parseInt(val("ul"),10);
 if(!(B>0)||!(u>0&&u<1)||!(L>=0)){["u1","ud","udd","ur","uk","uq"].forEach(function(i){out(i,"\\u2014")});return;}
 var unit=B*u,after=B*Math.pow(1-u,L);out("u1",money(unit));out("ud",money(after));out("udd",pct((B-after)/B));out("ur",Math.ceil(Math.log(0.5)/Math.log(1-u))+" bets");
 var o=toDec("-110"),p=0.55,b=o-1,f=(b*p-(1-p))/b;out("uk",money(B*f)+" ("+pct(f)+")");out("uq",money(B*f/4));}
bind(["ub","uu","ul"],run);`,
  },
};

export const CALC_CSS = `
.calc{border:1px solid var(--line,#d9dee3);border-radius:12px;padding:20px 22px;margin:24px 0;background:var(--panel,rgba(0,0,0,.025))}
.calc h2{margin:0 0 6px;border:0;padding:0;font-size:22px}.calc h3{margin:18px 0 6px;font-size:16px}.calc .hint{font:14px/1.5 system-ui,sans-serif;color:var(--muted,#5c6975);margin:4px 0 12px}
.calc .row{display:flex;flex-wrap:wrap;gap:12px;margin:8px 0 14px}.calc .f{display:flex;flex-direction:column;gap:4px;font:600 12px/1.2 system-ui,sans-serif;color:var(--muted,#5c6975);letter-spacing:.04em;text-transform:uppercase;flex:1 1 160px}
.calc input{font:18px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;padding:10px 12px;border:1px solid var(--line,#c9d1d9);border-radius:8px;background:var(--bg,#fff);color:inherit;width:100%}
.calc .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.calc .r{background:var(--bg,#fff);border:1px solid var(--line,#e5e7eb);border-radius:8px;padding:10px 12px}.calc .r span{display:block;font:12px/1.3 system-ui,sans-serif;color:var(--muted,#5c6975)}.calc .r output{display:block;font:600 18px/1.3 ui-monospace,Menlo,monospace;margin-top:2px}.calc .r.big output{font-size:24px;color:var(--acc,#1f6f43)}
@media(max-width:700px){.calc .grid3{grid-template-columns:1fr 1fr}}
`;

export function calculator(key) {
  const w = WIDGETS[key];
  if (!w) throw new Error(`unknown calculator ${key}`);
  return { html: w.html, script: `<script>(function(){${SHARED}${w.js}})();</script>`, name: w.name };
}
