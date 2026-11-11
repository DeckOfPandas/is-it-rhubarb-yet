# Fish pass brief (third pass)

Helen has made three decisions about fish. Your job is to apply them to one fish group's data file, in place.

## Read first

1. `/home/claude/seasonality/rules.md` in full. These parts are new or changed: rule 5 (fish: `in` = best to eat, `avail` = landed), the Source age section, the Sustainability section (`mcs` and `buy`), and the NEVER, unsold and no supply section.
2. `/home/claude/seasonality/brief.md` for method and validation.

## The job, for every line in your file

1. **Replace the 2009 Seafish "Seafood Guide"** (`seafish-seafood-guide`) as a basis for dates. It may stay only as background beside a newer source. Look for current best-to-eat sources:
   - the Cornwall Good Seafood Guide (for SW)
   - MCS Good Fish Guide species pages (breeding-season advice)
   - current Seafish species or "Fish is the Dish" pages
   - IFCA and Cefas reports
   - recent trade press quoting named fishers or merchants

   A line with no current best-to-eat source has its landing weeks as `in` (rule 5, no named window, Helen's decision of 2026-11-11). Say so in the note.
2. **Set `avail` from landings.** These are the landings sources Helen uses. They may be read and cited now that the blind comparison is done. Register them, and fetch each page directly:
   - SW, Flying Fish Seafoods: https://flyingfishseafoods.co.uk/seasonality/
   - NE, Northumberland Seafood: https://northumberlandseafood.co.uk/north-east-fish-shellfish-species/seasonality/
   - SE, Brighton & Newhaven Fish Sales: https://www.brighton-fish-sales.co.uk/ (look for a seasonality or species page)

   Also use IFCA and MMO landings material and market reports. `avail` = weeks a landings source shows the fish landed or sold outside a named best-to-eat window. Lines that are currently empty (mostly NE and SE) can often be filled this way. Rule 8 still applies: these are regional sources, so cite them for their own region only.
3. **Add `mcs` and `buy`** to every line where the MCS rates the species, following the Sustainability section of rules.md. Use the MCS species pages (mcsuk.org/goodfishguide/species/...). Keep any existing `notes.sustainability` content that covers other schemes (MSC, CGSG, ASC, certification).
4. **Add `published`** (and `published_note` if `undated`) to every source in your sources file, following the Source age rules. Get the date from the page, a "last updated" line, or the URL. Fetch the page if you need to.
5. **Confidence:** re-grade honestly under the source-age rule. Keep `discrepancy` notes, and add new ones where best-to-eat and landings sources clash.
6. **Leave `unsold` and `no_supply` lines as they are**, unless you find current UK supply. In that case, explain it in the note.

Validate before finishing: YAML parses, every cited key exists, ranges are valid and don't overlap, and `mcs.ratings` entries have `stock`, `method`, `rating` (1–5) and `label`.

## What to return

Under 200 words: lines changed, lines still empty, lines still without `mcs`, the biggest date changes, and anything unresolved.
