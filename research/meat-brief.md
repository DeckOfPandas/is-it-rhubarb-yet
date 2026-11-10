# Meat sustainability and environmental impact brief

Helen wants each meat and game page on Is It Rhubarb Yet? to show sustainability and environmental impact, comparable to how fish pages show the MCS Good Fish Guide rating. Her standing rule is that every judgement must come from a named third party. The site must never issue its own ratings or "unsolicited sermons". So collect third-party data only, and never invent a score or tier.

## Foods

Lamb (lines: new-season, milk-fed spring, hogget, Welsh, salt marsh, mutton), beef, pork, chicken, duck, goose, turkey, grouse, pheasant, partridge, wild duck, woodcock, venison (red & fallow, roe, Chinese water deer, muntjac, farmed), wood pigeon, rabbit, hare, grey squirrel.

## What to find for each food

1. **Environmental impact numbers.**
   - Poore & Nemecek (2018), via Our World in Data: greenhouse gas emissions per kg of product, and per 100 g of protein where available. Record the median and the category name OWID uses (for example "Beef (beef herd)", "Lamb & Mutton", "Pig Meat", "Poultry Meat").
   - Land use per kg if available.
   - UK-specific figures where a credible body publishes them: AHDB, WRAP, the Climate Change Committee, Defra, the Carbon Trust, peer-reviewed UK studies. UK grass-fed beef and lamb figures differ from global medians, so where both exist, give both.
   - Say clearly which foods have no figure of their own (for example game birds or venison) and which proxy category, if any, a source itself uses.
2. **Third-party frameworks or ratings that rank production systems.** Helen has already listed these as pending sources:
   - Eating Better's "Sourcing Better" framework: https://www.eating-better.org/site/assets/files/1799/sourcing_better_framework_final.pdf
   - Pasture for Life certification standards: https://pastureforlife.org/resources/standards-51
   - RSPCA Assured: https://www.rspcaassured.org.uk/
   - Food Standards Agency, lead shot in game: https://web.archive.org/web/20240530220237/https://www.food.gov.uk/safety-hygiene/lead-shot-game
   - GOV.UK, the wild venison quality assurance scheme: https://www.gov.uk/government/news/national-quality-assurance-scheme-for-wild-venison-launches

   Also check whether any UK body publishes a consumer-facing rating per meat type comparable to the MCS: for example Compassion in World Farming, the Soil Association, WWF-UK, Which?, or the Sustainable Food Trust. Record what each framework says about each food or production system, in its own terms (its tier names, its criteria). Paraphrase; quote only a few words.
3. **What to look for when buying,** from those third parties only: for example Pasture for Life, organic, RSPCA Assured, free-range, outdoor-bred pork, lead-free shot, wild venison from managed culls, the Wild Venison scheme, BASC's Code of Good Shooting Practice. This is the meat equivalent of the fish `buy` line. Paraphrase it from the source.
4. **Game-specific points from named sources:**
   - lead ammunition: the FSA, and the UK shooting organisations' voluntary transition to non-lead shot by 2025, and whether it was met
   - deer as an overabundant population needing culls (for example the Deer Initiative, Forestry England or NatureScot), stated as the source states it
   - release numbers of non-native gamebirds (pheasant, red-legged partridge), and the ecological concerns recorded by Natural England or the RSPB, stated neutrally and attributed
   - grouse moor management controversy, only as named bodies state it, with the shooting organisations' position as well, so the account stays balanced
   - woodcock: the GWCT's advice on resident woodcock decline
   - grey squirrel as an invasive species

## Output

Write two files under /home/claude/seasonality:

- `data/meat-sustainability.yml`: a list, one entry per food `slug` (lamb, beef, pork, chicken, duck, goose, turkey, grouse, pheasant, partridge, wild-duck, woodcock, venison, wood-pigeon, rabbit, hare, squirrel). Each entry has:
  - `impact`: `{ghg_kg_co2e_per_kg: {median, category, source}, ghg_per_100g_protein: {...}, land_use_m2_per_kg: {...}, uk: [ {figure, unit, system, source} ]}`, or `null` with a note
  - `frameworks`: `[ {body, says, source} ]`
  - `buy`: one paraphrased sentence, attributed in brackets
  - `notes`: `[ {topic, text, source} ]`, short and attributed
  - `confidence`: high, moderate or low, for how well sourced the entry is
- `sources/meat-sustainability.yml`, using the same registry schema as the other sources files (`key`, `title`, `publisher`, `url`, `type`, `published`, `accessed`). Follow the Source age rules in `rules.md`.

Validate in code that both files parse and that every cited key exists.

## What to return

Under 250 words:

- which foods have direct figures, which use a proxy, and which have none
- which frameworks turned out to be usable per food
- anything contested, or where the sources disagree
