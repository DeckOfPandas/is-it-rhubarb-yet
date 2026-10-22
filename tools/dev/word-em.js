// Measure each verdict word's width in Anton, in em, on the running
// site, for _data/word_em.yml: the stylesheet sizes a food page's verdict
// from the line's width and that ratio, so the word fills its line before
// any script runs and nothing shifts when the fonts arrive.
//
// USAGE:
//   node tools/dev/word-em.js <base-url>
//
// Prints YAML to paste into _data/word_em.yml. Measured at 100px with the
// stylesheet's own .verdict-word rules (Anton, --track-large), so the
// ratios hold at every size from 40px up.
"use strict";
const { chromium } = require("playwright");

const WORDS = ["Yes.", "Just.", "Yes-ish.", "Nearly.", "No.", "Never.", "Literally no idea."];
const base = (process.argv[2] || "").replace(/\/$/, "");
if (!base) { console.error("usage: node tools/dev/word-em.js <base-url>"); process.exit(2); }

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(base + "/rhubarb/", { waitUntil: "networkidle" });
  const out = await page.evaluate(async (words) => {
    await document.fonts.ready;
    const box = document.querySelector("h1.verdict");
    const result = {};
    for (const w of words) {
      const span = document.createElement("span");
      span.className = "verdict-word";
      span.style.fontSize = "100px";
      span.style.position = "absolute";
      span.style.visibility = "hidden";
      span.textContent = w;
      box.appendChild(span);
      result[w] = +(span.getBoundingClientRect().width / 100).toFixed(4);
      span.remove();
    }
    return result;
  }, WORDS);
  await browser.close();
  console.log("# Each verdict word's width in Anton, in em, measured by");
  console.log("# tools/dev/word-em.js. assets/site.css sizes the verdict from it.");
  for (const [w, em] of Object.entries(out)) console.log(`"${w}": ${em}`);
})();
