#!/usr/bin/env python3
"""Fish rule 5: `avail` = landed. The landings charts (Flying Fish SW, Northumberland Seafood NE,
Brighton & Newhaven SE) are images the web tools can't read, but Helen's foods.yml already transcribes
them on her regional rings. Use her transcribed weeks as landings evidence: in = our best-to-eat weeks
(unchanged); avail = landed weeks not already in. Edits data/fish-*.yml and data/shellfish.yml in place."""
import os

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GROUPS = ["fish-round", "fish-flat-cephalopods", "shellfish"]
SLUG = {"skates-rays": "skates-and-rays", "salmon-farmed": "farmed-salmon"}
REGION = {"North East": "NE", "South East": "SE", "South West": "SW"}
LANDINGS = {"ffs": ("helen-ffs-chart", "Flying Fish Seafoods: Seasonality chart (weeks as transcribed by Helen)",
                    "Flying Fish Seafoods", "https://flyingfishseafoods.co.uk/seasonality/"),
            "northumberland": ("helen-northumberland-chart",
                               "Northumberland Seafood: Seasonality chart (weeks as transcribed by Helen)",
                               "Northumberland Seafood",
                               "https://northumberlandseafood.co.uk/north-east-fish-shellfish-species/seasonality/"),
            "bnfs": ("helen-bnfs-chart", "Brighton & Newhaven Fish Sales: seasonality (weeks as transcribed by Helen)",
                     "Brighton & Newhaven Fish Sales", "https://www.brighton-fish-sales.co.uk/")}
NOTE = ("Landings (`avail`) include weeks Helen transcribed from {pub}'s seasonality chart, which the web tools "
        "could not read (an image or colour-only page); not re-checked against the chart (coordinator, 2026-11-10).")


def weeks_set(weeks, states):
    return {w for a, b, st in weeks or [] for w in range(a, b + 1) if st in states}


def to_ranges(status_by_week):
    out, cur = [], None
    for w in range(1, 53):
        st = status_by_week.get(w)
        if cur and st == cur[2] and w == cur[1] + 1:
            cur[1] = w
        else:
            if cur:
                out.append(cur)
            cur = [w, w, st] if st else None
    if cur:
        out.append(cur)
    return out


def main():
    helen = {f["slug"]: f for f in yaml.safe_load(open(f"{ROOT}/helen/foods.yml"))}
    changed, filled = [], []
    for g in GROUPS:
        path = f"{ROOT}/data/{g}.yml"
        data = yaml.safe_load(open(path))
        used = set()
        for food in data:
            hf = next((f for s, f in helen.items() if SLUG.get(s, s) == food["slug"]), None)
            if not hf:
                continue
            for ring in hf["varieties"]:
                keys = [k for k in (ring.get("sources") or []) if k in LANDINGS]
                if not keys:
                    continue
                target = REGION.get(ring["name"], ring["name"])
                line = next((l for l in food["lines"] if l["name"] == target), None)
                if not line or line.get("unsold") or line.get("no_supply"):
                    continue
                landed = weeks_set(ring.get("weeks"), {"in", "avail"})
                ins = weeks_set(line.get("weeks"), {"in"})
                old_avail = weeks_set(line.get("weeks"), {"avail"})
                store = weeks_set(line.get("weeks"), {"store"})
                status = {w: "in" for w in ins}
                status.update({w: "avail" for w in (landed | old_avail) - ins})
                status.update({w: "store" for w in store - set(status)})
                new = to_ranges(status)
                if new == (line.get("weeks") or []):
                    continue
                was_empty = not line.get("weeks")
                line["weeks"] = new
                k = keys[0]
                lk, title, pub, url = LANDINGS[k]
                line["sources"] = list(dict.fromkeys((line.get("sources") or []) + [lk]))
                used.add(k)
                notes = line.setdefault("notes", {})
                if NOTE.format(pub=pub) not in notes.get("season", ""):  # idempotent: safe to re-run
                    notes["season"] = (notes.get("season", "") + " " + NOTE.format(pub=pub)).strip()
                not_landed = ins - landed
                if not_landed and landed:
                    notes["discrepancy"] = (notes.get("discrepancy", "") + f" The best-to-eat source marks "
                                            f"{len(not_landed)} weeks as in that {pub}'s chart (as transcribed) "
                                            "doesn't show as landed; kept in under rule 5.").strip()
                if was_empty:
                    line["confidence"] = "low"
                    filled.append(f"{food['name']} / {line['name']}")
                else:
                    changed.append(f"{food['name']} / {line['name']}")
        yaml.safe_dump(data, open(path, "w"), sort_keys=False, allow_unicode=True, width=110)
        spath = f"{ROOT}/sources/{g}.yml"
        srcs = yaml.safe_load(open(spath))
        have = {s["key"] for s in srcs}
        for k in used:
            lk, title, pub, url = LANDINGS[k]
            if lk not in have:
                srcs.append({"key": lk, "title": title, "publisher": pub, "url": url, "type": "primary",
                             "published": "undated",
                             "published_note": "Chart weeks taken from Helen's foods.yml transcription (her source key "
                                               f"'{k}'); the chart itself is an image and was not re-read.",
                             "accessed": "2026-11-10"})
        yaml.safe_dump(srcs, open(spath, "w"), sort_keys=False, allow_unicode=True, width=110)
    print(f"{len(changed)} lines gained landed weeks; {len(filled)} empty lines filled:")
    print("\n".join(filled))


if __name__ == "__main__":
    main()
