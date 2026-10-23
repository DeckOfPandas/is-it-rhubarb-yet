/* Matching what people type: one ranking for home's hero, the header's
   search and the not-found page, so a food found in one is found in the
   others the same way. Every page loads this as a classic script
   (window.Search) before site.js, and tests/site requires it under Node.
   No dependencies and no DOM.

   An index is an array of items, each {slug, name, label, strings, names}
   and whatever else the page needs: `label` is "" for a whole food and a
   variety's label ("Cox", "forced") for a variety's own entry; `strings`
   is what it can be found by, each a folded word array from strings();
   `names` are what a typed word completes to. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Search = factory();
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Case, accents and punctuation are ignored and "&" reads as "and".
  function fold(s) {
    return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function words(s) { return s.split(" ").filter(Boolean); }
  // Singular and plural are equal: "leek" is "leeks", "cherry" is
  // "cherries", "tomato" is "tomatoes".
  function singular(w) { return w.replace(/ies$/, "y").replace(/oes$/, "o").replace(/([^s])s$/, "$1"); }
  // Candidate strings as folded word arrays.
  function strings(list) { return list.map(function (s) { return words(fold(s)); }); }

  // A candidate (a food's name, alias or shared word, a variety's name or
  // how it is said, each as folded words) is ranked by how the typed
  // words meet it: 1, exactly; 2, at its start; 3, at the start of a
  // later word. Text found only inside a word is no match: "ape" finds
  // nothing. The last typed word, still being typed, may also begin its
  // word.
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
    return 0;
  }

  // The hits for a typed text: one per food (by slug) at its best tier,
  // as [{it, tier}], by tier and then A to Z by food and variety. A food
  // found by a variety alone shows as that variety, the best one; a food
  // found as well or better itself shows as the food. So a food stays
  // one row while letters are typed, and the rows only ever narrow.
  function search(index, text) {
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
        var x = a.it.name + " " + (a.it.label || ""), y = b.it.name + " " + (b.it.label || "");
        return (a.tier - b.tier) || (x < y ? -1 : x > y ? 1 : 0);
      });
  }
  // The single best match, when it is found exactly or at its start and
  // nothing else is found as well: it alone colours the hero and
  // completes the typed word. Null otherwise.
  function leadOf(hits) {
    return hits.length && hits[0].tier <= 2 && !(hits[1] && hits[1].tier === hits[0].tier) ? hits[0].it : null;
  }
  // When nothing matches: up to n whole foods sharing the text's first
  // three letters anywhere in a candidate, for "Did you mean".
  function nearest(index, text, n) {
    var bit = fold(text).slice(0, 3);
    if (bit.length < 3) return [];
    return index.filter(function (it) {
      return !it.label && it.strings.some(function (c) { return c.join(" ").indexOf(bit) >= 0; });
    }).slice(0, n);
  }
  // Two names the same once folded, singular and plural alike.
  function sameWords(a, b) {
    return words(fold(a)).map(singular).join(" ") === words(fold(b)).map(singular).join(" ");
  }

  return { fold: fold, words: words, singular: singular, strings: strings, tierOf: tierOf,
    search: search, leadOf: leadOf, nearest: nearest, sameWords: sameWords };
}));
