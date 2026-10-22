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
  const OK = new Set(["YES", "JUST", "YES-ISH", "NEARLY", "NO"]);
  const missing = [];
  for (const f of foods) {
    for (let w = 1; w <= 52; w++) {
      const today = V.midOfToday(w, YEAR);
      const fv = V.foodVerdict(f, w);
      if (!OK.has(fv.verdict)) missing.push(`${f.slug} week ${w}: verdict ${fv.verdict}`);
      if (!V.phrase(fv.whole, YEAR, today)) missing.push(`${f.slug} week ${w}: no phrase for the whole food`);
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

// Each ring's own phrase, by name, in the ring list's order.
function ringLines(slug, week = WEEK, today = TODAY) {
  const fv = verdictOf(slug, week);
  return V.ringOrder(bySlug[slug]).map((i) => [fv.varieties[i].name, V.phrase(fv.varieties[i], YEAR, today)]);
}

test("rhubarb is NEARLY: forced rhubarb from 29 October, eleven days off", () => {
  const fv = verdictOf("rhubarb");
  assert.equal(fv.verdict, "NEARLY");
  assert.equal(iso(V.startDate(fv.whole.from, YEAR)), "2026-10-29");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "In a week or two.");
  assert.deepEqual(ringLines("rhubarb"), [["Forced", "In a week or two"], ["Outdoor", "First ones in April, properly in May"]],
    "outdoor rhubarb is about from week 14 and in from week 18, which starts on 30 April but whose middle is 3 May");
});

test("celery is JUST: a hard stop after week 43, ten days off", () => {
  const fv = verdictOf("celery");
  assert.equal(fv.verdict, "JUST");
  assert.equal(fv.whole.hardStop, true);
  assert.equal(iso(V.endDate(fv.whole.until, YEAR)), "2026-10-28");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "For another week or two.");
  assert.equal(verdictOf("celery", 41).verdict, "YES", "two full weeks left is still YES");
  assert.equal(verdictOf("celery", 43).verdict, "JUST", "the last week is JUST");
});

test("potatoes are YES until late December, then from storage; new potatoes are back in May", () => {
  const fv = verdictOf("potatoes");
  assert.equal(fv.verdict, "YES");
  assert.equal(iso(V.endDate(fv.whole.until, YEAR)), "2026-12-31");
  assert.match(V.dateLine(fv.whole, YEAR, TODAY), /^Until late December, then available from storage until /);
  assert.deepEqual(ringLines("potatoes"), [["Maincrop", "Until late December"], ["New", "First ones in May, properly in June"]]);
});

test("a variety is named as a type or a cultivar, in a list and in a sentence", () => {
  const v = (slug, name) => bySlug[slug].varieties.find((x) => x.name === name);
  assert.equal(V.varietyLabel(v("rhubarb", "Forced")), "forced");
  assert.equal(V.varietyLabel(v("cabbage", "Winter white")), "winter white");
  assert.equal(V.varietyLabel(v("venison", "Red & fallow")), "red & fallow");
  assert.equal(V.varietyLabel(v("cod", "South West")), "South West", "a coast keeps its capitals");
  assert.equal(V.varietyLabel(v("apples", "Cox")), "Cox");
  assert.equal(V.varietyLabel(v("apples", "Golden Delicious")), "Golden Delicious");
  assert.equal(V.varietyLabel({ name: "", weeks: [] }), "");
  assert.equal(V.varietySaid(bySlug.rhubarb, v("rhubarb", "Forced")), "Forced rhubarb");
  assert.equal(V.varietySaid(bySlug.rhubarb, v("rhubarb", "Forced"), true), "forced rhubarb");
  assert.equal(V.varietySaid(bySlug.apples, v("apples", "Cox")), "Cox apples");
  assert.equal(V.varietySaid(bySlug.apples, v("apples", "Cox"), true), "Cox apples", "a cultivar is never lower-cased");
  assert.equal(V.foodSaid(bySlug.apples), "apples");
  assert.equal(V.foodSaid(bySlug["john-dory"]), "John Dory", "a proper noun keeps its capitals mid-sentence");
  assert.equal(V.varietySaid(bySlug["john-dory"], v("john-dory", "South West"), true), "John Dory (South West)");
  assert.equal(V.foodSaid(bySlug["dover-sole"]), "Dover sole");
  assert.equal(V.foodSaid(bySlug["runner-french-beans"]), "runner & French beans");
  assert.equal(V.varietySaid(bySlug.lamb, v("lamb", "New-season")), "New-season lamb", "said wins");
  assert.equal(V.varietySaid(bySlug.lamb, v("lamb", "New-season"), true), "new-season lamb");
  assert.equal(V.varietySaid(bySlug.venison, v("venison", "Roe"), true), "roe deer");
  assert.equal(V.varietySaid(bySlug.cabbage, v("cabbage", "Savoy"), true), "savoy cabbage");
  ["apples", "pears"].forEach((slug) => bySlug[slug].varieties.forEach((x) => assert.equal(x.cultivar, true, slug + " " + x.name)));
});

test("a season in months: each fresh run by the months its weeks are mostly in", () => {
  assert.equal(V.seasonWords(bySlug.raspberries.varieties, YEAR), "May to October");
  assert.equal(V.seasonWords(bySlug.cod.varieties, YEAR), "all year");
  assert.equal(V.seasonWords(bySlug.rhubarb.varieties, YEAR), "May to July and November to March", "the wrap is one run, listed after the first gap");
  assert.equal(V.seasonWords(bySlug.cucumber.varieties, YEAR), "April to September", "a glasshouse ring is held, not fresh, so it is left out");
  assert.equal(V.seasonWords([{ name: "", weeks: [[1, 13, "in"]] }], YEAR), "January to March", "week 13 ends on 1 April but is mostly March");
  assert.equal(V.seasonWords([{ name: "", weeks: [[10, 20, "avail"]] }], YEAR), "", "nothing ever in");
});

test("a glasshouse ring's just-about tail does not carry the whole food", () => {
  // Cucumber: outdoor just about to week 43, glasshouse in to 43 and
  // just about to 48. The whole food ends with the fresh food, and
  // never says "then glasshouse-grown" past where the glasshouse row's
  // own line ends.
  const fv = verdictOf("cucumber", 43);
  const line = V.dateLine(fv.whole, YEAR, new Date(2026, 9, 22, 12));
  assert.equal(line, "Just about, for a few more days.");
  const glass = fv.varieties.find((r) => r.name === "Glasshouse");
  assert.equal(V.phrase(glass, YEAR, new Date(2026, 9, 22, 12)), "At its best for a few more days, then just about until late November");
});

test("a two-part arrival is grouped by when it is properly in", () => {
  const t = (slug) => V.timing(verdictOf(slug).whole, YEAR, TODAY);
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
  assert.equal(fv.whole.state, "avail");
  assert.equal(iso(V.startDate(fv.whole.from, YEAR)), "2026-10-29");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "A few about now, properly in a week or two.");
});

test("basil is JUST: a just-about tail to 28 October", () => {
  const fv = verdictOf("basil");
  assert.equal(fv.verdict, "JUST");
  assert.equal(fv.whole.tail, true);
  assert.equal(iso(V.endDate(fv.whole.until, YEAR)), "2026-10-28");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "Just about, for another week or two.");
});

test("asparagus is NO: first ones in April, properly in May", () => {
  const fv = verdictOf("asparagus");
  assert.equal(fv.verdict, "NO");
  assert.equal(iso(V.startDate(fv.whole.from, YEAR)), "2027-04-02");
  assert.equal(iso(V.startDate(fv.whole.inFrom, YEAR)), "2027-04-30");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "First ones in April, properly in May.");
});

test("cultivated mushrooms are YES all year", () => {
  const fv = verdictOf("mushrooms-cultivated");
  assert.equal(fv.verdict, "YES");
  assert.equal(fv.whole.allYear, true);
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "All year.");
});

test("celeriac: in season until late January, then from storage; YES-ISH in May", () => {
  const fv = verdictOf("celeriac");
  assert.equal(fv.verdict, "YES");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "Until late January, then available from storage until late August.");
  const may = verdictOf("celeriac", 20);
  assert.equal(may.verdict, "YES-ISH", "storage alone is YES-ISH");
  assert.equal(may.whole.store, true);
  assert.equal(V.dateLine(may.whole, YEAR, V.midOfToday(20, YEAR)), "Available from storage until late August.");
  assert.equal(may.whole.since, 52, "never just arrived from storage");
});

test("apples answer for the whole food: fresh until late November, then storage", () => {
  const fv = verdictOf("apples");
  assert.equal(fv.verdict, "YES");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "Until late November, then available from storage until late July.");
  assert.equal(verdictOf("apples", 20).verdict, "YES-ISH");
  const july = V.midOfToday(30, YEAR);
  assert.equal(V.dateLine(verdictOf("apples", 30).whole, YEAR, july),
    "Available from storage for a few more days. Fresh any day now.", "fresh within NEARLY's threshold is named");
});

test("the combined timeline takes each week's best state across the rings", () => {
  const food = {
    name: "T", slug: "t", colour: "#000000",
    varieties: [
      { name: "A", weeks: [[10, 20, "in"], [21, 30, "store"]] },
      { name: "B", weeks: [[15, 25, "avail"], [40, 45, "in"]] },
      { name: "Glasshouse", ring: "method", method: "glasshouse", weeks: [[1, 52, "in"]] }
    ]
  };
  const t = V.timelineOf(food).timeline;
  assert.equal(t[12], "in", "in beats glass");
  assert.equal(t[22], "avail", "avail beats store");
  assert.equal(t[27], "glass", "a glasshouse ring counts as glass, not in, and glass beats store");
  assert.equal(t[42], "in");
  assert.equal(t[50], "glass");
  assert.equal(V.timelineOf({ name: "U", varieties: [{ name: "", weeks: [[5, 8, "store"]] }] }).timeline[6], "store");
});

test("verdict order: YES > JUST > YES-ISH > NEARLY > NO", () => {
  assert.ok(V.RANK.YES > V.RANK.JUST);
  assert.ok(V.RANK.JUST > V.RANK["YES-ISH"]);
  assert.ok(V.RANK["YES-ISH"] > V.RANK.NEARLY);
  assert.ok(V.RANK.NEARLY > V.RANK.NO);
  // Fresh beats storage: a fresh week over storage is never YES-ISH.
  const both = { name: "T", slug: "t", colour: "#000000", varieties: [
    { name: "A", weeks: [[10, 20, "store"]] }, { name: "B", weeks: [[12, 14, "in"]] }] };
  assert.equal(V.foodVerdict(both, 12).verdict, "YES");
  // YES-ISH beats NEARLY: storage while fresh food is coming in.
  const coming = { name: "T", slug: "t", colour: "#000000", varieties: [
    { name: "A", weeks: [[10, 20, "store"]] }, { name: "B", weeks: [[12, 13, "avail"], [14, 30, "in"]] }] };
  assert.equal(V.foodVerdict(coming, 12).verdict, "YES-ISH");
  assert.equal(V.foodVerdict(coming, 11).verdict, "YES-ISH");
});

test("every food, every week: the order holds and the storage words are right", () => {
  const wrong = [];
  for (const f of foods) {
    if (f.unsold) continue;
    const t = V.timelineOf(f);
    for (let w = 1; w <= 52; w++) {
      const today = V.midOfToday(w, YEAR);
      const fv = V.foodVerdict(f, w), line = V.dateLine(fv.whole, YEAR, today);
      const s = t.timeline[w], at = `${f.slug} week ${w}`;
      if (s === "in" && !["YES", "JUST"].includes(fv.verdict)) wrong.push(`${at}: in season but ${fv.verdict}`);
      if ((s === "store" || s === "glass") && fv.verdict !== "YES-ISH") wrong.push(`${at}: held alone but ${fv.verdict}`);
      if (s === "" && !["NEARLY", "NO"].includes(fv.verdict)) wrong.push(`${at}: nothing but ${fv.verdict}`);
      if (fv.verdict === "YES-ISH" && !/^(Available from storage|Glasshouse-grown)/.test(line)) wrong.push(`${at}: ${line}`);
      if (/from store\b/.test(line)) wrong.push(`${at}: says "from store": ${line}`);
      if (/, then /.test(line) && !/, then (available from storage|glasshouse-grown|just about)/.test(line)) wrong.push(`${at}: ${line}`);
      if (/\d/.test(line)) wrong.push(`${at}: a number in ${line}`);
    }
  }
  assert.deepEqual(wrong, []);
});

test("JUST runs across overlapping rings: one ring ending is not the food ending", () => {
  const food = { name: "T", slug: "t", colour: "#000000", varieties: [
    { name: "A", weeks: [[10, 20, "in"]] }, { name: "B", weeks: [[15, 30, "in"]] }] };
  assert.equal(V.varietyVerdict(food.varieties[0], 20).verdict, "JUST", "ring A on its own ends");
  assert.equal(V.foodVerdict(food, 20).verdict, "YES", "B carries the food on");
  assert.equal(V.foodVerdict(food, 30).verdict, "JUST");
  const stored = { name: "T", slug: "t", colour: "#000000", varieties: [{ name: "", weeks: [[10, 20, "in"], [21, 40, "store"]] }] };
  const r = V.foodVerdict(stored, 20).whole;
  assert.equal(r.verdict, "JUST", "storage to follow does not stop a hard stop");
  assert.equal(V.dateLine(r, YEAR, V.midOfToday(20, YEAR)), "For a few more days, then available from storage until early October.");
});

test("glasshouse: YES-ISH alone, for now when outdoor follows", () => {
  const fv = verdictOf("pak-choi");
  assert.equal(fv.verdict, "YES-ISH");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "Glasshouse-grown for now; outdoor from early July.");
  const food = { name: "T", slug: "t", colour: "#000000", varieties: [
    { name: "Glasshouse", ring: "method", method: "glasshouse", weeks: [[1, 47, "in"]] }, { name: "Outdoor", weeks: [[20, 40, "in"]] }] };
  assert.equal(V.dateLine(V.foodVerdict(food, WEEK).whole, YEAR, TODAY), "Glasshouse-grown until late November.");
});

test("a fish answers for all its coasts together", () => {
  const fv = verdictOf("cod");
  assert.equal(fv.verdict, "YES");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "All year.", "cod is landed somewhere all year");
  assert.equal(verdictOf("haddock").whole.allYear, true, "an all-year coast makes the fish all year");
  const sw = fv.varieties.find((r) => r.name === "South West");
  assert.equal(V.phrase(sw, YEAR, TODAY), "For another week or two", "its Cornish ring still has its own season, to week 43");
});

test("rings run from the longest season to the shortest, ties in data order", () => {
  const food = { name: "T", varieties: [
    { name: "A", weeks: [[1, 10, "in"]] }, { name: "B", weeks: [[1, 20, "in"], [21, 30, "store"]] },
    { name: "C", weeks: [[5, 14, "avail"]] }, { name: "D", weeks: [[1, 52, "in"]] }] };
  assert.deepEqual(V.ringOrder(food), [3, 1, 0, 2]);
  assert.deepEqual(ringLines("lettuce").slice(0, 2).map((l) => l[0]), ["Iceberg", "Glasshouse"]);
  for (const f of foods) {
    const order = V.ringOrder(f);
    assert.deepEqual(order.slice().sort((a, b) => a - b), f.varieties.map((_, i) => i), f.slug + ": every ring once");
  }
});

test("wild salmon cannot be sold: always NO, its line says why", () => {
  for (const w of [1, 26, 42]) {
    const fv = verdictOf("wild-salmon", w);
    assert.equal(fv.verdict, "NO");
    assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "It cannot be sold in England, Wales or Scotland.");
  }
});

test("tomatoes are JUST until late November: week 48 ends on 2 December but its middle is 29 November", () => {
  const fv = verdictOf("tomatoes");
  assert.equal(fv.verdict, "JUST");
  assert.equal(iso(V.endDate(fv.whole.until, YEAR)), "2026-12-02");
  assert.equal(V.dateLine(fv.whole, YEAR, TODAY), "Just about, until late November.", "a tail is just about, not a last fortnight");
});

test("a soft end says so once it is near: at its best, then just about", () => {
  // In season to week 43, just about to week 48: a YES that becomes a
  // tail JUST, which the sentence admits in its last weeks only.
  const soft = [[23, 43, "in"], [44, 48, "avail"]];
  assert.equal(say(soft, on(2026, 9, 10)), "Until late October", "far off, as before");
  assert.equal(say(soft, on(2026, 10, 18)), "At its best for another week or two, then just about until late November");
  assert.equal(say(soft, on(2026, 10, 25)), "At its best for a few more days, then just about until late November");
  assert.equal(say(soft, on(2026, 11, 5)), "Just about, for another two or three weeks", "the tail itself");
  assert.equal(say(soft, on(2026, 11, 28)), "Just about, for a few more days");
  assert.equal(say([[23, 43, "in"]], on(2026, 10, 25)), "For a few more days", "a hard stop is the JUST line");
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
  assert.deepEqual(fv.whole.until, { week: 13, years: 1 });
  assert.equal(iso(V.endDate(fv.whole.until, YEAR)), "2027-04-01");
  assert.equal(V.dateLine(fv.whole, YEAR, on(2026, 12, 27)), "Until late March.");
  assert.equal(V.foodVerdict(bySlug.rhubarb, 2).whole.since, 10, "weeks since the run began count back over the year end");
});

test("thresholds: NEARLY within three weeks, NO before that", () => {
  assert.equal(verdictOf("rhubarb", 41).verdict, "NEARLY");
  assert.equal(verdictOf("rhubarb", 40).verdict, "NO");
  assert.equal(V.C.NEARLY_WEEKS, 3);
  assert.equal(V.C.JUST_WEEKS, 2);
});

test("isolated just-about weeks take the configured verdict (Cornish scallops as they were)", () => {
  const v = { name: "", weeks: [[14, 22, "avail"], [27, 35, "avail"], [36, 43, "in"], [44, 48, "avail"]] };
  assert.equal(V.varietyVerdict(v, 18).verdict, V.C.ISOLATED_AVAIL);
  assert.equal(V.varietyVerdict(v, 18).isolated, true);
  assert.equal(V.varietyVerdict(v, 30).verdict, "NEARLY");
  assert.equal(V.varietyVerdict(v, 45).verdict, "JUST");
  assert.equal(V.varietyVerdict(v, 45).tail, true);
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

test("the whole food is NEARLY when its soonest ring is", () => {
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
  assert.deepEqual(fv.whole.from, { week: 44, years: 0 });
});

test("calendar dates, for the as-of line and the week range only", () => {
  assert.equal(V.fmtDate(new Date(2026, 9, 29)), "29th October");
  assert.equal(V.fmtDate(new Date(2026, 3, 2)), "2nd April");
  assert.equal(V.fmtDate(new Date(2026, 10, 21)), "21st November");
  assert.equal(V.fmtDateYear(TODAY), "18th October 2026");
  assert.equal(V.fmtRange(42, 2026), "15th–21st October");
  assert.equal(V.fmtRange(5, 2026), "29th January – 4th February");
  assert.equal(V.fmtRange(52, 2026), "24th–31st December");
  assert.equal(V.fmtRange(1, 2027), "1st–7th January");
  assert.equal(V.dateHtml("15th–21st October"), "15<sup>th</sup>–21<sup>st</sup> October");
  assert.equal(V.dateHtml("22nd October 2026"), "22<sup>nd</sup> October 2026");
  assert.deepEqual(V.datePieces("3rd May"), [["3", false], ["rd", true], [" May", false]]);
  assert.equal(V.dateHtml("Late October"), "Late October", "no number, nothing raised");
  const ords = [1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map((n) => n + V.ordinal(n));
  assert.deepEqual(ords, ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "31st"]);
});

test("the weekly digest for week 42: its lists, by kind, by time left", () => {
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
  ["arrived", "last", "onway", "still", "store", "glass"].forEach((name) => {
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
  // Each item is the whole food, unnamed by variety.
  assert.equal(V.flatten(now.onway).find((i) => i.slug === "rhubarb").variety, "");
  // YES-ISH foods are in the storage and glasshouse lists alone.
  V.flatten(now.store).concat(V.flatten(now.glass)).forEach((i) => assert.equal(i.verdict, "YES-ISH", i.slug));
  assert.ok(slugs(now.glass).includes("pak-choi"));
  // Lines are the new phrasing, never a calendar date.
  V.flatten(now.last).concat(V.flatten(now.onway), V.flatten(now.still)).forEach((i) => {
    assert.ok(!/\d/.test(i.line), i.name + ": " + i.line);
  });
  assert.equal(V.flatten(now.last).find((i) => i.slug === "celery").line, "For another week or two");
  // Nothing appears twice.
  const all = slugs(now.arrived).concat(slugs(now.last), slugs(now.onway), slugs(now.still), slugs(now.store), slugs(now.glass));
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
    yesish: [{ text: "s", by: "x" }],
    no: [{ text: "c", by: "x" }]
  };
  assert.equal(V.pickQuote(quotes, "YES", "rhubarb", 42).text, "p");
  assert.equal(V.pickQuote(quotes, "YES-ISH", "apples", 20).text, "s", "YES-ISH draws from yesish");
  const q1 = V.pickQuote(quotes, "YES", "kale", 42), q2 = V.pickQuote(quotes, "YES", "kale", 42);
  assert.equal(q1, q2);
  assert.equal(V.pickQuote(quotes, "NEVER", "bananas", 42), null);
});
