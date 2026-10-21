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
  // How many foods each of the home page's this-week blocks names;
  // index.html samples the same number at build.
  var STRIP_PICK = 3;
  // How many same-family foods a food page lists, at random;
  // _layouts/food.html samples the same number at build.
  var ALSO_PICK = 3;
  function pickSome(items, n) {
    return items.slice().sort(function () { return Math.random() - 0.5; }).slice(0, n);
  }

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
  // at least occur inside one or its singular; a word that begins the whole candidate
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
  // Whether a typed word is found inside any form of a word, so "berry"
  // is inside "strawberries" by way of "strawberry".
  function inside(q, t) {
    for (var k = 0; k < t.length; k++) if (t[k].indexOf(q) >= 0) return true;
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
          else if (qw[i][0].length >= 3 && inside(qw[i][0], tw[k])) best = Math.max(best, 1);
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

  // --- Home search: tiers ----------------------------------------------------
  // The hero ranks a candidate (a food's name, alias or shared word, a
  // variety's name or how it is said, each as folded words) by how the
  // typed words meet it: 1, exactly; 2, at its start; 3, at the start of
  // a later word; 4, inside a word. Singular and plural are equal, and the
  // last typed word, still being typed, may also begin its word.
  function singular(w) { return w.replace(/ies$/, "y").replace(/oes$/, "o").replace(/([^s])s$/, "$1"); }
  function wordsAt(c, q, i) {
    if (i + q.length > c.length) return false;
    for (var j = 0; j < q.length; j++) {
      if (singular(c[i + j]) === singular(q[j])) continue;
      if (j === q.length - 1 && c[i + j].indexOf(q[j]) === 0) continue;
      return false;
    }
    return true;
  }
  function tierOf(c, q) {
    if (c.length === q.length && c.every(function (w, i) { return singular(w) === singular(q[i]); })) return 1;
    if (wordsAt(c, q, 0)) return 2;
    for (var i = 1; i < c.length; i++) if (wordsAt(c, q, i)) return 3;
    var qs = q.join(" ");
    if (c.join(" ").indexOf(qs) >= 0 || c.map(singular).join(" ").indexOf(q.map(singular).join(" ")) >= 0) return 4;
    return 0;
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
    var name = el("span", "food-name");
    name.appendChild(el("span", "food-title", item.name));
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

  // A card's way on to the food's page, the name in its sentence form.
  function tellMeAbout(name) { return "Tell me everything about " + name.toLowerCase(); }

  // A link with an arrow after its words, the same markup as the templates'
  // .arrow-link and _includes/icons/arrow-right.svg: the words underline
  // on hover, the arrow never does.
  var SVG_NS = "http://www.w3.org/2000/svg";
  function arrowMark() {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 20 12");
    svg.setAttribute("class", "arrow");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M1 6h18M14 2l5 4-5 4");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }
  function arrowLink(href, text) {
    var a = el("a", "arrow-link");
    a.href = href;
    a.appendChild(el("span", "arrow-text", text));
    a.appendChild(arrowMark());
    return a;
  }

  // A home teaser's foods: STRIP_PICK of them at random, each a link in its
  // colour, then "and N more →", which links to its band on Now.
  function fillTeaser(p, items, band) {
    p.textContent = "";
    var pick = pickSome(items, STRIP_PICK);
    pick.forEach(function (i, n) {
      if (n) p.appendChild(document.createTextNode(", "));
      var a = el("a", "food-link", i.name);
      a.href = foodUrl(i.slug);
      a.style.setProperty("--food", i.colour);
      p.appendChild(a);
    });
    var more = items.length - pick.length;
    if (more > 0) {
      p.appendChild(document.createTextNode(" "));
      var m = arrowLink(BASE + "now/#" + band, "and " + more + " more");
      m.classList.add("more-link");
      p.appendChild(m);
    }
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
  // The word is then made smaller, if it must be, until the date line
  // under it is wholly on the first screen, 16px clear of its foot.
  var MIN_VERDICT = 64;
  function fitVerdict(word) {
    if (!word) return;
    var box = word.parentElement;
    var dateLine = box.parentElement.querySelector(".date-line");
    function fit() {
      word.style.fontSize = "";
      var avail = box.clientWidth;
      var width = word.getBoundingClientRect().width;
      if (!width || !avail) return;
      var size = parseFloat(getComputedStyle(word).fontSize) * (avail / width);
      size = Math.min(size, avail * 0.9);
      word.style.fontSize = size + "px";
      if (!dateLine) return;
      // Fitting the width always wins: MIN_VERDICT only stops the shrink
      // for the date line, so LITERALLY NO IDEA. still fits a phone.
      var floor = Math.min(MIN_VERDICT, size);
      for (var i = 0; i < 3; i++) {
        var over = dateLine.getBoundingClientRect().bottom + window.scrollY - (window.innerHeight - 16);
        if (over <= 1 || size <= floor) break;
        var tall = word.getBoundingClientRect().height;
        size = Math.max(floor, size * (1 - over / tall));
        word.style.fontSize = size + "px";
      }
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
  // in. Every food's name counts, even one the ALL wheel has hidden for
  // now, since it may show later; and on the wheel page, where charts.js
  // runs a time line out to the rim (data-rim), so does room for its knob
  // and the longest time beside it, EARLY SEPTEMBER, at any angle; the
  // line and knob themselves are left out of the measure, wherever they
  // are. A hidden wheel has no box to measure, so the kind switch fits
  // the one it shows, and a resize fits the one on show again. The room
  // left over the drawing is --dial-inset on the figure, in pixels.
  var LONGEST_TIME = "Early September";
  function fitDials() {
    var svgs = document.querySelectorAll("figure.dial > svg");
    if (!svgs.length) return;
    function fit(svg) {
      if (svg.dataset.fitted || !svg.getClientRects().length) return;
      var hidden = Array.prototype.filter.call(svg.querySelectorAll("a.label text"), function (t) { return t.style.display === "none"; });
      var moving = Array.prototype.filter.call(svg.querySelectorAll(".tt-line, .tt-knob, .tt-today"), function (t) { return t.style.display !== "none"; });
      hidden.forEach(function (t) { t.style.display = ""; });
      moving.forEach(function (t) { t.style.display = "none"; });
      var b = svg.getBBox();
      hidden.forEach(function (t) { t.style.display = "none"; });
      moving.forEach(function (t) { t.style.display = ""; });
      if (!b.width) return;
      var x0 = b.x, y0 = b.y, x1 = b.x + b.width, y1 = b.y + b.height;
      if (svg.dataset.rim && svg.closest("[data-tt]")) {
        var C = +svg.dataset.c, R = +svg.dataset.rim;
        var probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
        probe.setAttribute("class", "tt-knob-label");
        probe.textContent = LONGEST_TIME;
        svg.appendChild(probe);
        var reach = 22 + probe.getComputedTextLength();
        probe.remove();
        x0 = Math.min(x0, C - R - reach); x1 = Math.max(x1, C + R + reach);
        y0 = Math.min(y0, C - R - 20); y1 = Math.max(y1, C + R + 20);
      }
      // A wheel as wide as the screen keeps what it draws 8px in from the
      // screen's edges: m screen pixels at S pixels for W + 2 pad units.
      var r = svg.getBoundingClientRect(), S = r.width, W = x1 - x0;
      var m = Math.max(0, 8 - r.left, 8 - (document.documentElement.clientWidth - r.right));
      var pad = Math.max(6, m * W / (S - 2 * m));
      svg.setAttribute("viewBox", [x0 - pad, y0 - pad, W + 2 * pad, y1 - y0 + 2 * pad].join(" "));
      svg.parentElement.style.setProperty("--dial-inset", ((b.y - (y0 - pad)) * S / (W + 2 * pad)).toFixed(1) + "px");
      svg.dataset.fitted = "1";
    }
    function all() { svgs.forEach(fit); }
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(all);
    document.querySelectorAll('input[name="kind"]').forEach(function (r) { r.addEventListener("change", all); });
    var timer = null;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { svgs.forEach(function (s) { delete s.dataset.fitted; }); all(); }, 120);
    });
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

  // A calendar too wide for the screen opens scrolled so that today
  // stands a third of the way across the weeks in view. Only the chart on
  // show has a width, so the order switch scrolls the one it shows.
  function scrollToToday() {
    function scroll() {
      document.querySelectorAll(".chart-body").forEach(function (body) {
        var cells = body.querySelector(".cal-cells");
        if (!cells || body.dataset.scrolled || !body.clientWidth || body.scrollWidth <= body.clientWidth) return;
        var cw = parseFloat(cells.dataset.cw);
        var labels = body.querySelector(".cal-labels").getBoundingClientRect().width;
        var x = (WEEK - 1) * cw + cw / 2;
        body.scrollLeft = Math.max(0, x - (body.clientWidth - labels) / 3);
        body.dataset.scrolled = "1";
      });
    }
    scroll();
    document.querySelectorAll('input[name="order"]').forEach(function (r) { r.addEventListener("change", scroll); });
  }

  // The sticky header's height, rule included, as --header-h: what sticks
  // below it sits there, and what is jumped to stops there.
  function measureHeader() {
    var header = document.querySelector(".site-header");
    if (!header || !window.ResizeObserver) return;
    new ResizeObserver(function () {
      document.documentElement.style.setProperty("--header-h", header.getBoundingClientRect().height + "px");
    }).observe(header);
  }
  function headerHeight() {
    var header = document.querySelector(".site-header");
    return header ? header.getBoundingClientRect().height : 0;
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

  // --- A food's card dial ------------------------------------------------------
  // A copy of the food page's own dial, cut to one ring (the variety that
  // gave the verdict, by its place in the food's varieties) and that ring
  // widened to fill the band all the rings share, as a food of one variety
  // draws it: _includes/season-wheel.html's R 140 and R0 78, less its 3
  // units of gap. The ring keeps its variety's shape but is drawn in one
  // colour, the verdict's (`colour`), shades and all. The page is fetched
  // once per food and kept. Resolves to a span.wheel for markWheel, or
  // null.
  var dialPages = {};
  var RING_THICK = 140 - 78 - 3, RING_MID = 140 - RING_THICK / 2;
  function miniDial(slug, ring, colour) {
    if (!dialPages[slug]) dialPages[slug] = fetch(foodUrl(slug)).then(function (r) { return r.text(); }).then(function (page) {
      return new DOMParser().parseFromString(page, "text/html").querySelector("figure.wheel svg");
    }).catch(function () { return null; });
    return dialPages[slug].then(function (svg) {
      if (!svg) return null;
      var copy = document.importNode(svg, true);
      copy.setAttribute("viewBox", "30 30 300 300");
      copy.removeAttribute("role"); copy.removeAttribute("aria-label");
      var rings = copy.querySelectorAll(".ring");
      if (rings.length > 1 && ring >= 0 && ring < rings.length) {
        rings.forEach(function (g, k) {
          if (k !== ring) { g.remove(); return; }
          g.setAttribute("stroke-width", RING_THICK);
          g.querySelectorAll("circle").forEach(function (c) { c.setAttribute("r", RING_MID); });
        });
      }
      if (colour) {
        copy.classList.add("mono");
        copy.querySelectorAll(".ring, .ring g").forEach(function (g) { g.style.setProperty("--c", colour); });
      }
      var fig = el("span", "wheel");
      fig.appendChild(copy);
      return fig;
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
    // "Great this week": ALSO_PICK foods of the same family that are YES,
    // a fresh pick on every visit, A to Z, then how many more there are.
    // In the baked week they come from the section's data-all; for another
    // week, or a page baked with none, from foods.json. It is "Also great
    // this week" unless this food is NO.
    function alsoHeading(h) {
      h.textContent = fv.verdict === "NO" ? "Great this week" : "Also great this week";
    }
    var section = article.querySelector(".also");
    if (section) alsoHeading(section.querySelector("h2"));
    if (SAME_WEEK) { if (section) fillAlso(JSON.parse(section.dataset.all || "[]")); }
    else loadFoods().then(function (foods) {
      fillAlso(foods.filter(function (f) {
        return f.group === food.group && f.slug !== food.slug && V.foodVerdict(f, WEEK).verdict === "YES";
      }));
    });
    function fillAlso(all) {
      var picks = pickSome(all, ALSO_PICK).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
      section = article.querySelector(".also");
      if (!picks.length) { if (section) section.hidden = true; return; }
      if (!section) {
        section = el("section", "also");
        section.appendChild(el("h2"));
        section.appendChild(el("ul", "food-list"));
        var p = el("p", "also-more");
        var m = arrowLink(BASE + "now/#still", "");
        m.classList.add("more-link");
        p.appendChild(m);
        section.appendChild(p);
        article.insertBefore(section, article.querySelector(".fine"));
      }
      alsoHeading(section.querySelector("h2"));
      var ul = section.querySelector("ul");
      ul.textContent = "";
      picks.forEach(function (f) { ul.appendChild(foodRow({ slug: f.slug, name: f.name, colour: f.colour, verdict: "YES" }, { tag: false })); });
      var more = all.length - picks.length;
      section.querySelector(".also-more").hidden = !more;
      section.querySelector(".more-link .arrow-text").textContent = "and " + more + " more";
      section.hidden = false;
    }
  }

  // --- About: tonight's dinner ---------------------------------------------
  // The dinner line names a food in season on the visitor's day, picked
  // at random from everything that is YES (just arrived or great this
  // week) on every visit. The build bakes the first such food, which
  // stands without JavaScript.
  function initAbout() {
    var a = document.getElementById("dinner");
    if (!a) return;
    loadFoods().then(function (foods) {
      var now = V.nowLists(foods, [], WEEK, YEAR, TODAY);
      var pick = pickSome(V.flatten(now.arrived).concat(V.flatten(now.still)), 1)[0];
      if (!pick) return;
      a.textContent = pick.name.toLowerCase();
      a.href = foodUrl(pick.slug);
      a.style.setProperty("--food", pick.colour);
    });
  }

  // --- The hook field: home's hero and every other page's wordmark ----------
  // One input set in a line of Anton, "Is it [rhubarb] yet?". A hidden
  // span in the same font measures the value, or the placeholder when
  // there is none. On one line the input is as wide as its word and any
  // completion, up to the room "Is it" and "yet?" leave; when the hero
  // stacks on a phone (opts.stacked), the input is the full width. Either
  // way a word too long for its room is set smaller until it fits, the
  // completion counted, so accepting it does not make the word jump. The
  // underline is the typed word's width. While the input is empty the
  // real caret is hidden and a drawn one stands in: just after RHUBARB at
  // rest, and at the start of the field once it has focus, where the
  // first letter will go. The input is a little wider than its word, room
  // for the real caret after the last letter, so the word sits a normal
  // space from "Is it" and from "yet?". Its width is set in em, so it
  // scales with the type wherever the type is resized without this
  // script, as in print.
  // Ghost completion: when the lead's name, or one of its aliases, begins
  // with what is typed, the rest of it shows after the typed text, faded
  // in its colour. None when the text is already a whole name, while an
  // input method is composing, or after Escape until the next keystroke.
  // Folding can change a name's length ("&" is "and"), so the typed part
  // of the name is the shortest slice that folds to the typed text, and
  // the space after it too when the typed text ends in one. Tab, End, or →
  // with the caret at the end accept it, as does a tap on the faded part.
  // The typed word and its underline take the lead's colour; with no lead
  // they stay ink over the pink. update(lead) redraws all of it for the
  // best match, or null; opts.onChange runs on every edit.
  function hookField(input, opts) {
    var slot = input.parentElement;
    var ruler = el("span", "hook-ruler");
    var underline = el("span", "hook-underline");
    var caret = el("span", "hook-caret");
    // The completion lies over the input in the same type: the typed part
    // is transparent, so the input's own text and caret show through, and
    // the rest is faded in the food's colour.
    var layer = el("span", "hook-ghost");
    var layerTyped = el("span", "ghost-typed"), layerRest = el("span", "ghost-rest");
    layer.appendChild(layerTyped); layer.appendChild(layerRest);
    layer.hidden = true;
    [ruler, underline, caret, layer].forEach(function (n) { n.setAttribute("aria-hidden", "true"); slot.appendChild(n); });
    var line = input.closest(".hook-line, .brand-line");
    var CARET_ROOM = 0.05;
    var lead = null, ghost = "", ghostFull = "", composing = false, dismissed = false;
    var WORDY = /[\p{L}\p{N}]/u;
    function size() {
      ruler.textContent = input.value || input.placeholder;
      slot.classList.toggle("has-value", !!input.value);
      var text = ruler.getBoundingClientRect().width;
      if (!text) return;
      var full = text;
      if (ghost) { ruler.textContent = input.value + ghost; full = ruler.getBoundingClientRect().width; }
      input.style.fontSize = "";
      var em = parseFloat(getComputedStyle(input).fontSize);
      var w = full + CARET_ROOM * em;
      var room, stacked = opts.stacked();
      if (stacked) {
        input.style.width = "";
        room = input.clientWidth;
      } else {
        var gap = parseFloat(getComputedStyle(line).columnGap) || 0;
        room = line.clientWidth - 2 * gap - 8;
        line.querySelectorAll(".hook-word").forEach(function (word) { room -= word.getBoundingClientRect().width; });
      }
      var scale = w > room ? room / w : 1;
      if (scale < 1) input.style.fontSize = (em * scale) + "px";
      if (!stacked) input.style.width = (Math.min(w, room) / (em * scale)).toFixed(3) + "em";
      underline.style.width = (text * scale / em).toFixed(3) + "em";
      caret.style.left = document.activeElement === input ? "0" : (text * scale / em).toFixed(3) + "em";
      layer.style.fontSize = input.style.fontSize;
      layer.style.top = (input.offsetTop + input.clientTop) + "px";
      layer.style.height = input.clientHeight + "px";
    }
    function complete() {
      ghost = ghostFull = "";
      var typed = input.value, q = fold(typed);
      if (q && !composing && !dismissed && lead) {
        var names = lead.names;
        if (!names.some(function (s) { return fold(s) === q; })) {
          for (var i = 0; i < names.length && !ghostFull; i++) {
            var s = names[i];
            if (fold(s).indexOf(q) !== 0) continue;
            var k = 1;
            while (k <= s.length && fold(s.slice(0, k)) !== q) k++;
            if (k > s.length) continue;
            if (!WORDY.test(typed.slice(-1))) while (k < s.length && !WORDY.test(s.charAt(k))) k++;
            ghost = s.slice(k); ghostFull = s;
          }
        }
      }
      layerTyped.textContent = input.value;
      layerRest.textContent = ghost;
      layer.hidden = !ghost;
      if (ghost) layer.style.setProperty("--ghost", lead.colour());
    }
    function colour() {
      input.classList.toggle("is-food", !!lead);
      if (lead) slot.style.setProperty("--food", lead.colour());
    }
    function update(l) { lead = l; complete(); size(); colour(); }
    function accept() {
      input.value = ghostFull;
      input.setSelectionRange(ghostFull.length, ghostFull.length);
      opts.onChange();
    }
    layerRest.addEventListener("pointerdown", function (e) { e.preventDefault(); if (ghost) accept(); });
    input.addEventListener("compositionstart", function () { composing = true; complete(); size(); });
    input.addEventListener("compositionend", function () { composing = false; opts.onChange(); });
    input.addEventListener("input", function () { dismissed = false; opts.onChange(); });
    // Accepting or dismissing a completion is the field's; anything else
    // the page's own handler may take, unless this one did.
    input.addEventListener("keydown", function (e) {
      var atEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
      if (ghost && !e.isComposing && ((e.key === "Tab" && !e.shiftKey) || e.key === "End" || (e.key === "ArrowRight" && atEnd))) {
        e.preventDefault();
        accept();
      } else if (e.key === "Escape" && ghost) {
        e.preventDefault();
        dismissed = true;
        complete();
        size();
      }
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    window.addEventListener("resize", size);
    input.addEventListener("focus", size);
    input.addEventListener("blur", size);
    return { update: update, size: size };
  }

  // --- The header's search: the wordmark on every page but home -------------
  // The same field as home's hero, matched against search.json: a food's
  // name, the names its varieties are said by, its aliases and shared
  // words, one food per hit at its best tier. It never answers here; it
  // asks home, /?q=…, which answers as it always does: as soon as typing
  // pauses 0.6s on one good match (the one that colours the word), or
  // 1.5s on two or more letters that find several foods or none; at once
  // on Enter (a phone's Go), which with nothing typed goes to home as it
  // is. Escape puts RHUBARB back and leaves the field. Leaving, its slot
  // takes the hero's view-transition name, so the word flies into the
  // hero, and on a wide screen home keeps typing where it left off.
  var CARRY = "hook-carry";
  function initHeadSearch() {
    var input = document.getElementById("head-input");
    if (!input) return;
    var index = [], timer = null, lead = null, hits = [];
    loadSearch().then(function (items) {
      index = items.map(function (it) {
        return {
          slug: it.slug,
          strings: it.terms.map(function (s) { return words(fold(s)); }),
          names: [it.name].concat(it.names || []),
          colour: function () { return it.never ? getComputedStyle(document.documentElement).getPropertyValue("--never").trim() : it.colour; },
        };
      });
      change();
    }).catch(function () {});
    function search(text) {
      var q = words(fold(text));
      if (!q.length) return [];
      return index.map(function (it) {
        var t = 0;
        it.strings.forEach(function (c) { var x = tierOf(c, q); if (x && (!t || x < t)) t = x; });
        return { it: it, tier: t };
      }).filter(function (h) { return h.tier; }).sort(function (a, b) { return a.tier - b.tier; });
    }
    var field = hookField(input, { stacked: function () { return false; }, onChange: change });
    function go() {
      clearTimeout(timer);
      var q = input.value.trim();
      input.parentElement.style.viewTransitionName = "search-word";
      try { sessionStorage.setItem(CARRY, "1"); } catch (e) {}
      location.href = BASE + (q ? "?q=" + encodeURIComponent(input.value) : "");
    }
    function change() {
      clearTimeout(timer);
      var q = input.value.trim();
      hits = search(q);
      lead = hits.length && hits[0].tier <= 2 && !(hits[1] && hits[1].tier === hits[0].tier) ? hits[0].it : null;
      field.update(lead);
      if (lead) timer = setTimeout(go, 600);
      else if (fold(q).replace(/ /g, "").length >= 2) timer = setTimeout(go, 1500);
    }
    input.form.addEventListener("submit", function (e) { e.preventDefault(); go(); });
    // One Escape does it all, a completion showing or not.
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      clearTimeout(timer);
      input.value = "";
      field.update(null);
      input.blur();
    });
    // Only typing goes: leaving the field stops a pending search.
    input.addEventListener("blur", function () { clearTimeout(timer); });
    document.querySelectorAll(".search-link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        input.focus();
      });
    });
  }

  // --- Home: the hook ---------------------------------------------------------
  function initHome() {
    var input = document.getElementById("hook-input");
    var list = document.getElementById("food-list");
    if (!input || !list) return;
    // The A to Z list holds every food and never-food with its search terms
    // and line; matches are copied from it into the results, best first.
    var rows = Array.prototype.slice.call(list.querySelectorAll(".food-row"));
    var lists = document.getElementById("food-lists");
    var strip = document.getElementById("this-week");
    var everything = document.getElementById("all-foods");
    var results = document.getElementById("results");
    var label = document.getElementById("results-label");
    var found = document.getElementById("found");
    var one = document.getElementById("one-result");
    var oneMore = one.querySelector(".one-more");
    var none = document.getElementById("hook-none");
    var noneAsk = none.querySelector(".ask-name");
    var suggest = document.getElementById("suggest");
    var suggestList = document.getElementById("suggest-list");
    var status = document.getElementById("results-status");
    var alsoLine = document.getElementById("also-line");
    // What can be found: every food and never-food in the A to Z list, by
    // its name, aliases and shared words, completing to its name or an
    // alias; its row, verdict and line come from the list. Each named
    // variety joins once foods.json is in, by its own name and how it is
    // said ("cox", "forced rhubarb"), and shows as "Apples (Cox)".
    var lineOf = {}, ringOf = {};
    function terms(list) { return list.map(function (s) { return words(fold(s)); }); }
    var index = rows.map(function (li) {
      var name = li.querySelector(".food-title").textContent;
      return {
        name: name, label: "", slug: li.dataset.slug, ask: name.toLowerCase(), never: li.classList.contains("never"),
        strings: terms(li.dataset.terms.split("|").filter(Boolean)),
        names: (li.dataset.names || "").split("|").filter(Boolean),
        colour: function () { return getComputedStyle(li).getPropertyValue("--food").trim(); },
        verdict: function () { return li.dataset.verdict; },
        line: function () { return lineOf[li.dataset.slug] || li.dataset.line; },
        ring: function () { return ringOf[li.dataset.slug]; },
        row: function () { var c = li.cloneNode(true); c.hidden = false; return c; },
      };
    });
    loadFoods().then(function (foods) {
      foods.forEach(function (f) {
        var fv = V.foodVerdict(f, WEEK);
        lineOf[f.slug] = V.dateLine(fv.variety, YEAR, TODAY);
        ringOf[f.slug] = f.varieties.indexOf(fv.variety.v);
        fv.varieties.forEach(function (r, k) {
          if (!r.v.name) return;
          var said = V.varietySaid(f, r.v), label = V.varietyLabel(r.v);
          index.push({
            name: f.name, label: label, slug: f.slug, ask: V.varietySaid(f, r.v, true),
            strings: terms([r.v.name, said]), names: [r.v.name, said],
            colour: function () { return r.colour; },
            verdict: function () { return r.verdict; },
            line: function () { return V.dateLine(r, YEAR, TODAY); },
            ring: function () { return k; },
            row: function () { return foodRow({ slug: f.slug, name: f.name, variety: label, colour: r.colour, verdict: r.verdict }); },
          });
        });
      });
      if (input.value.trim()) apply();
    });
    // One hit per food, at its best tier, by tier and then A to Z by food
    // and variety. A food found by a variety alone shows as that variety,
    // the best one; a food found as well or better itself shows as the
    // food. So a food stays one row while letters are typed, and the rows
    // only ever narrow.
    function search(text) {
      var q = words(fold(text));
      if (!q.length) return [];
      var best = {};
      index.forEach(function (it) {
        var t = 0;
        it.strings.forEach(function (c) { var x = tierOf(c, q); if (x && (!t || x < t)) t = x; });
        if (!t) return;
        var b = best[it.slug];
        if (!b || t < b.tier || (t === b.tier && !it.label)) best[it.slug] = { it: it, tier: t };
      });
      return Object.keys(best).map(function (k) { return best[k]; })
        .sort(function (a, b) {
          var x = a.it.name + " " + a.it.label, y = b.it.name + " " + b.it.label;
          return (a.tier - b.tier) || (x < y ? -1 : x > y ? 1 : 0);
        });
    }
    // The single best match, when it is found exactly or at its start
    // and nothing else is found as well: it alone colours the hero and
    // completes the typed word.
    var lead = null;
    // The links Up and Down move the highlight through, in rank order,
    // and which is lit.
    var picks = [], active = -1;
    var slot = input.parentElement;
    var stacked = matchMedia("(max-width: 37.49rem)");
    var field = hookField(input, { stacked: function () { return stacked.matches; }, onChange: apply });

    // The typed text is kept in the address as ?q=, so Back from a food
    // page, or a reload, comes back to the same answer.
    function apply() {
      var q = input.value.trim();
      filter(q);
      field.update(lead);
      var url = new URL(location.href);
      if (q) url.searchParams.set("q", input.value); else url.searchParams.delete("q");
      if (url.href !== location.href) history.replaceState(history.state, "", url);
    }
    // While there is text, the results take the this-week blocks' place
    // and the Everything list is hidden, so matches show in one place,
    // straight away. One exact match is answered: its question, as a food
    // page asks it, its verdict and its date line (a never-food's own
    // line), all one link, then "Also:" and what begins with the text or
    // a later word of it; what has it inside a word is left out. Otherwise
    // every match, of every tier, is a row under a count, in rank order,
    // so each letter typed only ever takes rows away; a list of one is
    // answered too. Nothing at all is the not-found line, with the foods
    // that share its first three letters.
    function filter(q) {
      found.textContent = "";
      suggestList.textContent = "";
      alsoLine.textContent = "";
      strip.hidden = everything.hidden = !!q;
      results.hidden = !q;
      one.hidden = none.hidden = suggest.hidden = alsoLine.hidden = true;
      label.hidden = false;
      light(-1);
      picks = [];
      lead = null;
      answered = null;
      if (!q) { status.textContent = ""; return; }
      var hits = search(q);
      var exact = hits.filter(function (h) { return h.tier === 1; });
      var near = hits.filter(function (h) { return h.tier === 2 || h.tier === 3; });
      var answer = null, also = [], list = [];
      if (exact.length === 1) { answer = exact[0]; also = near; }
      else list = hits;
      if (list.length === 1) { answer = list[0]; list = []; }
      if (hits.length && hits[0].tier <= 2 && !(hits[1] && hits[1].tier === hits[0].tier)) lead = hits[0].it;
      if (answer) {
        var it = answer.it, verdict = it.verdict();
        label.hidden = true;
        one.classList.toggle("is-never", !!it.never);
        one.classList.toggle("is-plain", !!it.never);
        one.style.setProperty("--food", it.colour());
        one.querySelector(".ask-name").textContent = it.ask;
        one.querySelector(".one-word").textContent = verdict + ".";
        one.querySelector(".one-line").textContent = it.line();
        oneMore.hidden = !!it.never;
        oneMore.href = foodUrl(it.slug);
        oneMore.querySelector(".arrow-text").textContent = tellMeAbout(it.name);
        dialFor(it.never ? null : it.slug, it.ring(), it.colour());
        one.hidden = false;
        answered = it.never ? "never" : "link";
        picks = it.never ? [] : [oneMore];
        status.textContent = "1 match: " + it.name + (it.label ? " (" + it.label + ")" : "") + ", " + verdict.toLowerCase() + ".";
        if (also.length) {
          alsoLine.appendChild(document.createTextNode("Also: "));
          also.forEach(function (h, i) {
            if (i) alsoLine.appendChild(document.createTextNode(", "));
            var a = el("a", "food-link", h.it.name + (h.it.label ? " (" + h.it.label + ")" : ""));
            a.href = foodUrl(h.it.slug);
            a.style.setProperty("--food", h.it.colour());
            alsoLine.appendChild(a);
            picks.push(a);
          });
          alsoLine.hidden = false;
          status.textContent += " Also " + also.length + " more.";
        }
      } else if (list.length) {
        label.textContent = list.length + " matches";
        status.textContent = label.textContent;
        list.forEach(function (h) {
          var row = h.it.row();
          found.appendChild(row);
          picks.push(row.querySelector("a"));
        });
      } else {
        label.hidden = true;
        noneAsk.textContent = q.toLowerCase();
        none.hidden = false;
        status.textContent = "No matches.";
        var bit = fold(q).slice(0, 3);
        var close = bit.length < 3 ? [] : index.filter(function (it) {
          return !it.label && it.strings.some(function (c) { return c.join(" ").indexOf(bit) >= 0; });
        }).slice(0, 5);
        close.forEach(function (it) {
          var row = it.row();
          suggestList.appendChild(row);
          picks.push(row.querySelector("a"));
        });
        suggest.hidden = !close.length;
      }
    }
    // The answer's dial is its food page's own, cut to the one ring whose
    // variety gave the verdict; the fetch also warms the page the answer
    // leads to. Its box holds the space while it comes.
    var dialBox = one.querySelector(".one-dial"), dialKey = null;
    function dialFor(slug, ring, colour) {
      var key = slug + "/" + ring + "/" + colour;
      if (key === dialKey && dialBox.firstChild) return;
      dialKey = key;
      dialBox.textContent = "";
      dialBox.hidden = !slug;
      if (!slug) return;
      miniDial(slug, ring, colour).then(function (fig) {
        if (!fig || dialKey !== key) return;
        dialBox.textContent = "";
        dialBox.appendChild(fig);
        markWheel(fig, TODAY);
      });
    }
    // Going to the answer's page, the hero's typed word (the card asks no
    // question of its own here), the card's verdict and its dial are
    // named for the view transition, so each moves into the food page's
    // question, verdict and dial. The names go once this page is shown
    // again, so no other link borrows them.
    var answered = null;
    function nameFor(on) {
      slot.style.viewTransitionName = on ? "food-name" : "";
      one.querySelector(".one-word").style.viewTransitionName = on ? "food-verdict" : "";
      dialBox.style.viewTransitionName = on && dialBox.firstChild ? "food-dial" : "";
    }
    oneMore.addEventListener("click", function () { nameFor(true); });
    window.addEventListener("pagereveal", function (e) {
      (e.viewTransition ? e.viewTransition.finished : Promise.resolve()).then(function () { nameFor(false); });
    });
    function light(i) {
      if (active >= 0) picks[active].classList.remove("is-active");
      active = i;
      if (i < 0) return;
      picks[i].classList.add("is-active");
      picks[i].scrollIntoView({ block: "nearest" });
    }

    // Up and Down move the highlight through the results, Enter opens the
    // lit one (or the best match). The field accepts or dismisses a
    // completion (Tab with none showing moves focus as usual); Escape
    // with none showing clears the input.
    input.addEventListener("keydown", function (e) {
      if (e.defaultPrevented) return;
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && picks.length) {
        e.preventDefault();
        light(Math.max(-1, Math.min(picks.length - 1, active + (e.key === "ArrowDown" ? 1 : -1))));
      } else if (e.key === "Escape" && input.value) {
        e.preventDefault();
        input.value = "";
        apply();
      }
    });
    input.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var go = active >= 0 ? picks[active] : results.hidden || !none.hidden || answered === "never" ? null : picks[0];
      if (go === oneMore) nameFor(true);
      if (go) location.href = go.href;
    });
    var q = new URL(location.href).searchParams.get("q");
    if (q) input.value = q;
    apply();
    // Arriving from the header's search on a wide screen, the hero keeps
    // the focus, the caret after the word, so typing carries on. A phone
    // is left alone: focus there would open the keyboard over the answer.
    var carried = false;
    try { carried = sessionStorage.getItem(CARRY) === "1"; sessionStorage.removeItem(CARRY); } catch (e) {}
    if (carried && !stacked.matches) {
      input.focus({ preventScroll: true });
      input.setSelectionRange(input.value.length, input.value.length);
    }
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
    // On a phone, focus brings the input's line near the top of the
    // screen, a little room between it and the header, so the keyboard
    // does not cover the results.
    function still() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
    input.addEventListener("focus", function () {
      if (!stacked.matches) return;
      var top = slot.getBoundingClientRect().top + window.scrollY - headerHeight() - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: still() ? "auto" : "smooth" });
    });
    if (location.hash === "#search" || location.hash === "#hook-input") input.focus({ preventScroll: true });
    document.querySelectorAll(".search-link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        if (!stacked.matches) window.scrollTo({ top: 0, behavior: still() ? "auto" : "smooth" });
        input.focus({ preventScroll: true });
      });
    });
    refreshRows(lists).then(function () { if (input.value.trim()) apply(); });

    // The this-week blocks for a week other than the baked one: the same
    // blocks index.html bakes, a few foods picked at random from each list.
    // A fresh three on every visit: from the baked lists in the visitor's
    // week, and otherwise from the data.
    if (SAME_WEEK) {
      strip.querySelectorAll(".teaser-foods[data-all]").forEach(function (p) {
        fillTeaser(p, JSON.parse(p.dataset.all), p.dataset.band);
      });
    } else {
      loadFoods().then(function (foods) {
        var now = V.nowLists(foods, [], WEEK, YEAR, TODAY);
        strip.textContent = "";
        function block(key, label, list) {
          var items = V.flatten(list);
          if (!items.length) return;
          var s = el("section", "teaser");
          s.appendChild(el("h2", "teaser-label", label));
          var p = el("p", "teaser-foods");
          fillTeaser(p, items, key);
          s.appendChild(p);
          strip.appendChild(s);
        }
        if (V.flatten(now.arrived).length) block("arrived", "Just arrived", now.arrived);
        else block("onway", "On the way", now.onway);
        block("still", "Great this week", now.still);
        block("last", "Last chance", now.last);
        var p = el("p", "this-week-more");
        p.appendChild(arrowLink(BASE + "now/", "Everything in season this week"));
        strip.appendChild(p);
      });
    }
  }

  // --- Now: the digest for any week ----------------------------------------
  var KIND = { veg: "Veg", fruit: "Fruit", wild: "Wild", herbs: "Herbs", fish: "Fish", meat: "Meat" };
  // One band, the same markup as _includes/band.html: a heading with the
  // count (none when it is nothing), then the foods as one A to Z list
  // (plain), a group per timing (phrase) or a group per kind with its
  // count (kind). No row has a tag. An empty band shows its emptyText,
  // or with none is left out.
  function band(cls, heading, kinds, shape, emptyText) {
    var total = V.flatten(kinds).length;
    if (!total && !emptyText) return document.createTextNode("");
    var s = el("section", "band " + cls);
    s.id = cls;
    var h = el("h2", null, heading + " ");
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
  // Now's four bands, from nowLists, into `box`, under Now's own labels
  // for any week.
  function fillDigest(box, now) {
    box.textContent = "";
    box.appendChild(band("arrived", "Just arrived", now.arrived, "plain"));
    box.appendChild(band("last", "Last chance", now.last, "phrase", "Nothing on its way out."));
    box.appendChild(band("onway", "On the way", now.onway, "phrase", "Nothing due in the next few weeks."));
    box.appendChild(band("still", "Great this week", now.still, "kind", "Nothing at all, which cannot be right."));
  }

  function initNow() {
    var digest = document.getElementById("digest");
    if (!digest) return;
    var groups = JSON.parse(digest.dataset.groups || "[]");
    var title = document.getElementById("week-title");
    var dates = document.getElementById("week-dates");
    var prev = document.getElementById("prev-week"), next = document.getElementById("next-week");
    var back = document.getElementById("week-back");
    var site = document.title.split(" · ").slice(1).join(" · ");
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
        fillDigest(digest, V.nowLists(foods, groups, w, y, offset === 0 ? TODAY : V.midOfToday(w, y)));
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
    measureHeader();
    document.querySelectorAll("svg[data-x0]").forEach(function (svg) { markToday(svg, WEEK); });
    document.querySelectorAll("figure.wheel").forEach(function (f) { markWheel(f, TODAY); });
    fitDials();
    document.querySelectorAll("[data-asof]").forEach(function (n) { n.textContent = V.fmtDateYear(TODAY); });
    initSwitches();
    initFood();
    fitVerdict(document.querySelector("article.food .verdict-word"));
    initAbout();
    initHome();
    initHeadSearch();
    initNow();
    initNotFound();
    syncChartHeads();
    scrollToToday();
    targetRow();
    window.addEventListener("hashchange", targetRow);
    refreshRows(document.querySelector(".also"));
  });

  // What assets/charts.js borrows, so the calendar and the wheel draw
  // their cards and lists exactly as the rest of the site does.
  window.Site = {
    BASE: BASE, TODAY: TODAY, YEAR: YEAR,
    el: el, foodUrl: foodUrl, loadFoods: loadFoods, tellMeAbout: tellMeAbout,
    miniDial: miniDial, markWheel: markWheel, fillDigest: fillDigest,
    headerHeight: headerHeight, arrowMark: arrowMark, arrowLink: arrowLink
  };
})();
