// The verdict rules, checked against the real data for the cases in the
// scope document and against made-up varieties for the edges.
// Run: node --test tests/verdict/
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const V = require("../../assets/verdict.js");
const { loadYaml } = require("../../tools/yaml.js");

const DATA = path.join(__dirname, "..", "..", "_data");
const foods = loadYaml(path.join(DATA, "foods.yml"));
const groups = loadYaml(path.join(DATA, "groups.yml"));
const bySlug = Object.fromEntries(foods.map((f) => [f.slug, f]));

// Sunday 18 October 2026 is in week 42.
const TODAY = new Date(2026, 9, 18, 12);
const WEEK = 42;
const YEAR = 2026;

function iso(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function verdictOf(slug, week = WEEK) { return V.foodVerdict(bySlug[slug], week); }

test("the week grid", () => {
  assert.equal(V.weekOf(new Date(2026, 0, 1)), 1);
  assert.equal(V.weekOf(new Date(2026, 0, 7)), 1);
  assert.equal(V.weekOf(new Date(2026, 0, 8)), 2);
  assert.equal(V.weekOf(TODAY), 42);
  assert.equal(V.weekOf(new Date(2026, 11, 31)), 52);
  assert.equal(V.weekOf(new Date(2026, 11, 24)), 52);
  assert.equal(V.weekOf(new Date(2026, 11, 23)), 51);
  assert.equal(iso(V.startOfWeek(44, 2026)), "2026-10-29");
  assert.equal(iso(V.endOfWeek(43, 2026)), "2026-10-28");
  assert.equal(iso(V.endOfWeek(52, 2026)), "2026-12-31");
});

test("leap years: the grid is by day of year, week 52 takes nine days", () => {
  assert.equal(V.weekOf(new Date(2028, 11, 31)), 52);
  assert.equal(V.weekOf(new Date(2028, 11, 23)), 52);
  assert.equal(V.weekOf(new Date(2028, 11, 22)), 51);
  assert.equal(iso(V.startOfWeek(14, 2028)), "2028-04-01");
  assert.equal(iso(V.startOfWeek(14, 2027)), "2027-04-02");
  assert.equal(iso(V.endOfWeek(52, 2028)), "2028-12-31");
});

test("a clock change does not move the week", () => {
  // British Summer Time ends on 25 October 2026; local midnight after it is
  // an hour "short" of a whole number of days since 1 January.
  assert.equal(V.dayOfYear(new Date(2026, 9, 26)), 299);
  assert.equal(V.weekOf(new Date(2026, 9, 26, 0, 0, 0)), 43);
});

test("rhubarb is NEARLY: forced rhubarb from 29 October", () => {
  const fv = verdictOf("rhubarb");
  assert.equal(fv.verdict, "NEARLY");
  assert.equal(fv.variety.name, "Forced");
  assert.equal(iso(V.startDate(fv.variety.from, YEAR)), "2026-10-29");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "From about 29th October, in about two weeks.");
  assert.equal(V.varietyLine(bySlug.rhubarb, fv, YEAR), "Forced, nearly. Outdoor: back about 30th April.");
});

test("celery is JUST: a hard stop after week 43", () => {
  const fv = verdictOf("celery");
  assert.equal(fv.verdict, "JUST");
  assert.equal(fv.variety.hardStop, true);
  assert.equal(iso(V.endDate(fv.variety.until, YEAR)), "2026-10-28");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "Until about 28th October, about a week left.");
  assert.equal(verdictOf("celery", 41).verdict, "YES", "two full weeks left is still YES");
  assert.equal(verdictOf("celery", 43).verdict, "JUST", "the last week is JUST");
});

test("potatoes are YES by maincrop; new potatoes are back in April", () => {
  const fv = verdictOf("potatoes");
  assert.equal(fv.verdict, "YES");
  assert.equal(fv.variety.name, "Maincrop");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "Until about 31st December.");
  assert.equal(V.varietyLine(bySlug.potatoes, fv, YEAR), "Maincrop, yes. New: back about 30th April.");
});

test("Jerusalem artichokes are NEARLY from a just-about week", () => {
  const fv = verdictOf("jerusalem-artichokes");
  assert.equal(fv.verdict, "NEARLY");
  assert.equal(fv.variety.state, "avail");
  assert.equal(iso(V.startDate(fv.variety.from, YEAR)), "2026-10-29");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY),
    "Around already. Properly in from about 29th October, in about two weeks.");
});

test("basil is JUST: a just-about tail", () => {
  const fv = verdictOf("basil");
  assert.equal(fv.verdict, "JUST");
  assert.equal(fv.variety.tail, true);
  assert.equal(iso(V.endDate(fv.variety.until, YEAR)), "2026-10-28");
});

test("asparagus is NO: back 2 April, properly from 30 April", () => {
  const fv = verdictOf("asparagus");
  assert.equal(fv.verdict, "NO");
  assert.equal(iso(V.startDate(fv.variety.from, YEAR)), "2027-04-02");
  assert.equal(iso(V.startDate(fv.variety.inFrom, YEAR)), "2027-04-30");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "Back about 2nd April, properly in from about 30th April.");
});

test("celeriac is YES all year", () => {
  const fv = verdictOf("celeriac");
  assert.equal(fv.verdict, "YES");
  assert.equal(fv.variety.allYear, true);
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "All year.");
});

test("tomatoes are JUST until early December, with no relative form that far out", () => {
  const fv = verdictOf("tomatoes");
  assert.equal(fv.verdict, "JUST");
  assert.equal(iso(V.endDate(fv.variety.until, YEAR)), "2026-12-02");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "Until about 2nd December.");
});

test("the wrap: forced rhubarb in week 52 is YES until April", () => {
  const fv = verdictOf("rhubarb", 52);
  assert.equal(fv.verdict, "YES");
  assert.equal(fv.variety.name, "Forced");
  assert.deepEqual(fv.variety.until, { week: 13, years: 1 });
  assert.equal(iso(V.endDate(fv.variety.until, YEAR)), "2027-04-01");
  assert.equal(V.foodVerdict(bySlug.rhubarb, 2).variety.since, 10, "weeks since the run began count back over the year end");
});

test("thresholds: NEARLY within three weeks, NO before that", () => {
  assert.equal(verdictOf("rhubarb", 41).verdict, "NEARLY");
  assert.equal(verdictOf("rhubarb", 40).verdict, "NO");
  assert.equal(V.C.NEARLY_WEEKS, 3);
  assert.equal(V.C.JUST_WEEKS, 2);
});

test("scallops: isolated just-about weeks take the configured verdict", () => {
  assert.equal(verdictOf("scallops", 18).verdict, V.C.ISOLATED_AVAIL);
  assert.equal(verdictOf("scallops", 18).variety.isolated, true);
  assert.equal(verdictOf("scallops", 30).verdict, "NEARLY");
  assert.equal(verdictOf("scallops", 45).verdict, "JUST");
  assert.equal(verdictOf("scallops", 45).variety.tail, true);
});

test("a variety that is only ever just about", () => {
  const v = { name: "", weeks: [[10, 14, "avail"]] };
  assert.equal(V.varietyVerdict(v, 12).verdict, V.C.ISOLATED_AVAIL);
  const before = V.varietyVerdict(v, 8);
  assert.equal(before.verdict, "NEARLY");
  assert.deepEqual(before.from, { week: 10, years: 0 });
  assert.equal(before.inFrom, null);
  assert.equal(V.dateLine(before, 2026, null), "From about 5th March.");
  const after = V.varietyVerdict(v, 20);
  assert.equal(after.verdict, "NO");
  assert.deepEqual(after.from, { week: 10, years: 1 });
});

test("ranking across varieties: YES beats JUST beats NEARLY beats NO; sooner wins a tie", () => {
  const food = {
    name: "T", slug: "t", colour: "#000000",
    varieties: [
      { name: "A", weeks: [[20, 25, "in"]] },
      { name: "B", weeks: [[44, 48, "in"]] },
      { name: "C", weeks: [[46, 50, "in"]] }
    ]
  };
  const fv = V.foodVerdict(food, 42);
  assert.equal(fv.verdict, "NEARLY");
  assert.equal(fv.variety.name, "B");
});

test("dates in words", () => {
  assert.equal(V.fmtDate(new Date(2026, 9, 29)), "29th October");
  assert.equal(V.fmtDate(new Date(2026, 3, 2)), "2nd April");
  assert.equal(V.fmtDate(new Date(2026, 2, 3)), "3rd March");
  assert.equal(V.fmtDate(new Date(2026, 10, 11)), "11th November");
  assert.equal(V.fmtDate(new Date(2026, 10, 21)), "21st November");
  assert.equal(V.fmtRange(42, 2026), "15th to 21st October");
  assert.equal(V.fmtRange(5, 2026), "29th January to 4th February");
  assert.equal(V.fmtRange(52, 2026), "24th to 31st December");
});

test("the weekly digest for week 42", () => {
  const now = V.nowLists(foods, groups, WEEK, YEAR);
  const names = (list) => list.map((i) => i.slug);
  assert.ok(names(now.onway).includes("rhubarb"));
  assert.ok(names(now.onway).includes("jerusalem-artichokes"));
  assert.ok(names(now.last).includes("celery"));
  assert.ok(names(now.last).includes("basil"));
  assert.ok(names(now.last).includes("tomatoes"));
  const stillVeg = now.still.find((k) => k.kind === "veg");
  assert.ok(names(stillVeg.items).includes("celeriac"));
  assert.ok(!names(now.arrived).includes("celeriac"), "all-year foods never just arrived");
  now.arrived.forEach((i) => assert.ok(i.since < V.C.NEW_WEEKS));
  // Nothing appears twice.
  const all = names(now.arrived).concat(names(now.last), names(now.onway), ...now.still.map((k) => names(k.items)));
  assert.equal(new Set(all).size, all.length);
});

test("quotations are stable for a food for a week and prefer pinned lines", () => {
  const quotes = {
    yes: [{ text: "a", by: "x" }, { text: "b", by: "y" }, { text: "p", by: "z", foods: ["rhubarb"] }],
    no: [{ text: "c", by: "x" }]
  };
  assert.equal(V.pickQuote(quotes, "YES", "rhubarb", 42).text, "p");
  const q1 = V.pickQuote(quotes, "YES", "kale", 42), q2 = V.pickQuote(quotes, "YES", "kale", 42);
  assert.equal(q1, q2);
  assert.equal(V.pickQuote(quotes, "NEVER", "bananas", 42), null);
});
