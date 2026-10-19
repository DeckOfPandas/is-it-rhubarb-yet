// Everything on the site that needs today's date or a typed word happens
// here, in the visitor's browser, on top of HTML that was baked for the
// build day. The rules themselves live in assets/verdict.js, loaded first.
// No dependencies.
(function () {
  "use strict";
  var V = window.Verdict;
  var html = document.documentElement;
  var TODAY = new Date();
  var WEEK = V.weekOf(TODAY), YEAR = TODAY.getFullYear();
  var BAKED_WEEK = parseInt(html.dataset.bakedWeek, 10);
  var BAKED_YEAR = parseInt(html.dataset.bakedYear, 10);
  var SAME_WEEK = WEEK === BAKED_WEEK && YEAR === BAKED_YEAR;
  // Verdicts change by the week; the phrases under them ("any day now")
  // change by the day, so a list that carries phrases is redrawn unless
  // the page was baked today.
  var SAME_DAY = html.dataset.bakedAsof === isoDate(TODAY);
  function isoDate(d) {
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  // The site root, from this script's own address, so links built here
  // honour the baseurl.
  var script = document.currentScript;
  var BASE = script ? script.src.replace(/assets\/site\.js(\?.*)?$/, "") : "/";
  // How many foods each line of the home page's this-week strip names;
  // index.html samples the same number at build.
  var STRIP_PICK = 5;
  // How many same-family foods a food page lists; _layouts/food.html bakes
  // the same number.
  var ALSO_MAX = 6;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function foodUrl(slug) { return BASE + slug + "/"; }

  // --- Loading the data, once -------------------------------------------
  var foodsPromise = null, searchPromise = null;
  function loadFoods() {
    if (!foodsPromise) foodsPromise = fetch(BASE + "foods.json").then(function (r) { return r.json(); });
    return foodsPromise;
  }
  function loadSearch() {
    if (!searchPromise) searchPromise = fetch(BASE + "search.json").then(function (r) { return r.json(); });
    return searchPromise;
  }

  // --- Matching what people type --------------------------------------------
  // Case, accents and punctuation are ignored and "&" reads as "and".
  // Every word is matched under its forms: itself and, when it ends in s
  // or ies, its singular, on both sides, so "leek" begins "leeks",
  // "cherry" begins "cherries" (as "cherry") and "chilli" begins
  // "chillies" as typed. Every typed word must begin a candidate word, or
  // at least occur inside one; a word that begins the whole candidate
  // scores highest, then one that begins a word, then one found inside a
  // word.
  function fold(s) {
    return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function forms(w) {
    var out = [w];
    if (/ies$/.test(w)) out.push(w.replace(/ies$/, "y"));
    if (/s$/.test(w)) out.push(w.replace(/s$/, ""));
    return out;
  }
  function begins(q, t) {
    for (var i = 0; i < q.length; i++) {
      for (var k = 0; k < t.length; k++) if (t[k].indexOf(q[i]) === 0) return true;
    }
    return false;
  }
  function words(s) { return s.split(" ").filter(Boolean); }

  // Score of a candidate (an array of folded terms) for a typed query; 0
  // means no match.
  function score(terms, query) {
    var qw = words(query).map(forms);
    if (!qw.length) return 0;
    var total = 0;
    for (var i = 0; i < qw.length; i++) {
      var best = 0;
      for (var t = 0; t < terms.length && best < 3; t++) {
        var tw = words(terms[t]).map(forms);
        if (tw.length && begins(qw[i], tw[0])) { best = Math.max(best, t === 0 ? 3 : 2.5); continue; }
        for (var k = 0; k < tw.length; k++) {
          if (begins(qw[i], tw[k])) best = Math.max(best, 2);
          else if (qw[i][0].length >= 3 && tw[k][0].indexOf(qw[i][0]) >= 0) best = Math.max(best, 1);
        }
      }
      if (!best) return 0;
      total += best;
    }
    return total;
  }

  // Rank an index of {name, terms (folded)} by a query.
  function rank(index, query) {
    var q = fold(query);
    if (!q) return [];
    return index.map(function (it) { return { item: it, score: score(it.terms, q) }; })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return (b.score - a.score) || (a.item.name < b.item.name ? -1 : 1); })
      .map(function (r) { return r.item; });
  }

  // --- A food in a list, the same markup as _includes/food-row.html ------
  // opts.tag and opts.leader are each on unless false.
  function foodRow(item, opts) {
    opts = opts || {};
    var li = el("li", "food-row" + (item.never ? " never" : ""));
    li.dataset.slug = item.slug;
    li.dataset.verdict = item.verdict;
    if (item.colour) li.style.setProperty("--food", item.colour);
    var a = el("a");
    a.href = foodUrl(item.slug);
    var sw = el("span", "swatch"); sw.setAttribute("aria-hidden", "true");
    a.appendChild(sw);
    var name = el("span", "food-name", item.name);
    if (item.variety) { name.appendChild(document.createTextNode(" ")); name.appendChild(el("span", "variety", "(" + item.variety + ")")); }
    if (item.early) { name.appendChild(document.createTextNode(" ")); name.appendChild(el("span", "early", item.early)); }
    a.appendChild(name);
    if (opts.tag !== false) {
      if (opts.leader !== false) {
        var leader = el("span", "leader"); leader.setAttribute("aria-hidden", "true");
        a.appendChild(document.createTextNode(" "));
        a.appendChild(leader);
      }
      a.appendChild(el("span", "verdict-tag", item.verdict));
    }
    li.appendChild(a);
    return li;
  }

  // A group of foods, the same markup as _includes/food-group.html: an
  // optional small caps label, with the number of foods when `count`,
  // over rows with no tag.
  function foodGroup(items, label, count) {
    var g = el("div", "food-group");
    if (label) {
      var h = el("h3", "group-label", label);
      if (count) { h.appendChild(document.createTextNode(" ")); h.appendChild(el("span", "count", String(items.length))); }
      g.appendChild(h);
    }
    var ul = el("ul", "food-list");
    items.forEach(function (i) { ul.appendChild(foodRow(i, { tag: false })); });
    g.appendChild(ul);
    return g;
  }

  // Verdicts baked for another week are replaced on every row that shows
  // one, from the data.
  function refreshRows(scope) {
    if (SAME_WEEK) return Promise.resolve();
    return loadFoods().then(function (foods) {
      var bySlug = {};
      foods.forEach(function (f) { bySlug[f.slug] = f; });
      (scope || document).querySelectorAll(".food-row[data-slug]").forEach(function (li) {
        var f = bySlug[li.dataset.slug];
        if (!f) return;
        var fv = V.foodVerdict(f, WEEK);
        li.dataset.verdict = fv.verdict;
        var tagEl = li.querySelector(".verdict-tag");
        if (tagEl) tagEl.textContent = fv.verdict;
      });
    });
  }

  // --- The verdict word fills the line --------------------------------------
  // Measured after the fonts are in, so that YES and NEARLY both reach the
  // right edge; CSS's clamp() stands in before that and without JavaScript.
  // The word also stops at half the viewport's height, so on a wide, short
  // screen the date line under it stays above the fold.
  function fitVerdict(word) {
    if (!word) return;
    var box = word.parentElement;
    function fit() {
      word.style.fontSize = "";
      var avail = box.clientWidth;
      var width = word.getBoundingClientRect().width;
      if (!width || !avail) return;
      var size = parseFloat(getComputedStyle(word).fontSize) * (avail / width);
      size = Math.max(32, Math.min(size, avail * 0.9, window.innerHeight * 0.5));
      word.style.fontSize = size + "px";
    }
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(fit);
    var timer = null;
    window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(fit, 80); });
  }

  // --- The arrivals wheels fill their frame ----------------------------------
  // A wheel's viewBox leaves room for the longest label at any angle, but
  // what is drawn usually fills much less of it, so once a wheel is on
  // display its viewBox is tightened to what it drew, after the fonts are
  // in. A hidden wheel has no box to measure, so the kind switch fits the
  // one it shows.
  function fitDials() {
    var svgs = document.querySelectorAll("figure.dial > svg");
    if (!svgs.length) return;
    function fit(svg) {
      if (svg.dataset.fitted || !svg.getClientRects().length) return;
      var b = svg.getBBox();
      if (!b.width) return;
      svg.setAttribute("viewBox", [b.x - 6, b.y - 6, b.width + 12, b.height + 12].join(" "));
      svg.dataset.fitted = "1";
    }
    function all() { svgs.forEach(fit); }
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(all);
    document.querySelectorAll('input[name="kind"]').forEach(function (r) { r.addEventListener("change", all); });
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

  // The calendar's month header sticks to the top of the page in its own
  // block, so when the rows are scrolled sideways on a narrow screen the
  // header is scrolled with them.
  function syncChartHeads() {
    document.querySelectorAll(".chart-body").forEach(function (body) {
      var head = body.previousElementSibling;
      if (!head || !head.classList.contains("chart-head")) return;
      body.addEventListener("scroll", function () { head.scrollLeft = body.scrollLeft; }, { passive: true });
    });
  }

  // A food page links to the calendar with #<slug>: the rows of that food
  // are marked and the chart scrolls to the first visible one.
  function targetRow() {
    var slug = location.hash.replace(/^#/, "");
    if (!slug || !document.querySelector(".chart")) return;
    var rows = document.querySelectorAll('.chart a.row[data-slug="' + slug + '"]');
    if (!rows.length) return;
    rows.forEach(function (r) { r.classList.add("is-target"); });
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].getClientRects().length) { rows[i].scrollIntoView({ block: "center" }); break; }
    }
  }

  // --- Season wheels: the hand and the date in the hole --------------------
  // The wheel's dashes put week w at (w-1)*7 of 364 day units, so the hand
  // uses the same scale rather than the true length of the year.
  function markWheel(figure, today) {
    var hand = figure.querySelector(".hand");
    var label = figure.querySelector(".today-label");
    var doy = V.dayOfYear(today) - 1;
    var deg = Math.min(doy, 364) / 364 * 360;
    if (label) {
      label.querySelector(".date").textContent = V.fmtDate(today);
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
  // key. Only the theme switch has one: the order and kind switches open
  // on their default every visit. The theme switch also sets data-theme
  // on <html>; "auto" clears it so the system preference shows through.
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
            if (r.value === "auto") delete html.dataset.theme;
            else html.dataset.theme = r.value;
          }
        });
      });
    });
  }

  // --- A food page ----------------------------------------------------------
  // Recomputed on every load: the relative part of the date line ("in
  // about two weeks") moves day by day, not just week by week.
  function showQuote(box, q) {
    box.textContent = "";
    if (!q) { box.hidden = true; return; }
    var p = el("p");
    q.text.split(" / ").forEach(function (line, i) {
      if (i) p.appendChild(el("br"));
      p.appendChild(document.createTextNode(line));
    });
    box.appendChild(p);
    box.appendChild(el("cite", null, q.by));
    box.hidden = false;
  }

  function initFood() {
    var article = document.querySelector("article.food[data-food]");
    if (!article) return;
    var food = JSON.parse(article.dataset.food);
    var quotes = JSON.parse(article.dataset.quotes || "{}");
    var fv = V.foodVerdict(food, WEEK);
    document.getElementById("verdict").textContent = fv.verdict + ".";
    document.getElementById("date-line").textContent = V.dateLine(fv.variety, YEAR, TODAY);
    var vl = document.getElementById("variety-line");
    var vline = V.varietyLine(food, fv, YEAR, TODAY);
    vl.textContent = vline; vl.hidden = !vline;
    showQuote(document.getElementById("quote"), V.pickQuote(quotes, fv.verdict, food.slug, WEEK));
    var no = article.querySelector("[data-fine-no]"), yes = article.querySelector("[data-fine-yes]");
    if (no && yes) { no.hidden = fv.verdict !== "NO"; yes.hidden = fv.verdict === "NO"; }
    document.title = "Is it " + food.name.toLowerCase() + " yet? " +
      fv.verdict.charAt(0) + fv.verdict.slice(1).toLowerCase() + ".";
    // "Great this week" is baked; for another week, or a page baked with
    // no data at all, it is rebuilt from foods.json: up to ALSO_MAX foods
    // of the same family that are YES, in data order, as the template
    // picks them.
    if (!SAME_WEEK) loadFoods().then(function (foods) {
      var picks = foods.filter(function (f) {
        return f.group === food.group && f.slug !== food.slug && V.foodVerdict(f, WEEK).verdict === "YES";
      }).slice(0, ALSO_MAX);
      var section = article.querySelector(".also");
      if (!picks.length) { if (section) section.hidden = true; return; }
      if (!section) {
        section = el("section", "also");
        section.appendChild(el("h2", null, "Great this week"));
        section.appendChild(el("ul", "food-list"));
        article.insertBefore(section, article.querySelector(".fine"));
      }
      var ul = section.querySelector("ul");
      ul.textContent = "";
      picks.forEach(function (f) { ul.appendChild(foodRow({ slug: f.slug, name: f.name, colour: f.colour, verdict: "YES" }, { tag: false })); });
      section.hidden = false;
    });
  }

  // --- About: tonight's dinner ---------------------------------------------
  // The dinner line names a food that has just arrived, or in a quiet
  // week one that is great now; baked, and redone for the visitor's week.
  function initAbout() {
    var a = document.getElementById("dinner");
    if (!a || SAME_WEEK) return;
    loadFoods().then(function (foods) {
      var now = V.nowLists(foods, [], WEEK, YEAR, TODAY);
      var pick = V.flatten(now.arrived)[0] || V.flatten(now.still)[0];
      if (!pick) return;
      a.textContent = pick.name.toLowerCase();
      a.href = foodUrl(pick.slug);
    });
  }

  // --- Home: the hook ---------------------------------------------------------
  function initHome() {
    var input = document.getElementById("hook-input");
    var list = document.getElementById("food-list");
    if (!input || !list) return;
    // The A to Z list holds every food and never-food with its search terms;
    // matches are copied from it into a list of their own, best first.
    var rows = Array.prototype.slice.call(list.querySelectorAll(".food-row"));
    var lists = document.getElementById("food-lists");
    var found = document.getElementById("found");
    var foundGroup = document.getElementById("found-group");
    var none = document.getElementById("hook-none");
    var index = rows.map(function (li) {
      return { li: li, name: li.querySelector(".food-name").textContent, terms: li.dataset.terms.split("|").filter(Boolean).map(fold) };
    });
    var shown = [];

    // A hidden span in the same font measures the value, or the placeholder
    // when there is none. On one line the input is as wide as its word, up to
    // the room "Is it" and "yet?" leave; when the question stacks, the input
    // is the full width. Either way a word too long for its room is set
    // smaller until it fits. The underline is the word's width and the
    // resting caret stands just after it.
    var slot = input.parentElement;
    var ruler = el("span", "hook-ruler");
    var underline = el("span", "hook-underline");
    var caret = el("span", "hook-caret");
    [ruler, underline, caret].forEach(function (n) { n.setAttribute("aria-hidden", "true"); slot.appendChild(n); });
    var line = input.closest(".hook-line");
    var stacked = matchMedia("(max-width: 37.49rem)");
    var CARET_ROOM = 12;
    function size() {
      ruler.textContent = input.value || input.placeholder;
      slot.classList.toggle("has-value", !!input.value);
      var text = ruler.getBoundingClientRect().width;
      if (!text) return;
      var w = text + CARET_ROOM;
      input.style.fontSize = "";
      var room;
      if (stacked.matches) {
        input.style.width = "";
        room = input.clientWidth;
      } else {
        var gap = parseFloat(getComputedStyle(line).columnGap) || 0;
        room = line.clientWidth - 2 * gap - 8;
        line.querySelectorAll(".hook-word").forEach(function (word) { room -= word.getBoundingClientRect().width; });
        input.style.width = Math.min(w, room) + "px";
      }
      var scale = w > room ? room / w : 1;
      if (scale < 1) input.style.fontSize = (parseFloat(getComputedStyle(input).fontSize) * scale) + "px";
      underline.style.width = (text * scale) + "px";
      caret.style.left = (text * scale + 2) + "px";
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    window.addEventListener("resize", size);

    // When the typing narrows the list to one food, the typed word and its
    // underline take that food's colour; so they do when the word is one
    // food's name or alias in full, as "apples" is while crab apples and
    // pineapples still show.
    function colour() {
      var q = fold(input.value);
      var exact = shown.filter(function (it) { return it.terms.indexOf(q) >= 0; });
      var one = shown.length === 1 ? shown[0].li : exact.length === 1 ? exact[0].li : null;
      input.classList.toggle("is-food", !!one);
      if (one) slot.style.setProperty("--food", getComputedStyle(one).getPropertyValue("--food"));
    }

    function apply() {
      var q = input.value.trim();
      size();
      filter(q);
      colour();
    }
    function filter(q) {
      found.textContent = "";
      if (!q) {
        lists.hidden = false; foundGroup.hidden = true;
        none.hidden = true; shown = [];
        return;
      }
      lists.hidden = true;
      shown = rank(index, q);
      shown.forEach(function (it) {
        var copy = it.li.cloneNode(true);
        copy.hidden = false;
        found.appendChild(copy);
      });
      foundGroup.hidden = !shown.length;
      if (shown.length) { none.hidden = true; return; }
      none.textContent = "";
      none.appendChild(document.createTextNode("Is it " + q + " yet? Literally no idea. If that's an actual thing, please "));
      var a = el("a", null, "tell us"); a.href = none.dataset.issues;
      none.appendChild(a);
      none.appendChild(document.createTextNode("."));
      none.hidden = false;
    }

    input.addEventListener("input", apply);
    input.form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (shown.length) location.href = shown[0].li.querySelector("a").href;
    });
    var q = new URL(location.href).searchParams.get("q");
    if (q) input.value = q;
    apply();
    // The input is not focused on load, so the hero rests as the logo; the
    // first letter typed anywhere on the page goes into it instead.
    document.addEventListener("keydown", function (e) {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || e.key === " ") return;
      var t = e.target;
      if (t === input || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      input.focus({ preventScroll: true });
    });
    // The magnifier and "Ask about something else" link to #search, which
    // names no element, so the browser does not scroll: the cursor goes to
    // the input and the page stays where it is. On home itself the
    // magnifier goes back up to the input.
    if (location.hash === "#search" || location.hash === "#hook-input") input.focus({ preventScroll: true });
    document.querySelectorAll(".search-link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
        input.focus({ preventScroll: true });
      });
    });
    refreshRows(lists).then(function () { if (input.value.trim()) apply(); });

    // The this-week strip for a week other than the baked one: the same
    // lines index.html bakes, a few foods picked at random from each list.
    if (!SAME_WEEK) {
      var strip = document.getElementById("this-week");
      if (strip) loadFoods().then(function (foods) {
        var now = V.nowLists(foods, [], WEEK, YEAR, TODAY);
        strip.textContent = "";
        function part(label, list, empty) {
          var items = V.flatten(list);
          if (!items.length && !empty) return;
          var p = el("p", "this-week-line");
          p.appendChild(el("strong", null, label + ": "));
          if (!items.length) { p.appendChild(document.createTextNode(empty)); strip.appendChild(p); return; }
          var pick = items.slice().sort(function () { return Math.random() - 0.5; }).slice(0, STRIP_PICK);
          pick.forEach(function (i, n) {
            if (n) p.appendChild(document.createTextNode(", "));
            var a = el("a", "food-link", i.name);
            a.href = foodUrl(i.slug);
            a.style.setProperty("--food", i.colour);
            p.appendChild(a);
          });
          var more = items.length - pick.length;
          p.appendChild(document.createTextNode((more > 0 ? " and " + more + " more" : "") + "."));
          strip.appendChild(p);
        }
        part("Just arrived", now.arrived, "nothing new this week.");
        part("Great now", now.still);
        part("Last chance", now.last);
        var p = el("p", "this-week-more");
        var a = el("a", null, "This week in full"); a.href = BASE + "now/";
        p.appendChild(a); p.appendChild(document.createTextNode("."));
        strip.appendChild(p);
      });
    }
  }

  // --- Now: the digest for any week ----------------------------------------
  function initNow() {
    var digest = document.getElementById("digest");
    if (!digest) return;
    var groups = JSON.parse(digest.dataset.groups || "[]");
    var title = document.getElementById("week-title");
    var dates = document.getElementById("week-dates");
    var prev = document.getElementById("prev-week"), next = document.getElementById("next-week");
    var back = document.getElementById("week-back");
    var site = document.title.split(" · ").slice(1).join(" · ");
    var KIND = { veg: "Veg", fruit: "Fruit", wild: "Wild", herbs: "Herbs", fish: "Fish", meat: "Meat" };
    // A week is shown as its distance in weeks from this one, at most
    // RANGE either way; the address carries week= and, in another year,
    // year=.
    var RANGE = 52;
    function weekAt(offset) {
      var w = WEEK + offset, y = YEAR;
      while (w > 52) { w -= 52; y++; }
      while (w < 1) { w += 52; y--; }
      return { week: w, year: y };
    }
    var params = new URL(location.href).searchParams;
    var pw = parseInt(params.get("week"), 10), py = parseInt(params.get("year"), 10) || YEAR;
    var offset = (pw >= 1 && pw <= 52) ? (py - YEAR) * 52 + (pw - WEEK) : 0;
    if (Math.abs(offset) > RANGE) offset = 0;
    var redrawn = false;

    // One band, the same markup as _includes/band.html: a heading with the
    // count (none when it is nothing), then the foods as one A to Z list
    // (plain), a group per timing (phrase) or a group per kind with its
    // count (kind). No row has a tag.
    function band(cls, heading, kinds, shape, emptyText) {
      var s = el("section", "band " + cls);
      var h = el("h2", null, heading + " ");
      var total = V.flatten(kinds).length;
      if (total) h.appendChild(el("span", "count", String(total)));
      s.appendChild(h);
      if (!total) { s.appendChild(el("p", "empty", emptyText)); return s; }
      if (shape === "phrase") {
        V.byPhrase(kinds).forEach(function (g) { s.appendChild(foodGroup(g.items, g.phrase)); });
      } else if (shape === "kind") {
        kinds.forEach(function (k) { s.appendChild(foodGroup(k.items, KIND[k.kind] || k.kind, true)); });
      } else {
        s.appendChild(foodGroup(V.azList(kinds)));
      }
      return s;
    }

    // The digest for another week reads its phrases from the middle of
    // that week, since it has no today. The baked digest is kept only
    // while nothing else has been drawn over it.
    function render() {
      var at = weekAt(offset), w = at.week, y = at.year;
      title.textContent = "In season" + (offset === 0 ? " this week" : offset === 1 ? " next week" : offset === -1 ? " last week" : "");
      document.title = title.textContent + (site ? " · " + site : "");
      dates.textContent = V.fmtRange(w, y);
      prev.disabled = offset <= -RANGE;
      next.disabled = offset >= RANGE;
      back.hidden = offset === 0;
      var url = new URL(location.href);
      url.searchParams.delete("week"); url.searchParams.delete("year");
      if (offset !== 0) url.searchParams.set("week", w);
      if (y !== YEAR) url.searchParams.set("year", y);
      history.replaceState(null, "", url);
      if (offset === 0 && SAME_DAY && !redrawn) return;
      redrawn = true;
      loadFoods().then(function (foods) {
        if (weekAt(offset).week !== w || weekAt(offset).year !== y) return;
        var now = V.nowLists(foods, groups, w, y, offset === 0 ? TODAY : V.midOfToday(w, y));
        digest.textContent = "";
        digest.appendChild(band("arrived", "Just arrived", now.arrived, "plain", "Nothing new this week."));
        digest.appendChild(band("last", "Last chance", now.last, "phrase", "Nothing on its way out."));
        digest.appendChild(band("onway", "On the way", now.onway, "phrase", "Nothing due in the next few weeks."));
        digest.appendChild(band("still", "Great now", now.still, "kind", "Nothing at all, which cannot be right."));
      });
    }

    prev.hidden = next.hidden = false;
    prev.addEventListener("click", function () { if (offset > -RANGE) { offset--; render(); } });
    next.addEventListener("click", function () { if (offset < RANGE) { offset++; render(); } });
    render();
  }

  // --- Not found ---------------------------------------------------------------
  // The address says what was asked for; the nearest foods are offered.
  function initNotFound() {
    var box = document.getElementById("not-found");
    if (!box) return;
    var parts = location.pathname.replace(/\/+$/, "").split("/");
    var last = decodeURIComponent(parts[parts.length - 1] || "").replace(/[-_+]+/g, " ").replace(/\.\w+$/, "").trim();
    if (!last || last === "404") last = "that";
    document.getElementById("asked").textContent = last;
    document.title = "Is it " + last + " yet? Literally no idea.";
    loadSearch().then(function (items) {
      var index = items.map(function (it) { it.terms = it.terms.map(fold); return it; });
      var found = rank(index, last).slice(0, 5);
      if (!found.length) {
        // Nothing begins with it: offer anything sharing three letters.
        var q = fold(last).slice(0, 3);
        found = q.length === 3 ? index.filter(function (it) {
          return it.terms.some(function (t) { return t.indexOf(q) >= 0; });
        }).slice(0, 5) : [];
      }
      if (!found.length) return;
      var ul = document.getElementById("suggest-list");
      found.forEach(function (it) { ul.appendChild(foodRow(it)); });
      document.getElementById("suggest").hidden = false;
      refreshRows(ul);
    }).catch(function () {});
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("svg[data-x0]").forEach(function (svg) { markToday(svg, WEEK); });
    document.querySelectorAll("figure.wheel").forEach(function (f) { markWheel(f, TODAY); });
    fitDials();
    document.querySelectorAll("[data-asof]").forEach(function (n) { n.textContent = V.fmtDateYear(TODAY); });
    initSwitches();
    initFood();
    fitVerdict(document.querySelector(".verdict-word"));
    initAbout();
    initHome();
    initNow();
    initNotFound();
    syncChartHeads();
    targetRow();
    window.addEventListener("hashchange", targetRow);
    refreshRows(document.querySelector(".also"));
  });
})();
