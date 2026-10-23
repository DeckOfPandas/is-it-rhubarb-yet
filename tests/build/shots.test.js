// The pages still look as they did: each shot in tools/dev/shot-hash.js's
// set, at a phone and a desktop width, hashes within THRESHOLD bits of
// the hash in shot-hashes.json. A change that is meant to move things
// rewrites the baseline with `node tools/dev/shot-hash.js --write` and
// commits it. Needs Playwright, as the charts test does; with none on
// NODE_PATH, or no baseline yet, the test is skipped.
//
// usage: node --test tests/build/shots.test.js   (after sh tools/build.sh)
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const H = require("../../tools/dev/shot-hash.js");

let chromium = null;
try { ({ chromium } = require("playwright")); } catch (e) { chromium = null; }
const baseline = H.readBaseline();

test("every page in the set hashes as its baseline does", {
  skip: !chromium ? "playwright is not on NODE_PATH" : !baseline ? "no shot-hashes.json: node tools/dev/shot-hash.js --write" : false
}, async () => {
  const hashes = await H.hashSite(chromium);
  const moved = H.compare(hashes, baseline).filter(([, d]) => d === null || d > H.THRESHOLD)
    .map(([k, d]) => k + ": " + (d === null ? "not in the baseline" : d + " bits away, over " + H.THRESHOLD));
  assert.deepEqual(moved, []);
  for (const key of Object.keys(baseline)) assert.ok(key in hashes, key + " is in the baseline but was not shot");
});
