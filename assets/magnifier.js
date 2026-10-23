/* The calendar's magnifier: a focus and context distortion of the year.
   Each slice of the year is drawn as wide as 1 + mag * exp(-(d / spread)^2),
   d its distance in weeks from the centre, and the whole scaled back to
   52, so the year keeps its length and the weeks round the centre take
   the room the rest give up. F maps a place on the year (in weeks, 0 to
   52, laps beyond) to where it is drawn, Finv back again; both are the
   identity while the magnifier is off. A table of `slices` slices is
   rebuilt whenever the centre moves. Loaded by the chart pages as a
   classic script (window.Magnifier) before charts.js, and required by
   tests/site under Node. No dependencies and no DOM. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Magnifier = factory();
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var YEAR = 52;

  // One magnifier. `mag` is how many times wider the centre slice is than
  // an unmagnified one, `spread` the width of the bell in weeks, `slices`
  // the table's resolution.
  function create(opts) {
    opts = opts || {};
    var mag = opts.mag === undefined ? 5 : opts.mag;
    var spread = opts.spread === undefined ? 2.6 : opts.spread;
    var n = opts.slices === undefined ? 520 : opts.slices;
    var table = null;

    // Centre the magnifier on a place in weeks, or turn it off with null.
    function set(centre) {
      if (centre === null || centre === undefined) { table = null; return; }
      var sum = 0, acc = [0];
      for (var k = 0; k < n; k++) {
        var d = (k + 0.5) * YEAR / n - centre;
        sum += 1 + mag * Math.exp(-(d * d) / (spread * spread));
        acc.push(sum);
      }
      table = acc.map(function (v) { return v / sum * YEAR; });
    }
    function on() { return table !== null; }
    function F(t) {
      if (!table) return t;
      var lap = Math.floor(t / YEAR), u = (t - lap * YEAR) / YEAR * n;
      var k = Math.min(n - 1, Math.floor(u));
      return table[k] + (table[k + 1] - table[k]) * (u - k) + lap * YEAR;
    }
    function Finv(y) {
      if (!table) return y;
      var lap = Math.floor(y / YEAR), v = y - lap * YEAR, lo = 0, hi = n;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (table[mid] <= v) lo = mid; else hi = mid; }
      return (lo + (v - table[lo]) / ((table[lo + 1] - table[lo]) || 1)) * YEAR / n + lap * YEAR;
    }
    return { set: set, on: on, F: F, Finv: Finv };
  }

  return { create: create, YEAR: YEAR };
}));
