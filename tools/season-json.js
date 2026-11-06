// The season file, /season/v1.json: every food and never-food with one
// state per month, for other sites to read. Built from the data, not the
// bake, so it changes only when the data does and is the same whatever
// day it is built. season/v1.schema.json is its contract; the file is
// checked against it before it is written.
//
// A food's weeks come from Verdict.timelineOf, the combined timeline its
// verdict is read from. A week belongs to the month its middle day falls
// in, on a non-leap year. Each week reads:
//   in -> great_now; store or glass -> from_store; none -> out;
//   avail -> coming_in when, past the "avail" weeks around it, an
//   in-season run lies ahead, a lull between two runs included, as the
//   verdict reads it (NEARLY, "a few about now, in earnest in May");
//   going_out otherwise: a run behind only, or none at all (a few about
//   with no season proper, which the verdict calls JUST).
// A month takes the state most of its weeks have; a tie goes to the
// first of MONTH_ORDER. A never-food reads never; an unsold food, out.
//
// usage: node tools/season-json.js [<site dir>]   writes <dir>/season/v1.json
//        node tools/season-json.js --check        validates, writes nothing
"use strict";
const fs = require("fs");
const path = require("path");
const Verdict = require("../assets/verdict.js");
const { loadYaml } = require("./yaml.js");
const { validate } = require("./schema-check.js");

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_FILE = path.join(ROOT, "season", "v1.schema.json");
const NON_LEAP_YEAR = 2026;
const MONTH_ORDER = ["great_now", "coming_in", "going_out", "from_store", "out"];

// The month (0-11) each week 1-52 belongs to.
const WEEK_MONTH = [null];
for (let w = 1; w <= 52; w++) WEEK_MONTH.push(Verdict.midOfWeek({ week: w, years: 0 }, NON_LEAP_YEAR).getMonth());

function step(w, dir) { return dir > 0 ? Verdict.nextWeek(w) : Verdict.prevWeek(w); }

// The first state that is not "avail", walking from week w in direction dir.
function beyondAvail(timeline, w, dir) {
  for (let n = 0, x = step(w, dir); n < 52; n++, x = step(x, dir)) {
    if (timeline[x] !== "avail") return timeline[x];
  }
  return "avail";
}

function weekState(timeline, w) {
  const s = timeline[w];
  if (s === "in") return "great_now";
  if (s === "store" || s === "glass") return "from_store";
  if (s !== "avail") return "out";
  return beyondAvail(timeline, w, 1) === "in" ? "coming_in" : "going_out";
}

function monthsOf(food) {
  if (food.unsold) return new Array(12).fill("out");
  const timeline = Verdict.timelineOf(food).timeline;
  const counts = Array.from({ length: 12 }, () => ({}));
  for (let w = 1; w <= 52; w++) {
    const c = counts[WEEK_MONTH[w]], s = weekState(timeline, w);
    c[s] = (c[s] || 0) + 1;
  }
  return counts.map((c) => MONTH_ORDER.reduce((best, s) => ((c[s] || 0) > (c[best] || 0) ? s : best), MONTH_ORDER[0]));
}

function seasonFile(foods, never) {
  const out = foods.map((f) => ({
    id: f.slug,
    name: f.name,
    aliases: f.aliases || [],
    glasshouse: f.varieties.some(Verdict.isGlasshouse),
    never: false,
    months: monthsOf(f)
  }));
  for (const f of never) {
    out.push({ id: f.slug, name: f.name, aliases: f.aliases || [], glasshouse: false, never: true, months: new Array(12).fill("never") });
  }
  out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { schema_version: 1, foods: out };
}

function build() {
  const foods = loadYaml(path.join(ROOT, "_data", "foods.yml"));
  const neverPath = path.join(ROOT, "_data", "never.yml");
  const never = fs.existsSync(neverPath) ? loadYaml(neverPath) : [];
  const file = seasonFile(foods, never);
  const problems = validate(JSON.parse(fs.readFileSync(SCHEMA_FILE, "utf8")), file);
  return { file, problems };
}

if (require.main === module) {
  const arg = process.argv[2] || "_site";
  const { file, problems } = build();
  if (problems.length) {
    console.error("season-json.js: the season file does not match season/v1.schema.json:");
    for (const p of problems.slice(0, 50)) console.error("  " + p);
    process.exit(1);
  }
  if (arg === "--check") {
    console.log("season file valid: " + file.foods.length + " foods");
  } else {
    const dir = path.join(arg, "season");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "v1.json"), JSON.stringify(file, null, 1) + "\n");
    console.log("wrote " + path.join(dir, "v1.json") + ": " + file.foods.length + " foods");
  }
}

module.exports = { seasonFile, monthsOf, weekState, WEEK_MONTH, build };
