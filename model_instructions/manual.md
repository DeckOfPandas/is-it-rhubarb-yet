# Manual

How the site is put together, for whoever works on it next. Rules are
in `CLAUDE.md`; design work arrives as GitHub issues; this is the map.

## Shape

- Jekyll, no plugins, vanilla JavaScript, inline SVG, three self-hosted
  fonts. Nothing is fetched from anywhere else.
- **One verdict function.** `assets/verdict.js` holds the rules: the
  week grid, the verdict for a variety and for a food, the phrase under
  it, the variety line, the weekly digest's lists and the quotation
  pick. Every page loads it as a classic script; `tools/bake.js`
  requires it under Node and writes `_data/baked.json` (gitignored)
  with today's verdicts, which the Liquid templates read. So the build
  is two steps, `sh tools/build.sh`, and the baked HTML is right for
  link previews, search engines and no-JS visitors, while
  `assets/site.js` recomputes everything for the visitor's own day. The
  thresholds (NEARLY within 3 weeks, JUST within 2, NEW for 2, isolated
  "just about" runs read JUST) are constants at the top of
  `verdict.js`. Tests: `node --test tests/verdict/verdict.test.js`,
  which also checks that every food and variety has a verdict and a
  date phrase in every week.
- **No calendar dates for seasons.** The data is weekly and mostly came
  from monthly calendars, so a season boundary is said in words chosen
  by the days from today ("Any day now", "In a week or two", "From
  early November", "Back in April"; "For a few more days", "Until late
  December") and names the middle of the data week. The rules are the
  comment over `phrase` in `verdict.js`. The one calendar date is the
  "as of" date, which is when an answer was true. Dates are plain
  numbers, never ordinals: "19 October 2026", "15–21 October".
- **The digest** (`nowLists`) returns each of its four lists split by
  kind of food, `[{kind, items}]`, just arrived and great now A to Z,
  last chance and on the way soonest first. `flatten` gives one array,
  `azList` one array A to Z, and `byPhrase` regroups a list by one
  timing per food, `[{phrase, items}]`, soonest first and A to Z
  within: `timing` splits a two-part phrase into the `when` that groups
  the food ("In a week or two") and the `early` part shown beside it
  ("first ones any day now", "a few about now"). `bake.js` bakes them
  as `phrases` and `az`. The Now page shows just arrived as one A to Z
  list, last chance and on the way grouped by timing, and great now
  grouped by kind with counts.
- **Naming a variety.** A named variety is a type (forced, maincrop)
  or, with `cultivar: true` in the data, a cultivar (Cox, Conference).
  `varietyLabel` gives its list form, in muted brackets after the food,
  a type lower-cased and a cultivar as written: "Rhubarb (forced)",
  "Apples (Cox)". `varietySaid` gives its sentence form, the `said`
  field or its name then the food's, "Forced rhubarb", "Cox apples",
  with a type lower-cased mid-sentence and a cultivar never. Lists sort
  by food, then variety. `bake.js` bakes `labels` per variety for the
  calendar and the feed. Separate foods keep their own names (Wild
  garlic, Wood pigeon), and paired names capitalise both (Marjoram &
  Oregano).
- **Share cards.** `tools/cards.js` draws a 1200 by 630 PNG per food
  and never-food, plus `home.png` and `now.png` (the wordmark or the
  Now title, then the week's three lines as home's teasers have them,
  dated; every other page uses the home card), into `_site/cards/`
  after Jekyll: each is a small HTML page with the fonts inlined,
  screenshotted in headless Chromium through the Playwright the
  container and the deploy both have (never committed: the site has no
  raster files in the repository). Every page's `og:image` and
  `twitter:image` point at its card; the card carries the as-of date,
  because chat apps keep the first preview they fetch. `node
  tools/cards.js --out tmp/cards --icons tmp/icons --only
  rhubarb,home,now,icons` draws a few to look at.
- **Icons.** The favicon (32px), the Android icon (192px) and the
  Apple touch icon (180px) are "IIRY" in Anton, light ink on the shed,
  the R in pink and underlined in it. `tools/cards.js` draws them into
  `_site/icons` at build, like the cards: one square page shot at each
  size, never committed.
- `_data/foods.yml` is the truth: edit it by hand. `_data/groups.yml`
  names the culinary families and their `kind`. `_data/never.yml` lists
  the foods that are never in season here, each with a line.
  `_data/quotes.yml` holds the pools, one per verdict including
  `never`. `tools/check-foods.py` validates all four, including the
  colour rules and the `said` and `cultivar` fields; run it after any
  data edit. A food's page needs its `_foods/<slug>.md` stub.
- `tools/make-foods.py` derived `_data/foods.yml` and the stubs once
  from the New Covent Garden Market PDF and is kept for provenance. It
  knows none of the hand edits since (the palette, the cultivars, the
  names): rerunning it overwrites them.
- A renamed food keeps its old address as a page that forwards:
  `grey-squirrel/index.html` sends `/grey-squirrel/` to `/squirrel/`,
  and the checker keeps that slug from ever being a food's.
- Pages: `index.html` (the hook: "Is it [ ] yet?" with the live-filtered
  list of every food and its verdict), `_layouts/food.html` (one food
  at `/<slug>/`), `_layouts/never.html` (a never-food at `/<slug>/`),
  `now/` (the weekly digest), `calendar/` (the year chart, three
  orders), `wheel/` (the arrivals wheel per kind), `sources/`,
  `404.html` (the not-found verdict, with suggestions), and
  `about.html`, Helen's copy, reached from the signature hearts in the
  footer; its food count and dinner food come from the data. Data
  endpoints: `foods.json`, `search.json` (what the not-found page's
  suggestions match against), `season-starts.ics`.
- Includes: `food-row.html` (one food in a list, one link: swatch,
  name, variety in brackets, an earlier timing, and with `tag` and
  `leader` on, the default, the verdict tag right-aligned at the row's
  end on a dotted leader; a list whose heading already says the verdict
  passes `tag=false`; `site.js` builds the same markup in `foodRow`),
  `food-group.html` (a group inside a section: an Atkinson capitals
  label, optionally with a count, over its rows, a hairline above every
  group but the first; home's families, Now's timings and kinds;
  `foodGroup` in `site.js`), `band.html` (one band of the digest, in
  the shape `plain`, `phrase` or `kind`), `calendar.html` (a sticky
  header SVG over a scrolling body SVG), `season-cells.html`,
  `season-wheel.html`, `arrivals-dial.html`.
- Every multi-column food list reads down each column, then across
  (CSS `columns`), so A to Z reads down. A list in columns cannot be
  reordered in place, so home draws its list twice, by family and A to
  Z, and shows typed matches in a list of their own.
- Switches are radio groups. CSS `:has()` shows the chosen variant.
  Only the theme is remembered; the order and kind switches open on
  their default every visit (home by family, calendar by start, wheel
  on All). Every toggle is one build, `.switch` in `assets/site.css`:
  a 32px pill, the chosen segment marked in ink by a 26px pill (a 26px
  disc for an icon alone, `label.seg-icon`), words in the caps style,
  icons 15px. Each segment is at least 44px wide and its tap area, an
  invisible `::before`, runs 9px above and below it to 44px, 6px past
  the pill, so a pill needs 6px clear above and below; segments touch,
  so tap areas meet and never overlap. Nothing on the site needs
  JavaScript to be readable; the baked verdicts carry their "as of"
  date in the footer and in each food page's data disclosure.
- Matching what people type (`site.js`): case, accents and punctuation
  ignored, `&` reads as "and"; a word is matched under its forms (itself
  and, after a trailing s or ies, its singular) on both sides, so
  "chilli" begins "chillies" and "cherry" begins "cherries"; every typed
  word must begin a candidate word, or at least occur inside one.
  Candidates are names, varieties as they are said, `aliases` (one
  food's own: zucchini, pigeon) and `also` (shared broader words: every
  fungus answers to "mushrooms").

## Design

- Rhubarb and custard. Backgrounds are the custard `#fbf3d9` (light)
  and the forcing shed `#16110e` (dark); text is ink, `#1c1714` or
  `#f3ede4`. The one brand colour is `--rhubarb`, `#ff2d78`, the same
  in both themes; it is also rhubarb's food colour and no other food
  comes near it. The pink never carries body-size text: links are ink
  with a pink underline.
- Never-foods all share `--never`, ghost grey `#857f78` (4.7:1 on the
  shed, 3.6:1 on custard): their swatches and tags, their pages and
  cards, the NEVER in a lone search result, the hero's completion, and
  the hero's word and underline on a lone never-food match. They never fall back to the pink. The
  colour is a token at the top of `assets/site.css` and a constant in
  `tools/cards.js`; there is no colours file.
- Every food colour passes 3:1 on both backgrounds, so a verdict word
  is simply set in `--food`. "Today" is drawn in ink: the dial hand,
  the calendar line, the wheel hand.
- Three fonts, chosen by asking in order: a quotation is Newsreader
  italic; a verdict or the name of a page or section is Anton in
  capitals; everything else is Atkinson Hyperlegible Next. Anton never
  sets a sentence, a link or a control; Atkinson uses 400 and 700 only,
  and capitals only in the caps style; an Anton
  label heads a section and an Atkinson one a group inside it. The
  rules head the fonts section of `assets/site.css`. Anton's
  letter-spacing has two settings by size, `--track-large` at 40px and
  above and `--track-small` below. The WOFF2 files under
  `assets/fonts/` are Google's Latin subsets, 116 KB in all; the budget
  is 150 KB. Atkinson's is the variable font (weights 200 to 800), so
  400 and 700 are one file and one design; its l has a curled foot at
  every weight. Buttons and inputs take the page's font
  (`font: inherit`), since browsers otherwise set them in their own
  (Arial, whose l is straight). The subsets have no arrows, so → and ↓
  come from the system's fonts.
- **Type scale.** Every font size is a token at the top of
  `assets/site.css`, and nothing else. Atkinson: `caps` 12px, 700,
  capitals, +0.07em (`--fs-caps`, `--track-caps`; the nav, the footer,
  group labels, chart month names, a dial's months and TODAY); `small`
  14px; `body` 17px; `lead` 23px (the date line, bold, on a food page
  and a card; the quotation, in Newsreader). Anton: `label` 20px (every
  section label, in full ink: ON THE WAY, GREAT THIS WEEK, EVERYTHING,
  ALSO GREAT THIS WEEK, N MATCHES; a card's question, muted); `title`,
  one clamp (page titles, a food page's question, a card's verdict);
  `display` (the hero, and the verdict until `site.js` fits it). The
  sizes that do not fit, kept on purpose: the wordmark, sized as a
  logo; the stacked hero below 600px, larger than display to fill the
  phone; a row's verdict tag, Anton at the small size; the week arrows
  on Now, glyphs sized as controls; the calendar's week numbers, 8
  units so 52 fit; and the arrivals wheels' labels (9 and 10 units), in
  a viewBox that is scaled to the screen, so their pixel size varies.
  Chart text elsewhere is set in units equal to pixels: the calendar is
  never scaled.
- **Spacing scale.** Every margin and gap is `--sp-1` to `--sp-5`: 8,
  16, 24, 40, 64px. 40px parts the major blocks of every page (hero,
  teasers, results, the Everything list; a food page's body, Also, the
  data, the way on; Now's bands); a label sits 8px above what it labels.
  Padding inside small controls (a pill's segment, a row's highlight)
  and optical nudges in em are not spacing and stay as they are.
- The verdict word fills the line; then `site.js` makes it smaller, if
  it must, until the date line under it is wholly on the first screen,
  16px clear, at any window size (at 1280×800, carrots' YES is 625px).
  Never below 64px. CSS stands in before the fonts load and without
  JavaScript.
- The question over the verdict is set at `title`, the full width, its
  lines balanced (`text-wrap: balance`).
- **Food page layout.** From 720px wide, under the verdict, two
  columns: on the left the date line, the quotation, the variety line
  and the counter note; on the right the dial and its legend. Below
  720px one column, the dial after the quotation. Then Also, the data
  and the way on, full width. `.food-body` in `_layouts/food.html`
  holds the five in reading order and the grid places them. The quote
  bar and the counter note's bar stay in the food's colour.
- **Logo.** IS IT RHUBARB YET? in Anton, RHUBARB pink and underlined
  in pink, the line exactly the word's width, in the header, the hero
  and the cards. It does not change on hover.
- **Header.** NOW, CALENDAR, WHEEL, ?? (About, `aria-label="About"`)
  and a magnifier at the top right of every page, home included, in
  caps, muted, no underline; the current page in ink and underlined in
  pink, as the others are on hover or focus. Every item is at least
  44px square. The wordmark is on the left of the same row, or on
  a phone on a row of its own under the nav, so the nav never moves.
  Home has no wordmark. The header sticks to the top of every page,
  on a solid page-colour background over a 1px rule; `site.js`
  measures its height into `--header-h` (CSS guesses 45px, 85px on a
  phone with the wordmark, until then). What sticks below it sits at
  `--header-h`, and every element with an id has
  `scroll-margin-top: var(--header-h)`, so a jump stops below the
  header; a calendar row reached by the keyboard stops below the
  calendar's sticky blocks too. The magnifier
  links to `/#search`, which names no element, so the page does not
  scroll; `site.js` puts the cursor in the input, and on home scrolls
  back up to it (on a phone, to the input's line).
- **Home hero.** The logo is the input. At rest it reads IS IT RHUBARB
  YET?, the placeholder RHUBARB in pink capitals over its underline with
  a blinking caret in muted ink just after it, a normal space either
  side of the word; on focus the placeholder dims. The input's own
  caret is transparent while it is empty (`:placeholder-shown`), so the
  only caret is the drawn one until the first keystroke: after RHUBARB
  at rest, and at the start of the field once the input has focus (a
  click on RHUBARB puts it there, where the first letter will go). The
  input's width is set in em, the word plus 0.05em, so
  it scales with the type and RHUBARB is never clipped, in print too
  (the drawn caret is not printed). Typed
  text is capitals in ink; when the single best match is found exactly
  or at its start (tier 1 or 2, below, with nothing else at its tier),
  the word and its underline take that food's colour (ghost grey for a
  never-food). Otherwise, as for text found only inside words or not
  at all, they stay ink over the pink underline.
  `site.js` draws the underline at the word's width and the caret, and
  sets a word too long for its room smaller until it fits. One line on
  a wide screen, three below 600px. The input is not focused on load,
  so the hero rests as the logo; the first letter typed anywhere on
  home goes into it. On a phone, focusing it scrolls its line near the
  top of the screen, 16px clear, so the keyboard does not hide the
  results; with reduced motion it jumps.
- **Home search.** While the input has text, the teasers, the arrow
  link and the whole Everything section are hidden, and the results
  stand in the teasers' place, at once, with no debounce.
- **Search ranking.** Home ranks its own way (`tierOf` in `site.js`;
  the not-found page keeps the older scoring). Candidates are each
  food's and never-food's name, aliases and shared `also` words, and
  each named variety by its own name and how it is said ("cox",
  "forced rhubarb"), which joins once `foods.json` is in. Both sides
  are folded (case, accents, punctuation; "&" is "and") and singular
  equals plural. A candidate's best tier: 1, exact; 2, the string
  starts with the query; 3, a later word starts with it; 4, the query
  is inside a word, from the first letter typed. The last typed word
  may be unfinished. A food is one hit at its best tier: found by a
  variety alone it shows as that variety ("cox" gives "Apples (Cox)"),
  and found as well or better itself it shows as the food, so
  "rhubarb" is not followed by "Rhubarb (forced)". Each letter typed
  only ever takes hits away: "b", "be", "ber", "berr" narrow from 43
  to 17 to 11 to 9.
  - One tier-1 match: answered with the food's card (see "A food at
    three levels"), in the label's place. Under it a quiet line,
    "Also: Crab apples", of the tier 2–3 matches as links in their
    colours. Tier 4 is dropped.
  - Phrases used as labels in lists (Now's groups) have no full stop;
    a date line that answers a question (the home answer, a food
    page) does.
  - Otherwise every match of every tier (several tier-1, as
    "mushrooms" finds every fungus) is a row under "N MATCHES", which
    counts them all, a teaser label in the first teaser's spot, in one
    column, by tier then A to Z, with leaders and tags. A list of one
    is answered as above, without "Also" ("pina" finds spinach).
  - No match: a plain card like a never-food's, in ink (its edge
    too): "Is it zzz yet?", LITERALLY NO IDEA., "If that's an actual
    thing, please tell us." (a link to the issues). No dial, no
    arrow, not a link. Under it up to five foods sharing its first
    three letters under DID YOU MEAN.
  - Up and Down move a highlight in rank order through the answer,
    its "Also" links or the rows; Enter opens it, or the first. A
    polite live region says the count. Clearing the input brings
    everything back.
- **A food at three levels.** A food is shown as a row, a card or a
  page, and each is a smaller version of the next, never a different
  design. No fourth way: any new view that needs a food uses one of
  these as it is.
  - **Row** (lists, search results, Now, "Also great this week"):
    swatch, name, and in a list of mixed verdicts the tag on a dotted
    leader. `_includes/food-row.html`, built the same by `foodRow` in
    `site.js`.
  - **Card** (home's single answer, and the calendar's and the wheel's
    popover, which is the same card): the food page in small. On the
    left, in order: the question ("IS IT BASIL YET?", or "Cox apples"
    for a variety), the verdict, the date line (a sentence, with its
    full stop), then an action, "Tell me everything about apples →",
    ink with an arrow, the food's name in its sentence form (lower
    case), the one link, to the food's page. On the right, alone and
    centred, a 110px miniature of the dial with today's hand. The
    question, verdict and date line share the food page's rules
    (`.ask`, `.verdict-word`, `.date-line` in `assets/site.css`) and the
    card only sets them smaller: question `label`, verdict `title`, date
    line `lead` bold, as on the page. The dial is the food page's own
    `figure.wheel` SVG, fetched from the page (`miniDial` in `site.js`,
    which also warms the page), cut to the one ring whose variety gave
    the verdict, that ring widened to fill the band and drawn all in the
    verdict's colour (its shape still the variety's), and cropped to the
    ring. The card and a list of matches share one width, `--answer-w`.
    The panel is `--panel`, one step lighter than the page in both
    themes, 12px radius, its left edge `--food-bar-width` (6px) in the
    food's colour; the food page has no matching bar. On home, Up and
    Down reach the action, and Enter opens the food page. A
    never-food's card is its question, NEVER. and its line, in ghost
    grey with a grey edge: no link and no dial. "When are apples in
    season?" is now the food page's `<title>` and the start of its meta
    description (`_includes/when-in.html`, with the is/are rule); its
    link preview (og: and twitter:) keeps "Is it apples yet? Just.".
  - **Page** (`/<slug>/`): everything.
- **Into the food page.** Pages cross-fade with cross-document view
  transitions (`@view-transition { navigation: auto; }` in
  `assets/site.css`, only with `prefers-reduced-motion:
  no-preference`; a browser without them simply navigates). Following
  a home card, `site.js` names the card's food name `food-name`, its
  verdict `food-verdict` and its dial `food-dial`, and the food
  page names its question's food name (`.ask-name`), its verdict and
  its dial the same, so each moves into place. The home names are set
  only as the answer is followed and cleared once home is shown again,
  so a row or "Also" link never borrows them. The typed text is kept in
  the address as `?q=`, so Back (or a reload) returns to the same
  answer.
- **Completion.** When the single best match (as for the hero's
  colour) has a name or alias that begins with what is typed, the rest
  of it shows after the typed text
  in the hero, faded to 35% in the food's colour (ghost grey for a
  never-food): AVOC + ADOS, ZUCC + HINI (an alias, for Courgettes).
  None for a match only inside a word, for text that is already a
  whole name, with no match, or while an input method is composing.
  It is an `aria-hidden` layer over the input in the same type, the
  typed part transparent, so the real caret stays after the typed
  text and the underline under it alone. The hero is sized for typed
  text and completion together, so accepting does not make the word
  jump. Tab, End, or → at the end of the text accept it, as does a tap
  on the faded part; the input then holds the whole name and the
  results follow. Tab with no completion moves focus as usual. Escape
  dismisses a completion, and a second Escape clears the input. The
  input has `aria-autocomplete="both"`; the completion is not
  announced.
- **Home teasers.** JUST ARRIVED (or ON THE WAY when nothing has),
  GREAT THIS WEEK and LAST CHANCE, each an Anton label over three foods
  in their colours, picked afresh at random on every visit by
  `site.js` from the block's `data-all` (the build's own pick stands
  without JavaScript), and "and N more →", which links to its own
  section of Now (`/now/#arrived`, `#onway`, `#still`, `#last`: each
  band's id is its class), then "Everything in season this week →".
- **Wording.** "Great this week" everywhere (Now's section, the home
  teaser, a food page's "Also great this week"); never "Great now".
  Every link to Now in prose or as an action reads "Everything in
  season this week →" (the nav's NOW and "and N more" excepted). Page
  titles: CALENDAR; THE SHAPE OF THE YEAR on the wheel page, whose nav
  item stays WHEEL. The data disclosures are "Great! Show me the data."
  and "Fine, show me the data.", both with full stops.
- **Links.** Four kinds, in `assets/site.css` under "Links come in four
  kinds":
  - Prose: ink, a 1px pink underline at all times, 3px on hover or
    focus. A prose link to a food's page (`.food-ref`, with that food's
    `--food`) is underlined in the food's colour: on About, "Well, is
    it???" (to rhubarb) and the dinner food.
  - Actions (`.arrow-link`): ink words and "→", underlined only on hover
    or focus, the arrow never. Every "and N more" after a list of foods
    is one, in the colour of the words around it.
  - Foods in lists: inline lists (`.food-link`: the teasers, "Also:")
    set the name in the food's colour; rows (`.food-row`) keep the name
    in ink beside the swatch, since a food colour passes 3:1, not the
    4.5:1 body text needs. Both underline on hover or focus, in the
    food's colour, never the variety or timing, never changing weight
    or size. SVG text draws its underline in its own fill, so the
    calendar turns the name's tspan pink and an inner tspan keeps the
    words in ink.
  - Chrome: the nav (above) and the footer (below).
- **Tap targets.** Every control is at least 44×44px, by padding, the
  glyphs unchanged: the nav items, the magnifier, ??, the week arrows,
  and each segment of every switch. A target can be bigger than its
  mark: a switch's segment is 26px tall inside a 32px pill, and its
  tap area reaches out to 44px (see Switches, above).
- **Footer.** Every word is caps, muted: SOURCE DATA · CALENDAR FEED
  (to the feed's section on Source data) · JSON; ABOUT; the theme
  switch; the GitHub mark (2.2rem, muted ink, pink on hover or focus);
  the licences (CODE: MIT · DATA AND WRITING: CC BY 4.0 · ©, MIT to
  opensource.org's text and CC BY 4.0 to Creative Commons') and the
  as-of date, fainter; the signature hearts, which do not change on
  hover. Every text link is underlined in pink at all times, 1px, 0.3em
  below the capitals; on hover or focus it is ink with a 2px line.
- **About.** Titled "??" in Anton `title` (a screen reader hears
  "About"); it opens "Is it rhubarb yet? Well, is it???", the second
  sentence a prose link to rhubarb's page. The dinner food in "Coolio,
  I'm off to cook …" is picked at random on every visit from what is
  YES on the visitor's day (just arrived or great this week); the build
  bakes one for no JavaScript. Credits for the four season icons and the
  TODAY pin close the page.
- **Now.** The title follows the week shown ("this week", "next week",
  "last week", or none), over one muted line, "‹ 15–21 October ›".
  Weeks run through real years, a year either way of this week; the
  address carries `week=` and, in another year, `year=`. Every band is
  the full width, 40px apart, at every screen size: Just arrived, Last
  chance, On the way, Great this week. Inside a band, groups are
  parted by a hairline and each group's foods flow down each column,
  then across. Just arrived is left out in a week when nothing has
  arrived.
- **Calendar.** Drawn at its own size and never scaled, so every word
  is the size it is set (food names 12px, rows 22px tall); where the
  page is narrower than the chart, it scrolls sideways, the food names
  stuck to the left and the month header stuck to the top, and it opens
  scrolled so today is a third of the way across the weeks in view. On
  a phone it runs to the screen's edges. `_includes/calendar.html`
  draws it as four SVGs sharing one set of coordinates: the corner and
  months on top, the names and weeks below.
- **The calendar and the wheel, played with.** `assets/charts.js`,
  loaded only on pages with `charts: true`, on top of charts that work
  without it; it borrows the card's dial, the hand and Now's bands from
  `site.js` through `window.Site`, and every date through `verdict.js`.
  - **Highlight.** Hovering or focusing a food (a calendar row, by its
    name or its weeks; a wheel dot, label or arc) lights it and fades the
    rest to a quarter; on the calendar a faint ink band (ink at 8%) lies
    behind its row; on the wheel its label comes to the front (unless it
    has focus, which moving it would take). Each is focusable with a
    name and its season, "Celery, July to October" ("Bay, all year";
    two runs joined with "and").
  - **Popover.** A click, tap or Enter pins the food (outlined in ink)
    and opens its card: exactly the home answer's card (same width,
    type and layout; see "A food at three levels"), plus the time it is
    for in caps over the question when that is not today ("IN EARLY
    APRIL"), and a × button of its own in the top right. Its dial is the
    single ring of the variety that gave the verdict (on the calendar,
    the row's own variety). Escape, a click outside or × closes it; focus
    goes back to the food (after a click outside, only if focus was in
    the card). Wide: beside the food, under its row or right of its dot,
    flipped to stay on the screen. Below 700px: docked at the foot of
    the screen, and the page scrolls the food clear of it.
  - **Time travel.** Today is a short ink tick on the calendar's month
    axis and across the wheel's month ring, and never moves; it replaces
    the dashed today line and the hand. The line is pink, `--rhubarb`,
    with a 2px halo in the page colour so it shows across forced
    rhubarb: a vertical line on the calendar, a radius from the month
    ring to the rim on the wheel. Its handle (a pink pill in a rail over
    the calendar's sticky header, kept inside the weeks; a knob at the
    wheel's rim) says the time in caps, MID DECEMBER or TODAY, and is a
    slider: → and ← a step, Page Up and Page Down a month, Home back to
    today; dragging snaps to the nearest step. There are 36 steps, early,
    mid and late in each month, standing for the 5th, 15th and 25th
    (verdict.js's early is the 1st to the 10th). The line starts at
    today itself, which is off the steps unless it falls on the 5th,
    15th or 25th; the first move goes to the step either side. The
    address carries `?when=mid-december` (none at today) and is read on
    load. The calendar on show scrolls to keep the line in view.
  - **Readout** (the calendar). In the sticky header's corner, over the
    food names, a button in caps on two lines: "MID DECEMBER ·" over
    "42 IN SEASON ↓", or "THIS WEEK ·" when the line is on today; N
    counts the foods whose verdict is YES or JUST at the line's time,
    and follows the line. Pressed, it scrolls to the list under the
    chart (smoothly, or at once with reduced motion) and gives the
    list's heading focus. From 700px the controls (TODAY, the seasons,
    play, the magnifier) stick under the site's header while the chart
    is on screen, the chart's header under them (`.tt-stage` ends with
    the chart; `charts.js` measures `--tt-controls-h`, and the chart's
    header as `--cal-head-h` for the rows' scroll margin); below 700px
    only the chart's header sticks, directly under the site's, and the
    controls scroll away.
  - **The list under the chart** is Now's bands for the line's time,
    built by the same code: at today, Now itself under "This week"; at
    another time under "In mid-December" (Anton `label`), with "Great"
    for "Great this week". On the wheel it is every food, not only the
    kind shown.
  - **Play.** ▶ beside the switches moves the line a step every 0.4s
    round the whole year and back to where it began; ■ (the same button,
    pressed), a touch anywhere on the chart or its controls, or a move of
    the handle stops it. The line glides between steps (0.35s), and
    jumps with reduced motion, and never glides while it is dragged.
  - **Magnifier** (the calendar only). A focus and context distortion
    centred on the line: each slice of the year is drawn as wide as
    1 + 5 × exp(−(d / 2.6)²), d its distance in weeks from the line, and
    the whole scaled back to 52 weeks, the weeks squeezed sideways. It
    follows the line as it is dragged or played. Month names and week
    numbers with no room are hidden. Switched by the Whole year ·
    Magnify switch, off by default. The wheel has none.
  - **TODAY and the seasons.** TODAY · WINTER · SPRING · SUMMER ·
    AUTUMN above the chart, each a 28px icon over its word in caps,
    `aria-pressed`; on a phone they share its width equally (five fit
    in 358px with their icons). TODAY puts the line on today itself
    and the magnifier off. A season moves the line to mid-January,
    mid-April, mid-July or mid-October, and on the calendar turns the
    magnifier on. Neither ever turns the wheel, which always keeps its
    normal orientation. A season pressed again while still pressed lets
    go on the calendar (magnifier off, the line where it is) and does
    nothing on the wheel. The pink
    underline under a word: TODAY's whenever the line is on today; a
    season's from its press until the line moves; none after a drag.
  - **The ALL wheel.** The wheel page's kind switch starts with All,
    every food on one wheel (`arrivals-dial.html` with `kind="all"`).
    On it only the foods in season (YES or JUST) at the line's time
    keep their names, changing as the line moves; every dot stays,
    named for a screen reader and tappable. The kind wheels keep all
    their names. The page opens on All. Seven kinds fit a 390px phone
    because pill segments are tighter below 28rem.
  - **Arcs or dots.** The wheel's Arcs · Dots switch, at every size,
    defaults to arcs; dots hides the season arcs.
  - **Touch.** Only the handles take `touch-action: none`. Nothing else
    blocks scrolling or pinch zoom (the viewport allows it), and no
    wheel or scroll gesture zooms the chart.
- **Season icons.** `_includes/icons/season-{winter,spring,summer,autumn}.svg`,
  split by `tmp/` scripts from Helen's one-path Inkscape file (a 2×2
  grid: flower, sun, leaf, snowflake), each in a 24-unit box, `fill="none"`,
  `stroke="currentColor"`, round caps and joins, `stroke-width="2"` with
  `vector-effect: non-scaling-stroke`, so 2px at any size, near the
  magnifier's 2.25 units. The snowflake is drawn as an outline of its
  arms, so at 28px its two lines close up and it reads bolder than the
  others. TODAY's pin (`season-today.svg`) is redrawn by hand, a
  teardrop and a ring, to the proportions of "You Are Here": Helen's
  file is a 416 KB trace, too heavy to inline on every chart page.
  Credits on About, as the licence asks: sun and leaf, "seasons" by
  Made by Made from Noun Project; flower and snowflake, "seasons" by
  VectorsLab from Noun Project; the pin, "You Are Here" by BBBL from
  Noun Project; all CC BY 3.0.
- Atkinson Hyperlegible Next's zero is slashed, and the font has no
  feature to open it.
- The arrivals wheels are drawn in an 880-unit viewBox with room for
  the longest label at any angle; `site.js` tightens each visible
  wheel's viewBox to its drawn extent, so the wheel fills its width.
  The extent counts every food's name, even one the ALL wheel has
  hidden for now, and on the wheel page room for the time line's knob
  and its longest time (EARLY SEPTEMBER) at any angle, so no label or
  handle is ever clipped (checked for every kind and every step at
  390, 820 and 1280).
- The season-length axis stays at 12 o'clock, between December and
  January, its ring labels and title haloed in the page colour
  (`paint-order: stroke`) so they read over any dot or arc.

## Drawing rules

- No trigonometry in the templates. Arcs are dashed circles with
  `pathLength` in weeks or days; rotation is a `transform`. Keep it that
  way. The magnifier keeps it too: an arc is redrawn by moving its dash
  to F of its start and end. Only `assets/charts.js` uses sine and
  cosine, to place the wheel's knob and read a drag's angle.
- A chart row's colour is `--c`; "just about" fades mix `--c` into
  `--off` in oklab. Variety colours override food colours row by row,
  and the checker refuses two rows with the same colour.
- Week 1 starts on 1 January, each week is 7 days, week 52 takes the
  remainder. Month starts are the fixed list `1,5,9,14,18,23,27,31,36,40,44,49`
  in every template and in `make-foods.py`; they must agree.

## Working

- Build: `sh tools/build.sh` (bake, Jekyll, then the share cards). To
  bake for another day: `node tools/bake.js --date 2026-10-29`, then
  `bundle exec jekyll build` and `node tools/cards.js`. Serve: `bundle
  exec jekyll serve --host 0.0.0.0 --port 9000` (`keep_files` keeps the
  cards through a regeneration). Data check: `python3 -I
  tools/check-foods.py`.
- Deploys: `.github/workflows/pages.yml` on push and daily at 03:30
  UTC; `stale-check.yml` at 07:00 UTC reads the live `/built.json` and
  opens one "Stale build" issue when the baked date is over two days
  old (`tools/stale-check.sh`). Both are schedules, which GitHub pauses
  after 60 days without a commit; the as-of date on every page is the
  last line of defence.
- Visual checks: `node tools/dev/shoot.js <base-url> <label> [--scheme
  dark] [--click <text>] [--type <text>] <page>...`; `--type` types
  into the first visible input, the hook's.
- Design review: `node tools/dev/shots.js [--base <url>] [--date
  YYYY-MM-DD] [--out <dir>] [--full yes]` writes full-page shots into
  `screenshots/` (gitignored, and excluded from the build), named
  `<page>-<state>-<width>-<theme>.png`: the kitchen sink; home empty
  and searching "avoc", "basil", "apples", "app", "banana" and "zzz"; a food
  page per verdict (YES, NO, JUST, NEARLY, NEVER, picked for the date
  from `foods.json` with `verdict.js`), rhubarb, a food with a buy note
  and one whose source is general; Now this week and next; the
  calendar and the wheel, each at today, at `?when=mid-december` and
  with SUMMER pressed (the wheel on All, as it opens), and the Veg
  wheel at mid-December; About and a
  404. At 390, 820 and 1280, the clock
  frozen at noon on the date (default 2026-10-25), with reduced motion
  so nothing is caught mid-animation. By default it takes Helen's
  review list: everything dark, the shots she starred light too (the
  kitchen sink, home empty, the basil card and NEVER, the verdict and
  rhubarb food pages, Now, the calendar and the wheel states), and the
  kitchen sink at 1280 only. `--full yes` takes all 162, every shot in
  both themes, as a review round should be checked. Not `npm run`:
  the project has no npm.
- `/kitchen-sink/` (`kitchen-sink/index.html`, `noindex`, linked from
  nowhere, its slug reserved in `check-foods.py`) shows every shared
  component from its real include or classes, at rest, hovered and
  focused. The forced states are the stylesheet's own: a script on the
  page copies every `:hover` and `:focus-visible` rule onto the
  `.is-hover` and `.is-focus` columns, so nothing there is styled
  twice. The search input's states are home itself in frames, by
  `?q=`. A new shared component goes on this page too.
- Helen's instructions win over this file. Hooks reject chained,
  nested or variable-expanding shell commands: one plain command per
  call, or a script in `tmp/`. A command that must reach outside the
  working directory becomes a script in `scripts/` with a fixed
  action and validated arguments, so it can be allowed on sight.
- Commit messages start with a prefix in parentheses: `(feature)`,
  `(fix)`, `(styling)`, `(design)`, `(data)`, `(docs)`, `(refactor)`,
  `(test)`, `(chore)`. Design is not styling.
- From a worktree, `sh scripts/git-diff-main-checkout.sh` shows the
  uncommitted changes in the main checkout.
- Issues and labels go through `scripts/gh-write.sh`, never a burst.

## Not yet done

Each an open issue:

- #41 Per-food reminder `.ics` at `/remind/<slug>.ics`, and the "Remind
  me when it's back" line on NO, NEARLY and JUST pages that links to it.
- #42 Calendar: a mobile plan. Rows already link, `#<slug>` marks and
  scrolls to a food, and the month header sticks.
- #43 `foods/<slug>.json`, and the JSON shape on the sources page.
- #44 Wheel: the Veg view is still unreadable in June, and unreadable
  on a phone. Cut it or fix it.
- #45 Data quality: every `source: general` row (the checker warns on
  each), the pollock/pollack spelling, stored crops, long `avail` tails,
  the BBC/NCGM disagreements in the `note` fields.
- #46 Easter eggs.

## Ways this goes wrong

- Reaching for a plugin, a gem, npm or a raster image. Every one has
  been refused so far and will be again.
- Adding tooltips, hover-to-discover or drag interactions. No.
- Editing `_data/foods.yml` by hand and then running `make-foods.py`.
- Writing verdict logic anywhere but `assets/verdict.js`. The Liquid
  templates only read `_data/baked.json`.
- Building with `bundle exec jekyll build` alone and wondering why the
  verdicts are empty: bake first.
- Using Liquid's `capitalize` on a phrase with a month in it; it
  lowercases the rest.
- Writing a calendar date into a season phrase. The as-of date is the
  only one allowed.
- Reading a Liquid hash with a nested lookup, `baked.now[parts[0]]`:
  assign the key first.
- Letting a "just about" range touch two in-season ranges without
  checking which way the fade should run; the templates decide by
  adjacency, including across the year end.
- Liquid `assign` inside an include outlives the include. Clear what
  you set when a page includes the same template twice.
- YAML reads `yes`, `no`, `on` and `off` as booleans. Quote them.
- Pushing to `main`, merging, or opening more than one PR in a
  sitting.
