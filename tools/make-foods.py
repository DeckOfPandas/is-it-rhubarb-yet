"""Write _data/foods.yml and the _foods/ page stubs from the extracted
New Covent Garden Market rows plus a curated list of additions.

usage: python3 -I tools/make-foods.py

This is the one-off derivation of the dataset. Once _data/foods.yml has been
hand-edited it is the source of truth; rerunning this script overwrites it.

Month states from the PDF: "in" (dark green), "avail" (light green: coming
in or going out), "store" (yellow: from storage). "store" is dropped. Months
become week ranges on a 52-week year where week 1 starts on 1 January and
each later week starts 7 days after the last, so week 52 holds the final
8 or 9 days.
"""

import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
EXTRACTED = HERE / "ncgm-extracted.json"
OUT_YAML = ROOT / "_data" / "foods.yml"
OUT_PAGES = ROOT / "_foods"

# First week of each month on the day-of-year/7 grid, then 53 as a sentinel.
MONTH_START_WEEK = [1, 5, 9, 14, 18, 23, 27, 31, 36, 40, 44, 49, 53]
GLYPH = {"#": "in", "+": "avail", ".": "", "o": ""}


def ncgm(name, variety=""):
    """Look up a row from the PDF by its printed name and variety."""
    return ("ncgm", name, variety)


def months(pattern):
    """Twelve glyphs, January first: # in season, + just about, . nothing."""
    assert len(pattern) == 12, pattern
    return ("months", pattern, "")


# Curated list. Each food: name, group, colour, source, note, varieties.
# A variety is (label, lookup); label "" means the food has one season.
FOODS = [
    # ---- Vegetables -------------------------------------------------------
    ("Asparagus", "veg", "#7fae3f", "ncgm", "",
     [("", ncgm("Asparagus", "Green/Purple"))]),
    ("Aubergine", "veg", "#4a2a6a", "ncgm", "",
     [("", ncgm("Aubergine"))]),
    ("Broad beans", "veg", "#8fbf5a", "ncgm", "",
     [("", ncgm("Beans", "Broad"))]),
    ("Runner & French beans", "veg", "#3f8f4a", "ncgm", "",
     [("", ncgm("Beans", "French/Runner/Flat"))]),
    ("Beetroot", "veg", "#8b1a4a", "ncgm", "",
     [("", ncgm("Beetroot"))]),
    ("Broccoli", "veg", "#2f7a3e", "ncgm",
     "NCGM shows purple sprouting almost all year; BBC Good Food has it January to April, which matches how it is sold. BBC used here.",
     [("Calabrese", ncgm("Broccoli", "Calabrese")),
      ("Purple sprouting", months("+###........"))]),
    ("Brussels sprouts", "veg", "#4f8a3a", "ncgm", "",
     [("", ncgm("Brussel sprouts"))]),
    ("Cabbage", "veg", "#5a9a5a", "ncgm", "",
     [("Red", ncgm("Cabbage", "Red")),
      ("Savoy", ncgm("Cabbage", "Savoy")),
      ("Winter white", ncgm("Cabbage", "Winter white"))]),
    ("Spring greens", "veg", "#6fb24a", "ncgm",
     "NCGM has these most of the year; BBC Good Food gives March to June.",
     [("", ncgm("Cabbage", "Spring green"))]),
    ("Carrots", "veg", "#e8731a", "ncgm", "",
     [("", ncgm("Carrots"))]),
    ("Cauliflower", "veg", "#e6dcc3", "ncgm", "",
     [("", ncgm("Cauliflower"))]),
    ("Celeriac", "veg", "#b9a98a", "ncgm", "",
     [("", ncgm("Celeriac"))]),
    ("Chard", "veg", "#c8342b", "ncgm", "",
     [("", ncgm("Chard"))]),
    ("Chillies", "veg", "#d62828", "ncgm", "",
     [("", ncgm("Chilli"))]),
    ("Courgettes", "veg", "#4a8f2a", "ncgm", "",
     [("", ncgm("Courgettes"))]),
    ("Courgette flowers", "veg", "#f2b705", "bbc", "",
     [("", months(".....###...."))]),
    ("Fennel", "veg", "#a9c98a", "ncgm", "",
     [("", ncgm("Fennel"))]),
    ("Garlic", "veg", "#d9cfc0", "ncgm", "",
     [("", ncgm("Garlic"))]),
    ("Globe artichokes", "veg", "#6a8f5a", "ncgm", "",
     [("", ncgm("Artichoke", "Globe"))]),
    ("Horseradish", "veg", "#cfc6a8", "ncgm", "",
     [("", ncgm("Horseradish"))]),
    ("Jerusalem artichokes", "veg", "#9c7a4a", "ncgm", "",
     [("", ncgm("Artichoke", "Jerusalem"))]),
    ("Kale", "veg", "#2d5a3a", "ncgm", "",
     [("", ncgm("Kale"))]),
    ("Cavolo nero", "veg", "#1f3d2b", "bbc",
     "BBC Good Food screenshot is cut off after September; the autumn months are assumed.",
     [("", months("....+#######"))]),
    ("Kohlrabi", "veg", "#b7c9a3", "ncgm", "",
     [("", ncgm("Kohlrabi"))]),
    ("Leeks", "veg", "#6a9f5a", "ncgm", "",
     [("", ncgm("Leeks"))]),
    ("Mangetout", "veg", "#9ccf6a", "bbc", "",
     [("", months(".....###...."))]),
    ("Marrow", "veg", "#5f8f3a", "ncgm", "",
     [("", ncgm("Marrow"))]),
    ("Onions", "veg", "#c89a5a", "ncgm", "",
     [("", ncgm("Onions"))]),
    ("Pak choi", "veg", "#8fbf7a", "ncgm", "",
     [("", ncgm("Pak choy"))]),
    ("Parsnips", "veg", "#e3d7b8", "ncgm", "",
     [("", ncgm("Parsnips"))]),
    ("Peas", "veg", "#6fbf3a", "ncgm", "",
     [("", ncgm("Peas"))]),
    ("Peppers", "veg", "#e04a1a", "ncgm", "",
     [("", ncgm("Peppers", "Capsicum"))]),
    ("Potatoes", "veg", "#b78a5a", "ncgm", "",
     [("New", ncgm("Potatoes", "New")),
      ("Maincrop", ncgm("Potatoes", "Maincrop"))]),
    ("Pumpkin", "veg", "#e8871a", "ncgm",
     "NCGM also marks January to March, presumably stored; kept as given.",
     [("", ncgm("Pumpkins"))]),
    ("Romanesco", "veg", "#9fc24a", "ncgm", "",
     [("", ncgm("Romanesco"))]),
    ("Salsify", "veg", "#8a7a6a", "bbc",
     "BBC Good Food screenshot is cut off after September; October to December assumed.",
     [("", months("#......+####"))]),
    ("Samphire", "veg", "#3fa07a", "ncgm", "",
     [("", ncgm("Samphire"))]),
    ("Shallots", "veg", "#b06a4a", "ncgm", "",
     [("", ncgm("Shallot"))]),
    ("Spinach", "veg", "#2f7a2f", "ncgm", "",
     [("", ncgm("Spinach"))]),
    ("Squash", "veg", "#d9a21a", "ncgm", "",
     [("", ncgm("Squash"))]),
    ("Swede", "veg", "#c9a04a", "ncgm", "",
     [("", ncgm("Swede"))]),
    ("Sweetcorn", "veg", "#f2c31a", "ncgm", "",
     [("", ncgm("Sweetcorn"))]),
    ("Turnips", "veg", "#d8c7d8", "ncgm", "",
     [("", ncgm("Turnips"))]),

    # ---- Salad ------------------------------------------------------------
    ("Celery", "salad", "#9fcf7a", "ncgm", "",
     [("", ncgm("Celery"))]),
    ("Chicory & radicchio", "salad", "#a83a5a", "ncgm", "",
     [("", ncgm("Chicory/Endive/Radicchio", "Jerusalem"))]),
    ("Cucumber", "salad", "#5fae3a", "ncgm", "",
     [("", ncgm("Cucumber"))]),
    ("Edible flowers", "salad", "#e07aa8", "ncgm", "",
     [("", ncgm("Edible flowers"))]),
    ("Lettuce", "salad", "#8fd14a", "ncgm",
     "NCGM lists five types; this row is their union.",
     [("", months("..+#######+."))]),
    ("Radishes", "salad", "#e0305a", "ncgm", "",
     [("", ncgm("Radish")),
      ("Mooli", ncgm("Radish", "Daikon/mooli"))]),
    ("Rocket", "salad", "#4f9a3a", "ncgm", "",
     [("", ncgm("Rocket"))]),
    ("Spring onions", "salad", "#7fc04a", "ncgm", "",
     [("", ncgm("Spring onions"))]),
    ("Tomatoes", "salad", "#e03a2a", "ncgm", "",
     [("", ncgm("Tomatoes"))]),
    ("Watercress", "salad", "#2f6a3a", "ncgm", "",
     [("", ncgm("Watercress"))]),

    # ---- Fruit & nuts -----------------------------------------------------
    ("Apples", "fruit", "#c8302a", "ncgm",
     "NCGM lists eight varieties; three early-eater rows (Early Windsor, Golden Delicious, Royal Gala) are left out. NCGM marks Discovery as only 'available' in August and September; here August is in season, as it is sold.",
     [("Discovery", months(".......#+...")),
      ("Bramley", ncgm("Apples", "Bramley")),
      ("Cox", ncgm("Apples", "Cox")),
      ("Egremont Russet", ncgm("Apples", "Egremont russet")),
      ("Braeburn", ncgm("Apples", "Braeburn"))]),
    ("Blackberries", "fruit", "#3a1f4a", "ncgm", "",
     [("", ncgm("Blackberries"))]),
    ("Blackcurrants & redcurrants", "fruit", "#5a1a3a", "ncgm",
     "BBC Good Food has blackcurrants from late May to July; NCGM has July to August.",
     [("", ncgm("Black/White/Redcurrants", "Maincrop"))]),
    ("Blueberries", "fruit", "#3a4a8a", "ncgm", "",
     [("", ncgm("Blueberries"))]),
    ("Cherries", "fruit", "#a8102a", "ncgm",
     "BBC Good Food has cherries June to July; NCGM runs later.",
     [("", ncgm("Cherries"))]),
    ("Cobnuts", "nuts", "#a67c52", "ncgm", "",
     [("", ncgm("Cobnuts"))]),
    ("Damsons", "fruit", "#4a2a6a", "ncgm", "",
     [("", ncgm("Damsons"))]),
    ("Gooseberries", "fruit", "#a8c84a", "ncgm", "",
     [("", ncgm("Gooseberries"))]),
    ("Loganberries & tayberries", "fruit", "#9a2a4a", "bbc", "",
     [("", months("......##...."))]),
    ("Medlars", "fruit", "#8a6a3a", "ncgm", "",
     [("", ncgm("Medlar"))]),
    ("Pears", "fruit", "#b8c84a", "ncgm", "",
     [("Williams", ncgm("Pears", "Williams")),
      ("Conference", ncgm("Pears", "Conference")),
      ("Comice", ncgm("Pears", "Comice/Concorde"))]),
    ("Plums", "fruit", "#6a2a8a", "ncgm", "",
     [("", ncgm("Plums"))]),
    ("Quince", "fruit", "#e8c84a", "ncgm", "",
     [("", ncgm("Quince"))]),
    ("Raspberries", "fruit", "#d8305a", "ncgm", "",
     [("", ncgm("Raspberries"))]),
    ("Rhubarb", "fruit", "#e0407a", "ncgm",
     "BBC Good Food has rhubarb January to June with no forced/outdoor split.",
     [("Forced", ncgm("Rhubarb", "Forced")),
      ("Outdoor", ncgm("Rhubarb", "Outdoor"))]),
    ("Strawberries", "fruit", "#e8203a", "ncgm", "",
     [("", ncgm("Strawberries"))]),
    ("Walnuts", "nuts", "#7a5a3a", "ncgm", "Fresh (wet) walnuts.",
     [("", ncgm("Walnuts", "Fresh"))]),
    ("Sweet chestnuts", "nuts", "#6a3a1a", "general", "",
     [("", months(".........##+"))]),

    # ---- Wild & foraged ---------------------------------------------------
    ("Wild garlic", "wild", "#5fa83a", "general", "",
     [("", months("..+##......."))]),
    ("Elderflower", "wild", "#f3e9b5", "general", "",
     [("", months("....+#......"))]),
    ("Elderberries", "wild", "#2a1a3a", "general", "",
     [("", months(".......+#..."))]),
    ("Sloes", "wild", "#2a2a5a", "general", "",
     [("", months(".........##."))]),
    ("Girolles", "wild", "#e8a21a", "ncgm", "",
     [("", ncgm("Girolle", "Scottish, wild"))]),
    ("Morels", "wild", "#8a6a4a", "ncgm", "",
     [("", ncgm("Morel", "Wild"))]),
]

GROUPS = {
    "veg": "Vegetables",
    "salad": "Salad",
    "fruit": "Fruit",
    "nuts": "Nuts",
    "wild": "Wild & foraged",
}


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def month_states(lookup, rows):
    kind, a, b = lookup
    if kind == "months":
        return [GLYPH[c] for c in a]
    def plain(s):
        # The PDF's WinAnsi text leaves a stray right-quote byte on "Williams'".
        return "".join(c for c in s if ord(c) < 128).strip()
    matches = [r for r in rows if plain(r["name"]) == a and plain(r["variety"]) == b]
    if len(matches) != 1:
        raise SystemExit(f"expected one NCGM row for {a!r}/{b!r}, found {len(matches)}")
    return ["" if s == "store" else s for s in matches[0]["months"]]


def week_ranges(states):
    """Merge consecutive months of the same state into [from, to, state]."""
    ranges = []
    for m, state in enumerate(states):
        if not state:
            continue
        start, end = MONTH_START_WEEK[m], MONTH_START_WEEK[m + 1] - 1
        if ranges and ranges[-1][2] == state and ranges[-1][1] == start - 1:
            ranges[-1][1] = end
        else:
            ranges.append([start, end, state])
    return ranges


def yaml_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def main() -> None:
    rows = json.loads(EXTRACTED.read_text())
    out = ["# UK seasonality, one entry per food. Generated once by",
           "# tools/make-foods.py and hand-edited since: this file is the truth.",
           "#",
           "# weeks: [from, to, state] on a 52-week year (week 1 starts 1 January).",
           "# state: in = in season, avail = just coming in or going out.",
           "# source: ncgm = New Covent Garden Market calendar, bbc = BBC Good Food,",
           "#         general = common knowledge, please check.",
           ""]
    slugs = set()
    OUT_PAGES.mkdir(exist_ok=True)
    for old in OUT_PAGES.glob("*.md"):
        old.unlink()

    for name, group, colour, source, note, varieties in FOODS:
        slug = slugify(name)
        assert slug not in slugs, slug
        slugs.add(slug)
        out.append(f"- name: {yaml_str(name)}")
        out.append(f"  slug: {slug}")
        out.append(f"  group: {group}")
        out.append(f"  colour: {yaml_str(colour)}")
        out.append(f"  source: {source}")
        if note:
            out.append(f"  note: {yaml_str(note)}")
        out.append("  varieties:")
        for label, lookup in varieties:
            ranges = week_ranges(month_states(lookup, rows))
            if not ranges:
                raise SystemExit(f"{name} / {label}: no season at all")
            out.append(f"    - name: {yaml_str(label)}")
            out.append("      weeks:")
            for r in ranges:
                out.append(f"        - [{r[0]}, {r[1]}, {r[2]}]")
        out.append("")
        (OUT_PAGES / f"{slug}.md").write_text(
            f"---\nslug: {slug}\ntitle: {yaml_str('Is it ' + name.lower() + ' yet?')}\n---\n")

    OUT_YAML.write_text("\n".join(out))
    print(f"{len(FOODS)} foods -> {OUT_YAML.relative_to(ROOT)} and {OUT_PAGES.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
