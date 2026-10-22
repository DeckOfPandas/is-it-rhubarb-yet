// Draw the site's icons and the profile picture as PNGs, in Anton, which
// a favicon cannot load for itself. Each is drawn on a canvas exactly its
// own size, so the type is set at that size (not shrunk from a large
// picture), the underline bar lands on whole pixels, and no browser
// scale factor is involved.
//
// A design is lines of runs; a run may be pink and carry the underline
// bar, and a run with a gap starts that many em of ink after the run
// before it ends, so word gaps look equal whatever the letters' side
// bearings. measureText gives each glyph's ink, so the block of ink is what is
// fitted and centred: its larger side to FILL of the square, or, for a
// picture that will be cut to a circle, its diagonal to FILL of the
// circle's diameter.
//
// The icons step down by size, one design at each: the R alone at 16,
// where IIRY blurs; IIRY at 32 and 48; IS IT / RHUBARB / YET? stacked from
// 96 up, its 180 and 192 fitted by diagonal because launchers cut them to
// a circle. _layouts/default.html links each with its sizes, and
// tests/cards checks every linked file is that size.
//
// usage: node tools/icons.js [--out tmp/socials]   draws the profile picture,
//   profile-800.png, and the site's icons there, for uploading. The site
//   does not use the profile picture, and tmp/ is not committed.
// tools/cards.js calls drawIcons() with SITE_ICONS for the site's own.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SHED = "#16110e", SHED_INK = "#f3ede4", RHUBARB = "#ff2d78", CUSTARD = "#fbf3d9", INK = "#1c1714";

const R = [{ text: "R", pink: true, bar: true }];
const DESIGNS = {
  r: [R],
  iiry: [[{ text: "II" }, { text: "R", pink: true, bar: true }, { text: "Y" }]],
  line: [[{ text: "II" }, { text: "RHUBARB", pink: true, bar: true, gap: 0.2 }, { text: "Y", gap: 0.2 }]],
  stack: [[{ text: "IS IT" }], [{ text: "RHUBARB", pink: true, bar: true }], [{ text: "YET?" }]],
};

// Runs in the page. Returns the PNG as a data URL, with the font size and
// the height of the capitals in pixels.
function DRAW({ design, size, fill, circle, align, bg, ink, pink }) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  // Measure at 100px, in em: advance and ink of every run on every line.
  const REF = 100;
  ctx.font = `${REF}px Anton`;
  ctx.letterSpacing = `${REF * 0.01}px`;
  const BAR_GAP = 0.07, BAR = 0.075, LEAD = 0.2;
  const lines = design.map((runs) => {
    let x = 0, left = Infinity, right = -Infinity, cap = 0;
    const placed = runs.map((run) => {
      const m = ctx.measureText(run.text);
      if (run.gap != null && right > -Infinity) x = right + run.gap * REF + m.actualBoundingBoxLeft;
      const p = { ...run, x, inkL: x - m.actualBoundingBoxLeft, inkR: x + m.actualBoundingBoxRight };
      left = Math.min(left, p.inkL); right = Math.max(right, p.inkR);
      cap = Math.max(cap, m.actualBoundingBoxAscent);
      x += m.width;
      return p;
    });
    const bar = placed.some((p) => p.bar);
    return { placed, left: left / REF, width: (right - left) / REF, cap: cap / REF, bar };
  });
  // The block in em: lines one under another, LEAD apart, and room for a
  // bar under any line that has one.
  const barH = BAR_GAP + BAR;
  const W = Math.max(...lines.map((l) => l.width));
  let H = 0;
  lines.forEach((l, i) => { H += l.cap + (l.bar ? barH : 0) + (i ? LEAD : 0); });
  const fit = circle ? Math.hypot(W, H) : Math.max(W, H);
  let px = (fill * size) / fit;
  const small = size <= 48;
  if (small) px = Math.floor(px);
  const x0 = (size - W * px) / 2;
  let y = (size - H * px) / 2;
  ctx.font = `${px}px Anton`;
  ctx.letterSpacing = `${px * 0.01}px`;
  ctx.textBaseline = "alphabetic";
  const snap = (v) => (small ? Math.round(v) : v);
  lines.forEach((l, i) => {
    if (i) y += LEAD * px;
    const base = snap(y + l.cap * px);
    const shift = (align === "centre" ? (W - l.width) / 2 : 0) * px - l.left * px;
    l.placed.forEach((p) => {
      const scale = px / REF;
      const x = snap(x0 + shift + p.x * scale);
      ctx.fillStyle = p.pink ? pink : ink;
      ctx.fillText(p.text, x, base);
      if (p.bar) {
        const top = snap(base + BAR_GAP * px);
        const h = Math.max(1, snap(BAR * px));
        const left = snap(x0 + shift + p.inkL * scale), right = snap(x0 + shift + p.inkR * scale);
        ctx.fillRect(left, top, right - left, h);
      }
    });
    y = base + (l.bar ? barH * px : 0);
  });
  const capPx = Math.min(...lines.map((l) => l.cap)) * px;
  return { url: canvas.toDataURL("image/png"), capPx: Math.round(capPx * 10) / 10, fontPx: Math.round(px * 10) / 10 };
}

function fontPage() {
  const data = fs.readFileSync(path.join(ROOT, "assets", "fonts", "anton-latin.woff2")).toString("base64");
  return `<!doctype html><html><head><meta charset="utf-8"><style>@font-face { font-family: Anton; ` +
    `src: url(data:font/woff2;base64,${data}) format("woff2"); }</style></head><body></body></html>`;
}

const PALETTES = {
  shed: { bg: SHED, ink: SHED_INK, pink: RHUBARB },
  custard: { bg: CUSTARD, ink: INK, pink: RHUBARB },
};

// Draws each { file, design, size, fill, circle, align, palette } into dir
// and returns each file's font size and capital height in pixels.
async function drawIcons(browser, dir, list) {
  const tab = await browser.newPage();
  await tab.setContent(fontPage(), { waitUntil: "load" });
  await tab.evaluate(() => document.fonts.load("100px Anton"));
  fs.mkdirSync(dir, { recursive: true });
  const metrics = {};
  for (const icon of list) {
    const { url, capPx, fontPx } = await tab.evaluate(DRAW, {
      design: DESIGNS[icon.design], size: icon.size, fill: icon.fill, circle: !!icon.circle,
      align: icon.align || "left", ...PALETTES[icon.palette || "shed"],
    });
    fs.writeFileSync(path.join(dir, icon.file), Buffer.from(url.split(",")[1], "base64"));
    metrics[icon.file] = { capPx, fontPx };
  }
  await tab.close();
  return metrics;
}

// A square icon's ink fills 84% of it; one cut to a circle fits its
// diagonal to 96% of the circle. The profile picture, which every platform
// cuts to a circle and shows at every size from 40px up, is the stack on
// the shed with its diagonal at 98%.
const SITE_ICONS = [
  { file: "favicon-16.png", design: "r", size: 16, fill: 0.84 },
  { file: "favicon-32.png", design: "iiry", size: 32, fill: 0.84 },
  { file: "favicon-48.png", design: "iiry", size: 48, fill: 0.84 },
  { file: "icon-96.png", design: "stack", size: 96, fill: 0.84 },
  { file: "apple-touch-icon.png", design: "stack", size: 180, fill: 0.96, circle: true },
  { file: "icon-192.png", design: "stack", size: 192, fill: 0.96, circle: true },
];
const PROFILE = { file: "profile-800.png", design: "stack", size: 800, fill: 0.98, circle: true };

module.exports = { drawIcons, DESIGNS, SITE_ICONS, PROFILE };

if (require.main === module) {
  const at = process.argv.indexOf("--out");
  const out = path.resolve(ROOT, at >= 0 ? process.argv[at + 1] : path.join("tmp", "socials"));
  (async () => {
    const { chromium } = require("playwright");
    const browser = await chromium.launch();
    await drawIcons(browser, out, [PROFILE, ...SITE_ICONS]);
    await browser.close();
    console.log(`drew the profile picture and ${SITE_ICONS.length} icons into ${path.relative(ROOT, out)}`);
  })().catch((e) => { console.error("icons.js: " + e.message); process.exit(1); });
}
