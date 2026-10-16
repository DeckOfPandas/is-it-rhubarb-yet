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

  // Last week of the in-season run that `week` sits in, following it over
  // the year end if need be. Returns {week, yearsAhead, allYear}.
  function lastWeekOfRun(variety, week) {
    var w = week, years = 0, steps = 0;
    while (steps < 51) {
      var next = w === 52 ? 1 : w + 1;
      if (stateAt(variety, next) !== "in") break;
      if (next === 1) years = 1;
      w = next; steps++;
    }
    return { week: w, yearsAhead: years, allYear: steps === 51 };
  }

  // Is a "just about" week on the way out of a season (true) or into one
  // (false)? Out if the week's range follows an in-season range directly;
  // year ends count as adjacent. Dips between two seasons count as in.
  function goingOut(variety, week) {
    var range = null;
    variety.weeks.forEach(function (r) {
      if (r[2] === "avail" && week >= r[0] && week <= r[1]) range = r;
    });
    if (!range) return false;
    var before = range[0] === 1 ? 52 : range[0] - 1;
    var after = range[1] === 52 ? 1 : range[1] + 1;
    var follows = false, precedes = false;
    variety.weeks.forEach(function (o) {
      if (o[2] !== "in") return;
      if (o[1] === before) follows = true;
      if (o[0] === after) precedes = true;
    });
    return follows && !precedes;
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

  // --- Season wheels: the hand and the date in the hole --------------------
  // The wheel's dashes put week w at (w-1)*7 of 364 day units, so the hand
  // uses the same scale rather than the true length of the year.
  function markWheel(figure, today) {
    var hand = figure.querySelector(".hand");
    var label = figure.querySelector(".today-label");
    var doy = Math.floor((today - startOfYear(today)) / MS_PER_DAY);
    var deg = Math.min(doy, 364) / 364 * 360;
    if (label) {
      label.querySelector(".date").textContent = fmt(today);
      label.removeAttribute("hidden");
    }
    if (!hand) return;
    hand.getBoundingClientRect();
    requestAnimationFrame(function () {
      hand.style.transform = "rotate(" + deg.toFixed(2) + "deg)";
      hand.classList.add("on");
    });
  }

  // --- Switches: remember a radio group's choice under its data-remember
  // key. The theme switch also sets data-theme on <html>; "auto" clears it
  // so the system preference shows through.
  function initSwitches() {
    document.querySelectorAll(".switch[data-remember]").forEach(function (box) {
      var key = box.dataset.remember;
      var saved = null;
      try { saved = localStorage.getItem(key); } catch (e) {}
      var radios = box.querySelectorAll("input[type=radio]");
      radios.forEach(function (r) {
        if (saved !== null && r.value === saved) r.checked = true;
        r.addEventListener("change", function () {
          if (!r.checked) return;
          try { localStorage.setItem(key, r.value); } catch (e) {}
          if (key === "theme") {
            if (r.value === "auto") delete document.documentElement.dataset.theme;
            else document.documentElement.dataset.theme = r.value;
          }
        });
      });
    });
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
  // One giant word, then a quotation to match it. The practical line
  // (dates, variety) goes under "Fine, show me the data".
  //
  // The quotation is stable for a food for a week and differs between
  // foods: a small hash of slug and week picks from the verdict's pool,
  // preferring quotations pinned to the food.
  function pickQuote(quotes, verdict, slug, week) {
    var pool = (quotes && quotes[verdict]) || [];
    var pinned = pool.filter(function (q) { return q.foods && q.foods.indexOf(slug) >= 0; });
    var general = pool.filter(function (q) { return !q.foods; });
    var from = pinned.length ? pinned : general;
    if (!from.length) return null;
    var h = week * 7919;
    for (var i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 1000003;
    return from[h % from.length];
  }

  function showQuote(el, q) {
    el.textContent = "";
    var lines = q.text.split(" / ");
    lines.forEach(function (line, i) {
      if (i) el.appendChild(document.createElement("br"));
      el.appendChild(document.createTextNode(line));
    });
    var cite = document.createElement("cite");
    cite.textContent = q.by;
    el.appendChild(cite);
  }

  function initFood() {
    var article = document.querySelector("article.food");
    if (!article) return;
    var food = JSON.parse(article.dataset.food);
    var quotes = JSON.parse(article.dataset.quotes || "null");
    var today = new Date();
    var week = weekOf(today), year = today.getFullYear();
    var verdict = document.getElementById("verdict");
    var answer = document.getElementById("answer");
    var when = document.getElementById("when");

    var inNow = null, nearly = null;
    food.varieties.forEach(function (v) {
      var s = stateAt(v, week);
      if (s === "in" && !inNow) inNow = v;
      if (s === "avail" && !nearly) nearly = v;
    });

    // The page takes the colour of the variety the verdict is about.
    var word, key, line, cls, about = null;
    if (inNow) {
      var until = lastWeekOfRun(inNow, week);
      about = inNow;
      word = "YES."; key = "yes"; cls = "yes";
      line = (inNow.name ? inNow.name + ". " : "") +
        (until.allYear ? "All year round." :
          "Until " + fmt(dateOfWeek(until.week + 1, year + until.yearsAhead)) + ".");
    } else {
      var next = nextIn(food, week);
      about = nearly || (next && next.variety);
      if (nearly && goingOut(nearly, week)) {
        word = "JUST."; key = "just"; cls = "nearly";
        line = "On its way out.";
      } else if (nearly) {
        word = "NEARLY."; key = "nearly"; cls = "nearly";
        line = next ? "Properly in from " + fmt(dateOfWeek(next.week, year + next.yearsAhead)) + "." : "";
      } else if (next) {
        word = "NO."; key = "no"; cls = "no";
        line = "Back in week " + next.week + ", from " +
          fmt(dateOfWeek(next.week, year + next.yearsAhead)) +
          (next.variety.name ? ", for " + next.variety.name.toLowerCase() : "") + ".";
      } else {
        word = "NO."; key = "no"; cls = "no";
        line = "Never, apparently. Check the data.";
      }
    }
    if (about && about.colour) article.style.setProperty("--c", about.colour);
    verdict.textContent = word;
    verdict.classList.add(cls);
    verdict.hidden = false;
    answer.classList.add(cls);
    var q = pickQuote(quotes, key, food.slug, week);
    if (q) { showQuote(answer, q); answer.classList.add("quote"); }
    else answer.textContent = line;
    if (when) { when.textContent = line; when.hidden = false; }
  }

  // --- The search box: "Is it … yet?" in the header -------------------------
  // The form is a plain GET to the ask index with q=; this adds a dropdown
  // over foods, varieties and families, fed from the JSON API on first
  // focus. On the ask index itself the list is filtered in place instead.
  //
  // Matching is prefix only, whole words only: every word typed must begin
  // a whole word of the candidate. No substring fallback. Accents are
  // folded one character at a time so a hit found in the folded text can
  // be marked on the real one.
  var MIN_CHARS = 2, FOOD_CAP = 8, OTHER_CAP = 5;

  function foldChar(ch) {
    var f = ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    f = f.replace(/[-&,.()]/g, " ");
    return f.length ? f.charAt(0) : ch;
  }
  function fold(s) {
    var out = "";
    s = String(s == null ? "" : s);
    for (var i = 0; i < s.length; i++) out += foldChar(s.charAt(i));
    return out;
  }
  function words(s) { return s.split(/\s+/).filter(Boolean); }
  function foldQuery(q) { return words(fold(q)).join(" "); }

  // 1: starts with the whole query; 2: every query word begins a word; 0: no.
  function tierOf(folded, query) {
    if (folded.indexOf(query) === 0) return 1;
    var cw = words(folded), qw = words(query);
    if (qw.length && qw.every(function (q) { return cw.some(function (c) { return c.indexOf(q) === 0; }); })) return 2;
    return 0;
  }

  // Where to mark the hit: the run beginning a word when there is one,
  // else the first query word at a word start.
  function hitOf(folded, query) {
    var at = -1, parts = folded.split(/(\s+)/), pos = 0, i;
    for (i = 0; i < parts.length && at < 0; i++) {
      if (i % 2 === 0 && parts[i].indexOf(query) === 0) at = pos;
      pos += parts[i].length;
    }
    if (at >= 0) return [at, at + query.length];
    var first = words(query)[0]; pos = 0;
    for (i = 0; i < parts.length; i++) {
      if (i % 2 === 0 && parts[i].indexOf(first) === 0) return [pos, pos + first.length];
      pos += parts[i].length;
    }
    return null;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function labelNode(label, hit) {
    var frag = document.createDocumentFragment();
    if (!hit) { frag.appendChild(document.createTextNode(label)); return frag; }
    if (hit[0] > 0) frag.appendChild(document.createTextNode(label.slice(0, hit[0])));
    frag.appendChild(el("span", "search-hit", label.slice(hit[0], hit[1])));
    if (hit[1] < label.length) frag.appendChild(document.createTextNode(label.slice(hit[1])));
    return frag;
  }

  // Candidates from the data: a food by its name, a named variety as it is
  // said in full (its `said`, else its name then the food's: "Bramley
  // apples"), a family by its name.
  function buildIndex(foods, groups, askUrl) {
    var items = { food: [], variety: [], family: [] };
    foods.forEach(function (f) {
      var href = askUrl + f.slug + "/";
      items.food.push({ label: f.name, folded: fold(f.name), href: href, slug: f.slug });
      (f.varieties || []).forEach(function (v) {
        if (!v.name) return;
        var said = v.said || (v.name + " " + f.name.toLowerCase());
        items.variety.push({ label: said, folded: fold(said), href: href });
      });
    });
    (groups || []).forEach(function (g) {
      items.family.push({ label: g.name, folded: fold(g.name), href: askUrl + "#" + g.key });
    });
    return items;
  }

  function search(index, raw, askUrl) {
    var typed = String(raw || "").trim();
    if (typed.length < MIN_CHARS) return null;
    var query = foldQuery(typed);
    if (!query) return null;
    var out = [];
    [["food", "Foods", FOOD_CAP], ["variety", "Varieties", OTHER_CAP], ["family", "Families", OTHER_CAP]].forEach(function (g) {
      var tiers = [[], [], []];
      index[g[0]].forEach(function (it) { var t = tierOf(it.folded, query); if (t) tiers[t].push(it); });
      var found = tiers[1].concat(tiers[2]);
      if (!found.length) return;
      out.push({
        kind: g[0], label: g[1], total: found.length, hidden: Math.max(0, found.length - g[2]),
        results: found.slice(0, g[2]).map(function (it) {
          return { label: it.label, href: it.href, hit: hitOf(it.folded, query) };
        })
      });
    });
    return { query: typed, groups: out, all: askUrl + "?q=" + encodeURIComponent(typed) };
  }

  // --- The ask index --------------------------------------------------------
  // Narrowed two ways at once: by the words in the header box (or ?q=),
  // and by the state switch at the top (in season, going out, perfect
  // now, coming in; "" is all), which needs this week's season data,
  // fetched from the JSON API.
  // A family heading goes when nothing is left under it. The note says
  // what is showing and offers the whole list back.
  var ask = null;

  // A food's state this week: "in" if any variety is in season, else the
  // direction of the first "just about" variety, else "".
  function stateOfFood(food, week) {
    var best = "";
    food.varieties.forEach(function (v) {
      var s = stateAt(v, week);
      if (s === "in") best = "in";
      else if (s === "avail" && best === "") best = goingOut(v, week) ? "out" : "coming";
    });
    return best;
  }

  function initAsk() {
    var lists = document.querySelectorAll(".ask-list");
    if (!lists.length) return;
    var note = document.getElementById("filter-note");
    var form = document.querySelector("form.search");
    var input = form ? form.querySelector(".search-input") : null;
    var askUrl = form ? form.dataset.ask : location.pathname;
    var box = document.getElementById("ask-state");
    var url = new URL(location.href);
    var query = url.searchParams.get("q") || "";
    var state = url.searchParams.get("state") || "";
    var states = null;
    var SAID = { any: "in season", out: "going out", in: "perfect now", coming: "coming in" };

    if (input && query) input.value = query;
    function showState() {
      if (!box) return;
      if (!box.querySelector('input[value="' + state + '"]')) state = "";
      box.querySelectorAll("input").forEach(function (r) { r.checked = r.value === state; });
    }
    showState();

    function apply() {
      var q = foldQuery(query), shown = 0, total = 0;
      var byState = !!(state && states);
      lists.forEach(function (list) {
        var any = false;
        list.querySelectorAll("li").forEach(function (li) {
          total++;
          var hide = q.length >= MIN_CHARS &&
            !tierOf(fold(li.dataset.name + " " + (li.dataset.varieties || "")), q);
          var s = byState ? states[li.dataset.slug] : "";
          if (byState && (state === "any" ? !s : s !== state)) hide = true;
          li.hidden = hide;
          if (!hide) { any = true; shown++; }
        });
        list.hidden = !any;
        var heading = document.getElementById(list.dataset.group);
        if (heading) heading.hidden = !any;
      });
      url = new URL(location.href);
      if (query.trim()) url.searchParams.set("q", query.trim()); else url.searchParams.delete("q");
      if (state) url.searchParams.set("state", state); else url.searchParams.delete("state");
      history.replaceState(null, "", url);
      if (!note) return;
      var what = [];
      if (byState) what.push(SAID[state]);
      if (q.length >= MIN_CHARS) what.push("for “" + query.trim() + "”");
      if (!what.length) { note.hidden = true; return; }
      note.textContent = "";
      note.appendChild(document.createTextNode(
        (shown ? shown + " of " + total : "Nothing") + " " + what.join(", ") + ". "));
      var all = el("a", null, "See all");
      all.href = askUrl;
      all.addEventListener("click", function (e) {
        e.preventDefault();
        query = ""; state = "";
        if (input) input.value = "";
        showState();
        apply();
      });
      note.appendChild(all);
      note.appendChild(document.createTextNode("."));
      note.hidden = false;
    }

    if (box && form) {
      fetch(form.dataset.index).then(function (r) { return r.json(); }).then(function (foods) {
        var week = weekOf(new Date());
        states = {};
        foods.forEach(function (f) { states[f.slug] = stateOfFood(f, week); });
        apply();
      }).catch(function () {});
      box.querySelectorAll("input").forEach(function (r) {
        r.addEventListener("change", function () { if (r.checked) { state = r.value; apply(); } });
      });
    }
    apply();
    ask = { setQuery: function (q) { query = q; apply(); } };
  }

  function initSearch() {
    var form = document.querySelector("form.search");
    if (!form) return;
    var input = form.querySelector(".search-input");
    var panel = form.querySelector(".search-results");
    var askUrl = form.dataset.ask;
    var groups = JSON.parse(form.dataset.groups || "[]");
    var index = null, loading = false, flat = [], active = -1;

    function load(then) {
      if (index) { then(); return; }
      if (loading) return;
      loading = true;
      fetch(form.dataset.index).then(function (r) { return r.json(); }).then(function (foods) {
        index = buildIndex(foods, groups, askUrl);
        then();
      }).catch(function () { loading = false; });
    }

    function close() {
      panel.hidden = true; panel.textContent = ""; flat = []; active = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function option(cls, href, node) {
      var a = el("a", cls);
      a.href = href; a.setAttribute("role", "option"); a.id = "search-option-" + flat.length;
      a.appendChild(node);
      flat.push(a);
      return a;
    }

    function paint(found) {
      panel.textContent = ""; flat = []; active = -1;
      if (!found) { close(); return; }
      if (!found.groups.length) panel.appendChild(el("p", "search-none", "nothing to see here"));
      var foodsFound = 0;
      found.groups.forEach(function (g) {
        if (g.kind === "food") foodsFound = g.total;
        var section = el("div", "search-group search-group-" + g.kind);
        section.setAttribute("role", "group");
        section.appendChild(el("div", "search-group-label", g.label));
        g.results.forEach(function (r) {
          section.appendChild(option("search-option", r.href, labelNode(r.label, r.hit)));
        });
        if (g.hidden > 0) section.appendChild(el("p", "search-more", "+" + g.hidden + " more"));
        panel.appendChild(section);
      });
      if (foodsFound > 1) panel.appendChild(option("search-all", found.all, document.createTextNode("See all " + foodsFound + " →")));
      panel.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function setActive(n) {
      if (active >= 0 && flat[active]) flat[active].classList.remove("is-active");
      active = n;
      if (active >= 0 && flat[active]) {
        flat[active].classList.add("is-active");
        input.setAttribute("aria-activedescendant", flat[active].id);
      } else input.removeAttribute("aria-activedescendant");
    }

    function refresh() {
      if (index && document.activeElement === input) paint(search(index, input.value, askUrl));
    }

    // On the ask index the box narrows the list below instead of
    // opening a dropdown.
    if (ask) {
      input.addEventListener("input", function () { ask.setQuery(input.value); });
      return;
    }

    input.addEventListener("focus", function () { load(refresh); });
    input.addEventListener("input", function () { load(refresh); });
    input.addEventListener("keydown", function (e) {
      if (panel.hidden || !flat.length) { if (e.key === "Escape") close(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((active + 1) % flat.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive((active - 1 + flat.length) % flat.length); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "Enter" && active >= 0) { e.preventDefault(); location.href = flat[active].href; }
    });
    // Closing on blur waits a beat, or a click on an option empties the
    // panel before the click lands on the link.
    input.addEventListener("blur", function () {
      setTimeout(function () { if (!form.contains(document.activeElement)) close(); }, 120);
    });
    document.addEventListener("click", function (e) { if (!form.contains(e.target)) close(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var week = weekOf(new Date());
    document.querySelectorAll("svg[data-x0]").forEach(function (svg) { markToday(svg, week); });
    document.querySelectorAll("figure.wheel").forEach(function (f) { markWheel(f, new Date()); });
    initSwitches();
    initNow();
    initFood();
    initAsk();
    initSearch();
  });
})();
