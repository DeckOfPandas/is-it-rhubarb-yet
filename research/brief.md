# Research brief for one group of foods

You are researching UK seasonality for one group of foods for Helen's site "Is It Rhubarb Yet?". This is a clean, blind second pass: build the data from sources, not from memory, and never consult her site or repo.

## Before you start

1. Read `/home/claude/seasonality/rules.md` in full and follow it exactly. It sets the week numbering, statuses, `kind`, confidence, source ranking and notes.
2. If any of your foods appear in `/home/claude/seasonality-trial-10.yml` (an earlier pilot), use it as a starting point. Re-check it, convert it to the new schema, and register its sources properly.

## How to research

- Use WebSearch (mode "standard" by default; "extended" only for hard-to-find facts) and WebFetch. Look for primary sources first: grower or industry bodies, AHDB, Defra, Seafish, MCS Good Fish Guide (mcsuk.org/goodfishguide), the Cornwall Good Seafood Guide (cornwallgoodseafoodguide.org.uk), IFCA byelaws, legislation.gov.uk, BASC, the Deer Initiative, PDO/PGI specifications, RHS. Then trade press, then secondary.
- The shell has no internet access. Use only the web tools for research, and the shell or file tools only for writing and checking your files.
- To convert dates to weeks, run code rather than estimating: week = ((day_of_year − 1) // 7) + 1, capped at 52. For boundary weeks, apply the "most days" rule from rules.md.
- Never invent dates or sources. If you can't find a source for a line, still include the line, with `weeks: []`, `confidence: low` and `notes.season` explaining what you searched.
- Add splits (varieties, methods, regions) where the dates actually differ, even if Helen's list doesn't have them. Say why in `notes.season`. Keep all the splits she listed, even where you find no difference: give the line its data and say "dates as for X" in the note.
- Notes are short, paraphrased (never more than a few quoted words), and cite source keys in brackets. Sustainability notes give only third-party ratings, with the body and the date the page was read. Drift notes only where a source says the season is shifting.
- Today's date is 2026-11-10. Use it for `accessed`.

## Output

Write two files (paths are given in your task):

1. **Data:** a YAML list of foods in the schema shown in rules.md (`name`, `slug`, `group`, `lines` with `name`, `kind`, `confidence`, `sources`, `weeks`, `notes`). Ranges must be sorted, inclusive, between 1 and 52, and not overlapping within a line.
2. **Sources:** a YAML list with `key`, `title`, `publisher`, `url`, `type` (primary / trade / secondary) and `accessed`.

Before finishing, validate in code that both files parse as YAML, that every cited key exists in your sources file, and that week ranges are valid and don't overlap. Fix anything that fails.

## What to return

Your final message is read by the coordinator, not Helen. Keep it under 250 words:

- the number of foods and lines written
- each line with `low` confidence, and why
- splits you added beyond Helen's list
- sustainability or drift points worth Helen's attention
- anything you couldn't resolve
