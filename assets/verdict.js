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
  var RANK = { YES: 4, JUST: 3, NEARLY: 2, NO: 1, NEVER: 0 };
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
  // A week's days, plain numbers and an en dash: "15–21 October", "29
  // October – 4 November", and the years only when it crosses one.
  function fmtRange(week, year) {
    var a = startOfWeek(week, year), b = endOfWeek(week, year);
    var day = function (d) { return d.getDate() + " " + MONTHS[d.getMonth()]; };
    if (a.getFullYear() !== b.getFullYear()) return day(a) + " " + a.getFullYear() + " – " + day(b) + " " + b.getFullYear();
    if (a.getMonth() === b.getMonth()) return a.getDate() + "–" + day(b);
    return day(a) + " – " + day(b);
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
  //   Coming in, by days to the first day of the first week:
  //     1 to 6 "any day now"; 7 to 13 "in a week or two"; 14 to 27 "in two
  //     or three weeks"; 28 to 62 "from early November"; beyond that the
  //     month alone, "in April", or "next October" when it is this month
  //     again.
  //   Going out, by days to the last day of the last week:
  //     0 to 6 "for a few more days"; 7 to 13 "for another week or two";
  //     14 to 27 "for another two or three weeks"; 28 on "until late
  //     December".
  // Early is the 1st to the 10th, mid the 11th to the 20th, late the rest.
  // The one calendar date on the site is the "as of" date, which is when
  // an answer was true, not a season estimate.
  function midOfWeek(at, year) {
    var d = startDate(at, year);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3);
  }
  function monthPart(d) {
    var day = d.getDate();
    return (day <= 10 ? "early " : day <= 20 ? "mid " : "late ") + MONTHS[d.getMonth()];
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  // The middle of the week `today` falls in, for a week with no real
  // today: the digest for another week.
  function midOfToday(week, year) { return midOfWeek({ week: week, years: 0 }, year); }

  // How a start is said: `soon` follows "First ones" or stands alone,
  // `within` follows "Properly in", `back` follows a NO. All lower-case.
  function arriving(at, year, today) {
    var days = daysBetween(today, startDate(at, year));
    var mid = midOfWeek(at, year), month = MONTHS[mid.getMonth()];
    if (days <= 6) return { soon: "any day now", within: "any day now", back: "any day now" };
    if (days <= 13) return { soon: "in a week or two", within: "within a week or two", back: "in a week or two" };
    if (days <= 27) return { soon: "in two or three weeks", within: "within two or three weeks", back: "in two or three weeks" };
    if (days <= 62) {
      var part = "from " + monthPart(mid);
      return { soon: part, within: part, back: part };
    }
    var far = mid.getMonth() === today.getMonth() ? "next " + month : "in " + month;
    return { soon: far, within: "from " + month, back: "back " + far, farOff: true };
  }
  // How an end is said, lower-case: "for a few more days", "until late
  // December".
  function leaving(at, year, today) {
    var days = daysBetween(today, endDate(at, year));
    if (days <= 6) return "for a few more days";
    if (days <= 13) return "for another week or two";
    if (days <= 27) return "for another two or three weeks";
    return "until " + monthPart(midOfWeek(at, year));
  }
  // "First ones in April, properly in May." When both halves would say
  // the same thing the month is split into parts, and if they still agree
  // only the first-ones phrase is kept.
  function firstOnes(r, year, today) {
    var a = arriving(r.from, year, today), b = arriving(r.inFrom, year, today);
    var sa = a.soon, sb = b.soon;
    if (sa === sb && a.farOff) {
      sa = "in " + monthPart(midOfWeek(r.from, year));
      sb = "in " + monthPart(midOfWeek(r.inFrom, year));
    }
    if (sa === sb) return cap(sa);
    return "First ones " + sa + ", properly " + sb;
  }

  // The phrase for one variety's verdict, without its full stop: the date
  // line on a food page, the line under a food in a list. `year` is the
  // year of the week asked about and `today` the day the question is
  // asked on; a digest for another week passes the middle of that week.
  function phrase(r, year, today) {
    switch (r.verdict) {
      case "YES":
        if (r.allYear) return "All year";
        return cap(leaving(r.until, year, today));
      case "JUST":
        return cap(leaving(r.until, year, today));
      case "NEARLY":
        if (r.state === "avail") return "Properly in " + arriving(r.from, year, today).within;
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
  var shortLine = phrase;

  // Days from today to the boundary the phrase is about: the end for YES
  // and JUST, the start for NEARLY and NO; null for all year and never.
  // Lists sort by it.
  function daysTo(r, year, today) {
    if (r.allYear || r.never) return null;
    if (r.verdict === "YES" || r.verdict === "JUST") return daysBetween(today, endDate(r.until, year));
    if (r.from) return daysBetween(today, startDate(r.from, year));
    return null;
  }

  // The variety line for a food with more than one variety: the variety
  // that gave the verdict, then the others in a phrase each.
  // "Maincrop, yes. New: first ones in May, properly in June."
  function varietyLine(food, fv, year, today) {
    if (!fv.variety || food.varieties.length < 2) return "";
    var others = fv.varieties.filter(function (r) { return r !== fv.variety; });
    var head = (fv.variety.name || food.name) + ", " + fv.verdict.toLowerCase() + ".";
    var rest = others.map(function (r) {
      var s = phrase(r, year, today);
      return (r.name || food.name) + ": " + s.charAt(0).toLowerCase() + s.slice(1) + ".";
    });
    return [head].concat(rest).join(" ");
  }

  // --- The weekly digest --------------------------------------------------
  // Four lists for one week: arrived (YES, in-season run began within
  // NEW_WEEKS), last (chance: JUST), onway (NEARLY), still (great now:
  // the rest of YES). Each list is split by kind of food (veg, fruit,
  // wild, herbs, fish, meat, in the order of groups.yml) as [{kind,
  // items}], kinds with nothing in them left out. Within a kind, just
  // arrived is newest first, and the others go by time left: the soonest
  // to end or to arrive first, all-year foods last, names breaking ties.
  // Each item names the variety that produced the verdict and carries
  // its phrase. `today` defaults to the middle of the week asked about.
  function nowLists(foods, groups, week, year, today) {
    today = today || midOfToday(week, year);
    var kindOf = {}, kinds = [];
    (groups || []).forEach(function (g) {
      kindOf[g.key] = g.kind;
      if (kinds.indexOf(g.kind) < 0) kinds.push(g.kind);
    });
    var buckets = { arrived: {}, last: {}, onway: {}, still: {} };
    foods.forEach(function (f) {
      var fv = foodVerdict(f, week);
      var v = fv.variety;
      if (!v) return;
      var kind = kindOf[f.group] || "";
      if (kinds.indexOf(kind) < 0) kinds.push(kind);
      var item = {
        slug: f.slug, name: f.name, colour: f.colour, group: f.group, kind: kind,
        variety: v.name || "", verdict: fv.verdict,
        line: phrase(v, year, today), since: v.since === undefined ? null : v.since,
        days: daysTo(v, year, today)
      };
      var list = null;
      if (fv.verdict === "YES" && !v.allYear && v.since < C.NEW_WEEKS) list = "arrived";
      else if (fv.verdict === "YES") list = "still";
      else if (fv.verdict === "JUST") list = "last";
      else if (fv.verdict === "NEARLY") list = "onway";
      if (list) (buckets[list][kind] = buckets[list][kind] || []).push(item);
    });
    var byName = function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; };
    var byDays = function (a, b) {
      if (a.days === null && b.days === null) return byName(a, b);
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return (a.days - b.days) || byName(a, b);
    };
    var newest = function (a, b) { return (a.since - b.since) || byDays(a, b); };
    var out = {};
    Object.keys(buckets).forEach(function (list) {
      out[list] = [];
      kinds.forEach(function (k) {
        var items = buckets[list][k];
        if (!items) return;
        items.sort(list === "arrived" ? newest : byDays);
        out[list].push({ kind: k, items: items });
      });
    });
    return out;
  }
  // One list's items in one array, kinds in order.
  function flatten(list) {
    return list.reduce(function (all, k) { return all.concat(k.items); }, []);
  }
  // One list's items grouped under their phrase, [{phrase, items}], for a
  // list whose verdict is the same throughout (last chance, on the way):
  // the phrase is all that tells its foods apart. Groups run soonest
  // first, foods A to Z within a group.
  function byPhrase(list) {
    var groups = [], at = {};
    flatten(list).forEach(function (i) {
      if (!(i.line in at)) { at[i.line] = groups.length; groups.push({ phrase: i.line, days: i.days, items: [] }); }
      var g = groups[at[i.line]];
      g.items.push(i);
      if (i.days !== null && (g.days === null || i.days < g.days)) g.days = i.days;
    });
    var byName = function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; };
    groups.sort(function (a, b) {
      if (a.days === null || b.days === null) return (a.days === null) - (b.days === null);
      return a.days - b.days;
    });
    return groups.map(function (g) { return { phrase: g.phrase, items: g.items.sort(byName) }; });
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
    startDate: startDate, endDate: endDate, midOfWeek: midOfWeek, midOfToday: midOfToday,
    phrase: phrase, dateLine: dateLine, shortLine: shortLine, varietyLine: varietyLine, daysTo: daysTo,
    nowLists: nowLists, flatten: flatten, byPhrase: byPhrase, pickQuote: pickQuote
  };
}));
