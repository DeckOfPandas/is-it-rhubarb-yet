# Manual

How the site is put together, for whoever works on it next. Rules are
in `CLAUDE.md`; this is the map.

## Shape

- Jekyll, no plugins. Liquid builds every chart as inline SVG at build
  time. JavaScript (`assets/site.js`) does only what needs today's
  date: the today line and hand, the weekly list's reveal, the verdict
  and quotation, and remembering switch choices.
- `_data/foods.yml` is the truth. `_data/groups.yml` names the
  culinary groups and their `kind`. `_data/quotes.yml` is the verdict
  pool. `tools/check-foods.py` validates all three; run it after any
  data edit.
- `tools/make-foods.py` holds the curated food list and regenerates
  `_data/foods.yml` and the `_foods/` stubs. Edit the food list there,
  not in the YAML, or the next run loses the edit. `--wheels` also
  writes `_wheels/` stubs, one standalone SVG per food.
- Pages: `index.html` (calendar, three orderings), `now/` (weekly
  list, three orderings), `year/` (arrivals dials), `is-it/` (index),
  `_layouts/food.html` (one food), `sources/` (where the data is
  from, linked from the footer), `404.html`, and `about.html` (the
  `??` page, in Helen's voice), drafted but `published: false` and
  linked from nowhere until it is. Includes: `calendar.html`,
  `season-cells.html` (one chart row), `season-wheel.html` (one food's
  wheel), `arrivals-dial.html` (one kind's dial).
- Switches are radio groups. CSS `:has()` shows the chosen variant;
  JavaScript only remembers the choice in localStorage. Nothing on the
  site needs JavaScript to be readable.
- The header's search box is a plain GET form to `is-it/` with `q=`.
  `site.js` adds the dropdown, fetching `api/foods.json` on first
  focus. On `is-it/` itself the box narrows the list in place, from
  the box or `?q=`, and so does the state switch at the top (all, in
  season, going out, perfect now, coming in; `?state=`), which classifies each food
  for this week from the same JSON. Matching is whole-word prefix only: every typed
  word must begin a word of the food, a variety or a family name. A
  variety is offered as it is said in full: its `said`, else its name
  then the food's ("Bramley apples"); `foods.yml`'s header says when
  to set `said`.
- The footer is one centred stack in `_layouts/default.html`; the
  GitHub mark, hearts and magnifying glass are includes under
  `_includes/icons/`, copied from helen-triages.

## Drawing rules

- No trigonometry. Arcs are dashed circles with `pathLength` in weeks
  or days; rotation is a `transform`. Keep it that way.
- Colour per food is `--c`; "just about" fades mix `--c` into `--off`
  in oklab. Variety colours override food colours row by row, and the
  checker refuses two rows with the same colour.
- The accent `--accent` is the signature colour. Everything pink reads
  from it.
- Week 1 starts on 1 January, each week is 7 days, week 52 takes the
  remainder. Month starts are the fixed list `1,5,9,14,18,23,27,31,36,40,44,49`
  in every template and in `make-foods.py`; they must agree.

## Working

- Build: `bundle exec jekyll build`. Serve: `bundle exec jekyll serve
  --host 0.0.0.0 --port 9000`. Data check: `python3 -I tools/check-foods.py`.
- Visual checks: Playwright lives under `/opt/playwright`; write a
  small Node script in `tmp/` that requires it from there and
  screenshots pages on port 9000. Full-page shots of tall pages need
  slicing to be legible.
- Helen's instructions win over this file. Hooks reject chained,
  nested or variable-expanding shell commands: one plain command per
  call, or a script in `tmp/`. A command that must reach outside the
  working directory becomes a script in `scripts/` with a fixed
  action and validated arguments, so it can be allowed on sight.
- Commit messages start with a prefix in parentheses: `(feature)`,
  `(fix)`, `(styling)`, `(design)`, `(data)`, `(docs)`, `(refactor)`,
  `(test)`, `(chore)`. Design is not styling.
- From a worktree, `sh scripts/git-diff-main-checkout.sh` shows the
  uncommitted changes in the main checkout; `--stat` summarises,
  `--patch tmp/<name>.patch` writes them for `git apply`.
- Issues and labels go through `scripts/gh-write.sh` (`issue-create`,
  `label-create`), one label per issue, never a burst. Parked work is
  labelled `parked`.

## Not yet explored

- Veg is the crowded dial. Splitting it by group, or thinning the
  May and June labels, is the next thing to try.
- The dial's "first start, longest variety" rule can pick length from
  a different variety than the start (venison, rhubarb).
- Fish rows outside Flying Fish's chart are still general knowledge.
  Cockles, langoustines, brown shrimp, oysters, wild salmon and sea
  trout want a source.
- The counter lines for fish are from memory of MCS guidance and need
  Helen's check against the Good Fish Guide.
- Nothing is drawn for a food itself. Helen offered to draw SVG icons.
- Standalone wheels exist for rhubarb only. The builder is ready when
  the wheel design settles.
- The weekly page is one 570 KB HTML file (17 KB gzipped). Fine for
  now; the first thing to revisit if the food list doubles.
- Mobile layout has not been looked at.
- The quotation pool includes short lines from authors still in
  copyright, by Helen's decision. Keep them to a line and attributed.

## Ways this goes wrong

- Reaching for a plugin, a gem, npm or a raster image. Every one has
  been refused so far and will be again.
- Adding tooltips, hover-to-discover or drag interactions. No.
- Editing `_data/foods.yml` by hand and then running `make-foods.py`.
- Letting a "just about" range touch two in-season ranges without
  checking which way the fade should run; the templates decide by
  adjacency, including across the year end.
- Liquid `assign` inside an include outlives the include. Clear what
  you set when a page includes the same template twice.
- YAML reads `yes`, `no`, `on` and `off` as booleans. Quote them.
- Pushing to `main`, merging, or opening more than one PR in a
  sitting.
