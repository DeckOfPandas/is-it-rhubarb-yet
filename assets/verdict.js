/* The one verdict function. Every page loads this as a classic script
   (window.Verdict) and tools/bake.js requires it under Node
   (module.exports), so the baked HTML and the live page cannot disagree.
   No dependencies and no DOM: arithmetic on week numbers and dates only.

   Weeks: week 1 starts on 1 January; each week is 7 days; week 52 runs to
   31 December (8 days, 9 in a leap year). Week 52 is followed by week 1,
   so a season wraps the year end as one presence. tools/make-foods.py and
   the Liquid templates draw on the same grid.

   A run is one [from, to, state] entry of a variety. A presence span is a
   maximal stretch of covered weeks, "in" or "avail", wrap included. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Verdict = factory();
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // The thresholds, in one place.
  // NEARLY_WEEKS: a season starting within this many weeks is NEARLY.
  // JUST_WEEKS: a hard stop within this many weeks is JUST, so with 2 the
  //   current week or the next is the last covered week.
  // NEW_WEEKS: a food is "just arrived" for this many weeks from the start
  //   of its in-season run.
  // ISOLATED_AVAIL: the verdict for a "just about" run touching no
  //   in-season run (scallops in spring).
  var C = {
    NEARLY_WEEKS: 3,
    JUST_WEEKS: 2,
    NEW_WEEKS: 2,
    ISOLATED_AVAIL: "JUST"
  };
  // YES-ISH: only storage or a glasshouse this week. Fresh beats it, and
  // it beats NEARLY.
  var RANK = { YES: 5, JUST: 4, "YES-ISH": 3, NEARLY: 2, NO: 1, NEVER: 0 };
  var MS_PER_DAY = 86400000;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  // --- The week grid --------------------------------------------------------

  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  // Rounded, not floored: a local-time difference across a clock change is
  // an hour short of whole days.
  function dayOfYear(d) {
    return Math.round((midnight(d) - new Date(d.getFullYear(), 0, 1)) / MS_PER_DAY) + 1;
  }
  function weekOf(d) { return Math.min(52, Math.floor((dayOfYear(d) - 1) / 7) + 1); }
  // Today on the UK's calendar, whatever the clock it runs on says: the
  // seasons are British, so a visitor at breakfast in Sydney on a Monday
  // is answered for the Sunday it still is in London, and a build at
  // 03:30 UTC in summer for the day it already is there. Noon on that
  // date in the clock's own zone, so the week and day-of-year arithmetic,
  // which read local fields, agree with it. Without Intl's time zones it
  // is the clock's own day.
  function ukToday(now) {
    now = now || new Date();
    try {
      var at = {};
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "numeric", day: "numeric" })
        .formatToParts(now).forEach(function (p) { at[p.type] = p.value; });
      return new Date(+at.year, +at.month - 1, +at.day, 12);
    } catch (e) {
      return now;
    }
  }
  function startOfWeek(week, year) { return new Date(year, 0, 1 + (week - 1) * 7); }
  function endOfWeek(week, year) {
    return week === 52 ? new Date(year, 11, 31) : new Date(year, 0, (week - 1) * 7 + 7);
  }
  function nextWeek(w) { return w === 52 ? 1 : w + 1; }
  function prevWeek(w) { return w === 1 ? 52 : w - 1; }
  function daysBetween(a, b) { return Math.round((midnight(b) - midnight(a)) / MS_PER_DAY); }

  // --- Reading a variety ----------------------------------------------------

  // "in", "store", "avail" or "" for one week; "in" wins where runs
  // overlap, then "store". A store run is sold from store after the
  // harvest. A whole food's combined timeline (see foodVerdict) is read
  // from its array.
  function stateAt(variety, week) {
    if (variety.timeline) return variety.timeline[week];
    var best = "";
    for (var i = 0; i < variety.weeks.length; i++) {
      var r = variety.weeks[i];
      if (week >= r[0] && week <= r[1]) {
        if (r[2] === "in") return "in";
        if (r[2] === "store") best = "store";
        else if (!best) best = "avail";
      }
    }
    return best;
  }

  // Step from `week` in direction `dir` (+1 or -1) while `test` accepts the
  // next week's state, at most 51 steps. Returns the last accepted week,
  // how many steps it took, whether the walk crossed the year end, and
  // whether every week was accepted (the whole year).
  function walk(variety, week, dir, test) {
    var w = week, steps = 0, wrapped = false;
    while (steps < 51) {
      var n = dir > 0 ? nextWeek(w) : prevWeek(w);
      if (!test(stateAt(variety, n))) break;
      if ((dir > 0 && n === 1) || (dir < 0 && n === 52)) wrapped = true;
      w = n; steps++;
    }
    return { week: w, steps: steps, wrapped: wrapped, all: steps === 51 };
  }
  function covered(s) { return s !== ""; }
  function isIn(s) { return s === "in"; }
  function isStore(s) { return s === "store"; }
  function empty(s) { return s === ""; }

  // A week reached by walking forward or back: which week, and how many
  // years from the reference year (-1, 0 or 1).
  function ahead(w) { return { week: w.week, years: w.wrapped ? 1 : 0 }; }
  function behind(w) { return { week: w.week, years: w.wrapped ? -1 : 0 }; }

  // First in-season week at or after `start` inside the span that starts
  // there, or null if the span is "avail" throughout.
  function firstInFrom(variety, start) {
    var w = start.week, years = start.years, steps = 0;
    while (steps < 52 && stateAt(variety, w) !== "") {
      if (stateAt(variety, w) === "in") return { week: w, years: years };
      var n = nextWeek(w);
      if (n === 1) years++;
      w = n; steps++;
    }
    return null;
  }

  // --- The verdict for one variety in week `week` -------------------------
  // Returns {verdict, state, ...}. Weeks in the result are {week, years}
  // relative to the year of the week asked about:
  //   from     the week the next presence starts (NEARLY, NO)
  //   inFrom   the week it is properly in, when that is later than `from`
  //   until    the last week it is in season (YES) or present at all (JUST)
  //   since    weeks since the in-season run began (YES, JUST from "in")
  //   weeksUntil  weeks until `from` (NEARLY, NO)
  //   store    true when the week is sold from store (YES-ISH, until the
  //            end of the store run)
  function varietyVerdict(variety, week) {
    var s = stateAt(variety, week);
    var r = { state: s };
    if (s === "store") {
      var storeEnd = walk(variety, week, 1, isStore);
      r.verdict = "YES-ISH"; r.store = true; r.since = 52;
      if (storeEnd.all) { r.allYear = true; return r; }
      r.until = ahead(storeEnd);
      r.spanUntil = ahead(walk(variety, week, 1, covered));
      return r;
    }
    if (s === "in") {
      var inEnd = walk(variety, week, 1, isIn);
      if (inEnd.all) {
        r.verdict = "YES"; r.allYear = true; r.since = 52;
        return r;
      }
      var spanEnd = walk(variety, week, 1, covered);
      var began = walk(variety, week, -1, isIn);
      r.hardStop = spanEnd.steps === inEnd.steps;
      r.until = ahead(inEnd);
      r.spanUntil = ahead(spanEnd);
      r.since = began.steps;
      r.began = behind(began);
      r.verdict = (r.hardStop && inEnd.steps < C.JUST_WEEKS) ? "JUST" : "YES";
      return r;
    }
    if (s === "avail") {
      // Coming in if an in-season week lies ahead within this span; going
      // out if one lies behind within it; isolated otherwise.
      var span = walk(variety, week, 1, covered);
      var w = week, years = 0, i;
      for (i = 0; i < span.steps; i++) {
        var n = nextWeek(w);
        if (n === 1) years = 1;
        w = n;
        if (stateAt(variety, w) === "in") {
          r.verdict = "NEARLY"; r.from = { week: w, years: years }; r.weeksUntil = i + 1;
          r.spanUntil = ahead(span);
          return r;
        }
      }
      var back = walk(variety, week, -1, covered);
      var inBehind = false;
      w = week;
      for (i = 0; i < back.steps; i++) {
        w = prevWeek(w);
        if (stateAt(variety, w) === "in") { inBehind = true; break; }
      }
      r.until = ahead(span);
      r.spanUntil = r.until;
      if (inBehind) { r.verdict = "JUST"; r.tail = true; }
      else { r.verdict = C.ISOLATED_AVAIL; r.isolated = true; }
      return r;
    }
    var gap = walk(variety, week, 1, empty);
    if (gap.all) { r.verdict = "NO"; r.never = true; return r; }
    var start = { week: nextWeek(gap.week), years: (gap.wrapped || gap.week === 52) ? 1 : 0 };
    r.from = start;
    r.inFrom = firstInFrom(variety, start);
    r.weeksUntil = gap.steps + 1;
    r.verdict = r.weeksUntil <= C.NEARLY_WEEKS ? "NEARLY" : "NO";
    return r;
  }

  // --- The verdict for a food -----------------------------------------------
  // A food answers as a whole. Its rings (varieties, coasts, wild and
  // glasshouse) are combined into one timeline, each week taking the best
  // state any ring has: "in" > "avail" > "glass" > "store" > "". A
  // ring whose `method` is glasshouse has its weeks count as "glass",
  // grown under cover, which answers as storage does; the ring's name
  // is only its label. The verdict and the date line are worked out
  // on that timeline, so a food is not JUST while one ring ends and
  // another carries on. `held` keeps each week's storage or glasshouse
  // state under any fresh one, for the clause that follows a fresh season
  // and for a week that is both coming in and held.
  function isGlasshouse(v) { return v.method === "glasshouse"; }
  var STATE_RANK = { "in": 3, "avail": 2, "glass": 1, "store": 1, "": 0 };
  var combined = typeof WeakMap === "function" ? new WeakMap() : null;
  function timelineOf(food) {
    var hit = combined && combined.get(food);
    if (hit) return hit;
    var best = [""], held = [""];
    for (var w = 1; w <= 52; w++) {
      var b = "", h = "";
      for (var i = 0; i < food.varieties.length; i++) {
        var v = food.varieties[i], s = stateAt(v, w);
        if (!s) continue;
        // A glasshouse ring is held while it is in; its just-about weeks
        // count for nothing, so the whole food's "then under glass
        // until" ends where the ring's own line says it does.
        if (isGlasshouse(v)) { if (s !== "in") continue; s = "glass"; }
        if (STATE_RANK[s] > STATE_RANK[b] || (s === "glass" && b === "store")) b = s;
        if ((s === "glass" || s === "store") && h !== "glass") h = s;
      }
      best.push(b); held.push(h);
    }
    var t = { name: "", timeline: best, held: { timeline: held } };
    if (combined) combined.set(food, t);
    return t;
  }
  function isFresh(s) { return s === "in" || s === "avail"; }
  function notFresh(s) { return !isFresh(s); }

  // The next fresh week after `week`, within NEARLY_WEEKS or not:
  // {at, weeks}, or null when nothing is ever fresh.
  function nextFresh(t, week) {
    var gap = walk(t, week, 1, notFresh);
    if (gap.all) return null;
    return { at: { week: nextWeek(gap.week), years: (gap.wrapped || gap.week === 52) ? 1 : 0 }, weeks: gap.steps + 1 };
  }
  // A week of storage or glasshouse alone: YES-ISH, until that kind ends.
  // `fresh` is the next fresh week. `heldOn` is true when the held run
  // lasts until fresh food is back, so a glasshouse line says "for now".
  function heldVerdict(t, week, kind) {
    var r = { verdict: "YES-ISH", state: kind, held: kind, store: kind === "store", glass: kind === "glass", since: 52 };
    var end = walk(t.held, week, 1, function (s) { return s === kind; });
    r.fresh = nextFresh(t, week);
    if (end.all) { r.allYear = true; return r; }
    r.until = ahead(end);
    r.heldOn = isFresh(stateAt(t, nextWeek(end.week)));
    return r;
  }
  // What follows a fresh season that ends at `freshEnd`: storage or a
  // glasshouse, and until when, as {kind, until}, or {kind, on: true}
  // when it never ends; null when nothing follows.
  function thenHeld(t, week, freshEnd) {
    var n = nextWeek(freshEnd.week);
    var kind = stateAt(t.held, n);
    if (!kind || freshEnd.all) return null;
    var years = (freshEnd.wrapped || freshEnd.week === 52) ? 1 : 0;
    var end = walk(t.held, n, 1, function (s) { return s === kind; });
    if (end.all) return { kind: kind, on: true };
    return { kind: kind, until: { week: end.week, years: years + (end.wrapped ? 1 : 0) } };
  }
  function wholeVerdict(t, week) {
    var s = stateAt(t, week);
    if (s === "store" || s === "glass") return heldVerdict(t, week, stateAt(t.held, week));
    var r = { state: s };
    if (s === "in") {
      var inEnd = walk(t, week, 1, isIn);
      if (inEnd.all) { r.verdict = "YES"; r.allYear = true; r.since = 52; return r; }
      var freshEnd = walk(t, week, 1, isFresh);
      var began = walk(t, week, -1, isIn);
      r.hardStop = freshEnd.steps === inEnd.steps;
      r.until = ahead(inEnd);
      r.spanUntil = ahead(freshEnd);
      r.since = began.steps;
      r.began = behind(began);
      r.verdict = (r.hardStop && inEnd.steps < C.JUST_WEEKS) ? "JUST" : "YES";
      r.then = thenHeld(t, week, freshEnd);
      return r;
    }
    if (s === "avail") {
      var span = walk(t, week, 1, isFresh);
      var w = week, years = 0, i;
      for (i = 0; i < span.steps; i++) {
        var n = nextWeek(w);
        if (n === 1) years = 1;
        w = n;
        if (stateAt(t, w) === "in") {
          // Coming in while storage or a glasshouse still sells it: held
          // food beats NEARLY.
          var kind = stateAt(t.held, week);
          if (kind) return heldVerdict(t, week, kind);
          r.verdict = "NEARLY"; r.from = { week: w, years: years }; r.weeksUntil = i + 1;
          r.spanUntil = ahead(span);
          return r;
        }
      }
      var back = walk(t, week, -1, isFresh);
      var inBehind = false;
      w = week;
      for (i = 0; i < back.steps; i++) {
        w = prevWeek(w);
        if (stateAt(t, w) === "in") { inBehind = true; break; }
      }
      r.until = ahead(span);
      r.spanUntil = r.until;
      if (inBehind) { r.verdict = "JUST"; r.tail = true; }
      else { r.verdict = C.ISOLATED_AVAIL; r.isolated = true; }
      r.then = thenHeld(t, week, span);
      return r;
    }
    var gap = walk(t, week, 1, empty);
    if (gap.all) { r.verdict = "NO"; r.never = true; return r; }
    var start = { week: nextWeek(gap.week), years: (gap.wrapped || gap.week === 52) ? 1 : 0 };
    r.from = start;
    r.inFrom = firstInFrom(t, start);
    r.weeksUntil = gap.steps + 1;
    r.verdict = r.weeksUntil <= C.NEARLY_WEEKS ? "NEARLY" : "NO";
    return r;
  }

  // Each ring is answered on its own too, for the ring list and for a
  // named variety found by search. A food that cannot be sold (`unsold`)
  // is NO, its line that sentence. `whole` is the food's own answer.
  function foodVerdict(food, week) {
    if (food.never) return { verdict: "NEVER", whole: null, varieties: [] };
    var results = food.varieties.map(function (v, i) {
      var r = varietyVerdict(v, week);
      if (food.unsold) r = { verdict: "NO", state: "", unsold: food.unsold };
      r.name = v.name || "";
      r.v = v;
      r.index = i;
      r.colour = v.colour || food.colour;
      return r;
    });
    var whole = food.unsold ? { verdict: "NO", state: "", unsold: food.unsold } : wholeVerdict(timelineOf(food), week);
    // A food in season all year from some coasts and not others says
    // which: "All year, from the North East and South East". Only when
    // every all-year ring is a coast or a place (`ring: region`); a
    // variety that is in all year (rock oysters, cultivated mushrooms)
    // makes the food's "All year" its own.
    if (whole.allYear && whole.verdict === "YES") {
      var allYear = results.filter(function (r) { return r.allYear && r.verdict === "YES"; });
      if (allYear.length < results.length && allYear.every(function (r) { return r.v.ring === "region" && r.v.name; })) {
        whole.fromRings = allYear.map(function (r) { return r.v.name; });
      }
    }
    return { verdict: whole.verdict, whole: whole, varieties: results };
  }
  // Coasts and places in a sentence: "the North East and South East",
  // "Glenarm, Northern Ireland and Loch Duart, Scotland". Compass
  // coasts share one "the".
  function placesSaid(names) {
    var compass = names.every(function (n) { return /^(North|South|East|West)\b/.test(n); });
    var list = names.length < 2 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    return (compass ? "the " : "") + list;
  }

  // A food's rings from the longest season to the shortest, as the dial
  // draws them outside in and the ring list lists them: the number of
  // weeks a ring has any state, storage included. Ties keep data order.
  function ringOrder(food) {
    return food.varieties.map(function (v, i) {
      var n = 0;
      for (var w = 1; w <= 52; w++) if (stateAt(v, w)) n++;
      return { i: i, n: n };
    }).sort(function (a, b) { return b.n - a.n || a.i - b.i; }).map(function (x) { return x.i; });
  }

  // --- Dates in words -------------------------------------------------------

  // Ordinals: "19th October", "19th October 2026". Wherever a date is
  // shown its letters are raised: datePieces marks them, and the page,
  // the cards and the wheels set them as superscript.
  function fmtDay(d) { return d.getDate() + ordinal(d.getDate()); }
  function fmtDate(d) { return fmtDay(d) + " " + MONTHS[d.getMonth()]; }
  function fmtDateYear(d) { return fmtDate(d) + " " + d.getFullYear(); }
  // A week's days, with an en dash: "15th–21st October", "29th October –
  // 4th November", and the years only when it crosses one.
  function fmtRange(week, year) {
    var a = startOfWeek(week, year), b = endOfWeek(week, year);
    if (a.getFullYear() !== b.getFullYear()) return fmtDateYear(a) + " – " + fmtDateYear(b);
    if (a.getMonth() === b.getMonth()) return fmtDay(a) + "–" + fmtDate(b);
    return fmtDate(a) + " – " + fmtDate(b);
  }
  // An ordinal's letters: 1 "st", 22 "nd", 13 "th".
  function ordinal(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return "th";
    return { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
  }
  // A date's text in pieces, each [text, raised]: "22nd October" is
  // [["22", false], ["nd", true], [" October", false]].
  function datePieces(s) {
    var out = [], re = /(\d)(st|nd|rd|th)\b/g, last = 0, m;
    while ((m = re.exec(s))) {
      out.push([s.slice(last, m.index + 1), false], [m[2], true]);
      last = m.index + m[0].length;
    }
    out.push([s.slice(last), false]);
    return out.filter(function (p) { return p[0]; });
  }
  // The same as HTML, for what the build writes: "22<sup>nd</sup> October".
  function dateHtml(s) {
    return datePieces(s).map(function (p) { return p[1] ? "<sup>" + p[0] + "</sup>" : p[0]; }).join("");
  }
  // The date a {week, years} stands for, given the reference year.
  function startDate(at, year) { return startOfWeek(at.week, year + at.years); }
  function endDate(at, year) { return endOfWeek(at.week, year + at.years); }

  // --- Season dates in words --------------------------------------------
  // The data is weekly and mostly came from monthly calendars, so a season
  // boundary is never shown as a calendar date. A phrase is chosen by the
  // days from today to the boundary and names the middle of the data week
  // (its start plus three days), so week 18, which starts on 30 April,
  // reads as May. Phrases get coarser with distance and never finer than
  // the data: no "next week", because data weeks are not Monday to Sunday.
  // The same four steps coming and going, so the words of one band of Now
  // answer those of the other.
  //   Coming in, by days to the first day of the first week:
  //     1 to 6 "a few days away"; 7 to 13 "a week or two away"; 14 to 27
  //     "two or three weeks away"; 28 to 62 "from early November"; beyond
  //     that the month alone, "in April", or "next October" when it is
  //     this month again.
  //   Going out, by days to the last day of the last week:
  //     0 to 6 "a few days left"; 7 to 13 "a week or two left"; 14 to 27
  //     "two or three weeks left"; 28 on "until late December".
  // Early is the 1st to the 10th, mid the 11th to the 20th, late the rest;
  // mid is always hyphenated ("mid-January"), early and late never are.
  // The one calendar date on the site is the "as of" date, which is when
  // an answer was true, not a season estimate.
  function midOfWeek(at, year) {
    var d = startDate(at, year);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3);
  }
  function monthPart(d) {
    var day = d.getDate();
    return (day <= 10 ? "early " : day <= 20 ? "mid-" : "late ") + MONTHS[d.getMonth()];
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  // The middle of the week `today` falls in, for a week with no real
  // today: the digest for another week.
  function midOfToday(week, year) { return midOfWeek({ week: week, years: 0 }, year); }

  // How a start is said, all lower-case. `soon` stands alone ("a week or
  // two away", "from early November", "in April"), `after` follows "First
  // ones" or "in earnest" ("in a week or two"), and `back` follows a NO
  // ("back in April").
  function arriving(at, year, today) {
    var days = daysBetween(today, startDate(at, year));
    var mid = midOfWeek(at, year), month = MONTHS[mid.getMonth()];
    if (days <= 6) return { soon: "a few days away", after: "in a few days", back: "a few days away" };
    if (days <= 13) return { soon: "a week or two away", after: "in a week or two", back: "a week or two away" };
    if (days <= 27) return { soon: "two or three weeks away", after: "in two or three weeks", back: "two or three weeks away" };
    if (days <= 62) {
      var part = "from " + monthPart(mid);
      return { soon: part, after: part, back: part };
    }
    var far = mid.getMonth() === today.getMonth() ? "next " + month : "in " + month;
    return { soon: far, after: far, back: "back " + far, farOff: true };
  }
  // How an end is said, all lower-case. `left` stands alone or follows a
  // state ("a few days left", "until late December"), `after` follows a
  // "then" ("for a few more days", "until late December").
  function leaving(at, year, today) {
    var days = daysBetween(today, endDate(at, year));
    if (days <= 6) return { left: "a few days left", after: "for a few more days" };
    if (days <= 13) return { left: "a week or two left", after: "for another week or two" };
    if (days <= 27) return { left: "two or three weeks left", after: "for another two or three weeks" };
    var month = "until " + monthPart(midOfWeek(at, year));
    return { left: month, after: month };
  }
  // A state and its end: "Under glass until late November", "Tailing off,
  // a few days left".
  function stateUntil(state, at, year, today) {
    var end = leaving(at, year, today).left;
    return state + (end.indexOf("until ") === 0 ? " " : ", ") + end;
  }
  // "First ones in April, in earnest in May." When both halves would say
  // the same thing the month is split into parts, and if they still agree
  // the one start is said alone.
  function firstOnes(r, year, today) {
    var a = arriving(r.from, year, today), b = arriving(r.inFrom, year, today);
    if (a.soon === b.soon && !a.farOff) return cap(a.soon);
    var sa = a.after, sb = b.after;
    if (sa === sb) {
      sa = "in " + monthPart(midOfWeek(r.from, year));
      sb = "in " + monthPart(midOfWeek(r.inFrom, year));
    }
    if (sa === sb) return cap(sa);
    return "First ones " + sa + ", in earnest " + sb;
  }

  // The phrase for one variety's verdict, without its full stop: the date
  // line on a food page, the line under a food in a list. `year` is the
  // year of the week asked about and `today` the day the question is
  // asked on; a digest for another week passes the middle of that week.
  // A start said after "Outdoor": near, as `arriving` says it ("in a week
  // or two"); further off, "from early July", since the glasshouse line
  // is read all winter and a bare month is too loose for it.
  function fromSaid(at, year, today) {
    if (daysBetween(today, startDate(at, year)) <= 27) return arriving(at, year, today).after;
    return "from " + monthPart(midOfWeek(at, year));
  }
  // What follows a fresh season, after its end: ", then available from
  // storage until late July", ", then under glass".
  function thenSaid(r, year, today) {
    if (!r.then) return "";
    var words = r.then.kind === "glass" ? ", then under glass" : ", then available from storage";
    return r.then.on ? words : words + " " + leaving(r.then.until, year, today).after;
  }
  // A week of storage or glasshouse alone. Storage says when fresh food is
  // back once that is within NEARLY_WEEKS; a glasshouse that lasts until
  // the outdoor season says when that comes.
  function heldSaid(r, year, today) {
    if (r.glass) {
      if ((r.allYear || r.heldOn) && r.fresh) return "Under glass for now. Outdoor " + fromSaid(r.fresh.at, year, today);
      if (r.allYear) return "Under glass all year";
      return stateUntil("Under glass", r.until, year, today);
    }
    var s = r.allYear ? "Available from storage all year" : stateUntil("Available from storage", r.until, year, today);
    if (r.fresh && r.fresh.weeks <= C.NEARLY_WEEKS) s += ". Fresh " + arriving(r.fresh.at, year, today).soon;
    return s;
  }

  // A YES whose fresh run ends softly, into a just-about tail, says so
  // once the end is near enough to be said in weeks ("A few days left,
  // then tailing off until late November"), since "A few days left" alone
  // is the JUST line and a reader would expect the food to be gone, not
  // JUST next week; further off it is "Until late October" as before. A
  // JUST that is the tail itself, or an isolated just-about run, says
  // "Tailing off until late November": JUST is for a hard stop within two
  // weeks, and a tail can last a quarter.
  function softEnd(r, year, today) {
    return r.hardStop === false && daysBetween(today, endDate(r.until, year)) <= 27;
  }
  function phrase(r, year, today) {
    if (r.unsold) return r.unsold;
    switch (r.verdict) {
      case "YES":
        if (r.allYear) return r.fromRings ? "All year, from " + placesSaid(r.fromRings) : "All year";
        if (softEnd(r, year, today)) {
          return cap(leaving(r.until, year, today).left) + ", then tailing off " + leaving(r.spanUntil, year, today).after + thenSaid(r, year, today);
        }
        return cap(leaving(r.until, year, today).left) + thenSaid(r, year, today);
      case "JUST":
        if (r.tail || r.isolated) return stateUntil("Tailing off", r.until, year, today) + thenSaid(r, year, today);
        return cap(leaving(r.until, year, today).left) + thenSaid(r, year, today);
      case "YES-ISH":
        return heldSaid(r, year, today);
      case "NEARLY":
        if (r.state === "avail") return "A few about now, in earnest " + arriving(r.from, year, today).after;
        if (r.inFrom && r.inFrom.week !== r.from.week) return firstOnes(r, year, today);
        return cap(arriving(r.from, year, today).soon);
      case "NO":
        if (r.never) return "Never, on this data";
        if (r.inFrom && r.inFrom.week !== r.from.week) return firstOnes(r, year, today);
        return cap(arriving(r.from, year, today).back);
      default:
        return "";
    }
  }
  function dateLine(r, year, today) {
    var p = phrase(r, year, today);
    return p ? p + "." : "";
  }
  // Days from today to the boundary the phrase is about: the end for YES,
  // JUST and YES-ISH, the start for NEARLY and NO; null for all year and
  // never. Lists sort by it.
  function daysTo(r, year, today) {
    if (r.allYear || r.never || r.unsold) return null;
    if (r.verdict === "YES" || r.verdict === "JUST" || r.verdict === "YES-ISH") return r.until ? daysBetween(today, endDate(r.until, year)) : null;
    if (r.from) return daysBetween(today, startDate(r.from, year));
    return null;
  }

  // One timing per food for a list grouped by timing: `when` is the
  // boundary that groups it (when a JUST food ends, when a NEARLY food is
  // in in earnest, what `phrase` says for the rest), `days` the days to
  // that boundary, and `aside` the rest of the food's phrase, which a list
  // shows beside the food rather than as a group of its own: "a few about
  // now" or "first ones in a week or two" before a start, "then available
  // from storage until late April" after an end. A tail JUST has no aside
  // on Now, since its band says it is on the way out and its group says
  // how long for. The words are `phrase`'s own.
  function timing(r, year, today) {
    var whole = { when: phrase(r, year, today), aside: "", days: daysTo(r, year, today) };
    if (r.verdict === "JUST") {
      return { when: cap(leaving(r.until, year, today).left), aside: thenSaid(r, year, today).replace(/^, /, ""), days: whole.days };
    }
    if (r.verdict !== "NEARLY") return whole;
    if (r.state === "avail") return { when: cap(arriving(r.from, year, today).soon), aside: "a few about now", days: whole.days };
    if (!r.inFrom || r.inFrom.week === r.from.week) return whole;
    var first = arriving(r.from, year, today), then = arriving(r.inFrom, year, today);
    if (first.soon === then.soon) return whole;
    return { when: cap(then.soon), aside: "first ones " + first.after, days: daysBetween(today, startDate(r.inFrom, year)) };
  }

  // --- Naming a variety ----------------------------------------------------
  // A named variety is a type (forced, maincrop, savoy) or, marked
  // `cultivar: true` in the data, a cultivar (Cox, Conference). In a list
  // it follows the food in brackets: a type in lower case, a cultivar as
  // written, "Rhubarb (forced)", "Apples (Cox)". In a sentence it is its
  // `said` form, or else its name then the food's, "Forced rhubarb", "Cox
  // apples"; mid-sentence a type is lower-cased and a cultivar never is.
  // A ring of a coast or a place (`ring: region`) keeps its capitals, as a
  // cultivar does: "Cod (South West)".
  function varietyLabel(v) {
    if (!v || !v.name) return "";
    return v.cultivar || v.ring === "region" ? v.name : v.name.toLowerCase();
  }
  // A food's name mid-sentence: its `said` form where lower-casing the
  // name is wrong (John Dory, Dover sole), else the name in lower case.
  function foodSaid(food) { return food.said || food.name.toLowerCase(); }
  function varietySaid(food, v, mid) {
    if (!v || !v.name) return mid ? foodSaid(food) : food.name;
    if (v.ring) return (mid ? foodSaid(food) : food.name) + " (" + varietyLabel(v) + ")";
    var s = v.said || (v.cultivar ? v.name : cap(v.name.toLowerCase())) + " " + foodSaid(food);
    return mid && !v.cultivar ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  }

  // --- A season in months ---------------------------------------------------
  // The in-season weeks of the given rings as a sentence's months: "July
  // to October", "all year", "May to July and October to March", each
  // run named by the months its first and last weeks fall in (by their
  // middle day, so a week that ends on the 1st belongs to the month it
  // is mostly in); "" when nothing is ever in. A glasshouse ring counts
  // as held, not fresh, and is left out. The food page's season line and
  // the charts' spoken names.
  function seasonWords(varieties, year) {
    var fresh = varieties.filter(function (v) { return !isGlasshouse(v); });
    var inWeek = [];
    for (var w = 1; w <= 52; w++) inWeek[w] = fresh.some(function (v) { return stateAt(v, w) === "in"; });
    if (inWeek.slice(1).every(Boolean)) return "all year";
    var runs = [], w0 = 1;
    while (w0 <= 52 && inWeek[w0]) w0++;
    for (var k = 0, w1 = w0; k < 52; k++, w1 = w1 % 52 + 1) {
      if (inWeek[w1] && !inWeek[w1 === 1 ? 52 : w1 - 1]) runs.push([w1, w1]);
      if (inWeek[w1] && runs.length) runs[runs.length - 1][1] = w1;
    }
    return runs.map(function (r) {
      var a = MONTHS[midOfWeek({ week: r[0], years: 0 }, year).getMonth()];
      var b = MONTHS[midOfWeek({ week: r[1], years: 0 }, year).getMonth()];
      return a === b ? a : a + " to " + b;
    }).join(" and ");
  }

  // --- The weekly digest --------------------------------------------------
  // Foods in a list run A to Z by food, then by variety, so all the
  // potatoes sit together.
  function byFood(a, b) {
    var x = a.name + " " + a.variety, y = b.name + " " + b.variety;
    return x < y ? -1 : x > y ? 1 : 0;
  }
  // Which of Now's bands a food's verdict puts it in: arrived (YES, its
  // in-season run began within NEW_WEEKS), last (JUST), onway (NEARLY),
  // still (the rest of YES), store and glass (YES-ISH, from storage or a
  // glasshouse), or later (NO), which Now leaves out.
  function bandOf(r) {
    if (r.verdict === "YES") return !r.allYear && r.since < C.NEW_WEEKS ? "arrived" : "still";
    if (r.verdict === "JUST") return "last";
    if (r.verdict === "YES-ISH") return r.glass ? "glass" : "store";
    if (r.verdict === "NEARLY") return "onway";
    return "later";
  }
  // Soonest first, a boundary that never comes (all year, unsold) last.
  function soonest(a, b) {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  }

  // Six lists for one week, one per band of bandOf but later. Each list
  // is split by kind of food (veg, fruit, wild, herbs, fish, meat, in the
  // order of groups.yml) as [{kind, items}], kinds with nothing in them
  // left out. Within a kind, just arrived, great now, storage and
  // glasshouse run A to Z, and last chance and on the way by time left,
  // soonest first, names breaking ties. Each item is a whole food, with
  // its phrase and its timing. `today` defaults to the middle of the week
  // asked about.
  function nowLists(foods, groups, week, year, today) {
    today = today || midOfToday(week, year);
    var kindOf = {}, kinds = [];
    (groups || []).forEach(function (g) {
      kindOf[g.key] = g.kind;
      if (kinds.indexOf(g.kind) < 0) kinds.push(g.kind);
    });
    var buckets = { arrived: {}, last: {}, onway: {}, still: {}, store: {}, glass: {} };
    foods.forEach(function (f) {
      var fv = foodVerdict(f, week);
      var v = fv.whole;
      if (!v) return;
      var kind = kindOf[f.group] || "";
      if (kinds.indexOf(kind) < 0) kinds.push(kind);
      var t = timing(v, year, today);
      var item = {
        slug: f.slug, name: f.name, colour: f.colour, textShed: f.text_on_shed || "", textCustard: f.text_on_custard || "",
        group: f.group, kind: kind,
        variety: "", verdict: fv.verdict,
        line: phrase(v, year, today), since: v.since === undefined ? null : v.since,
        days: daysTo(v, year, today), when: t.when, aside: t.aside, whenDays: t.days
      };
      var list = bandOf(v);
      if (list !== "later") (buckets[list][kind] = buckets[list][kind] || []).push(item);
    });
    var byDays = function (a, b) { return soonest(a.days, b.days) || byFood(a, b); };
    var out = {};
    Object.keys(buckets).forEach(function (list) {
      out[list] = [];
      kinds.forEach(function (k) {
        var items = buckets[list][k];
        if (!items) return;
        items.sort(list === "last" || list === "onway" ? byDays : byFood);
        out[list].push({ kind: k, items: items });
      });
    });
    return out;
  }
  // One list's items in one array, kinds in order.
  function flatten(list) {
    return list.reduce(function (all, k) { return all.concat(k.items); }, []);
  }
  // One list's items in one array, A to Z by food, then variety.
  function azList(list) { return flatten(list).sort(byFood); }
  // One list's items grouped by their timing, [{phrase, items}], for a
  // list whose verdict is the same throughout (last chance, on the way):
  // the timing is all that tells its foods apart. The phrase is the
  // item's `when`; groups run soonest first, foods A to Z within a group.
  function byPhrase(list) {
    var groups = [], at = {};
    flatten(list).forEach(function (i) {
      if (!(i.when in at)) { at[i.when] = groups.length; groups.push({ phrase: i.when, days: i.whenDays, items: [] }); }
      var g = groups[at[i.when]];
      g.items.push(i);
      if (i.whenDays !== null && (g.days === null || i.whenDays < g.days)) g.days = i.whenDays;
    });
    groups.sort(function (a, b) {
      if (a.days === null || b.days === null) return (a.days === null) - (b.days === null);
      return a.days - b.days;
    });
    return groups.map(function (g) { return { phrase: g.phrase, items: g.items.sort(byFood) }; });
  }

  // --- Quotations ------------------------------------------------------------
  // Stable for a food for a week and different between foods: a small
  // hash of slug and week picks from the verdict's pool, preferring
  // lines pinned to the food. YES-ISH's pool is `yesish`.
  function pickQuote(quotes, verdict, slug, week) {
    var pool = (quotes && quotes[verdict.toLowerCase().replace("-", "")]) || [];
    var pinned = pool.filter(function (q) { return q.foods && q.foods.indexOf(slug) >= 0; });
    var general = pool.filter(function (q) { return !q.foods; });
    var from = pinned.length ? pinned : general;
    if (!from.length) return null;
    var h = week * 7919;
    for (var i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 1000003;
    return from[h % from.length];
  }

  return {
    C: C, RANK: RANK, MONTHS: MONTHS,
    weekOf: weekOf, ukToday: ukToday, startOfWeek: startOfWeek, endOfWeek: endOfWeek,
    dayOfYear: dayOfYear, nextWeek: nextWeek, prevWeek: prevWeek,
    stateAt: stateAt, varietyVerdict: varietyVerdict, foodVerdict: foodVerdict,
    timelineOf: timelineOf, ringOrder: ringOrder, isGlasshouse: isGlasshouse,
    fmtDate: fmtDate, fmtDateYear: fmtDateYear, fmtRange: fmtRange, ordinal: ordinal,
    datePieces: datePieces, dateHtml: dateHtml,
    startDate: startDate, endDate: endDate, midOfWeek: midOfWeek, midOfToday: midOfToday,
    phrase: phrase, dateLine: dateLine, daysTo: daysTo, bandOf: bandOf,
    timing: timing, varietyLabel: varietyLabel, varietySaid: varietySaid, foodSaid: foodSaid, seasonWords: seasonWords,
    nowLists: nowLists, flatten: flatten, azList: azList, byPhrase: byPhrase, pickQuote: pickQuote
  };
}));
