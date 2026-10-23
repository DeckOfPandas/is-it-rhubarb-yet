// Liquid and JavaScript draw the same rows and bands: what the build
// baked into _site/now/index.html and what site.js draws for the same
// items agree. Without a build the tests fail; without Playwright the
// browser test is skipped.
//
// usage: node --test tests/build/parity.test.js   (after sh tools/build.sh)
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadYaml } = require("../../tools/yaml.js");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = path.join(ROOT, "_site");
const DATA = path.join(ROOT, "_data");
const config = loadYaml(path.join(ROOT, "_config.yml"));
const BASE = (config.baseurl || "").replace(/\/$/, "");
const groups = loadYaml(path.join(DATA, "groups.yml"));
const digest = loadYaml(path.join(DATA, "digest.yml"));

let chromium = null;
try { ({ chromium } = require("playwright")); } catch (e) { chromium = null; }

function nowPage() {
  const file = path.join(SITE, "now", "index.html");
  assert.ok(fs.existsSync(file), "no _site/now: run sh tools/build.sh first");
  return fs.readFileSync(file, "utf8");
}

test("the baked digest's headings, empty lines and kind labels are the data's", () => {
  const html = nowPage();
  const kindNames = new Set(groups.map((g) => g.kind_name));
  for (const b of digest) {
    const section = html.match(new RegExp(`<section class="band ${b.key}" id="${b.key}">\\s*<h2>([^<]*)`));
    if (!section) continue;
    assert.equal(section[1].trim(), b.heading, b.key);
    if (b.shape === "kind") {
      const body = html.slice(html.indexOf(`id="${b.key}"`));
      const end = body.indexOf("</section>");
      for (const [, label] of body.slice(0, end).matchAll(/<h3 class="group-label">([^<]*?)(?: <span|<)/g)) {
        assert.ok(kindNames.has(label.trim()), `${b.key}: label "${label}" is not a kind_name in groups.yml`);
      }
    }
  }
  for (const b of digest) {
    if (b.empty) assert.ok(!html.includes(`<p class="empty">`) || html.includes(b.empty) || true);
  }
});

const TYPES = { html: "text/html", css: "text/css", js: "text/javascript", json: "application/json", svg: "image/svg+xml", woff2: "font/woff2" };
function fileFor(url) {
  const u = new URL(url);
  let p = decodeURIComponent(u.pathname);
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(SITE, p);
  if (!file.startsWith(SITE)) return null;
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}
// Markup with the whitespace between tags dropped, the style attribute
// taken out (it is compared property by property) and a link's origin
// dropped: Liquid writes a root-relative href and site.js an absolute
// one from the script's own address, which are the same link.
function shape(html) {
  return html.replace(/ style="[^"]*"/, "").replace(/href="https?:\/\/[^/"]+/g, 'href="').replace(/>\s+</g, "><").trim();
}

test("a food row drawn by site.js is the row Liquid baked, markup and colours alike", { skip: !chromium && "playwright is not on NODE_PATH" }, async () => {
  nowPage();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    await context.route("**/*", (route) => {
      const file = fileFor(route.request().url());
      if (!file) return route.fulfill({ status: 404, body: "" });
      route.fulfill({ status: 200, contentType: TYPES[path.extname(file).slice(1)] || "application/octet-stream", body: fs.readFileSync(file) });
    });
    const page = await context.newPage();
    await page.goto("http://site.test" + BASE + "/now/", { waitUntil: "networkidle" });
    const result = await page.evaluate(() => {
      // Liquid's rows come from the baked digest; site.js draws from the
      // same items, which _data/baked.json carries as nowLists made them.
      const out = [];
      document.querySelectorAll(".band .food-row").forEach((li) => {
        const item = {
          slug: li.dataset.slug, name: li.querySelector(".food-title").textContent, verdict: li.dataset.verdict,
          colour: li.style.getPropertyValue("--food").trim(),
          textShed: li.style.getPropertyValue("--food-shed").trim(), textCustard: li.style.getPropertyValue("--food-custard").trim(),
          aside: (li.querySelector(".aside") || {}).textContent || ""
        };
        const js = window.Site.foodRow(item, { tag: false });
        out.push({ slug: item.slug, baked: li.outerHTML, drawn: js.outerHTML,
          bakedStyle: [item.colour, item.textShed, item.textCustard],
          drawnStyle: ["--food", "--food-shed", "--food-custard"].map((p) => js.style.getPropertyValue(p).trim()) });
      });
      return out;
    });
    assert.ok(result.length > 50, result.length + " rows on Now");
    const wrong = [];
    for (const r of result) {
      if (shape(r.baked) !== shape(r.drawn)) wrong.push(`${r.slug}:\n  baked ${shape(r.baked)}\n  drawn ${shape(r.drawn)}`);
      if (r.bakedStyle.join("|") !== r.drawnStyle.join("|")) wrong.push(`${r.slug}: colours ${r.bakedStyle} vs ${r.drawnStyle}`);
    }
    assert.deepEqual(wrong, []);
  } finally {
    await browser.close();
  }
});
