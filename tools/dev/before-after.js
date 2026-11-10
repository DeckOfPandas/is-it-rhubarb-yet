// A dev-only review page: each food's dial as it was (research/helen/
// foods.yml, the data of 10 November 2026) beside its dial now (the site's
// shown view of _data/foods.yml), with the food's confidence, the rings
// the site hides, and how far each ring moved. Foods run by the size of
// the change, from research/out/comparison.csv: a food scores its most
// changed ring's in-season plus fresh weeks changed (compare.py's own
// sort key), its total across rings breaking ties.
//
// The dials are drawn as season-wheel.html draws them: one ring per
// variety, longest season outside, January at the top, in season in the
// ring's colour, just about mixed into the off-season grey, storage
// faded further. Writes one self-contained file. Nothing in the build or
// the deploy runs this, so the page never ships.
//
// usage: node tools/dev/before-after.js [<site dir>]   (default _site)
//        then open <base>/dev/before-after/ on the server for that dir
"use strict";
const fs = require("fs");
const path = require("path");
const V = require("../../assets/verdict.js");
const { loadYaml } = require("../yaml.js");
const { shownFoods, isHidden } = require("../shown.js");

const ROOT = path.resolve(__dirname, "..", "..");
const OFF = "#e5dec6";
const MONTHS = "JFMAMJJASOND";
const MONTH_STARTS = [1, 5, 9, 14, 18, 23, 27, 31, 36, 40, 44, 49];

// RFC 4180 CSV: quoted fields, doubled quotes, commas and newlines inside.
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift();
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// One dial as an inline SVG.
function dial(food, label) {
  const C = 110, R = 100, R0 = 54;
  const order = V.ringOrder(food);
  const n = Math.max(order.length, 1);
  const band = (R - R0) / n, thick = Math.max(band - 2, 1.5);
  let rings = "";
  order.forEach((vi, k) => {
    const v = food.varieties[vi];
    const c = v.colour || food.colour;
    const mid = (R - band * k - thick / 2).toFixed(2);
    let arcs = `<circle r="${mid}" stroke="${OFF}"/>`;
    for (const [a, b, s] of v.weeks || []) {
      const stroke = s === "in" ? c : s === "store" ? `color-mix(in oklab, ${c} 30%, ${OFF})` : `color-mix(in oklab, ${c} 55%, ${OFF})`;
      arcs += `<circle r="${mid}" pathLength="52" stroke-dasharray="${b - a + 1} 52" stroke-dashoffset="${-(a - 1)}" style="stroke: ${stroke}"/>`;
    }
    rings += `<g stroke-width="${thick.toFixed(2)}"><title>${esc(v.name || food.name)}</title>${arcs}</g>`;
  });
  let spokes = "", months = "";
  MONTH_STARTS.forEach((w, m) => {
    const deg = ((w - 1) * 360) / 52;
    spokes += `<line x1="0" y1="${-R0 + 1}" x2="0" y2="${-R - 1}" transform="rotate(${deg.toFixed(2)})"/>`;
    const next = m === 11 ? 53 : MONTH_STARTS[m + 1];
    const midDeg = (((w - 1 + next - 1) / 2) * 360) / 52;
    const rad = ((midDeg - 90) * Math.PI) / 180;
    months += `<text x="${((R0 - 10) * Math.cos(rad)).toFixed(1)}" y="${((R0 - 10) * Math.sin(rad)).toFixed(1)}">${MONTHS[m]}</text>`;
  });
  return `<svg viewBox="0 0 220 220" role="img" aria-label="${esc(label)}"><g transform="translate(${C} ${C})">` +
    `<g class="rings" fill="none" transform="rotate(-90)">${rings}</g><g class="spokes">${spokes}</g><g class="months">${months}</g></g></svg>`;
}

// The rings in the dial's order, outside in, as swatches and names.
function legend(food) {
  if (food.varieties.length < 2) return "";
  return `<ol class="legend">${V.ringOrder(food).map((vi) => {
    const v = food.varieties[vi];
    return `<li><span class="swatch" style="background: ${v.colour || food.colour}"></span>${esc(v.name || food.name)}</li>`;
  }).join("")}</ol>`;
}

function main() {
  const siteDir = path.resolve(ROOT, process.argv[2] || "_site");
  const before = loadYaml(path.join(ROOT, "research", "helen", "foods.yml"));
  const data = loadYaml(path.join(ROOT, "_data", "foods.yml"));
  const after = shownFoods(data);
  const rows = parseCsv(fs.readFileSync(path.join(ROOT, "research", "out", "comparison.csv"), "utf8"));

  const byName = {};
  for (const r of rows) (byName[r.food] = byName[r.food] || []).push(r);
  const oldBy = Object.fromEntries(before.map((f) => [f.slug, f]));
  const rawBy = Object.fromEntries(data.map((f) => [f.slug, f]));

  const items = after.map((f) => {
    const rs = byName[f.name] || [];
    const scores = rs.map((r) => (+r.in_mis) + (+r.fresh_mis));
    const score = Math.max(0, ...scores);
    return { f, old: oldBy[f.slug], raw: rawBy[f.slug], rs, score, top: rs[scores.indexOf(score)], total: scores.reduce((a, b) => a + b, 0) };
  });
  const missing = items.filter((i) => !i.rs.length).map((i) => i.f.name);
  items.sort((a, b) => b.score - a.score || b.total - a.total || (a.f.name < b.f.name ? -1 : 1));

  const cards = items.map((it, i) => {
    const { f, old, raw, rs } = it;
    const hidden = raw.varieties.filter(isHidden)
      .map((v) => `${esc(v.name || "(whole)")} <span class="why">${v.no_supply ? "no supply" : "proposed"}</span>`);
    const moved = rs.map((r) => `<tr><td>${esc(r.ring)}</td><td>${r.in_mis}</td><td>${r.fresh_mis}</td><td>${esc(r.cat)}</td></tr>`).join("");
    return `<article id="${esc(f.slug)}" style="--food: ${f.colour}">
  <header><span class="rank">${i + 1}</span><h2><a href="../../${esc(f.slug)}/">${esc(f.name)}</a></h2>
    <span class="conf conf-${esc(raw.confidence || "none")}">confidence: ${esc(raw.confidence || "not given")}</span>
    <span class="score">change score ${it.score}${it.top ? ` (${esc(it.top.ring)}: ${it.top.in_mis} in-season weeks + ${it.top.fresh_mis} fresh weeks changed)` : ""}</span></header>
  <div class="pair">
    <figure><figcaption>Before</figcaption>${dial(old, "Before: " + f.name)}${legend(old)}</figure>
    <figure><figcaption>Now</figcaption>${dial(f, "Now: " + f.name)}${legend(f)}</figure>
  </div>
  ${hidden.length ? `<p class="hidden-rings">Not shown: ${hidden.join(", ")}</p>` : ""}
  ${moved ? `<table><thead><tr><th>Old ring</th><th>In-season weeks changed</th><th>Fresh weeks changed</th><th>Kind of change</th></tr></thead><tbody>${moved}</tbody></table>` : ""}
</article>`;
  }).join("\n");

  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Before and after</title>
<style>
  :root { --bg: #fbf3d9; --ink: #1c1714; --muted: #5e544b; --rule: #e5dec6; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.45 system-ui, sans-serif; }
  main { max-width: 1040px; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { font-size: 28px; margin: 0 0 6px; }
  .intro { color: var(--muted); max-width: 70ch; }
  .key { display: flex; flex-wrap: wrap; gap: 16px; color: var(--muted); font-size: 13px; margin: 12px 0 24px; }
  .key i { display: inline-block; width: 22px; height: 10px; margin-right: 6px; vertical-align: middle; }
  article { border-top: 1px solid var(--rule); padding: 20px 0; }
  article header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; }
  .rank { color: var(--muted); font-variant-numeric: tabular-nums; min-width: 2.5ch; }
  h2 { margin: 0; font-size: 20px; }
  h2 a { color: inherit; text-decoration-color: var(--food); text-underline-offset: 3px; }
  .conf { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 99px; background: var(--rule); }
  .conf-low { background: #f3d0c4; } .conf-medium { background: #f1e2b0; } .conf-high { background: #cfe5c4; }
  .score { color: var(--muted); font-size: 13px; }
  .pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 12px; }
  figure { margin: 0; }
  figcaption { font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
  svg { width: 100%; max-width: 260px; display: block; }
  .spokes line { stroke: var(--bg); stroke-width: 1.5; }
  .months text { fill: var(--muted); font-size: 8px; font-weight: 600; text-anchor: middle; dominant-baseline: middle; }
  .legend { list-style: none; padding: 0; margin: 6px 0 0; font-size: 13px; }
  .legend li { margin: 2px 0; }
  .swatch { display: inline-block; width: 10px; height: 10px; margin-right: 6px; vertical-align: -1px; }
  .hidden-rings { font-size: 13px; color: var(--muted); }
  .why { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  table { border-collapse: collapse; font-size: 13px; margin-top: 8px; width: 100%; max-width: 640px; }
  th, td { text-align: left; padding: 3px 10px 3px 0; border-bottom: 1px solid var(--rule); }
  th { color: var(--muted); font-weight: 600; }
  td:nth-child(2), td:nth-child(3) { font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
<main>
<h1>Before and after</h1>
<p class="intro">Each food's dial on the data of 10 November 2026 beside its dial as the site now shows it, most changed first. A food's score is its most-changed old ring's weeks that changed in or out of season plus those that changed in or out of being fresh at all (research/out/comparison.csv). Rings the site hides are listed under the dials. Dev only: never deployed.</p>
<div class="key"><span><i style="background: #b5502e"></i>in season</span><span><i style="background: color-mix(in oklab, #b5502e 55%, ${OFF})"></i>just about</span><span><i style="background: color-mix(in oklab, #b5502e 30%, ${OFF})"></i>from storage</span><span><i style="background: ${OFF}"></i>none</span></div>
${missing.length ? `<p class="intro">Not in comparison.csv, so scored 0: ${missing.map(esc).join(", ")}.</p>` : ""}
${cards}
</main>
</body>
</html>
`;
  const out = path.join(siteDir, "dev", "before-after");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "index.html"), html);
  console.log(`wrote ${items.length} foods into ${path.relative(ROOT, path.join(out, "index.html"))}`);
}

main();
