#!/usr/bin/env python3
"""Build a proposed foods.yml + sources.yml in Helen's schema from the clean-room data.

Keeps every field of Helen's file (colours, said, aliases, lead, buy, her notes). Replaces each ring's
weeks and sources with the clean-room line it matches, adds confidence/research/mcs/buy at ring level,
and appends clean-room lines Helen doesn't have as new rings marked proposed: true, lead: false.
Writes out/proposed/foods.yml, out/proposed/sources.yml, out/proposed/CHANGES.md.
"""
import collections
import os
import sys

import yaml

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from compare import REGION, RING, SLUG  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/out/proposed"
KEYMAP = {"helen-ffs-chart": "ffs", "helen-northumberland-chart": "northumberland", "helen-bnfs-chart": "bnfs"}
REGION_NAME = {v: k for k, v in REGION.items()}
RANK = {"store": 1, "avail": 2, "in": 3}
CONF = {"low": 0, "moderate": 1, "medium": 1, "high": 2}
MEDIUM = {"moderate": "medium"}
LABEL_SCORE = {"Best Choice": 1.5, "OK": 3.5, "OK - Needs Improvement": 3.5, "Avoid": 5}
KIND = {"roots": "veg", "alliums": "veg", "brassicas": "veg", "leaves": "veg", "shoots": "veg", "squash": "veg",
        "orchard": "veg", "soft-fruit": "veg", "nuts": "veg", "foraged": "foraging", "fungi": "foraging",
        "herbs": "herbs", "fish": "fish", "meat": "meat"}
METHODS = {"glasshouse", "outdoor", "cultivated", "wild", "fresh", "market", "farmed"}


class Dumper(yaml.SafeDumper):
    pass


def _list(d, data):
    flow = (all(not isinstance(x, (list, dict)) for x in data)
            and sum(len(str(x)) + 2 for x in data) <= 90)
    return d.represent_sequence("tag:yaml.org,2002:seq", data, flow_style=flow)


def _str(d, s):
    style = '"' if (" " in s or ":" in s or s == "" or s[:1] in "#&*!|>%@`'\"[{") else None
    return d.represent_scalar("tag:yaml.org,2002:str", s, style=style)


Dumper.add_representer(list, _list)
Dumper.add_representer(str, _str)


def keys(ks):
    return list(dict.fromkeys(KEYMAP.get(k, k) for k in ks or []))


def envelope(lines):
    st = {}
    for l in lines:
        for a, b, s in l.get("weeks") or []:
            for w in range(a, b + 1):
                if RANK[s] > RANK.get(st.get(w), 0):
                    st[w] = s
    out, cur = [], None
    for w in range(1, 53):
        s = st.get(w)
        if cur and s == cur[2] and w == cur[1] + 1:
            cur[1] = w
        else:
            if cur:
                out.append(cur)
            cur = [w, w, s] if s else None
    if cur:
        out.append(cur)
    return out


def research(line):
    n = dict(line.get("notes") or {})
    return n or None


def ring_from_line(line, base=None):
    r = dict(base or {})
    r["weeks"] = [list(x) for x in line.get("weeks") or []]
    r["sources"] = keys(line.get("sources"))
    r["confidence"] = MEDIUM.get(line["confidence"], line["confidence"])
    for flag in ("no_supply", "unsold"):
        if line.get(flag):
            r[flag] = True
    for k in ("mcs", "buy"):
        if line.get(k):
            r[k] = line[k]
    if research(line):
        r["research"] = research(line)
    return r


def main():
    helen = yaml.safe_load(open(f"{ROOT}/helen/foods.yml"))
    header = []
    for ln in open(f"{ROOT}/helen/foods.yml"):
        if ln.startswith("#"):
            header.append(ln)
        elif ln.strip():
            break
    ours = {f["slug"]: f for f in yaml.safe_load(open(f"{ROOT}/out/seasonality.yml"))}
    osrc = {s["key"]: s for s in yaml.safe_load(open(f"{ROOT}/out/sources.yml"))}
    hsrc_list = yaml.safe_load(open(f"{ROOT}/helen/sources.yml"))
    hsrc = {s["key"]: s for s in hsrc_list}
    meat = {m["slug"]: m for m in yaml.safe_load(open(f"{ROOT}/data/meat-sustainability.yml"))}
    for ms in yaml.safe_load(open(f"{ROOT}/sources/meat-sustainability.yml")):
        osrc.setdefault(ms["key"], ms)
    log = collections.defaultdict(list)
    stats = collections.Counter()
    cited = set()
    ring_keys = {k for f in helen for r in f["varieties"] for k in r.get("sources") or []}
    for f in helen:
        slug = SLUG.get(f["slug"], f["slug"])
        of = ours[slug]
        lines = {l["name"]: l for l in of["lines"]}
        used = set()
        new_rings = []
        # A key Helen's food carries that none of her rings names backs the food's
        # own notes or buy line, which are kept, so it stays on the food. Where a
        # ring inherited the food's list, a key some ring elsewhere names is a
        # season source, which the research replaces; general never stays.
        inherits = any(not r.get("sources") for r in f["varieties"])
        food_only = [k for k in f.get("sources") or []
                     if k != "general" and not any(k in (r.get("sources") or []) for r in f["varieties"])
                     and not (inherits and k in ring_keys)]
        for r in f["varieties"]:
            name = r["name"]
            target = RING.get((f["slug"], name)) or REGION.get(name) or name
            if target == "" and len(of["lines"]) == 1:
                target = of["lines"][0]["name"]
            if target == "" and "Outdoor" in lines:
                target = "Outdoor"
            line = lines.get(target)
            if line is not None:
                used.add(target)
                if not line.get("weeks") and not (line.get("no_supply") or line.get("unsold")):
                    nr = dict(r)
                    if not nr.get("sources"):  # Helen's ring cites nothing of its own: inherit the food's sources
                        nr["sources"] = list(f.get("sources") or [])
                    nr["research"] = {"kept": "No clean-room data for this line; Helen's original weeks kept.",
                                      **(research(line) or {})}
                    if line.get("sources"):  # sources the research notes cite, so they reach the register
                        nr["research"]["sources"] = keys(line["sources"])
                        cited.update(nr["research"]["sources"])
                    if line.get("searched"):  # searched and found nothing: cited in the notes, not evidence
                        nr["research"]["searched"] = keys(line["searched"])
                        cited.update(nr["research"]["searched"])
                    nr["confidence"] = "low"
                    stats["kept_helen"] += 1
                    log[f["name"]].append(f"{name or '(whole)'}: kept yours (no clean-room data)")
                else:
                    nr = ring_from_line(line, base={k: v for k, v in r.items() if k not in ("weeks", "sources", "notes")})
                    if r.get("notes"):
                        nr["notes"] = r["notes"]
                    stats["replaced"] += 1
                    if nr["weeks"] != r.get("weeks"):
                        stats["weeks_changed"] += 1
            else:  # Helen's ring has no single counterpart: envelope of all our lines
                ls = [l for l in of["lines"] if not (l.get("no_supply") or l.get("unsold"))]
                nr = {k: v for k, v in r.items() if k not in ("weeks", "sources")}
                nr["weeks"] = envelope(ls)
                nr["sources"] = keys(k for l in ls for k in l.get("sources") or [])
                nr["confidence"] = MEDIUM.get(c := min((l["confidence"] for l in ls), key=CONF.get), c)
                nr["research"] = {"combined": "These weeks combine the clean-room lines "
                                  + ", ".join(l["name"] for l in ls)
                                  + ", each added below as its own proposed ring."}
                stats["envelope"] += 1
                log[f["name"]].append(f"{name or '(whole)'}: weeks now combine {len(ls)} clean-room lines")
            new_rings.append(nr)
        for l in of["lines"]:
            if l["name"] in used:
                continue
            kind = l.get("kind")
            nm = REGION_NAME.get(l["name"], l["name"])
            base = {"name": nm}
            if kind == "region":
                base["ring"] = "region"
            elif kind == "method":
                m = l["name"].lower().split()[0].strip("()")
                m = "glasshouse" if m == "protected" else "outdoor" if m == "field" else m
                if m in METHODS:  # otherwise a type such as wet or dried garlic: a named variety, no ring
                    base["ring"] = "method"
                    base["method"] = m
            elif kind == "part":
                base["ring"] = "part"
            base["lead"] = False
            base["proposed"] = True
            new_rings.append(ring_from_line(l, base=base))
            stats["new_rings"] += 1
            log[f["name"]].append(f"new ring '{nm}' ({kind}, {l['confidence']})")
        f["varieties"] = new_rings
        # Lead rule: if every lead ring is no_supply or unsold, the first ring with weeks leads instead.
        flagged = lambda r: r.get("no_supply") or r.get("unsold")
        leads = [r for r in new_rings if r.get("lead") is not False and not r.get("proposed")]
        if leads and all(flagged(r) for r in leads):
            cand = next((r for r in new_rings if not flagged(r) and not r.get("proposed") and r.get("weeks")), None)
            if cand:
                for r in leads:
                    r["lead"] = False
                cand.pop("lead", None)
                log[f["name"]].append(f"lead moved to '{cand['name']}' (every lead ring was no_supply or unsold)")
                stats["lead_moved"] += 1
        lead = [r for r in new_rings if r.get("lead") is not False and not r.get("proposed")
                and not (r.get("no_supply") or r.get("unsold"))] or [r for r in new_rings if not r.get("proposed")]
        f["confidence"] = MEDIUM.get(c := min((r.get("confidence", "low") for r in lead), key=CONF.get), c)
        stats[f"food_conf_{f['confidence']}"] += 1
        if f["group"] == "fish":
            seen, allr, read = set(), [], None
            for r in new_rings:
                m = r.get("mcs") or {}
                read = read or m.get("read")
                for x in m.get("ratings") or []:
                    k = (x.get("stock"), x.get("method"))
                    if k not in seen:
                        seen.add(k)
                        allr.append(x)
            def score(x):
                return x["rating"] if isinstance(x.get("rating"), int) else LABEL_SCORE.get(x.get("label"))
            scored = [x for x in allr if score(x) is not None]
            if scored:
                f["mcs"] = {"read": read, "best": min(scored, key=score), "worst": max(scored, key=score),
                            "ratings": allr}
                stats["fish_with_mcs"] += 1
            else:
                f["mcs"] = None
                f["mcs_note"] = "Not rated by the MCS Good Fish Guide." if not allr else "MCS ratings under review."
                log[f["name"]].append("no MCS rating")
        f["sources"] = list(dict.fromkeys([k for r in new_rings for k in r.get("sources") or []] + food_only))
        if of.get("never"):
            f["never_candidate"] = True
            stats["never_candidates"] += 1
            log[f["name"]].append("NEVER candidate: not grown here; move to never.yml")
        cited.update(f["sources"])
        m = meat.get(f["slug"])
        if m:
            sus = {"confidence": MEDIUM.get(m.get("confidence"), m.get("confidence"))}
            for k in ("impact", "frameworks", "notes"):
                if m.get(k) is not None:
                    sus[k] = m[k]
            f["sustainability"] = sus
            if m.get("buy"):
                if f.get("buy"):
                    sus["buy"] = m["buy"]
                else:
                    f["buy"] = m["buy"]
            def walk(x):
                if isinstance(x, dict):
                    for k2, v in x.items():
                        if k2.endswith("source") and isinstance(v, str):
                            cited.add(v)
                        walk(v)
                elif isinstance(x, list):
                    for v in x:
                        walk(v)
            walk(m)
            for key in osrc:
                if key in (m.get("buy") or ""):
                    cited.add(key)
            stats["meat_sustainability"] += 1
    # Sources in Helen's schema: hers kept as they are while something still cites
    # them (or she marked them general or pending); ours added.
    out_src = [s for s in hsrc_list if s["key"] in cited or s["key"] == "general" or s.get("pending")]
    stats["sources_dropped"] = len(hsrc_list) - len(out_src)
    for s in hsrc_list:
        if s not in out_src:
            log["(sources)"].append(f"dropped {s['key']}: nothing cites it any more")
    rank = collections.Counter(s.get("kind") for s in hsrc_list)
    group_kind = {}
    for f in helen:
        for k in f["sources"]:
            group_kind.setdefault(k, KIND.get(f["group"].split("-")[0], "veg"))
    meat_keys = {x["key"] for x in yaml.safe_load(open(f"{ROOT}/sources/meat-sustainability.yml"))}
    for k in meat_keys:
        group_kind[k] = "meat_sustainability"
    for k in sorted(cited):
        if k in hsrc:
            continue
        s = osrc.get(k)
        if not s:
            stats["missing_source"] += 1
            continue
        kind = group_kind.get(k, "veg")
        rank[kind] += 1
        entry = {"key": k, "name": s.get("title"), "short": s.get("publisher"), "url": s.get("url"),
                 "kind": kind, "rank": rank[kind], "type": s.get("type"), "published": s.get("published"),
                 "accessed": s.get("accessed")}
        if s.get("published_note"):
            entry["note"] = s["published_note"]
        out_src.append(entry)
        stats["sources_added"] += 1
    os.makedirs(OUT, exist_ok=True)
    extra_header = (
        "#\n# PROPOSED by the clean-room seasonality research, 10 November 2026 (rules: rules.md).\n"
        "# Added keys on a ring: confidence (high/medium/low); research (the line's\n"
        "#   notes: season, discrepancy, drift, year_round, sustainability, unsold,\n"
        "#   no_supply); mcs (Good Fish Guide ratings by stock and method) and buy\n"
        "#   (what to ask for) on fish; no_supply (no regular UK supply of this ring);\n"
        "#   proposed: true on a ring the research added (lead: false until promoted).\n"
        "# A ring kept as Helen had it (no clean-room data) cites the food's sources if it\n"
        "#   had none, and carries the research notes' sources in research.sources (and\n"
        "#   sources searched without result in research.searched).\n"
        "# If every lead ring of a food is no_supply or unsold, the first ring with weeks\n"
        "#   leads instead (logged in CHANGES.md).\n"
        "# On a food: confidence (low/medium/high: the weakest of its lead rings, the\n"
        "#   ones that drive the verdict); never_candidate (not grown here; belongs in\n"
        "#   never.yml); on fish, mcs: {read, best, worst, ratings} summarising every\n"
        "#   Good Fish Guide rating across the food's rings (best and worst by score,\n"
        "#   or by label where the MCS shows no number), or mcs: null with mcs_note.\n"
        "# On meat: sustainability: {confidence, impact (Poore & Nemecek via OWID, and UK\n"
        "#   figures where published), frameworks (what Eating Better, Pasture for Life,\n"
        "#   RSPCA Assured and others say), notes (attributed, incl. contested points)};\n"
        "#   buy from those third parties. No invented scores: third-party data only.\n"
        "# Confidence on rings and foods: high/medium/low (rules.md's 'moderate' = medium).\n\n")
    with open(f"{OUT}/foods.yml", "w") as fh:
        fh.write("".join(header).rstrip("\n") + "\n" + extra_header)
        fh.write(yaml.dump(helen, Dumper=Dumper, sort_keys=False, allow_unicode=True, width=100000))
    with open(f"{OUT}/sources.yml", "w") as fh:
        fh.write("# Proposed sources: Helen's register, unchanged but for the entries nothing cites\n"
                 "# any more, followed by the clean-room sources (with type, published and accessed).\n\n")
        fh.write(yaml.dump(out_src, Dumper=Dumper, sort_keys=False, allow_unicode=True, width=100000))
    with open(f"{OUT}/CHANGES.md", "w") as fh:
        fh.write("# Proposed changes to foods.yml\n\n")
        fh.write(f"- Rings whose weeks and sources now come from the clean-room data: {stats['replaced']} "
                 f"({stats['weeks_changed']} with different weeks)\n")
        fh.write(f"- Rings kept as they were, because there's no clean-room data: {stats['kept_helen']}\n")
        fh.write(f"- Whole-food rings now combining several clean-room lines: {stats['envelope']}\n")
        fh.write(f"- New rings added as proposed (lead: false): {stats['new_rings']}\n")
        fh.write(f"- NEVER candidates: {stats['never_candidates']}\n- Sources added: {stats['sources_added']}\n")
        fh.write(f"- Helen's sources dropped because nothing cites them: {stats['sources_dropped']}\n")
        fh.write(f"- Food-level confidence: {stats['food_conf_high']} high, {stats['food_conf_medium']} medium, "
                 f"{stats['food_conf_low']} low (the weakest of each food's lead rings)\n")
        fh.write(f"- Fish with a food-level MCS summary: {stats['fish_with_mcs']} (sea trout isn't rated by the MCS)\n")
        fh.write(f"- Meat and game with a sustainability block and a buy line: {stats['meat_sustainability']}\n\n")
        fh.write("Every change in weeks is set out in `comparison.md`, with week strips and both sets of sources.\n\n")
        fh.write("## Structural changes by food\n\n")
        for food, items in log.items():
            fh.write(f"- **{food}:** " + "; ".join(items) + "\n")
    print(dict(stats))


if __name__ == "__main__":
    main()
