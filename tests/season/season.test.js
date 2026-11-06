// The season file: its month rule on small made-up foods, the schema check
// and what it refuses, and the real data against season/v1.schema.json.
// Needs no build.
//
// usage: node --test tests/season/season.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { seasonFile, monthsOf, WEEK_MONTH, build } = require("../../tools/season-json.js");
const { validate } = require("../../tools/schema-check.js");

const ROOT = path.resolve(__dirname, "..", "..");
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "season", "v1.schema.json"), "utf8"));

function food(weeks, extra) {
  return Object.assign({ name: "Test", slug: "test", varieties: [{ name: "", weeks: weeks }] }, extra || {});
}
// The weeks whose middle day falls in month m (0-11).
function weeksOf(m) {
  const out = [];
  for (let w = 1; w <= 52; w++) if (WEEK_MONTH[w] === m) out.push(w);
  return out;
}

test("every week belongs to one month and every month has four or five weeks", () => {
  for (let m = 0; m < 12; m++) assert.ok([4, 5].includes(weeksOf(m).length), `month ${m}: ${weeksOf(m)}`);
});

test("a season reads coming in, great now, going out, then out", () => {
  const may = weeksOf(4), jun = weeksOf(5), jul = weeksOf(6), aug = weeksOf(7);
  const months = monthsOf(food([
    [may[0], may[may.length - 1], "avail"],
    [jun[0], jul[jul.length - 1], "in"],
    [aug[0], aug[aug.length - 1], "avail"]
  ]));
  assert.deepEqual(months, ["out", "out", "out", "out", "coming_in", "great_now", "great_now", "going_out", "out", "out", "out", "out"]);
});

test("storage reads from store, and so does a glasshouse ring that is in", () => {
  const jan = weeksOf(0), feb = weeksOf(1);
  assert.equal(monthsOf(food([[jan[0], jan[jan.length - 1], "store"]]))[0], "from_store");
  const glass = { name: "Glasshouse", ring: "method", method: "glasshouse", weeks: [[feb[0], feb[feb.length - 1], "in"]] };
  const f = { name: "Test", slug: "test", varieties: [{ name: "", weeks: [[30, 40, "in"]] }, glass] };
  assert.equal(monthsOf(f)[1], "from_store");
  assert.equal(seasonFile([f], []).foods[0].glasshouse, true);
});

test("a lull between two in-season runs reads coming in, as the verdict reads it", () => {
  const mar = weeksOf(2), apr = weeksOf(3), may = weeksOf(4);
  const f = food([[mar[0], mar[mar.length - 1], "in"], [apr[0], apr[apr.length - 1], "avail"], [may[0], may[may.length - 1], "in"]]);
  assert.equal(monthsOf(f)[3], "coming_in");
  const Verdict = require("../../assets/verdict.js");
  assert.equal(Verdict.foodVerdict(f, apr[1]).verdict, "NEARLY");
});

test("a few about with no season proper reads going out", () => {
  const mar = weeksOf(2);
  assert.equal(monthsOf(food([[mar[0], mar[mar.length - 1], "avail"]]))[2], "going_out");
});

test("a season wrapping the year end reads across it", () => {
  const months = monthsOf(food([[48, 52, "in"], [1, 8, "in"], [9, 12, "avail"]]));
  assert.equal(months[0], "great_now");
  assert.equal(months[11], "great_now");
  assert.equal(months[2], "going_out");
});

test("a tie between states goes to the earlier in great now, coming in, going out, from store, out", () => {
  const jun = weeksOf(5);
  const half = jun.slice(0, 2);
  const months = monthsOf(food([[half[0], half[1], "in"]]));
  assert.equal(jun.length, 4, "June has four weeks on the reference year");
  assert.equal(months[5], "great_now");
});

test("an unsold food is out all year and a never-food never", () => {
  assert.deepEqual(monthsOf(food([[1, 52, "in"]], { unsold: "Cannot be sold." })), new Array(12).fill("out"));
  const file = seasonFile([], [{ name: "Lemons", slug: "lemons", aliases: ["lemon"], line: "x" }]);
  assert.deepEqual(file.foods[0], { id: "lemons", name: "Lemons", aliases: ["lemon"], glasshouse: false, never: true, months: new Array(12).fill("never") });
});

test("the real data makes a valid season file, one entry per food and never-food", () => {
  const { file, problems } = build();
  assert.deepEqual(problems, []);
  const ids = file.foods.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length, "every id once");
  assert.deepEqual(ids, [...ids].sort(), "sorted by id, so a rebuild with unchanged data is byte-identical");
});

test("every real 'few about' week agrees with the site's verdict", () => {
  // coming_in where the verdict looks ahead (NEARLY, or YES-ISH while store
  // or glass still sells it); going_out where it looks back (JUST).
  const Verdict = require("../../assets/verdict.js");
  const { weekState } = require("../../tools/season-json.js");
  const { loadYaml } = require("../../tools/yaml.js");
  const expected = { coming_in: ["NEARLY", "YES-ISH"], going_out: ["JUST"] };
  const wrong = [];
  let checked = 0;
  for (const f of loadYaml(path.join(ROOT, "_data", "foods.yml"))) {
    if (f.unsold) continue;
    const t = Verdict.timelineOf(f).timeline;
    for (let w = 1; w <= 52; w++) {
      if (t[w] !== "avail") continue;
      checked++;
      const state = weekState(t, w), verdict = Verdict.foodVerdict(f, w).verdict;
      if (!expected[state].includes(verdict)) wrong.push(`${f.slug} week ${w}: ${state} but ${verdict}`);
    }
  }
  assert.ok(checked > 0, "no 'avail' weeks in the data: this test checked nothing");
  assert.deepEqual(wrong, []);
});

test("the schema check catches a wrong file", () => {
  const good = { schema_version: 1, foods: [{ id: "a", name: "A", aliases: [], glasshouse: false, never: false, months: new Array(12).fill("out") }] };
  assert.deepEqual(validate(schema, good), []);
  const cases = [
    [{ ...good, schema_version: 2 }, /must be 1/],
    [{ foods: good.foods }, /missing "schema_version"/],
    [{ ...good, extra: 1 }, /unexpected "extra"/],
    [{ ...good, foods: [{ ...good.foods[0], id: "Not An Id" }] }, /does not match/],
    [{ ...good, foods: [{ ...good.foods[0], months: ["out"] }] }, /fewer than 12/],
    [{ ...good, foods: [{ ...good.foods[0], months: new Array(12).fill("ripe") }] }, /is not one of/],
    [{ ...good, foods: [{ ...good.foods[0], glasshouse: "yes" }] }, /must be boolean/],
    [{ ...good, foods: [] }, /fewer than 1/]
  ];
  for (const [data, message] of cases) {
    const problems = validate(schema, data);
    assert.ok(problems.some((p) => message.test(p)), `${JSON.stringify(data).slice(0, 80)}: ${problems}`);
  }
});

test("the schema check refuses a schema keyword it does not handle", () => {
  const problems = validate({ type: "object", properties: { a: { type: "string", format: "date" } } }, { a: "x" });
  assert.match(problems.join("\n"), /"format" is not supported/);
  assert.match(validate({ additionalProperties: true }, {}).join("\n"), /only "additionalProperties": false/);
});
