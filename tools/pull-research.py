"""Pull the research's seasons into the site's data: the one way seasons
reach _data/foods.yml and _data/sources.yml.

Runs the research pipeline (research/build: merge, compare,
report_compare, propose), then propose.py again from the site's own
_data/ files, which keeps every editorial field (names, colours, said,
aliases, lead, notes, Helen's buy lines, a ring's proposed flag) and
rebuilds what the research owns (weeks, ring sources, confidence,
research notes, MCS, sustainability, meat's buy lines). The result
replaces _data/foods.yml and sources.yml. tools/check-foods.py fails
when the two differ, so a season edited by hand never ships.

usage: python3 tools/pull-research.py
"""
import filecmp
import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = ROOT / "research" / "build"
DATA = ROOT / "_data"


def run(*args):
    subprocess.run([sys.executable, *map(str, args)], check=True, cwd=ROOT)


def pull(out):
    """propose.py from the site's _data/ into `out`."""
    run(BUILD / "propose.py", "--base", DATA / "foods.yml", DATA / "sources.yml", "--out", out)


def main():
    for step in ("merge.py", "compare.py", "report_compare.py", "propose.py"):
        run(BUILD / step)
    with tempfile.TemporaryDirectory() as tmp:
        pull(tmp)
        for name in ("foods.yml", "sources.yml"):
            new = pathlib.Path(tmp) / name
            same = filecmp.cmp(new, DATA / name, shallow=False)
            shutil.copyfile(new, DATA / name)
            print(f"_data/{name}: {'unchanged' if same else 'updated'}")
    print("Now run python3 -I tools/check-foods.py, then sh tools/build.sh.")


if __name__ == "__main__":
    main()
