# Is It Rhubarb Yet?

A website that answers the question. Also the same question about
147 other things that grow, swim or run about in the UK.

**https://deckofpandas.github.io/is-it-rhubarb-yet/**

## What

- **Is it … yet?** Pick a food. Get the answer, in time context, emphatically. With a soothing
  quotation to aid understanding and acceptance. 
- **Calendar.** Every food on one chart, week by week, in the order the
  seasons arrive. Or by family, or alphabetically, if for some reason you browse a supermarket for squid then immediately for strawberries.
- **This week.** What is in season now, newest arrivals first, with what's going out and what's coming in.
- **The year.** One dial per kind of food. Each food appears clockwise where its
  season starts, with longer seasons sitting further out. There is no key,
  because an infographic that needs a key is a pretty selection of shapes and colours. Here's a reminder to ask Gemma about an escape room birds-eye-view "map" of a harbour, where downwards on the map apparently meant "the sea is deeper here".
- A calendar feed of season starts you can subscribe to.
- The whole dataset as JSON, if you think you can do it better yourself.

## Why it's like this

**Weeks.** Weeks are the coarsest unit at which
"rhubarb is just about in" means something.

**One chart.** A list tells you what is in season.
A chart tells you where you are in the year, and that
nothing much happens in February. 

**No pictures!** Cool points please. Insta-updatable graphics. A photograph of an aubergine conveys nothing you
did not already know about aubergines.

**No dependencies!** The site is Jekyll with no plugins, plain CSS and
a tiny amount of JavaScript. Everything is self-hosted. More cool points please.

**Hand-curated data, from named sources.** The seasons come from the
New Covent Garden Market calendar, cross-checked against BBC Good Food,
with the shooting seasons from BASC and the fish from a Cornish
wholesaler's chart. Every row says where it came from.

## Data

`_data/foods.yml` is the truth: one entry per food, with a group, a
colour, a source and the weeks it is in season or just about.
`_data/groups.yml` names the groups and `_data/quotes.yml` holds the
quotations.

Everything is British. Corrections welcome. Ish.

## Development

The site is built with Jekyll and deployed to GitHub Pages using the
workflow in `.github/workflows/pages.yml`.

```
bundle install
bundle exec jekyll serve
```

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
