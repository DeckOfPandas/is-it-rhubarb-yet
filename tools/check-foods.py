"""Validate _data/foods.yml and the _foods/ stubs.

usage: python3 -I tools/check-foods.py

Python here has no YAML library, so the file is parsed by Ruby (which Jekyll
needs anyway) and handed over as JSON. Exit status is non-zero on any
problem, with one line per problem.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "_data" / "foods.yml"
GROUPS_FILE = ROOT / "_data" / "groups.yml"
STUBS = ROOT / "_foods"
SOURCES = {"ncgm", "bbc", "basc", "ffs", "general"}
QUOTES_FILE = ROOT / "_data" / "quotes.yml"
VERDICTS = {"yes", "nearly", "just", "no"}
STATES = {"in", "avail"}
COLOUR = re.compile(r"^#[0-9a-f]{6}$")
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def load(path):
    ruby = ["ruby", "-ryaml", "-rjson", "-e",
            "puts JSON.dump(YAML.load_file(ARGV[0]))", str(path)]
    return json.loads(subprocess.check_output(ruby, text=True))


def check_shades(item, label, problems):
    """`shades`, when present, is two or three #rrggbb colours."""
    if "shades" not in item:
        return
    shades = item["shades"]
    if not isinstance(shades, list) or not 2 <= len(shades) <= 3:
        problems.append(f"{label}: shades must be a list of two or three colours")
        return
    for s in shades:
        if not COLOUR.match(str(s)):
            problems.append(f"{label}: shade {s!r} must be #rrggbb lowercase")


def main() -> int:
    foods = load(DATA)
    groups = {g["key"] for g in load(GROUPS_FILE)}
    problems = []
    slugs = set()
    colours = {}
    stubs = {p.stem for p in STUBS.glob("*.md")}

    for f in foods:
        where = f.get("name", "?")
        for key in ("name", "slug", "group", "colour", "source", "varieties"):
            if key not in f:
                problems.append(f"{where}: missing {key}")
        if not SLUG.match(f.get("slug", "")):
            problems.append(f"{where}: bad slug {f.get('slug')!r}")
        if f.get("slug") in slugs:
            problems.append(f"{where}: duplicate slug")
        slugs.add(f.get("slug"))
        if f.get("group") not in groups:
            problems.append(f"{where}: unknown group {f.get('group')!r}")
        if f.get("source") not in SOURCES:
            problems.append(f"{where}: unknown source {f.get('source')!r}")
        if not COLOUR.match(str(f.get("colour", ""))):
            problems.append(f"{where}: colour must be #rrggbb lowercase")
        check_shades(f, where, problems)
        if f.get("slug") not in stubs:
            problems.append(f"{where}: no _foods/{f.get('slug')}.md stub")
        if not f.get("varieties"):
            problems.append(f"{where}: no varieties")
        for v in f.get("varieties", []):
            label = f"{where} / {v.get('name') or '-'}"
            if "name" not in v or not v.get("weeks"):
                problems.append(f"{label}: variety needs name and weeks")
                continue
            if "colour" in v and not COLOUR.match(str(v["colour"])):
                problems.append(f"{label}: colour must be #rrggbb lowercase")
            check_shades(v, label, problems)
            row_colour = v.get("colour", f.get("colour"))
            if row_colour in colours:
                problems.append(f"{label}: same colour as {colours[row_colour]}")
            colours[row_colour] = label
            for r in v["weeks"]:
                if (not isinstance(r, list) or len(r) != 3
                        or not all(isinstance(n, int) for n in r[:2])):
                    problems.append(f"{label}: range must be [from, to, state]: {r}")
                    continue
                a, b, state = r
                if not (1 <= a <= b <= 52):
                    problems.append(f"{label}: weeks out of order or range: {r}")
                if state not in STATES:
                    problems.append(f"{label}: unknown state {state!r}")
            if not any(r[2] == "in" for r in v["weeks"] if isinstance(r, list) and len(r) == 3):
                problems.append(f"{label}: never fully in season")

    for extra in sorted(stubs - slugs):
        problems.append(f"_foods/{extra}.md: no such food in the data file")

    # Quotations: every verdict has a general pool, and a quote pinned to
    # foods names real slugs.
    quotes = load(QUOTES_FILE)
    for verdict in VERDICTS:
        pool = quotes.get(verdict) or []
        if not any(not q.get("foods") for q in pool):
            problems.append(f"quotes: no general quotation for {verdict}")
        for q in pool:
            if not q.get("text") or not q.get("by"):
                problems.append(f"quotes/{verdict}: a quotation needs text and by: {q}")
            for slug in q.get("foods") or []:
                if slug not in slugs:
                    problems.append(f"quotes/{verdict}: unknown food {slug!r} in {q.get('text')!r}")
    for extra in sorted(set(quotes) - VERDICTS):
        problems.append(f"quotes: unknown verdict {extra!r}")

    for p in problems:
        print(p)
    print(f"{len(foods)} foods, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
