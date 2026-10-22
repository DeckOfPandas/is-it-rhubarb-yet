# Manual

The quickstart for whoever works on this site next. The rules are in
`CLAUDE.md`. The design system is `docs/design.md`, the data model and
sources `docs/data.md`, and the dated decision log `docs/decisions.md`:
when a change argues with one of those, read the decision first.

## What it is

"Is it rhubarb yet?" A visitor types a food and gets one word, very
large, in the food's colour: YES, JUST, YES-ISH, NEARLY, NO or NEVER,
with a date line in plain words, a quotation and a dial of the food's
year. Then Now (this week's digest), the calendar (every food, week by
week) and the wheel (where each season begins). 173 foods and 31
never-foods, every one with named sources. Live at
https://deckofpandas.github.io/is-it-rhubarb-yet/.

## How it is built

- Jekyll with no plugins, vanilla JavaScript, inline SVG, three
  self-hosted fonts. Nothing is fetched from anywhere else; no npm, no
  gems beyond the Gemfile, no raster image in the repository.
- **One verdict function.** `assets/verdict.js` holds every rule: the
  week grid, the verdict for a ring and for the whole food, the phrase
  under it, the ring order, the weekly digest and the quotation pick.
  Every page loads it, and `tools/bake.js` requires it under Node to
  write `_data/baked.json` (gitignored) with today's verdicts, which the
  Liquid templates read. So the baked HTML is right for link previews,
  search engines and no-JS visitors, and `assets/site.js` recomputes
  everything for the visitor's own day. Verdict logic goes nowhere else.
- `assets/site.js` runs on every page (search, the fitted verdict, the
  dials, Now for other weeks); `assets/charts.js` only on the calendar
  and wheel pages (time travel, popovers, the magnifier). `assets/site.css`
  holds every token; its comments are the design system's source.
- `tools/cards.js` draws the share cards and the icons into `_site/`
  after Jekyll, with the Playwright the container and the deploy have.

## Build, serve, test

```
sh tools/build.sh                                   # bake, Jekyll, cards
bundle exec jekyll serve --host 0.0.0.0 --port 9000 # serve _site (keep_files keeps the cards)
python3 -I tools/check-foods.py                     # the data checker, after any data edit
node --test tests/verdict/verdict.test.js           # the verdict rules
node --test tests/cards/cards.test.js               # card and icon sizes, after a build
python3 -m pytest                                   # the dev-container kit, not the site
```

`bundle exec jekyll build` alone leaves the verdicts empty: bake first.
To bake for another day, `node tools/bake.js --date 2026-10-29`, then
Jekyll and `node tools/cards.js --out _site/cards`. The ports Helen can
reach are in `.devcontainer/kit.env`.

Visual checks: `node tools/dev/shoot.js <base-url> <label> [--scheme
dark] [--click <text>] [--type <text>] <page>...` writes `tmp/shots/`;
`node tools/dev/shots.js --base <url> [--full yes]` takes the whole
design-review set at 390, 820 and 1280 into `screenshots/` (gitignored);
`node tools/dev/slice-png.js tmp/shots/<file>.png` cuts a tall one.
`/kitchen-sink/` shows every shared component at rest, hovered and
focused; a new shared component goes there too.

## Deploy

`.github/workflows/pages.yml` builds and publishes on every push to
`main` and daily at 03:30 UTC (04:30 BST), since the verdicts are baked
for the build day. `stale-check.yml` at 07:00 UTC reads the live
`built.json` and opens one "Stale build" issue when the baked day is over
two days old. Both are schedules, which GitHub pauses after 60 days
without a commit, so `keepalive.yml` runs weekly and pushes an empty
commit to `main` once the last commit is 45 days old (the one thing
that commits on `main` without a pull request); the as-of date in every
footer is the last line of defence.

## Where things live

| What | Where |
|---|---|
| The seasons, one entry per food (the schema is its header comment) | `_data/foods.yml` |
| Families and kinds; never-foods; quotations; the source register | `_data/groups.yml`, `never.yml`, `quotes.yml`, `sources.yml` |
| One stub per food (the page, its calendar feed) and per never-food | `_foods/`, `_remind/`, `_never/` |
| Home, Now, the calendar, the wheel, About, Source data, the 404 | `index.html`, `now/`, `calendar/`, `wheel/`, `about.html`, `sources/`, `404.html` |
| A food page, a never-food page, the chrome | `_layouts/food.html`, `never.html`, `default.html` |
| Rows, groups, bands, the charts, the time controls | `_includes/` |
| Endpoints: the data, the search index, the baked day, the feeds | `foods.json`, `search.json`, `built.json`, `season-starts.ics`, `/remind/<slug>.ics` |
| A renamed food's old address | `grey-squirrel/`, `button-mushrooms/` (a page that forwards) |
| Provenance scripts, never rerun | `tools/make-foods.py`, `tools/merge-bundle.py` |

## The rules that matter most

- `_data/foods.yml` is the truth; edit it by hand and run the checker.
  Never rerun `make-foods.py` or `merge-bundle.py`.
- Every note in the data file is printed for visitors.
- No calendar date for a season, ever; the as-of date is the only date.
- Every font size and every gap is a token in `site.css`. Three fonts,
  one job each. One brand colour, which never carries body-size text.
- A food is a row, a card or a page, never a fourth thing.
- No trigonometry in the templates; arcs are dashed circles.
- Month starts are the fixed list `1,5,9,14,18,23,27,31,36,40,44,49`
  wherever they appear; they must agree.
- YAML reads `yes`, `no`, `on` and `off` as booleans: quote them. Liquid
  `assign` inside an include outlives the include, `capitalize`
  lower-cases the rest of a phrase, and a nested hash lookup needs the
  key assigned first.
- Commit messages start with `(feature)`, `(fix)`, `(styling)`,
  `(design)`, `(data)`, `(docs)`, `(refactor)`, `(test)` or `(chore)`;
  design is not styling. One PR per sitting; Helen merges.

What is not yet done is the open issues on GitHub.
