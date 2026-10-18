// Bake today's verdicts into _data/baked.json, which the Liquid templates
// read, so that the HTML is right for anything that does not run
// JavaScript: link previews, search engines, no-JS visitors. The browser
// recomputes everything from the same module (assets/verdict.js) for
// whatever day the visitor opens the page.
//
// usage: node tools/bake.js                     bake for today
//        node tools/bake.js --date 2026-10-18   bake for a given day
//
// Run before `bundle exec jekyll build`; tools/build.sh does both.
"use strict";
const fs = require("fs");
const path = require("path");
const V = require("../assets/verdict.js");
const { loadYaml } = require("./yaml.js");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "_data");

function today() {
  const at = process.argv.indexOf("--date");
  const given = at >= 0 ? process.argv[at + 1] : null;
  if (!given) return new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(given)) throw new Error("--date must be YYYY-MM-DD, not " + given);
  const [y, m, d] = given.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

function isoDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function titleWord(verdict) {
  return verdict.charAt(0) + verdict.slice(1).toLowerCase();
}

function main() {
  const foods = loadYaml(path.join(DATA, "foods.yml"));
  const groups = loadYaml(path.join(DATA, "groups.yml"));
  const quotes = loadYaml(path.join(DATA, "quotes.yml"));
  const never = fs.existsSync(path.join(DATA, "never.yml")) ? loadYaml(path.join(DATA, "never.yml")) : [];
  const date = today();
  const week = V.weekOf(date);
  const year = date.getFullYear();

  const baked = {
    asof: isoDate(date),
    asofText: V.fmtDateYear(date),
    week: week,
    year: year,
    range: V.fmtRange(week, year),
    foods: {},
    now: V.nowLists(foods, groups, week, year, date)
  };

  foods.forEach((f) => {
    const fv = V.foodVerdict(f, week);
    const q = V.pickQuote(quotes, fv.verdict, f.slug, week);
    baked.foods[f.slug] = {
      verdict: fv.verdict,
      word: titleWord(fv.verdict),
      line: V.dateLine(fv.variety, year, date),
      varietyLine: V.varietyLine(f, fv, year, date),
      variety: fv.variety.name || "",
      since: fv.variety.since === undefined ? null : fv.variety.since,
      quote: q ? { text: q.text, by: q.by } : null
    };
  });
  never.forEach((n) => {
    const q = V.pickQuote(quotes, "NEVER", n.slug, week);
    baked.foods[n.slug] = {
      verdict: "NEVER", word: "Never", line: n.line, varietyLine: "", variety: "", since: null,
      quote: q ? { text: q.text, by: q.by } : null
    };
  });

  const out = path.join(DATA, "baked.json");
  fs.writeFileSync(out, JSON.stringify(baked, null, 1) + "\n");
  console.log("baked " + Object.keys(baked.foods).length + " verdicts for " + baked.asofText +
    " (week " + week + ") into _data/baked.json");
}

main();
