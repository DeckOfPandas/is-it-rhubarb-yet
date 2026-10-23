// A perceptual hash of each page in a fixed set, so a change that moves
// the layout is caught without a raster file in the repository: the
// built site is served to Chromium from _site over a routed origin, with
// the clock frozen on one day, motion reduced and Math.random seeded, and
// each full-page shot is shrunk to nine by eight greys and read as the
// 64 bits of "is this pixel darker than its right-hand neighbour" (a
// dHash). Two hashes within THRESHOLD bits are the same page to the eye.
// tests/build/shots.test.js compares the site against the hashes in
// tests/build/shot-hashes.json; after a change that is meant to move
// things, write them again.
//
// usage: node tools/dev/shot-hash.js            print each shot's distance from the baseline
//        node tools/dev/shot-hash.js --write    rewrite tests/build/shot-hashes.json
//
// Needs Playwright on NODE_PATH, as tools/cards.js does, and a built site.
"use strict";
const fs = require("fs");
const path = require("path");
const { loadYaml } = require("../yaml.js");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = path.join(ROOT, "_site");
const BASELINE = path.join(ROOT, "tests", "build", "shot-hashes.json");
const config = loadYaml(path.join(ROOT, "_config.yml"));
const BASE = (config.baseurl || "").replace(/\/$/, "");
const ORIGIN = "http://site.test";
// A Sunday in week 43, as tools/dev/shots.js freezes it.
const DAY = "2026-10-25T12:00:00";
const THRESHOLD = 6;
const WIDTHS = [390, 1280];
// Pages whose look does not turn on the build day: the pages of prose,
// the not-found page, the charts at a fixed time, and rhubarb, whose
// verdict the frozen clock fixes.
const PAGES = ["/", "/about/", "/sources/", "/not-a-food-at-all/", "/calendar/?when=mid-december", "/wheel/?when=mid-december", "/rhubarb/", "/now/"];

const TYPES = { html: "text/html", css: "text/css", js: "text/javascript", json: "application/json", svg: "image/svg+xml",
  png: "image/png", ics: "text/calendar", woff2: "font/woff2", woff: "font/woff", ico: "image/x-icon", webmanifest: "application/manifest+json" };

// The file in _site a routed request is for, or the not-found page.
function fileFor(url) {
  const u = new URL(url);
  let p = decodeURIComponent(u.pathname);
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(SITE, p);
  if (file.startsWith(SITE) && fs.existsSync(file) && fs.statSync(file).isFile()) return { file, status: 200 };
  return { file: path.join(SITE, "404.html"), status: 404 };
}

// Hamming distance between two hex hashes.
function distance(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}

function keyOf(page, width) { return page + " @" + width; }

// The hash of a page's screenshot, worked out in the browser on a canvas.
async function hashShot(page, buffer) {
  return page.evaluate((dataUrl) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 9; canvas.height = 8;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 9, 8);
      const px = ctx.getImageData(0, 0, 9, 8).data;
      const grey = (i) => 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
      let bits = "";
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += grey(y * 9 + x) > grey(y * 9 + x + 1) ? "1" : "0";
      let hex = "";
      for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
      resolve(hex);
    };
    img.onerror = () => reject(new Error("the screenshot would not decode"));
    img.src = dataUrl;
  }), "data:image/png;base64," + buffer.toString("base64"));
}

async function hashSite(chromium) {
  if (!fs.existsSync(path.join(SITE, "index.html"))) throw new Error("no _site: run sh tools/build.sh first");
  const browser = await chromium.launch();
  const hashes = {};
  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce", colorScheme: "light" });
      await context.clock.install({ time: new Date(DAY) });
      // The same "random" picks every time: a small linear congruential
      // generator in Math.random's place.
      await context.addInitScript(() => {
        let seed = 12345;
        Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
      });
      await context.route("**/*", (route) => {
        const { file, status } = fileFor(route.request().url());
        const ext = path.extname(file).slice(1);
        route.fulfill({ status, contentType: TYPES[ext] || "application/octet-stream", body: fs.readFileSync(file) });
      });
      const page = await context.newPage();
      for (const p of PAGES) {
        await page.goto(ORIGIN + BASE + p, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: ".site-header { position: static !important; }" });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(400);
        const shot = await page.screenshot({ fullPage: true });
        hashes[keyOf(p, width)] = await hashShot(page, shot);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return hashes;
}

function readBaseline() {
  return fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : null;
}

// Each shot against the baseline: [key, distance or null when the
// baseline lacks it].
function compare(hashes, baseline) {
  return Object.keys(hashes).map((k) => [k, baseline && baseline[k] ? distance(hashes[k], baseline[k]) : null]);
}

if (require.main === module) {
  const write = process.argv.includes("--write");
  const { chromium } = require("playwright");
  hashSite(chromium).then((hashes) => {
    if (write) {
      fs.writeFileSync(BASELINE, JSON.stringify(hashes, null, 1) + "\n");
      console.log("wrote " + Object.keys(hashes).length + " hashes to " + path.relative(ROOT, BASELINE));
      return;
    }
    const baseline = readBaseline();
    let moved = 0;
    for (const [k, d] of compare(hashes, baseline)) {
      const verdict = d === null ? "no baseline" : d > THRESHOLD ? "MOVED" : "same";
      if (d === null || d > THRESHOLD) moved++;
      console.log((d === null ? " -" : String(d).padStart(2)) + "  " + verdict.padEnd(11) + k);
    }
    process.exit(moved ? 1 : 0);
  }).catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { hashSite, compare, readBaseline, distance, PAGES, WIDTHS, THRESHOLD, BASELINE };
