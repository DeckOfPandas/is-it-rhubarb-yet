#!/bin/sh
# Build the site: bake today's verdicts, run Jekyll, then draw the share
# cards into the built site. Any arguments are passed on to Jekyll
# (`sh tools/build.sh --baseurl /x`). To bake for another day run
# `node tools/bake.js --date YYYY-MM-DD` first and then the other two
# steps on their own.
set -eu
node tools/bake.js
bundle exec jekyll build "$@"
node tools/cards.js --out _site/cards
