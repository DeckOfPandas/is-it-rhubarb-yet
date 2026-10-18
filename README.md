# Is It Rhubarb Yet?

A website that answers the question. Also the same question about
147 other things that grow, swim or run about in the UK, and 21 that
never will.

**https://deckofpandas.github.io/is-it-rhubarb-yet/**

## What

- **Is it … yet?** Type a food. Get one word, very large, in the food's
  own colour: YES, NO, JUST, NEARLY or NEVER. With a date, a quotation
  to help you take it, and a dial showing where you are in that food's
  year. Every food has a short address: `/rhubarb/`.
- **Now.** This week: what has just arrived, what is on its last legs,
  what is on the way, and what is still good, by kind.
- **Calendar.** Every food on one chart, week by week, in the order the
  seasons arrive. Or by family, or alphabetically, if for some reason you
  browse a supermarket for squid then immediately for strawberries.
- **The wheel.** One per kind of food. Each food appears clockwise where
  its season starts, with longer seasons sitting further out.
- A calendar feed of season starts you can subscribe to.
- The whole dataset as JSON, if you think you can do it better yourself.

## Why it's like this

**Weeks.** Weeks are the coarsest unit at which "rhubarb is just about
in" means something. Dates say "about" because the weather has not read
the data.

**One answer.** In the moment nobody wants a chart. They want a verdict,
readable in under a second, in a shop.

**No pictures!** A photograph of an aubergine conveys nothing you did
not already know about aubergines. Every mark is drawn in code.

**No dependencies!** Jekyll with no plugins, plain CSS, three fonts and
a small amount of JavaScript. Everything is hosted here, nothing fetched
from anywhere else.

**Hand-curated data, from named sources.** The seasons come from the
New Covent Garden Market calendar, cross-checked against BBC Good Food,
with the shooting seasons from BASC and the fish from a Cornish
wholesaler's chart. Every row says where it came from, and a row that
is still only common knowledge says that too.

## Data

`_data/foods.yml` is the truth: one entry per food, with a group, a
colour, a source and the weeks it is in season or just about.
`_data/groups.yml` names the groups, `_data/never.yml` the foods that
are never in season here, and `_data/quotes.yml` the quotations.

Everything is British. Corrections welcome. Ish.

## Development

The site is built with Jekyll and deployed to GitHub Pages using the
workflow in `.github/workflows/pages.yml`, on every push and every
morning. The verdicts in the HTML are baked for the day of the build by
`tools/bake.js`, from the same `assets/verdict.js` the browser runs, so
a build is two steps (and `stale-check.yml` complains if the live site
falls more than two days behind):

```
bundle install
sh tools/build.sh
bundle exec jekyll serve
```

To check the data after editing it, and to run the verdict tests:

```
python3 -I tools/check-foods.py
node --test tests/verdict/verdict.test.js
```

`tools/make-foods.py` is how the data file was first derived from the
New Covent Garden Market PDF and is kept for provenance. Running it again
overwrites `_data/foods.yml`.

The dev container, hooks and agent setup are from
[helen-contains-claude](https://github.com/DeckOfPandas/helen-contains-claude),
which explains them so this file does not have to.

## Licence

Code: [MIT](LICENSE). Data and writing:
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Fonts: Anton,
Atkinson Hyperlegible Next and Newsreader, under the SIL Open Font
Licence.
