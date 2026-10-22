#!/bin/sh
# Push an empty commit when the last commit is older than <max days>, so
# GitHub does not pause the repository's scheduled workflows (it does after
# 60 days without a commit). Run by .github/workflows/keepalive.yml on a
# checkout of main with a token that may push; needs git and date.
#
# usage: sh tools/keepalive.sh <max days>
#
# Prints the age and what it did. Exits 0 either way; a failed push exits
# with git's status, so the run shows red.
set -eu

max="$1"
last="$(git log -1 --format=%ct)"
now="$(date -u +%s)"
age=$(( (now - last) / 86400 ))

if [ "$age" -le "$max" ]; then
  echo "fresh: the last commit is $age days old, within $max"
  exit 0
fi

echo "stale: the last commit is $age days old, over $max; pushing an empty commit"
git commit --allow-empty -m "(chore) Keep the schedules alive

The last commit was $age days old. GitHub pauses scheduled workflows,
the daily deploy among them, after 60 days without one; this commit
resets that clock. Made by .github/workflows/keepalive.yml."
git push
