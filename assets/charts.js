// The calendar and the wheel, made to be played with: a food highlights
// on hover or focus and opens its card on a click, tap or Enter; a pink
// line travels through the year, early, mid or late in each month, and
// the foods for its time are listed under the chart, under a heading
// with a stepper of its own; TODAY brings it back. While the chart is on
// screen a pink button at the foot of the screen counts what is in
// season and jumps to the list; down in the list, another takes you back
// to the top. On the calendar a magnifier spreads the
// weeks round the line and squeezes the rest, and the four season
// buttons jump to mid-season and zoom in; on a phone its names column is
// fitted to its longest name. The wheel never turns; In season names and
// lights only what is in season, Whole year everything. Everything here
// is added to charts that work without it. Loaded after verdict.js and
// site.js, whose window.Site lends the card's dial, the hand and Now's
// lists.
(function () {
  "use strict";
  var S = window.Site, V = window.Verdict;
  var root = document.querySelector("[data-tt]");
  if (!root || !S || !V) return;
  var WHEEL = root.dataset.tt === "wheel";
  var groups = JSON.parse(root.dataset.groups || "[]");
  var TODAY = S.TODAY, YEAR = S.YEAR, el = S.el;
  var SVG = "http://www.w3.org/2000/svg";
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  var still = matchMedia("(prefers-reduced-motion: reduce)");
  var narrow = matchMedia("(max-width: 43.74rem)");
  function svgEl(tag, cls, attrs) {
    var n = document.createElementNS(SVG, tag);
    if (cls) n.setAttribute("class", cls);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  // --- When: today, or one of 36 steps ---------------------------------------
  // Early, mid and late in each month, standing for the 5th, the 15th and
  // the 25th, as verdict.js says early (1st to 10th), mid and late. Time is
  // measured along the year in weeks, 0 to 52, on the charts' own scale:
  // week w starts at w-1, so a day's place is its day of the year less one
  // over seven. `at` is a step's index, or null for today itself, which
  // falls between steps and is where the line starts. A step is said
  // "mid-January" (mid always hyphenated), "early January", "late
  // January".
  var PARTS = ["early", "mid", "late"], DAYS = [5, 15, 25];
  var STEPS = [];
  MONTHS.forEach(function (m, mi) {
    PARTS.forEach(function (p, pi) {
      STEPS.push({
        key: p + "-" + m.toLowerCase(),
        phrase: (p === "mid" ? "mid-" : p + " ") + m,
        date: new Date(YEAR, mi, DAYS[pi])
      });
    });
  });
  function place(d) { return Math.min(V.dayOfYear(d) - 1, 363) / 7; }
  STEPS.forEach(function (s) { s.t = place(s.date); });
  var NOW_T = place(TODAY);
  var SEASONS = { winter: 1, spring: 10, summer: 19, autumn: 28 };
  var state = { at: null, zoom: false, season: null };
  function dateOf(at) { return at === null ? TODAY : STEPS[at].date; }
  function tOf(at) { return at === null ? NOW_T : STEPS[at].t; }
  function stepFrom(t, dir) {
    var i;
    if (dir > 0) { for (i = 0; i < 36; i++) if (STEPS[i].t > t + 1e-6) return i; return 0; }
    for (i = 35; i >= 0; i--) if (STEPS[i].t < t - 1e-6) return i; return 35;
  }
  // The step nearest a place on the year, round the year on the wheel.
  function nearest(t) {
    var best = 0, bd = Infinity;
    STEPS.forEach(function (s, i) {
      var d = Math.abs(s.t - t);
      if (WHEEL) d = Math.min(d, 52 - d);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  // --- The magnifier (the calendar's) -------------------------------------------
  // A focus and context distortion of the year: each slice of it is drawn
  // as wide as 1 + MAG * exp(-(d / SPREAD)^2), d its distance in weeks from
  // the line, and the whole scaled back to 52. F maps a place on the year
  // to where it is drawn, Finv back again; both are the identity with the
  // magnifier off, as they always are on the wheel. A table of N slices is
  // rebuilt whenever the line moves.
  var MAG = 5, SPREAD = 2.6, N = 520, table = null;
  function buildF() {
    if (!state.zoom) { table = null; return; }
    var c = tOf(state.at), sum = 0, acc = [0];
    for (var k = 0; k < N; k++) {
      var d = (k + 0.5) * 52 / N - c;
      sum += 1 + MAG * Math.exp(-(d * d) / (SPREAD * SPREAD));
      acc.push(sum);
    }
    table = acc.map(function (v) { return v / sum * 52; });
  }
  function F(t) {
    if (!table) return t;
    var lap = Math.floor(t / 52), u = (t - lap * 52) / 52 * N;
    var k = Math.min(N - 1, Math.floor(u));
    return table[k] + (table[k + 1] - table[k]) * (u - k) + lap * 52;
  }
  function Finv(y) {
    if (!table) return y;
    var lap = Math.floor(y / 52), v = y - lap * 52, lo = 0, hi = N;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (table[mid] <= v) lo = mid; else hi = mid; }
    return (lo + (v - table[lo]) / ((table[lo + 1] - table[lo]) || 1)) * 52 / N + lap * 52;
  }

  // --- The calendar --------------------------------------------------------------
  // Every bar, month line and label keeps the place on the year it was
  // drawn at, in weeks, and is redrawn at F of it. The line is a group in
  // the weeks' SVG and in the header's, moved sideways, under the month
  // names, which wear a halo in the page colour; its handle is a
  // button-like slider in a rail across the top of the sticky header,
  // always shown (TODAY on today). Today is an ink tick at the foot of
  // the header and replaces the dashed line. Where the magnifier spreads
  // the year, short ticks mark early, mid and late.
  var cals = [];
  function initCalendar() {
    document.querySelectorAll(".cal").forEach(function (cal) {
      var months = cal.querySelector(".cal-months"), cells = cal.querySelector(".cal-cells");
      var x0 = +cells.dataset.x0, cw = +cells.dataset.cw, header = +cells.dataset.header;
      var vb = cells.getAttribute("viewBox").split(" ").map(Number);
      var bottom = vb[1] + vb[3];
      var items = [];
      cells.querySelectorAll("rect.cell").forEach(function (r) {
        var x = +r.getAttribute("x"), w = +r.getAttribute("width");
        items.push({ el: r, kind: "bar", a: (x - x0) / cw, b: (x + w - x0) / cw });
      });
      [months, cells].forEach(function (svg) {
        svg.querySelectorAll(".month-line").forEach(function (l) { items.push({ el: l, kind: "line", a: (+l.getAttribute("x1") - x0) / cw }); });
      });
      var starts = [];
      months.querySelectorAll(".month-label").forEach(function (t) {
        var a = (+t.getAttribute("x") - 4 - x0) / cw;
        starts.push(a);
        items.push({ el: t, kind: "month", a: a });
      });
      items.forEach(function (it) { if (it.kind === "month") { var i = starts.indexOf(it.a); it.b = i < 11 ? starts[i + 1] : 52; } });
      cal.querySelectorAll(".today").forEach(function (l) { l.style.display = "none"; });

      function lineIn(svg, y1, y2) {
        var g = svgEl("g", "tt-line", { "aria-hidden": "true" });
        g.appendChild(svgEl("line", "tt-halo", { x1: 0, x2: 0, y1: y1, y2: y2 }));
        g.appendChild(svgEl("line", "tt-stroke", { x1: 0, x2: 0, y1: y1, y2: y2 }));
        svg.appendChild(g);
        return g;
      }
      var steps = STEPS.map(function (s) {
        var t = svgEl("line", "tt-step-tick", { y1: header - 5, y2: header, "aria-hidden": "true" });
        months.appendChild(t);
        return { el: t, t: s.t };
      });
      var lines = [lineIn(months, 0, header), lineIn(cells, header, bottom)];
      var tick = svgEl("line", "tt-today", { y1: header - 8, y2: header, "aria-hidden": "true" });
      months.appendChild(tick);
      months.querySelectorAll(".month-label").forEach(function (t) { months.appendChild(t); });
      var head = cal.querySelector(".chart-head");
      var rail = el("div", "tt-rail");
      var handle = makeHandle(el("div", "tt-handle"));
      rail.appendChild(handle);
      head.insertBefore(rail, head.firstChild);
      var c = { cal: cal, months: months, cells: cells, labels: cal.querySelector(".cal-labels"), head: head, rail: rail,
        x0: x0, cw: cw, cw0: cw, items: items, steps: steps, lines: lines, tick: tick, handle: handle, x: x0,
        hits: cells.querySelectorAll(".row-hit"), monthLabels: months.querySelectorAll(".month-label") };
      rail.addEventListener("click", function (e) {
        if (e.target !== rail) return;
        stopPlay();
        setAt(nearest(Finv((e.clientX - months.getBoundingClientRect().left) / c.cw)));
      });
      cal.querySelector(".chart-body").addEventListener("scroll", function () { placeHandle(c); }, { passive: true });
      cals.push(c);
    });
    window.addEventListener("resize", function () { if (fitWeeks()) cals.forEach(layoutCal); else cals.forEach(placeHandle); });
  }
  // The weeks fill the chart's width: on a wide screen, and on a phone
  // while magnified, a week is as wide as the room the names column
  // leaves, over 52; on a phone otherwise it is the drawn 14px, and the
  // chart scrolls. Words keep their size: only places along the year
  // change. True when a week's width changed, so the chart needs laying
  // out again.
  function fitWeeks() {
    var room = 0;
    cals.forEach(function (c) { var w = c.cal.parentElement.getBoundingClientRect().width; if (w) room = w; });
    if (!room) return false;
    var changed = false;
    cals.forEach(function (c) {
      var col = +c.labels.getAttribute("width");
      // Scrolling, the weeks keep the drawn 8px after December; filling,
      // only the 1px the last month line needs, so they end on the edge.
      var scroll = narrow.matches && !state.zoom, tail = scroll ? 8 : 1;
      var cw = scroll ? c.cw0 : Math.max(1, (room - col - tail) / 52);
      if (Math.abs(cw - c.cw) < 0.01 && c.fitted) return;
      c.cw = cw; c.fitted = true; changed = true;
      var w = (52 * cw + tail).toFixed(2);
      [c.months, c.cells].forEach(function (svg) {
        var vb = svg.getAttribute("viewBox").split(" ");
        vb[2] = w;
        svg.setAttribute("viewBox", vb.join(" "));
        svg.setAttribute("width", w);
      });
      c.hits.forEach(function (r) { r.setAttribute("width", w); });
      c.cal.style.setProperty("--cal-w", (col + +w) + "px");
    });
    return changed;
  }
  // A month name the scrolled weeks have pushed part way under the names
  // column, or past the chart's right edge, is hidden rather than cut.
  function cutMonths(c) {
    var head = c.head.getBoundingClientRect(), from = head.left + c.labels.getBoundingClientRect().width;
    c.monthLabels.forEach(function (t) {
      var r = t.getBoundingClientRect();
      t.classList.toggle("is-cut", !!r.width && (r.left < from - 0.5 || r.right > head.right + 0.5));
    });
  }
  function layoutCal(c) {
    function X(t) { return c.x0 + F(t) * c.cw; }
    c.items.forEach(function (it) {
      var xa = X(it.a);
      if (it.kind === "bar") {
        it.el.setAttribute("x", xa.toFixed(2));
        it.el.setAttribute("width", Math.max(0, X(it.b) - xa).toFixed(2));
      } else if (it.kind === "line") {
        it.el.setAttribute("x1", xa.toFixed(2)); it.el.setAttribute("x2", xa.toFixed(2));
      } else {
        it.el.setAttribute("x", (xa + 4).toFixed(2));
        it.el.style.visibility = X(it.b) - xa < 30 ? "hidden" : "";
      }
    });
    // A step's tick shows only where the magnifier has spread its third
    // of the month to twice its width or more.
    var third = 52 / 36, plain = third * c.cw;
    c.steps.forEach(function (s) {
      var xs = X(s.t);
      s.el.setAttribute("x1", xs.toFixed(2)); s.el.setAttribute("x2", xs.toFixed(2));
      s.el.style.display = state.zoom && X(s.t + third / 2) - X(s.t - third / 2) >= 2 * plain ? "" : "none";
    });
    var x = X(tOf(state.at));
    c.x = x;
    c.lines.forEach(function (g) { g.style.transform = "translateX(" + x.toFixed(2) + "px)"; });
    var now = X(NOW_T).toFixed(2);
    c.tick.setAttribute("x1", now); c.tick.setAttribute("x2", now);
    // On today itself the line is the mark; the tick waits under it.
    c.tick.style.display = state.at === null ? "none" : "";
    // The chart on show scrolls, if it must, to keep the line in view.
    // A place in the weeks' SVG is x0 less than its place in the scrolled
    // row, after the names column.
    var body = c.cal.querySelector(".chart-body");
    if (body.clientWidth && body.scrollWidth > body.clientWidth) {
      var labels = c.labels.getBoundingClientRect().width, at = x - c.x0 + labels;
      var from = body.scrollLeft + labels + 24, to = body.scrollLeft + body.clientWidth - 24;
      if (at < from || at > to) body.scrollTo({ left: Math.max(0, at - labels - (body.clientWidth - labels) / 2), behavior: still.matches || !c.ready ? "auto" : "smooth" });
    }
    placeHandle(c);
    c.ready = true;
  }
  // The handle is centred on the line, but slides along to stay on the
  // screen and inside the chart, 8px in from the screen's edge.
  function placeHandle(c) {
    var hw = c.handle.offsetWidth;
    if (!hw) return;
    var rail = c.rail.getBoundingClientRect(), head = c.head.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var lo = Math.max(8, head.left), hi = Math.min(vw - 8, head.right) - hw;
    var screen = rail.left + c.x - c.x0 + c.labels.getBoundingClientRect().width - hw / 2;
    screen = Math.max(lo, Math.min(screen, hi));
    c.handle.style.transform = "translateX(" + (screen - rail.left).toFixed(2) + "px)";
    cutMonths(c);
  }
  function calTime(c, clientX) {
    return Finv((clientX - c.months.getBoundingClientRect().left) / c.cw);
  }
  // On a phone the names are the small size, a row's short name where it
  // has one, and their column is exactly as wide as the longest name, 16px
  // from the screen's edge and 8px from the weeks: the labels' viewBox
  // starts that far left of the weeks, and the corner over them matches.
  // Wider, the column is x0 as drawn. The charts share their rows, so the
  // one on show is measured for all three. The weeks are then fitted to
  // what is left.
  var nameW = 0, EDGE = 16;
  function fitNames() {
    if (!cals.length) return;
    if (narrow.matches) {
      var widest = 0;
      cals.forEach(function (c) {
        c.labels.querySelectorAll(".row-label").forEach(function (t) {
          if (t.getClientRects().length) widest = Math.max(widest, t.getBBox().width);
        });
      });
      if (widest) nameW = EDGE + Math.ceil(widest) + 8;
    }
    var w = narrow.matches && nameW ? nameW : 0;
    cals.forEach(function (c) {
      var vb = c.labels.getAttribute("viewBox").split(" ");
      var col = w || c.x0;
      vb[0] = c.x0 - col; vb[2] = col;
      c.labels.setAttribute("viewBox", vb.join(" "));
      c.labels.setAttribute("width", col);
      c.cal.style.setProperty("--cal-x0", col + "px");
      c.cal.style.setProperty("--cal-w", (col + +c.cells.getAttribute("width")) + "px");
      c.labels.querySelectorAll(".group-label").forEach(function (g) { g.setAttribute("x", c.x0 - col + (w ? EDGE : 0)); });
    });
    fitWeeks();
    cals.forEach(function (c) { if (c.ready) layoutCal(c); else placeHandle(c); });
  }

  // --- The wheel -----------------------------------------------------------------
  // The wheel never turns: its labels, arcs and months stay where
  // arrivals-dial.html drew them. Whole year (the default): every word,
  // every arc at full strength, wherever the line is. In season: on every
  // wheel only the foods in season (YES or JUST) at the line's time keep
  // their words, and their arcs are lit at full strength over the faint
  // rest; every dot stays, named and tappable. The line is a radius from
  // the month ring to the rim; its handle is a knob at the rim with the
  // time beside it, always shown (TODAY on today). Today is an ink tick
  // across the month ring and replaces the hand.
  var dials = [];
  var litYear = document.getElementById("lit-year");
  function initWheel() {
    document.querySelectorAll("figure.dial > svg").forEach(function (svg) {
      var C = +svg.dataset.c, RING = +svg.dataset.ring, RIM = +svg.dataset.rim;
      var labels = Array.prototype.map.call(svg.querySelectorAll("a.label"), function (a) {
        return { slug: a.dataset.slug, text: a.querySelector("text"), arc: svg.querySelector('.season[data-slug="' + a.dataset.slug + '"]') };
      });
      var hand = svg.querySelector(".hand");
      if (hand) hand.style.display = "none";
      // The season-length axis and its ring labels move above the arcs
      // (under the food names), so their halo keeps every arc out of them.
      var firstLabel = svg.querySelector("a.label");
      svg.querySelectorAll(".guide-axis, .guide-label").forEach(function (n) { svg.insertBefore(n, firstLabel); });
      // Under the month names, which wear a halo in the ring's colour, so
      // the tick never cuts a name.
      var tick = svgEl("line", "tt-today", { x1: C, x2: C, y1: C - RING - 10, y2: C - RING + 10, "aria-hidden": "true" });
      svg.insertBefore(tick, svg.querySelector(".month"));
      var line = svgEl("g", "tt-line", { "aria-hidden": "true" });
      line.appendChild(svgEl("line", "tt-halo", { x1: C, x2: C, y1: C - RING - 12, y2: C - RIM }));
      line.appendChild(svgEl("line", "tt-stroke", { x1: C, x2: C, y1: C - RING - 12, y2: C - RIM }));
      line.style.transformOrigin = C + "px " + C + "px";
      svg.appendChild(line);
      var knob = makeHandle(svgEl("g", "tt-handle tt-knob"));
      knob.appendChild(svgEl("circle", "tt-knob-ring", { r: 15 }));
      knob.appendChild(svgEl("circle", "tt-knob-dot", { r: 9 }));
      var word = svgEl("text", "tt-knob-label", { "dominant-baseline": "middle" });
      knob.appendChild(word);
      svg.appendChild(knob);
      dials.push({ svg: svg, C: C, RING: RING, RIM: RIM, labels: labels, tick: tick, line: line, knob: knob, word: word, last: null });
    });
    if (litYear) document.querySelectorAll('input[name="lit"]').forEach(function (r) { r.addEventListener("change", draw); });
  }
  function norm(a) { return ((a % 360) + 360) % 360; }
  function layoutDial(d) {
    var C = d.C, year = litYear && litYear.checked;
    d.labels.forEach(function (l) {
      var on = year || !inSeason || !!inSeason[l.slug];
      l.text.style.display = on ? "" : "none";
      if (l.arc) l.arc.classList.toggle("is-on", year || !!(inSeason && inSeason[l.slug]));
    });
    d.tick.setAttribute("transform", "rotate(" + (NOW_T * 360 / 52).toFixed(2) + " " + C + " " + C + ")");
    var L = tOf(state.at) * 360 / 52;
    if (d.last !== null) L += 360 * Math.round((d.last - L) / 360);
    d.last = L;
    d.line.style.transform = "rotate(" + L.toFixed(2) + "deg)";
    var rad = L * Math.PI / 180, sin = Math.sin(rad), cos = Math.cos(rad);
    d.knob.setAttribute("transform", "translate(" + (C + d.RIM * sin).toFixed(2) + " " + (C - d.RIM * cos).toFixed(2) + ")");
    d.word.setAttribute("x", (sin >= 0 ? 22 : -22));
    d.word.setAttribute("y", (-cos * 10).toFixed(2));
    d.word.setAttribute("text-anchor", sin >= 0 ? "start" : "end");
    d.word.textContent = whenLabel().toUpperCase();
  }
  function wheelTime(d, clientX, clientY) {
    var p = d.svg.createSVGPoint();
    p.x = d.C; p.y = d.C;
    var c = p.matrixTransform(d.svg.getScreenCTM());
    var a = Math.atan2(clientX - c.x, -(clientY - c.y)) * 180 / Math.PI;
    return norm(a) * 52 / 360;
  }

  // --- The handle ------------------------------------------------------------------
  // A slider over the 36 steps, with today off the scale between two of
  // them: arrow keys move a step (from today, to the step either side),
  // Page Up and Page Down a month, Home back to today. Dragging snaps to
  // the nearest step. Only the handle takes touch-action: none, so the
  // chart itself still scrolls and pinches as a page does.
  function whenLabel() { return state.at === null ? "Today" : STEPS[state.at].phrase; }
  function makeHandle(h) {
    h.setAttribute("tabindex", "0");
    h.setAttribute("role", "slider");
    h.setAttribute("aria-label", "Time of year");
    h.setAttribute("aria-valuemin", "0");
    h.setAttribute("aria-valuemax", "35");
    h.addEventListener("keydown", function (e) {
      var k = e.key, dir = 0;
      if (k === "ArrowRight" || k === "ArrowUp") dir = 1;
      else if (k === "ArrowLeft" || k === "ArrowDown") dir = -1;
      else if (k === "PageUp") dir = 3;
      else if (k === "PageDown") dir = -3;
      else if (k === "Home") { e.preventDefault(); stopPlay(); setAt(null); return; }
      if (!dir) return;
      e.preventDefault();
      stopPlay();
      move(dir);
    });
    h.addEventListener("pointerdown", function (e) {
      if (e.button) return;
      e.preventDefault();
      stopPlay();
      h.setPointerCapture(e.pointerId);
      h.focus({ preventScroll: true });
      root.classList.add("is-dragging");
      function at(ev) {
        var t = WHEEL ? wheelTime(dials.filter(function (d) { return d.knob === h; })[0], ev.clientX, ev.clientY)
          : calTime(cals.filter(function (c) { return c.handle === h; })[0], ev.clientX);
        var i = nearest(((t % 52) + 52) % 52);
        if (i !== state.at) setAt(i);
      }
      function up() {
        h.removeEventListener("pointermove", at);
        h.removeEventListener("pointerup", up);
        h.removeEventListener("pointercancel", up);
        root.classList.remove("is-dragging");
      }
      h.addEventListener("pointermove", at);
      h.addEventListener("pointerup", up);
      h.addEventListener("pointercancel", up);
    });
    return h;
  }
  function move(dir) {
    var at = state.at === null ? stepFrom(NOW_T, dir) : state.at;
    if (state.at !== null) at = ((at + dir) % 36 + 36) % 36;
    else if (Math.abs(dir) > 1) at = ((at + dir - Math.sign(dir)) % 36 + 36) % 36;
    setAt(at);
  }

  // --- Setting the time ---------------------------------------------------------------
  // Everything follows the line: the magnifier, the charts, the handles'
  // values, the floating button, which button is pressed, the popover,
  // the list under the chart and the address, which carries ?when=mid-december
  // (none for today) so a time can be shared. `season` is the button
  // that moved it, if one did: it stays pressed until the line moves
  // again. TODAY is pressed whenever the line is on today.
  function setAt(at, season) {
    state.at = at;
    state.season = season || null;
    draw();
    var url = new URL(location.href);
    if (at === null) url.searchParams.delete("when"); else url.searchParams.set("when", STEPS[at].key);
    if (url.href !== location.href) history.replaceState(history.state, "", url);
  }
  // What is in season (YES or JUST) at the line's time, by slug, and how
  // many of the foods shown: every food, or on a kind's wheel that kind's.
  // For the floating button, the list and the wheels. Null until
  // foods.json is in.
  var inSeason = null, inSeasonCount = 0;
  var kindOfGroup = {};
  groups.forEach(function (g) { kindOfGroup[g.key] = g.kind; });
  function kindShown() {
    var r = document.querySelector('input[name="kind"]:checked');
    return WHEEL && r ? r.value : "all";
  }
  function shownFoods() {
    var kind = kindShown();
    return kind === "all" ? foods : foods.filter(function (f) { return kindOfGroup[f.group] === kind; });
  }
  function countInSeason() {
    if (!foods) return;
    var week = V.weekOf(dateOf(state.at)), shown = {};
    shownFoods().forEach(function (f) { shown[f.slug] = true; });
    inSeason = {}; inSeasonCount = 0;
    foods.forEach(function (f) {
      var v = V.foodVerdict(f, week).verdict;
      if (v === "YES" || v === "JUST") { inSeason[f.slug] = true; if (shown[f.slug]) inSeasonCount++; }
    });
  }
  function draw() {
    buildF();
    countInSeason();
    var text = state.at === null ? "Today, " + V.fmtDate(TODAY) : cap(STEPS[state.at].phrase);
    document.querySelectorAll(".tt-handle").forEach(function (h) {
      h.setAttribute("aria-valuenow", state.at === null ? nearest(NOW_T) : state.at);
      h.setAttribute("aria-valuetext", text);
      if (!WHEEL) h.textContent = whenLabel();
    });
    seasonBtns.forEach(function (b) {
      var on = b.dataset.season === "today" ? state.at === null : b.dataset.season === state.season;
      b.setAttribute("aria-pressed", String(on));
    });
    var when = state.at === null ? "this week" : "in " + STEPS[state.at].phrase;
    jump.querySelector(".tt-jump-text").textContent = inSeasonCount + " in season " + when;
    jump.setAttribute("aria-label", inSeasonCount + " in season " + when + ". Go to the list");
    fitWeeks();
    cals.forEach(layoutCal);
    dials.forEach(layoutDial);
    if (pop) fillPop();
    list();
    showJump();
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // --- The floating button -------------------------------------------------------------------
  // A pink pill fixed at the foot of the screen, "81 in season in late
  // November ↓", while the chart is on screen and the list's heading is
  // not, and not while a docked popover holds the foot of the screen.
  // Pressed, it scrolls to the list's heading (at once with reduced
  // motion) and gives it focus. It waits for foods.json, for its count.
  // Both pills' arrows are the site's arrow mark, turned down or up; on
  // the wheel's page, from 820px, the pills sit at the bottom right,
  // clear of the wheel's 6 o'clock.
  var jump = el("button", "tt-jump caps" + (WHEEL ? " on-wheel" : ""));
  jump.type = "button";
  jump.hidden = true;
  jump.appendChild(el("span", "tt-jump-text"));
  jump.appendChild(S.arrowMark()).classList.add("is-down");
  jump.addEventListener("click", toList);
  var chartSeen = false, headSeen = false, headWatch = null;
  // Back to top, the same pill with "Back to top ↑", in the same place
  // once the chart is wholly above the screen, down in the list. Pressed,
  // it goes to the top of the page (at once with reduced motion) and
  // gives the page's title focus.
  var up = el("button", "tt-jump tt-up caps" + (WHEEL ? " on-wheel" : ""));
  up.type = "button";
  up.hidden = true;
  up.appendChild(el("span", "tt-jump-text", "Back to top"));
  up.appendChild(S.arrowMark()).classList.add("is-up");
  up.addEventListener("click", function () {
    var title = document.querySelector("main h1");
    window.scrollTo({ top: 0, behavior: still.matches ? "auto" : "smooth" });
    if (title) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
  });
  function showJump() {
    var docked = !!(pop && pop.classList.contains("is-docked"));
    jump.hidden = !foods || !chartSeen || headSeen || docked;
    var chart = root.querySelector(".ordered");
    up.hidden = !jump.hidden || docked || chart.getBoundingClientRect().bottom > S.headerHeight();
  }
  function toList() {
    var head = listBox.querySelector(".tt-list-title");
    if (!head) return;
    head.scrollIntoView({ behavior: still.matches ? "auto" : "smooth", block: "start" });
    head.focus({ preventScroll: true });
  }

  // --- Play the year ----------------------------------------------------------------------
  // One step every PLAY_MS, all the way round, and back to where it began;
  // a touch on the chart, the handle or the button again stops it. With
  // reduced motion the line jumps from step to step instead of gliding.
  var PLAY_MS = 400, timer = null, playFrom = null, played = 0;
  var playBtn = document.getElementById("tt-play");
  function startPlay() {
    playFrom = state.at; played = 0;
    playBtn.setAttribute("aria-pressed", "true");
    playBtn.setAttribute("aria-label", "Stop");
    playBtn.querySelector(".tt-play-glyph").textContent = "■";
    timer = setInterval(function () {
      played++;
      if (played >= 36) { stopPlay(); setAt(playFrom); return; }
      move(1);
    }, PLAY_MS);
  }
  function stopPlay() {
    if (!timer) return;
    clearInterval(timer); timer = null;
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.setAttribute("aria-label", "Play the year");
    playBtn.querySelector(".tt-play-glyph").textContent = "▶";
  }
  playBtn.addEventListener("click", function () { if (timer) stopPlay(); else startPlay(); });

  // --- TODAY, the seasons and the calendar's magnifier -----------------------------
  // A season button moves the line to mid-season, and on the calendar
  // turns the magnifier on; TODAY puts the line on today itself, and the
  // magnifier off. Neither ever turns the wheel. A season pressed again
  // while still pressed lets go on the calendar (the magnifier off, the
  // line where it is) and does nothing on the wheel. Switching the
  // magnifier off lets go of a season too.
  var zoomOn = document.getElementById("zoom-on"), zoomOff = document.getElementById("zoom-off");
  var seasonBtns = document.querySelectorAll(".season-btn");
  function zoom(on) {
    state.zoom = on;
    if (zoomOn) { zoomOn.checked = on; zoomOff.checked = !on; }
  }
  if (zoomOn) {
    zoomOn.addEventListener("change", function () { zoom(true); draw(); });
    zoomOff.addEventListener("change", function () { zoom(false); state.season = null; draw(); });
  }
  seasonBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var name = b.dataset.season;
      stopPlay();
      if (name === "today") { zoom(false); setAt(null); return; }
      if (state.season === name) {
        if (!WHEEL) { zoom(false); state.season = null; draw(); }
        return;
      }
      if (!WHEEL) zoom(true);
      setAt(SEASONS[name], name);
    });
  });
  var drawDots = document.getElementById("draw-dots");
  if (drawDots) {
    document.querySelectorAll('input[name="draw"]').forEach(function (r) {
      r.addEventListener("change", function () { root.classList.toggle("draw-dots", drawDots.checked); });
    });
  }

  // --- Highlight and popover ----------------------------------------------------------------
  // A food is its parts: on the calendar a row's name and weeks (its
  // data-row), on the wheel a label and its arc (its data-slug, within
  // one wheel). Hovering or focusing it lights it and fades the rest; a
  // click, tap or Enter pins it, outlined in ink, and opens its card
  // beside it, or docked under the chart on a narrow screen. The card is
  // the home answer's, with a close button of its own; Escape, a click
  // outside or the button closes it and gives focus back.
  function partsOf(t) {
    if (WHEEL) {
      var svg = t.ownerSVGElement;
      return { box: svg, parts: svg.querySelectorAll('[data-slug="' + t.dataset.slug + '"]') };
    }
    var cal = t.closest(".cal");
    return { box: cal, parts: cal.querySelectorAll('[data-row="' + t.dataset.row + '"]') };
  }
  // The part that stands for a food, whichever part was met: on the
  // wheel its label, on the calendar its name (the one that takes focus).
  function targetOf(n) {
    var t = n && n.closest && n.closest(WHEEL ? "a.label, .season" : "a.row");
    if (!t || !root.contains(t)) return null;
    if (WHEEL && !t.matches("a.label")) t = t.ownerSVGElement.querySelector('a.label[data-slug="' + t.dataset.slug + '"]');
    if (!WHEEL && !t.closest(".cal-labels")) t = t.closest(".cal").querySelector('.cal-labels a.row[data-row="' + t.dataset.row + '"]');
    return t;
  }
  // A lit wheel label is brought in front of its neighbours, under the
  // line, unless it has focus, which moving it would take away.
  var hot = null, pinned = null;
  function light(t) {
    if (t === hot) return;
    if (hot) { var was = partsOf(hot); was.box.classList.remove("is-lit"); was.parts.forEach(function (p) { p.classList.remove("is-hot"); }); }
    hot = t;
    if (!t) return;
    var now = partsOf(t);
    now.box.classList.add("is-lit");
    now.parts.forEach(function (p) { p.classList.add("is-hot"); });
    if (WHEEL && !t.contains(document.activeElement)) t.parentNode.insertBefore(t, t.parentNode.querySelector(".tt-line"));
  }
  root.addEventListener("pointerover", function (e) { if (!pinned) { var t = targetOf(e.target); if (t) light(t); } });
  root.addEventListener("pointerout", function (e) {
    if (pinned || !hot) return;
    var to = targetOf(e.relatedTarget);
    if (!to) light(null);
  });
  root.addEventListener("focusin", function (e) { if (!pinned) { var t = targetOf(e.target); light(t); } });
  root.addEventListener("click", function (e) {
    var t = targetOf(e.target);
    if (!t || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    stopPlay();
    open(t);
  });
  root.addEventListener("pointerdown", function (e) { if (timer && !e.target.closest(".tt-play")) stopPlay(); });

  var pop = null, foods = null, bySlug = {};
  var popTemplate = document.getElementById("tt-pop");
  function open(t) {
    close(false);
    light(t);
    pinned = t;
    partsOf(t).parts.forEach(function (p) { p.classList.add("is-pinned"); });
    pop = popTemplate.content.firstElementChild.cloneNode(true);
    pop.querySelector(".tt-close").addEventListener("click", function () { close(true); });
    document.body.appendChild(pop);
    fillPop();
    pop.querySelector(".one-more").focus({ preventScroll: true });
  }
  function close(giveBack) {
    if (!pop) return;
    pop.remove();
    pop = null;
    var t = pinned;
    if (t) partsOf(t).parts.forEach(function (p) { p.classList.remove("is-pinned"); });
    pinned = null;
    light(null);
    showJump();
    if (giveBack && t) t.focus({ preventScroll: true });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pop) { e.preventDefault(); close(true); } });
  // A click elsewhere closes the card; focus goes back to the food only if
  // it was in the card, so the click keeps whatever it went to.
  document.addEventListener("pointerdown", function (e) {
    if (pop && !pop.contains(e.target) && !targetOf(e.target)) close(pop.contains(document.activeElement));
  });
  // The card for the pinned food at the line's time: its verdict, date
  // line and dial (the ring of the variety that gave the verdict, or on
  // the calendar the row's own), and the time it is for when that is not
  // today.
  function fillPop() {
    if (!pop || !pinned || !foods) return;
    var f = bySlug[pinned.dataset.slug];
    if (!f) return;
    var when = dateOf(state.at), fv = V.foodVerdict(f, V.weekOf(when));
    var vi = WHEEL ? f.varieties.indexOf(fv.variety.v) : +pinned.dataset.variety;
    var r = fv.varieties[vi] || fv.variety;
    var label = r.v.name ? V.varietyLabel(r.v) : "";
    var name = f.name + (label ? " (" + label + ")" : "");
    pop.setAttribute("aria-label", name);
    pop.style.setProperty("--food", r.colour);
    pop.querySelector(".tt-pop-when").textContent = state.at === null ? "" : "In " + STEPS[state.at].phrase;
    pop.querySelector(".ask-name").textContent = label ? V.varietySaid(f, r.v, true) : f.name.toLowerCase();
    pop.querySelector(".one-word").textContent = r.verdict + ".";
    pop.querySelector(".one-line").textContent = V.dateLine(r, when.getFullYear(), when);
    var go = pop.querySelector(".one-more");
    go.href = S.foodUrl(f.slug);
    S.setArrowText(go, S.tellMeAbout(f.name));
    var box = pop.querySelector(".one-dial"), key = f.slug + "/" + vi + "/" + (state.at === null ? "now" : state.at);
    if (box.dataset.key !== key) {
      box.dataset.key = key;
      S.miniDial(f.slug, vi, r.colour).then(function (fig) {
        if (!fig || box.dataset.key !== key) return;
        box.textContent = "";
        box.appendChild(fig);
        S.markWheel(fig, when);
      });
    }
    placePop();
  }
  // Beside the food: on the calendar under its row (over it when the row
  // is low on the screen), from where its weeks begin; on the wheel to the
  // right of its dot, or to the left when there is no room. On a narrow
  // screen it docks at the foot of the screen, and the page scrolls the
  // food clear of it.
  function placePop() {
    var docked = narrow.matches;
    pop.classList.toggle("is-docked", docked);
    showJump();
    var rect = (WHEEL ? pinned.querySelector(".dot") : pinned).getBoundingClientRect();
    if (docked) {
      pop.style.left = pop.style.top = "";
      var top = pop.getBoundingClientRect().top;
      if (rect.bottom > top - 8) window.scrollBy({ top: rect.bottom - top + 16, behavior: still.matches ? "auto" : "smooth" });
      return;
    }
    var w = pop.offsetWidth, h = pop.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var x, y;
    if (WHEEL) {
      x = rect.right + 16;
      if (x + w > vw - 16) x = rect.left - 16 - w;
      y = rect.top + rect.height / 2 - h / 2;
    } else {
      x = rect.right + 8;
      y = rect.bottom + 8;
      if (y + h > vh - 16) y = rect.top - 8 - h;
    }
    x = Math.max(16, Math.min(x, vw - 16 - w));
    y = Math.max(S.headerHeight() + 16, Math.min(y, vh - 16 - h));
    pop.style.left = (x + window.scrollX) + "px";
    pop.style.top = (y + window.scrollY) + "px";
  }
  window.addEventListener("resize", function () { if (pop) placePop(); });

  // A food's name for a screen reader: "Celery, July to October", from
  // its in-season weeks (any variety's, on the wheel; the row's own on
  // the calendar), each run named by the months it starts and ends in.
  function seasonOf(varieties) {
    var inWeek = [];
    for (var w = 1; w <= 52; w++) inWeek[w] = varieties.some(function (v) { return V.stateAt(v, w) === "in"; });
    if (inWeek.slice(1).every(Boolean)) return "all year";
    var runs = [], w0 = 1;
    while (w0 <= 52 && inWeek[w0]) w0++;
    for (var k = 0, w1 = w0; k < 52; k++, w1 = w1 % 52 + 1) {
      if (inWeek[w1] && !inWeek[w1 === 1 ? 52 : w1 - 1]) runs.push([w1, w1]);
      if (inWeek[w1] && runs.length) runs[runs.length - 1][1] = w1;
    }
    return runs.map(function (r) {
      var a = MONTHS[V.startOfWeek(r[0], YEAR).getMonth()], b = MONTHS[V.endOfWeek(r[1], YEAR).getMonth()];
      return a === b ? a : a + " to " + b;
    }).join(" and ");
  }
  function nameParts() {
    root.querySelectorAll(WHEEL ? "a.label" : ".cal-labels a.row").forEach(function (a) {
      var f = bySlug[a.dataset.slug];
      if (!f) return;
      var vs = WHEEL ? f.varieties : [f.varieties[+a.dataset.variety]];
      var label = WHEEL ? "" : V.varietyLabel(vs[0]);
      var season = seasonOf(vs);
      a.setAttribute("aria-label", f.name + (label ? " (" + label + ")" : "") + (season ? ", " + season : ""));
    });
  }

  // --- The list under the chart -------------------------------------------------------------
  // Now's own header and bands for the line's time. At today, Now itself:
  // "In season this week". At another time, "In season in mid-December".
  // Under the title, the days of the data week the line is in, "13–19
  // January", between ‹ and ›, which step the line early, mid, late. The
  // header is made once, so a stepper keeps its focus; only its words
  // change. On a kind's wheel the bands are that kind's foods, and end
  // with a way to every food at the same time: the All wheel, which the
  // page opens on, at the same ?when=.
  var listBox = document.getElementById("tt-list");
  var listTitle, listDates, listBands, listAll;
  function makeList() {
    var head = el("header", "page-head now-head tt-list-head");
    listTitle = el("h2", "tt-list-title");
    listTitle.id = "tt-list-title";
    listTitle.setAttribute("tabindex", "-1");
    head.appendChild(listTitle);
    var line = el("p", "week-line");
    [["‹", "Earlier", -1], ["›", "Later", 1]].forEach(function (b, i) {
      var btn = el("button", "week-step", b[0]);
      btn.type = "button";
      btn.setAttribute("aria-label", b[1]);
      btn.addEventListener("click", function () { stopPlay(); move(b[2]); });
      if (i) line.appendChild(btn); else { line.appendChild(btn); listDates = el("span", "tt-list-dates"); line.appendChild(listDates); }
    });
    head.appendChild(line);
    listBox.appendChild(head);
    listBands = el("div", "digest");
    listBox.appendChild(listBands);
    listAll = el("p", "tt-list-all");
    listBox.appendChild(listAll);
    if (headWatch) headWatch.observe(listTitle);
  }
  function list() {
    if (!foods) return;
    if (!listTitle) makeList();
    var when = dateOf(state.at), week = V.weekOf(when);
    listTitle.textContent = "In season " + (state.at === null ? "this week" : "in " + STEPS[state.at].phrase);
    S.setDate(listDates, V.fmtRange(week, when.getFullYear()));
    S.fillDigest(listBands, V.nowLists(shownFoods(), groups, week, when.getFullYear(), when));
    listAll.textContent = "";
    listAll.hidden = kindShown() === "all";
    if (!listAll.hidden) {
      listAll.appendChild(S.arrowLink(S.BASE + "wheel/" + (state.at === null ? "" : "?when=" + STEPS[state.at].key),
        "Everything " + (state.at === null ? "this week" : "in " + STEPS[state.at].phrase)));
    }
    listBox.hidden = false;
  }

  // --- Start -----------------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    if (WHEEL) initWheel(); else initCalendar();
    document.querySelectorAll('input[name="order"], input[name="kind"]').forEach(function (r) {
      r.addEventListener("change", function () { fitNames(); draw(); });
    });
    var controls = document.getElementById("tt-controls");
    document.getElementById("tt-time").hidden = false;
    fitNames();
    if (document.fonts) document.fonts.ready.then(fitNames);
    narrow.addEventListener("change", fitNames);
    document.body.appendChild(jump);
    document.body.appendChild(up);
    var queued = false;
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; showJump(); });
    }, { passive: true });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        chartSeen = entries.some(function (e) { return e.isIntersecting; });
        showJump();
      }).observe(root.querySelector(".ordered"));
      headWatch = new IntersectionObserver(function (entries) {
        headSeen = entries[0].isIntersecting;
        showJump();
      });
    }
    // The calendar's header sticks under its controls on a wide screen,
    // and a row the keyboard reaches stops under both. Only the chart on
    // show has a header with a height.
    if (!WHEEL && window.ResizeObserver) {
      new ResizeObserver(function () {
        root.style.setProperty("--tt-controls-h", controls.getBoundingClientRect().height + "px");
      }).observe(controls);
      root.querySelectorAll(".chart-head").forEach(function (h) {
        new ResizeObserver(function () {
          if (h.offsetHeight) root.style.setProperty("--cal-head-h", h.offsetHeight + "px");
        }).observe(h);
      });
    }
    root.classList.add("is-live");
    var want = new URL(location.href).searchParams.get("when");
    var at = null;
    STEPS.forEach(function (s, i) { if (s.key === want) at = i; });
    state.at = at;
    draw();
    S.loadFoods().then(function (all) {
      foods = all;
      all.forEach(function (f) { bySlug[f.slug] = f; });
      nameParts();
      draw();
    });
  });
})();
