// Every food's whole-food verdict for each of the 52 weeks, as JSON on
// standard output: {"<slug>": ["YES", ...]}. tools/check-foods.py runs
// this (the verdict rules live in assets/verdict.js, which Python cannot
// run) to warn where a verdict lasts a single week.
//
// usage: node tools/sweep-verdicts.js
"use strict";
const path = require("path");
const V = require("../assets/verdict.js");
const { loadYaml } = require("./yaml.js");

const foods = loadYaml(path.join(__dirname, "..", "_data", "foods.yml"));
const out = {};
for (const f of foods) {
  if (f.unsold) continue;
  const row = [];
  for (let w = 1; w <= 52; w++) row.push(V.foodVerdict(f, w).verdict);
  out[f.slug] = row;
}
process.stdout.write(JSON.stringify(out));
