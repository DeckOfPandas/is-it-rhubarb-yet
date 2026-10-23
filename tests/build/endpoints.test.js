// The built endpoints: search.json and foods.json parse and carry what
// the scripts read; the calendar feeds are well formed as RFC 5545 asks,
// every line CRLF-ended and at most 75 octets, every event complete and
// its UID unique. Run after a build (tools/build.sh folds the feeds).
//
// usage: node --test tests/build/endpoints.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { LIMIT } = require("../../tools/fold-ics.js");
const { loadYaml } = require("../../tools/yaml.js");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = path.join(ROOT, "_site");
const foods = loadYaml(path.join(ROOT, "_data", "foods.yml"));
const never = loadYaml(path.join(ROOT, "_data", "never.yml"));

function read(rel) {
  const file = path.join(SITE, rel);
  assert.ok(fs.existsSync(file), `${rel} is not in _site: run sh tools/build.sh first`);
  return fs.readFileSync(file, "utf8");
}

test("search.json parses, one entry per food and never-food, with what the scripts read", () => {
  const items = JSON.parse(read("search.json"));
  assert.equal(items.length, foods.length + never.length);
  for (const it of items) {
    for (const key of ["slug", "name", "verdict", "terms", "names"]) assert.ok(key in it, `${it.slug}: no ${key}`);
    assert.ok(Array.isArray(it.terms) && it.terms.length > 0, `${it.slug}: no terms`);
    assert.equal(it.terms[0], it.name, `${it.slug}: the first term is its name`);
    assert.ok(Array.isArray(it.names), `${it.slug}: names is a list`);
    if (it.never) assert.equal(it.verdict, "NEVER");
    else assert.ok(typeof it.colour === "string" && /^#[0-9a-f]{6}$/i.test(it.colour), `${it.slug}: colour ${it.colour}`);
  }
  const slugs = items.map((it) => it.slug);
  assert.equal(new Set(slugs).size, slugs.length, "every slug once");
});

test("foods.json parses and is the data file, one entry per food", () => {
  const items = JSON.parse(read("foods.json"));
  assert.equal(items.length, foods.length);
  for (const f of items) {
    for (const key of ["slug", "name", "group", "colour", "varieties"]) assert.ok(key in f, `${f.slug}: no ${key}`);
    assert.ok(f.varieties.length > 0, `${f.slug}: no rings`);
    for (const v of f.varieties) assert.ok(Array.isArray(v.weeks), `${f.slug}/${v.name}: no weeks`);
  }
});

// Unfold a feed's lines: a line starting with a space continues the one
// before.
function unfold(text) {
  const out = [];
  for (const line of text.split("\r\n")) {
    if (line === "") continue;
    if (line[0] === " " && out.length) out[out.length - 1] += line.slice(1);
    else out.push(line);
  }
  return out;
}

function checkFeed(rel, expectEvents) {
  const text = read(rel);
  assert.ok(!/[^\r]\n/.test(text) && !/^\n/.test(text), `${rel}: a line ends in LF alone`);
  assert.ok(text.endsWith("\r\n"), `${rel}: the last line is unterminated`);
  for (const line of text.split("\r\n")) {
    assert.ok(Buffer.byteLength(line) <= LIMIT, `${rel}: a line of ${Buffer.byteLength(line)} octets: ${line.slice(0, 40)}`);
  }
  const lines = unfold(text);
  assert.equal(lines[0], "BEGIN:VCALENDAR", rel);
  assert.equal(lines[lines.length - 1], "END:VCALENDAR", rel);
  assert.ok(lines.includes("VERSION:2.0"), `${rel}: no VERSION`);
  assert.ok(lines.some((l) => l.startsWith("PRODID:")), `${rel}: no PRODID`);
  const events = [];
  let open = null;
  for (const l of lines) {
    if (l === "BEGIN:VEVENT") { assert.equal(open, null, `${rel}: an event inside an event`); open = {}; }
    else if (l === "END:VEVENT") { assert.ok(open, `${rel}: END:VEVENT with no BEGIN`); events.push(open); open = null; }
    else if (open) { const at = l.indexOf(":"); open[l.slice(0, at).split(";")[0]] = l.slice(at + 1); }
  }
  assert.equal(open, null, `${rel}: an event left open`);
  for (const e of events) {
    for (const key of ["UID", "DTSTAMP", "DTSTART", "DTEND", "RRULE", "SUMMARY", "DESCRIPTION"]) assert.ok(key in e, `${rel}: an event with no ${key}: ${JSON.stringify(e)}`);
    assert.match(e.DTSTART, /^\d{8}$/, `${rel}: DTSTART ${e.DTSTART}`);
    assert.match(e.DTEND, /^\d{8}$/, `${rel}: DTEND ${e.DTEND}`);
    assert.equal(e.RRULE, "FREQ=YEARLY");
    assert.match(e.UID, /^[a-z0-9-]+@is-it-rhubarb-yet$/, `${rel}: UID ${e.UID}`);
    assert.match(e.SUMMARY, /^In season: /);
    assert.ok(!/\d/.test(e.DESCRIPTION.replace(/https?:\S+/, "")), `${rel}: a number in the description: ${e.DESCRIPTION}`);
  }
  const uids = events.map((e) => e.UID);
  assert.equal(new Set(uids).size, uids.length, `${rel}: a UID twice`);
  if (expectEvents !== undefined) assert.equal(events.length, expectEvents, rel);
  return events;
}

test("season-starts.ics is a well-formed feed with every lead ring's season starts", () => {
  const events = checkFeed("season-starts.ics");
  assert.ok(events.length > 150, `${events.length} events`);
  const slugs = new Set(events.map((e) => e.UID.split("@")[0].replace(/-\d+$/, "")));
  assert.ok(slugs.has("rhubarb-forced"));
  assert.ok(!events.some((e) => e.UID.startsWith("wild-salmon")), "a food that cannot be sold has no event");
});

test("each food's own feed is well formed and holds its share of the whole feed", () => {
  const whole = checkFeed("season-starts.ics");
  const byFood = {};
  for (const e of whole) {
    const food = e.SUMMARY.replace(/^In season: /, "").replace(/ \(.*\)$/, "");
    byFood[food] = (byFood[food] || 0) + 1;
  }
  for (const slug of ["rhubarb", "apples", "cod", "asparagus", "tomatoes", "lamb"]) {
    const f = foods.find((x) => x.slug === slug);
    const events = checkFeed(path.join("remind", slug + ".ics"), byFood[f.name]);
    assert.ok(events.length > 0, slug);
    assert.ok(read(path.join("remind", slug + ".ics")).includes("X-WR-CALNAME:" + f.name + " season"), slug + " is named");
  }
  const unsold = read(path.join("remind", "wild-salmon.ics"));
  assert.ok(!unsold.includes("BEGIN:VEVENT"), "a food that cannot be sold has an empty feed");
});
