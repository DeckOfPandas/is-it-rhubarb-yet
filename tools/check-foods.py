"""Validate the data files: _data/foods.yml, groups.yml, never.yml, quotes.yml
and the _foods/ and _never/ stubs.

usage: python3 -I tools/check-foods.py

Python here has no YAML library, so each file is parsed by Ruby (which Jekyll
needs anyway) and handed over as JSON. Exit status is non-zero on any
problem, with one line per problem. Warnings are printed but do not fail.

Colour rules, from the design scheme: every food, variety and shade colour
reaches 3:1 contrast on both theme backgrounds (fail) and 3.15:1 (warn),
because the verdict word is set in it; no food but rhubarb sits within 10
OKLab units (x100) of either candidate brand pink; two varieties of one
food within 12 of each other get a warning.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "_data" / "foods.yml"
GROUPS_FILE = ROOT / "_data" / "groups.yml"
NEVER_FILE = ROOT / "_data" / "never.yml"
QUOTES_FILE = ROOT / "_data" / "quotes.yml"
STUBS = ROOT / "_foods"
NEVER_STUBS = ROOT / "_never"
SOURCES = {"ncgm", "bbc", "basc", "ffs", "general"}
VERDICTS = {"yes", "nearly", "just", "no", "never"}
STATES = {"in", "avail"}
COLOUR = re.compile(r"^#[0-9a-f]{6}$")
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

# Paths that are not foods. A food with one of these slugs would take the
# page's URL, because food pages live at /<slug>/.
RESERVED_SLUGS = {"now", "calendar", "wheel", "about", "sources", "foods",
                  "remind", "assets", "api", "season-starts", "404", "is-it", "year"}

SHED = "#16110e"
CUSTARD = "#fbf3d9"
BRAND_PINKS = ("#ff2d78", "#ff045e")
CONTRAST_FAIL = 3.0
CONTRAST_WARN = 3.15
PINK_DISTANCE = 10.0
VARIETY_DISTANCE = 12.0


def load(path):
    ruby = ["ruby", "-ryaml", "-rjson", "-e",
            "puts JSON.dump(YAML.load_file(ARGV[0]))", str(path)]
    return json.loads(subprocess.check_output(ruby, text=True))


# --- Colour maths ----------------------------------------------------------

def srgb(hex_colour):
    h = hex_colour.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_colour):
    r, g, b = (linear(c) for c in srgb(hex_colour))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def oklab(hex_colour):
    r, g, b = (linear(c) for c in srgb(hex_colour))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = l ** (1 / 3), m ** (1 / 3), s ** (1 / 3)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def distance(a, b):
    """OKLab distance, times 100."""
    pa, pb = oklab(a), oklab(b)
    return 100 * sum((x - y) ** 2 for x, y in zip(pa, pb)) ** 0.5


def check_colour(colour, label, problems, warnings, food_slug=None):
    """Shape, contrast on both backgrounds, and distance from the brand pinks."""
    if not COLOUR.match(str(colour)):
        problems.append(f"{label}: colour must be #rrggbb lowercase")
        return
    for name, bg in (("shed", SHED), ("custard", CUSTARD)):
        ratio = contrast(colour, bg)
        if ratio < CONTRAST_FAIL:
            problems.append(f"{label}: {colour} is {ratio:.2f}:1 on {name}, below {CONTRAST_FAIL}:1")
        elif ratio < CONTRAST_WARN:
            warnings.append(f"{label}: {colour} is {ratio:.2f}:1 on {name}, below {CONTRAST_WARN}:1")
    if food_slug != "rhubarb":
        for pink in BRAND_PINKS:
            d = distance(colour, pink)
            if d < PINK_DISTANCE:
                problems.append(f"{label}: {colour} is {d:.1f} from the brand pink {pink}; pink belongs to rhubarb")


def check_shades(item, label, problems, warnings, slug):
    """`shades`, when present, is two or three colours passing the same rules."""
    if "shades" not in item:
        return
    shades = item["shades"]
    if not isinstance(shades, list) or not 2 <= len(shades) <= 3:
        problems.append(f"{label}: shades must be a list of two or three colours")
        return
    for s in shades:
        check_colour(s, f"{label} shade", problems, warnings, slug)


def check_aliases(item, label, problems, seen, slug):
    """Aliases are non-empty strings, unique across the whole data set."""
    aliases = item.get("aliases")
    if aliases is None:
        return
    if not isinstance(aliases, list):
        problems.append(f"{label}: aliases must be a list")
        return
    for a in aliases:
        if not isinstance(a, str) or not a.strip():
            problems.append(f"{label}: alias {a!r} must be a phrase")
            continue
        key = a.strip().lower()
        if key in seen and seen[key] != slug:
            problems.append(f"{label}: alias {a!r} already belongs to {seen[key]}")
        seen[key] = slug


def main() -> int:
    foods = load(DATA)
    groups = {g["key"] for g in load(GROUPS_FILE)}
    never = load(NEVER_FILE) if NEVER_FILE.exists() else []
    problems = []
    warnings = []
    slugs = set()
    colours = {}
    aliases = {}
    stubs = {p.stem for p in STUBS.glob("*.md")}
    never_stubs = {p.stem for p in NEVER_STUBS.glob("*.md")} if NEVER_STUBS.exists() else set()

    for f in foods:
        where = f.get("name", "?")
        slug = f.get("slug")
        for key in ("name", "slug", "group", "colour", "source", "varieties"):
            if key not in f:
                problems.append(f"{where}: missing {key}")
        if not SLUG.match(slug or ""):
            problems.append(f"{where}: bad slug {slug!r}")
        if slug in RESERVED_SLUGS:
            problems.append(f"{where}: slug {slug!r} is a page's URL")
        if slug in slugs:
            problems.append(f"{where}: duplicate slug")
        slugs.add(slug)
        if f.get("group") not in groups:
            problems.append(f"{where}: unknown group {f.get('group')!r}")
        if f.get("source") not in SOURCES:
            problems.append(f"{where}: unknown source {f.get('source')!r}")
        if f.get("source") == "general":
            warnings.append(f"{where}: source is general knowledge, still to be checked")
        check_colour(f.get("colour", ""), where, problems, warnings, slug)
        check_shades(f, where, problems, warnings, slug)
        check_aliases(f, where, problems, aliases, slug)
        if slug not in stubs:
            problems.append(f"{where}: no _foods/{slug}.md stub")
        if not f.get("varieties"):
            problems.append(f"{where}: no varieties")
        variety_colours = []
        for v in f.get("varieties", []):
            label = f"{where} / {v.get('name') or '-'}"
            if "name" not in v or not v.get("weeks"):
                problems.append(f"{label}: variety needs name and weeks")
                continue
            if "colour" in v:
                check_colour(v["colour"], label, problems, warnings, slug)
            if "said" in v and not (isinstance(v["said"], str) and v["said"].strip()):
                problems.append(f"{label}: said must be a phrase")
            if "said" in v and not v.get("name"):
                problems.append(f"{label}: said needs a named variety")
            check_shades(v, label, problems, warnings, slug)
            check_aliases(v, label, problems, aliases, slug)
            row_colour = v.get("colour", f.get("colour"))
            if row_colour in colours and colours[row_colour].split(" / ")[0] != where:
                problems.append(f"{label}: same colour as {colours[row_colour]}")
            colours[row_colour] = label
            if COLOUR.match(str(row_colour)):
                for other_label, other in variety_colours:
                    if row_colour == other:
                        problems.append(f"{label}: same colour as {other_label}")
                    elif distance(row_colour, other) < VARIETY_DISTANCE:
                        warnings.append(f"{label}: {row_colour} is {distance(row_colour, other):.1f} from {other_label}")
                variety_colours.append((label, row_colour))
            covered = set()
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
                span = set(range(a, b + 1))
                if covered & span:
                    problems.append(f"{label}: overlapping runs at weeks {sorted(covered & span)[:3]}")
                covered |= span
            if not any(r[2] == "in" for r in v["weeks"] if isinstance(r, list) and len(r) == 3):
                problems.append(f"{label}: never fully in season")

    for extra in sorted(stubs - slugs):
        problems.append(f"_foods/{extra}.md: no such food in the data file")

    # Never-foods: their own slugs and aliases, clashing with nothing.
    never_slugs = set()
    for n in never:
        where = n.get("name", "?")
        slug = n.get("slug")
        for key in ("name", "slug", "line"):
            if key not in n:
                problems.append(f"never/{where}: missing {key}")
        if not SLUG.match(slug or ""):
            problems.append(f"never/{where}: bad slug {slug!r}")
        if slug in slugs or slug in never_slugs or slug in RESERVED_SLUGS:
            problems.append(f"never/{where}: slug {slug!r} is taken")
        never_slugs.add(slug)
        check_aliases(n, f"never/{where}", problems, aliases, slug)
        if slug not in never_stubs:
            problems.append(f"never/{where}: no _never/{slug}.md stub")
    for extra in sorted(never_stubs - never_slugs):
        problems.append(f"_never/{extra}.md: no such food in never.yml")
    for alias, owner in aliases.items():
        if alias in slugs or alias in never_slugs:
            if owner != alias:
                problems.append(f"alias {alias!r} of {owner} is another food's slug")

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
                if slug not in slugs and slug not in never_slugs:
                    problems.append(f"quotes/{verdict}: unknown food {slug!r} in {q.get('text')!r}")
    for extra in sorted(set(quotes) - VERDICTS):
        problems.append(f"quotes: unknown verdict {extra!r}")

    for w in warnings:
        print(f"warning: {w}")
    for p in problems:
        print(p)
    print(f"{len(foods)} foods, {len(never)} never-foods, {len(warnings)} warnings, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
