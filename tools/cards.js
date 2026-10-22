// Draw the share cards: one 1200 by 630 card per food and never-food, one
// each for home, the Now page, the calendar and the wheel, from the baked
// verdicts and the built site, so a link
// pasted into a chat shows the answer and the day it was true for. Chat
// apps keep the first preview they fetch, so the date on the card lets an
// old preview read like a dated newspaper rather than a wrong answer. The
// Now card carries the week's three lines, as the home page does: great
// this week, still great but on the way out, just arrived, a random
// handful of each.
//
// WhatsApp and some mail apps cut the middle square out of a wide card,
// and a page can send only the one image. So everything that must be read
// sits in a column inside that square, and the sides are left empty. Each
// card measures the box round its words, and the run fails if one strays
// outside the square.
//
// It also draws the site's icons, with tools/icons.js, into _site/icons.
//
// usage: node tools/cards.js [--out _site/cards] [--site _site] [--icons _site/icons]
//   [--only rhubarb,home,now,calendar,wheel,icons]
//
// Each card is a small HTML page with the site's fonts inlined, opened in
// headless Chromium (Playwright, which the container and the deploy both
// have) and screenshotted. The calendar and wheel cards carry a picture
// of the real chart, shot from the built site through a server of its
// own. The wheel card is a JPEG at quality 80: its hundreds of arcs make
// a PNG of near a megabyte, and chat apps are reported to drop previews
// over about 300 KB, which quality 85 came within 4% of. Runs after
// `bundle exec jekyll build`, into the built site;
// tools/build.sh does so. Needs _data/baked.json from tools/bake.js.
"use strict";
const fs = require("fs");
const http = require("http");
const path = require("path");
const V = require("../assets/verdict.js");
const { loadYaml } = require("./yaml.js");
const { drawIcons, SITE_ICONS } = require("./icons.js");

// How many foods each line names, as index.html samples and site.js draws.
const STRIP_PICK = 3;

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "_data");
const FONTS = path.join(ROOT, "assets", "fonts");
// A card is laid out at 1200 by 630 and drawn at twice that, 2400 by 1260
// pixels, so previews are sharp on high-resolution screens.
// _layouts/default.html states the drawn size, and tests/cards checks it.
const WIDTH = 1200, HEIGHT = 630, SCALE = 2;
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
  .pic { display: block; }
  sup { font-size: 0.7em; line-height: 0; vertical-align: 0.45em; }
  `
].join("\n");

// Runs in the card's page once its fonts are in. A [data-fit] block keeps
// its largest font size that fits data-lines lines (or data-max-h pixels)
// without running out of the column sideways, down to data-min. Then the
// word, or the picture, takes the height left, up to the column's width.
// Returns the box
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
  const grow = col.querySelector(".word-box, .pic");
  const others = [...col.children].filter((c) => c !== grow);
  const gap = parseFloat(getComputedStyle(col).rowGap) || 0;
  const availH = col.clientHeight - others.reduce((s, c) => s + c.getBoundingClientRect().height, 0) - gap * others.length;
  if (grow && grow.classList.contains("pic")) {
    const aspect = grow.naturalWidth / grow.naturalHeight;
    const h = Math.min(availH, col.clientWidth / aspect);
    grow.style.height = h + "px";
    grow.style.width = h * aspect + "px";
  } else if (grow) {
    const w = grow.querySelector(".word");
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
// A date, escaped, its ordinal letters raised.
function date(text) { return V.dateHtml(esc(text)); }

function foot(asofText) {
  return `<div class="foot"><p class="asof">as of ${date(asofText)}</p>` +
    `<span class="display brand">Is it <span class="pink">rhubarb</span> yet?</span></div>`;
}

function verdictCard(said, colour, word, line, asofText) {
  return page(
    `<p class="display ask" data-fit data-lines="2" data-min="28">Is it ${esc(said)} yet?</p>` +
    `<div class="word-box"><span class="display word">${esc(word)}.</span></div>` +
    `<p class="line" data-fit data-lines="3" data-min="22">${esc(line)}</p>` +
    foot(asofText), colour);
}

// The week's three lines: great this week, still great but on the way
// out, then just arrived (or on the way, in a week when nothing has
// arrived), a random three of each in their colours and how many more
// there are. A list with nothing in it is left out.
function sample(items) {
  return items.slice().sort(() => Math.random() - 0.5).slice(0, STRIP_PICK);
}
function lines(baked) {
  const fresh = V.flatten(baked.now.arrived || []).length ? ["arrived", "Just arrived"] : ["onway", "On the way"];
  const specs = [["still", "Great this week"], ["last", "Still great but on the way out"], fresh];
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
    `<p class="week">${date(baked.range)}</p>` + lines(baked) + foot(baked.asofText));
}

// The calendar and the wheel: a title, the whole picture inside the
// column, the foot.
function pictureCard(title, picture, asofText) {
  return page(`<div class="display title" data-fit data-lines="1" data-min="40">${esc(title)}</div>` +
    `<img class="pic" src="${picture}" alt="">` + foot(asofText));
}

// Serves the built site at the baseurl it was built for, which its home
// page's stylesheet link gives, so the pages load as they do on Pages.
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".ics": "text/calendar" };
function serveSite(dir) {
  const home = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const base = (home.match(/href="([^"]*)\/assets\/site\.css"/) || ["", ""])[1];
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.startsWith(base)) p = p.slice(base.length);
    let file = path.join(dir, p);
    if (!file.startsWith(dir)) { res.writeHead(404); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((done) => server.listen(0, "127.0.0.1", () =>
    done({ server, url: `http://127.0.0.1:${server.address().port}${base}` })));
}

// The pictures for the calendar and wheel cards, shot from the built pages
// at a desktop width (a narrower one would switch the site to its phone
// layout) and three times over, with the header and the floating buttons
// hidden. The calendar is a window of CAL_ROWS rows of its by-start
// order, centred on the first row whose season starts this week or later,
// so the card shows the part of the year that is turning now. The rows
// and their order are _includes/calendar.html's: a lead variety's first
// "in" week, then the food's name.
const CAL_ROWS = 34, CAL_ROW_H = 22;
const SHOT_CSS = `.site-header, .tt-jump, .tt-controls, .page-head, .site-footer { display: none !important; }
  .chart-head { position: static !important; }`;
function turningRow(foods, week) {
  const rows = [];
  foods.forEach((f) => f.varieties.forEach((v, vi) => {
    if (v.lead === false) return;
    const ins = (v.weeks || []).filter((r) => r[2] === "in").map((r) => r[0]);
    rows.push({ id: `${f.slug}-${vi}`, first: ins.length ? Math.min(...ins) : 99, name: f.name, vi });
  }));
  rows.sort((a, b) => a.first - b.first || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) || a.vi - b.vi);
  return (rows.find((r) => r.first >= week && r.first < 99) || rows[0]).id;
}
async function sitePictures(browser, siteDir, baked, foods) {
  if (!fs.existsSync(path.join(siteDir, "calendar", "index.html"))) return null;
  const { server, url } = await serveSite(siteDir);
  const tab = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 3 });
  const shots = {};
  try {
    await tab.goto(url + "/calendar/", { waitUntil: "networkidle" });
    await tab.addStyleTag({ content: SHOT_CSS });
    await tab.evaluate(({ id, rows, rowH }) => {
      const fig = document.querySelector("figure.by-start");
      const row = fig.querySelector(`.cal-labels a.row[data-row="${id}"]`);
      const body = fig.querySelector(".chart-body");
      const grid = body.querySelector(".cal-grid");
      const top = row.getBoundingClientRect().top - grid.getBoundingClientRect().top;
      const shift = rowH * Math.round(Math.max(0, Math.min(top - (rows * rowH) / 2, grid.scrollHeight - rows * rowH)) / rowH);
      body.style.height = rows * rowH + "px";
      body.style.overflow = "hidden";
      grid.style.transform = `translateY(${-shift}px)`;
    }, { id: turningRow(foods, baked.week), rows: CAL_ROWS, rowH: CAL_ROW_H });
    shots.calendar = await tab.locator("figure.by-start .cal").screenshot();
    await tab.goto(url + "/wheel/", { waitUntil: "networkidle" });
    await tab.addStyleTag({ content: SHOT_CSS });
    shots.wheel = await tab.locator("figure.by-all svg").first().screenshot();
  } finally {
    await tab.close();
    server.close();
  }
  return Object.fromEntries(Object.entries(shots).map(([k, b]) => [k, "data:image/png;base64," + b.toString("base64")]));
}

async function main() {
  const out = path.resolve(ROOT, arg("--out", path.join("_site", "cards")));
  const siteDir = path.resolve(ROOT, arg("--site", path.dirname(out)));
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
    cards.push({ slug: f.slug, html: verdictCard(V.foodSaid(f), f.colour, b.verdict, b.line, baked.asofText) });
  });
  never.forEach((n) => {
    cards.push({ slug: n.slug, html: verdictCard(V.foodSaid(n), NEVER, "NEVER", n.line, baked.asofText) });
  });
  cards.push({ slug: "home", html: homeCard(baked) });
  cards.push({ slug: "now", html: nowCard(baked) });

  let chromium;
  try { ({ chromium } = require("playwright")); } catch (e) {
    throw new Error("playwright is not on NODE_PATH; the container and the deploy workflow provide it");
  }
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  if (want("calendar") || want("wheel")) {
    const pics = await sitePictures(browser, siteDir, baked, foods);
    if (!pics) throw new Error("no built calendar in " + path.relative(ROOT, siteDir) + ": run jekyll build first, or pass --site");
    cards.push({ slug: "calendar", html: pictureCard("UK-produced foods, week by week", pics.calendar, baked.asofText) });
    cards.push({ slug: "wheel", type: "jpeg", html: pictureCard("The shape of the year", pics.wheel, baked.asofText) });
  }
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
    if (card.type === "jpeg") {
      await tab.screenshot({ path: path.join(out, card.slug + ".jpg"), type: "jpeg", quality: 80 });
    } else {
      await tab.screenshot({ path: path.join(out, card.slug + ".png"), type: "png" });
    }
    drawn++;
  }
  if (want("icons")) {
    const icons = path.resolve(ROOT, arg("--icons", path.join(path.dirname(out), "icons")));
    await drawIcons(browser, icons, SITE_ICONS);
    console.log(`drew ${SITE_ICONS.length} icons into ${path.relative(ROOT, icons)}`);
  }
  await browser.close();
  console.log(`drew ${drawn} share cards for ${baked.asofText} into ${path.relative(ROOT, out)}`);
  if (strays.length) {
    console.error(`cards.js: ${strays.length} cards have words outside the middle square: ${strays.join(", ")}`);
    process.exit(1);
  }
}

main().catch((e) => { console.error("cards.js: " + e.message); process.exit(1); });
