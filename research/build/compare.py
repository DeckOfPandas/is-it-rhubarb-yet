#!/usr/bin/env python3
"""Compare Helen's foods.yml (helen/) with the clean-room dataset (out/). Writes out/comparison.md and .csv."""
import csv
import os
import sys

import yaml

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from merge import month_span  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUG = {"hop": "hops", "mushrooms-cultivated": "cultivated-mushrooms", "salmon-farmed": "farmed-salmon",
        "skates-rays": "skates-and-rays"}
REGION = {"North East": "NE", "South East": "SE", "South West": "SW"}
# Helen ring name (per food slug) -> our line name, where names differ.
RING = {("oysters", "Native"): "Native – Fal", ("sardines", "Cornish fishery (MSC)"): "Cornish fishery MSC",
        ("scallops", "Orkney, hand-dived"): "Orkney hand-dived", ("radishes", ""): "Salad radish",
        ("asparagus", ""): "Outdoor", ("celery", ""): "Outdoor", ("turkey", ""): "Traditional farm-fresh",
        ("grouse", ""): "Great Britain", ("pheasant", ""): "Great Britain", ("partridge", ""): "Great Britain",
        ("wild-duck", ""): "Inland", ("woodcock", ""): "England, Wales & NI", ("hare", ""): "England & Wales",
        ("squirrel", ""): "Grey squirrel", ("wild-garlic", ""): "UK-wide", ("bilberries", ""): "UK-wide",
        ("leeks", ""): "Leeks", ("raspberries", ""): "Field & tunnel", ("strawberries", ""): "Field & tunnel",
        ("broccoli", "Purple sprouting"): "Purple sprouting", ("samphire", ""): "Marsh samphire (wild)",
        ("damsons", ""): "Damsons", ("tea", ""): "Cornwall", ("horseradish", ""): "Cultivated",
        ("squash", ""): "Winter"}
RANK = {None: 0, "store": 1, "avail": 2, "in": 3}
SHORT = {0: "·", 1: "s", 2: "a", 3: "I"}


def vec(weeks):
    v = [0] * 53
    for a, b, st in weeks or []:
        for w in range(a, b + 1):
            v[w] = max(v[w], RANK[st])
    return v


def describe(v):
    parts = []
    for st, name in ((3, "in"), (2, "avail"), (1, "store")):
        ws = [w for w in range(1, 53) if v[w] == st]
        if ws:
            parts.append(f"{name} {month_span(ws)}")
    return "; ".join(parts) or "none"


def strip(v):
    return "".join(SHORT[v[w]] for w in range(1, 53))


def main():
    helen = yaml.safe_load(open(f"{ROOT}/helen/foods.yml"))
    hsrc = {s["key"]: s for s in yaml.safe_load(open(f"{ROOT}/helen/sources.yml"))}
    ours = {f["slug"]: f for f in yaml.safe_load(open(f"{ROOT}/out/seasonality.yml"))}
    osrc = {s["key"]: s for s in yaml.safe_load(open(f"{ROOT}/out/sources.yml"))}
    rows, matched = [], set()
    for f in helen:
        slug = SLUG.get(f["slug"], f["slug"])
        of = ours[slug]
        lines = {l["name"]: l for l in of["lines"]}
        for r in f["varieties"]:
            name = r["name"]
            target = RING.get((f["slug"], name)) or REGION.get(name) or name
            if target == "" and len(of["lines"]) == 1:
                target = of["lines"][0]["name"]
            if target == "" and "Outdoor" in lines:  # Helen's whole-food ring is the outdoor season
                target = "Outdoor"
            if target in lines:
                ls = [lines[target]]
                how = "line"
            else:  # no single counterpart: compare with the envelope of all our lines
                ls = [l for l in of["lines"] if not (l.get("unsold") or l.get("no_supply"))]
                how = "all lines combined"
            for l in ls:
                matched.add((slug, l["name"]))
            hv = vec(r.get("weeks"))
            ov = [0] * 53
            for l in ls:
                ov = [max(a, b) for a, b in zip(ov, vec(l.get("weeks")))]
            in_mis = sum(1 for w in range(1, 53) if (hv[w] == 3) != (ov[w] == 3))
            fresh_mis = sum(1 for w in range(1, 53) if (hv[w] >= 2) != (ov[w] >= 2))
            any_mis = sum(1 for w in range(1, 53) if hv[w] != ov[w])
            ours_empty = not any(ov[1:])
            flagged = [l for l in ls if l.get("unsold") or l.get("no_supply")] or ([1] if of.get("never") else [])
            if flagged or f.get("unsold"):
                band = "never" if (flagged and f.get("unsold")) else "never-mismatch"
            elif ours_empty:
                band = "no-data-ours"
            elif in_mis <= 4 and fresh_mis <= 4:
                band = "agree"
            elif in_mis <= 8 and fresh_mis <= 8:
                band = "small"
            else:
                band = "large"
            hs = r.get("sources") or f.get("sources") or ([f["source"]] if f.get("source") else [])
            rows.append(dict(
                food=f["name"], ring=name or "(whole)", ours=target if how == "line" else how, band=band,
                in_mis=in_mis, fresh_mis=fresh_mis, any_mis=any_mis,
                helen=describe(hv), mine=describe(ov), hstrip=strip(hv), ostrip=strip(ov),
                helen_sources=", ".join(hsrc.get(k, {}).get("short", k) for k in hs),
                helen_general="general" in hs,
                our_conf="/".join(sorted({l["confidence"] for l in ls})),
                our_sources=", ".join(dict.fromkeys(
                    f"{osrc[k]['publisher']} ({osrc[k]['type']})" for l in ls for k in (l.get("sources") or [])[:4] if k in osrc)),
                note=" ".join(filter(None, [(l.get("notes") or {}).get("discrepancy", "") for l in ls]))[:400]))
    for r in rows:
        H, O = r["hstrip"], r["ostrip"]
        hf = {i for i, c in enumerate(H) if c in "aI"}
        of_ = {i for i, c in enumerate(O) if c in "aI"}
        if r["band"] in ("never", "never-mismatch", "no-data-ours", "agree"):
            r["cat"] = r["band"]
        elif r["fresh_mis"] <= 4:
            r["cat"] = "peak"
        elif of_ >= hf:
            r["cat"] = "ours-longer"
        elif hf >= of_:
            r["cat"] = "ours-shorter"
        else:
            r["cat"] = "shifted"
    extra = [(s, l["name"], l.get("kind"), l["confidence"]) for s, f in ours.items() for l in f["lines"]
             if (s, l["name"]) not in matched]
    order = {"never-mismatch": 0, "large": 1, "small": 2, "no-data-ours": 3, "agree": 4, "never": 5}
    rows.sort(key=lambda r: (order[r["band"]], -r["in_mis"] - r["fresh_mis"]))
    with open(f"{ROOT}/out/comparison.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    yaml.safe_dump({"rows": rows, "extra": extra}, open(f"{ROOT}/out/comparison.yml", "w"), sort_keys=False,
                   allow_unicode=True, width=200)
    from collections import Counter
    print(Counter(r["cat"] for r in rows), len(rows), "rings;", len(extra), "extra lines of ours")


if __name__ == "__main__":
    main()
