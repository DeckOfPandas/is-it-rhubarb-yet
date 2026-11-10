# Claude Code Rules for "Is It Rhubarb Yet?"

@.claude/kit/RULES.md

## This project
The rules above come from the kit and change only through `/kit-sync`. This
project's own rules go here. A rule that deliberately differs from the kit's
says so: "this project overrides the kit's <rule>: …".

- **Build: `sh tools/build.sh`.** It bakes today's verdicts with Node, runs
  Jekyll, then folds the feeds and writes the per-food JSON and share cards.
  `bundle exec jekyll build` alone leaves the verdicts empty.
- **Serve** after a build, with the kit's server rule:
  `bundle exec jekyll serve --host 0.0.0.0 --port <container port>`.
  `keep_files` keeps the post-build output.
- **Check the data** after any edit to it: `python3 -I tools/check-foods.py`.
- **Tests:**
  - kit and Python: `python3 -m pytest`;
  - before a build: `node --test tests/verdict/verdict.test.js
    tests/site/search.test.js tests/site/magnifier.test.js`;
  - after a build: `node --test tests/cards/cards.test.js
    tests/build/endpoints.test.js tests/build/charts.test.js
    tests/build/shots.test.js`.

  The Pages workflow runs the check, both node groups and the build, and any
  red step stops the deploy, the daily rebake included.
- **The design-review screenshot set** is `node tools/dev/shots.js`; run it
  with `--base` set to the URL you are serving.
- **The seasons review page** is `node tools/dev/before-after.js` after a
  build: each food's old dial beside its new one, at
  `<base>/dev/before-after/`. A rebuild wipes it; nothing deploys it.
- **The site draws from `_data/shown.json`**, not `foods.yml`: bake.js
  writes it from `tools/shown.js`, which hides `proposed` and `no_supply`
  rings and the research's keys. Seasons are corrected in
  `research/data/`, then `python3 research/build/merge.py`, `compare.py`,
  `report_compare.py` and `propose.py`, then copy
  `research/out/proposed/` over `_data/`.
- The site is Jekyll with no plugins, vanilla JS and inline SVG only. No
  raster images, no npm, no new gems without asking.
- **`_data/foods.yml` is the source of truth for seasons.**
  `tools/make-foods.py` derived it once from the New Covent Garden Market PDF
  and is kept for provenance; rerunning it overwrites hand edits.
