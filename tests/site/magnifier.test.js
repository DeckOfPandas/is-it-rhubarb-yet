// The calendar's magnifier maths, under Node: off it is the identity;
// on, the year keeps its length, the centre is spread and the far side
// squeezed, places keep their order, Finv undoes F, and laps beyond the
// year are carried through.
// Run: node --test tests/site/magnifier.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../../assets/magnifier.js");

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} is not within ${eps} of ${b}`);

test("off, F and Finv are the identity", () => {
  const m = M.create();
  assert.equal(m.on(), false);
  for (const t of [0, 7.5, 26, 51.99, 60, -3]) {
    assert.equal(m.F(t), t);
    assert.equal(m.Finv(t), t);
  }
});

test("on, the year keeps its length and its ends", () => {
  const m = M.create();
  m.set(26);
  assert.equal(m.on(), true);
  near(m.F(0), 0, 1e-9, "the start stays");
  near(m.F(52), 52, 1e-9, "the end stays");
  near(m.F(104), 104, 1e-9, "a lap later too");
});

test("the centre is spread and the far side squeezed, by the stated factor", () => {
  const m = M.create({ mag: 5, spread: 2.6 });
  m.set(26);
  const atCentre = m.F(26.5) - m.F(25.5);
  const farOff = m.F(3.5) - m.F(2.5);
  assert.ok(atCentre > 2.5, `a week at the centre is drawn ${atCentre} wide`);
  assert.ok(farOff < 1, `a week far off is drawn ${farOff} wide`);
  near(atCentre / farOff, 6, 0.6, "the centre is about 1 + mag times the rest");
});

test("places keep their order, and Finv undoes F, laps included", () => {
  const m = M.create({ slices: 520 });
  m.set(10);
  let last = -1;
  for (let t = 0; t <= 52; t += 0.25) {
    const y = m.F(t);
    assert.ok(y > last, `F(${t}) = ${y} is not after ${last}`);
    last = y;
    near(m.Finv(y), t, 1e-6, `Finv(F(${t}))`);
  }
  near(m.Finv(m.F(60)), 60, 1e-6, "a place in the next lap");
  near(m.Finv(m.F(-5)), -5, 1e-6, "a place in the lap before");
});

test("moving the centre moves the spread, and off again is the identity", () => {
  const m = M.create();
  m.set(5);
  const early = m.F(5.5) - m.F(4.5);
  m.set(45);
  const late = m.F(5.5) - m.F(4.5);
  assert.ok(early > 2.5 && late < 1, `centred at 5: ${early}; centred at 45: ${late}`);
  m.set(null);
  assert.equal(m.F(5.5), 5.5);
});
