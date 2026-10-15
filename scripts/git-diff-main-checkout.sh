#!/bin/sh
# Show the uncommitted changes in the repository's main checkout from inside a
# git worktree, read-only. The main checkout is the directory that owns the
# shared .git, found through git itself, so no path is typed on the command
# line. Pathspecs are optional and must be plain relative paths: no leading
# "-" or "/", no "..", no shell characters.
#
# This script is safe to allow on sight: it runs exactly one git command,
# `git diff`, which writes nothing to the checkout, and its only output goes
# to stdout or to a file under tmp/.
#
# USAGE:
#   sh scripts/git-diff-main-checkout.sh [--stat] [<path> ...]
#   sh scripts/git-diff-main-checkout.sh --patch tmp/<name>.patch [<path> ...]
#
# --patch writes the diff to the named file under tmp/, ready for
# `git apply tmp/<name>.patch` in the worktree.
set -eu

refuse() {
  echo "git-diff-main-checkout.sh: $*" >&2
  exit 2
}

check_path() {
  case "$1" in
    '' | -* | /* | *..* | *[!A-Za-z0-9._/-]*)
      refuse "'$1' is not a plain relative path" ;;
  esac
}

mode=diff
out=
case "${1:-}" in
  --stat) mode=stat; shift ;;
  --patch)
    [ "$#" -ge 2 ] || refuse "--patch needs a file under tmp/"
    out="$2"
    case "$out" in
      tmp/*) ;;
      *) refuse "the patch file must be under tmp/, got '$out'" ;;
    esac
    check_path "$out"
    [ ! -L "$out" ] || refuse "'$out' is a symlink"
    mode=patch; shift 2 ;;
esac

for p in "$@"; do
  check_path "$p"
done

main="$(git rev-parse --git-common-dir)/.."

case "$mode" in
  stat)  git -C "$main" diff --stat -- "$@" ;;
  diff)  git -C "$main" diff -- "$@" ;;
  patch) git -C "$main" diff -- "$@" > "$out"; echo "wrote $out" ;;
esac
