// The foods as the site shows them, from _data/foods.yml as the data has
// them. A ring marked `proposed` (added by the research, not yet promoted)
// or `no_supply` (no regular UK supply) is left out, so no dial, verdict,
// calendar, feed or JSON ever sees it. The keys in DATA_ONLY stay in the
// data file and out of the site until their display is designed, and so
// does a meat food's `buy`. A food's `sources` keeps the keys its shown
// rings cite and any no ring cites. tools/bake.js writes the result to
// _data/shown.json for the templates (site.data.shown).
"use strict";

const DATA_ONLY = {
  food: ["confidence", "mcs", "mcs_note", "sustainability", "never_candidate"],
  ring: ["confidence", "research", "mcs", "buy", "no_supply", "unsold", "proposed"]
};

function isHidden(v) { return v.proposed === true || v.no_supply === true; }

function without(obj, keys) {
  const out = {};
  for (const k of Object.keys(obj)) if (keys.indexOf(k) < 0) out[k] = obj[k];
  return out;
}

function shownFood(f) {
  const rings = f.varieties.filter((v) => !isHidden(v));
  const cites = (vs) => new Set(vs.flatMap((v) => v.sources || []));
  const anyRing = cites(f.varieties), shownRing = cites(rings);
  // A shown ring with no sources of its own inherits the food's whole list.
  const inherits = rings.some((v) => !v.sources);
  const out = without(f, DATA_ONLY.food.concat(f.group === "meat" ? ["buy"] : []));
  out.sources = (f.sources || []).filter((k) => inherits || shownRing.has(k) || !anyRing.has(k));
  out.varieties = rings.map((v) => without(v, DATA_ONLY.ring));
  return out;
}

function shownFoods(foods) { return foods.map(shownFood); }

module.exports = { shownFoods, isHidden, DATA_ONLY };
