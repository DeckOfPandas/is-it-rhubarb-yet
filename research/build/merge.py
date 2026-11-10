#!/usr/bin/env python3
"""Merge per-group seasonality files into one dataset, apply coordinator rules, validate, report.

Reads data/*.yml and sources/*.yml (never modifies them). Writes out/seasonality.yml,
out/sources.yml and out/report.md.
"""
import collections
import datetime as dt
import glob
import os
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GROUP_ORDER = ["roots-alliums", "brassicas-leaves", "shoots-fruiting", "fruit-nuts", "foraged",
               "fungi-herbs", "fish-round", "fish-flat-cephalopods", "shellfish", "meat-game"]
KINDS = {"variety", "method", "region", "part", "whole"}
STATUSES = {"in", "avail", "store"}
CONFS = {"high", "moderate", "low"}
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December"]
NAME_MAP = {"Field": "Outdoor", "Tunnel & field": "Field & tunnel"}

errors, log = [], []


def week_month(w):
    """Month owning most days of week w (2026, non-leap)."""
    start = dt.date(2026, 1, 1) + dt.timedelta(days=7 * (w - 1))
    end = dt.date(2026, 12, 31) if w == 52 else start + dt.timedelta(days=6)
    days = collections.Counter()
    d = start
    while d <= end:
        days[d.month] += 1
        d += dt.timedelta(days=1)
    return max(days, key=lambda m: (days[m], -m)) - 1


def month_span(weeks):
    """Describe a set of weeks as month ranges, wrapping over New Year."""
    months = sorted({week_month(w) for w in weeks})
    if not months:
        return ""
    runs, run = [], [months[0]]
    for m in months[1:]:
        if m == run[-1] + 1:
            run.append(m)
        else:
            runs.append(run)
            run = [m]
    runs.append(run)
    if len(runs) > 1 and runs[0][0] == 0 and runs[-1][-1] == 11:
        runs[0] = runs.pop() + runs[0]
    parts = [MONTHS[r[0]] if len(r) == 1 else f"{MONTHS[r[0]]}–{MONTHS[r[-1]]}" for r in runs]
    return " and ".join(parts)


def main():
    sources, src_origin = {}, {}
    for g in GROUP_ORDER:
        for s in yaml.safe_load(open(f"{ROOT}/sources/{g}.yml")) or []:
            k = s["key"]
            if k in sources and sources[k]["url"].rstrip("/") != s["url"].rstrip("/"):
                log.append(f"source key {k} registered twice with different URLs ({src_origin[k]}, {g}); kept first")
                continue
            sources.setdefault(k, s)
            src_origin.setdefault(k, g)
    # Rule: RHS is gardening advice about UK cropping, not commercial supply -> secondary everywhere.
    for k, s in sources.items():
        if "rhs.org.uk" in s.get("url", "") and s.get("type") != "secondary":
            log.append(f"source {k}: RHS reclassified {s.get('type')} -> secondary")
            s["type"] = "secondary"

    foods, stats = [], collections.Counter()
    for g in GROUP_ORDER:
        for food in yaml.safe_load(open(f"{ROOT}/data/{g}.yml")) or []:
            for line in food["lines"]:
                where = f"{food['name']} / {line['name']}"
                if line["name"] in NAME_MAP:
                    log.append(f"{where}: renamed to '{NAME_MAP[line['name']]}'")
                    line["name"] = NAME_MAP[line["name"]]
                if line.get("kind") not in KINDS:
                    errors.append(f"{where}: bad kind {line.get('kind')}")
                if line.get("confidence") not in CONFS:
                    errors.append(f"{where}: bad confidence {line.get('confidence')}")
                for k in line.get("sources") or []:
                    if k not in sources:
                        errors.append(f"{where}: unknown source {k}")
                weeks = line.get("weeks") or []
                seen = set()
                prev_end = 0
                for r in weeks:
                    a, b, st = r
                    if not (1 <= a <= b <= 52) or st not in STATUSES or a <= prev_end:
                        errors.append(f"{where}: bad range {r}")
                    prev_end = b
                    seen.update(range(a, b + 1))
                notes = line.get("notes") or {}
                if line.get("verdict"):
                    errors.append(f"{where}: line-level verdict is retired; use unsold or no_supply")
                for flag in ("unsold", "no_supply"):
                    if line.get(flag):
                        if weeks or not notes.get(flag):
                            errors.append(f"{where}: {flag} needs empty weeks and notes.{flag}")
                        stats[flag] += 1
                if food.get("group") == "fish-shellfish" and weeks and not line.get("mcs"):
                    stats["fish_lines_without_mcs"] += 1
                # Confidence floor: no primary or trade source -> low.
                types = {sources[k]["type"] for k in line.get("sources") or [] if k in sources}
                if weeks and line.get("confidence") in ("high", "moderate") and not types & {"primary", "trade"}:
                    log.append(f"{where}: confidence {line['confidence']} -> low (secondary sources only)")
                    line["confidence"] = "low"
                # Year-round note (rule 3): fresh supply every week, some of it 'avail'.
                fresh = {w for a, b, st in weeks if st in ("in", "avail") for w in range(a, b + 1)}
                ins = {w for a, b, st in weeks if st == "in" for w in range(a, b + 1)}
                old = notes.get("year_round")
                if len(fresh) == 52 and fresh != ins:
                    std = (f"On sale all year; at its best {month_span(ins)}." if ins
                           else "On sale all year, with no named best season.")
                    std += " The rest of the year it's still easy to find, just not at its peak."
                    if old and old != std:
                        notes["season"] = (notes.get("season", "") + " " + old).strip()
                    notes["year_round"] = std
                    line["notes"] = notes
                    stats["year_round_notes"] += 1
                elif old:
                    # Not fresh-all-year-with-avail (e.g. store-based): keep the text, but as a season note.
                    notes["season"] = (notes.get("season", "") + " " + old).strip()
                    del notes["year_round"]
                    log.append(f"{where}: year_round note moved to season (line doesn't qualify)")
                if not weeks and not (line.get("unsold") or line.get("no_supply") or food.get("never")):
                    stats["empty"] += 1
                stats[f"conf_{line.get('confidence')}"] += 1
                stats["lines"] += 1
                for nk in ("drift", "sustainability", "discrepancy"):
                    if notes.get(nk):
                        stats[f"notes_{nk}"] += 1
            food.setdefault("group", g)
            foods.append(food)
            stats["foods"] += 1

    cited = {k for f in foods for l in f["lines"] for k in l.get("sources") or []}
    out_sources = [sources[k] for k in sorted(sources) if k in cited]
    stats["sources_cited"] = len(out_sources)
    stats.update({f"sources_{t}": n for t, n in collections.Counter(s["type"] for s in out_sources).items()})

    os.makedirs(f"{ROOT}/out", exist_ok=True)
    header = ("# Is It Rhubarb Yet? — clean-room seasonality dataset\n"
              f"# Generated {dt.date.today().isoformat()} by build/merge.py from data/*.yml. Rules: rules.md.\n")
    with open(f"{ROOT}/out/seasonality.yml", "w") as fh:
        fh.write(header)
        yaml.safe_dump(foods, fh, sort_keys=False, allow_unicode=True, width=110)
    with open(f"{ROOT}/out/sources.yml", "w") as fh:
        yaml.safe_dump(out_sources, fh, sort_keys=False, allow_unicode=True, width=110)
    with open(f"{ROOT}/out/merge-log.txt", "w") as fh:
        fh.write("\n".join(errors + log) + "\n")
    print(dict(stats))
    print(f"{len(errors)} errors, {len(log)} log entries")
    for e in errors:
        print("ERROR", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
