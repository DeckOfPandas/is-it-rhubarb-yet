# Is It Rhubarb Yet?

A website that answers the question. Also the same question about
142 other things that grow, swim or run about in Britain.

**https://deckofpandas.github.io/is-it-rhubarb-yet/**

## What it does

- **Is it … yet?** Pick a food. You get one word, very large, and a
  quotation to go with it. YES comes with Herrick. NO comes with a fox.
- **Calendar.** Every food on one chart, week by week, in the order the
  seasons arrive. Or by family, or alphabetically, if you insist.
- **This week.** What is in season now, newest arrivals first, with what
  is going out and what is coming in.
- **The year.** One dial per kind of food. Each food sits where its
  season starts; the further out, the longer it lasts. There is no key,
  because a chart that needs a key has failed.
- A calendar feed of season starts and the whole dataset as JSON, for
  people who would rather be told.

## Why it is like this

**Weeks, not months.** Months are what calendars have. Seasons do not
start on the first of anything. Weeks are the coarsest unit at which
"rhubarb is just about in" still means something.

**One chart, not a list of lists.** A list tells you what is in season.
A chart tells you what is about to be, what is nearly over, and that
nothing much happens in February. The second is more useful and takes
less reading.

**Everything is drawn, nothing is photographed.** Every picture on the
site is SVG written by a template from the data. Change the data and
the pictures change. A photograph of an aubergine conveys nothing you
did not already know about aubergines.

**No dependencies.** The site is Jekyll with no plugins, plain CSS and
a small amount of JavaScript that does the only thing a server cannot:
know what day it is. Without JavaScript you still get every page,
every chart and every week. A build has nothing in it that can rot.

**Hand-curated data, from named sources.** The seasons come from the
New Covent Garden Market calendar, cross-checked against BBC Good Food,
with the shooting seasons from BASC, the fish from a Cornish
wholesaler's chart, and a good deal of general knowledge for the herbs
and foraged things, each marked as such.
Every row says where it came from. Where sources disagree, the note on
the food's page says so, rather than quietly picking one.

**No tooltips.** Information is on the page or it is not on the site.

## Data

`_data/foods.yml` is the truth. One entry per food, with a culinary
group, a colour, a source, optional varieties, and a list of week
ranges that are either fully in season or "just about". `_data/groups.yml`
names the groups. `_data/quotes.yml` holds the quotations, a pool for
each verdict, some pinned to particular foods. All out of copyright.

Everything is British. Corrections welcome, with a source.

## Development

The site is built with Jekyll and deployed to GitHub Pages by the
workflow in `.github/workflows/pages.yml`.

```
bundle install
bundle exec jekyll serve --host 0.0.0.0 --port 9000
```

Then http://localhost:9000/is-it-rhubarb-yet/.

To check the data after editing it:

```
python3 -I tools/check-foods.py
```

`tools/make-foods.py` is how the data file was first derived from the
New Covent Garden Market PDF and is kept for provenance. Running it again
overwrites `_data/foods.yml`.

The dev container, hooks and agent setup are from
[helen-contains-claude](https://github.com/DeckOfPandas/helen-contains-claude),
which explains them so this file does not have to.
