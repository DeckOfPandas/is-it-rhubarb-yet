# Manual

How the site is put together, for whoever works on it next. Rules are
in `CLAUDE.md`; design work arrives as GitHub issues; this is the map.

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
  comment over `phrase` in `verdict.js`. The one calendar date is the
  "as of" date, which is when an answer was true. Dates are plain
  numbers, never ordinals: "19 October 2026", "15–21 October".
- **The digest** (`nowLists`) returns each of its four lists split by
  kind of food, `[{kind, items}]`, just arrived and great now A to Z,
  last chance and on the way soonest first. `flatten` gives one array,
  `azList` one array A to Z, and `byPhrase` regroups a list by one
  timing per food, `[{phrase, items}]`, soonest first and A to Z
  within: `timing` splits a two-part phrase into the `when` that groups
  the food ("In a week or two") and the `early` part shown beside it
  ("first ones any day now", "a few about now"). `bake.js` bakes them
  as `phrases` and `az`. The Now page shows just arrived as one A to Z
  list, last chance and on the way grouped by timing, and great now
  grouped by kind with counts.
- **Naming a variety.** A named variety is a type (forced, maincrop)
  or, with `cultivar: true` in the data, a cultivar (Cox, Conference).
  `varietyLabel` gives its list form, in muted brackets after the food,
  a type lower-cased and a cultivar as written: "Rhubarb (forced)",
  "Apples (Cox)". `varietySaid` gives its sentence form, the `said`
  field or its name then the food's, "Forced rhubarb", "Cox apples",
  with a type lower-cased mid-sentence and a cultivar never. Lists sort
  by food, then variety. `bake.js` bakes `labels` per variety for the
  calendar and the feed. Separate foods keep their own names (Wild
  garlic, Wood pigeon), and paired names capitalise both (Marjoram &
  Oregano).
- **Share cards.** `tools/cards.js` draws a 1200 by 630 PNG per food
  and never-food, plus `home.png` and `now.png` (the wordmark or the
  Now title, then the week's three lines as home's teasers have them,
  dated; every other page uses the home card), into `_site/cards/`
  after Jekyll: each is a small HTML page with the fonts inlined,
  screenshotted in headless Chromium through the Playwright the
  container and the deploy both have (never committed: the site has no
  raster files in the repository). Every page's `og:image` and
  `twitter:image` point at its card; the card carries the as-of date,
  because chat apps keep the first preview they fetch. `node
  tools/cards.js --out tmp/cards --icons tmp/icons --only
  rhubarb,home,now,icons` draws a few to look at.
- **Icons.** The favicon (32px), the Android icon (192px) and the
  Apple touch icon (180px) are "IIRY" in Anton, light ink on the shed,
  the R in pink and underlined in it. `tools/cards.js` draws them into
  `_site/icons` at build, like the cards: one square page shot at each
  size, never committed.
- `_data/foods.yml` is the truth: edit it by hand. `_data/groups.yml`
  names the culinary families and their `kind`. `_data/never.yml` lists
  the foods that are never in season here, each with a line.
  `_data/quotes.yml` holds the pools, one per verdict including
  `never`. `tools/check-foods.py` validates all four, including the
  colour rules and the `said` and `cultivar` fields; run it after any
  data edit. A food's page needs its `_foods/<slug>.md` stub.
- `tools/make-foods.py` derived `_data/foods.yml` and the stubs once
  from the New Covent Garden Market PDF and is kept for provenance. It
  knows none of the hand edits since (the palette, the cultivars, the
  names): rerunning it overwrites them.
- A renamed food keeps its old address as a page that forwards:
  `grey-squirrel/index.html` sends `/grey-squirrel/` to `/squirrel/`,
  and the checker keeps that slug from ever being a food's.
- Pages: `index.html` (the hook: "Is it [ ] yet?" with the live-filtered
  list of every food and its verdict), `_layouts/food.html` (one food
  at `/<slug>/`), `_layouts/never.html` (a never-food at `/<slug>/`),
  `now/` (the weekly digest), `calendar/` (the year chart, three
  orders), `wheel/` (the arrivals wheel per kind), `sources/`,
  `404.html` (the not-found verdict, with suggestions), and
  `about.html`, Helen's copy, reached from the signature hearts in the
  footer; its food count and dinner food come from the data. Data
  endpoints: `foods.json`, `search.json` (what the not-found page's
  suggestions match against), `season-starts.ics`.
- Includes: `food-row.html` (one food in a list, one link: swatch,
  name, variety in brackets, an earlier timing, and with `tag` and
  `leader` on, the default, the verdict tag right-aligned at the row's
  end on a dotted leader; a list whose heading already says the verdict
  passes `tag=false`; `site.js` builds the same markup in `foodRow`),
  `food-group.html` (a group inside a section: an Atkinson capitals
  label, optionally with a count, over its rows, a hairline above every
  group but the first; home's families, Now's timings and kinds;
  `foodGroup` in `site.js`), `band.html` (one band of the digest, in
  the shape `plain`, `phrase` or `kind`), `calendar.html` (a sticky
  header SVG over a scrolling body SVG), `season-cells.html`,
  `season-wheel.html`, `arrivals-dial.html`.
- Every multi-column food list reads down each column, then across
  (CSS `columns`), so A to Z reads down. A list in columns cannot be
  reordered in place, so home draws its list twice, by family and A to
  Z, and shows typed matches in a list of their own.
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
  food's own: zucchini, pigeon) and `also` (shared broader words: every
  fungus answers to "mushrooms").

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
- Three fonts, chosen by asking in order: a quotation is Newsreader
  italic; a verdict or the name of a page or section is Anton in
  capitals; everything else is Atkinson Hyperlegible Next. Anton never
  sets a sentence, a link or a control; Atkinson uses 400 and 700 only,
  and capitals only for small labels at +0.06em to +0.07em; an Anton
  label heads a section and an Atkinson one a group inside it. The
  rules head the fonts section of `assets/site.css`. Anton's
  letter-spacing has two settings by size, `--track-large` at 40px and
  above and `--track-small` below. The WOFF2 files under
  `assets/fonts/` are Google's Latin subsets, 116 KB in all; the budget
  is 150 KB.
- The verdict word fills the line, but stops at half the viewport's
  height so the date line stays above the fold on a laptop: `site.js`
  measures it after the fonts load. CSS `clamp()` stands in before
  that.
- The question over the verdict is set at the h1's size.
- **Logo.** IS IT RHUBARB YET? in Anton, RHUBARB pink and underlined
  in pink, the line exactly the word's width, in the header, the hero
  and the cards. It does not change on hover.
- **Header.** NOW, CALENDAR, WHEEL and a magnifier at the top right of
  every page, home included, in the nav style: Atkinson 700 capitals,
  13px, +0.07em, muted, the current page in ink and underlined in pink,
  as the others are on hover or focus. The wordmark is on the left of the same row, or on
  a phone on a row of its own under the nav, so the nav never moves.
  Home has no wordmark and no line under its header. The magnifier
  links to `/#search`, which names no element, so the page does not
  scroll; `site.js` puts the cursor in the input, and on home scrolls
  back up to it.
- **Home hero.** The logo is the input. At rest it reads IS IT RHUBARB
  YET?, the placeholder RHUBARB in pink capitals over its underline with
  a blinking pink caret at its start, a normal space either side of the
  word; on focus the placeholder dims. Typed
  text is capitals in ink; once it names one food, or is one food's name
  or alias in full, the word and its underline take that food's colour.
  `site.js` draws the underline at the word's width and the caret, and
  sets a word too long for its room smaller until it fits. One line on
  a wide screen, three below 600px. The input is not focused on load,
  so the hero rests as the logo; the first letter typed anywhere on
  home goes into it.
- **Home teasers.** JUST ARRIVED (or ON THE WAY when nothing has),
  GREAT NOW and LAST CHANCE, each an Anton label over a random three
  foods in their colours and "and N more", which links to Now, then
  "Everything in season this week →".
- **Arrow links.** A link that leads on ("Everything in season this
  week", a food page's "Ask about something else" and "See the whole
  year") has an arrow after it and no underline at rest; on hover its
  words underline and the arrow, inside the link, does not.
- **Food page.** Up to six foods of the same family that are YES,
  headed "Also great this week" ("Great this week" when the food is
  NO), then "and N more", which links to Now.
- **Hover.** A food's name underlines in pink on hover, in lists and on
  the calendar, never its variety or timing, and never changes weight
  or size. SVG text draws its underline in its own fill, so the
  calendar turns the name's tspan pink and an inner tspan keeps the
  words in ink.
- **Footer.** Every label in the nav style: SOURCE DATA · CALENDAR FEED
  (to the feed's section on Source data) · JSON; ABOUT; the theme
  switch; GitHub; the licences and the as-of date, smaller and
  fainter; the signature hearts, which do not change on hover.
- **Now.** The title follows the week shown ("this week", "next week",
  "last week", or none), over one muted line, "‹ 15–21 October ›".
  Weeks run through real years, a year either way of this week; the
  address carries `week=` and, in another year, `year=`. Sections are
  parted by space; groups inside them by a hairline. Just arrived is
  left out in a week when nothing has arrived.
- Atkinson Hyperlegible Next's zero is slashed, and the font has no
  feature to open it.
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
  into the first visible input, the hook's.
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

Each an open issue:

- #41 Per-food reminder `.ics` at `/remind/<slug>.ics`, and the "Remind
  me when it's back" line on NO, NEARLY and JUST pages that links to it.
- #42 Calendar: a mobile plan. Rows already link, `#<slug>` marks and
  scrolls to a food, and the month header sticks.
- #43 `foods/<slug>.json`, and the JSON shape on the sources page.
- #44 Wheel: the Veg view is still unreadable in June, and unreadable
  on a phone. Cut it or fix it.
- #45 Data quality: every `source: general` row (the checker warns on
  each), the pollock/pollack spelling, stored crops, long `avail` tails,
  the BBC/NCGM disagreements in the `note` fields.
- #46 Easter eggs.

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
