"""Rebuild the New Covent Garden Market seasonality table from its PDF drawing
commands.

usage: python3 -I tmp/pdf-extract.py <dumpdir> <out.json>

<dumpdir> holds the inflated content streams written by tmp/pdf-streams.py.
Streams are processed in page order (object 8 landed in obj-005.txt and 10 in
obj-009.txt because the dump's regex over-matched; 11-16 are themselves).

Every icon is drawn as `q 1 0 0 1 X Y cm <path from 0 0 m> f Q` with the fill
colour set beforehand by a CMYK `k`. Text lines are positioned with Tm/Td in
page units. The two tables share one row grid (29.089 pt) and column grid
(46.908 pt) and differ only by x offset, which is read off the `re` cell
backgrounds.
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

STREAM_ORDER = ["obj-005", "obj-009", "obj-011", "obj-012",
                "obj-013", "obj-014", "obj-015", "obj-016"]

COLOURS = {
    (0.822, 0.4, 0.693, 0.393): "in",
    (0.41, 0.01, 0.88, 0): "avail",
    (0, 0.25, 0.82, 0): "store",
}

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

ROW_H = 29.089
COL_W = 46.908
NUM_RE = re.compile(r"^-?\d*\.?\d+$")


def decode_pdf_string(s: str) -> str:
    out = []
    i = 0
    while i < len(s):
        c = s[i]
        if c == "\\" and i + 1 < len(s):
            nxt = s[i + 1]
            if nxt in "01234567":
                oct_digits = re.match(r"[0-7]{1,3}", s[i + 1:]).group(0)
                code = int(oct_digits, 8)
                out.append({0o37: "fl", 0o36: "fi"}.get(code, chr(code)))
                i += 1 + len(oct_digits)
                continue
            out.append({"n": "\n", "r": "\r", "t": "\t"}.get(nxt, nxt))
            i += 2
            continue
        out.append(c)
        i += 1
    return "".join(out)


def tokenize(line: str):
    """Split a content-stream line into tokens; strings and arrays stay whole."""
    tokens, i, n = [], 0, len(line)
    while i < n:
        c = line[i]
        if c.isspace():
            i += 1
        elif c == "(":
            depth, j = 0, i
            while j < n:
                if line[j] == "\\":
                    j += 2
                    continue
                if line[j] == "(":
                    depth += 1
                elif line[j] == ")":
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            tokens.append(line[i:j + 1])
            i = j + 1
        elif c == "[":
            j = line.index("]", i)
            tokens.append(line[i:j + 1])
            i = j + 1
        elif c == "<" and i + 1 < n and line[i + 1] == "<":
            j = line.index(">>", i)
            tokens.append(line[i:j + 2])
            i = j + 2
        else:
            j = i
            while j < n and not line[j].isspace() and line[j] not in "([<":
                j += 1
            tokens.append(line[i:j])
            i = j
    return tokens


def strings_in(token: str) -> str:
    """Concatenate the string parts of a (..) or [..] operand."""
    return "".join(decode_pdf_string(m) for m in re.findall(r"\(((?:\\.|[^\\)])*)\)", token))


def main() -> None:
    if len(sys.argv) not in (3, 4, 5):
        sys.exit("usage: pdf-extract.py <dumpdir> <out.json> [--debug-y [table]]")
    dumpdir, out_path = Path(sys.argv[1]), Path(sys.argv[2])

    icons = []          # (x, y, state)
    texts = []          # (x, y, text)
    rect_cols = set()   # x origins of month-cell backgrounds
    rect_tops = set()   # y tops of cell backgrounds

    fill = None
    stack = []
    ctm = (0.0, 0.0)            # translation only: the PDF uses no rotation for icons
    path_started_at_origin = False
    line_start = None           # (x, y) of the current text line
    tm_scale = 1.0
    leading = 0.0

    def is_operator(tok: str) -> bool:
        return not (NUM_RE.match(tok) or tok[0] in "(/[<")

    def operations(stream_text: str):
        """Yield (args, operator) pairs; a line may hold several operators."""
        for raw in stream_text.splitlines():
            args = []
            for tok in tokenize(raw.strip()):
                if is_operator(tok):
                    yield args, tok
                    args = []
                else:
                    args.append(tok)

    for name in STREAM_ORDER:
        for args, op in operations((dumpdir / f"{name}.txt").read_text("latin-1")):
            if op == "q":
                stack.append((fill, ctm))
            elif op == "Q":
                if stack:
                    fill, ctm = stack.pop()
            elif op == "cm" and len(args) == 6:
                ctm = (ctm[0] + float(args[4]), ctm[1] + float(args[5]))
            elif op == "k" and len(args) == 4:
                fill = tuple(float(a) for a in args)
            elif op == "m" and len(args) == 2:
                path_started_at_origin = (args[0] == "0" and args[1] == "0")
            elif op == "re" and len(args) == 4:
                x, y, w, h = (float(a) for a in args)
                if abs(w - COL_W) < 0.5 or abs(w - 47.276) < 0.5:
                    rect_cols.add(round(x, 1))
                    rect_tops.add(round(y, 1))
            elif op in ("f", "f*", "B", "b"):
                # Cell backgrounds are drawn with `re` at ctm (0,0); every icon
                # sits inside its own translated q-block.
                if ctm != (0.0, 0.0):
                    key = tuple(round(v, 3) for v in fill) if fill else None
                    icons.append((ctm[0], ctm[1], COLOURS.get(key, str(key))))
                path_started_at_origin = False
            elif op == "Tm" and len(args) == 6:
                tm_scale = float(args[0]) or float(args[1])
                line_start = (float(args[4]), float(args[5]))
            elif op in ("Td", "TD") and len(args) == 2 and line_start:
                dx, dy = float(args[0]) * tm_scale, float(args[1]) * tm_scale
                line_start = (line_start[0] + dx, line_start[1] + dy)
                if op == "TD":
                    leading = -dy
            elif op == "TL" and len(args) == 1:
                leading = float(args[0]) * tm_scale
            elif op == "T*" and line_start:
                line_start = (line_start[0], line_start[1] - leading)
            elif op in ("Tj", "TJ", "'") and args and line_start:
                s = strings_in(args[-1])
                if s.strip():
                    texts.append((line_start[0], line_start[1], s))

    # Column grid: month columns come in two runs (left and right table).
    cols = sorted(rect_cols)
    tables = []
    run = [cols[0]]
    for x in cols[1:]:
        if x - run[-1] > COL_W * 1.5:
            tables.append(run)
            run = [x]
        else:
            run.append(x)
    tables.append(run)
    top = max(rect_tops)
    print(f"tables start at x = {[t[0] for t in tables]}, grid top y = {top}")

    def table_of(x):
        # A table spans its two label columns (about 342 pt) and 12 month
        # columns. The ranges must not overlap or December icons of one
        # table land in the next.
        for i, t in enumerate(tables):
            if t[0] - 345 <= x < t[0] + 12 * COL_W:
                return i, t[0]
        return None, None

    if len(sys.argv) > 3 and sys.argv[3] == "--debug-y":
        want = int(sys.argv[4]) if len(sys.argv) > 4 else 1
        events = []
        for x, y, s in texts:
            ti, x0 = table_of(x)
            if ti == want:
                events.append((y, "T", f"x={x:7.1f} {s}"))
        by_y = defaultdict(list)
        for x, y, state in icons:
            ti, x0 = table_of(x)
            if ti == want:
                by_y[round(y, 1)].append((x, state))
        for y, cells in by_y.items():
            cells.sort()
            desc = " ".join(f"{MONTHS[int((x - tables[want][0]) // COL_W)]}:{st}"
                            for x, st in cells)
            events.append((y, "I", desc))
        for y, kind, desc in sorted(events, reverse=True):
            print(f"{y:7.1f} {kind} {desc}")
        return

    # Rows are hand-placed in the right-hand table, so there is no fixed row
    # grid. Instead: each text line is a row anchor, a name-column line that
    # follows another within half a row continues a multi-line name, and an
    # icon row belongs to the nearest text line at or below it. Section
    # headers (all caps) and the legend never carry icons.
    result = []
    for ti, t in enumerate(tables):
        x0 = t[0]
        lines = sorted(((y, x, s) for x, y, s in texts
                        if table_of(x)[0] == ti and x < x0 and y < top - ROW_H),
                       key=lambda t: (-t[0], t[1]))
        entries = []          # each: dict(y, name, variety, section, cells)
        section = ""
        prev_name_y = None
        for y, x, s in lines:
            s = s.strip()
            in_name_col = x < x0 - 200
            if in_name_col and s.isupper():
                section = s.title()
                prev_name_y = None
                continue
            if s.startswith(("In season", "Available")):
                continue
            if in_name_col and prev_name_y is not None and prev_name_y - y < ROW_H * 0.6:
                entries[-1]["name"] += s          # continuation of a split name
                prev_name_y = y
                continue
            if in_name_col:
                entries.append({"y": y, "name": s, "variety": "",
                                "section": section, "cells": {}})
                prev_name_y = y
            else:
                # Variety-only line: a new row under the last-named food,
                # unless it sits beside that food's own name line.
                if entries and abs(entries[-1]["y"] - y) < ROW_H * 0.6 and not entries[-1]["variety"]:
                    entries[-1]["variety"] = s
                else:
                    entries.append({"y": y, "name": entries[-1]["name"] if entries else "",
                                    "variety": s, "section": section, "cells": {}})

        for x, y, state in icons:
            if table_of(x)[0] != ti or x < x0 or y < top - ROW_H * 1.5 and y > top:
                continue
            below = [e for e in entries if e["y"] <= y + 0.5]
            if not below:
                continue
            target = max(below, key=lambda e: e["y"])
            if y - target["y"] > ROW_H:
                continue                           # legend bullets, stray art
            col = int((x - x0) // COL_W)
            if 0 <= col < 12:
                target["cells"][MONTHS[col]] = state

        for e in entries:
            result.append({
                "table": ti,
                "section": e["section"],
                "name": e["name"],
                "variety": e["variety"],
                "months": [e["cells"].get(m, "") for m in MONTHS],
            })

    out_path.write_text(json.dumps(result, indent=1))

    glyph = {"in": "#", "avail": "+", "store": "o", "": "."}
    for r in result:
        cells = "".join(glyph.get(s, "?") for s in r["months"])
        label = (r["name"] + " / " + r["variety"]).strip(" /")
        print(f"{r['section'][:5]:5s} {cells} {label}")


if __name__ == "__main__":
    main()
