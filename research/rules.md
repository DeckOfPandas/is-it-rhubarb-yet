# Is It Rhubarb Yet? — seasonality research rulebook

Every food in the clean-room dataset follows these rules. Where a rule needed a judgement call, the call is written down here, so the same case is handled the same way everywhere.

## Scope

- UK grown, reared, caught or landed, or foraged in the UK. Imports don't count, even when a UK firm sells them.
- One data file per research group in `data/`, and one source registry per group in `sources/`. Source keys are descriptive, in the form `publisher-topic` (for example `cgsg-crab`, `basc-seasons`), so the registries can be merged later. Cite sources by key.
- Research is blind. Do not consult the Is It Rhubarb Yet site (deckofpandas.github.io/is-it-rhubarb-yet) or its repository.

## Weeks

- Week n = days 7n−6 to 7n, counted from 1 January. Week 52 also takes 30–31 December (and 29 December in leap years).
- A week that straddles two months belongs to the month with most of its days. So January–March = weeks 1–13, April–June = 14–26, July–September = 27–39, October–December = 40–52.
- **Exception for legal dates** (Helen's decision, 2026-11-10): for a legal open season (game, regulated fisheries, byelaw openings), a week counts if it contains at least one open day. So grouse runs 32–50, keeping the Glorious Twelfth. The "most days" rule still applies to everything else.
- Ranges are inclusive and sorted. A season that crosses New Year is written as two ranges, for example `[1, 13, in]` and `[40, 52, in]`.

## Statuses

| Status | Meaning |
|---|---|
| `in` | A source names this window as the season, peak or best time. |
| `avail` | UK product is on sale fresh, but outside the named window: the first arrivals, the tail-off, thin supply, or a spawning or moulting period when it's still landed. |
| `store` | Sold from controlled storage after harvest (apples, pears, potatoes, onions and so on). Never counted as `in`. Frozen fish and game are not `store`. |
| *(no range)* | Not available as fresh UK product. |

**NEVER, unsold, and no supply** (Helen's decisions, 2026-11-10). These are three different things:

- **NEVER** is a food-level verdict and means the food doesn't grow here (bananas, coffee, enoki). Such foods belong in Helen's `never.yml`, not in the seasonality data. Mark a food `never: true` with a sourced `notes.never` only to flag it as a candidate for moving there.
- **`unsold: true`** is a line that exists here but can't legally be sold fresh: wild salmon. It has `weeks: []` and a sourced `notes.unsold`. It matches the `unsold` key in Helen's `foods.yml`.
- **`no_supply: true`** is a line for which there is no regular UK supply, though the food itself grows or lives here: farmed halibut since Gigha closed, outdoor cucumber, wild halibut from the South West. It has `weeks: []` and a sourced `notes.no_supply`.

When every lead ring of a food is `no_supply` or `unsold`, the first ring with weeks leads instead (`build/propose.py` does this and logs it in `CHANGES.md`). Cucumber is now led by Glasshouse, and halibut by North East.

Don't use any of the three for a line that is only unresearched. That stays `weeks: []` with `confidence: low`.

Judgement calls, applied the same way everywhere:

1. **When a source contradicts itself, its text beats its tick-boxes.** Example: the Cornwall Good Seafood Guide ticks all twelve months for brown crab, but its text says winter is best. The data follows the text and records the clash in `notes.discrepancy`.
2. **When sources disagree**, use the dates of the highest-ranked source (see Sources). If the gap is more than two weeks, record the other source's dates in `notes.discrepancy`.
   **Availability-only sources** (Defra's wholesale price series, market price lists and other records of what was on sale) show supply, not season (Helen's October decision: Defra is evidence, not a ring). They can set `in` only when no source names a season. Where a grower, industry body or guide names a season or peak, that sets `in`, and weeks that rest only on availability evidence are `avail` (or `store`, where the product is stored).
3. **Available all year with no named peak means `in` all year** (Helen's decision, 2026-11-10). This covers chicken, beef, cultivated mushrooms and so on. If a food is available all year but a primary source names a peak or best months (brown crab, mackerel), the peak is `in` and the rest is `avail`. If year-round supply depends on glasshouses or other protection, the protected supply goes on its own `method` line (rule 6) and the outdoor or main line keeps its own season. Field crops left in the ground and lifted through winter (carrots, parsnips, leeks) are fresh harvest, not `store`.
   Every line that is on sale all year but marked `avail` for part of it gets a `notes.year_round` entry. It says that the food is available all year, names the months that are the peak and why (with a source), and explains that `avail` here means "out of its best season", not "hard to get". This is a separate key so the site can show it differently from other notes. The coordinator adds or standardises these at merge, so the wording is the same everywhere.
4. **Legal seasons** (game, regulated fisheries): `in` = the open season. Being legal is not the same as being plentiful, so add a `notes.season` line where a source says supply is concentrated in part of the open season.
5. **Fish and shellfish** (Helen's decision, 2026-11-10): `in` = best to eat (a regional guide's best months, or outside the spawning, roe or moulting period where a source links that to eating quality). `avail` = landed and sold outside those weeks, from a source on landings: regional fishmonger or market seasonality calendars (Flying Fish Seafoods for SW, Northumberland Seafood for NE, Brighton & Newhaven Fish Sales for SE), IFCA, MMO or market reports. If a best-to-eat source and a landings source disagree about whether the fish is landed at all, keep `in` and record the clash in `notes.discrepancy`.
   **No named window** (Helen's decision, 2026-11-11): where no source names a best-to-eat window for a line, every week it is landed is `in`, as rules 2 and 3 do for everything else. A line landed all year is then `in` all year. A landings peak inside the landed weeks doesn't make the rest `avail`: record it in `notes.season`, or in `notes.year_round` for a line landed all year.
   **Sustainability is required:** every fish or shellfish line with an MCS Good Fish Guide rating carries it in a structured `mcs` field (see Sustainability), plus a `buy` line giving the mitigation: what to ask for or avoid, in the MCS's terms (catch method, area, size, certification, season).
6. **Glasshouse and other protected crops** get their own line with `kind: method`. Where a source gives a production window and names no peak, the whole window is `in` (the same spirit as rule 3). Where a source names a peak, the peak is `in` and the rest of the window is `avail`. A promotional event such as British Tomato Fortnight is not a peak.
8. **Never copy dates from one line to another.** A region, variety or method line with no source of its own gets `weeks: []`, `confidence: low` and a note saying what was searched. The one exception: a source says outright that the dates are the same (for example, a national guide covering every region, or a source saying a variety has the same season as the type). Then cite that source. Dates from general biology (spawning periods) are allowed only when a source links that biology to when the fish is best to eat or caught.
7. **Wild and foraged lines** use the harvest window a source names. No safety, legal or ethics advice unless a primary source states it.

## Lines and `kind`

Each food has one or more `lines`. Each line has a `kind`:

| `kind` | Use it for | Examples |
|---|---|---|
| `variety` | A cultivar or type | Bramley, Cos, Victoria |
| `method` | A way of growing or harvesting | Glasshouse, Forced, Wild, Cultivated |
| `region` | A place or provenance | SW, NE, SE, Welsh, Fal |
| `part` | A part of the plant harvested at a different time | Hop shoots, Hop flowers |
| `whole` | The food as a single line, with no split | |

Only add a split where the dates actually differ, or where a source treats it separately. Name splits the research finds that the site doesn't have, and record why in `notes.season`.

Fish regions follow the site's convention: NE (North East), SE (South East), SW (South West). Sources mostly describe stocks by sea area, so this working mapping applies:

- NE = northern and central North Sea (ICES IVa and IVb), including landings into north-east England and east Scotland.
- SE = southern North Sea and eastern English Channel (ICES IVc and VIId): East Anglia, Kent and Sussex.
- SW = western English Channel and Celtic Sea (ICES VIIe to VIIh): Cornwall, Devon and Dorset.

Record the actual ICES areas or ports in the note. Regional seasonality is often thinner than for the SW. If the only basis for a region is the general biology (the spawning period, say) rather than a regional source, mark that line `low`.

## Confidence (one per line)

- **high:** a law, byelaw or PDO specification; or two or more primary sources that agree to within two weeks.
- **moderate:** one primary source; or trade press quoting a named primary source; or primary sources that disagree by three to four weeks.
- **low:** only secondary sources (retailers, chefs, gardening sites, food writers); or the dates are my extrapolation; or sources disagree by more than four weeks.

## Sources

Ranked, best first:

1. **primary:** industry or grower bodies, regulators, legislation, IFCA byelaws, PDO/PGI specifications, Defra/AHDB/Seafish/Cefas data, MCS Good Fish Guide, Cornwall Good Seafood Guide, BASC.
2. **trade:** trade press quoting a named grower or body (Fresh Produce Journal, The Grocer, The Caterer, FreshPlaza, Fish Focus).
3. **secondary:** retailers, wholesalers' blogs, chefs, gardening sites, food writers.

A line may also list `searched`: sources its notes cite as searched and found to have nothing on the line. They are not evidence, so they never count towards confidence, but they're registered so the keys resolve.

Registry fields in `sources.yml`: `key`, `title`, `publisher`, `url`, `type`, `published`, `accessed` (ISO date).

**Source age** (Helen's decision, 2026-11-10: the climate and the food supply chain have changed). Every source records `published`: the year it was published or last updated, from the page itself (a date line, a "last updated" stamp, a copyright year on a living page) or its URL. If no date can be found, use `undated` and say so in a `published_note`. Then:

- A line whose dates rest only on sources from before 2016 is `low` at best, and gets a newer source wherever one exists.
- For fish, prefer sources from 2021 onwards. The 2009 Seafish "Seafood Guide" may stay only as background beside a newer source. It is never the only basis for any dates.
- A living page that is kept up to date (a current guide, a calendar, a legal text in force) counts as current, even if it was first published long ago.

## Notes

All notes are optional, short, factual, attributed to a source key, and paraphrased (never quoted).

- `season`: anything that explains the dates, such as varieties that extend the season, or peaks inside the window.
- `discrepancy`: where sources disagree, or a source disagrees with itself; give both sets of dates.
- `drift`: only where a source says the season is moving. No guesses about climate.
- `sustainability`: only ratings from third-party bodies (MCS, CGSG, MSC, RSPCA Assured, and so on), with the body and date. No judgements of our own.

## Sustainability (fish and shellfish)

Every fish or shellfish line with an MCS rating gets:

```yaml
      mcs:
        read: 2026-11-10
        ratings:
          - {stock: "Western English Channel and Celtic Sea", method: "handline", rating: 3, label: "OK"}
          - {stock: "North Sea", method: "beam trawl", rating: 5, label: "Avoid"}
      buy: "Ask for handline-caught from the South West; avoid beam-trawled North Sea fish."
```

- `ratings` lists the MCS ratings that apply to UK supply for that line's region, using the MCS's own stock and method names. Rating 1–2 is Best Choice, 3–4 OK, and 5 Avoid.
- `buy` is the practical mitigation, paraphrased from the MCS: which method, area, size or certification to choose, and when to avoid (for example, during breeding).
- Other third-party schemes (MSC, a regional guide such as the Cornwall Good Seafood Guide, ASC, RSPCA Assured) stay in `notes.sustainability`.

## Example

```yaml
- name: "Brown crab"
  slug: brown-crab
  group: fish-shellfish
  lines:
    - name: "SW"
      kind: region
      confidence: moderate
      sources: [cgsg-crab, mcs-crab]
      weeks:
        - [1, 13, in]
        - [14, 39, avail]
        - [40, 52, in]
      notes:
        season: "Landed all year; fewer moults in winter, so quality is best then (cgsg-crab)."
        discrepancy: "cgsg-crab ticks all 12 months as best to eat; its text says winter is best. Rule 1 applied."
        sustainability: "CGSG: no longer recommended, owing to overfishing (page read 2026-11-10). MCS: Shetland MSC is Best Choice; avoid West of Scotland (read 2026-11-10)."
```
