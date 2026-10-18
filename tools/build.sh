#!/bin/sh
# Build the site: bake today's verdicts, then run Jekyll. Any arguments are
# passed on to Jekyll (`sh tools/build.sh --baseurl /x`). To bake for
# another day run `node tools/bake.js --date YYYY-MM-DD` first and then
# Jekyll on its own.
set -eu
node tools/bake.js
bundle exec jekyll build "$@"
