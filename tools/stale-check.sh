#!/bin/sh
# Fail, and open an issue, when the published site was baked too long ago.
# Run by .github/workflows/stale-check.yml with GH_TOKEN and GH_REPO set;
# needs curl, jq, date and gh, which GitHub's runners have.
#
# usage: sh tools/stale-check.sh <built.json url> <max days>
#
# Reads "asof" (YYYY-MM-DD) from built.json. Beyond <max days>, it opens an
# issue titled "Stale build: ..." unless one is already open, and exits 1.
# A site that cannot be fetched or has no date counts as stale.
set -eu

url="$1"
max="$2"

asof="$(curl --silent --show-error --fail --max-time 30 "$url" | jq -r '.asof // empty')" || asof=""
today="$(date -u +%Y-%m-%d)"
if [ -z "$asof" ]; then
  age="unknown"
  problem="built.json at $url has no asof date, or could not be fetched"
else
  age=$(( ( $(date -u -d "$today" +%s) - $(date -u -d "$asof" +%s) ) / 86400 ))
  problem="the published site was baked for $asof, $age days ago (today is $today)"
fi

if [ "$age" != "unknown" ] && [ "$age" -le "$max" ]; then
  echo "fresh: $problem"
  exit 0
fi

echo "stale: $problem"
open="$(gh issue list --repo "$GH_REPO" --state open --search 'Stale build in:title' --json number --jq 'length')"
if [ "$open" = "0" ]; then
  printf '%s\n\n%s\n\n%s\n' \
    "The stale-build check found that $problem." \
    "The daily deploy (pages.yml) should rebuild the site every morning. Check the Actions tab: a schedule GitHub has paused for inactivity needs re-enabling, or a failed run needs reading." \
    "This issue was opened by stale-check.yml; close it once a fresh build is live." \
    > issue-body.txt
  gh issue create --repo "$GH_REPO" --title "Stale build: the live site is $age days old" --body-file issue-body.txt
else
  echo "an open 'Stale build' issue already exists; not opening another"
fi
exit 1
