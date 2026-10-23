// The three charts draw without a console error or an uncaught
// exception at a phone, a tablet and a desktop width: the calendar, the
// wheel and home's arrivals dial, with the search answering on home too;
// then the shapes of an answer: rows on home, a chip on the wheel, the
// page from a calendar row.
// The built site is served to Chromium from _site over a routed origin,
// so no server is needed. Needs Playwright, as tools/cards.js does; with
// none on NODE_PATH the test is skipped, not failed.
//
// usage: node --test tests/build/charts.test.js   (after sh tools/build.sh)
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadYaml } = require("../../tools/yaml.js");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = path.join(ROOT, "_site");
const config = loadYaml(path.join(ROOT, "_config.yml"));
const BASE = (config.baseurl || "").replace(/\/$/, "");
const ORIGIN = "http://site.test";
const WIDTHS = [390, 820, 1280];
const PAGES = ["/", "/calendar/", "/wheel/", "/?q=app", "/rhubarb/"];

let chromium = null;
try { ({ chromium } = require("playwright")); } catch (e) { chromium = null; }

const TYPES = { html: "text/html", css: "text/css", js: "text/javascript", json: "application/json", svg: "image/svg+xml",
  png: "image/png", ics: "text/calendar", woff2: "font/woff2", woff: "font/woff", ico: "image/x-icon", webmanifest: "application/manifest+json" };

// The file in _site a routed request is for: the path under the baseurl,
// a directory's index.html.
function fileFor(url) {
  const u = new URL(url);
  let p = decodeURIComponent(u.pathname);
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(SITE, p);
  if (!file.startsWith(SITE)) return null;
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

test("the charts draw at three widths with no console error", { skip: !chromium && "playwright is not on NODE_PATH" }, async () => {
  assert.ok(fs.existsSync(path.join(SITE, "index.html")), "no _site: run sh tools/build.sh first");
  const browser = await chromium.launch();
  const problems = [];
  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route("**/*", (route) => {
        const file = fileFor(route.request().url());
        if (!file) return route.fulfill({ status: 404, body: "not here" });
        const ext = path.extname(file).slice(1);
        route.fulfill({ status: 200, contentType: TYPES[ext] || "application/octet-stream", body: fs.readFileSync(file) });
      });
      const page = await context.newPage();
      let current = "";
      page.on("console", (m) => { if (m.type() === "error") problems.push(`${width} ${current}: console: ${m.text()}`); });
      page.on("pageerror", (e) => problems.push(`${width} ${current}: ${e.message}`));
      page.on("requestfailed", (r) => problems.push(`${width} ${current}: ${r.url()} failed: ${r.failure() && r.failure().errorText}`));
      for (const p of PAGES) {
        current = p;
        await page.goto(ORIGIN + BASE + p, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);
        const drawn = await page.evaluate(() => ({
          svgs: document.querySelectorAll("svg").length,
          rows: document.querySelectorAll(".food-row").length,
          verdict: (document.querySelector(".verdict-word") || {}).textContent || ""
        }));
        if (p === "/calendar/" && drawn.svgs < 1) problems.push(`${width} ${p}: no calendar drawn`);
        if (p === "/wheel/" && drawn.svgs < 1) problems.push(`${width} ${p}: no wheel drawn`);
        if (p === "/?q=app" && drawn.rows < 1) problems.push(`${width} ${p}: no search results`);
        if (p === "/rhubarb/" && !drawn.verdict) problems.push(`${width} ${p}: no verdict word`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  assert.deepEqual(problems, []);
});

// Home answers with rows and no card, the keycap on the row Enter would
// open; the wheel opens a chip on Enter and Enter again follows it; a
// calendar row's click goes straight to the page.
test("rows on home, a chip on the wheel, the page from the calendar", { skip: !chromium && "playwright is not on NODE_PATH" }, async () => {
  assert.ok(fs.existsSync(path.join(SITE, "index.html")), "no _site: run sh tools/build.sh first");
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.route("**/*", (route) => {
      const file = fileFor(route.request().url());
      if (!file) return route.fulfill({ status: 404, body: "not here" });
      const ext = path.extname(file).slice(1);
      route.fulfill({ status: 200, contentType: TYPES[ext] || "application/octet-stream", body: fs.readFileSync(file) });
    });
    const page = await context.newPage();
    await page.goto(ORIGIN + BASE + "/?q=apples", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const home = await page.evaluate(() => ({
      cards: document.querySelectorAll(".one-result").length,
      label: document.getElementById("results-label").textContent,
      rows: Array.from(document.querySelectorAll("#found .food-row .food-title")).map((n) => n.textContent),
      keycapOn: (document.querySelector("#found .key-hint") || {}).closest ? document.querySelector("#found .key-hint").closest("a").querySelector(".food-title").textContent : null,
      rule: !!document.querySelector('script[type="speculationrules"]')
    }));
    assert.equal(home.cards, 0, "no card on home");
    assert.equal(home.label, "2 matches");
    assert.deepEqual(home.rows, ["Apples", "Crab apples"]);
    assert.equal(home.keycapOn, "Apples", "the keycap sits on the first row");
    assert.ok(home.rule, "the first row's page is prerendered");
    await page.fill("#hook-input", "zzz");
    await page.waitForTimeout(300);
    assert.deepEqual(await page.evaluate(() => [document.querySelectorAll(".one-result").length, document.getElementById("hook-none").hidden, document.querySelector(".none-word").textContent]),
      [0, false, "Literally no idea."], "no match is bare text");

    await page.goto(ORIGIN + BASE + "/wheel/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('figure.wheel.by-all a.label[data-slug="rhubarb"]').focus());
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    const chip = await page.evaluate(() => {
      const c = document.querySelector(".tt-chip");
      return c && { label: c.getAttribute("aria-label"), ask: c.querySelector(".chip-ask").textContent.replace(/\s+/g, " ").trim(), focused: document.activeElement === c.querySelector(".tt-chip-link") };
    });
    assert.deepEqual(chip, { label: "Rhubarb", ask: "Is it rhubarb yet?", focused: true });
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/rhubarb\/$/, { timeout: 5000 });

    await page.goto(ORIGIN + BASE + "/calendar/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.click('.cal-labels a.row[data-slug="asparagus"]');
    await page.waitForURL(/\/asparagus\/$/, { timeout: 5000 });
    assert.equal(await page.evaluate(() => document.querySelectorAll(".tt-chip").length), 0, "no chip on the calendar's way to the page");
    await context.close();
  } finally {
    await browser.close();
  }
});
