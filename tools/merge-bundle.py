"""Merge the 21 October 2026 season bundle and colours into _data/foods.yml.

usage: python3 -I tools/merge-bundle.py <bundle dir> <colours.yml>

Run once, on 21 October 2026, with tmp/inbox/data/is-it-rhubarb-yet-data
and tmp/inbox/data/colours.yml; kept for provenance, like make-foods.py.
Rerunning it on today's foods.yml would merge twice. It writes
_data/foods.yml and _data/sources.yml, adds and removes _foods/ stubs, and
prints what it did.

What it follows (the bundle's README and tmp/inbox/2-data-merge.md):
- foods.yml is merged into, never replaced: slugs, group, short, said,
  aliases, also, cultivar, shades, note and buy stay; foods the bundle
  has not got stay as they are, with their source.
- Months become weeks on the 4-4-5 split; great_now is in, coming_in and
  going_out avail, from_store store; available is in on a ring available
  all year (or with no other presence at all), avail anywhere else.
- A ring is a variety. Regions, growing methods, legal zones and plant
  parts are rings of one food (ring: region|method|zone|part) and share
  its colour; named varieties and types have their own.
- lead: false marks a ring that is shown (dial, data, the variety line)
  but does not give the verdict, a calendar row or a search hit: every
  coast but the South West where a fish has one, glasshouse rings, wild
  rings beside a market one, and provenance rings (Welsh, salt marsh).
- Zones of one variety are one ring, their months joined: venison by
  species, wild duck inland and on the foreshore.
- Helen's windows stay for the foraged plants she already has, and her
  Discovery apples (in season in August); Early Windsor, Golden Delicious
  and Royal Gala stay out.
- Dropped foods are not added; snipe goes. Wild salmon cannot be sold.
- Colours, and text colours where a colour falls short of 4.5:1, come
  from colours.yml for every food and variety.
- Fish `buy` lines come from the Good Fish Guide (sustainability.json).
"""

import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FOODS = ROOT / "_data" / "foods.yml"
SOURCES_OUT = ROOT / "_data" / "sources.yml"
STUBS = ROOT / "_foods"

MONTHS = "jan feb mar apr may jun jul aug sep oct nov dec".split()
MONTH_WEEKS = [(1, 4), (5, 8), (9, 13), (14, 17), (18, 22), (23, 26),
               (27, 30), (31, 35), (36, 39), (40, 43), (44, 48), (49, 52)]
STATE = {"great_now": "in", "coming_in": "avail", "going_out": "avail", "from_store": "store"}
RANK = {"in": 3, "store": 2, "avail": 1, None: 0}

# Bundle id -> slug in foods.yml, when they differ.
SLUG = {
    "globe-artichoke": "globe-artichokes", "jerusalem-artichoke": "jerusalem-artichokes", "radish": "radishes",
    "pumpkins": "pumpkin", "chilli": "chillies", "currants": "blackcurrants-redcurrants",
    "chanterelle": "girolles", "morel": "morels", "hedgehog-mushroom": "hedgehog-fungus", "nettle": "nettles",
    "blackthorn": "sloes", "sweet-chestnut": "sweet-chestnuts", "crab-apple": "crab-apples", "rose": "rosehips",
    "wild-strawberry": "wild-strawberries", "mint-wild": "mint", "pollack": "pollock", "langoustine": "langoustines",
    "king-scallop": "scallops", "salmon-wild": "wild-salmon", "wild-duck-goose": "wild-duck", "brown-hare": "hare",
    "oyster-mushroom": "oyster-mushrooms", "button-mushroom": "button-mushrooms", "spruce": "spruce-tips",
}
# Bundle foods whose rings go to more than one food: id -> {ring label: (slug, variety name)}.
SPLIT = {
    "calabrese": {"Market (New Covent Garden)": ("broccoli", "Calabrese")},
    "purple-sprouting-broccoli": {"Season": ("broccoli", "Purple sprouting")},
    "beans": {"Broad": ("broad-beans", ""), "French and runner": ("runner-french-beans", "")},
    "cabbage": {"Red": ("cabbage", "Red"), "Savoy": ("cabbage", "Savoy"), "Spring greens": ("spring-greens", ""),
                "Winter white": ("cabbage", "Winter white")},
    "native-oyster": {"Legal sale season": ("oysters", "Native"), "National (Seafish)": ("oysters", "Native, national")},
    "rock-oyster": {"National (Seafish)": ("oysters", "Rock"), "Porthilly, Cornwall (Flying Fish)": ("oysters", "Rock, Porthilly")},
    "witch-megrim": {"North East (Northumberland)": ("witch-sole", "")},
    "hazel": {"Hazelnuts": ("cobnuts", "Wild")},
}
# The megrim food takes the same ring as witch sole.
ALSO_TO = {"witch-megrim": ("megrim", "")}
DROP = set("""st-johns-wort valerian ladys-mantle mugwort yarrow chamomile honeysuckle rowan acorn beech primrose
wild-cabbage sweet-violet plantain lime-tree cleavers chickweed ground-ivy brooklime dead-nettle mallow red-clover daisy
crow-garlic scots-pine silver-birch hawthorn pied-bleu wood-ear velvet-crab""".split())
# Helen's windows stand for these; the bundle is a cross-check only.
KEEP_WINDOWS = {"wild-garlic", "nettles", "dandelion", "elderflower", "elderberries", "meadowsweet", "wild-strawberries",
                "rosehips", "crab-apples", "sloes", "sweet-chestnuts", "mint", "sorrel", "elder"}
# Apple varieties Helen leaves out, and those whose rows she keeps.
LEAVE_OUT = {("apples", "Early Windsor"), ("apples", "Golden Delicious"), ("apples", "Royal Gala")}
KEEP_ROWS = {("apples", "Discovery")}
# Ring labels -> variety names and ring kinds, per food where the label is
# not enough.
NAMES = {
    "apples": {"Bramley (cooking)": "Bramley"},
    "pears": {"Comice and Concorde": "Comice & Concorde", "Williams'": "Williams"},
    "radishes": {"Radish": "", "Daikon (mooli)": "Mooli"},
    "lamb": {"New-season lamb (grass-fed)": "New-season", "Milk-fed spring lamb": "Milk-fed spring",
             "Welsh Lamb (PGI)": "Welsh (PGI)", "Salt marsh lamb (Gower PDO)": "Salt marsh (Gower PDO)"},
    "salmon-farmed": {"Glenarm organic, Northern Ireland (Flying Fish)": "Glenarm, Northern Ireland",
                      "Loch Duart, Scotland (Flying Fish)": "Loch Duart, Scotland"},
    "scallops": {"Orkney hand-dived (Flying Fish)": "Orkney, hand-dived"},
    "sardines": {"Cornish sardine fishery (MSC)": "Cornish fishery (MSC)"},
    "hop": {"Shoots and leaves": "Shoots", "Flowers": "Flowers"},
    "girolles": {"Market, Scottish wild (New Covent Garden)": "Market"},
}
# Zones joined into one variety: food -> {ring label: variety name}.
ZONES = {
    "venison": {"Red, sika and fallow stags and bucks": "Red & fallow", "Red, sika and fallow hinds and does": "Red & fallow",
                "Roe bucks": "Roe", "Roe does": "Roe", "Chinese water deer": "Chinese water deer", "Muntjac": "Muntjac"},
    "wild-duck": {"Inland": "", "Foreshore (below high water)": ""},
}
RING_KIND = {
    "lamb": {"Welsh (PGI)": "region", "Salt marsh (Gower PDO)": "region"},
    "salmon-farmed": {"Glenarm, Northern Ireland": "region", "Loch Duart, Scotland": "region"},
    "scallops": {"Orkney, hand-dived": "region"},
    "sardines": {"Cornish fishery (MSC)": "region"},
    "oysters": {"Native, national": "region", "Rock, Porthilly": "region"},
    "hop": {"Shoots": "part", "Flowers": "part"},
    "cobnuts": {"Wild": "method"},
    "girolles": {"Market": "method"},
}
NOT_LEAD = {("lamb", "Welsh (PGI)"), ("lamb", "Salt marsh (Gower PDO)"), ("scallops", "Orkney, hand-dived"),
            ("sardines", "Cornish fishery (MSC)"), ("oysters", "Native, national"), ("oysters", "Rock, Porthilly")}
REGIONS = ("North East", "South East", "South West", "National")
MAIN = {"Market (New Covent Garden)", "Season", "All year", "England & Wales open season", "England & Wales",
        "Tips", "Leaves", "Fruit", "Nuts", "Hips", "Sloes", "Berries", "Flowers"}
# Source keys: the bundle's, except Flying Fish, which foods.yml has
# always called ffs.
SOURCE_KEY = {"flying_fish": "ffs"}
NEW_NAMES = {"witch-sole": "Witch sole", "megrim": "Megrim", "oyster-mushrooms": "Oyster mushrooms",
             "button-mushrooms": "Button, cup and flat mushrooms", "spruce-tips": "Spruce tips", "salmon-farmed": "Farmed salmon",
             "hen-of-the-woods": "Hen of the woods", "duck": "Duck", "skates-rays": "Skates & rays"}
NEW_ALIASES = {"witch-sole": ["witch", "torbay sole"], "megrim": ["megrim sole", "cornish sole"],
               "hen-of-the-woods": ["maitake"]}
FUNGI = {"ceps", "girolles", "morels", "hedgehog-fungus", "field-mushrooms", "giant-puffball", "hen-of-the-woods",
         "oyster-mushrooms", "button-mushrooms", "enoki", "shiitake"}
UNSOLD = {"wild-salmon": "It cannot be sold in England, Wales or Scotland"}
# How a new variety is said in full, where its name then the food's reads
# badly ("Hogget lamb", "Muntjac venison").
SAID = {("lamb", "Hogget"): "Hogget", ("venison", "Red & fallow"): "Red & fallow deer", ("venison", "Roe"): "Roe deer",
        ("venison", "Chinese water deer"): "Chinese water deer", ("venison", "Muntjac"): "Muntjac"}
# Helen's variety names the bundle renames or replaces: (slug, old) -> new, or None to drop.
RENAMED = {("pears", "Comice"): "Comice & Concorde", ("lamb", "New season"): "New-season",
           ("venison", "Red & Fallow"): "Red & fallow", ("venison", "Roe & Muntjac"): None}


def yaml(path):
    return json.loads(subprocess.check_output(
        ["ruby", "-ryaml", "-rjson", "-e", "puts JSON.dump(YAML.load_file(ARGV[0]))", str(path)], text=True))


def ring_runs(months):
    """A ring's months as [from, to, state] runs of weeks."""
    raw = [months.get(m) for m in MONTHS]
    present = [s for s in raw if s]
    all_avail = present and all(s == "available" for s in present)
    states = []
    for s in raw:
        if s == "available":
            states.append("in" if all_avail and (len(present) == 12 or not any(STATE.get(x) for x in raw)) else "avail")
        else:
            states.append(STATE.get(s))
    # A ring available but never at its peak, and not all year (brown
    # hare), is in when it is there at all: its only presence.
    if "in" not in states and "store" not in states:
        states = ["in" if s else None for s in states]
    return compress(states)


def compress(states):
    runs = []
    for i, s in enumerate(states):
        if not s:
            continue
        a, b = MONTH_WEEKS[i]
        if runs and runs[-1][2] == s and runs[-1][1] == a - 1:
            runs[-1][1] = b
        else:
            runs.append([a, b, s])
    return runs


def join_states(a, b):
    """Two rings' month states joined, the stronger winning each month."""
    return [x if RANK[x] >= RANK[y] else y for x, y in zip(a, b)]


def month_states(runs):
    out = []
    for a, b in MONTH_WEEKS:
        best = None
        for r in runs:
            if r[0] <= a and r[1] >= b and RANK[r[2]] > RANK[best]:
                best = r[2]
        out.append(best)
    return out


def classify(slug, label):
    """(variety name, ring kind) for a ring label."""
    names = NAMES.get(slug, {})
    if label in names:
        name = names[label]
        return name, RING_KIND.get(slug, {}).get(name)
    for r in REGIONS:
        if label.startswith(r):
            return r, "region"
    if label == "Glasshouse":
        return "Glasshouse", "method"
    for word in ("Outdoor", "Cultivated", "Wild", "Fresh"):
        if label.startswith(word + " ("):
            return word, "method"
    if label in MAIN or label in ("Legal sale season",):
        return "", None
    return label, None


def main():
    bundle_dir = pathlib.Path(sys.argv[1])
    colours = yaml(sys.argv[2])
    seasons = json.load(open(bundle_dir / "seasons.json"))
    sustain = json.load(open(bundle_dir / "sustainability.json"))
    register = json.load(open(bundle_dir / "sources.json"))["register"]
    foods = yaml(FOODS)
    groups = [g["key"] for g in yaml(ROOT / "_data" / "groups.yml")]
    by_slug = {f["slug"]: f for f in foods}
    report = []

    # Rings for each slug, in bundle order: (name, kind, runs, sources, notes).
    rings = {}
    food_notes, food_sources = {}, {}
    for bf in seasons["foods"]:
        fid = bf["id"]
        if fid in DROP or fid == "snipe":
            continue
        for ring in bf["rings"]:
            if fid in SPLIT:
                if ring["label"] not in SPLIT[fid]:
                    report.append(f"left out: {fid} ring {ring['label']!r}")
                    continue
                slug, name = SPLIT[fid][ring["label"]]
                kind = RING_KIND.get(slug, {}).get(name)
                if slug == "cobnuts":
                    kind = "method"
            else:
                slug = SLUG.get(fid, fid)
                name, kind = classify(slug, ring["label"])
            if (slug, name) in LEAVE_OUT:
                continue
            srcs = [SOURCE_KEY.get(s, s) for s in ring.get("sources", [])]
            entry = {"name": name, "kind": kind, "runs": ring_runs(ring["months"]), "sources": srcs,
                     "notes": ring.get("notes", []), "label": ring["label"]}
            targets = [slug] + ([ALSO_TO[fid][0]] if fid in ALSO_TO else [])
            for t in targets:
                rings.setdefault(t, []).append(dict(entry))
                food_sources.setdefault(t, [])
                for s in srcs:
                    if s not in food_sources[t]:
                        food_sources[t].append(s)
        targets = {s for s, _ in SPLIT[fid].values()} if fid in SPLIT else {SLUG.get(fid, fid)}
        if fid in ALSO_TO:
            targets.add(ALSO_TO[fid][0])
        for t in sorted(targets):
            food_notes.setdefault(t, []).extend(n for n in bf.get("notes", []) if n not in food_notes.get(t, []))

    # Zones of one variety become one ring, their months joined.
    for slug, zones in ZONES.items():
        merged = []
        for r in rings.get(slug, []):
            name = zones.get(r["label"], r["name"])
            same = next((m for m in merged if m["name"] == name), None)
            if same:
                same["runs"] = compress(join_states(month_states(same["runs"]), month_states(r["runs"])))
                same["sources"] += [s for s in r["sources"] if s not in same["sources"]]
                same["notes"] += r["notes"]
            else:
                r = dict(r, name=name, kind=None)
                merged.append(r)
        rings[slug] = merged

    # Lead rings: a fish's South West, where it has one; a market ring
    # over glasshouse and wild ones; never a provenance ring.
    for slug, rs in rings.items():
        has_sw = any(r["name"] == "South West" for r in rs)
        main_rings = [r for r in rs if r["name"] not in ("Glasshouse", "Wild")]
        for r in rs:
            lead = True
            if has_sw and r["kind"] == "region" and r["name"] != "South West":
                lead = False
            if r["name"] == "Glasshouse" and len(rs) > 1:
                lead = False
            if r["name"] == "Wild" and r["kind"] == "method" and main_rings and r not in main_rings:
                lead = False
            if (slug, r["name"]) in NOT_LEAD:
                lead = False
            r["lead"] = lead

    # Merge into foods.yml.
    merged_slugs = []
    for slug, rs in rings.items():
        if slug in KEEP_WINDOWS:
            report.append(f"kept Helen's windows: {slug}")
            continue
        food = by_slug.get(slug)
        if food is None:
            c = colours.get(slug, {})
            name = NEW_NAMES.get(slug) or c.get("name") or slug.replace("-", " ").capitalize()
            group = "fungi" if slug in FUNGI else c.get("group")
            food = {"name": name, "slug": slug, "group": group, "colour": c.get("colour", "#000000").lower(), "varieties": []}
            if slug in NEW_ALIASES:
                food["aliases"] = NEW_ALIASES[slug]
            foods.append(food)
            by_slug[slug] = food
            report.append(f"new food: {slug} ({name}, {group})")
        old = {v.get("name", ""): v for v in food["varieties"]}
        # An old unnamed variety stands for the bundle's lead ring.
        new_vars = []
        for r in rs:
            key = r["name"]
            prev = old.get(key)
            if prev is None:
                prev = next((old[o] for (s, o), n in RENAMED.items() if s == slug and n == key and o in old), None)
            if prev is None and len(old) == 1 and "" in old and r["lead"] and not any(v["name"] == "" for v in new_vars):
                prev = old.get("")
            v = {"name": key}
            for k in ("said", "cultivar", "short", "shades"):
                if prev and k in prev:
                    v[k] = prev[k]
            if (slug, key) in SAID:
                v["said"] = SAID[(slug, key)]
            if r["kind"]:
                v["ring"] = r["kind"]
            if not r["lead"]:
                v["lead"] = False
            v["sources"] = r["sources"]
            if r["notes"]:
                v["notes"] = r["notes"]
            if (slug, key) in KEEP_ROWS and prev:
                v["weeks"] = prev["weeks"]
                report.append(f"kept Helen's row: {slug} / {key}")
            else:
                v["weeks"] = r["runs"]
            new_vars.append(v)
        # Varieties Helen has that the bundle has not (mutton) stay.
        for name, prev in old.items():
            if (slug, name) in RENAMED or any(v["name"] == name for v in new_vars):
                continue
            if name == "" and any(v.get("lead", True) for v in new_vars):
                continue
            new_vars.append(prev)
            report.append(f"kept Helen's variety: {slug} / {name or '(unnamed)'}")
        if len(new_vars) == 1 and new_vars[0].get("ring") != "region":
            new_vars[0]["name"] = ""
            new_vars[0].pop("ring", None)
        food["varieties"] = new_vars
        # A food whose rings name no source (beef, pork, chicken, duck)
        # keeps the one it had, or is common knowledge.
        if food_sources.get(slug):
            food["sources"] = food_sources[slug]
            food.pop("source", None)
        else:
            food["source"] = food.get("source", "general")
            food.pop("sources", None)
        if food_notes.get(slug):
            food["notes"] = food_notes[slug]
        merged_slugs.append(slug)

    for f in foods:
        if f["slug"] in FUNGI:
            f["group"] = "fungi"
    # Snipe goes.
    foods = [f for f in foods if f["slug"] != "snipe"]
    report.append("dropped: snipe")
    for slug, text in UNSOLD.items():
        by_slug[slug]["unsold"] = text
    # BASC does not list squirrel, so it is common knowledge.
    if "squirrel" in by_slug:
        by_slug["squirrel"]["source"] = "general"
        by_slug["squirrel"].pop("sources", None)

    # Colours from colours.yml, food and variety.
    for f in foods:
        c = colours.get(f["slug"])
        if not c:
            report.append(f"no colour in colours.yml: {f['slug']}")
            continue
        f["colour"] = c["colour"].lower()
        for k in ("text_on_shed", "text_on_custard"):
            f.pop(k, None)
            if k in c:
                f[k] = c[k].lower()
        cv = c.get("varieties", {})
        for v in f["varieties"]:
            for k in ("colour", "text_on_shed", "text_on_custard"):
                v.pop(k, None)
            vc = cv.get(v["name"]) or cv.get(v["name"].split(",")[0])
            if v.get("ring") in ("region", "method", "zone", "part") and v["name"] not in cv:
                vc = cv.get(v["name"].split(",")[0]) if v["name"].split(",")[0] in cv else None
            if vc:
                v["colour"] = vc["colour"].lower()
                for k in ("text_on_shed", "text_on_custard"):
                    if k in vc:
                        v[k] = vc[k].lower()
            elif v["name"] and not v.get("ring") and len(f["varieties"]) > 1 and cv:
                report.append(f"no variety colour: {f['slug']} / {v['name']}")

    # Fish buy lines from the Good Fish Guide.
    rated = {SLUG.get(x["id"], x["id"]): x for x in sustain["fish"]}
    if "witch-megrim" in rated:
        rated["witch-sole"] = rated["megrim"] = rated.pop("witch-megrim")
    for f in foods:
        x = rated.get(f["slug"])
        if not x:
            continue
        f["buy"] = buy_line(f["slug"], x)

    # Group order, foods within a group in their old order, new ones after.
    order = {g: i for i, g in enumerate(groups)}
    foods.sort(key=lambda f: order.get(f["group"], 99))
    FOODS.write_text(emit(foods))

    # Sources: the bundle's register, with the keys foods.yml uses.
    keys = {}
    for s in register:
        k = SOURCE_KEY.get(s["key"], s["key"])
        keys[k] = {"key": k, "name": s["name"], "url": s.get("url", "")}
    keys.setdefault("general", {"key": "general", "name": "Common knowledge, not yet checked against a named source", "url": ""})
    SOURCES_OUT.write_text(emit_sources(list(keys.values())))

    # Stubs.
    for f in foods:
        p = STUBS / (f["slug"] + ".md")
        if not p.exists():
            p.write_text(f'---\nslug: {f["slug"]}\ntitle: "Is it {f["name"].lower()} yet?"\n---\n')
            report.append(f"stub: {p.name}")
    snipe = STUBS / "snipe.md"
    if snipe.exists():
        snipe.unlink()
        report.append("removed stub: snipe.md")

    print("\n".join(report))
    print(f"merged {len(merged_slugs)} foods; {len(foods)} foods in all")


def buy_line(slug, x):
    """The Good Fish Guide's guidance in one line."""
    if slug == "cod":
        return ("Good Fish Guide: every cod from UK waters is rated Avoid. The guide's best choice is MSC-certified "
                "line- or net-caught Icelandic cod (rated 2); trawled Barents Sea and Norwegian cod, what UK "
                "distant-water trawlers catch, is rated Avoid.")
    if slug == "mackerel":
        return "Good Fish Guide: every mackerel rating is Avoid."
    b = x.get("best_uk") or {}
    line = f"Good Fish Guide: {b.get('label', 'not rated')}" + (f" ({b['score']})" if b.get("score") else "") + "."
    if x.get("ask_for"):
        line += f" Ask for {x['ask_for']}."
    if x.get("range_note"):
        line += " " + x["range_note"].rstrip(".") + "."
    return line


# --- Writing YAML in foods.yml's own style -------------------------------------

def q(s):
    return json.dumps(s, ensure_ascii=False)


FOOD_KEYS = ["name", "slug", "group", "colour", "text_on_shed", "text_on_custard", "shades", "source", "sources",
             "short", "said", "aliases", "also", "unsold", "note", "notes", "buy", "varieties"]
VAR_KEYS = ["name", "said", "cultivar", "short", "ring", "lead", "colour", "text_on_shed", "text_on_custard",
            "shades", "sources", "notes", "weeks"]


def value(k, v):
    if k in ("slug", "group", "ring", "source"):
        return str(v)
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, list):
        return "[" + ", ".join(q(x) if k not in ("sources",) else str(x) for x in v) + "]"
    return q(v)


def emit(foods):
    head = FOODS.read_text().split("\n- name:")[0].rstrip() + "\n"
    out = [head]
    for f in foods:
        lines = []
        for k in FOOD_KEYS:
            if k not in f or k == "varieties":
                continue
            if k == "notes":
                lines.append("  notes:")
                lines += [f"    - {q(n)}" for n in f[k]]
                continue
            lines.append(f"  {k}: {value(k, f[k])}")
        lines[0] = "-" + lines[0][1:]
        lines.append("  varieties:")
        for v in f["varieties"]:
            vl = []
            for k in VAR_KEYS:
                if k not in v:
                    continue
                if k == "weeks":
                    vl.append("      weeks:")
                    vl += [f"        - [{a}, {b}, {s}]" for a, b, s in v[k]]
                elif k == "notes":
                    vl.append("      notes:")
                    vl += [f"        - {q(n)}" for n in v[k]]
                else:
                    vl.append(f"      {k}: {value(k, v[k])}")
            vl[0] = "    -" + vl[0][5:]
            lines += vl
        out.append("\n" + "\n".join(lines) + "\n")
    return "".join(out)


def emit_sources(items):
    head = ("# Where the seasons come from: every key a food or a variety's `sources`\n"
            "# (or an older food's `source`) may name, with its name and address.\n"
            "# From the 21 October 2026 bundle's register (tools/merge-bundle.py);\n"
            "# ffs is Flying Fish Seafoods, the bundle's flying_fish.\n")
    out = [head]
    for s in sorted(items, key=lambda s: s["key"]):
        out.append(f"\n- key: {s['key']}\n  name: {q(s['name'])}\n  url: {q(s['url'])}\n")
    return "".join(out)


if __name__ == "__main__":
    main()
