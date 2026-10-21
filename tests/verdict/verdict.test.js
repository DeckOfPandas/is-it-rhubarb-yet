// The verdict rules, checked against the real data for the cases in the
// scope document and against made-up varieties for the edges.
// Run: node --test tests/verdict/verdict.test.js
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
function on(y, m, d) { return new Date(y, m - 1, d, 12); }
// The phrase for a one-variety food on a given day.
function say(weeks, today) {
  const v = { name: "", weeks };
  return V.phrase(V.varietyVerdict(v, V.weekOf(today)), today.getFullYear(), today);
}

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
  assert.equal(iso(V.midOfWeek({ week: 18, years: 0 }, 2026)), "2026-05-03", "week 18 starts 30 April and reads as May");
});

test("every food and every variety has a verdict and a date phrase in every week", () => {
  const OK = new Set(["YES", "JUST", "NEARLY", "NO"]);
  const missing = [];
  for (const f of foods) {
    for (let w = 1; w <= 52; w++) {
      const today = V.midOfToday(w, YEAR);
      const fv = V.foodVerdict(f, w);
      if (!OK.has(fv.verdict)) missing.push(`${f.slug} week ${w}: verdict ${fv.verdict}`);
      for (const r of fv.varieties) {
        if (!OK.has(r.verdict)) missing.push(`${f.slug}/${r.name} week ${w}: verdict ${r.verdict}`);
        if (!V.phrase(r, YEAR, today)) missing.push(`${f.slug}/${r.name} week ${w}: no phrase`);
      }
    }
  }
  assert.deepEqual(missing, []);
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

test("rhubarb is NEARLY: forced rhubarb from 29 October, eleven days off", () => {
  const fv = verdictOf("rhubarb");
  assert.equal(fv.verdict, "NEARLY");
  assert.equal(fv.variety.name, "Forced");
  assert.equal(iso(V.startDate(fv.variety.from, YEAR)), "2026-10-29");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "In a week or two.");
  assert.equal(V.varietyLine(bySlug.rhubarb, fv, YEAR, TODAY), "Forced rhubarb: nearly. Outdoor rhubarb: back in May.",
    "outdoor rhubarb's week 18 starts on 30 April, but its middle is 3 May");
});

test("celery is JUST: a hard stop after week 43, ten days off", () => {
  const fv = verdictOf("celery");
  assert.equal(fv.verdict, "JUST");
  assert.equal(fv.variety.hardStop, true);
  assert.equal(iso(V.endDate(fv.variety.until, YEAR)), "2026-10-28");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "For another week or two.");
  assert.equal(verdictOf("celery", 41).verdict, "YES", "two full weeks left is still YES");
  assert.equal(verdictOf("celery", 43).verdict, "JUST", "the last week is JUST");
});

test("potatoes are YES by maincrop until late December; new potatoes are back in May", () => {
  const fv = verdictOf("potatoes");
  assert.equal(fv.verdict, "YES");
  assert.equal(fv.variety.name, "Maincrop");
  assert.equal(iso(V.endDate(fv.variety.until, YEAR)), "2026-12-31");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "Until late December.");
  assert.equal(V.varietyLine(bySlug.potatoes, fv, YEAR, TODAY), "Maincrop potatoes: yes. New potatoes: first ones in May, properly in June.");
});

test("a variety is named as a type or a cultivar, in a list and in a sentence", () => {
  const v = (slug, name) => bySlug[slug].varieties.find((x) => x.name === name);
  assert.equal(V.varietyLabel(v("rhubarb", "Forced")), "forced");
  assert.equal(V.varietyLabel(v("cabbage", "Winter white")), "winter white");
  assert.equal(V.varietyLabel(v("venison", "Red & Fallow")), "red & fallow");
  assert.equal(V.varietyLabel(v("apples", "Cox")), "Cox");
  assert.equal(V.varietyLabel(v("apples", "Egremont Russet")), "Egremont Russet");
  assert.equal(V.varietyLabel({ name: "", weeks: [] }), "");
  assert.equal(V.varietySaid(bySlug.rhubarb, v("rhubarb", "Forced")), "Forced rhubarb");
  assert.equal(V.varietySaid(bySlug.rhubarb, v("rhubarb", "Forced"), true), "forced rhubarb");
  assert.equal(V.varietySaid(bySlug.apples, v("apples", "Cox")), "Cox apples");
  assert.equal(V.varietySaid(bySlug.apples, v("apples", "Cox"), true), "Cox apples", "a cultivar is never lower-cased");
  assert.equal(V.varietySaid(bySlug.lamb, v("lamb", "New season")), "New-season lamb", "said wins");
  assert.equal(V.varietySaid(bySlug.lamb, v("lamb", "New season"), true), "new-season lamb");
  assert.equal(V.varietySaid(bySlug.venison, v("venison", "Roe & Muntjac"), true), "roe & muntjac venison");
  ["apples", "pears"].forEach((slug) => bySlug[slug].varieties.forEach((x) => assert.equal(x.cultivar, true, slug + " " + x.name)));
});

test("a two-part arrival is grouped by when it is properly in", () => {
  const t = (slug) => V.timing(verdictOf(slug).variety, YEAR, TODAY);
  assert.deepEqual(t("jerusalem-artichokes"), { when: "In a week or two", early: "a few about now", days: 11 });
  assert.equal(t("celery").when, "For another week or two");
  assert.equal(t("celery").early, "");
  const turkey = t("turkey");
  assert.match(turkey.early, /^first ones /);
  assert.ok(!/first ones|properly/i.test(turkey.when), turkey.when);
});

test("Jerusalem artichokes are NEARLY from a just-about week", () => {
  const fv = verdictOf("jerusalem-artichokes");
  assert.equal(fv.verdict, "NEARLY");
  assert.equal(fv.variety.state, "avail");
  assert.equal(iso(V.startDate(fv.variety.from, YEAR)), "2026-10-29");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "A few about now, properly in a week or two.");
});

test("basil is JUST: a just-about tail to 28 October", () => {
  const fv = verdictOf("basil");
  assert.equal(fv.verdict, "JUST");
  assert.equal(fv.variety.tail, true);
  assert.equal(iso(V.endDate(fv.variety.until, YEAR)), "2026-10-28");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "For another week or two.");
});

test("asparagus is NO: first ones in April, properly in May", () => {
  const fv = verdictOf("asparagus");
  assert.equal(fv.verdict, "NO");
  assert.equal(iso(V.startDate(fv.variety.from, YEAR)), "2027-04-02");
  assert.equal(iso(V.startDate(fv.variety.inFrom, YEAR)), "2027-04-30");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "First ones in April, properly in May.");
});

test("celeriac is YES all year", () => {
  const fv = verdictOf("celeriac");
  assert.equal(fv.verdict, "YES");
  assert.equal(fv.variety.allYear, true);
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "All year.");
});

test("tomatoes are JUST until late November: week 48 ends on 2 December but its middle is 29 November", () => {
  const fv = verdictOf("tomatoes");
  assert.equal(fv.verdict, "JUST");
  assert.equal(iso(V.endDate(fv.variety.until, YEAR)), "2026-12-02");
  assert.equal(V.dateLine(fv.variety, YEAR, TODAY), "Until late November.");
});

test("coming in: the phrase coarsens with distance and never names a day", () => {
  const forced = [[44, 52, "in"]];
  assert.equal(say(forced, on(2026, 10, 24)), "Any day now");
  assert.equal(say(forced, on(2026, 10, 18)), "In a week or two");
  assert.equal(say(forced, on(2026, 10, 4)), "In two or three weeks");
  assert.equal(say(forced, on(2026, 9, 10)), "From early November", "mid-week is 1 November");
  assert.equal(say([[47, 52, "in"]], on(2026, 10, 1)), "From late November", "week 47 starts 19 November, its middle is the 22nd");
  assert.equal(say(forced, on(2026, 6, 1)), "Back in November");
  assert.equal(say([[40, 41, "in"]], on(2026, 10, 18)), "Back next October", "the same month next year");
  assert.equal(say([[18, 22, "avail"], [23, 39, "in"]], on(2026, 10, 18)), "First ones in May, properly in June");
  assert.equal(say([[40, 43, "avail"], [44, 52, "in"]], on(2026, 9, 29)), "First ones any day now, properly from early November");
});

test("going out: a few more days, a week or two, two or three weeks, then the month", () => {
  const toOct = [[1, 43, "in"]];
  assert.equal(say(toOct, on(2026, 10, 25)), "For a few more days");
  assert.equal(say(toOct, on(2026, 10, 18)), "For another week or two");
  assert.equal(say(toOct, on(2026, 10, 4)), "For another two or three weeks");
  assert.equal(say([[1, 48, "in"]], on(2026, 10, 18)), "Until late November");
  assert.equal(say([[1, 52, "in"]], on(2026, 10, 18)), "All year");
  assert.equal(say([[36, 52, "in"]], on(2026, 10, 18)), "Until late December", "week 52 reads from its middle, 27 December");
});

test("the wrap: forced rhubarb in week 52 is YES until April", () => {
  const fv = verdictOf("rhubarb", 52);
  assert.equal(fv.verdict, "YES");
  assert.equal(fv.variety.name, "Forced");
  assert.deepEqual(fv.variety.until, { week: 13, years: 1 });
  assert.equal(iso(V.endDate(fv.variety.until, YEAR)), "2027-04-01");
  assert.equal(V.dateLine(fv.variety, YEAR, on(2026, 12, 27)), "Until late March.");
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
  assert.equal(V.dateLine(before, 2026, V.midOfToday(8, 2026)), "In a week or two.");
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

test("calendar dates, for the as-of line and the week range only", () => {
  assert.equal(V.fmtDate(new Date(2026, 9, 29)), "29 October");
  assert.equal(V.fmtDate(new Date(2026, 3, 2)), "2 April");
  assert.equal(V.fmtDate(new Date(2026, 10, 21)), "21 November");
  assert.equal(V.fmtDateYear(TODAY), "18 October 2026");
  assert.equal(V.fmtRange(42, 2026), "15–21 October");
  assert.equal(V.fmtRange(5, 2026), "29 January – 4 February");
  assert.equal(V.fmtRange(52, 2026), "24–31 December");
  assert.equal(V.fmtRange(1, 2027), "1–7 January");
});

test("the weekly digest for week 42: four lists, by kind, by time left", () => {
  const now = V.nowLists(foods, groups, WEEK, YEAR, TODAY);
  const slugs = (list) => V.flatten(list).map((i) => i.slug);
  assert.ok(slugs(now.onway).includes("rhubarb"));
  assert.ok(slugs(now.onway).includes("jerusalem-artichokes"));
  assert.ok(slugs(now.last).includes("celery"));
  assert.ok(slugs(now.last).includes("basil"));
  assert.ok(slugs(now.last).includes("tomatoes"));
  const stillVeg = now.still.find((k) => k.kind === "veg");
  assert.ok(stillVeg.items.map((i) => i.slug).includes("celeriac"));
  assert.ok(!slugs(now.arrived).includes("celeriac"), "all-year foods never just arrived");
  V.flatten(now.arrived).forEach((i) => assert.ok(i.since < V.C.NEW_WEEKS));
  // Kinds come in the order of groups.yml, and each kind appears once.
  const order = ["veg", "fruit", "wild", "herbs", "fish", "meat"];
  ["arrived", "last", "onway", "still"].forEach((name) => {
    const kinds = now[name].map((k) => k.kind);
    assert.deepEqual(kinds, order.filter((k) => kinds.includes(k)), name + " is in kind order");
    assert.equal(new Set(kinds).size, kinds.length);
  });
  // Within a kind, last chance and on the way run soonest first; just
  // arrived and great now run A to Z by food, then variety.
  const ascending = (items) => items.every((it, i) => i === 0 || items[i - 1].days === null ||
    (it.days !== null && items[i - 1].days <= it.days) || it.days === null);
  now.last.forEach((k) => assert.ok(ascending(k.items), "last chance " + k.kind));
  now.onway.forEach((k) => assert.ok(ascending(k.items), "on the way " + k.kind));
  const keys = (items) => items.map((i) => i.name + " " + i.variety);
  now.arrived.concat(now.still).forEach((k) => assert.deepEqual(keys(k.items), keys(k.items).slice().sort(), k.kind + " is A to Z"));
  // A variety is named as a list shows it.
  assert.equal(V.flatten(now.onway).find((i) => i.slug === "rhubarb").variety, "forced");
  // Lines are the new phrasing, never a calendar date.
  V.flatten(now.last).concat(V.flatten(now.onway), V.flatten(now.still)).forEach((i) => {
    assert.ok(!/\d/.test(i.line), i.name + ": " + i.line);
  });
  assert.equal(V.flatten(now.last).find((i) => i.slug === "celery").line, "For another week or two");
  // Nothing appears twice.
  const all = slugs(now.arrived).concat(slugs(now.last), slugs(now.onway), slugs(now.still));
  assert.equal(new Set(all).size, all.length);
  // With no groups given, everything is one unnamed kind.
  const plain = V.nowLists(foods, [], WEEK, YEAR, TODAY);
  assert.equal(plain.last.length, 1);
  assert.equal(plain.last[0].kind, "");
});

test("last chance and on the way group by one timing, soonest first, A to Z within", () => {
  const now = V.nowLists(foods, groups, WEEK, YEAR, TODAY);
  ["last", "onway"].forEach((name) => {
    const grouped = V.byPhrase(now[name]);
    const phrases = grouped.map((g) => g.phrase);
    assert.equal(new Set(phrases).size, phrases.length, name + ": each timing once");
    assert.equal(grouped.reduce((n, g) => n + g.items.length, 0), V.flatten(now[name]).length, name + ": every food once");
    grouped.forEach((g) => {
      g.items.forEach((i) => assert.equal(i.when, g.phrase));
      assert.ok(!/first ones|properly|about now/i.test(g.phrase), name + ": " + g.phrase + " is one timing");
      const names = g.items.map((i) => i.name + " " + i.variety);
      assert.deepEqual(names, names.slice().sort(), name + " " + g.phrase + " is A to Z");
    });
    const soonest = grouped.map((g) => Math.min(...g.items.map((i) => (i.whenDays === null ? Infinity : i.whenDays))));
    soonest.forEach((d, i) => assert.ok(i === 0 || soonest[i - 1] <= d, name + " groups run soonest first"));
  });
  const last = V.byPhrase(now.last);
  assert.ok(last.find((g) => g.phrase === "For another week or two").items.some((i) => i.slug === "celery"));
  const onway = V.byPhrase(now.onway);
  assert.ok(onway.find((g) => g.phrase === "In a week or two").items.some((i) => i.slug === "jerusalem-artichokes"));
  assert.deepEqual(V.byPhrase([]), []);
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
