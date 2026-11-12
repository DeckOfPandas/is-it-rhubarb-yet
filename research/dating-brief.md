# Source-dating pass brief

Helen wants to know how old each source is, because the climate and food infrastructure have changed. Your job covers one or two groups' files, edited in place.

## Read first

`/home/claude/seasonality/rules.md`, especially the Source age section, and `/home/claude/seasonality/brief.md` for method and validation.

## The job

1. **Date every source** in your groups' sources files (`/home/claude/seasonality/sources/<group>.yml`). Add `published`: the year it was published or last updated. Look in this order:
   - the title or URL
   - the page itself: a date line, a "last updated" stamp, or the copyright year on a page that is kept up to date

   Fetch the page with WebFetch when you need to. If you can't find a date, write `published: undated` and add a short `published_note`. A living page that is kept up to date (a current guide, a legislation page in force, an industry body's current season page) counts as current: give the year it was last updated, or the current year with a note.
2. **Find stale lines.** In your groups' data files (`/home/claude/seasonality/data/<group>.yml`), find every line whose dates rest only on sources published before 2016. Lower each one to `low` and add a note. Then search for a newer source, preferring 2021 or later. Where you find one, update the dates if needed and restore the confidence the rules allow.
3. **Don't change other lines' dates** unless a newer source you found contradicts them by more than two weeks. If it does, update the dates and keep a `discrepancy` note that gives both sets of dates.
4. Validate both files of each group before finishing, as the brief describes.

## What to return

Under 150 words:

- how many sources fall in each age band: 2021+, 2016–20, before 2016, undated
- the stale lines, and which were refreshed
- any dates that moved
- anything unresolved
