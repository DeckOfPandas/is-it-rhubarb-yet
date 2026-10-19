// Draw the share cards: one 1200 by 630 PNG per food and never-food, one
// for home and one for the Now page, from the baked verdicts, so a link
// pasted into a chat shows the answer and the day it was true for. Chat
// apps keep the first preview they fetch, so the date on the card lets an
// old preview read like a dated newspaper rather than a wrong answer. The
// home and Now cards carry the week's three lines, as the home page does:
// just arrived, great now, last chance, a random handful of each.
//
// It also draws the favicon and the app icon, into _site/icons.
//
// usage: node tools/cards.js [--out _site/cards] [--icons _site/icons] [--only rhubarb,home,now,icons]
//
// Each card is a small HTML page with the site's fonts inlined, opened in
// headless Chromium (Playwright, which the container and the deploy both
// have) and screenshotted. Runs after `bundle exec jekyll build`, into
// the built site; tools/build.sh does so. Needs _data/baked.json from
// tools/bake.js.
"use strict";
const fs = require("fs");
const path = require("path");
const V = require("../assets/verdict.js");
const { loadYaml } = require("./yaml.js");

// How many foods each line names, as index.html samples and site.js draws.
const STRIP_PICK = 5;

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "_data");
const FONTS = path.join(ROOT, "assets", "fonts");
const WIDTH = 1200, HEIGHT = 630;
const CUSTARD = "#fbf3d9", INK = "#1c1714", MUTED = "#5e544b", RHUBARB = "#ff2d78";

function arg(name, fallback) {
  const at = process.argv.indexOf(name);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fontFace(family, file, style, weight) {
  const data = fs.readFileSync(path.join(FONTS, file)).toString("base64");
  return `@font-face { font-family: "${family}"; font-style: ${style}; font-weight: ${weight}; ` +
    `src: url(data:font/woff2;base64,${data}) format("woff2"); }`;
}

// The same type and colours as the site, at card size. The verdict word
// starts large and is fitted to the line before the shot.
const CSS = [
  fontFace("Anton", "anton-latin.woff2", "normal", "400"),
  fontFace("Atkinson Hyperlegible Next", "atkinson-hyperlegible-next-latin.woff2", "normal", "200 800"),
  `
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body { background: ${CUSTARD}; color: ${INK}; font: 400 32px/1.3 "Atkinson Hyperlegible Next", sans-serif; }
  .card { position: relative; width: ${WIDTH}px; height: ${HEIGHT}px; padding: 52px 56px 44px 80px; }
  .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 22px; background: var(--food); }
  .display { font-family: Anton, Impact, sans-serif; font-weight: 400; text-transform: uppercase; letter-spacing: 0; }
  .ask { font-size: 54px; line-height: 1; color: ${MUTED}; margin: 0; }
  .word-box { width: 100%; margin-top: 10px; }
  .word { display: inline-block; font-size: 300px; line-height: 0.86; color: var(--food); white-space: nowrap; padding-top: 0.06em; }
  .line { font-weight: 700; font-size: 44px; line-height: 1.2; margin: 18px 0 0; max-width: 1000px; }
  .foot { position: absolute; left: 80px; right: 56px; bottom: 40px; display: flex; justify-content: space-between; align-items: baseline; }
  .asof { font-size: 26px; color: ${MUTED}; margin: 0; }
  .brand { font-size: 36px; line-height: 1; color: ${INK}; }
  .pink { color: ${RHUBARB}; }
  .hook { font-size: 128px; line-height: 1.05; margin: 10px 0 0; white-space: nowrap; }
  .title { font-size: 104px; line-height: 1.05; margin: 16px 0 0; white-space: nowrap; }
  .strap { font-size: 40px; font-weight: 700; line-height: 1.25; margin: 20px 0 0; max-width: 1000px; }
  .week { font-size: 40px; font-weight: 700; margin: 20px 0 0; }
  .lines { margin: 26px 0 0; max-width: 1060px; }
  .lines p { font-size: 29px; line-height: 1.3; margin: 0 0 6px; color: ${MUTED}; }
  .lines strong { color: ${INK}; }
  .lines .food { font-weight: 700; color: var(--food); }
  `
].join("\n");

function page(body, food) {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>${CSS}</style></head>` +
    `<body><div class="card" style="--food: ${food || RHUBARB}">${body}</div></body></html>`;
}
function foot(asofText) {
  return `<div class="foot"><p class="asof">as of ${esc(asofText)}</p>` +
    `<div class="display brand">Is it <span class="pink">rhubarb</span> yet?</div></div>`;
}

function verdictCard(name, colour, word, line, asofText) {
  return page(
    `<div class="bar"></div>` +
    `<p class="display ask">Is it ${esc(name.toLowerCase())} yet?</p>` +
    `<div class="word-box"><span class="display word">${esc(word)}.</span></div>` +
    `<p class="line">${esc(line)}</p>` + foot(asofText), colour);
}

// The week's three lines, as the home page's strip: a random handful of
// each list in their colours and how many more there are. Just arrived
// is always said, even when it is nothing.
function sample(items) {
  return items.slice().sort(() => Math.random() - 0.5).slice(0, STRIP_PICK);
}
function lines(baked) {
  const specs = [["arrived", "Just arrived", "nothing new this week."], ["still", "Great now", null], ["last", "Last chance", null]];
  return `<div class="lines">` + specs.map(([key, label, empty]) => {
    const all = V.flatten(baked.now[key] || []);
    if (!all.length && !empty) return "";
    if (!all.length) return `<p><strong>${label}:</strong> ${esc(empty)}</p>`;
    const pick = sample(all);
    const more = all.length - pick.length;
    return `<p><strong>${label}:</strong> ` +
      pick.map((i) => `<span class="food" style="--food: ${i.colour}">${esc(i.name)}</span>`).join(", ") +
      (more > 0 ? ` and ${more} more` : "") + `.</p>`;
  }).join("") + `</div>`;
}

function homeCard(baked) {
  return page(
    `<div class="display hook">Is it <span class="pink">rhubarb</span> yet?</div>` +
    `<p class="strap">Cook food when it's at its best.</p>` + lines(baked) +
    `<div class="foot"><p class="asof">as of ${esc(baked.asofText)}</p></div>`);
}

// The favicon and the app icon: IIRY, light ink on the forcing shed, the R
// in rhubarb pink and underlined in it. One square page, shot at each size
// in ICONS, so Chromium sets the type at that size rather than shrinking a
// large picture. The header keeps the full wordmark; IIRY is only for here.
const ICONS = { "favicon-32.png": 32, "icon-192.png": 192, "apple-touch-icon.png": 180 };
const SHED = "#16110e", SHED_INK = "#f3ede4";
function iconPage() {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>${fontFace("Anton", "anton-latin.woff2", "normal", "400")}
  html, body { margin: 0; width: 512px; height: 512px; overflow: hidden; background: ${SHED}; }
  body { display: flex; align-items: center; justify-content: center; }
  .mark { font: 400 330px/1 Anton, sans-serif; letter-spacing: 0.01em; color: ${SHED_INK}; transform: translateY(-0.04em); }
  .r { position: relative; color: ${RHUBARB}; }
  .r::after { content: ""; position: absolute; left: 0.02em; right: 0.04em; bottom: 0.2em; height: 0.07em; background: ${RHUBARB}; }
  </style></head><body><div class="mark">II<span class="r">R</span>Y</div></body></html>`;
}

function nowCard(baked) {
  return page(
    `<div class="display title">In season this week</div>` +
    `<p class="week">Week ${baked.week}: ${esc(baked.range)}</p>` + lines(baked) + foot(baked.asofText));
}

async function main() {
  const out = path.resolve(ROOT, arg("--out", path.join("_site", "cards")));
  const only = arg("--only", "").split(",").filter(Boolean);
  const bakedPath = path.join(DATA, "baked.json");
  if (!fs.existsSync(bakedPath)) throw new Error("no _data/baked.json: run node tools/bake.js first");
  const baked = JSON.parse(fs.readFileSync(bakedPath, "utf8"));
  const foods = loadYaml(path.join(DATA, "foods.yml"));
  const never = fs.existsSync(path.join(DATA, "never.yml")) ? loadYaml(path.join(DATA, "never.yml")) : [];

  const cards = [];
  foods.forEach((f) => {
    const b = baked.foods[f.slug];
    if (!b) return;
    const colour = (b.variety && (f.varieties.find((v) => v.name === b.variety) || {}).colour) || f.colour;
    cards.push({ slug: f.slug, html: verdictCard(f.name, colour, b.verdict, b.line, baked.asofText) });
  });
  never.forEach((n) => {
    cards.push({ slug: n.slug, html: verdictCard(n.name, RHUBARB, "NEVER", n.line, baked.asofText) });
  });
  cards.push({ slug: "home", html: homeCard(baked) });
  cards.push({ slug: "now", html: nowCard(baked) });

  let chromium;
  try { ({ chromium } = require("playwright")); } catch (e) {
    throw new Error("playwright is not on NODE_PATH; the container and the deploy workflow provide it");
  }
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  let drawn = 0;
  for (const card of cards) {
    if (only.length && !only.includes(card.slug)) continue;
    await tab.setContent(card.html, { waitUntil: "load" });
    await tab.evaluate(() => document.fonts.ready.then(() => {
      const w = document.querySelector(".word");
      if (!w) return;
      const avail = w.parentElement.clientWidth;
      const width = w.getBoundingClientRect().width;
      const size = parseFloat(getComputedStyle(w).fontSize) * avail / width;
      w.style.fontSize = Math.min(size, 300) + "px";
    }));
    await tab.screenshot({ path: path.join(out, card.slug + ".png"), type: "png" });
    drawn++;
  }
  if (!only.length || only.includes("icons")) {
    const icons = path.resolve(ROOT, arg("--icons", path.join(path.dirname(out), "icons")));
    fs.mkdirSync(icons, { recursive: true });
    for (const [file, size] of Object.entries(ICONS)) {
      const shot = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: size / 512 });
      await shot.setContent(iconPage(), { waitUntil: "load" });
      await shot.evaluate(() => document.fonts.ready);
      await shot.screenshot({ path: path.join(icons, file), type: "png" });
      await shot.close();
    }
    console.log(`drew ${Object.keys(ICONS).length} icons into ${path.relative(ROOT, icons)}`);
  }
  await browser.close();
  console.log(`drew ${drawn} share cards for ${baked.asofText} into ${path.relative(ROOT, out)}`);
}

main().catch((e) => { console.error("cards.js: " + e.message); process.exit(1); });
