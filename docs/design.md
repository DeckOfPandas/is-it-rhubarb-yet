# Design

The design system as built: tokens, type, colour, links, components,
the pages and the charts. The quickstart is
`model_instructions/manual.md`; the data model is `docs/data.md`; why
things are this way is `docs/decisions.md`. `assets/site.css` is the
source for every value here, and `/kitchen-sink/` shows every shared
component at rest, hovered and focused.

## Colour

- **Rhubarb and custard.** Backgrounds are the custard `#fbf3d9` (light)
  and the forcing shed `#16110e` (dark); text is ink, `#1c1714` or
  `#f3ede4`; muted ink is `#5e544b` or `#b9ae9f`. The one brand colour is
  `--rhubarb`, `#ff2d78`, the same in both themes; it is also rhubarb's
  food colour and no other food comes near it. The pink never carries
  body-size text: links are ink with a pink underline.
- **Themes.** Dark follows the system unless the footer's switch has set
  `data-theme` on `<html>`, which is remembered in `localStorage` and
  applied before first paint. The dark values appear twice in the
  stylesheet (a media query and a selector); keep them the same.
- **Derived tints** are `color-mix` in oklab from ink and the page
  colour: `--rule` (16%), `--off` (11%, the off-season grey on charts),
  `--band` (4%), `--panel` (one step lighter than the page, towards white
  on custard and towards ink on the shed) and `--panel-hover`.
- **Food colours.** Each food's colour arrives as `--food` on its row,
  chip or page (`--c` on a chart row), and every colour in the data
  passes 3.15:1 on both backgrounds, so a verdict word is simply set in
  it. A food's name set in its colour at text size (`.food-link`: the
  teasers, the wheel's "ALL YEAR:"; the chip's question) takes
  `--food-custard` in light and `--food-shed` in dark, the same hue at
  4.5:1, or the colour itself where there is none. Rows keep their names
  in ink. The rules and the checker are in `docs/data.md`.
- **Never-foods** share `--never`, ghost grey `#857f78`: their swatches,
  their pages and share cards, and the hero's completion, word and
  underline on a lone never-food match; their row's NEVER tag is the
  muted ink, as every never row's is. They never fall back to the pink.
  The colour is a token in `site.css` and a constant in `tools/cards.js`.
- **"Today" is drawn in ink**: the food page dial's hand, and on the
  calendar and the wheel a short ink tick that never moves (hidden on
  the calendar while the pink time line is on today itself).

## Type

- **Three fonts, chosen by asking in order:** a quotation is Newsreader
  italic; a verdict or the name of a page or section is Anton in
  capitals; everything else is Atkinson Hyperlegible Next. Anton never
  sets a sentence, a link or a control; Atkinson uses 400 and 700 only,
  and capitals only in the caps style; an Anton label heads a section and
  an Atkinson caps label a group inside it, never the reverse. The rules
  head the fonts section of `site.css`.
- **The files** under `assets/fonts/` are Google's Latin subsets, 113 KB
  in all against a budget of 150 KB, self-hosted, `font-display: swap`,
  Anton and Atkinson preloaded on every page and Newsreader (62 KB) on
  the food and never-food pages, the only ones with a quotation. Atkinson's is the variable font (200 to
  800), so 400 and 700 are one file; its l has a curled foot at every
  weight, which is why buttons and inputs take the page's font (`font:
  inherit`): browsers otherwise set them in Arial, whose l is straight.
  The subsets have no arrows, so every arrow is the SVG mark (see
  Links). Atkinson's zero is slashed and the font has no feature to open
  it.
- **Anton's tracking** has two settings by size: `--track-large` (0) at
  40px and above, `--track-small` (0.03em) below.
- **The type scale.** Every font size is a token at the top of
  `site.css`, and nothing else.
  - Atkinson: `caps` 12px, 700, capitals, +0.07em (`--fs-caps`,
    `--track-caps`: the nav, the footer, group labels, chart month names,
    a dial's months and TODAY, every switch, a ring's name); `small` 14px
    (the calendar's names on a phone, notes, a quotation's attribution, a
    ring's source, the counter note, the Enter keycap on a search row);
    `body` 17px (text; the no-match line on home); `lead` 23px (the date
    line, bold, on a food page; the quotation, in Newsreader).
  - Anton: `label` 20px (every section label, in full ink: ON THE WAY,
    GREAT THIS WEEK, EVERYTHING, N MATCHES, TELL ME EVERYTHING ABOUT; the
    chip's question, muted); `title`, one clamp (page titles, each in a
    `.page-head` with 40px under it; a food page's question; LITERALLY
    NO IDEA. on home; the heading of the list under a chart); `display`
    (the hero, and the verdict until `site.js` fits it).
  - The sizes that do not fit the scale, kept on purpose: the wordmark,
    sized as a logo; the stacked hero below 600px, larger than display to
    fill the phone; a row's verdict tag, Anton at the small size; the
    week arrows on Now, glyphs sized as controls; the arrivals wheels'
    labels (9 and 10 units) in a viewBox scaled to the screen, so their
    pixel size varies. Chart text elsewhere is set in units equal to
    pixels: the calendar is never scaled.
- **Dates** are ordinals with the letters raised as `<sup>`
  (22<sup>nd</sup> October 2026), a shifted `tspan` in SVG, and left
  unraised where only text goes (meta tags, a slider's spoken value). In
  the caps style the letters stay lower-case.

## Spacing and width

- **The spacing scale.** Every margin and gap is `--sp-1` to `--sp-5`:
  8, 16, 24, 40, 64px. 40px parts the major blocks of every page (hero,
  teasers, results, the Everything list; a food page's blocks; Now's
  bands); a label sits 8px above what it labels. Gaps are measured from
  what is seen to what is seen: an invisible tap area never counts, and a
  control is drawn no bigger than what it shows. Padding inside small
  controls and optical nudges in em are not spacing.
- **One page width.** The header's row, main's content and the footer
  (its rule too) share `--page`, 64rem less the two 16px gutters, so
  every left and right edge lines up at every width.
- **Breakpoints**, as the stylesheet uses them: 28rem (448px, the header
  wraps), 37.49rem (600px, the hero stacks, the licences stack), 42rem
  (Anton's large tracking on titles), 43.74rem (700px, the calendar runs
  to the edges, the chip docks, the controls stop sticking), 51.25rem
  (820px, the wheel is the content's width and its pills sit at the
  right).

## Links

Four kinds, in `site.css` under "Links come in four kinds":

- **Prose:** ink, a 1px pink underline at all times, 3px on hover or
  focus. A prose link to a food's page (`.food-ref`, with that food's
  `--food`) is underlined in the food's colour: on About, "Well, is
  it???" and the dinner food.
- **Actions** (`.arrow-link`): ink words and an arrow; the words (never
  the arrow) underlined in pink at all times, 1px, 2px on hover or focus:
  "Tell me everything about … →", "Everything in season this week →",
  "and N more →", "Ask about something else →", "Back to this week →".
  The arrow is Helen's mark from her Helen Triages sites,
  `_includes/icons/arrow-right.svg` (a 20 by 12 shaft and head, round
  caps, stroke 2, `currentColor`), sized 1.05em by 0.63em on the
  x-height; `site.js` draws the same path (`arrowMark`) and turns it down
  or up on the floating pills. An arrow never starts a line: a link's
  words and arrow are `_includes/arrow-words.html` (`setArrowText` in
  `site.js`), which puts the last word and the arrow in one nowrap span.
  "and N more" after a list of foods never breaks across lines at all.
- **Foods in lists:** inline lists (`.food-link`) set the name in the
  food's text colour; rows (`.food-row`) keep the name in ink beside the
  swatch. Both underline on hover or focus in the food's colour, never
  the variety or timing, never changing weight or size. SVG text draws
  its underline in its own fill, so a hovered calendar row turns the
  name's tspan pink and an inner tspan keeps the words in ink.
- **Chrome:** the nav and the footer, below.

Focus is a 2px pink outline, offset 2px, on `:focus-visible`.

## Tap targets

Every control is at least 44×44px to tap, the glyphs unchanged. Where
the mark is smaller, the target is an invisible `::before` round it,
which no gap counts: the nav items, the magnifier, ??, play (a 32px
circle), each segment of every switch (26px tall inside a 32px pill),
the calendar's handle. The wheel's knob, an SVG element, has an
invisible disc under it that `charts.js` keeps at 44px across whatever
the wheel's scale. The week arrows are 44px boxes; a ring-list row is
44px tall.

## Components

### Logo and header

- **Logo.** IS IT RHUBARB YET? in Anton, RHUBARB pink and underlined in
  pink, the line exactly the word's width, in the header, the hero and
  the cards. It does not change on hover.
- **Header.** NOW, CALENDAR, WHEEL and ?? (About, `aria-label="About"`)
  at the top right of every page, in caps, muted, no underline; the
  current page in ink and underlined in pink, as the others are on hover
  or focus; on home alone a magnifier after them, since home has no
  wordmark to type into and the hero may be far up the page. Each item
  is drawn only as big as what it shows, 24px from the next, the last
  one's right edge on the page's; its tap area reaches 44px, the
  magnifier's into the gutter so it never meets ??'s. The wordmark is on
  the left of the same row, or on a phone on a row of its own under the
  nav, so the nav never moves. Home has no wordmark. The header sticks
  to the top of every page on a solid page-colour background over a 1px
  rule; `site.js` measures its height into `--header-h` (CSS guesses
  45px, 90px on a phone with the wordmark, until then); the row may
  wrap, so a large default font stacks the nav under the wordmark
  instead of overprinting it. What sticks below it sits at
  `--header-h`, and every element with an id has `scroll-margin-top:
  var(--header-h)`, so a jump stops below the header. The magnifier
  links to `/#search`; with JavaScript it focuses the hero.
- **Header search.** On every page but home the wordmark is the search:
  `#head-input`, named "Search foods", has RHUBARB as its placeholder,
  and a click on RHUBARB puts the caret there. IS IT and YET? are links
  home (one tab stop, named Home; YET? is hidden from screen readers and
  the tab order). It is the hero's own field (`hookField` in `site.js`):
  capitals, the faded completion, the word and underline in the food's
  colour on one tier 1–2 match, a long word shrinking to fit. It matches
  against `search.json` and never answers in place: it goes to `/?q=…`
  on Enter (a phone's Go), which with nothing typed goes to home as it
  is, and never on a timer, so a slow typist is not carried off
  mid-word. Typing only colours the word and offers a completion. One
  Escape puts RHUBARB back and leaves the field. Leaving for home, its slot takes the hero's view-transition
  name (`search-word`), so the word flies into the hero (not with reduced
  motion), and on a wide screen home keeps the focus in the hero with the
  caret at the end (`sessionStorage` carries that); a phone is left
  without focus, so the keyboard does not cover the answer. Without
  JavaScript it is a form that lands on home's Everything list
  (`/?q=…#all-foods`), which cannot filter: the no-JS visitor gets the
  full list to read, and the word is kept in the address for a visitor
  who turns JavaScript on.

### Switches

Every toggle on the site is one build, `.switch`: a radio group drawn as
a 32px pill, the chosen segment marked in ink by a 26px pill (a 26px disc
for an icon alone, `label.seg-icon`), words in the caps style, icons
15px at a 1.6 stroke. Each segment is at least 44px wide and its tap
area runs 9px above and below it to 44px, 6px past the pill, so a pill
needs 6px clear above and below; segments touch, so tap areas meet and
never overlap. The order and kind switches work by CSS alone: `:has()`
shows the chosen variant (`.ordered`). Only the theme is remembered; the
order and kind switches open on their default every visit (home by
family, calendar by start, wheel on All). The theme switch needs
JavaScript, so it only appears with it.

### Rows, groups and the chip: a food at three levels

A food is shown as a row, a chip or a page, and each is a smaller version
of the next, never a different design. No fourth way: any new view that
needs a food uses one of these as it is.

- **Row** (`_includes/food-row.html`, `foodRow` in `site.js`): one link:
  swatch, name, a named variety in muted brackets, an earlier timing on
  a line of its own ("first ones in two or three weeks"), and in a list
  that mixes verdicts the verdict tag, Anton at the small size in the
  food's colour, right-aligned on a dotted leader like a greengrocer's
  price list. A list whose heading already says the verdict passes
  `tag=false`. Every multi-column list reads down each column, then
  across (CSS `columns`), so A to Z reads down; a list in columns cannot
  be reordered in place, so home draws its list twice.
- **Group** (`_includes/food-group.html`, `foodGroup`): an Atkinson caps
  label, optionally with a count, over rows with no tag; a hairline above
  every group but the first. Home's families, Now's timings and kinds.
- **Band** (`_includes/band.html`, `band` in `site.js`): one band of the
  digest, its id its class (`arrived`, `last`, `onway`, `still`, `store`,
  `glass`): an Anton heading with the count (caps, muted), then groups in
  one of three shapes: `plain` (one A to Z list), `phrase` (a group per
  timing, soonest first) or `kind` (a group per kind with its count). An
  empty band shows its empty line, or with none is left out.
- **Chip** (`.tt-chip`, the wheel's): the food page's own question
  lifted onto a small panel, the one link to the page, and nothing a row
  does not say. A panel `--panel`, 12px radius, its left edge
  `--food-bar-width` (6px) in the food's colour and a shadow; inside, IS
  IT CHERRIES YET? in Anton at `label`, muted, the food's name in the
  food's text colour for the theme (as a row's tag is), underlined in the
  food's colour on hover or focus. The question is asked for the whole
  food in the present tense whatever time the wheel has travelled to:
  the wheel shows the time, the chip is the door. No close button: Escape
  or a click outside closes it. It is a `dialog` named for its food.
  Home's search has no chip: a list of rows, even of one, already
  answers, and Enter opens it.
- **Page** (`/<slug>/`): everything, below.

The Enter keycap, the return mark in a small muted keycap
(`_includes/key-hint.html`, `icons/enter.svg`), sits on the search row
Enter would open, after its tag, hidden from screen readers and from
touch screens. The kitchen sink shows it at rest.

### The verdict word

The verdict word, at any size, is Anton in the food's colour. On a food
page it fills the line from the first paint: the line is a container
and the stylesheet sizes the word from the line's width over the word's
width in em (`_data/word_em.yml`, measured by `tools/dev/word-em.js`,
set as `--word-em` by the layout and by `site.js` when the day's verdict
differs), so nothing under it moves when the fonts arrive. `site.js`
then makes it smaller, if it must, until the date line under it is
wholly on the first screen, 16px clear, never below 64px for that;
fitting the width always wins, so LITERALLY NO IDEA. fits a 390px phone.
A browser without container units keeps the display clamp until
`site.js` fits the word. The question over it is set at `title`, the
full width, muted, its lines balanced.

### Quotation and notes

A quotation is Newsreader italic at `lead`, behind a 3px bar in the
food's full colour, its attribution `small` and muted after an em dash.
The counter note (`.buy`) is `small` in full ink behind the same bar.

### Footer

Every word is caps, muted: SOURCES · CALENDAR FEED (to the feed's
section on Source data) · JSON; ABOUT; the theme switch; the GitHub mark (2.2rem, muted ink, pink
on hover or focus); the licences (CODE: MIT · DATA AND WRITING: CC BY 4.0
· © year) and the as-of date ("Verdicts correct as of …"), fainter; the
signature hearts, decoration and not a link (About is the footer's word
and the nav's "??"). Every text link is underlined in
pink at all times, 1px, 0.3em below the capitals; on hover or focus it is
ink with a 2px line. No line ever starts with a separator dot: a dot
follows its item. On a phone the licences stack with no dots. The theme
switch's sun, moon and screen are one weight: 15px at a 1.6 stroke. A
chart page's footer has 44px more room under the signature so the
floating pill never sits on it.

### Season icons

`_includes/icons/season-{winter,spring,summer,autumn}.svg`, split from
Helen's one-path Inkscape file, each in a 24-unit box, `fill="none"`,
`stroke="currentColor"`, round caps and joins, `stroke-width="2"` with
`vector-effect: non-scaling-stroke`, so 2px at any size, near the
magnifier's 2.25 units. The snowflake is drawn as an outline of its
arms, so at 28px it reads bolder than the others. TODAY's pin
(`season-today.svg`) is redrawn by hand, a teardrop and a ring, to the
proportions of "You Are Here". Credits on Source data, as the licence
asks.

## Pages

### Home

- **The hero is the logo, and the logo is the input.** At rest it reads
  IS IT RHUBARB YET?, the placeholder RHUBARB in pink capitals over its
  underline with a blinking caret in muted ink just after it (steady with
  reduced motion); on focus the placeholder dims. The input's own caret is
  transparent while it is empty, so the only caret is the drawn one: after
  RHUBARB at rest, and at the start of the field once it has focus. The
  input's width is set in em, the word plus 0.05em, so RHUBARB is never
  clipped, in print too (the drawn caret is not printed). Typed text is
  capitals in ink; when the single best match is found exactly or at its
  start with nothing else at its tier, the word and its underline take
  that food's colour (ghost grey for a never-food); otherwise they stay
  ink over the pink. `site.js` draws the underline at the word's width
  and sets a word too long for its room smaller until it fits. One line
  on a wide screen, three below 600px. The input is not focused on load;
  the first letter typed anywhere on home goes into it. On a phone,
  focusing it scrolls its line near the top of the screen, 16px clear,
  so the keyboard does not hide the results. The first click or tap into
  a hero that holds a word selects all of it, as an address bar does; a
  click while it has focus places the caret.
- **Completion.** When the single best match has a name or alias that
  begins with what is typed, the rest of it shows after the typed text,
  faded to 35% in the food's colour (ghost grey for a never-food): AVOC +
  ADOS, ZUCC + HINI. None for text that is already a whole name, with no
  match, or while an input method is composing. It is an `aria-hidden`
  layer over the input in the same type, the typed part transparent, so
  the real caret stays after the typed text. The hero is sized for typed
  text and completion together, so accepting does not make the word
  jump. Tab, End, or → at the end of the text accept it, as does a tap on
  the faded part. Tab with no completion moves focus as usual. Escape
  dismisses a completion, and a second Escape clears the input. The input
  has `aria-autocomplete="both"`; the completion is not announced.
- **Search ranking** (`assets/search.js`: `search`, `leadOf`,
  `nearest`; the same module answers the header and the not-found
  page). Candidates are each food's and never-food's name, aliases and
  shared `also` words, and each named variety by its own name and how
  it is said ("cox", "forced rhubarb"), which joins once `foods.json` is
  in. Both sides are folded (case, accents, punctuation; "&" is "and")
  and singular equals plural. A candidate's best tier: 1, exact; 2, the
  string starts with the query; 3, a later word starts with it. Text
  found only inside a word is no match anywhere: "ape" and "lla" get
  LITERALLY NO IDEA. The last typed word may be unfinished, so "corn"
  finds the Cornish sole after sweetcorn. A food is one hit at its best
  tier: found by a variety alone it shows as that variety ("cox" gives
  "Apples (Cox)"), and found as well or better itself it shows as the
  food. Each letter typed only ever takes hits away. The lead, which
  colours the hero and completes the word, is the first hit when it is
  tier 1 or 2 and nothing else shares its tier.
  - **Every answer is a list of rows**, the ordinary row (swatch, name, a
    named variety, leader, verdict tag; no arrow, no date line: the page
    says when), in one column in rank order, by tier then A to Z, with
    the heading in the first teaser's spot: TELL ME EVERYTHING ABOUT for
    one match, N MATCHES for more. The tier 2–3 matches are rows in the
    same list. A never-food is a row with the NEVER tag in the muted
    ink, and opens its page, which carries its line and quotation. ZUCCHINI
    is answered with the Courgettes row: the row says the name, so the
    hero need not.
  - **No match:** bare text under the hero, which asks the question:
    LITERALLY NO IDEA. in Anton at `title`, in ink, then "If that's an
    actual thing, please tell us." (a link to the issues) at `body`, then
    up to five foods sharing its first three letters as rows under DID
    YOU MEAN. No panel.
  - **The Enter keycap** sits on the row Enter would open: the lit row,
    or the first before any arrow key, so a list of one shows it at
    once; under DID YOU MEAN only once a suggestion is lit, so a typo and
    Enter open nothing. That row's page is prerendered by one
    `speculationrules` script, replaced only when the row changes; a
    browser without speculation rules ignores it.
  - Up and Down move a highlight in rank order through the rows; Enter
    opens the lit one, or the first; a click or tap opens a row. The hero
    is a combobox over the results (`aria-controls`, `aria-expanded`),
    the rows' links are its options, each with an id, and the lit one is
    named in `aria-activedescendant`. A polite live region says the
    count (and for one match which food), then the lit row's words as
    the highlight moves. Clearing the input brings everything back.
    Under any answer, "Ask about something else →" empties the hero and
    puts the caret in it.
  - While the input has text, the teasers and the whole Everything
    section are hidden and the results stand in the teasers' place, at
    once, with no debounce. The typed text is kept in the address as
    `?q=`, so Back or a reload returns to the same answer.
- **Into the food page.** Pages cross-fade with cross-document view
  transitions (`@view-transition { navigation: auto; }`, only without
  reduced motion; a browser without them simply navigates). Following a
  search row, `site.js` names the row's food name `food-name` and its tag
  `food-verdict`, and the food page names its question's food name and
  its verdict the same, so the name flies into the question and the tag
  grows into the giant verdict; rows have no dial, so nothing is named
  `food-dial` from home. The wheel's chip names its food name
  `food-name` as it is followed. The names are set only as the row or
  chip is followed and cleared once home is shown again.
- **Teasers.** JUST ARRIVED (or ON THE WAY when nothing has), GREAT THIS
  WEEK and STILL GREAT BUT ON THE WAY OUT, each an Anton label over three
  foods in their colours, picked afresh at random on every visit by
  `site.js` from the block's `data-all` (the build's own pick stands
  without JavaScript), and "and N more →" to its band on Now (`/now/#arrived`,
  `#onway`, `#still`, `#last`), then "Everything in season this week →".
- **Everything.** Every food by family (the default) or A to Z, with
  tags, under a switch. The A to Z list also carries the never-foods,
  hidden, and every row's search terms, names and line, which the
  results are copied from.

### Food page

One shape for every food, one column at every width, in this order:

1. the question, the verdict and the date line, for the whole food;
2. the quotation;
3. the breakdown: the dial (on the same left edge as the words), the
   season line under it ("In season July to October.", the whole food's
   fresh weeks in months, baked as `season`; not for a food that cannot
   be sold) and, for a food of two rings or more, its ring list;
4. the counter note;
5. Also this week: three foods of the same family that are YES or JUST,
   a fresh pick on every visit, A to Z, each with its verdict tag, and
   "and N more →" (the rest of the family) to Now; no section when the
   family has nothing else in;
6. one hairline, the only rule on the page;
7. the sources disclosure, "Great! Show me the sources." ("Fine, show me
   the sources." for NO), in the instructive style, holding the numbered
   sources, linked, and the notes on the data: the food's, then each
   ring's under its name;
8. the calendar line, "Add rhubarb to your calendar: Apple · Google ·
   .ics" (Apple is the `webcal://` link; Google is Google Calendar's own
   subscribe link; then the file), each dot glued to its link by a
   no-break space; not for a food that cannot be sold;
9. "Ask about something else →".

Every block is 40px from the next. Food pages have no as-of line; the
footer's says it. Text keeps a measure of about 65ch. A date line wraps
with `text-wrap: pretty`.

- **The dial** (`_includes/season-wheel.html`): the year as a ring,
  January at twelve o'clock, one ring per variety, the centre cut out.
  Rings run from the longest season outside to the shortest inside
  (`ringOrder`, baked as `rings`), ties in data order; each ring's
  `data-ring` is its place in the data. An in-season run is one dash in
  the ring's colour; a just-about run is drawn a day at a time, rising
  into a season that follows, falling out of one that precedes, flat
  when it touches neither or both; a storage run is one dash, the colour
  30% into the grey; a ring with `shades` sweeps them across its
  in-season run. The hand is hidden until JavaScript points it at today,
  then sweeps round from January; the date sits in the hole. The dial has
  no legend of its own.
- **The ring list** (`.ring-list`) is the dial's legend, led by "From
  the outside in:" (small, muted), outer ring first: a swatch in the
  ring's colour, its name in the caps style in its text colour and its
  own phrase without a full stop (baked as `ringLines`), joined by a
  dot: NORTH EAST · Until late January, OUTDOOR · A few days left. Every
  ring of a food with two or more is named in the data (a food's one
  ring is unnamed and shows the food's name), so no template invents a
  name. It names no source: the sources are behind "Show me the
  sources". Each row is a button. Hovering or
  focusing a row, or hovering a ring, lights the ring and its row and
  fades the rest to a quarter (`lightRings`); a tap pins the light
  (`aria-pressed`) until it is tapped again.
- A never-food's page (`_layouts/never.html`) is the question, NEVER, its
  line, a quotation and two ways on, all in ghost grey, no dial.
- "When are apples in season?" is the food page's `<title>` and the start
  of its meta description (`_includes/when-in.html`, with the is/are
  rule); its link preview keeps "Is it apples yet? Just.".

### Now

The title follows the week shown ("this week", "next week", "last week",
or none), over one muted line, "‹ 15–21 October ›", the arrows 44px
boxes; away from this week, "Back to this week →" ends the line, so
nothing under it moves. Weeks run through real years, a year either way;
the address carries `week=` and, in another year, `year=`. The bands,
each the full width, 40px apart, each left out when empty unless it has
an empty line: Just arrived (A to Z), On the way out and On the way in
(grouped by one timing, soonest first), Great this week (by kind with
counts), Available from storage and Under glass (by kind). A count
beside a section's label is caps, muted, as beside a group's. On the way
out and On the way in group by the distance to the one boundary alone
("A few days left", "A week or two away"); the rest of a food's phrase
("then available from storage until late April", "first ones in a week
or two") is an aside under its name, so a band is one group per
distance, not one per sentence. The digest for another week reads its
phrases from the middle of that week, since it has no today.

### About

Titled "??" in Anton `title` (a screen reader hears "About"); Helen's
copy. It opens "Is it rhubarb yet? Well, is it???", the second sentence a
prose link to rhubarb's page; the food count links to the calendar; the
dinner food in "Coolio, I'm off to cook …" is picked at random on every
visit from what is YES on the UK's day, the build baking one for no
JavaScript. It ends on the dinner line; the credits are on Source data.

### Source data

Helen's copy: where each kind of food's dates come from; the JSON, the
whole file and the per-food files with their `asOf` block; the
calendar feeds, offered three ways; the full list of sources by kind;
the foraging footnote ("common knowledge*" is a prose link to it, and it
ends "Back to where I was" with the arrow turned up); then CREDITS, the
icons and the fonts, small and muted.

### Not found

`404.html`, served by GitHub Pages for any address it cannot find: "Is
it [what was asked] yet?", LITERALLY NO IDEA., "If that's an actual
thing, please tell us.", then up to five foods from `search.json` under
DID YOU MEAN, ranked as home ranks them, or sharing the first three
letters when nothing is, and two ways on. It names no
canonical. Home's one heading, "Is it in season yet?", is visually
hidden, since the hero is a form.

### Other pages

- `/sustainability-and-carbon/`: a placeholder, `noindex`, linked from
  nowhere until it has content.
- `/kitchen-sink/`: every shared component from its real include or
  classes, at rest, hovered and focused; `noindex`, linked from nowhere.
  The forced states are the stylesheet's own: a script on the page copies
  every `:hover` and `:focus-visible` rule onto the `.is-hover` and
  `.is-focus` columns. The search input's states are home itself in
  frames, by `?q=`. A new shared component goes on this page too.
- `/grey-squirrel/`, `/button-mushrooms/` and `/cobnuts/`: a renamed food's old
  address, a page that forwards at once (meta refresh), `noindex`, with
  the canonical pointing at the new page. It carries the viewport meta
  and the stylesheet, so the moment it shows is in the site's type at
  the phone's width.

### Print

A short `@media print` block in `site.css`: the sticky header and nav,
every switch, the time controls and rails, the GitHub mark, the signature,
the keycap hint and the ways on are not printed; nothing sticks; the page
is black on white; and the calendar, drawn at its own size on screen, is
scaled (`zoom: 0.72`) to fit a portrait sheet. The baked "today" line
stands on a printed or script-less calendar.

## Charts

### Drawing rules

- No trigonometry in the templates. Arcs are dashed circles with
  `pathLength` in weeks or days; rotation is a `transform`. The magnifier
  keeps it too: an arc is redrawn by moving its dash. Only
  `assets/charts.js` uses sine and cosine, to place the wheel's knob and
  read a drag's angle.
- A chart row's colour is `--c`; in-season bars take it as is; "just
  about" bars fade between `--off` and `--c` in oklab (rising into a
  season that follows, falling out of one that precedes, flat when it
  touches neither or both; year ends count as adjacent); storage bars are
  flat, the colour 30% into the grey. Variety colours override food
  colours row by row.
- Month starts are the fixed list `1,5,9,14,18,23,27,31,36,40,44,49` in
  every template; they must agree with the data tools.
- Each chart answers one question: the dial, where this food is in its
  year; the calendar, what is in season week by week across every food;
  the wheel, when each food's season begins and how long it lasts.

### The calendar

- Drawn at its own size and never scaled, so every word is the size it is
  set (food names 12px, rows 22px tall); where the page is narrower than
  the chart it scrolls sideways, the food names stuck to the left and the
  month header stuck to the top, and it opens scrolled so today is a
  third of the way across the weeks in view. The axis is month names
  only, no week numbers. `_includes/calendar.html` draws it as a sticky
  header block over a scrolling body, three SVGs sharing one set of
  coordinates (the months, the names, the weeks) and a blank corner over
  the names; the header hides its own overflow and `site.js` scrolls it
  in step, since a sticky block cannot sit inside a scrolling one.
- Three orders from one baked chart: by start (one row per ring not
  marked `lead: false`, sorted by its first in-season week), by family
  (grouped under a label, a food's rings together) and A to Z. The chart
  is baked by start; `charts.js` reorders its rows in place for the
  other two (`orderRows`, moving each row's name and weeks by a
  translate and adding the family labels), by the same keys as the
  include, once `foods.json` is in. The switch needs JavaScript and
  appears only with it. A row is two links to its food's page, its name
  and its weeks; only the name takes focus; its cells carry no tooltips.
  A food page links here with `#<slug>`, which marks the food's rows and
  scrolls to the first.
- On a phone (below 700px) it runs to the screen's edges, the names are
  `small` (14px), a row with a `short:` name shows it instead (lists and
  screen readers keep the full name), and `charts.js` fits the
  names column to the longest name shown, 16px from the screen's edge
  and 8px from the weeks, but never wider than two fifths of the screen:
  a name that will not fit loses its variety and then its last letters to
  an ellipsis (`cutName`). The weeks fill the chart's width: on a wide
  screen, and on a phone while magnified, a week is as wide as the room
  after the names column over 52 (`fitWeeks`); on a phone otherwise a
  week is 14px and the chart scrolls. A month name the scrolled weeks have
  pushed part way under the names, or past the right edge, is hidden,
  never cut; a month the magnifier has squeezed keeps its initial while
  it has room for a letter.
- At 1280×800 the sticky stack while scrolling (site header 45px,
  controls 136px, month row 53px) is 234px, 29% of the screen.

### The wheel

- `_includes/arrivals-dial.html`: a month ring with food labels radiating
  from it, one wheel for every food (All) and one per kind. Every food
  sits at the angle where its season begins and at a distance from the
  centre set by how long it lasts: the shortest seasons hug the month
  ring, the longest reach the rim. Faint guide rings at one, three, six
  and nine months carry their labels, and an axis runs out from the month
  ring to "season length" at 12 o'clock, between December and January,
  its labels drawn above the arcs with a thick halo in the page colour so
  no dot or arc shows through. A season begins at the first in-season
  week not joined to one before it (the year end counts as adjacent), so
  a season that wraps December into January begins in the autumn; its
  length is the longest ring's in-season weeks. From each dot a thin arc
  sweeps clockwise for the season's length. Foods are spread evenly
  across their month's arc, dealt into three angular passes by rank of
  length so neighbours differ in radius, and foods of one length are
  jittered a few units so their arcs can be told apart. Only rings not
  marked `lead: false` place a food; a food that cannot be sold is not
  drawn. Foods in season all year are listed under the wheel, "ALL
  YEAR:", as food links in their colours.
- **Labels keep clear of each other** (`spreadLabels` in `site.js`).
  Most seasons begin in summer, so the June to September sector would
  overprint. After the fonts are in, each label on show is compared with
  those placed before it and one that overlaps is pushed outward along
  its own ray until it is clear, with a thin leader back to its dot;
  the dot never moves, since its radius is the season's length. It runs
  again when the labels on show change (In season, the kind switch), on
  load and on resize, and not on a phone, where the names are too small
  to read and the list under the wheel does the reading.
- Drawn in an 880-unit viewBox with room for the longest label at any
  angle; `site.js` tightens each visible wheel's viewBox to its drawn
  extent (`fitDials`), so the wheel fills its width. The extent counts
  every food's name, even one In season has hidden, and on the wheel
  page room for the time line's knob and its longest time (EARLY
  SEPTEMBER) at any angle, so nothing is ever clipped (checked for every
  kind and every step at 390, 820 and 1280). A wheel as wide as the
  screen pads its viewBox to keep all of it 8px in from the edges. On a
  phone it is centred on the viewport and as wide as it, up to a diameter
  that fits the screen; from 820px it is the content's width, so its
  labels grow and the Veg wheel reads at laptop width. On a phone the
  wheel is a picture to tap, and the list under it does the reading.
- The page opens on All; seven kinds fit a 390px phone. The wheel never
  turns.

### The calendar and the wheel, played with

`assets/charts.js`, loaded only on pages with `charts: true`, on top of
charts that work without it; it borrows the hand and Now's bands from
`site.js` through `window.Site`, and every date through `verdict.js`.

- **Highlight.** Hovering or focusing a food (a calendar row, by its
  name or its weeks; a wheel dot, label or arc) lights it and fades the
  rest to a quarter; on the calendar a faint ink band (ink at 8%) lies
  behind its row; on the wheel its label comes to the front (unless it
  has focus, which moving it would take). Each is focusable with a name
  and its season, "Celery, July to October" ("Bay, all year"; two runs
  joined with "and").
- **Through to the page.** On the calendar a click, tap or Enter on a
  row is the row's own link to the food's page, which is what it does
  without JavaScript; `charts.js` does not intercept it. On the wheel a
  click, tap or Enter on a dot, label or arc pins the food (outlined in
  ink) and opens its chip (above, "Rows, groups and the chip"): the
  page's question as the one link to the page, asked for the whole food
  in the present tense whatever time the wheel is at. Escape or a click
  outside closes it; focus goes back to the food (after a click outside,
  only if focus was in the chip). Enter on a focused food opens the chip
  and moves focus to it, so Enter again follows it. Wide: right of the
  dot, or left when there is no room, flipped to stay on the screen.
  Below 700px: docked at the foot of the screen, and the page scrolls the
  food clear of it.
- **Time travel.** Today is a short ink tick on the calendar's month axis
  and across the wheel's month ring, and never moves; it stands in for
  the dashed today line and the hand, which `charts.js` hides. On the
  calendar it hides while the line is on today itself; on the wheel it
  is drawn under the month names, which wear a halo in the ring's colour.
  The line is pink with a 2px halo in the page colour so it shows across
  forced rhubarb: a vertical line on the calendar, a radius from the
  month ring to the rim on the wheel; the calendar's month names are
  drawn over it with a halo. Its handle (a pink pill in a rail just its
  height over the calendar's month names, sliding along to stay on the
  screen 8px in; a knob at the wheel's rim) is always shown, says the
  time in caps, MID-DECEMBER or TODAY, and is a slider: → and ← a step,
  Page Up and Page Down a month, Home back to today; dragging snaps to
  the nearest step. There are 36 steps, early, mid and late in each
  month, standing for the 5th, 15th and 25th. The line starts at today
  itself, which is off the steps unless it falls on one; the first move
  goes to the step either side. The address carries `?when=mid-december`
  (none at today) and is read on load. The calendar on show scrolls to
  keep the line in view.
- **The controls** are one component on both pages
  (`_includes/time-controls.html`): a flex column, rows 24px apart, no
  margins on its rows: (1) the order or kind switch, which works without
  JavaScript; (2) TODAY and the seasons; (3) play and the other switches,
  at the right of row 2 where it fits and wrapping on a phone. Rows 2 and
  3 are hidden until `charts.js` shows them. 40px from the page title to
  row 1 and from the last row to the chart, every gap measured between
  what is seen: the wheel's figure gives back (`--dial-inset`, from
  `site.js`) the room its viewBox keeps for the knob. From 700px the
  calendar's controls stick under the site's header while the chart is
  on screen, the chart's header under them (`charts.js` measures
  `--tt-controls-h`, and the chart's header as `--cal-head-h` for the
  rows' scroll margin); stuck, they keep 16px of page colour above and
  below, given back by a negative margin. Below 700px only the chart's
  header sticks.
- **TODAY and the seasons.** TODAY · WINTER · SPRING · SUMMER · AUTUMN
  above the chart, each a 28px icon over its word in caps, `aria-pressed`;
  on a phone they share its width equally. TODAY puts the line on today
  and the magnifier off. A season moves the line to mid-January,
  mid-April, mid-July or mid-October, and on the calendar turns the
  magnifier on. Neither ever turns the wheel. A season pressed again
  while still pressed lets go on the calendar (magnifier off, the line
  where it is) and does nothing on the wheel. The pink underline under a
  word: TODAY's whenever the line is on today; a season's from its press
  until the line moves; none after a drag.
- **Floating button.** While the chart is on screen and the list's
  heading is not, a pink pill at the foot of the screen, centred, dark
  caps, at least 44px tall: "81 IN SEASON IN LATE NOVEMBER ↓", or "38 IN
  SEASON THIS WEEK ↓" on today, the arrow the SVG mark turned down; N
  counts the foods shown (every food, or on a kind's wheel that kind's)
  whose verdict is YES or JUST at the line's time. On the wheel's page
  from 820px the pills sit at the bottom right on the content's edge;
  phones and the calendar keep them centred. Pressed, it scrolls to the
  list's heading (at once with reduced motion), gives it focus, and
  hides. Hidden under a docked chip. A wheel short enough that its
  list's heading is always on screen with it never shows it. Once the
  chart is wholly above the screen, the same pill says "BACK TO TOP ↑":
  it goes to the top and focuses the page's title.
- **The list under the chart** opens with Now's own header: the title
  ("In season this week", or "In season in mid-January", Anton `title`)
  over the stepper, "‹ 13–19 January ›", the days of the data week the
  line's step falls in; the arrows step the line early, mid, late, round
  the year, and the header is built once so they keep their focus. Then
  Now's bands for the line's time, built by the same code, under Now's
  own labels. On the All wheel and the calendar it is every food; on a
  kind's wheel it is that kind's, ending with "Everything in mid-December
  →" ("Everything this week →" on today), to the wheel page at the same
  `?when=`, which opens on All.
- **Play.** ▶ beside the switches moves the line a step every 0.4s round
  the whole year and back to where it began; ■ (the same button,
  pressed), a touch anywhere on the chart or its controls, or a move of
  the handle stops it. The line glides between steps (0.35s), jumps with
  reduced motion, and never glides while it is dragged.
- **Magnifier** (the calendar only). A focus and context distortion
  centred on the line: each slice of the year is drawn as wide as
  1 + 5 × exp(−(d / 2.6)²), d its distance in weeks from the line, and the
  whole scaled back to 52 weeks. The maths is `assets/magnifier.js`, a
  module with no DOM that `tests/site/magnifier.test.js` checks under
  Node (the year keeps its length, places keep their order, Finv undoes
  F); `charts.js` centres it on the line. On a phone, magnifying fits all 52 weeks
  to the screen's width round the line. It follows the line as it is
  dragged or played. Month names with no room are hidden. In the
  magnified stretch only (where a third of a month is drawn at twice its
  width or more), short unlabelled ticks mark early, mid and late.
  Switched by Whole year · Magnify, off by default. The wheel has none.
- **In season or whole year.** The wheel's In season · Whole year switch,
  Whole year by default: every name, every arc at full strength, wherever
  the line is. In season: only the foods in season (YES or JUST) at the
  line's time keep their names and have their arcs at full strength over
  the faint rest. Every dot stays, named for a screen reader and
  tappable. **Arcs or dots** defaults to arcs; dots hides the arcs.
- **Touch.** Only the handles take `touch-action: none`. Nothing else
  blocks scrolling or pinch zoom, and no wheel or scroll gesture zooms
  the chart.

## Share cards and icons

- `tools/cards.js` draws the cards into `_site/cards/` after Jekyll: a
  small HTML page with the fonts inlined, screenshotted in headless
  Chromium. Never committed: the site has no raster files in the
  repository.
- **The cards.** Per food and never-food, `<slug>.png`: the question,
  the verdict word, the line, and a foot of the as-of date and the
  wordmark. `home.png`: IS IT / RHUBARB / YET? stacked, then "Cook food
  when it's at its best.". `now.png`: "In season this week", the week's
  range, and three lines (great this week, still great but on the way
  out, then just arrived or on the way), a random three of each in their
  colours and "and N more". `calendar.png` and `wheel.jpg`: a title over
  a picture of the real chart, shot from the built site through a local
  server of the script's own at 1280 wide and three times over, with the
  header and controls hidden; the calendar shows 34 rows of its by-start
  order centred on the first row whose season starts this week or later;
  the wheel is the All wheel as a JPEG at quality 80, since as a PNG its
  arcs come to near a megabyte and chat apps are reported to drop
  previews over about 300 KB (quality 85 came within 4% of it). Every other page uses the home card;
  `_layouts/default.html` picks each page's card.
- **Size.** A card is laid out at 1200 by 630 and drawn at twice that,
  2400 by 1260, which `og:image:width` and `og:image:height` state.
- **The middle square.** WhatsApp and some mail apps cut the middle
  square out of a wide card, so everything to be read sits in a column
  4px inside that 630px square, and the sides stay empty. Each block
  starts at its largest and shrinks to its limit of lines or height
  (`data-fit`), then the verdict word or the picture takes the height
  left. The run fails if any card's words stray outside the square.
- **Previews.** Every page's `og:image` and `twitter:image` point at its
  card. The card carries the as-of date, because chat apps keep the
  first preview they fetch.
- **To look at a few:** `node tools/cards.js --out tmp/cards --icons
  tmp/icons --only rhubarb,home,now,icons`; the calendar and wheel cards
  need the built site, `--site _site`.
- **Icons.** `tools/icons.js` draws them in Anton, on the shed, with the
  R of RHUBARB pink and underlined, each on a canvas exactly its own
  size, one design at each: the R alone at 16px, IIRY at 32 and 48, IS
  IT / RHUBARB / YET? stacked at 96, 180 (Apple touch) and 192. A square
  icon's ink fills 84% of it; the 180 and 192 fit their diagonal to 96%
  of a circle, because launchers cut them to one. `cards.js` calls
  `drawIcons` into `_site/icons` at build. `default.html` links each
  with its `sizes` and links no SVG icon, which a browser would take over
  the PNGs at every size. `node tools/icons.js` also draws an 800px
  profile picture into `tmp/socials` for social accounts; the site does
  not use it.
- **Tests.** After a build, `node --test tests/cards/cards.test.js`
  checks that every page's share image is the size the page states, that
  `twitter:image` is `og:image`, and that every linked icon is the size
  its `sizes` states. `tests/build/endpoints.test.js` checks that
  `search.json` and `foods.json` parse and carry what the scripts read,
  and that every calendar feed is well formed (CRLF, 75-octet lines,
  complete events, unique UIDs). `tests/build/charts.test.js` loads
  home, a food page, the calendar and the wheel in Chromium at 390, 820
  and 1280 wide, served from `_site`, and fails on any console error;
  without Playwright it is skipped. `tests/build/shots.test.js` shoots
  eight pages at 390 and 1280 (home, About, Source data, the not-found
  page, the calendar and the wheel at mid-December, rhubarb and Now),
  the clock frozen on 25 October 2026, motion reduced and `Math.random`
  seeded, and compares each shot's dHash (nine by eight greys, 64 bits)
  with `tests/build/shot-hashes.json`; more than 6 bits apart fails. A
  change meant to move things rewrites the baseline with `node
  tools/dev/shot-hash.js --write`. `tests/site/search.test.js` and
  `tests/site/magnifier.test.js` need no build: they run the search
  ranking over the data and the magnifier's maths.

## Wording

- "Great this week" everywhere; never "Great now". "On the way out" and
  "On the way in" everywhere the `last` and `onway` lists are named;
  never "Last chance" or "Still great but"; the anchors stay `#last` and
  `#onway`. "Available from storage", never "from store". "Under glass",
  never "glasshouse-grown", though the ring in the data is still
  "Glasshouse". "Mid-" always hyphenated; "early" and "late" never.
- The phrases are deadpan, not matey: "A few days left", "Tailing off
  until late November", "in earnest", never "At its best", "Just about",
  "properly" or "any day now". The four distances are the same shape
  coming and going: "a few days", "a week or two", "two or three weeks",
  then the month.
- Every link to Now in prose or as an action reads "Everything in season
  this week →" (the nav's NOW and "and N more" excepted).
- Page titles: CALENDAR; THE SHAPE OF THE YEAR on the wheel page, whose
  nav item stays WHEEL. The sources disclosures are "Great! Show me the
  sources." and "Fine, show me the sources.", with full stops.
- Phrases used as labels in lists have no full stop; a date line that
  answers a question (a food page) does.
- No semicolons in anything a visitor reads: two sentences, or a comma
  and "and". A rating from a scale says the scale where nothing else
  orients the reader: "rated 3 at best (1 is the best, 5 is the worst)".

## Accessibility notes

- Nothing on the site needs JavaScript to be readable: the baked
  verdicts carry their as-of date in the footer. Without JavaScript the
  searches are forms that ask home, the order switches still work, the
  charts draw without the time travel, and the theme switch is absent.
- Reduced motion: no view transitions, no caret blink, no hand sweep, no
  gliding line, jumps instead of smooth scrolls.
- Every chart row, dot and label is a link with a spoken name and
  season; the handle is a slider with a spoken value; the wheel's chip is
  a dialog named for its food; the search results have a polite live
  region; the switches are radio groups with legends; the theme switch's
  inputs carry their spoken names.
