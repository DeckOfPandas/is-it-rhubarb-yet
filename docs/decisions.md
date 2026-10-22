# Decisions

Dated, newest first. Each is a choice Helen made or confirmed, with the
reason, so that nobody relitigates it by accident. What the site does
now is in `docs/design.md` and `docs/data.md`; how to work on it is in
`model_instructions/manual.md`. Add to the top.

## 2026-10-22, after the full review

- **The header search goes home on Enter only.** It used to go after
  0.3s on one good match or 0.8s otherwise; a slow typist was carried
  off mid-word and a phone lost its keyboard. Typing only colours the
  word and offers a completion.
- **A soft end says so.** "YES. For a few more days." one week and
  "JUST. Until late November." the next read as the verdict getting more
  urgent while the sentence relaxed. A YES whose fresh run ends into a
  just-about tail reads "At its best for a few more days, then just
  about until late November."; a JUST that is the tail, or an isolated
  just-about run, reads "Just about, until late November." The
  thresholds are unchanged.
- **A fishmonger's "fair" months are `in`.** Encoded as `avail`, they
  made ling NEARLY for 35 weeks, langoustines 31 and herring 26, and
  carried them on Now's "On the way" for half the year. Every `avail`
  run of nine weeks or more on a fish ring is now `in`; shoulders of a
  few weeks stay `avail`.
- **A never-food's card links to its page**, "Tell me why →": the page
  has the quotation, the share card and the ways on, and search is how
  anyone finds it.
- **The sustainability page is not linked** until it has content; it
  stays, `noindex`, at its reserved slug.
- **A keepalive commit on main.** GitHub pauses every scheduled workflow
  after 60 days without a commit, the daily deploy and its stale check
  both; `keepalive.yml` pushes an empty commit once the last is 45 days
  old, which resets the clock for all of them, itself included. It is
  the one exception to "never commit on main".
- **Every note in the data file is a sentence for a visitor.** The
  working notes ("FUDGE:", "verify", "Check before launch") were being
  printed in the sources disclosure.
- **Link checks go through `scripts/check-link.sh`**, since a bare curl
  allow rule cannot be made narrow (a trailing `*` lets a second `-o`
  write anywhere).
- **One baked calendar, reordered by script.** Three baked copies, so
  the order switch could work by CSS alone, made the page 759 KB and
  over 10,000 SVG nodes; the no-JS visitor paid most for a switch they
  rarely use. The chart is baked by start and `charts.js` reorders it in
  place; without JavaScript the switch is not shown.
- **No tooltips on the calendar's cells.** Every cell carried a
  `<title>` ("Parsley: going out, weeks 44 to 48"), a native hover
  tooltip with week numbers the site shows nowhere else, against the
  rule that nothing is behind hover; the row's spoken name says the
  season.
- **"Cultivated mushrooms"**, not "Mushrooms (cultivated)": the name
  goes mid-sentence everywhere ("Is it … yet?", "Add … to your
  calendar", the title), where a bracket read badly. The slug stays
  `mushrooms-cultivated`.
- **A method ring says what it is in `method`**, and the verdict reads
  that key rather than matching the ring's name, so a ring renamed
  "Under glass" would still answer as storage does.
- **Sustainability and emissions data live in their own `_data` files**,
  keyed by slug and never merged into `foods.yml`; the shape is in
  `docs/data.md` so the bundle lands in it.

## 2026-10-22

- **A verdict for the whole food.** A food's rings are combined into one
  timeline and the food answers as a whole; no ring "leads" any more.
  `lead: false` only keeps a ring off the calendar, the wheel, search and
  the feeds. Before this a fish answered by its South West ring and
  apples by one cultivar, which made apples JUST while Cox ended though
  Braeburn carried on. (PR #69)
- **YES-ISH** is a verdict of its own for a week of storage or glasshouse
  alone, ranked between JUST and NEARLY, with its own quotation pool
  (`yesish`). Before this a storage week answered YES. (PR #69)
- **One food page shape** for every food: question, verdict, date line,
  quotation, the dial with its ring list as the legend, the counter note,
  Also great this week, one rule, the sources disclosure, the calendar
  line, the way on. Food pages have no as-of line; the footer's says it.
  The earlier "ALL APPLES" data block with runs in months and bands is
  gone. (PR #69)
- **Button mushrooms became Mushrooms (cultivated)**, slug
  `mushrooms-cultivated`; `/button-mushrooms/` forwards. (PR #69)
- **Search: text found only inside a word is no match** anywhere ("ape",
  "lla" get LITERALLY NO IDEA). The header search jumps home after 0.3s
  on one good match or 0.8s otherwise (was 0.6s and 1.5s). "Ask about
  something else" under every home answer empties the hero; the first
  click into a hero holding a word selects it all. (PR #69)
- **The card asks its question only when the hero spells another name**
  for the food (ZUCCHINI is answered "Is it courgettes yet?"); otherwise
  the hero's word is the question. (PR #69)
- **Ordinal dates everywhere**, letters raised: 22<sup>nd</sup> October
  2026, 15<sup>th</sup>–21<sup>st</sup> October. In the caps style the
  letters stay lower-case. The footer's date had lost its ordinal on
  19 October and gets it back. (#65, PR #66)
- **"Still great but on the way out"** everywhere the `last` list is
  named; never "Last chance". Its anchor stays `#last`. (PR #66)
- **Share cards keep their words in the middle square.** WhatsApp and
  some mail apps cut the middle 630px square out of a 1200 by 630 card,
  so everything readable sits in a column inside it; the run fails if
  words stray outside. Cards are drawn at twice the size. The calendar
  and wheel pages get cards of the real charts; the wheel's is a JPEG
  because its PNG was near a megabyte. (PR #67)
- **Icons step down by size, one design at each**: R at 16, IIRY at 32
  and 48, the stack from 96 up. No SVG icon, which a browser would take
  over the PNGs at every size. An 800px profile picture for social
  accounts is drawn into `tmp/socials`, not used by the site. (PR #67)
- **Credits live on Source data**, not About, which ends on the dinner
  line. (PR #67)
- **An action's arrow never starts a line**: the last word and the arrow
  share a nowrap span (`_includes/arrow-words.html`). (PR #67)

## 2026-10-21

- **The 21 October 2026 season bundle and palette are merged** by
  `tools/merge-bundle.py`, once: months on the 4-4-5 week split, the
  `store` state, rings as varieties with `ring` and `lead`, every colour
  and text colour from `colours.yml`, fish counter lines from the Good
  Fish Guide, snipe dropped, wild salmon `unsold`. Helen's windows stand
  for the foraged plants she already had. (PR #61)
- **A calendar feed for every food** at `/remind/<slug>.ics`, and a
  Source data page in Helen's words with the feeds explained three ways
  (Apple, Google, the file). (#41, PR #61)
- **Sustainability and carbon** has a placeholder page, `noindex`, from
  the footer, until the bundle's data is in. (PR #61)
- **The wheel opens on Whole year**, every arc and name at full
  strength; In season is the switch. (PR #61)
- **One page width**: header, main and footer share `--page`. (PR #60)
- **The header's wordmark is the search** on every page but home;
  RHUBARB is the placeholder, IS IT and YET? link home. (PR #60)
- **Short names for the calendar on a phone** are the plural sentence
  form, never invented; a row with no honest short name shows its full
  one. (PR #60)
- **Helen's arrow mark** from her Helen Triages sites is the arrow on
  every action link. (PR #60)
- **The header sticks**; controls take the page's font; every toggle is
  one build, `.switch`. (PR #60)

## 2026-10-20

- **The wheel never turns.** TODAY and the seasons move the line, not
  the wheel, and nothing at its edge is clipped. (PR #58)
- **Time travel, highlight, popover, magnifier and seasons** on the
  calendar and the wheel; the ALL wheel; one card everywhere (the home
  answer's card is the popover). (PR #58)
- **Four season icons from Helen's Inkscape file**, credited as the Noun
  Project licence asks; the TODAY pin redrawn by hand because Helen's
  trace was 416 KB. (PR #58)
- **Type and spacing scales**: every font size and every gap is a token.
  (PR #58)
- **"When are apples in season?"** is a food page's `<title>` and the
  start of its description; the link preview keeps "Is it apples yet?
  Just.". (PR #58)

## 2026-10-19

- **A food at three levels**: row, card, page, each a smaller version of
  the next, never a fourth design. Home's single answer is the food's
  card. Going from the card to the page moves the word, the verdict and
  the dial into place with cross-document view transitions. (PR #58)
- **Home search ranks by tier** (exact, at the start, at a later word),
  one hit per food, and only ever narrows as letters are typed; the hero
  completes the best match and takes its colour. (PR #58)
- **A kitchen sink page** shows every shared component at rest, hovered
  and focused, with the forced states copied from the stylesheet's own
  rules. `tools/dev/shots.js` takes the design-review set. (PR #58)
- **Never-foods are ghost grey**, `--never`, never the pink. (PR #58)
- **The licences read CODE: MIT and DATA AND WRITING: CC BY 4.0.**
  (PR #58)
- **Three fonts, one job each**: Newsreader italic for quotations, Anton
  capitals for verdicts and the names of pages and sections, Atkinson
  Hyperlegible Next for everything else; Atkinson at 400 and 700 only.
  (PR #58)
- **"Great this week"** everywhere, never "Great now". (PR #58)
- **A variety reads "Rhubarb (forced)" in a list and "forced rhubarb" in
  a sentence**; cultivars keep their capitals. (PR #58)
- **The logo's RHUBARB is underlined**, the hero rests as the logo, the
  nav sits at the right on every page. (PR #58)
- **Verdict tags sit at the row's end on a dotted leader**, only where
  verdicts mix. (PR #58)
- **A favicon and an app icon**: IIRY with the R in rhubarb. (PR #58)

## 2026-10-18

- **Season dates in words the data can stand behind.** The data is
  weekly and mostly from monthly calendars, so no season boundary is
  ever a calendar date; the as-of date is the only date. (PR #18)
- **A daily rebuild** at 03:30 UTC, and a stale-build check that opens
  one issue when the live site is more than two days old. (PR #18)
- **Share cards**: a dated picture of the answer for every link preview,
  because chat apps keep the first preview they fetch. (PR #39)
- **The About page** in Helen's words, reached from the signature hearts.
  (PR #39)
- **Helen's NEVER list**: thirty-one foods, lines played for laughs, never
  at anyone's expense. (PR #39)
- **Rhubarb and custard, in three typefaces**: custard and the forcing
  shed as the two backgrounds, rhubarb pink as the one brand colour,
  which never carries body-size text. (PR #18)
- **One verdict function**, `assets/verdict.js`, run in the browser and at
  build; the Liquid templates only read `_data/baked.json`. (PR #18)
- **The quotations vetted** against the scope document's tests; out of
  copyright or single attributed lines relied on as fair dealing, which
  is Helen's call. (PR #18)
- **The 18 October palette**: every colour passes on shed and custard.
  (PR #18)

## 2026-10-14 to 2026-10-16

- **Weeks, not dates.** A week is the coarsest unit at which "just about
  in" means something: week 1 starts on 1 January, each week is 7 days,
  week 52 takes the remainder.
- **No plugins, no npm, no gems beyond Jekyll, no raster images in the
  repository.** Every mark is drawn in code. Every request for one has
  been refused.
- **No trigonometry in the templates**: arcs are dashed circles with
  `pathLength`; rotation is a transform. Only `assets/charts.js` uses
  sine and cosine.
- **The dial's radius means season length**; the verdict is set in the
  food's colour.
- **Culinary groups** rather than botanical ones.
- **MIT for the code, CC BY 4.0 for the data and writing.**
- **The data README that never was.** `_data/foods.yml`'s own header is
  the schema; there is no separate README in `_data/`.
