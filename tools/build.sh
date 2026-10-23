#!/bin/sh
# Build the site: bake today's verdicts, run Jekyll, fold the calendar
# feeds, write the per-food JSON, then draw the share cards into the
# built site. Any arguments are passed on to Jekyll (`sh tools/build.sh
# --baseurl /x`). To bake for another day run `node tools/bake.js --date
# YYYY-MM-DD` first and then the other steps on their own.
set -eu
node tools/bake.js
bundle exec jekyll build "$@"
node tools/fold-ics.js _site
node tools/food-json.js _site
node tools/cards.js --out _site/cards
