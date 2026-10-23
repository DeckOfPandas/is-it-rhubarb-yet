// The search ranking (assets/search.js), over an index built from the
// data the way home builds its own: every food and never-food by its
// name, aliases and shared words, and every named variety (not a ring)
// by its name and how it is said. The header and the not-found page
// build theirs from search.json, which carries the same strings, so
// what passes here holds for all three.
// Run: node --test tests/site/search.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const S = require("../../assets/search.js");
const V = require("../../assets/verdict.js");
const { loadYaml } = require("../../tools/yaml.js");

const DATA = path.join(__dirname, "..", "..", "_data");
const foods = loadYaml(path.join(DATA, "foods.yml"));
const never = loadYaml(path.join(DATA, "never.yml"));

// Home's index: a whole food is one item; a named variety is another,
// with its label, so "cox" can answer "Apples (Cox)".
function homeIndex() {
  const index = [];
  for (const f of foods) {
    index.push({ slug: f.slug, name: f.name, label: "", strings: S.strings([f.name].concat(f.aliases || [], f.also || [])), names: [f.name].concat(f.aliases || []) });
    for (const v of f.varieties || []) {
      if (!v.name || v.ring) continue;
      const said = V.varietySaid(f, v);
      index.push({ slug: f.slug, name: f.name, label: V.varietyLabel(v), strings: S.strings([v.name, said]), names: [v.name, said] });
    }
  }
  for (const n of never) {
    index.push({ slug: n.slug, name: n.name, label: "", never: true, strings: S.strings([n.name].concat(n.aliases || [])), names: [n.name].concat(n.aliases || []) });
  }
  return index;
}
// The header's and the not-found page's index, as search.json lays it
// out: one item per food, its varieties' said names among its terms.
function jsonIndex() {
  const index = [];
  for (const f of foods) {
    const terms = [f.name];
    for (const v of f.varieties || []) if (v.name && !v.ring) terms.push(V.varietySaid(f, v));
    index.push({ slug: f.slug, name: f.name, label: "", strings: S.strings(terms.concat(f.aliases || [], f.also || [])), names: [f.name].concat(f.aliases || []) });
  }
  for (const n of never) index.push({ slug: n.slug, name: n.name, label: "", never: true, strings: S.strings([n.name].concat(n.aliases || [])), names: [n.name].concat(n.aliases || []) });
  return index;
}
const home = homeIndex(), json = jsonIndex();
const slugs = (hits) => hits.map((h) => h.it.slug);
const shown = (hits) => hits.map((h) => h.it.name + (h.it.label ? " (" + h.it.label + ")" : ""));

test("folding: case, accents and punctuation go, & reads as and", () => {
  assert.equal(S.fold("Marjoram & Oregano"), "marjoram and oregano");
  assert.equal(S.fold("  Crème fraîche! "), "creme fraiche");
  assert.deepEqual(S.words(S.fold("runner & French beans")), ["runner", "and", "french", "beans"]);
  assert.equal(S.singular("cherries"), "cherry");
  assert.equal(S.singular("tomatoes"), "tomato");
  assert.equal(S.singular("leeks"), "leek");
  assert.equal(S.singular("cress"), "cress", "a word ending in ss is not a plural");
});

test("tiers: exact, at the start, at a later word, and never inside a word", () => {
  const c = S.strings(["crab apples"])[0];
  assert.equal(S.tierOf(c, ["crab", "apples"]), 1);
  assert.equal(S.tierOf(c, ["crab", "apple"]), 1, "singular and plural are equal");
  assert.equal(S.tierOf(c, ["crab"]), 2);
  assert.equal(S.tierOf(c, ["cra"]), 2, "the last typed word may be unfinished");
  assert.equal(S.tierOf(c, ["apple"]), 3);
  assert.equal(S.tierOf(c, ["app"]), 3);
  assert.equal(S.tierOf(c, ["rab"]), 0, "text inside a word is no match");
  assert.equal(S.tierOf(c, ["crab", "pear"]), 0);
});

test("ape and lla find nothing; strawbery is nearest to strawberries", () => {
  assert.deepEqual(S.search(home, "ape"), []);
  assert.deepEqual(S.search(home, "lla"), []);
  assert.deepEqual(S.search(home, ""), []);
  assert.deepEqual(S.search(home, "strawbery"), []);
  assert.ok(S.nearest(home, "strawbery", 5).some((it) => it.slug === "strawberries"), "did you mean strawberries");
  assert.deepEqual(S.nearest(home, "st", 5), [], "fewer than three letters offer nothing");
  assert.ok(S.nearest(home, "strawbery", 5).every((it) => !it.label), "did you mean names whole foods only");
});

test("crab: the two crabs by their alias exactly, then crab apples at its start", () => {
  const hits = S.search(home, "crab");
  assert.deepEqual(shown(hits), ["Brown crab", "Spider crab", "Crab apples"]);
  assert.deepEqual(hits.map((h) => h.tier), [1, 1, 2]);
  assert.equal(S.leadOf(hits), null, "two exact hits lead nowhere");
  assert.equal(S.leadOf(S.search(home, "crab a")).slug, "crab-apples", "one more letter and crab apples leads");
});

test("corn: sweetcorn by its alias exactly, then the Cornish by an unfinished word, never the inside of a name", () => {
  const hits = S.search(home, "corn");
  assert.deepEqual(slugs(hits), ["sweetcorn", "megrim", "tea"]);
  assert.deepEqual(hits.map((h) => h.tier), [1, 2, 2]);
  assert.equal(S.leadOf(hits).slug, "sweetcorn");
  assert.ok(!slugs(S.search(home, "orn")).includes("sweetcorn"), "orn is inside sweetcorn and corn alike");
});

test("cox gives Apples (Cox), and rhubarb is one row, not followed by its forced ring", () => {
  const cox = S.search(home, "cox");
  assert.deepEqual(shown(cox), ["Apples (Cox)"]);
  assert.equal(S.leadOf(cox).label, "Cox");
  const rhubarb = S.search(home, "rhubarb");
  assert.deepEqual(shown(rhubarb), ["Rhubarb"], "a food found as well as its variety shows as the food, once");
  assert.equal(rhubarb[0].tier, 1);
  const forced = S.search(home, "forced");
  assert.deepEqual(shown(forced), ["Rhubarb (forced)", "Sea kale (forced)"], "a food found by a variety alone shows as that variety");
});

test("john dory is found by both words, and by the first alone", () => {
  assert.deepEqual(slugs(S.search(home, "john dory")), ["john-dory"]);
  assert.equal(S.search(home, "john dory")[0].tier, 1);
  assert.deepEqual(slugs(S.search(home, "john")), ["john-dory"]);
  assert.deepEqual(slugs(S.search(home, "dory")), ["john-dory"]);
});

test("fish: every fish by its shared word, no lead, each food once", () => {
  const hits = S.search(home, "fish");
  assert.ok(hits.length > 30, hits.length + " fish");
  assert.equal(S.leadOf(hits), null, "many hits at one tier lead nowhere");
  const seen = slugs(hits);
  assert.equal(new Set(seen).size, seen.length);
  assert.ok(seen.includes("cod"));
  assert.ok(seen.includes("brown-crab"));
});

test("a never-food is found like any other, and leads", () => {
  const hits = S.search(home, "banana");
  assert.deepEqual(slugs(hits), ["bananas"]);
  assert.equal(S.leadOf(hits).never, true);
});

test("hits only ever narrow as letters are typed", () => {
  const typed = ["c", "ch", "chi", "chil", "chill", "chilli"];
  let last = null;
  for (const t of typed) {
    const now = new Set(slugs(S.search(home, t)));
    if (last) for (const s of now) assert.ok(last.has(s), `${s} appeared on typing ${t}`);
    last = now;
  }
  assert.deepEqual([...last], ["chillies"]);
});

test("home, the header and the not-found page rank the same foods the same way", () => {
  const queries = ["crab", "corn", "fish", "cox", "john dory", "rhubarb", "forced", "leek", "ape", "strawbery",
    "runner", "french beans", "marjoram", "pak choi", "tea", "mushroom", "banana", "sole", "b"];
  for (const q of queries) {
    const a = slugs(S.search(home, q)), b = slugs(S.search(json, q));
    assert.deepEqual(b, a, `"${q}" ranks differently on home and in search.json`);
    const la = S.leadOf(S.search(home, q)), lb = S.leadOf(S.search(json, q));
    assert.equal(lb && lb.slug, la && la.slug, `"${q}" leads differently`);
  }
});

test("sameWords: singular and plural, folded", () => {
  assert.ok(S.sameWords("Courgettes", "courgette"));
  assert.ok(S.sameWords("runner & French beans", "runner and french bean"));
  assert.ok(!S.sameWords("zucchini", "courgettes"));
});
