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
  // RELATIVE_WEEKS: a date this near also gets a relative form.
  var C = {
    NEARLY_WEEKS: 3,
    JUST_WEEKS: 2,
    NEW_WEEKS: 2,
    ISOLATED_AVAIL: "JUST",
    RELATIVE_WEEKS: 6
  };
  var RANK = { YES: 4, JUST: 3, NEARLY: 2, NO: 1, NEVER: 0 };
  var MS_PER_DAY = 86400000;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  var SMALL = ["no", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "eleven", "twelve"];

  // --- The week grid --------------------------------------------------------

  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  // Rounded, not floored: a local-time difference across a clock change is
  // an hour short of whole days.
  function dayOfYear(d) {
    return Math.round((midnight(d) - new Date(d.getFullYear(), 0, 1)) / MS_PER_DAY) + 1;
  }
  function weekOf(d) { return Math.min(52, Math.floor((dayOfYear(d) - 1) / 7) + 1); }
  function startOfWeek(week, year) { return new Date(year, 0, 1 + (week - 1) * 7); }
  function endOfWeek(week, year) {
    return week === 52 ? new Date(year, 11, 31) : new Date(year, 0, (week - 1) * 7 + 7);
  }
  function nextWeek(w) { return w === 52 ? 1 : w + 1; }
  function prevWeek(w) { return w === 1 ? 52 : w - 1; }
  function daysBetween(a, b) { return Math.round((midnight(b) - midnight(a)) / MS_PER_DAY); }

  // --- Reading a variety ----------------------------------------------------

  // "in", "avail" or "" for one week; "in" wins where runs overlap.
  function stateAt(variety, week) {
    var best = "";
    for (var i = 0; i < variety.weeks.length; i++) {
      var r = variety.weeks[i];
      if (week >= r[0] && week <= r[1]) {
        if (r[2] === "in") return "in";
        best = "avail";
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
  function varietyVerdict(variety, week) {
    var s = stateAt(variety, week);
    var r = { state: s };
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
  // The best variety's verdict, YES > JUST > NEARLY > NO. Between two
  // NEARLY or NO varieties the sooner wins; otherwise data order.
  function foodVerdict(food, week) {
    if (food.never) return { verdict: "NEVER", variety: null, varieties: [] };
    var results = food.varieties.map(function (v) {
      var r = varietyVerdict(v, week);
      r.name = v.name || "";
      r.colour = v.colour || food.colour;
      return r;
    });
    var best = null;
    results.forEach(function (r) {
      if (!best) { best = r; return; }
      var a = RANK[r.verdict], b = RANK[best.verdict];
      if (a > b) best = r;
      else if (a === b && (r.verdict === "NEARLY" || r.verdict === "NO") &&
        r.weeksUntil < best.weeksUntil) best = r;
    });
    return { verdict: best.verdict, variety: best, varieties: results };
  }

  // --- Dates in words -------------------------------------------------------

  function ordinal(n) {
    var s = n % 100;
    if (s >= 11 && s <= 13) return n + "th";
    switch (n % 10) {
      case 1: return n + "st";
      case 2: return n + "nd";
      case 3: return n + "rd";
      default: return n + "th";
    }
  }
  function fmtDate(d) { return ordinal(d.getDate()) + " " + MONTHS[d.getMonth()]; }
  function fmtDateYear(d) { return fmtDate(d) + " " + d.getFullYear(); }
  function fmtRange(week, year) {
    var a = startOfWeek(week, year), b = endOfWeek(week, year);
    if (a.getMonth() === b.getMonth()) return ordinal(a.getDate()) + " to " + fmtDate(b);
    return fmtDate(a) + " to " + fmtDate(b);
  }
  function words(n) { return n >= 0 && n < SMALL.length ? SMALL[n] : String(n); }
  function weeksWord(n) { return n === 1 ? "a week" : words(n) + " weeks"; }

  // The date a {week, years} stands for, given the reference year.
  function startDate(at, year) { return startOfWeek(at.week, year + at.years); }
  function endDate(at, year) { return endOfWeek(at.week, year + at.years); }

  // "in about two weeks", "in four days", "tomorrow"; null beyond
  // RELATIVE_WEEKS. Weeks from a week out, because the data is weekly and
  // a day count would claim more than it knows.
  function relativeFrom(today, date) {
    var days = daysBetween(today, date);
    if (days > C.RELATIVE_WEEKS * 7 || days < 0) return null;
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    if (days < 7) return "in " + words(days) + " days";
    return "in about " + weeksWord(Math.round(days / 7));
  }
  // "about two weeks left", "four days left", "last day tomorrow".
  function relativeUntil(today, date) {
    var days = daysBetween(today, date);
    if (days > C.RELATIVE_WEEKS * 7 || days < 0) return null;
    if (days === 0) return "last day today";
    if (days === 1) return "last day tomorrow";
    if (days < 7) return words(days) + " days left";
    return "about " + weeksWord(Math.round(days / 7)) + " left";
  }

  // The date line under a verdict, per the scope's table. `year` is the
  // year of the week asked about; `today`, when given and in that week,
  // adds the relative form for near dates.
  function dateLine(r, year, today) {
    var line, rel = null;
    switch (r.verdict) {
      case "YES":
        if (r.allYear) return "All year.";
        line = "Until about " + fmtDate(endDate(r.until, year)) + ".";
        return line;
      case "JUST":
        line = "Until about " + fmtDate(endDate(r.until, year));
        if (today) rel = relativeUntil(today, endDate(r.until, year));
        return line + (rel ? ", " + rel : "") + ".";
      case "NEARLY":
        if (r.state === "avail") {
          line = "Around already. Properly in from about " + fmtDate(startDate(r.from, year));
        } else if (r.inFrom && r.inFrom.week !== r.from.week) {
          line = "First arrivals about " + fmtDate(startDate(r.from, year)) +
            ", properly in from about " + fmtDate(startDate(r.inFrom, year));
        } else {
          line = "From about " + fmtDate(startDate(r.from, year));
        }
        if (today) rel = relativeFrom(today, startDate(r.from, year));
        return line + (rel ? ", " + rel : "") + ".";
      case "NO":
        if (r.never) return "Never, on this data. Check the data.";
        line = "Back about " + fmtDate(startDate(r.from, year));
        if (r.inFrom && r.inFrom.week !== r.from.week) {
          line += ", properly in from about " + fmtDate(startDate(r.inFrom, year));
        }
        return line + ".";
      default:
        return "";
    }
  }

  // A short phrase for one variety in a list: "in until about 2nd
  // December", "back about 30th April".
  function shortLine(r, year) {
    switch (r.verdict) {
      case "YES": return r.allYear ? "in all year" : "in until about " + fmtDate(endDate(r.until, year));
      case "JUST": return "going out, until about " + fmtDate(endDate(r.until, year));
      case "NEARLY": return "from about " + fmtDate(startDate(r.from, year));
      case "NO": return r.never ? "never" : "back about " + fmtDate(startDate(r.from, year));
      default: return "";
    }
  }

  // The variety line for a food with more than one variety: the variety
  // that gave the verdict, then the others in a phrase each.
  // "Maincrop, yes. New: back about 30th April."
  function varietyLine(food, fv, year) {
    if (!fv.variety || food.varieties.length < 2) return "";
    var others = fv.varieties.filter(function (r) { return r !== fv.variety; });
    var head = (fv.variety.name || food.name) + ", " + fv.verdict.toLowerCase() + ".";
    var rest = others.map(function (r) { return (r.name || food.name) + ": " + shortLine(r, year) + "."; });
    return [head].concat(rest).join(" ");
  }

  // --- The weekly digest --------------------------------------------------
  // Four lists for one week: just arrived (YES, in-season run began within
  // NEW_WEEKS), last chance (JUST), on the way (NEARLY), still good (the
  // rest of YES, grouped by kind). Each item names the variety that
  // produced the verdict and carries the short date phrase.
  function nowLists(foods, groups, week, year) {
    var kindOf = {}, kinds = [], kindName = {};
    (groups || []).forEach(function (g) {
      kindOf[g.key] = g.kind;
      if (kinds.indexOf(g.kind) < 0) { kinds.push(g.kind); kindName[g.kind] = g.kind; }
    });
    var out = { arrived: [], last: [], onway: [], still: [] };
    var stillByKind = {};
    foods.forEach(function (f) {
      var fv = foodVerdict(f, week);
      var v = fv.variety;
      if (!v) return;
      var item = {
        slug: f.slug, name: f.name, colour: f.colour, group: f.group,
        variety: v.name || "", verdict: fv.verdict,
        line: shortLine(v, year), since: v.since, weeksUntil: v.weeksUntil,
        untilWeek: v.until ? (v.until.week - week + 52) % 52 : null
      };
      if (fv.verdict === "YES" && !v.allYear && v.since < C.NEW_WEEKS) out.arrived.push(item);
      else if (fv.verdict === "YES") (stillByKind[kindOf[f.group]] = stillByKind[kindOf[f.group]] || []).push(item);
      else if (fv.verdict === "JUST") out.last.push(item);
      else if (fv.verdict === "NEARLY") out.onway.push(item);
    });
    var byName = function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; };
    out.arrived.sort(function (a, b) { return (a.since - b.since) || byName(a, b); });
    out.last.sort(function (a, b) { return (a.untilWeek - b.untilWeek) || byName(a, b); });
    out.onway.sort(function (a, b) { return (a.weeksUntil - b.weeksUntil) || byName(a, b); });
    kinds.forEach(function (k) {
      if (!stillByKind[k]) return;
      out.still.push({ kind: k, items: stillByKind[k].sort(byName) });
    });
    return out;
  }

  // --- Quotations ------------------------------------------------------------
  // Stable for a food for a week and different between foods: a small
  // hash of slug and week picks from the verdict's pool, preferring
  // lines pinned to the food.
  function pickQuote(quotes, verdict, slug, week) {
    var pool = (quotes && quotes[verdict.toLowerCase()]) || [];
    var pinned = pool.filter(function (q) { return q.foods && q.foods.indexOf(slug) >= 0; });
    var general = pool.filter(function (q) { return !q.foods; });
    var from = pinned.length ? pinned : general;
    if (!from.length) return null;
    var h = week * 7919;
    for (var i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 1000003;
    return from[h % from.length];
  }

  return {
    C: C, RANK: RANK,
    weekOf: weekOf, startOfWeek: startOfWeek, endOfWeek: endOfWeek,
    dayOfYear: dayOfYear, nextWeek: nextWeek, prevWeek: prevWeek,
    stateAt: stateAt, varietyVerdict: varietyVerdict, foodVerdict: foodVerdict,
    ordinal: ordinal, fmtDate: fmtDate, fmtDateYear: fmtDateYear, fmtRange: fmtRange,
    startDate: startDate, endDate: endDate,
    dateLine: dateLine, shortLine: shortLine, varietyLine: varietyLine,
    nowLists: nowLists, pickQuote: pickQuote
  };
}));
