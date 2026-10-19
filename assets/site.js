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

  // A link with an arrow after its words, the same markup as the templates'
  // .arrow-link: the words underline on hover, the arrow never does.
  function arrowLink(href, text) {
    var a = el("a", "arrow-link");
    a.href = href;
    a.appendChild(el("span", "arrow-text", text));
    var arrow = el("span", "arrow", "→"); arrow.setAttribute("aria-hidden", "true");
    a.appendChild(arrow);
    return a;
  }

  // A home teaser's foods: STRIP_PICK of them at random, each a link in its
  // colour, then "and N more", which links to Now.
  function fillTeaser(p, items) {
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
      var m = el("a", "more-link", "and " + more + " more"); m.href = BASE + "now/";
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
        var m = el("a", "more-link"); m.href = BASE + "now/";
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
      section.querySelector(".more-link").textContent = "and " + more + " more";
      section.hidden = false;
    }
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
    var none = document.getElementById("hook-none");
    var noneLine = none.querySelector(".hook-none");
    var suggest = document.getElementById("suggest");
    var suggestList = document.getElementById("suggest-list");
    var status = document.getElementById("results-status");
    var alsoLine = document.getElementById("also-line");
    // What can be found: every food and never-food in the A to Z list, by
    // its name, aliases and shared words, completing to its name or an
    // alias; its row, verdict and line come from the list. Each named
    // variety joins once foods.json is in, by its own name and how it is
    // said ("cox", "forced rhubarb"), and shows as "Apples (Cox)".
    var lineOf = {};
    function terms(list) { return list.map(function (s) { return words(fold(s)); }); }
    var index = rows.map(function (li) {
      var name = li.querySelector(".food-title").textContent;
      return {
        name: name, label: "", slug: li.dataset.slug, ask: name.toLowerCase(),
        strings: terms(li.dataset.terms.split("|").filter(Boolean)),
        names: (li.dataset.names || "").split("|").filter(Boolean),
        colour: function () { return getComputedStyle(li).getPropertyValue("--food").trim(); },
        verdict: function () { return li.dataset.verdict; },
        line: function () { return lineOf[li.dataset.slug] || li.dataset.line; },
        row: function () { var c = li.cloneNode(true); c.hidden = false; return c; },
      };
    });
    loadFoods().then(function (foods) {
      foods.forEach(function (f) {
        var fv = V.foodVerdict(f, WEEK);
        lineOf[f.slug] = V.dateLine(fv.variety, YEAR, TODAY);
        fv.varieties.forEach(function (r) {
          if (!r.v.name) return;
          var said = V.varietySaid(f, r.v), label = V.varietyLabel(r.v);
          index.push({
            name: f.name, label: label, slug: f.slug, ask: V.varietySaid(f, r.v, true),
            strings: terms([r.v.name, said]), names: [r.v.name, said],
            colour: function () { return r.colour; },
            verdict: function () { return r.verdict; },
            line: function () { return V.dateLine(r, YEAR, TODAY); },
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

    // A hidden span in the same font measures the value, or the placeholder
    // when there is none. On one line the input is as wide as its word and
    // any completion, up to the room "Is it" and "yet?" leave; when the
    // question stacks, the input is the full width. Either way a word too
    // long for its room is set smaller until it fits, the completion
    // counted, so accepting it does not make the word jump. The underline
    // is the typed word's width; the resting caret stands at the word's
    // start. The input is a hair wider than its word, room for the real
    // caret after the last letter, so the word sits a normal space from
    // "Is it" and from "yet?".
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
    var line = input.closest(".hook-line");
    var stacked = matchMedia("(max-width: 37.49rem)");
    var CARET_ROOM = 3;
    function size() {
      ruler.textContent = input.value || input.placeholder;
      slot.classList.toggle("has-value", !!input.value);
      var text = ruler.getBoundingClientRect().width;
      if (!text) return;
      var full = text;
      if (ghost) { ruler.textContent = input.value + ghost; full = ruler.getBoundingClientRect().width; }
      var w = full + CARET_ROOM;
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
      layer.style.fontSize = input.style.fontSize;
      layer.style.top = (input.offsetTop + input.clientTop) + "px";
      layer.style.height = input.clientHeight + "px";
    }

    // Ghost completion: when the best match's name, or one of its aliases,
    // begins with what is typed, the rest of it shows after the typed text.
    // None when the text is already a whole name, while an input method
    // is composing, or after Escape until the next keystroke. Folding can
    // change a name's length ("&" is "and"), so the typed part of the name
    // is the shortest slice that folds to the typed text, and the space
    // after it too when the typed text ends in one.
    var ghost = "", ghostFull = "", composing = false, dismissed = false;
    var WORDY = /[\p{L}\p{N}]/u;
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
    function accept() {
      input.value = ghostFull;
      input.setSelectionRange(ghostFull.length, ghostFull.length);
      apply();
    }
    // A tap on the faded part accepts it; the input keeps its focus.
    layerRest.addEventListener("pointerdown", function (e) { e.preventDefault(); if (ghost) accept(); });
    input.addEventListener("compositionstart", function () { composing = true; complete(); size(); });
    input.addEventListener("compositionend", function () { composing = false; apply(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    window.addEventListener("resize", size);

    // The typed word and its underline take the lead's colour; with no
    // lead, as when the text is only found inside words, they stay ink
    // over the pink.
    function colour() {
      input.classList.toggle("is-food", !!lead);
      if (lead) slot.style.setProperty("--food", lead.colour());
    }

    function apply() {
      var q = input.value.trim();
      filter(q);
      complete();
      size();
      colour();
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
        one.href = foodUrl(it.slug);
        one.style.setProperty("--food", it.colour());
        one.querySelector(".one-ask").textContent = "Is it " + it.ask + " yet?";
        one.querySelector(".one-word").textContent = verdict + ".";
        one.querySelector(".one-line").textContent = it.line();
        one.hidden = false;
        picks = [one];
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
        noneLine.textContent = "";
        noneLine.appendChild(document.createTextNode("Is it " + q + " yet? Literally no idea. If that's an actual thing, please "));
        var a = el("a", null, "tell us"); a.href = noneLine.dataset.issues;
        noneLine.appendChild(a);
        noneLine.appendChild(document.createTextNode("."));
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
    function light(i) {
      if (active >= 0) picks[active].classList.remove("is-active");
      active = i;
      if (i < 0) return;
      picks[i].classList.add("is-active");
      picks[i].scrollIntoView({ block: "nearest" });
    }

    input.addEventListener("input", function () { dismissed = false; apply(); });
    // Up and Down move the highlight through the results, Enter opens the
    // lit one (or the best match). Tab, End, or → with the caret at the
    // end accept a completion; Tab with none showing moves focus as
    // usual. Escape dismisses a completion, then clears the input.
    input.addEventListener("keydown", function (e) {
      var atEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && picks.length) {
        e.preventDefault();
        light(Math.max(-1, Math.min(picks.length - 1, active + (e.key === "ArrowDown" ? 1 : -1))));
      } else if (ghost && !e.isComposing && ((e.key === "Tab" && !e.shiftKey) || e.key === "End" || (e.key === "ArrowRight" && atEnd))) {
        e.preventDefault();
        accept();
      } else if (e.key === "Escape" && ghost) {
        e.preventDefault();
        dismissed = true;
        complete();
        size();
      } else if (e.key === "Escape" && input.value) {
        e.preventDefault();
        input.value = "";
        apply();
      }
    });
    input.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var go = active >= 0 ? picks[active] : results.hidden || !none.hidden ? null : picks[0];
      if (go) location.href = go.href;
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
    // On a phone, focus brings the input's line near the top of the
    // screen, a little room above it, so the keyboard does not cover the
    // results.
    function still() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
    input.addEventListener("focus", function () {
      if (!stacked.matches) return;
      var top = slot.getBoundingClientRect().top + window.scrollY - 16;
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
        fillTeaser(p, JSON.parse(p.dataset.all));
      });
    } else {
      loadFoods().then(function (foods) {
        var now = V.nowLists(foods, [], WEEK, YEAR, TODAY);
        strip.textContent = "";
        function block(label, list) {
          var items = V.flatten(list);
          if (!items.length) return;
          var s = el("section", "teaser");
          s.appendChild(el("h2", "teaser-label", label));
          var p = el("p", "teaser-foods");
          fillTeaser(p, items);
          s.appendChild(p);
          strip.appendChild(s);
        }
        if (V.flatten(now.arrived).length) block("Just arrived", now.arrived);
        else block("On the way", now.onway);
        block("Great now", now.still);
        block("Last chance", now.last);
        var p = el("p", "this-week-more");
        p.appendChild(arrowLink(BASE + "now/", "Everything in season this week"));
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
    // count (kind). No row has a tag. An empty band shows its emptyText,
    // or with none is left out.
    function band(cls, heading, kinds, shape, emptyText) {
      var total = V.flatten(kinds).length;
      if (!total && !emptyText) return document.createTextNode("");
      var s = el("section", "band " + cls);
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
        digest.appendChild(band("arrived", "Just arrived", now.arrived, "plain"));
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
