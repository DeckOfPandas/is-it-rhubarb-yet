"""The research pull guards the seasons: the checker's check_pulled passes
_data/ as it is, passes an editorial edit (which the pull keeps), and
fails a season edited by hand (which the pull would undo)."""
import importlib.util
import shutil
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("check_foods", ROOT / "tools" / "check-foods.py")
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)


def pulled_problems(tmp_path, monkeypatch, edit=None):
    foods, sources = tmp_path / "foods.yml", tmp_path / "sources.yml"
    shutil.copyfile(ROOT / "_data" / "sources.yml", sources)
    if edit is None:
        shutil.copyfile(ROOT / "_data" / "foods.yml", foods)
    else:
        data = yaml.safe_load(open(ROOT / "_data" / "foods.yml", encoding="utf-8"))
        edit({f["slug"]: f for f in data})
        foods.write_text(yaml.safe_dump(data, sort_keys=False, allow_unicode=True), encoding="utf-8")
    monkeypatch.setattr(check, "DATA", foods)
    monkeypatch.setattr(check, "SOURCES_FILE", sources)
    problems = []
    check.check_pulled(problems)
    return problems


def test_the_data_as_it_stands_is_the_pull(tmp_path, monkeypatch):
    assert pulled_problems(tmp_path, monkeypatch) == []


def test_an_editorial_edit_survives_the_pull(tmp_path, monkeypatch):
    def edit(by):
        by["rhubarb"]["colour"] = "#ff2d79"
        by["rhubarb"]["said"] = "Rhubarb, obviously"
        by["mackerel"]["varieties"][0]["notes"] = ["A note Helen wrote."]
    assert pulled_problems(tmp_path, monkeypatch, edit) == []


def test_a_season_edited_by_hand_fails(tmp_path, monkeypatch):
    def edit(by):
        by["mackerel"]["varieties"][0]["weeks"] = [[1, 52, "in"]]
    problems = pulled_problems(tmp_path, monkeypatch, edit)
    assert len(problems) == 1
    assert problems[0].startswith("mackerel/North East: weeks: differs from the research")
