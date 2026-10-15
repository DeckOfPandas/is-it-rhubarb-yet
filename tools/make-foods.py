"""Write _data/foods.yml and the _foods/ page stubs from the extracted
New Covent Garden Market rows plus a curated list of additions.

usage: python3 -I tools/make-foods.py [--wheels]

This is the one-off derivation of the dataset. Once _data/foods.yml has been
hand-edited it is the source of truth; rerunning this script overwrites it.

--wheels also writes a stub per food into _wheels/, which Jekyll turns into
a standalone SVG of the food's season wheel at /wheel/<slug>.svg.

Month states from the PDF: "in" (dark green), "avail" (light green: coming
in or going out), "store" (yellow: from storage). "store" is dropped. Months
become week ranges on a 52-week year where week 1 starts on 1 January and
each later week starts 7 days after the last, so week 52 holds the final
8 or 9 days.

Groups are the culinary families in _data/groups.yml.
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
EXTRACTED = HERE / "ncgm-extracted.json"
OUT_YAML = ROOT / "_data" / "foods.yml"
OUT_PAGES = ROOT / "_foods"
OUT_WHEELS = ROOT / "_wheels"

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


def v(label, lookup, colour=None, shades=None):
    """A variety: label "" means the food has one season. A colour here
    overrides the food's colour for this row. Shades are two or three
    colours the season wheel sweeps through over the in-season run."""
    return (label, lookup, colour, shades)


# Curated list. Each food: name, group, colour, source, note, varieties.
# Colours are chosen by hand so that rows next to each other on the chart
# differ, and so that each food is its own recognisable colour.
FOODS = [
    # ---- Roots & tubers ---------------------------------------------------
    ("Beetroot", "roots", "#8b1a4a", "ncgm", "",
     [v("", ncgm("Beetroot"))]),
    ("Carrots", "roots", "#e8731a", "ncgm", "",
     [v("", ncgm("Carrots"))]),
    ("Celeriac", "roots", "#b9a98a", "ncgm", "",
     [v("", ncgm("Celeriac"))]),
    ("Horseradish", "roots", "#cfc6a8", "ncgm", "",
     [v("", ncgm("Horseradish"))]),
    ("Jerusalem artichokes", "roots", "#9c7a4a", "ncgm", "",
     [v("", ncgm("Artichoke", "Jerusalem"))]),
    ("Parsnips", "roots", "#e3d7b8", "ncgm", "",
     [v("", ncgm("Parsnips"))]),
    ("Potatoes", "roots", "#b78a5a", "ncgm", "",
     [v("New", ncgm("Potatoes", "New"), "#e3cf9a"),
      v("Maincrop", ncgm("Potatoes", "Maincrop"), "#a0703f")]),
    ("Radishes", "roots", "#e0305a", "ncgm", "",
     [v("", ncgm("Radish")),
      v("Mooli", ncgm("Radish", "Daikon/mooli"), "#ece6d6")]),
    ("Salsify", "roots", "#8a7a6a", "bbc",
     "BBC Good Food screenshot is cut off after September; October to December assumed.",
     [v("", months("#......+####"))]),
    ("Swede", "roots", "#c9a04a", "ncgm", "",
     [v("", ncgm("Swede"))]),
    ("Turnips", "roots", "#d8c7d8", "ncgm", "",
     [v("", ncgm("Turnips"))]),

    # ---- Brassicas --------------------------------------------------------
    ("Broccoli", "brassicas", "#2f7a3e", "ncgm",
     "NCGM shows purple sprouting almost all year; BBC Good Food has it January to April, which matches how it is sold. BBC used here.",
     [v("Calabrese", ncgm("Broccoli", "Calabrese"), "#3a8a3a"),
      v("Purple sprouting", months("+###........"), "#7a3a8a")]),
    ("Brussels sprouts", "brassicas", "#4f8a3a", "ncgm", "",
     [v("", ncgm("Brussel sprouts"))]),
    ("Cabbage", "brassicas", "#5a9a5a", "ncgm", "",
     [v("Red", ncgm("Cabbage", "Red"), "#7a2a6a"),
      v("Savoy", ncgm("Cabbage", "Savoy"), "#3f7f3a"),
      v("Winter white", ncgm("Cabbage", "Winter white"), "#cfe0b8")]),
    ("Spring greens", "brassicas", "#6fb24a", "ncgm",
     "NCGM has these most of the year; BBC Good Food gives March to June.",
     [v("", ncgm("Cabbage", "Spring green"))]),
    ("Cauliflower", "brassicas", "#e6dcc3", "ncgm", "",
     [v("", ncgm("Cauliflower"))]),
    ("Cavolo nero", "brassicas", "#1f3d2b", "bbc",
     "BBC Good Food screenshot is cut off after September; the autumn months are assumed.",
     [v("", months("....+#######"))]),
    ("Kale", "brassicas", "#2d5a3a", "ncgm", "",
     [v("", ncgm("Kale"))]),
    ("Kohlrabi", "brassicas", "#b7c9a3", "ncgm", "",
     [v("", ncgm("Kohlrabi"))]),
    ("Pak choi", "brassicas", "#8fbf7a", "ncgm", "",
     [v("", ncgm("Pak choy"))]),
    ("Romanesco", "brassicas", "#9fc24a", "ncgm", "",
     [v("", ncgm("Romanesco"))]),

    # ---- Alliums ----------------------------------------------------------
    ("Garlic", "alliums", "#d9cfc0", "ncgm", "",
     [v("", ncgm("Garlic"))]),
    ("Leeks", "alliums", "#6a9f5a", "ncgm", "",
     [v("", ncgm("Leeks"))]),
    ("Onions", "alliums", "#c89a5a", "ncgm", "",
     [v("", ncgm("Onions"))]),
    ("Shallots", "alliums", "#b06a4a", "ncgm", "",
     [v("", ncgm("Shallot"))]),
    ("Spring onions", "alliums", "#7fc04a", "ncgm", "",
     [v("", ncgm("Spring onions"))]),

    # ---- Leaves & salad ---------------------------------------------------
    ("Chard", "leaves", "#2f8f4a", "ncgm", "",
     [v("", ncgm("Chard"))]),
    ("Chicory & radicchio", "leaves", "#a83a5a", "ncgm", "",
     [v("", ncgm("Chicory/Endive/Radicchio", "Jerusalem"))]),
    ("Cucumber", "leaves", "#5fae3a", "ncgm", "",
     [v("", ncgm("Cucumber"))]),
    ("Edible flowers", "leaves", "#e07aa8", "ncgm", "",
     [v("", ncgm("Edible flowers"))]),
    ("Lettuce", "leaves", "#8fd14a", "ncgm",
     "NCGM lists five types; this row is their union.",
     [v("", months("..+#######+."))]),
    ("Rocket", "leaves", "#4f9a3a", "ncgm", "",
     [v("", ncgm("Rocket"))]),
    ("Spinach", "leaves", "#2f7a2f", "ncgm", "",
     [v("", ncgm("Spinach"))]),
    ("Watercress", "leaves", "#2f6a3a", "ncgm", "",
     [v("", ncgm("Watercress"))]),

    # ---- Shoots, pods & stems ---------------------------------------------
    ("Asparagus", "shoots", "#7fae3f", "ncgm", "",
     [v("", ncgm("Asparagus", "Green/Purple"))]),
    ("Broad beans", "shoots", "#8fbf5a", "ncgm", "",
     [v("", ncgm("Beans", "Broad"))]),
    ("Runner & French beans", "shoots", "#3f8f4a", "ncgm", "",
     [v("", ncgm("Beans", "French/Runner/Flat"))]),
    ("Celery", "shoots", "#9fcf7a", "ncgm", "",
     [v("", ncgm("Celery"))]),
    ("Fennel", "shoots", "#a9c98a", "ncgm", "",
     [v("", ncgm("Fennel"))]),
    ("Globe artichokes", "shoots", "#6a8f5a", "ncgm", "",
     [v("", ncgm("Artichoke", "Globe"))]),
    ("Mangetout", "shoots", "#9ccf6a", "bbc", "",
     [v("", months(".....###...."))]),
    ("Peas", "shoots", "#6fbf3a", "ncgm", "",
     [v("", ncgm("Peas"))]),
    ("Sweetcorn", "shoots", "#f2c31a", "ncgm", "",
     [v("", ncgm("Sweetcorn"))]),

    # ---- Squash & fruiting veg --------------------------------------------
    ("Aubergine", "fruiting", "#4a2a6a", "ncgm", "",
     [v("", ncgm("Aubergine"))]),
    ("Chillies", "fruiting", "#d62828", "ncgm", "",
     [v("", ncgm("Chilli"))]),
    ("Courgettes", "fruiting", "#4a8f2a", "ncgm", "",
     [v("", ncgm("Courgettes"))]),
    ("Courgette flowers", "fruiting", "#f2b705", "bbc", "",
     [v("", months(".....###...."))]),
    ("Marrow", "fruiting", "#5f8f3a", "ncgm", "",
     [v("", ncgm("Marrow"))]),
    ("Peppers", "fruiting", "#e04a1a", "ncgm", "",
     [v("", ncgm("Peppers", "Capsicum"))]),
    ("Pumpkin", "fruiting", "#e8871a", "ncgm",
     "NCGM also marks January to March, presumably stored; kept as given.",
     [v("", ncgm("Pumpkins"))]),
    ("Squash", "fruiting", "#d9a21a", "ncgm", "",
     [v("", ncgm("Squash"))]),
    ("Tomatoes", "fruiting", "#e03a2a", "ncgm", "",
     [v("", ncgm("Tomatoes"), shades=["#8ab83a", "#e03a2a", "#8a1e1e"])]),

    # ---- Orchard fruit ----------------------------------------------------
    ("Apples", "orchard", "#c8302a", "ncgm",
     "NCGM lists eight varieties; three early-eater rows (Early Windsor, Golden Delicious, Royal Gala) are left out. NCGM marks Discovery as only 'available' in August and September; here August is in season, as it is sold.",
     [v("Discovery", months(".......#+..."), "#e85a5a"),
      v("Bramley", ncgm("Apples", "Bramley"), "#8fbf3a"),
      v("Cox", ncgm("Apples", "Cox"), "#d0742a"),
      v("Egremont Russet", ncgm("Apples", "Egremont russet"), "#a67c3a"),
      v("Braeburn", ncgm("Apples", "Braeburn"), "#b8302a")]),
    ("Cherries", "orchard", "#a8102a", "ncgm",
     "BBC Good Food has cherries June to July; NCGM runs later.",
     [v("", ncgm("Cherries"))]),
    ("Damsons", "orchard", "#3f2a7a", "ncgm", "",
     [v("", ncgm("Damsons"))]),
    ("Medlars", "orchard", "#8a6a3a", "ncgm", "",
     [v("", ncgm("Medlar"))]),
    ("Pears", "orchard", "#b8c84a", "ncgm", "",
     [v("Williams", ncgm("Pears", "Williams"), "#d8e06a"),
      v("Conference", ncgm("Pears", "Conference"), "#9fb84a"),
      v("Comice", ncgm("Pears", "Comice/Concorde"), "#d8b84a")]),
    ("Plums", "orchard", "#6a2a8a", "ncgm", "",
     [v("", ncgm("Plums"))]),
    ("Quince", "orchard", "#e8c84a", "ncgm", "",
     [v("", ncgm("Quince"))]),

    # ---- Soft fruit & rhubarb ---------------------------------------------
    ("Blackberries", "soft", "#3a1f4a", "ncgm", "",
     [v("", ncgm("Blackberries"))]),
    ("Blackcurrants & redcurrants", "soft", "#5a1a3a", "ncgm",
     "BBC Good Food has blackcurrants from late May to July; NCGM has July to August.",
     [v("", ncgm("Black/White/Redcurrants", "Maincrop"))]),
    ("Blueberries", "soft", "#3a4a8a", "ncgm", "",
     [v("", ncgm("Blueberries"))]),
    ("Gooseberries", "soft", "#a8c84a", "ncgm", "",
     [v("", ncgm("Gooseberries"))]),
    ("Loganberries & tayberries", "soft", "#9a2a4a", "bbc", "",
     [v("", months("......##...."))]),
    ("Raspberries", "soft", "#d8305a", "ncgm", "",
     [v("", ncgm("Raspberries"))]),
    ("Rhubarb", "soft", "#e0407a", "ncgm",
     "BBC Good Food has rhubarb January to June with no forced/outdoor split.",
     [v("Forced", ncgm("Rhubarb", "Forced"), "#ff5c9a"),
      v("Outdoor", ncgm("Rhubarb", "Outdoor"), "#c8285f")]),
    ("Strawberries", "soft", "#e8203a", "ncgm", "",
     [v("", ncgm("Strawberries"))]),

    # ---- Nuts -------------------------------------------------------------
    ("Cobnuts", "nuts", "#a67c52", "ncgm", "",
     [v("", ncgm("Cobnuts"))]),
    ("Walnuts", "nuts", "#7a5a3a", "ncgm", "Fresh (wet) walnuts.",
     [v("", ncgm("Walnuts", "Fresh"))]),

    # ---- Foraged & wild (hedgerow, shore and woodland; months are when
    # they are found, not when a shop has them) ------------------------------
    ("Wild garlic", "foraged", "#5fa83a", "general", "",
     [v("", months("..+##......."))]),
    ("Nettles", "foraged", "#4a7a2a", "general", "Young tops only; tough and gritty once they flower.",
     [v("", months("..##+......."))]),
    ("Dandelion", "foraged", "#f0d020", "general", "Leaves before the flowers open.",
     [v("", months("..##+......."))]),
    ("Sea beet", "foraged", "#2a6a3a", "general", "",
     [v("", months("..+#####+..."))]),
    ("Samphire", "foraged", "#3fa07a", "ncgm", "Marsh samphire.",
     [v("", ncgm("Samphire"))]),
    ("Elderflower", "foraged", "#f3e9b5", "general", "",
     [v("", months("....+#......"))]),
    ("Meadowsweet", "foraged", "#f0e8c0", "general", "",
     [v("", months(".....###...."))]),
    ("Wild strawberries", "foraged", "#e04a60", "general", "",
     [v("", months(".....##....."))]),
    ("Bilberries", "foraged", "#3a2a6a", "general", "",
     [v("", months("......##...."))]),
    ("Elderberries", "foraged", "#2a1a3a", "general", "",
     [v("", months(".......+#..."))]),
    ("Ceps", "foraged", "#a07040", "general", "Penny buns.",
     [v("", months(".......###.."))]),
    ("Field mushrooms", "foraged", "#c8b8a8", "general", "",
     [v("", months(".......###.."))]),
    ("Giant puffball", "foraged", "#e8e0c8", "general", "",
     [v("", months(".......###.."))]),
    ("Girolles", "foraged", "#e8a21a", "ncgm", "Chanterelles.",
     [v("", ncgm("Girolle", "Scottish, wild"))]),
    ("Hedgehog fungus", "foraged", "#d8b878", "general", "",
     [v("", months("........###."))]),
    ("Morels", "foraged", "#8a6a4a", "ncgm", "",
     [v("", ncgm("Morel", "Wild"))]),
    ("Rosehips", "foraged", "#d0402a", "general", "Best after the first frost.",
     [v("", months("........##+."))]),
    ("Crab apples", "foraged", "#c8a030", "general", "",
     [v("", months("........##.."))]),
    ("Sea buckthorn", "foraged", "#f0a020", "general", "",
     [v("", months("........##.."))]),
    ("Sloes", "foraged", "#2a2a5a", "general", "",
     [v("", months(".........##."))]),
    ("Sweet chestnuts", "foraged", "#6a3a1a", "general", "",
     [v("", months(".........##+"))]),

    # ---- Herbs (outdoor-grown; most are sold all year from glass) -----------
    ("Basil", "herbs", "#3f9a3f", "general", "",
     [v("", months(".....+###+.."))]),
    ("Bay", "herbs", "#4a6a3a", "general", "Evergreen, picked all year.",
     [v("", months("############"))]),
    ("Chervil", "herbs", "#9ad07a", "general", "",
     [v("", months("..+####+...."))]),
    ("Chives", "herbs", "#6aa05a", "general", "",
     [v("", months("..+#####+..."))]),
    ("Coriander", "herbs", "#78b86a", "general", "",
     [v("", months("....+####+.."))]),
    ("Dill", "herbs", "#a9c93a", "general", "",
     [v("", months(".....####+.."))]),
    ("Lovage", "herbs", "#5a8a2a", "general", "",
     [v("", months("...+####+..."))]),
    ("Marjoram & oregano", "herbs", "#7a9a4a", "general", "",
     [v("", months("....+####+.."))]),
    ("Mint", "herbs", "#2fae7a", "general", "",
     [v("", months("...+#####+.."))]),
    ("Parsley", "herbs", "#3a8a4a", "general", "",
     [v("", months("..+#######+."))]),
    ("Rosemary", "herbs", "#5a7a6a", "general", "Evergreen, picked all year.",
     [v("", months("############"))]),
    ("Sage", "herbs", "#8a9a8a", "general", "",
     [v("", months("..+#######+."))]),
    ("Sorrel", "herbs", "#6fbf4f", "general", "",
     [v("", months("..+####+...."))]),
    ("Tarragon", "herbs", "#8ab07a", "general", "",
     [v("", months("....+####+.."))]),
    ("Thyme", "herbs", "#7a8a5a", "general", "",
     [v("", months("...+######+."))]),

    # ---- Fish & shellfish (UK waters; months are the usual best, not legal
    # seasons; the Marine Conservation Society's Good Fish Guide is the
    # source to check against) ---------------------------------------------
    ("Mackerel", "fish", "#4a7a9a", "general", "The summer mackerel of common knowledge. Flying Fish Seafoods have Cornish handline mackerel poor in June and July and better in winter, so this row may be wrong.",
     [v("", months(".....####+.."))]),
    ("Sea bass", "fish", "#8a9aaa", "general", "Wild, line-caught. Flying Fish Seafoods have Cornish bass good from January to March and poor in early summer.",
     [v("", months("###+....+###"))]),
    ("Sardines", "fish", "#5a8aa8", "general", "Cornish sardines; Flying Fish Seafoods mark January to April as the best quality.",
     [v("", months("####...+####"))]),
    ("Herring", "fish", "#7a8a9a", "general", "",
     [v("", months(".....+####+."))]),
    ("Cod", "fish", "#dcdccc", "general", "",
     [v("", months("##+......+##"))]),
    ("Haddock", "fish", "#b8c0c8", "general", "Flying Fish Seafoods mark February to April as the best quality.",
     [v("", months("####+...+###"))]),
    ("Hake", "fish", "#9aa8b8", "general", "",
     [v("", months(".....######+"))]),
    ("Plaice", "fish", "#c8a070", "general", "Thin and poor until it recovers from spawning in spring.",
     [v("", months("....+####+.."))]),
    ("Dover sole", "fish", "#c0b090", "general", "Poor in January and February after spawning; Flying Fish Seafoods mark March, April and July as the best quality.",
     [v("", months("..#######+.."))]),
    ("Pollock", "fish", "#6a7a8a", "general", "Flying Fish Seafoods have Cornish pollack poor in January and February and good from March.",
     [v("", months("..###+...###"))]),
    ("Whiting", "fish", "#d0d8e0", "general", "",
     [v("", months("##+.....+###"))]),
    ("Wild salmon", "fish", "#f08070", "general", "Rod-caught Scottish; most salmon sold is farmed all year.",
     [v("", months("..+#####+..."))]),
    ("Sea trout", "fish", "#e89a8a", "general", "",
     [v("", months("...+####+..."))]),
    ("Squid", "fish", "#e8e0e8", "general", "Flying Fish Seafoods mark January to March as the best quality for Cornish squid.",
     [v("", months("###+...+####"))]),
    ("Brown crab", "fish", "#c05a2a", "general", "Poor in January; Flying Fish Seafoods mark March to June as the best quality.",
     [v("", months("..+########."))]),
    ("Lobster", "fish", "#1a3a6a", "general", "",
     [v("", months("....+#####+."))]),
    ("Langoustines", "fish", "#e87a5a", "general", "",
     [v("", months("...+######+."))]),
    ("Mussels", "fish", "#1a2a3a", "general", "Rope-grown mussels are sold all year; wild ones are best in the cold months.",
     [v("", months("####+...+###"))]),
    ("Oysters", "fish", "#8a8a7a", "general", "Natives in the months with an R; rock oysters all year.",
     [v("", months("####....####"))]),
    ("Scallops", "fish", "#f0c8a0", "general", "",
     [v("", months("###+....+###"))]),
    ("Cockles", "fish", "#c8b898", "general", "",
     [v("", months("....+######."))]),
    ("Brown shrimp", "fish", "#d8a878", "general", "",
     [v("", months("....+#####+."))]),

    # ---- Meat & game (game months are the English and Welsh shooting
    # seasons from BASC; Scotland and Northern Ireland differ. "Best" months
    # for the rest follow the Thyme & Envy meat and game chart) --------------
    ("Lamb", "meat", "#b05050", "general", "",
     [v("New season", months("....+######+"), "#d06868"),
      v("Mutton", months("##+.....+###"), "#7a3030")]),
    ("Beef", "meat", "#6a2a2a", "general", "All year.",
     [v("", months("############"))]),
    ("Pork", "meat", "#e8a8a0", "general", "All year.",
     [v("", months("############"))]),
    ("Goose", "meat", "#8a8070", "general", "Michaelmas to Christmas.",
     [v("", months(".........+##"))]),
    ("Turkey", "meat", "#a08060", "general", "",
     [v("", months("..........+#"))]),
    ("Grouse", "meat", "#6a4a2a", "basc", "12 August to 10 December.",
     [v("", months(".......+###+"))]),
    ("Pheasant", "meat", "#b06a2a", "basc", "1 October to 1 February.",
     [v("", months("#........###"))]),
    ("Partridge", "meat", "#9a7a4a", "basc", "1 September to 1 February.",
     [v("", months("#.......####"))]),
    ("Wild duck", "meat", "#4a6a4a", "basc", "Mallard, teal and wigeon: 1 September to 31 January inland, to 20 February on the foreshore.",
     [v("", months("#.......####"))]),
    ("Snipe", "meat", "#6a5a3a", "basc", "12 August to 31 January.",
     [v("", months("#......+####"))]),
    ("Woodcock", "meat", "#7a6a5a", "basc", "1 October to 31 January.",
     [v("", months("#........###"))]),
    ("Venison", "meat", "#5a2a1a", "basc",
     "Red and fallow: stags and bucks 1 August to 30 April, hinds and does 1 November to 31 March. Roe bucks 1 April to 31 October and does 1 November to 31 March, so some roe is always in season; muntjac has no closed season.",
     [v("Red & fallow", months("####...#####"), "#5a2a1a"),
      v("Roe & muntjac", months("############"), "#8a4a3a")]),
    ("Wood pigeon", "meat", "#7a7a8a", "general", "No closed season; at its best from spring to autumn.",
     [v("", months("...+#######+"))]),
    ("Rabbit", "meat", "#a89a8a", "general", "No closed season; young rabbits from late summer are the ones to buy.",
     [v("", months("......+####+"))]),
    ("Hare", "meat", "#9a7050", "basc", "No closed season in England and Wales, but hare may only be sold from 1 August to 28 February.",
     [v("", months("##.....+####"))]),
    ("Grey squirrel", "meat", "#9a9a9a", "basc", "No closed season; sold by a few game dealers.",
     [v("", months("############"))]),
]

# What to ask for at the counter, by slug: the better-managed stock or
# gentler catch method in a sentence, for fish and shellfish. Shown on
# the food's page. Helen's steer: useful, not preachy.
BUY = {
    "mackerel": "Handline-caught from the South West is the good choice, and most UK mackerel is.",
    "sea-bass": "Wild bass is line-caught in small numbers; farmed is the everyday fish. Ask which you are getting.",
    "sardines": "Cornish sardines are ring-netted from a well-managed stock.",
    "herring": "North Sea and Norwegian herring are in good shape; the MSC label is easy to find.",
    "cod": "Icelandic, Norwegian and Barents Sea cod are the well-managed stocks; the North Sea stock is still rebuilding. Look for the MSC label.",
    "haddock": "North Sea and Icelandic haddock are in good shape; look for the MSC label.",
    "hake": "Cornish hake is MSC-certified and plentiful.",
    "plaice": "North Sea plaice is well managed; otter-trawled or line-caught over beam-trawled if you can choose.",
    "dover-sole": "Ask where it was landed; the Channel and North Sea stocks are the better-managed ones.",
    "pollock": "A good swap for cod. Line-caught Cornish pollack is the best choice.",
    "whiting": "Line-caught is the choice; whiting is cheap and underused.",
    "wild-salmon": "Wild Atlantic salmon is endangered, so rod-caught is a rare treat. Organic farmed salmon or sea trout are the everyday choices.",
    "sea-trout": "Wild sea trout is scarce; farmed sea trout is widely sold.",
    "squid": "Jig-caught squid from the South West is the choice.",
    "brown-crab": "Pot-caught is the usual method and the good one.",
    "lobster": "Pot-caught native lobster is the choice; Canadian lobster is the cheaper import.",
    "langoustines": "Creel-caught is the best choice; trawled is what most scampi is.",
    "mussels": "Rope-grown mussels are about as sustainable as seafood gets.",
    "oysters": "Farmed rock oysters are a best choice; wild natives are the rarer treat.",
    "scallops": "Hand-dived scallops; dredging damages the seabed.",
    "cockles": "Hand-raked from a managed bed is the good choice.",
    "brown-shrimp": "Ask for shrimp from a certified fishery; Morecambe Bay and the Wash are the UK ones.",
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
           "# group: a key from _data/groups.yml.",
           "# weeks: [from, to, state] on a 52-week year (week 1 starts 1 January).",
           "# state: in = in season, avail = just coming in or going out.",
           "# colour: per food; a variety may carry its own colour to stand apart.",
           "# shades: optional, two or three colours the season wheel sweeps through",
           "#         across the in-season run (unripe, ripe, over), on a food or a",
           "#         variety. The calendar keeps using colour.",
           "# source: ncgm = New Covent Garden Market calendar, bbc = BBC Good Food,",
           "#         basc = BASC shooting seasons, general = common knowledge,",
           "#         please check.",
           "# buy: optional, what to ask for at the counter (fish and shellfish).",
           ""]
    slugs = set()
    OUT_PAGES.mkdir(exist_ok=True)
    for old in OUT_PAGES.glob("*.md"):
        old.unlink()
    wheels = "--wheels" in sys.argv
    if wheels:
        OUT_WHEELS.mkdir(exist_ok=True)
        for old in OUT_WHEELS.glob("*.svg"):
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
        if slug in BUY:
            out.append(f"  buy: {yaml_str(BUY[slug])}")
        out.append("  varieties:")
        for label, lookup, vcolour, shades in varieties:
            ranges = week_ranges(month_states(lookup, rows))
            if not ranges:
                raise SystemExit(f"{name} / {label}: no season at all")
            out.append(f"    - name: {yaml_str(label)}")
            if vcolour:
                out.append(f"      colour: {yaml_str(vcolour)}")
            if shades:
                out.append(f"      shades: [{', '.join(yaml_str(s) for s in shades)}]")
            out.append("      weeks:")
            for r in ranges:
                out.append(f"        - [{r[0]}, {r[1]}, {r[2]}]")
        out.append("")
        (OUT_PAGES / f"{slug}.md").write_text(
            f"---\nslug: {slug}\ntitle: {yaml_str('Is it ' + name.lower() + ' yet?')}\n---\n")
        if wheels:
            (OUT_WHEELS / f"{slug}.svg").write_text(f"---\nslug: {slug}\n---\n")

    OUT_YAML.write_text("\n".join(out))
    print(f"{len(FOODS)} foods -> {OUT_YAML.relative_to(ROOT)} and {OUT_PAGES.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
