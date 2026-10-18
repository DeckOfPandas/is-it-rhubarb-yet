# Manual

How the site is put together, for whoever works on it next. Rules are
in `CLAUDE.md`; the product is scoped in Helen's scope document (she
drops it in `tmp/inbox/`); this is the map.

## Shape

- Jekyll, no plugins, vanilla JavaScript, inline SVG, three self-hosted
  fonts. Nothing is fetched from anywhere else.
- **One verdict function.** `assets/verdict.js` holds the rules: the
  week grid, the verdict for a variety and for a food, the phrase under
  it, the variety line, the weekly digest's lists and the quotation
  pick. Every page loads it as a classic script; `tools/bake.js`
  requires it under Node and writes `_data/baked.json` (gitignored)
  with today's verdicts, which the Liquid templates read. So the build
  is two steps, `sh tools/build.sh`, and the baked HTML is right for
  link previews, search engines and no-JS visitors, while
  `assets/site.js` recomputes everything for the visitor's own day. The
  thresholds (NEARLY within 3 weeks, JUST within 2, NEW for 2, isolated
  "just about" runs read JUST) are constants at the top of
  `verdict.js`. Tests: `node --test tests/verdict/verdict.test.js`.
- **No calendar dates for seasons.** The data is weekly and mostly came
  from monthly calendars, so a season boundary is said in words chosen
  by the days from today ("Any day now", "In a week or two", "From
  early November", "Back in April"; "For a few more days", "Until late
  December") and names the middle of the data week. The rules are the
  comment over `phrase` in `verdict.js` and §6.5 of the scope document.
  The one calendar date is the "as of" date, which is when an answer
  was true. Lists sort by the same day counts, soonest first.
- **The digest** (`nowLists`) returns each of its four lists split by
  kind of food, `[{kind, items}]`; `flatten` gives one array. The home
  strip and `_includes/band.html` read that shape.
- **Share cards.** `tools/cards.js` draws a 1200 by 630 PNG per food
  and never-food, plus `home.png` and `now.png`, into `_site/cards/`
  after Jekyll: each is a small HTML page with the fonts inlined,
  screenshotted in headless Chromium through the Playwright the
  container and the deploy both have (never committed: the site has no
  raster files in the repository). Every page's `og:image` and
  `twitter:image` point at its card; the card carries the as-of date,
  because chat apps keep the first preview they fetch. `node
  tools/cards.js --out tmp/cards --only rhubarb,home,now` draws a few
  to look at.
- `_data/foods.yml` is the truth. `_data/groups.yml` names the culinary
  families and their `kind`. `_data/never.yml` lists the foods that are
  never in season here, each with a line. `_data/quotes.yml` holds the
  pools, one per verdict including `never`. `tools/check-foods.py`
  validates all four, including the colour rules; run it after any data
  edit.
- `tools/make-foods.py` holds the curated food list and regenerates
  `_data/foods.yml` and the `_foods/` stubs. Edit the food list there,
  not in the YAML, or the next run loses the edit. It does not know the
  18 October palette: a rerun would bring the old colours back, so
  reapply `tmp/inbox/colours.yml` afterwards or, better, teach it the
  new colours first.
- Pages: `index.html` (the hook: "Is it [ ] yet?" with the live-filtered
  list of every food and its verdict), `_layouts/food.html` (one food
  at `/<slug>/`), `_layouts/never.html` (a never-food at `/<slug>/`),
  `now/` (the weekly digest), `calendar/` (the year chart, three
  orders), `wheel/` (the arrivals wheel per kind), `sources/`,
  `404.html` (the not-found verdict, with suggestions), and
  `about.html`, drafted in Helen's voice but `published: false` until
  she signs it off. Data endpoints: `foods.json`, `search.json` (what
  the search box matches against), `season-starts.ics`.
- Includes: `food-row.html` (one food in a list: swatch, name,
  variety, verdict tag, line; `site.js` builds the same markup),
  `band.html` (one band of the digest), `calendar.html` (a sticky
  header SVG over a scrolling body SVG), `season-cells.html`,
  `season-wheel.html`, `arrivals-dial.html`.
- Switches are radio groups. CSS `:has()` shows the chosen variant.
  Only the theme is remembered; the order and kind switches open on
  their default every visit (home by family, calendar by start, wheel
  on veg). Nothing on the site needs
  JavaScript to be readable; the baked verdicts carry their "as of"
  date in the footer and in each food page's data disclosure.
- Matching what people type (`site.js`): case, accents and punctuation
  ignored, `&` reads as "and"; a word is matched under its forms (itself
  and, after a trailing s or ies, its singular) on both sides, so
  "chilli" begins "chillies" and "cherry" begins "cherries"; every typed
  word must begin a candidate word, or at least occur inside one.
  Candidates are names, varieties as they are said, `aliases` (one
  food's own: zucchini) and `also` (shared broader words: every fungus
  answers to "mushrooms").
- Variety names appear as written in the data, mid-sentence too, so
  proper nouns keep their capitals ("Venison Red & Fallow").

## Design

- Rhubarb and custard. Backgrounds are the custard `#fbf3d9` (light)
  and the forcing shed `#16110e` (dark); text is ink, `#1c1714` or
  `#f3ede4`. The one brand colour is `--rhubarb`, `#ff2d78`, the same
  in both themes; it is also rhubarb's food colour and no other food
  comes near it. The pink never carries body-size text: links are ink
  with a pink underline.
- Every food colour passes 3:1 on both backgrounds, so a verdict word
  is simply set in `--food`. "Today" is drawn in ink: the dial hand,
  the calendar line, the wheel hand.
- Three fonts, one job each: Anton for verdict words and titles (never
  a sentence), Atkinson Hyperlegible Next for everything read,
  Newsreader italic for quotations. Anton's letter-spacing has two
  settings by size, `--track-large` at 40px and above and
  `--track-small` below. The WOFF2 files under `assets/fonts/` are
  Google's Latin subsets, 116 KB in all; the budget is 150 KB.
- The verdict word fills the line, but stops at half the viewport's
  height so the date line stays above the fold on a laptop: `site.js`
  measures it after the fonts load. CSS `clamp()` stands in before
  that.
- The question over the verdict is set at the h1's size; the header
  search box is the home hook in small.
- The arrivals wheels are drawn in an 880-unit viewBox with room for
  the longest label at any angle; `site.js` tightens each visible
  wheel's viewBox to its drawn extent, so the wheel fills its width.

## Drawing rules

- No trigonometry. Arcs are dashed circles with `pathLength` in weeks
  or days; rotation is a `transform`. Keep it that way.
- A chart row's colour is `--c`; "just about" fades mix `--c` into
  `--off` in oklab. Variety colours override food colours row by row,
  and the checker refuses two rows with the same colour.
- Week 1 starts on 1 January, each week is 7 days, week 52 takes the
  remainder. Month starts are the fixed list `1,5,9,14,18,23,27,31,36,40,44,49`
  in every template and in `make-foods.py`; they must agree.

## Working

- Build: `sh tools/build.sh` (bake, Jekyll, then the share cards). To
  bake for another day: `node tools/bake.js --date 2026-10-29`, then
  `bundle exec jekyll build` and `node tools/cards.js`. Serve: `bundle
  exec jekyll serve --host 0.0.0.0 --port 9000` (`keep_files` keeps the
  cards through a regeneration). Data check: `python3 -I
  tools/check-foods.py`.
- Deploys: `.github/workflows/pages.yml` on push and daily at 03:30
  UTC; `stale-check.yml` at 07:00 UTC reads the live `/built.json` and
  opens one "Stale build" issue when the baked date is over two days
  old (`tools/stale-check.sh`). Both are schedules, which GitHub pauses
  after 60 days without a commit; the as-of date on every page is the
  last line of defence.
- Visual checks: `node tools/dev/shoot.js <base-url> <label> [--scheme
  dark] [--click <text>] [--type <text>] <page>...`; `--type` types
  into the first visible input, for the hook and the search box.
- Helen's instructions win over this file. Hooks reject chained,
  nested or variable-expanding shell commands: one plain command per
  call, or a script in `tmp/`. A command that must reach outside the
  working directory becomes a script in `scripts/` with a fixed
  action and validated arguments, so it can be allowed on sight.
- Commit messages start with a prefix in parentheses: `(feature)`,
  `(fix)`, `(styling)`, `(design)`, `(data)`, `(docs)`, `(refactor)`,
  `(test)`, `(chore)`. Design is not styling.
- From a worktree, `sh scripts/git-diff-main-checkout.sh` shows the
  uncommitted changes in the main checkout.
- Issues and labels go through `scripts/gh-write.sh`, never a burst.

## Not yet done

Phase 2 and 3 of the scope document, in short:

- Per-food reminder `.ics` at `/remind/<slug>.ics`, and the "Remind me
  when it's back" line on NO, NEARLY and JUST pages that links to it.
- Calendar: a mobile plan. Rows already link, `#<slug>` marks and
  scrolls to a food, and the month header sticks.
- About page copy from Helen; the signature link to it.
- `foods/<slug>.json`, and the JSON shape on the sources page.
- Wheel: the Veg view is still unreadable in June, and unreadable on a
  phone. Cut it or fix it.
- Data quality: every `source: general` row (the checker warns on each),
  the pollock/pollack spelling, stored crops, long `avail` tails, the
  BBC/NCGM disagreements in the `note` fields.
- Easter eggs.

## Ways this goes wrong

- Reaching for a plugin, a gem, npm or a raster image. Every one has
  been refused so far and will be again.
- Adding tooltips, hover-to-discover or drag interactions. No.
- Editing `_data/foods.yml` by hand and then running `make-foods.py`.
- Writing verdict logic anywhere but `assets/verdict.js`. The Liquid
  templates only read `_data/baked.json`.
- Building with `bundle exec jekyll build` alone and wondering why the
  verdicts are empty: bake first.
- Using Liquid's `capitalize` on a phrase with a month in it; it
  lowercases the rest.
- Writing a calendar date into a season phrase. The as-of date is the
  only one allowed.
- Reading a Liquid hash with a nested lookup, `baked.now[parts[0]]`:
  assign the key first.
- Letting a "just about" range touch two in-season ranges without
  checking which way the fade should run; the templates decide by
  adjacency, including across the year end.
- Liquid `assign` inside an include outlives the include. Clear what
  you set when a page includes the same template twice.
- YAML reads `yes`, `no`, `on` and `off` as booleans. Quote them.
- Pushing to `main`, merging, or opening more than one PR in a
  sitting.
