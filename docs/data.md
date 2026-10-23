# Data

The data model, the files, where the seasons come from and how to change
them. The quickstart is `model_instructions/manual.md`; the design system
is `docs/design.md`; the decision log is `docs/decisions.md`.

## The files

- `_data/foods.yml` is the truth for seasons: one entry per food. Edit it
  by hand. The comment at the top of the file is the schema and is kept
  in step with `tools/check-foods.py`.
- `_data/groups.yml` names the culinary families, in display order, each
  with its `kind` (veg, fruit, wild, herbs, fish or meat), which the
  wheel page and Now's groups are drawn by.
- `_data/never.yml` lists the foods that are never in season here, each
  with a `line` for its page and `aliases`. Its header lists the foods
  deliberately left off because they are grown here.
- `_data/quotes.yml` holds the quotation pools, one per verdict: `yes`,
  `yesish`, `just`, `nearly`, `no`, `never`. A quotation with `foods` is
  preferred for those foods. Its header is the vetting rule.
- `_data/sources.yml` names every source a food or ring may cite: `key`,
  `name` (as the Source data page lists it), `short` (what a food page's
  ring list says) and `url`. `general` is common knowledge, not yet
  checked, with no address.
- Stubs, one per food, which the checker requires: `_foods/<slug>.md`
  (the page at `/<slug>/`), `_remind/<slug>.ics` (the food's calendar at
  `/remind/<slug>.ics`), `_wheels/<slug>.svg` (a standalone SVG of the
  food's dial at `/wheel/<slug>.svg`, `_layouts/wheel.svg`, which the
  cards' dials are cut from), `_never/<slug>.md` (a never-food's page).
- `_data/baked.json` is written by `tools/bake.js` before every build and
  gitignored: today's verdicts, which the Liquid templates read. Never
  edit it.

## A food

A real entry, cut down, with the optional fields marked:

```yaml
- name: "Apples"
  slug: apples
  group: orchard                # a key in groups.yml
  colour: "#c81800"
  text_on_shed: "#e7402a"       # optional, see Colours
  sources: [ncgm, defra, bap]   # keys in sources.yml
  notes:
    - "British Apples & Pears lists Bramleys as available all year, harvested in August and September and the rest from storage."
  # note: "Helen's own note."               optional
  # buy: "What to ask for at the counter."  optional
  # aliases: [zucchini]                     optional, this food's own
  # also: [mushrooms]                       optional, shared broader words
  # unsold: "It cannot be sold …"           optional: always NO, this line
  # shades: ["#…", "#…"]                    optional, two or three colours
  varieties:
    - name: "Bramley"
      cultivar: true            # a cultivar, kept as written
      short: "Bramley apples"   # the calendar row's name on a phone
      colour: "#459323"
      text_on_custard: "#307e00"
      sources: [ncgm, defra, bap]
      weeks:
        - [1, 30, store]
        - [31, 39, in]
        - [40, 52, store]
    - name: "Cox"
      cultivar: true
      colour: "#bf6b00"
      text_on_custard: "#a55b00"
      sources: [ncgm, defra]
      weeks:
        - [1, 17, store]
        - [36, 43, in]
        - [44, 52, store]
```

A ring of the food itself, as a fish's coasts or a glasshouse crop has:

```yaml
    - name: "Glasshouse"
      ring: method              # region, method, zone or part
      lead: false               # drawn and listed, but no row, dot, hit or event
      sources: [defra]
      weeks:
        - [14, 44, in]
```

- **Weeks.** `[from, to, state]` on a 52-week year. Week 1 starts on
  1 January, each week is 7 days, and week 52 takes the remainder
  (8 days, 9 in a leap year). Week 52 is followed by week 1, so a season
  wraps the year end as one presence. The month starts on that grid are
  the fixed list `1,5,9,14,18,23,27,31,36,40,44,49`, repeated in every
  template, `tools/make-foods.py` and `tools/merge-bundle.py`; they must
  agree.
- **States.** `in` is in season; `avail` is just about, coming in or
  going out, a shoulder of a few weeks; `store` is sold from storage
  after the harvest. A fishmonger's "fair" months are `in` (the fish is
  on the slab), never a months-long `avail`, which would read as coming
  in or going out all that time. Within one ring `in` wins where runs
  overlap, then `store`. The checker refuses overlapping runs and a ring
  with no `in` week.
- **Rings.** A food's `varieties` are its rings. A named variety or type
  (Bramley, forced, maincrop) has its own colour; a ring of the food
  itself (`ring: region`, `method`, `zone` or `part`) shares the food's
  colour and is named by itself (GLASSHOUSE, SOUTH WEST). A `ring:
  method` ring says what it is in `method` (glasshouse, outdoor,
  cultivated, wild, fresh, market, farmed); a `method: glasshouse` ring
  answers as storage does (`glass`). The verdict reads the key, never
  the name, so a ring can be renamed without changing what it does.
- **`lead: false`** keeps a ring off the calendar, the wheel and the
  calendar feeds. It is still drawn on the food's dial, listed in the
  ring list and counts towards the whole food's verdict. Rings marked
  this way: every coast but a fish's South West (where it has one),
  glasshouse rings, a wild ring beside a market or cultivated one, and
  provenance rings (Welsh, salt marsh, Orkney, the Cornish sardine
  fishery, the national native and Porthilly rock oysters). Search is
  governed by `ring`, not `lead`: a named variety with no `ring` is
  searchable by its name and how it is said; a ring (a coast, a
  glasshouse) is not.
- **Naming a food mid-sentence.** A food's name is lower-cased wherever
  it goes mid-sentence ("Is it apples yet?", "Add apples to your
  calendar", "When are apples in season?", the card's way on). Where
  that is wrong, `said` on the food gives the form: "John Dory", "Dover
  sole", "Brussels sprouts", "Jerusalem artichokes", "runner & French
  beans"; a never-food takes it too ("Brazil nuts"). `_includes/said.html`
  and `foodSaid` in `verdict.js` are the one rule.
- **Naming a variety.** A named variety is a type (forced, maincrop) or,
  with `cultivar: true`, a cultivar (Cox, Conference). In a list it
  follows the food in brackets, a type lower-cased and a cultivar as
  written: "Rhubarb (forced)", "Apples (Cox)". In a sentence it is its
  `said` form, or its name then the food's: "Forced rhubarb", "Cox
  apples". Set `said` when the name is a noun on its own (Mooli,
  Calabrese, Mutton) or the phrase hyphenates (New-season lamb). A
  region ring keeps its capitals: "Cod (South West)". Variety names
  appear as written mid-sentence too ("Venison Red & Fallow"), so proper
  nouns keep their capitals and the rest are lower-case after the first
  letter. Separate foods keep their own names (Wild garlic, Wood pigeon);
  paired names capitalise both (Marjoram & Oregano).
- **`unsold`** marks a food that cannot legally be sold here (wild
  salmon): always NO, its date line this sentence, no calendar events,
  not on the wheel.
- **`short`** is a calendar row's name on a phone (below 700px) and
  nowhere else: at most 17 characters (longer warns), in the plural
  sentence form ("Bramley apples", "Maincrop potatoes"), never an
  invented name. On a variety it is the whole row's name; on a food it
  replaces the food's name, a named variety still following in brackets.
- **`aliases`** belong to one food (zucchini, pigeon); **`also`** words
  are shared (every fungus answers to "mushrooms"). The checker keeps an
  alias unique across foods and never-foods, and no `also` word may be
  someone's alias.
- **`sources`** on a food is every source its rings use; on a ring, its
  own. A food not in the 21 October 2026 bundle keeps its one older
  `source` key. `notes` are sentences shown with the data on the food
  page, the food's then each ring's; `note` is Helen's own; `buy` is the
  counter note (for fish, from the Good Fish Guide). Every one of them
  is printed for visitors, so a note is a sentence a visitor can use,
  never a working note.
- **Reserved slugs** that no food may take are listed in
  `tools/check-foods.py` (`RESERVED_SLUGS`): the pages, the endpoints and
  every old address that forwards (`grey-squirrel`, `button-mushrooms`,
  `cobnuts`).

## Colours

- Every food, variety and shade colour reaches 3.15:1 on both
  backgrounds, the custard `#fbf3d9` and the shed `#16110e`, because the
  verdict word is set in it. No colour but rhubarb's comes within 10
  OKLab units (×100) of the brand pink `#ff2d78`.
- No colour can reach 4.5:1 on both backgrounds. Where `colour` falls
  short on one, the food (or variety) has `text_on_shed` or
  `text_on_custard`: the same hue at 4.6:1 there, for its name set in
  its colour at text size.
- Two varieties of one food within 12 OKLab units warn; two rows with
  the same colour fail.
- The palette came from `colours.yml` in the 21 October 2026 bundle.

## The verdict

`assets/verdict.js` is the one verdict function, loaded by every page and
required by `tools/bake.js`, so the baked HTML and the live page cannot
disagree. Its rules, in brief (the comments in the file are the full
statement):

- **A verdict for the whole food.** A food's rings are combined into one
  timeline, each week taking the best state any ring has: `in` > `avail`
  > `glass` > `store` > nothing. The verdict and date line are worked out
  on that timeline, so apples are not JUST while Cox ends and Braeburn
  carries on, and cod answers for all its coasts. Each ring is answered
  on its own too, for the ring list and for a variety found by search.
- **Verdicts**, in rank order: YES > JUST > YES-ISH > NEARLY > NO. YES-ISH
  is a week of storage or glasshouse alone; fresh beats it and it beats
  NEARLY. The thresholds are constants at the top of the file: NEARLY
  within 3 weeks of a start, JUST within 2 weeks of a hard stop, "just
  arrived" for the first 2 weeks of a run, and an isolated just-about run
  (touching no in-season run) reads JUST.
- **No calendar dates for seasons.** The data is weekly and mostly came
  from monthly calendars, so a boundary is said in words chosen by the
  days from today, the same four steps coming and going ("A few days
  away", "A week or two away", "Two or three weeks away", "From early
  November", then "In April" or "Back in April"; "A few days left", "A
  week or two left", "Two or three weeks left", "Until late December")
  and names the middle of the data week. Early is the 1st to the 10th,
  mid the 11th to the 20th, late the rest; "mid-" is always hyphenated,
  "early" and "late" never are. The one calendar date on the site is the
  as-of date. A two-part start: "First ones in April, in earnest in
  May.", "A few about now, in earnest in a week or two." A YES whose
  fresh run ends softly says so once the end is near: "A few days left,
  then tailing off until late November."; a JUST that is a just-about
  tail, or an isolated just-about run, says "Tailing off until late
  November." or "Tailing off, a few days left." Storage and glasshouse
  lines: "Until late November, then available from storage until late
  July."; "Available from storage until late July."; "Under glass for
  now. Outdoor from early July." Always "available from storage", never
  "from store"; "under glass", never "glasshouse-grown". No semicolons
  in anything a visitor reads: a note, a counter line or a date line is
  two sentences instead.
- **Dates** are ordinals, "22nd October 2026", with the letters raised
  wherever they are shown (`datePieces`, `dateHtml`); a week's days are
  "15th–21st October".
- **The digest** (`nowLists`) gives six lists for a week, one per band:
  just arrived, on the way out, on the way in, great this week,
  available from storage, under glass; each split by kind of food.
  `byPhrase` regroups a list by one timing per food (`timing`: the
  distance to the one boundary as `when`, the rest of the phrase as
  `aside`).
- **Quotations** are picked by a hash of slug and week, so a shared link
  shows the same line all week.

Tests: `node --test tests/verdict/verdict.test.js` checks the grid, the
cases in the scope document, and that every food and ring has a verdict
and a date phrase in every week, with the verdict order and the storage
words holding throughout.

## Endpoints built from the data

- `foods.json`: the whole data file. Linked from every page as the
  alternate and from the footer.
- `search.json`: what the header search and the not-found page match
  against: every food and never-food with its name, its varieties as
  said (not its rings), aliases, shared words and the baked verdict.
- `built.json`: the day the site was baked for; the stale-build check
  reads it.
- `sitemap.xml` and `robots.txt`: every page, food and never-food that
  is not `noindex` or `sitemap: false`, and the pointer to it.
- `season-starts.ics` and `/remind/<slug>.ics`: calendar feeds, one
  all-day event repeating yearly at the start of each in-season run of
  each ring not marked `lead: false`, from `_includes/ics-events.html`. A
  run that carries on from week 52 into week 1 is one season, starting
  in its autumn run. A UID names the food, the ring and which of its
  seasons it is (`rhubarb-forced-1@is-it-rhubarb-yet`), never its date,
  so a calendar updates a moved event rather than adding one. A renamed
  food's old feed has no forward (a feed cannot redirect on Pages), so
  its subscribers must subscribe again.

## Checking the data

`python3 -I tools/check-foods.py` validates all five data files and the
stubs: the shape of every entry, the week ranges, the colour rules, the
text colours, the `said`, `cultivar`, `ring`, `lead`, `short`, `aliases`
and `also` fields, the source keys, the reserved slugs, every stub, and
that every verdict has a general quotation. Problems fail; warnings
print. Run it after every data edit. Python here has no YAML library, so
Ruby parses each file. It does not check that source links resolve:
`sh scripts/check-link.sh <https-url>` does, one URL at a time, printing
the status and the final address.

## Sources

Where each kind of food's dates come from is written for visitors on
the Source data page (`sources/index.html`), which also lists every
source by kind. In short: fruit and veg from the New Covent Garden Market
calendar and Defra's wholesale prices, corrected by the RHS, British
Apples & Pears and growers; fungi from First Nature and foraged plants
from Forestheart and common knowledge; herbs common knowledge; fish from
three fishmongers on three coasts (Flying Fish Seafoods, Brighton &
Newhaven Fish Sales, Northumberland Seafood), Seafish and the law, with
fish counter lines from the Marine Conservation Society's Good Fish
Guide; game from BASC, and lamb, goose and turkey from industry bodies
and butchers. A food whose only source is `general` is still to be
checked; the checker warns on each.

The data and writing are published under CC BY 4.0; the sources keep
their own terms.

## Provenance scripts (do not rerun)

- `tools/make-foods.py` derived `_data/foods.yml` and the stubs once from
  the New Covent Garden Market PDF (`tools/ncgm-extracted.json`, cut by
  `tools/pdf-extract.py` and `tools/pdf-streams.py`). It knows none of
  the hand edits since; rerunning it overwrites them.
- `tools/merge-bundle.py` merged the 21 October 2026 season bundle
  (`seasons.json`, `sustainability.json`, `sources.json`) and
  `colours.yml` into `foods.yml` once and wrote `_data/sources.yml`. Its
  docstring says what it did and why: months on the 4-4-5 week split;
  rings as varieties with `ring` and `lead: false`; Helen's windows kept
  for the foraged plants she already had; snipe dropped; wild salmon
  `unsold`; fish `buy` lines from the Good Fish Guide; every colour from
  `colours.yml`. Rerunning it would merge twice.

## Updating the data

1. Edit `_data/foods.yml` (or `never.yml`, `quotes.yml`, `sources.yml`).
   A new food needs its three stubs: `_foods/<slug>.md`,
   `_remind/<slug>.ics` and `_wheels/<slug>.svg`; a never-food needs
   `_never/<slug>.md` instead (copy any existing one and change the slug).
2. `python3 -I tools/check-foods.py` until it reports 0 problems.
3. `node --test tests/verdict/verdict.test.js`.
4. `sh tools/build.sh` and look at the food's page, the calendar and the
   wheel.
5. A renamed food keeps its old address as a page that forwards (copy
   `grey-squirrel/index.html`), and the old slug joins `RESERVED_SLUGS`.

## Coming: sustainability and carbon

The bundle's `sustainability.json` and `emissions.json` are not in the
data yet. `sustainability-and-carbon/index.html` is their reference
page, "Information coming soon.", `noindex` and linked from nowhere
until then; its slug is reserved. Fish `buy` lines already carry the
Good Fish Guide's advice.

The shape they will take, decided before they land so that they are
not merged into `foods.yml` (which would weigh down `foods.json` for
every visitor and tangle two kinds of data): each in its own file under
`_data/`, keyed by slug, checked by `tools/check-foods.py` against the
foods and the source register.

```yaml
# _data/sustainability.yml: a rating per stock and gear, dated, since
# the Good Fish Guide changes twice a year.
- slug: cod
  body: mcs                      # a key in sources.yml
  as_of: 2026-10
  ratings:
    - ring: South West           # optional: a ring's name
      stock: "Celtic Sea"
      method: "Hook & line"
      rating: 2                  # 1 to 5, as the guide scores
      label: "Best Choice"
      url: https://…
  best: "MSC line-caught Icelandic cod"
  labels: [msc]                  # marks worth asking for

# _data/emissions.yml: per food, not per ring.
- slug: beef
  kg_co2e_per_kg: 60
  source: owid                   # a key in sources.yml
  scope: "farm to retail, global mean"
```

With the ratings structured, a `buy` line keeps only the advice and the
template writes the rating line; the ring list can show a rating beside
a coast; the reference page is a table from the data.
