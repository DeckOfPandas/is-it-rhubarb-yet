// Everything date-dependent on the site happens here, in the visitor's
// browser: the build cannot know what "today" is. No dependencies.
//
// Weeks: week 1 starts on 1 January; each week starts 7 days after the
// last; week 52 absorbs the final day or two. tools/make-foods.py and the
// Liquid templates use the same grid.

(function () {
  "use strict";

  var MS_PER_DAY = 86400000;

  function startOfYear(d) { return new Date(d.getFullYear(), 0, 1); }

  function weekOf(d) {
    var doy = Math.floor((d - startOfYear(d)) / MS_PER_DAY) + 1;
    return Math.min(52, Math.floor((doy - 1) / 7) + 1);
  }

  function dateOfWeek(week, year) {
    return new Date(year, 0, 1 + (week - 1) * 7);
  }

  function fmt(d) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  }

  function fmtRange(week, year) {
    var a = dateOfWeek(week, year);
    var b = week === 52 ? new Date(year, 11, 31) : new Date(a.getTime() + 6 * MS_PER_DAY);
    return fmt(a) + " to " + fmt(b);
  }

  // State of one variety in a given week: "in", "avail" or "".
  function stateAt(variety, week) {
    var best = "";
    variety.weeks.forEach(function (r) {
      if (week >= r[0] && week <= r[1]) {
        if (r[2] === "in") best = "in";
        else if (best === "") best = "avail";
      }
    });
    return best;
  }

  // Next week at or after `week` (wrapping into next year) in which any
  // variety is fully in season. Returns {week, variety, yearsAhead}.
  function nextIn(food, week) {
    for (var step = 0; step < 52; step++) {
      var w = ((week - 1 + step) % 52) + 1;
      for (var i = 0; i < food.varieties.length; i++) {
        if (stateAt(food.varieties[i], w) === "in") {
          return { week: w, variety: food.varieties[i], yearsAhead: (week - 1 + step) >= 52 ? 1 : 0 };
        }
      }
    }
    return null;
  }

  function lastWeekOfRun(variety, week) {
    var w = week;
    while (w < 52 && stateAt(variety, w + 1) === "in") w++;
    return w;
  }

  // --- Calendar and mini charts: the "today" line --------------------------
  function markToday(svg, week) {
    var line = svg.querySelector(".today");
    if (!line) return;
    var x0 = parseFloat(svg.dataset.x0), cw = parseFloat(svg.dataset.cw);
    var x = x0 + (week - 1) * cw + cw / 2;
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    line.removeAttribute("hidden");
  }

  // --- This week ------------------------------------------------------------
  function showWeek(week, year) {
    document.querySelectorAll("section.week").forEach(function (s) {
      s.hidden = parseInt(s.dataset.week, 10) !== week;
    });
    var title = document.getElementById("week-title");
    var dates = document.getElementById("week-dates");
    var thisWeek = weekOf(new Date());
    title.textContent = week === thisWeek ? "this week" : "in week " + week;
    dates.textContent = "Week " + week + ": " + fmtRange(week, year);
    var url = new URL(location.href);
    if (week === thisWeek) url.searchParams.delete("week"); else url.searchParams.set("week", week);
    history.replaceState(null, "", url);
  }

  function initNow() {
    var controls = document.querySelector(".controls");
    if (!controls) return;
    var year = new Date().getFullYear();
    var param = parseInt(new URL(location.href).searchParams.get("week"), 10);
    var week = (param >= 1 && param <= 52) ? param : weekOf(new Date());
    controls.hidden = false;
    document.getElementById("prev-week").addEventListener("click", function () {
      week = week === 1 ? 52 : week - 1; showWeek(week, year);
    });
    document.getElementById("next-week").addEventListener("click", function () {
      week = week === 52 ? 1 : week + 1; showWeek(week, year);
    });
    showWeek(week, year);
  }

  // --- Is it X yet? ---------------------------------------------------------
  function initFood() {
    var article = document.querySelector("article.food");
    if (!article) return;
    var food = JSON.parse(article.dataset.food);
    var today = new Date();
    var week = weekOf(today), year = today.getFullYear();
    var answer = document.getElementById("answer");

    var inNow = null, nearly = null;
    food.varieties.forEach(function (v) {
      var s = stateAt(v, week);
      if (s === "in" && !inNow) inNow = v;
      if (s === "avail" && !nearly) nearly = v;
    });

    var text;
    if (inNow) {
      var until = lastWeekOfRun(inNow, week);
      text = "Yes." + (inNow.name ? " " + inNow.name + " is in." : "") +
        " Until week " + until + " (" + fmt(dateOfWeek(until, year)) + ").";
    } else {
      var next = nextIn(food, week);
      if (nearly) {
        text = "Nearly." + (next ? " Properly in from week " + next.week +
          " (" + fmt(dateOfWeek(next.week, year + next.yearsAhead)) + ")." : "");
      } else if (next) {
        text = "No. Come back in week " + next.week + " (" +
          fmt(dateOfWeek(next.week, year + next.yearsAhead)) +
          (next.variety.name ? ", for " + next.variety.name.toLowerCase() : "") + ").";
      } else {
        text = "No, and the data has no season for it at all.";
      }
    }
    answer.textContent = text;
    answer.classList.add(inNow ? "yes" : nearly ? "nearly" : "no");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var week = weekOf(new Date());
    document.querySelectorAll("svg[data-x0]").forEach(function (svg) { markToday(svg, week); });
    initNow();
    initFood();
  });
})();
