// One JSON file per food and never-food, /foods/<slug>.json: the food's
// own data as foods.yml has it, plus what the build day's bake says
// about it (the verdict, the date line, its season in months, each
// ring's own line) and the day that was true for. A never-food reads
// NEVER with its line. Written into the built site after Jekyll, from
// the data and _data/baked.json, so the verdict is the bake's and never
// recomputed; tools/build.sh and the deploy run it. The Source data page
// says what the fields mean.
//
// usage: node tools/food-json.js [<site dir>]   (default _site)
"use strict";
const fs = require("fs");
const path = require("path");
const { loadYaml } = require("./yaml.js");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "_data");

// The file for one food: its data, then the bake's answer under `asOf`.
function foodFile(food, baked) {
  const b = baked.foods[food.slug] || {};
  const out = Object.assign({}, food);
  out.asOf = {
    date: baked.asof,
    week: baked.week,
    verdict: b.verdict || null,
    line: b.line || "",
    season: b.season === undefined ? null : b.season,
    rings: (b.rings || []).map((i) => ({ index: i, name: (food.varieties || [])[i] ? (food.varieties[i].name || "") : "", line: (b.ringLines || [])[i] || "" }))
  };
  return out;
}

function writeAll(dir) {
  const foods = loadYaml(path.join(DATA, "foods.yml"));
  const never = fs.existsSync(path.join(DATA, "never.yml")) ? loadYaml(path.join(DATA, "never.yml")) : [];
  const baked = JSON.parse(fs.readFileSync(path.join(DATA, "baked.json"), "utf8"));
  const out = path.join(dir, "foods");
  fs.mkdirSync(out, { recursive: true });
  let n = 0;
  for (const food of foods) {
    fs.writeFileSync(path.join(out, food.slug + ".json"), JSON.stringify(foodFile(food, baked), null, 1) + "\n");
    n++;
  }
  for (const item of never) {
    const file = Object.assign({ never: true }, item, { asOf: { date: baked.asof, week: baked.week, verdict: "NEVER", line: item.line, season: null, rings: [] } });
    fs.writeFileSync(path.join(out, item.slug + ".json"), JSON.stringify(file, null, 1) + "\n");
    n++;
  }
  return n;
}

if (require.main === module) {
  const dir = process.argv[2] || "_site";
  if (!fs.existsSync(path.join(DATA, "baked.json"))) {
    console.error("food-json.js: no _data/baked.json: run node tools/bake.js first");
    process.exit(1);
  }
  const n = writeAll(dir);
  console.log("wrote " + n + " food files into " + path.join(dir, "foods"));
}

module.exports = { foodFile, writeAll };
