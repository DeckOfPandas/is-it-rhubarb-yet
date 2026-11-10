# Gap-fill brief (second pass)

The first pass ran out of web searches part-way through. You have a fresh search budget. Your job is to strengthen one group's existing data file in place.

## Read first

1. `/home/claude/seasonality/rules.md`. It has been updated since the first pass, so read it in full. The new or changed parts are rule 6 (protected crops), rule 8 (never copy dates between lines) and `kind: part`.
2. `/home/claude/seasonality/brief.md`. The research method and validation requirements still apply.
3. Your gap list: `/home/claude/seasonality/gaps/<group>.txt`. Each weak line is tagged EMPTY (no dates), COPIED (dates carried over from another line, the pilot or an extrapolation) or LOW (low confidence for another reason).

## What to do

- **Work in priority order: EMPTY, then COPIED, then LOW.** Spend your searches where they change the most. Aim for primary sources; trade press quoting a named body is the next best.
- **Edit your group's data file in place** (`/home/claude/seasonality/data/<group>.yml`). Keep everything that's already sound. Add new sources to `/home/claude/seasonality/sources/<group>.yml`, using the same key style. Don't touch other groups' files.
- **Apply rule 8 to the whole file**, not just the listed lines. Any line whose dates are copied from another line, with no source saying the dates are the same, must either get its own source or be reset to `weeks: []` with a note.
- **Apply rule 6** to any glasshouse or protected line in your file.
- **Update `confidence` honestly.** Upgrade it only when the new sources earn it under the rules.
- **Keep the `discrepancy` notes** wherever sources disagree. Never delete one just to make a line look cleaner.
- **Validate before finishing**, in code: both files parse as YAML, every cited key exists, and the week ranges are sorted, inclusive, in 1–52, and don't overlap within a line.

## What to return

Under 200 words:

- the number of lines improved, and how many are still `low` or empty
- the most important changes of date, with the source
- any new sustainability or drift points
- what is still unresolved, and why
