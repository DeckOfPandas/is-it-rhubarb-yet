"""Validate the data files: _data/foods.yml, groups.yml, never.yml, quotes.yml,
sources.yml and the _foods/, _remind/, _wheels/ and _never/ stubs.

usage: python3 -I tools/check-foods.py

Python here has no YAML library, so each file is parsed by Ruby (which Jekyll
needs anyway) and handed over as JSON. Exit status is non-zero on any
problem, with one line per problem. Warnings are printed but do not fail.

Colour rules, from the design scheme: every food, variety and shade colour
reaches 3.15:1 contrast on both theme backgrounds, because the verdict word
is set in it; where it falls short of 4.5:1 on one, a text colour for that
background (text_on_shed, text_on_custard) is given and reaches 4.5:1 there,
for a food's name set as ordinary-sized text. No food but rhubarb sits
within 10 OKLab units (x100) of the brand pink; two varieties
of one food within 12 of each other get a warning. Rings of one food
(ring: region, method, zone or part) share its colour, or their variety's.

Sources: a food has `sources` (a list of keys in _data/sources.yml), and a
ring may have its own, each of which the food's list must also carry; a
ring without any inherits the food's. The singular `source` and `note`
keys are gone: `sources` and `notes` everywhere.

Warnings (printed, never failing): a source key nothing cites and no
entry marks `pending`; a just-about run touching no in-season run, or
nine weeks or longer; a note beginning with a working word; two foods'
colours within CROSS_DISTANCE OKLab units, with one count of the pairs
within CROSS_NEAR; and a whole-food verdict that lasts a single week,
which node tools/sweep-verdicts.js computes from assets/verdict.js.
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
SOURCES_FILE = ROOT / "_data" / "sources.yml"
STUBS = ROOT / "_foods"
REMIND = ROOT / "_remind"
WHEELS = ROOT / "_wheels"
NEVER_STUBS = ROOT / "_never"
# The quotation pools, one per verdict; YES-ISH's is "yesish".
VERDICTS = {"yes", "yesish", "nearly", "just", "no", "never"}
STATES = {"in", "avail", "store"}
RINGS = {"region", "method", "zone", "part"}
# What a `ring: method` ring is: `glasshouse` answers as storage does
# (assets/verdict.js reads the key, never the name).
METHODS = {"glasshouse", "outdoor", "cultivated", "wild", "fresh", "market", "farmed"}
COLOUR = re.compile(r"^#[0-9a-f]{6}$")
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

# Paths that are not foods. A food with one of these slugs would take the
# page's URL, because food pages live at /<slug>/. grey-squirrel and
# button-mushrooms are pages that forward to a renamed food.
RESERVED_SLUGS = {"now", "calendar", "wheel", "about", "sources", "foods",
                  "remind", "assets", "api", "season-starts", "404", "is-it", "year",
                  "icons", "cards", "grey-squirrel", "button-mushrooms", "cobnuts", "kitchen-sink",
                  "sustainability-and-carbon"}

SHED = "#16110e"
CUSTARD = "#fbf3d9"
BRAND_PINKS = ("#ff2d78",)
SHORT_MAX = 17
CONTRAST_FAIL = 3.15
TEXT_CONTRAST = 4.5
PINK_DISTANCE = 10.0
VARIETY_DISTANCE = 12.0
# Two foods' colours (a food's, or a named variety's) this close are
# told apart by nothing but their label where colour is the key: the
# wheel's dots, the "Also:" links. Under CROSS_DISTANCE each pair is
# named; under CROSS_NEAR the pairs are counted.
CROSS_DISTANCE = 2.0
CROSS_NEAR = 4.0
# A just-about run this long is a season in all but name.
LONG_AVAIL = 9
# A note that begins with one of these is a working note, not a sentence
# for a visitor.
WORKING_WORDS = re.compile(r"^(fudge|todo|tbc|tbd|xxx|verify|check|fix|fixme|note to self)\b", re.I)
SWEEP = ROOT / "tools" / "sweep-verdicts.js"


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
    if food_slug != "rhubarb":
        for pink in BRAND_PINKS:
            d = distance(colour, pink)
            if d < PINK_DISTANCE:
                problems.append(f"{label}: {colour} is {d:.1f} from the brand pink {pink}; pink belongs to rhubarb")


def check_text_colours(item, label, problems):
    """Where an item's own colour is under 4.5:1 on a background, its text
    colour for that background is given and reaches 4.5:1 there."""
    colour = item.get("colour")
    for name, bg in (("shed", SHED), ("custard", CUSTARD)):
        key = "text_on_" + name
        if key in item:
            if not COLOUR.match(str(item[key])):
                problems.append(f"{label}: {key} must be #rrggbb lowercase")
            elif contrast(item[key], bg) < TEXT_CONTRAST:
                problems.append(f"{label}: {key} {item[key]} is {contrast(item[key], bg):.2f}:1, below {TEXT_CONTRAST}:1")
        elif colour and COLOUR.match(str(colour)) and contrast(colour, bg) < TEXT_CONTRAST:
            problems.append(f"{label}: {colour} is {contrast(colour, bg):.2f}:1 on {name}, so it needs {key}")


def check_sources(item, label, problems, warnings, known):
    """`sources` is a list of keys in sources.yml; general warns; the
    singular `source` is a problem."""
    if "source" in item:
        problems.append(f"{label}: source is written sources: [{item['source']}] now")
    keys = list(item.get("sources") or [])
    if "sources" in item and not isinstance(item["sources"], list):
        problems.append(f"{label}: sources must be a list")
        keys = []
    for k in keys:
        if k not in known:
            problems.append(f"{label}: unknown source {k!r}")
    if "general" in keys:
        warnings.append(f"{label}: source is general knowledge, still to be checked")
    return keys


def check_notes(item, label, problems, warnings):
    """`notes`, when present, is a list of sentences for a visitor; the
    singular `note` is a problem, and a note that opens with a working
    word warns."""
    if "note" in item:
        problems.append(f"{label}: note is the first line of notes now")
    if "notes" in item and not (isinstance(item["notes"], list) and all(isinstance(n, str) and n.strip() for n in item["notes"])):
        problems.append(f"{label}: notes must be a list of sentences")
        return
    for n in item.get("notes") or []:
        if WORKING_WORDS.match(n.strip()):
            warnings.append(f"{label}: a working note, not a sentence for a visitor: {n[:40]!r}")


def fold_name(s):
    """A name as the search folds it, so Chilli and chillies collide."""
    s = re.sub(r"[^a-z0-9]+", " ", s.lower().replace("&", " and ")).strip()
    return " ".join(re.sub(r"ies$", "y", w) if w.endswith("ies") else re.sub(r"([^s])s$", r"\1", w) for w in s.split())


def check_avail_runs(weeks, label, warnings):
    """A just-about run touching no in-season run reads JUST on its own;
    one of LONG_AVAIL weeks or more is a season in all but name. A run
    that meets another just-about run across the year's end is one run
    with it, so what it touches is what the other run touches."""
    cover = {}
    for r in weeks:
        if isinstance(r, list) and len(r) == 3 and all(isinstance(n, int) for n in r[:2]):
            for w in range(r[0], r[1] + 1):
                cover[w] = r[2]

    def beyond(week, step):
        for _ in range(52):
            week = (week - 1 + step) % 52 + 1
            if cover.get(week) != "avail":
                return cover.get(week)
        return None

    for r in weeks:
        if not (isinstance(r, list) and len(r) == 3 and r[2] == "avail"):
            continue
        before = beyond(r[0], -1)
        after = beyond(r[1], 1)
        if before != "in" and after != "in":
            warnings.append(f"{label}: just-about run {r} touches no in-season run, so it reads JUST on its own")
        if r[1] - r[0] + 1 >= LONG_AVAIL:
            warnings.append(f"{label}: just-about run {r} is {r[1] - r[0] + 1} weeks, a season in all but name")


def sweep_verdicts():
    """Each food's 52 whole-food verdicts, from the verdict rules in
    assets/verdict.js under Node; {} if Node is not about."""
    try:
        return json.loads(subprocess.check_output(["node", str(SWEEP)], text=True))
    except (OSError, subprocess.CalledProcessError):
        return {}


def check_one_week_verdicts(sweep, names, warnings):
    """A whole-food verdict that lasts a single week, the year's end
    joined to its start."""
    for slug, row in sweep.items():
        runs = []
        for w, v in enumerate(row, start=1):
            if runs and runs[-1][0] == v:
                runs[-1][1] += 1
            else:
                runs.append([v, 1, w])
        if len(runs) > 1 and runs[0][0] == runs[-1][0]:
            runs[0][1] += runs[-1][1]
            runs[0][2] = runs[-1][2]
            runs.pop()
        for v, n, at in runs:
            if n == 1 and len(runs) > 1:
                warnings.append(f"{names.get(slug, slug)}: {v} lasts one week (week {at})")


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
    """Aliases are non-empty strings, unique across the whole data set.
    `also` terms are non-empty strings that foods may share, and none may
    double as somebody's alias."""
    aliases = item.get("aliases")
    if aliases is not None:
        if not isinstance(aliases, list):
            problems.append(f"{label}: aliases must be a list")
        else:
            for a in aliases:
                if not isinstance(a, str) or not a.strip():
                    problems.append(f"{label}: alias {a!r} must be a phrase")
                    continue
                key = a.strip().lower()
                if key in seen and seen[key] != slug:
                    problems.append(f"{label}: alias {a!r} already belongs to {seen[key]}")
                seen[key] = slug
    also = item.get("also")
    if also is not None:
        if not isinstance(also, list):
            problems.append(f"{label}: also must be a list")
        else:
            for a in also:
                if not isinstance(a, str) or not a.strip():
                    problems.append(f"{label}: also {a!r} must be a phrase")
                elif a.strip().lower() in seen and seen[a.strip().lower()] != slug:
                    problems.append(f"{label}: also {a!r} is an alias of {seen[a.strip().lower()]}")


def check_short(item, label, problems, warnings):
    """`short`, a calendar row's name on a phone, is a phrase of at most
    SHORT_MAX characters (longer warns, so the column stays narrow)."""
    if "short" not in item:
        return
    short = item["short"]
    if not isinstance(short, str) or not short.strip():
        problems.append(f"{label}: short must be a phrase")
    elif len(short) > SHORT_MAX:
        warnings.append(f"{label}: short {short!r} is {len(short)} characters, over {SHORT_MAX}")


def main() -> int:
    foods = load(DATA)
    groups = {g["key"] for g in load(GROUPS_FILE)}
    never = load(NEVER_FILE) if NEVER_FILE.exists() else []
    sources = load(SOURCES_FILE)
    known = {s["key"] for s in sources}
    problems = []
    warnings = []
    slugs = set()
    colours = {}
    aliases = {}
    used_keys = set()
    names_seen = {}
    cross = []
    stubs = {p.stem for p in STUBS.glob("*.md")}
    reminders = {p.stem for p in REMIND.glob("*.ics")}
    wheels = {p.stem for p in WHEELS.glob("*.svg")}
    never_stubs = {p.stem for p in NEVER_STUBS.glob("*.md")} if NEVER_STUBS.exists() else set()

    for f in foods:
        where = f.get("name", "?")
        slug = f.get("slug")
        for key in ("name", "slug", "group", "colour", "varieties"):
            if key not in f:
                problems.append(f"{where}: missing {key}")
        if not f.get("sources"):
            problems.append(f"{where}: missing sources")
        folded = fold_name(f.get("name", ""))
        if folded in names_seen:
            problems.append(f"{where}: the same name as {names_seen[folded]} once folded")
        names_seen[folded] = where
        if not SLUG.match(slug or ""):
            problems.append(f"{where}: bad slug {slug!r}")
        if slug in RESERVED_SLUGS:
            problems.append(f"{where}: slug {slug!r} is a page's URL")
        if slug in slugs:
            problems.append(f"{where}: duplicate slug")
        slugs.add(slug)
        if f.get("group") not in groups:
            problems.append(f"{where}: unknown group {f.get('group')!r}")
        food_keys = check_sources(f, where, problems, warnings, known)
        used_keys.update(food_keys)
        check_notes(f, where, problems, warnings)
        if COLOUR.match(str(f.get("colour", ""))):
            cross.append((f["colour"], where))
        if "unsold" in f and not (isinstance(f["unsold"], str) and f["unsold"].strip()):
            problems.append(f"{where}: unsold must be a sentence")
        if "said" in f and not (isinstance(f["said"], str) and f["said"].strip()):
            problems.append(f"{where}: said must be a phrase")
        check_colour(f.get("colour", ""), where, problems, warnings, slug)
        check_text_colours(f, where, problems)
        check_shades(f, where, problems, warnings, slug)
        check_aliases(f, where, problems, aliases, slug)
        check_short(f, where, problems, warnings)
        if slug not in stubs:
            problems.append(f"{where}: no _foods/{slug}.md stub")
        if slug not in reminders:
            problems.append(f"{where}: no _remind/{slug}.ics stub")
        if slug not in wheels:
            problems.append(f"{where}: no _wheels/{slug}.svg stub")
        if not f.get("varieties"):
            problems.append(f"{where}: no varieties")
        elif all(v.get("lead") is False for v in f["varieties"]):
            problems.append(f"{where}: every ring is lead: false, so nothing reaches the calendar, the wheel or the feed")
        variety_colours = []
        for v in f.get("varieties", []):
            label = f"{where} / {v.get('name') or '-'}"
            if "name" not in v or not v.get("weeks"):
                problems.append(f"{label}: variety needs name and weeks")
                continue
            if "colour" in v:
                check_colour(v["colour"], label, problems, warnings, slug)
                check_text_colours(v, label, problems)
            if "ring" in v and v["ring"] not in RINGS:
                problems.append(f"{label}: ring is one of {sorted(RINGS)}")
            if v.get("ring") == "method":
                if v.get("method") not in METHODS:
                    problems.append(f"{label}: a method ring needs method, one of {sorted(METHODS)}")
            elif "method" in v:
                problems.append(f"{label}: method belongs on a ring: method")
            if "lead" in v and v["lead"] is not False:
                problems.append(f"{label}: lead is false or left out")
            if "sources" in v:
                ring_keys = check_sources({"sources": v["sources"]}, label, problems, [], known)
                if not ring_keys:
                    problems.append(f"{label}: sources: [] says nothing; leave it out to inherit the food's")
                for k in ring_keys:
                    if k not in food_keys:
                        problems.append(f"{label}: cites {k}, which the food's sources do not carry")
                used_keys.update(ring_keys)
            check_notes(v, label, problems, warnings)
            if "said" in v and not (isinstance(v["said"], str) and v["said"].strip()):
                problems.append(f"{label}: said must be a phrase")
            if "said" in v and not v.get("name"):
                problems.append(f"{label}: said needs a named variety")
            if "cultivar" in v and v["cultivar"] is not True:
                problems.append(f"{label}: cultivar is true or left out")
            if v.get("cultivar") and not v.get("name"):
                problems.append(f"{label}: cultivar needs a named variety")
            check_shades(v, label, problems, warnings, slug)
            check_aliases(v, label, problems, aliases, slug)
            check_short(v, label, problems, warnings)
            row_colour = v.get("colour", f.get("colour"))
            # A ring shares its food's colour, or its variety's.
            if v.get("ring"):
                continue
            if row_colour in colours and colours[row_colour].split(" / ")[0] != where:
                problems.append(f"{label}: same colour as {colours[row_colour]}")
            colours[row_colour] = label
            if COLOUR.match(str(row_colour)):
                if v.get("name") and "colour" in v:
                    cross.append((row_colour, label))
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
            check_avail_runs(v["weeks"], label, warnings)

    # Two foods told apart by colour alone.
    near = 0
    for i in range(len(cross)):
        for j in range(i + 1, len(cross)):
            (a, la), (b, lb) = cross[i], cross[j]
            if la.split(" / ")[0] == lb.split(" / ")[0]:
                continue
            d = distance(a, b)
            if d < CROSS_NEAR:
                near += 1
            if d < CROSS_DISTANCE:
                warnings.append(f"{la}: {a} is {d:.1f} from {lb} {b}")
    if near:
        warnings.append(f"{near} pairs of foods' colours within {CROSS_NEAR} OKLab units of each other")

    # A source nothing cites, unless it is marked pending.
    for s in sources:
        if s["key"] not in used_keys and s["key"] != "general" and not s.get("pending"):
            warnings.append(f"sources.yml: {s['key']} is cited by nothing")

    check_one_week_verdicts(sweep_verdicts(), {f.get("slug"): f.get("name", "?") for f in foods}, warnings)

    for extra in sorted(stubs - slugs):
        problems.append(f"_foods/{extra}.md: no such food in the data file")
    for extra in sorted(reminders - slugs):
        problems.append(f"_remind/{extra}.ics: no such food in the data file")
    for extra in sorted(wheels - slugs):
        problems.append(f"_wheels/{extra}.svg: no such food in the data file")

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
        folded = fold_name(n.get("name", ""))
        if folded in names_seen:
            problems.append(f"never/{where}: the same name as {names_seen[folded]} once folded")
        names_seen[folded] = "never/" + where
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
