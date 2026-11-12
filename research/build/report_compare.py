#!/usr/bin/env python3
"""Turn out/comparison.yml into a readable markdown report, out/comparison.md."""
import collections
import os
from urllib.parse import urlparse

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONF = {"high": 0, "moderate": 1, "low/moderate": 2, "low": 3}
# Week index (1-based) where each month starts under the "most days" rule.
STARTS = {1: "J", 5: "F", 9: "M", 14: "A", 18: "M", 22: "J", 27: "J", 31: "A", 35: "S", 40: "O", 44: "N", 48: "D"}
RULER = "".join(STARTS.get(w, " ") for w in range(1, 53))


def block(r):
    return (f"```\n         {RULER}\nYours    {r['hstrip']}\nMine     {r['ostrip']}\n```\n"
            "*Key: I = in season · a = avail · s = store · · = none*\n")


def entry(r):
    head = f"#### {r['food']}, {r['ring']}"
    if r["ring"] == "(whole)" and r["ours"] != r["food"]:
        head += f" (vs my *{r['ours']}*)"
    yours = r["helen_sources"] + (" — includes \"common knowledge\"" if r["helen_general"] else "")
    out = [head, "", block(r),
           f"- **Yours:** {r['helen']}. Sources: {yours or 'none listed'}.",
           f"- **Mine ({r['our_conf']}):** {'NEVER / unsold / no supply' if r['cat'] == 'never-mismatch' else r['mine']}. Sources: {r['our_sources'] or 'none'}."]
    if r.get("note"):
        out.append(f"- **My discrepancy note:** {r['note'].strip()}")
    return "\n".join(out) + "\n"


def main():
    d = yaml.safe_load(open(f"{ROOT}/out/comparison.yml"))
    rows, extra = d["rows"], d["extra"]
    c = collections.Counter(r["cat"] for r in rows)
    key = lambda r: (CONF.get(r["our_conf"], 3), -(r["in_mis"] + r["fresh_mis"]))
    hsrc = yaml.safe_load(open(f"{ROOT}/helen/sources.yml"))
    osrc = yaml.safe_load(open(f"{ROOT}/out/sources.yml"))
    host = lambda u: urlparse(u or "").netloc.replace("www.", "")
    hh = {host(s.get("url")) for s in hsrc if s.get("url")}
    oh = {host(s.get("url")) for s in osrc}
    shared = sorted(hh & oh)
    general = sorted({f"{r['food']}" + (f", {r['ring']}" if r["ring"] != "(whole)" else "")
                      for r in rows if r["helen_general"]})

    md = [f"""# Your data against the clean-room data

You have {len(rows)} rings. Each one is matched to my line of the same name, or to the line that plays the same role: your whole-food ring against my Outdoor line, your coasts against my NE/SE/SW, your Native oysters against my Fal line. Where no line matches, it's compared with all my lines combined. This was done in code (`build/compare.py`, `build/report_compare.py`), week by week.

"Agree" means the two differ by no more than four weeks (about two weeks at each end), both in when the food is `in` and in when it's on sale at all.

| | Rings |
|---|---|
| Agree | {c['agree']} |
| Same supply, different peak | {c['peak']} |
| Mine is longer | {c['ours-longer']} |
| Mine is shorter | {c['ours-shorter']} |
| Shifted (the seasons overlap but start or end at different times) | {c['shifted']} |
| I found no data; yours stands | {c['no-data-ours']} |
| NEVER on one side only | {c['never-mismatch']} |
| NEVER on both sides | {c['never']} |

Within each section, the entries run from my highest confidence to my lowest, then from the biggest difference to the smallest. A difference where my line is `low` is a weak challenge to yours; one where it's `high` or `moderate` is worth acting on.

## Patterns worth knowing before you read the detail

1. **The year-round rule makes a lot of my lines longer.** Under your 10 November decision, anything on sale all year is `in` all year unless a source names a best season. Your data often shows those foods with a season (carrots, little gem, wild oyster mushrooms, and South West herring and monkfish). Where the difference is only about the peak, it's in the "same supply, different peak" section, not counted as a factual disagreement.
2. **South West fish follow different sources.** Yours follows Flying Fish Seafoods, mine the Cornwall Good Seafood Guide's "best to eat" months, which are driven by spawning. They often disagree: lemon sole, Dover sole, cuttlefish, brown crab, sea bass, red mullet. Neither is wrong, but they answer different questions. One says when the fish is landed and sold; the other says when it's best to eat.
3. **Foraged foods and herbs.** {len(general)} of your rings cite "common knowledge". Mine have named sources, though often only secondary ones (foragers, the RHS). Mine usually run longer, because the sources name a second flush or a longer picking window (nettles, sea beet, dandelion, rosehips).
4. **Storage.** Several of your `store` stretches aren't in my data, and the other way round: swede, celeriac, garlic, shallots, onions, red cabbage, pears. Growers told the helpers where cold storage really applies, so those rows are worth a look.

## 1. NEVER, unsold or no supply on one side only

Enoki is a food-level NEVER: nobody grows it here, so it belongs in `never.yml`. Farmed halibut, wild South West halibut and outdoor cucumber are `no_supply`: the food lives or grows here, but there's no regular UK supply of that line.

"""]
    for cat, title, intro in [
        ("never-mismatch", None, None),
        ("ours-longer", "2. Mine is longer", "My line is on sale in every week yours is, and in more weeks besides."),
        ("ours-shorter", "3. Mine is shorter", "Yours is on sale in every week mine is, and in more weeks besides."),
        ("shifted", "4. Shifted", "The seasons overlap, but they start or end at different times."),
        ("peak", "5. Same supply, different peak",
         "Both say the food is on sale in the same weeks, to within four. They disagree only on which of those weeks are `in`. Most of these come from the year-round rule or from a regional guide's best months."),
    ]:
        rs = sorted([r for r in rows if r["cat"] == cat], key=key)
        if title:
            md.append(f"## {title} ({len(rs)})\n\n{intro}\n")
        md += [entry(r) for r in rs]
    nd = [r for r in rows if r["cat"] == "no-data-ours"]
    md.append(f"## 6. I found no data, so yours stands ({len(nd)})\n\n" +
              "\n".join(f"- {r['food']}, {r['ring']}: yours is {r['helen']} ({r['helen_sources']})" for r in nd) + "\n")
    ag = [r for r in rows if r["cat"] == "agree"]
    md.append(f"## 7. Agree ({len(ag)})\n\n" + ", ".join(
        f"{r['food']}" + (f" ({r['ring']})" if r["ring"] != "(whole)" else "") for r in ag) + ".\n")
    md.append(f"## 8. Lines I have that you don't ({len(extra)})\n\nThese are splits the research found. Each has a reason in its `notes.season`.\n\n" +
              "\n".join(f"- {s}: {n} ({k}, {cf})" for s, n, k, cf in extra) + "\n")
    md.append(f"""## 9. Sources

- You cite {len(hsrc)} sources and I cite {len(osrc)}. Only {len(shared)} websites appear in both: {', '.join(shared)}.
- Your rings citing "common knowledge" ({len(general)}): {', '.join(general)}.
""")
    open(f"{ROOT}/out/comparison.md", "w").write("\n".join(md))
    print(len("\n".join(md)), "chars")


if __name__ == "__main__":
    main()
