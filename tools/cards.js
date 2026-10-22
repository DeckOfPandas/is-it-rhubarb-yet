// Draw the share cards: one 1200 by 630 PNG per food and never-food, one
// for home and one for the Now page, from the baked verdicts, so a link
// pasted into a chat shows the answer and the day it was true for. Chat
// apps keep the first preview they fetch, so the date on the card lets an
// old preview read like a dated newspaper rather than a wrong answer. The
// Now card carries the week's three lines, as the home page does: just
// arrived, great this week, last chance, a random handful of each.
//
// WhatsApp and some mail apps cut the middle square out of a wide card,
// and a page can send only the one image. So everything that must be read
// sits in a column inside that square, and the sides are left empty. Each
// card measures the box round its words, and the run fails if one strays
// outside the square.
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
const STRIP_PICK = 3;

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "_data");
const FONTS = path.join(ROOT, "assets", "fonts");
const WIDTH = 1200, HEIGHT = 630, SCALE = 1;
// The column sits this far inside the middle square on every side, so a
// crop that rounds a pixel differently still loses nothing.
const INSET = 4;
const SQUARE_X = (WIDTH - HEIGHT) / 2;
const COL = { x: SQUARE_X + INSET, y: INSET, size: HEIGHT - 2 * INSET };
// NEVER is every never-food's colour, as --never is on the site.
const CUSTARD = "#fbf3d9", INK = "#1c1714", MUTED = "#5e544b", RHUBARB = "#ff2d78", NEVER = "#857f78";

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

// The same type and colours as the site, at card size. Every block in the
// column starts at its largest and FIT shrinks it to its limit; the
// verdict word then takes the height that is left. The wordmark's line is
// as tall as Anton's glyph box (1.55em), so the measured box holds it.
const CSS = [
  fontFace("Anton", "anton-latin.woff2", "normal", "400"),
  fontFace("Atkinson Hyperlegible Next", "atkinson-hyperlegible-next-latin.woff2", "normal", "200 800"),
  `
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body { background: ${CUSTARD}; color: ${INK}; font: 400 32px/1.3 "Atkinson Hyperlegible Next", sans-serif; }
  .col { position: absolute; left: ${COL.x}px; top: ${COL.y}px; width: ${COL.size}px; height: ${COL.size}px;
    display: flex; flex-direction: column; justify-content: center; gap: 14px; }
  .col > * { margin: 0; flex: none; }
  .display { font-family: Anton, Impact, sans-serif; font-weight: 400; text-transform: uppercase; letter-spacing: 0; }
  .ask { font-size: 52px; line-height: 1.04; color: ${MUTED}; }
  .word-box { line-height: 0; }
  .word { display: inline-block; font-size: 300px; line-height: 0.86; color: var(--food); white-space: nowrap; padding-top: 0.06em; }
  .line { font-weight: 700; font-size: 36px; line-height: 1.2; }
  .foot { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
  .asof { font-size: 22px; color: ${MUTED}; margin: 0; white-space: nowrap; }
  .brand { font-size: 32px; line-height: 1.55; white-space: nowrap; color: ${INK}; }
  .pink { color: ${RHUBARB}; text-decoration: underline ${RHUBARB} 0.08em; text-underline-offset: 0.12em; text-decoration-skip-ink: none; }
  .hook { font-size: 200px; line-height: 0.98; }
  .hook span { display: block; white-space: nowrap; }
  .hook .pink { display: inline-block; text-underline-offset: 0.06em; text-decoration-thickness: 0.05em; margin-bottom: 0.1em; }
  .title { font-size: 80px; line-height: 1.02; }
  .strap { font-size: 32px; font-weight: 700; line-height: 1.25; }
  .week { font-size: 32px; font-weight: 700; }
  .lines { font-size: 26px; }
  .lines p { font-size: 1em; line-height: 1.3; margin: 0 0 4px; color: ${MUTED}; }
  .lines strong { color: ${INK}; }
  .lines .food { font-weight: 700; color: var(--food); }
  `
].join("\n");

// Runs in the card's page once its fonts are in. A [data-fit] block keeps
// its largest font size that fits data-lines lines (or data-max-h pixels)
// without running out of the column sideways, down to data-min. Then the
// word takes the height left, up to the column's width. Returns the box
// round everything in the column, in card pixels, and whether the column
// ran out of room.
function FIT() {
  const col = document.querySelector(".col");
  const tooBig = (el) => {
    const cs = getComputedStyle(el);
    const limit = el.dataset.lines ? el.dataset.lines * parseFloat(cs.lineHeight) : parseFloat(el.dataset.maxH);
    return el.scrollWidth > el.clientWidth + 0.5 || el.getBoundingClientRect().height > limit + 0.5;
  };
  document.querySelectorAll("[data-fit]").forEach((el) => {
    let hi = parseFloat(getComputedStyle(el).fontSize), lo = parseFloat(el.dataset.min);
    if (!tooBig(el)) return;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = mid + "px";
      if (tooBig(el)) hi = mid; else lo = mid;
    }
    el.style.fontSize = lo + "px";
  });
  const box = col.querySelector(".word-box");
  const others = [...col.children].filter((c) => c !== box);
  const gap = parseFloat(getComputedStyle(col).rowGap) || 0;
  const availH = col.clientHeight - others.reduce((s, c) => s + c.getBoundingClientRect().height, 0) - gap * others.length;
  if (box) {
    const w = box.querySelector(".word");
    const r = w.getBoundingClientRect();
    const size = parseFloat(getComputedStyle(w).fontSize) * Math.min(col.clientWidth / r.width, availH / r.height);
    w.style.fontSize = Math.min(size, 300) + "px";
  }
  const rects = [...col.querySelectorAll("*")].map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
  return {
    box: {
      left: Math.min(...rects.map((r) => r.left)), right: Math.max(...rects.map((r) => r.right)),
      top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)),
    },
    overflow: col.scrollHeight > col.clientHeight + 0.5 || availH < 0,
  };
}

function page(body, food) {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>${CSS}</style></head>` +
    `<body style="--food: ${food || RHUBARB}"><div class="col">${body}</div></body></html>`;
}
function foot(asofText) {
  return `<div class="foot"><p class="asof">as of ${esc(asofText)}</p>` +
    `<span class="display brand">Is it <span class="pink">rhubarb</span> yet?</span></div>`;
}

function verdictCard(name, colour, word, line, asofText) {
  return page(
    `<p class="display ask" data-fit data-lines="2" data-min="28">Is it ${esc(name.toLowerCase())} yet?</p>` +
    `<div class="word-box"><span class="display word">${esc(word)}.</span></div>` +
    `<p class="line" data-fit data-lines="3" data-min="22">${esc(line)}</p>` +
    foot(asofText), colour);
}

// The week's three lines, as the home page's blocks: just arrived (or on
// the way, in a week when nothing has arrived), great now and last
// chance, a random three of each in their colours and how many more there
// are. A list with nothing in it is left out.
function sample(items) {
  return items.slice().sort(() => Math.random() - 0.5).slice(0, STRIP_PICK);
}
function lines(baked) {
  const first = V.flatten(baked.now.arrived || []).length ? ["arrived", "Just arrived"] : ["onway", "On the way"];
  const specs = [first, ["still", "Great this week"], ["last", "Last chance"]];
  return `<div class="lines" data-fit data-max-h="300" data-min="18">` + specs.map(([key, label]) => {
    const all = V.flatten(baked.now[key] || []);
    if (!all.length) return "";
    const pick = sample(all);
    const more = all.length - pick.length;
    return `<p><strong>${label}:</strong> ` +
      pick.map((i) => `<span class="food" style="--food: ${i.colour}">${esc(i.name)}</span>`).join(", ") +
      (more > 0 ? ` and ${more} more` : "") + `</p>`;
  }).join("") + `</div>`;
}

// Home is the question, stacked three lines high as the home page's
// heading is.
function homeCard(baked) {
  return page(
    `<div class="display hook" data-fit data-max-h="430" data-min="60"><span>Is it</span><span><span class="pink">rhubarb</span></span><span>yet?</span></div>` +
    `<p class="strap" data-fit data-lines="2" data-min="22">Cook food when it's at its best.</p>` +
    foot(baked.asofText));
}

function nowCard(baked) {
  return page(
    `<div class="display title" data-fit data-lines="2" data-min="40">In season this week</div>` +
    `<p class="week">${esc(baked.range)}</p>` + lines(baked) + foot(baked.asofText));
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

async function main() {
  const out = path.resolve(ROOT, arg("--out", path.join("_site", "cards")));
  const only = arg("--only", "").split(",").filter(Boolean);
  const want = (slug) => !only.length || only.includes(slug);
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
    cards.push({ slug: n.slug, html: verdictCard(n.name, NEVER, "NEVER", n.line, baked.asofText) });
  });
  cards.push({ slug: "home", html: homeCard(baked) });
  cards.push({ slug: "now", html: nowCard(baked) });

  let chromium;
  try { ({ chromium } = require("playwright")); } catch (e) {
    throw new Error("playwright is not on NODE_PATH; the container and the deploy workflow provide it");
  }
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: SCALE });
  const strays = [];
  let drawn = 0;
  for (const card of cards) {
    if (!want(card.slug)) continue;
    await tab.setContent(card.html, { waitUntil: "load" });
    const { box, overflow } = await tab.evaluate(`document.fonts.ready.then(${FIT.toString()})`);
    if (overflow || box.left < SQUARE_X || box.right > SQUARE_X + HEIGHT || box.top < 0 || box.bottom > HEIGHT) {
      strays.push(`${card.slug} (x ${Math.round(box.left)}-${Math.round(box.right)}, y ${Math.round(box.top)}-${Math.round(box.bottom)}${overflow ? ", overflows" : ""})`);
    }
    await tab.screenshot({ path: path.join(out, card.slug + ".png"), type: "png" });
    drawn++;
  }
  if (want("icons")) {
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
  if (strays.length) {
    console.error(`cards.js: ${strays.length} cards have words outside the middle square: ${strays.join(", ")}`);
    process.exit(1);
  }
}

main().catch((e) => { console.error("cards.js: " + e.message); process.exit(1); });
