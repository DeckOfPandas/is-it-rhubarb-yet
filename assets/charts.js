// The calendar and the wheel, made to be played with: a food highlights
// on hover or focus and opens its card on a click, tap or Enter; a pink
// line travels through the year, early, mid or late in each month, and
// the foods for its time are listed under the chart; TODAY brings it
// back. On the calendar a magnifier spreads the weeks round the line and
// squeezes the rest, the four season buttons jump to mid-season and zoom
// in, and a readout in the sticky header counts what is in season and
// jumps to the list. On the wheel the season buttons turn that season to
// the top, and the ALL wheel names only what is in season. Everything
// here is added to charts that work without it. Loaded after verdict.js
// and site.js, whose window.Site lends the card's dial, the hand and
// Now's lists.
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
  // falls between steps and is where the line starts.
  var PARTS = ["early", "mid", "late"], DAYS = [5, 15, 25];
  var STEPS = [];
  MONTHS.forEach(function (m, mi) {
    PARTS.forEach(function (p, pi) {
      STEPS.push({
        key: p + "-" + m.toLowerCase(),
        label: p + " " + m,
        phrase: (p === "mid" ? "mid-" : p + " ") + m,
        date: new Date(YEAR, mi, DAYS[pi])
      });
    });
  });
  function place(d) { return Math.min(V.dayOfYear(d) - 1, 363) / 7; }
  STEPS.forEach(function (s) { s.t = place(s.date); });
  var NOW_T = place(TODAY);
  var SEASONS = { winter: 1, spring: 10, summer: 19, autumn: 28 };
  var state = { at: null, zoom: false, season: null, spin: 0 };
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
  // the weeks' SVG and in the header's, moved sideways; its handle is a
  // button-like slider in a rail across the top of the sticky header.
  // Today is an ink tick at the foot of the header and replaces the
  // dashed line. The header's corner, over the names, holds the readout:
  // the time and how many foods are in season then, a button down to the
  // list.
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
      months.querySelectorAll(".week-label").forEach(function (t) { items.push({ el: t, kind: "week", a: (+t.getAttribute("x") - x0) / cw }); });
      cal.querySelectorAll(".today").forEach(function (l) { l.style.display = "none"; });

      function lineIn(svg, y1, y2) {
        var g = svgEl("g", "tt-line", { "aria-hidden": "true" });
        g.appendChild(svgEl("line", "tt-halo", { x1: 0, x2: 0, y1: y1, y2: y2 }));
        g.appendChild(svgEl("line", "tt-stroke", { x1: 0, x2: 0, y1: y1, y2: y2 }));
        svg.appendChild(g);
        return g;
      }
      var lines = [lineIn(months, 0, header), lineIn(cells, header, bottom)];
      var tick = svgEl("line", "tt-today", { y1: header - 10, y2: header, "aria-hidden": "true" });
      months.appendChild(tick);
      var head = cal.querySelector(".chart-head");
      var rail = el("div", "tt-rail");
      var handle = makeHandle(el("div", "tt-handle"));
      rail.appendChild(handle);
      head.insertBefore(rail, head.firstChild);
      rail.addEventListener("click", function (e) {
        if (e.target !== rail) return;
        stopPlay();
        setAt(nearest(Finv((e.clientX - months.getBoundingClientRect().left) / cw)));
      });
      var readout = el("button", "tt-readout");
      readout.type = "button";
      readout.appendChild(el("span", "tt-readout-when"));
      readout.appendChild(el("span", "tt-readout-count"));
      readout.addEventListener("click", toList);
      cal.querySelector(".cal-corner").appendChild(readout);
      cals.push({ cal: cal, months: months, cells: cells, x0: x0, cw: cw, items: items, lines: lines, tick: tick, handle: handle, readout: readout });
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
      } else if (it.kind === "month") {
        it.el.setAttribute("x", (xa + 4).toFixed(2));
        it.el.style.visibility = X(it.b) - xa < 30 ? "hidden" : "";
      } else {
        it.el.setAttribute("x", xa.toFixed(2));
        it.el.style.visibility = X(it.a + 0.5) - X(it.a - 0.5) < 10 ? "hidden" : "";
      }
    });
    var x = X(tOf(state.at));
    c.lines.forEach(function (g) { g.style.transform = "translateX(" + x.toFixed(2) + "px)"; });
    var now = X(NOW_T).toFixed(2);
    c.tick.setAttribute("x1", now); c.tick.setAttribute("x2", now);
    // Centred on the line, but kept inside the weeks, so its words are
    // never cut off at either end of the year.
    var hw = c.handle.offsetWidth, end = c.x0 + 52 * c.cw + 8;
    var left = Math.max(c.x0, Math.min(x - hw / 2, end - hw));
    c.handle.style.transform = "translateX(" + left.toFixed(2) + "px)";
    // The chart on show scrolls, if it must, to keep the line in view.
    var body = c.cal.querySelector(".chart-body");
    if (body.clientWidth && body.scrollWidth > body.clientWidth) {
      var labels = c.cal.querySelector(".cal-labels").getBoundingClientRect().width;
      var from = body.scrollLeft + labels + 24, to = body.scrollLeft + body.clientWidth - 24;
      if (x < from || x > to) body.scrollTo({ left: Math.max(0, x - labels - (body.clientWidth - labels) / 2), behavior: still.matches || !c.ready ? "auto" : "smooth" });
    }
    c.ready = true;
  }
  function calTime(c, clientX) {
    return Finv((clientX - c.months.getBoundingClientRect().left) / c.cw);
  }

  // --- The wheel -----------------------------------------------------------------
  // Each label, arc, spoke and month name keeps the angle it was drawn at,
  // and is redrawn turned by the wheel's spin (how far a season button
  // has turned it, so that season is at the top). A label is laid out as
  // arrivals-dial.html lays it: on the right half its dot and words run
  // outward, on the left half they are turned over to stay readable. On
  // the ALL wheel only the foods in season (YES or JUST) at the line's
  // time keep their words; every dot stays, named and tappable. The line
  // is a radius from the month ring to the rim; its handle is a knob at
  // the rim with the time beside it. Today is an ink tick across the
  // month ring and replaces the hand.
  var dials = [];
  function initWheel() {
    document.querySelectorAll("figure.dial > svg").forEach(function (svg) {
      var C = +svg.dataset.c, RING = +svg.dataset.ring, RIM = +svg.dataset.rim;
      var labels = [];
      svg.querySelectorAll("a.label").forEach(function (a) {
        labels.push({
          el: a, g: a.querySelector("g"), dot: a.querySelector(".dot"), text: a.querySelector("text"),
          slug: a.dataset.slug, angle: +a.dataset.angle, r: +a.dataset.r, size: +a.dataset.dot
        });
      });
      var arcs = Array.prototype.map.call(svg.querySelectorAll(".season"), function (c) {
        return { el: c, wk: +c.dataset.wk, len: +c.dataset.len };
      });
      var turns = Array.prototype.map.call(svg.querySelectorAll(".spoke, text.month"), function (n) {
        return { el: n, angle: +n.dataset.angle, month: n.tagName.toLowerCase() === "text" };
      });
      var hand = svg.querySelector(".hand");
      if (hand) hand.style.display = "none";
      var tick = svgEl("line", "tt-today", { x1: C, x2: C, y1: C - RING - 10, y2: C - RING + 10, "aria-hidden": "true" });
      svg.appendChild(tick);
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
      dials.push({ svg: svg, all: svg.dataset.kind === "all", C: C, RING: RING, RIM: RIM, labels: labels, arcs: arcs, turns: turns, tick: tick, line: line, knob: knob, word: word, last: null });
    });
  }
  function norm(a) { return ((a % 360) + 360) % 360; }
  function layoutDial(d) {
    var C = d.C;
    function deg(a) { return a + state.spin; }
    d.labels.forEach(function (l) {
      var a = norm(deg(l.angle)), right = a < 180;
      l.g.setAttribute("transform", "rotate(" + (right ? a - 90 : a + 90).toFixed(2) + " " + C + " " + C + ")");
      l.dot.setAttribute("cx", right ? C + l.r : C - l.r);
      l.text.setAttribute("x", right ? C + l.r + l.size + 4 : C - l.r - l.size - 4);
      l.text.setAttribute("text-anchor", right ? "start" : "end");
      if (d.all) l.text.style.display = !inSeason || inSeason[l.slug] ? "" : "none";
    });
    var spinWeeks = state.spin * 52 / 360;
    d.arcs.forEach(function (a) {
      a.el.setAttribute("stroke-dashoffset", (-(a.wk + spinWeeks)).toFixed(3));
    });
    d.turns.forEach(function (n) {
      var a = deg(n.angle), tr = "rotate(" + a.toFixed(2) + " " + C + " " + C + ")";
      var na = norm(a);
      if (n.month && na > 90 && na < 270) tr += " rotate(180 " + C + " " + (C - d.RING) + ")";
      n.el.setAttribute("transform", tr);
    });
    d.tick.setAttribute("transform", "rotate(" + deg(NOW_T * 360 / 52).toFixed(2) + " " + C + " " + C + ")");
    var L = deg(tOf(state.at) * 360 / 52);
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
    var a = Math.atan2(clientX - c.x, -(clientY - c.y)) * 180 / Math.PI - state.spin;
    return norm(a) * 52 / 360;
  }

  // --- The handle ------------------------------------------------------------------
  // A slider over the 36 steps, with today off the scale between two of
  // them: arrow keys move a step (from today, to the step either side),
  // Page Up and Page Down a month, Home back to today. Dragging snaps to
  // the nearest step. Only the handle takes touch-action: none, so the
  // chart itself still scrolls and pinches as a page does.
  function whenLabel() { return state.at === null ? "Today" : STEPS[state.at].label; }
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
  // values, the readout, which button is pressed, the popover, the list
  // under the chart and the address, which carries ?when=mid-december
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
  // many: for the readout and the ALL wheel. Null until foods.json is in.
  var inSeason = null, inSeasonCount = 0;
  function countInSeason() {
    if (!foods) return;
    var week = V.weekOf(dateOf(state.at));
    inSeason = {}; inSeasonCount = 0;
    foods.forEach(function (f) {
      var v = V.foodVerdict(f, week).verdict;
      if (v === "YES" || v === "JUST") { inSeason[f.slug] = true; inSeasonCount++; }
    });
  }
  function draw() {
    buildF();
    countInSeason();
    var text = state.at === null ? "Today, " + V.fmtDate(TODAY) : cap(STEPS[state.at].label);
    document.querySelectorAll(".tt-handle").forEach(function (h) {
      h.setAttribute("aria-valuenow", state.at === null ? nearest(NOW_T) : state.at);
      h.setAttribute("aria-valuetext", text);
      if (!WHEEL) h.textContent = whenLabel();
    });
    seasonBtns.forEach(function (b) {
      var on = b.dataset.season === "today" ? state.at === null : b.dataset.season === state.season;
      b.setAttribute("aria-pressed", String(on));
    });
    cals.forEach(function (c) {
      c.readout.querySelector(".tt-readout-when").textContent = (state.at === null ? "This week" : STEPS[state.at].label) + " ·";
      c.readout.querySelector(".tt-readout-count").textContent = foods ? inSeasonCount + " in season ↓" : "In season ↓";
      c.readout.setAttribute("aria-label", (state.at === null ? "This week" : cap(STEPS[state.at].label)) +
        (foods ? ", " + inSeasonCount + " in season" : "") + ". Go to the list");
    });
    cals.forEach(layoutCal);
    dials.forEach(layoutDial);
    if (pop) fillPop();
    list();
  }
  // The readout's jump: down to the list, its heading taking focus.
  function toList() {
    var head = listBox.querySelector(".tt-list-head");
    if (!head) return;
    head.setAttribute("tabindex", "-1");
    listBox.scrollIntoView({ behavior: still.matches ? "auto" : "smooth", block: "start" });
    head.focus({ preventScroll: true });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

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
  // A season button moves the line to mid-season: on the calendar it turns
  // the magnifier on, on the wheel it turns the wheel to bring the line to
  // the top. Pressed again while still pressed, it lets go: the magnifier
  // off, the wheel turned back, the line where it is. TODAY puts the line
  // on today itself, the magnifier off and the wheel as it was. Switching
  // the magnifier off lets go of a season too.
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
      if (name === "today" || state.season === name) {
        zoom(false);
        state.spin = 0;
        if (name === "today") setAt(null);
        else { state.season = null; draw(); }
        return;
      }
      var at = SEASONS[name];
      if (WHEEL) state.spin = -STEPS[at].t * 360 / 52;
      else zoom(true);
      setAt(at, name);
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
    if (WHEEL && !t.contains(document.activeElement)) t.parentNode.insertBefore(t, t.parentNode.querySelector(".tt-today"));
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
    go.querySelector(".arrow-text").textContent = S.tellMeAbout(f.name);
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
    y = Math.max(16, Math.min(y, vh - 16 - h));
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
  // Now's own bands for the line's time: at today, Now itself under "This
  // week"; at another time, under "In mid-December", with Great for Great
  // this week.
  var listBox = document.getElementById("tt-list");
  function list() {
    if (!foods) return;
    var when = dateOf(state.at), week = V.weekOf(when);
    listBox.textContent = "";
    listBox.appendChild(el("h2", "tt-list-head section-label", state.at === null ? "This week" : "In " + STEPS[state.at].phrase));
    var bands = el("div", "digest");
    S.fillDigest(bands, V.nowLists(foods, groups, week, when.getFullYear(), when), state.at === null);
    listBox.appendChild(bands);
    listBox.hidden = false;
  }

  // --- Start -----------------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    if (WHEEL) initWheel(); else initCalendar();
    document.querySelectorAll('input[name="order"], input[name="kind"]').forEach(function (r) { r.addEventListener("change", draw); });
    var controls = document.getElementById("tt-controls");
    controls.hidden = false;
    // The calendar's header sticks under its controls on a wide screen.
    if (!WHEEL && window.ResizeObserver) new ResizeObserver(function () {
      root.style.setProperty("--tt-controls-h", controls.getBoundingClientRect().height + "px");
    }).observe(controls);
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
