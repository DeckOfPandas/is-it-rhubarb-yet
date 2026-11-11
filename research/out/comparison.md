# Your data against the clean-room data

You have 267 rings. Each one is matched to my line of the same name, or to the line that plays the same role: your whole-food ring against my Outdoor line, your coasts against my NE/SE/SW, your Native oysters against my Fal line. Where no line matches, it's compared with all my lines combined. This was done in code (`build/compare.py`, `build/report_compare.py`), week by week.

"Agree" means the two differ by no more than four weeks (about two weeks at each end), both in when the food is `in` and in when it's on sale at all.

| | Rings |
|---|---|
| Agree | 63 |
| Same supply, different peak | 76 |
| Mine is longer | 69 |
| Mine is shorter | 26 |
| Shifted (the seasons overlap but start or end at different times) | 25 |
| I found no data; yours stands | 4 |
| NEVER on one side only | 3 |
| NEVER on both sides | 1 |

Within each section, the entries run from my highest confidence to my lowest, then from the biggest difference to the smallest. A difference where my line is `low` is a weak challenge to yours; one where it's `high` or `moderate` is worth acting on.

## Patterns worth knowing before you read the detail

1. **The year-round rule makes a lot of my lines longer.** Under your 10 November decision, anything on sale all year is `in` all year unless a source names a best season. Your data often shows those foods with a season (carrots, little gem, wild oyster mushrooms, and South West herring and monkfish). Where the difference is only about the peak, it's in the "same supply, different peak" section, not counted as a factual disagreement.
2. **South West fish follow different sources.** Yours follows Flying Fish Seafoods, mine the Cornwall Good Seafood Guide's "best to eat" months, which are driven by spawning. They often disagree: lemon sole, Dover sole, cuttlefish, brown crab, sea bass, red mullet. Neither is wrong, but they answer different questions. One says when the fish is landed and sold; the other says when it's best to eat.
3. **Foraged foods and herbs.** 38 of your rings cite "common knowledge". Mine have named sources, though often only secondary ones (foragers, the RHS). Mine usually run longer, because the sources name a second flush or a longer picking window (nettles, sea beet, dandelion, rosehips).
4. **Storage.** Several of your `store` stretches aren't in my data, and the other way round: swede, celeriac, garlic, shallots, onions, red cabbage, pears. Growers told the helpers where cold storage really applies, so those rows are worth a look.

## 1. NEVER, unsold or no supply on one side only

Enoki is a food-level NEVER: nobody grows it here, so it belongs in `never.yml`. Farmed halibut, wild South West halibut and outdoor cucumber are `no_supply`: the food lives or grows here, but there's no regular UK supply of that line.


#### Enoki, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     ····················································
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: New Covent Garden Market.
- **Mine (low):** NEVER / unsold / no supply. Sources: Food Standards Agency (primary), Scottish Daily Mail (via PressReader) (secondary), SAC Consulting / Scotland's Rural College (primary).

#### Halibut, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     ····················································
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (low):** NEVER / unsold / no supply. Sources: Seafish (primary), Cornwall Good Seafood Guide (primary), Marine Conservation Society (primary).
- **My discrepancy note:** cgsg-halibut ticks no month as best to eat and says the fish is rare locally, so the national season may overstate Cornish supply.

#### Cucumber, Outdoor

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIaaaa·········
Mine     ····················································
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–September; avail March and October. Sources: New Covent Garden Market.
- **Mine (low):** NEVER / unsold / no supply. Sources: Produced in Kent (secondary), Royal Horticultural Society (secondary), Hortnews (The Commercial Greenhouse Grower) (trade).

## 2. Mine is longer (69)

My line is on sale in every week yours is, and in more weeks besides.

#### Oyster mushrooms, Wild

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················IIIIIIIIIIIIIIIIIIIIIIIIIIaaaa
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–November; avail December. Sources: First Nature.
- **Mine (high):** in January–December. Sources: Woodland Trust (primary), The Wildlife Trusts (primary).

#### Carrots, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIsssssssssaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–February; avail May; store March–April. Sources: New Covent Garden Market, Defra.
- **Mine (high):** in January–December. Sources: AHDB Horticulture (primary), British Growers Association (primary), Farmers Guide (trade), AHDB (archive) (primary).
- **My discrepancy note:** Supply can be thin in late May to early June (wks 21-23) when the old English crop is finished; in 2026 imports filled the gap (freshplaza-bcga-carrots-2026-05). Not treated as a gap because primary sources describe year-round supply.

#### Cuttlefish, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIII··················aaaaaaaa·········
Mine     IIIIaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–April; avail September–October. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in May–January; avail February–April. Sources: Cornwall Good Seafood Guide (primary), Flying Fish Seafoods (secondary), Marine Conservation Society (primary), UK Government (GOV.UK assets) (primary).
- **My discrepancy note:** Flying Fish Seafoods marks November-February as best quality (flyingfish-seasonality), leaving out May-October, which cgsg-cuttlefish ticks; the primary regional guide is used.

#### Sea bass, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIII·················IIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October–May. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in June–November; avail December–May. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), GOV.UK (Defra / Marine Management Organisation) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary).
- **My discrepancy note:** ffs-seasonality marks no best-quality months for it (meaning consistent quality all year) (line-caught wild bass), against cgsg-bass's Jun-Nov; CGSG kept. seafish-seafood-guide (2009, background only) gives a wild season of Aug-Mar, which predates the closure. cgsg-bass quotes a 2-fish recreational bag limit; current guidance is 3 per day (gov-bass-guidance-2026). The best-to-eat source marks 17 w

#### Lemon sole, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············aaaaIIIIIIIIIIIIIIIIIIaaaa·············
Mine     IIIIIIIIaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–August; avail April and September. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in July–February; avail March–June. Sources: Cornwall Good Seafood Guide (primary), Direct Seafoods (secondary), Flying Fish Seafoods (secondary), Marine Conservation Society (primary).
- **My discrepancy note:** Flying Fish Seafoods marks June-September as best quality (flyingfish-seasonality), against July-February in cgsg-lemon-sole. The 2009 national guide's May-March season no longer counts.

#### Nettles, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········IIIIIIIIIaaaaa······························
Mine     aaaaaaaIIIIIIIIIIIIIIIIaaaaaaaaaaaaIIIIIIIIIIIIIaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–April; avail May. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in February–June and September–November; avail December–February and June–August. Sources: Woodland Trust (primary), NatureScot (primary).
- **My discrepancy note:** natgeo-calendar puts the peak in April only (weeks 14-17).

#### Swede, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ssssssssssssssssssssssssssaaaaaaaaaIIIIIIIIIIIIIssss
Mine     IIIIIIIIIIIIIIIIIssssssaaIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–November; avail July–August; store December–June. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in June–April; avail June; store May–June. Sources: The Caterer (trade), Fresh Produce Journal (Fruitnet) (trade), FreshPlaza (trade), Defra (primary).
- **My discrepancy note:** Whether Jan-Apr supply is field-lifted or stored is unclear: the Devon grower harvests to April, but Produce World's storage ran before May too. New-season start varies: mid-June (caterer-swede-2017) vs June or July (fpj-roots-differing-seasons) vs July (freshview-seasonality).

#### Lamb, Mutton

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIaaaaa······················aaaaIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October–February; avail March and September. Sources: National Sheep Association, AHDB, AHDB, Lishman's, Hybu Cig Cymru, Farm Contractor.
- **Mine (moderate):** in January–December. Sources: National Sheep Association (primary), Mutton Renaissance (primary), Farmers Weekly, quoting Mutton Renaissance and the National Sheep Association (trade).
- **My discrepancy note:** Older sources name a peak: the Mutton Renaissance campaign (undated page, campaign launched 2004) says the best meat is produced October to March, and a 2005 specification launch dated the mutton season from 1 October, after summer grazing (muttonrenaissance-what-is-mutton, fwi-mutton-spec). Under the source-age rule these pre-2016 sources don't override the current NSA guide; no newer source nami

#### Lamb, Welsh

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························IIIIIIIII·············
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–September. Sources: Hybu Cig Cymru.
- **Mine (moderate):** in August–November; avail December–July. Sources: Business Wales (Welsh Government), quoting Hybu Cig Cymru (primary), Hybu Cig Cymru (Meat Promotion Wales) (primary), Agriland, quoting Hybu Cig Cymru (trade), FarmingUK, quoting Hybu Cig Cymru (trade).
- **My discrepancy note:** farminguk-hcc-lamb-season says the second half of the year (from July); hcc-lamb-day starts the season on 1 August. Followed the named start date.

#### Gurnard, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········IIIIIIIIIIIIIIaaaaaaaaIIIIIIIIIaaaa·········
Mine     aaaaaaaaIIIIIaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–May and August–September; avail June–July and October. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in March and September–December; avail January–February and April–August. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary).
- **My discrepancy note:** cgsg-red-gurnard ticks Mar-May and Aug-Dec, but its text says to avoid Apr-Aug (spawning). Rule 1 applied (text): Apr, May and Aug set to avail. ffs-seasonality (gurnard, species not named) marks best quality May-Sep, which is mostly CGSG's spawning period; CGSG (primary) kept.

#### Brown shrimp, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–October; avail May and November. Sources: Common knowledge, Good Fish Guide — includes "common knowledge".
- **Mine (moderate):** avail January–December. Sources: Eastern Inshore Fisheries and Conservation Authority (primary), Fishing News (trade), Responsible Fishing Committee (hosted by Eastern IFCA) (secondary).
- **My discrepancy note:** Pass 3 change: September-December was in; it is a landings peak, not a best-to-eat window, so it is now avail. A 2009 North Sea fact sheet also names early spring as a landings peak alongside autumn (fishfacts-north-sea-shrimp-2009); no UK source repeats it.

#### Sea beet, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIIIIIIIIIIIIIIaaaa·············
Mine     aaaaaaaaIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–August; avail March and September. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in March–May; avail June–February. Sources: NatureScot (primary), The Wildlife Trusts (primary), Kent Wildlife Trust (primary), Galloway Wild Foods (secondary).
- **My discrepancy note:** galloway-sea-beet gives flowering as May-August, Wildlife Trusts July-September.

#### Mackerel, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIaaaaaaaa·········
Mine     IIIII········aaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–August; avail May and September–October. Sources: Northumberland Seafood.
- **Mine (moderate):** in January–February and October–November; avail April–September and November. Sources: Fish Focus (trade), The Fishing Daily (trade).
- **My discrepancy note:** northumberland-mackerel (2016, secondary) puts the peak in July, in the inshore summer fishery; the SPFA-quoted trade sources (higher rank) name Jan-early Feb and Oct-Nov for the pelagic fleet, so July is avail here. seafish-seafood-guide (2009) is background only under the fish brief (all year, best Jun-Aug); its all-year avail was dropped, leaving Feb-Mar and December empty.

#### Mackerel, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIII·················IIIIIIIIIIIII
Mine     IIIIIIIIIIIIIaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October–May. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in July–March; avail April–June. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary).
- **My discrepancy note:** ffs-seasonality marks no best-quality months for it (meaning consistent quality all year), against cgsg-mackerel's Apr-Jun gap; CGSG (primary) kept. seafish-seafood-guide (2009) is background only under the fish brief (all year, best in summer).

#### Dover sole, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIIIII·········IIIIIIIIIIIIIaaaa
Mine     IIIIaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–June and September–November; avail March and December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in May–January; avail February–April. Sources: Cornwall Good Seafood Guide (primary), Flying Fish Seafoods (secondary), Marine Conservation Society (primary).
- **My discrepancy note:** Flying Fish Seafoods marks March-April and July-November as best quality (flyingfish-seasonality): it includes two of cgsg-dover-sole's spawning months and leaves out December-January and May-June. The primary regional guide is used.

#### Aubergine, (whole) (vs my *Glasshouse*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIII·············
Mine     ········IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–September; avail May. Sources: New Covent Garden Market.
- **Mine (moderate):** in March–October; avail November. Sources: The Caterer (trade), Fresh Produce Journal (Fruitnet) (trade), Lea Valley Growers Association (primary), Horticultural Development Company, a division of AHDB (primary).
- **My discrepancy note:** A Yorkshire grower said supply would run until November (fpj-aubergines-evs), about four weeks past caterer-aubergines-2017; November kept as avail.

#### Cod, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    aaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII·········
Mine     IIIIIIIIaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–October; avail January–February. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in May–February; avail March–April. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary).
- **My discrepancy note:** ffs-seasonality marks best quality Jul-Oct only, against cgsg-cod's all months but Mar-Apr; CGSG (primary) kept. seafish-seafood-guide (2009, background only) also gives best Jul-Oct.

#### Haddock, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    aaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII·········
Mine     IIIIaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in February–October; avail January. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in May–January; avail February–April. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary).
- **My discrepancy note:** ffs-seasonality marks best quality Feb-Apr and Jul-Sep, which includes the breeding season cgsg-haddock says to avoid; CGSG (primary) kept. seafish-seafood-guide (2009, background only) gives best Feb-Sep.

#### Red mullet, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII·············
Mine     aaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–September. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in May–November; avail January–April. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary).
- **My discrepancy note:** ffs-seasonality marks no best-quality months for it (meaning consistent quality all year), against cgsg-red-mullet's May-Nov; CGSG kept. The best-to-eat source marks 9 weeks as in that Flying Fish Seafoods's chart (as transcribed) doesn't show as landed; kept in under rule 5.

#### Herring, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–November. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in January–December. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary).

#### Leeks, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIaaaaa·················aaaaaIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIIIIIaaaaa····IIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–February; avail March and August. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in July–April; avail May. Sources: FreshPlaza (trade), AHDB Horticulture (primary), Freshview Foods (secondary), Defra (UK GI scheme) (primary).
- **My discrepancy note:** Dates moved in the source-age pass: previously in Jan-May (wks 1-22) and July-Dec, after AHDB's 11 months on sale (ahdb-harvested-in-britain, 2015); now in to the end of April (wk 17) per freshplaza-esg-leeks-2026, with May avail. Welsh Leeks PGI starts harvest in August (wk 31), about four weeks after the July start (defra-pgi-welsh-leeks).

#### Rhubarb, Outdoor

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············aaaaIIIIIIIIIIIII······················
Mine     ··········aaaIIIIIIIIIIIIIIIIIIIIIIIIIIaaaa·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–July; avail April. Sources: New Covent Garden Market.
- **Mine (moderate):** in April–September; avail March and October. Sources: Defra (primary), Fresh Produce Journal (Fruitnet) (trade), The Caterer (trade), The Vegetarian Society (secondary).
- **My discrepancy note:** Previous dates: avail week 13, in 14 to 39, from Oldroyd Hulme (about 2009) and The Caterer (2018). Defra's 2026 quotes start about two weeks earlier and run at least four weeks later. The Caterer's unattributed outlook says the main season runs only until June or July (caterer-outdoor-rhubarb).

#### Sea buckthorn, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ···································IIIIIIII·········
Mine     aaaaaaaa······················aaaaaIIIIIIIIIIIIIaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–October. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in September–November; avail December–February and August. Sources: The Wildlife Trusts (primary), Wicked Leeks (Riverford) (secondary), Country Life (secondary).

#### Blackberries, Cultivated

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························aaaaaIIIIIIIIaaaaa····
Mine     ·············aaaaaaaaaaaaaaaaaIIIIIIIIIaaaaaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–October; avail August and November. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in August–September; avail April–July and October–November. Sources: Farming UK News (farming.co.uk) (trade), Borough Market (secondary), The Vegetarian Society (secondary).
- **My discrepancy note:** A secondary list gives July to October for blackberries generally (vegsoc-seasonal).

#### Plaice, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········IIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaaaaaIIIIIIIII
Mine     IIIIaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–August and November–December; avail September–October. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in April–January; avail February–March. Sources: Cornwall Good Seafood Guide (primary), Flying Fish Seafoods (secondary), Direct Seafoods (secondary), Marine Conservation Society (primary).
- **My discrepancy note:** Flying Fish Seafoods marks only June-August as best quality (flyingfish-seasonality), much narrower than cgsg-plaice; the primary regional guide is used (rule 2).

#### Grey mullet, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     aaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–November. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in May–December; avail January–April. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary).
- **My discrepancy note:** ffs-seasonality marks no best-quality months for it (meaning consistent quality all year), against cgsg-grey-mullet's May-Dec; CGSG kept.

#### Lettuce, Cos

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················aaaaIIIIIIIIIIIIIIIII·········
Mine     ·············aaaaIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–October; avail June. Sources: New Covent Garden Market.
- **Mine (moderate):** in May–October; avail April and November. Sources: Defra (primary), AHDB Horticulture (primary), FreshPlaza (trade), The Vegetarian Society (secondary).
- **My discrepancy note:** Defra also quotes cos on two December 2025 dates; no source explains winter supply.

#### Parsnips, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIaaaaaaaaa·········aaaaIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIIIIIaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–February; avail March–April and July. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in July–April; avail May–June. Sources: AHDB Horticulture (primary), Fresh Produce Journal (Fruitnet) (trade).
- **My discrepancy note:** New-crop start: June per Produce World (fpj-parsnip-underdog) vs July per Huntapac (fpj-british-veg-roots), up to four weeks apart; both articles are undated and from different years. In starts at July, with June as avail. Source-age pass: the season-naming sources are old or undated (fpj-roots-differing-seasons 2004; FPJ pieces about 2012-15), with year-round supply from the 2016 Defra notices. T

#### Tomatoes, Glasshouse

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     aaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–November. Sources: Defra.
- **Mine (moderate):** in March–November; avail December–February. Sources: British Tomato Growers' Association (primary), HortiDaily (trade).
- **My discrepancy note:** btga-about gives March to October; ahdb-grown-in-britain starts in February; both about four weeks off btga-fortnight-2025. Defra's wholesale series quoted home-grown round tomatoes from 27 Apr to 26 Oct 2026, with vine and cherry also quoted in December 2025 but not January to mid-April (defra-wholesale-prices). In one year the association announced the season start on 17 April (fpj-buy-british-t

#### Wild garlic, (whole) (vs my *UK-wide*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIII······························
Mine     ····aaaaIIIIIaaaaaaaaaaaaa··························
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–May; avail March. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in March; avail February and April–June. Sources: Woodland Trust (primary).
- **My discrepancy note:** wt-wild-garlic-pesto says visit woods late March to July (weeks 12-30). natgeo-calendar puts the peak in April (14-17). caterer-wild-garlic says growth starts in Cornwall in late December and runs about 12 weeks, about two weeks later per degree north.

#### Tea, (whole) (vs my *Cornwall*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIIIIIIIIIIIIIIIIIIII·········
Mine     aaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–October. Sources: Tregothnan.
- **Mine (moderate):** in April–October; avail November–March. Sources: Tregothnan (primary).

#### Brussels sprouts, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIII···························aaaaIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIaa···············aaaaaIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October–February; avail September. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in September–March; avail April and August. Sources: FreshPlaza (trade), AHDB Horticulture (primary), Defra (primary), Sleaford Standard (secondary).
- **My discrepancy note:** vegsoc-seasonal gives September-February; freshview-seasonality October-January.

#### Pollock, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in May–January; avail February–April. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary).
- **My discrepancy note:** ffs-seasonality marks no best-quality months for it (meaning consistent quality all year), against cgsg-pollack's Feb-Apr spawning gap; CGSG kept.

#### Brill, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     aaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–November. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in April–December; avail January–March. Sources: Cornwall Good Seafood Guide (primary), Direct Seafoods (secondary), Flying Fish Seafoods (secondary), Marine Conservation Society (primary).
- **My discrepancy note:** cgsg-brill says brill spawn in spring and summer, yet ticks April-December, so its ticks are not spawning-based; the ticks are used. Flying Fish Seafoods marks no best-quality months for brill, which on its key means consistent quality all year (flyingfish-seasonality), against the regional guide's window; the primary source is used.

#### Blueberries, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························IIIIIIIII·················
Mine     ······················IIIIIIIIIIIIIIIIIaaaa·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–August. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in June–September; avail October. Sources: Defra (primary), Farming UK News (farming.co.uk) (trade), Fresh Produce Journal (Fruitnet) (trade), Borough Market (secondary).
- **My discrepancy note:** Hall Hunter's 2023 end (30 September, week 39) is about four weeks before Defra's last 2026 quote. Secondary sources give August to September for the English crop (borough-currants) and June to November in Scotland (courier-scotland-july).

#### Cabbage, Savoy

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIaaaa·····aaaaIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–March; avail April and June. Sources: New Covent Garden Market, Defra, RHS.
- **Mine (moderate):** in September–February; avail March–August. Sources: AHDB Horticulture (primary), The Vegetarian Society (secondary), Oddbox (secondary), Defra (primary).
- **My discrepancy note:** vegsoc-seasonal and oddbox-seasonal start in October (about 4 weeks later than AHDB) and end in February.

#### Kale, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIII·············aaaaaIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–April; avail August. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in September–March; avail April–August. Sources: FreshPlaza (trade), The Grocer (trade), New Covent Garden Market (Covent Garden Market Authority) (trade).
- **My discrepancy note:** grocer-kale-hardy gives June to early March, over 4 weeks earlier at the start than Reynolds. Secondary: September-April (oddbox-seasonal); September-February plus April (vegsoc-seasonal); August-March (hubbub-seasonal); curly kale also July-September (freshview-seasonality).

#### Rosehips, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ···································IIIIIIIIaaaaa····
Mine     aaaaaaaa···························IIIIIIIIIIIIIaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–October; avail November. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in September–November; avail December–February. Sources: Woodland Trust (primary), NatureScot (primary), National Geographic (secondary).

#### Sardines, Cornish fishery (MSC)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIII······················IIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIaaaaaaaaaaaaa·········aaaaIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–January. Sources: MSC.
- **Mine (moderate):** in August–January; avail February–April and July. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Marine Stewardship Council (primary), Cornish Sardine Management Association (Cornish Sardines) (primary).
- **My discrepancy note:** cgsg-sardine ticks Jul-Feb as best to eat; its text says the main season is Aug-Jan. Rule 1 applied (text). ffs-seasonality marks best quality Jan-Apr and Oct-Dec, so it adds Feb-Apr and drops Aug-Sep against cgsg-sardine; CGSG (primary) kept.

#### Celery, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················aaaaIIIIIIIIIIIIIIIII·········
Mine     ·····················IIIIIIIIIIIIIIIIIIIIIIIIIII····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–October; avail June. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in May–November. Sources: Horticultural Development Company, a division of AHDB (primary), Defra (primary), The Vegetarian Society (secondary), Kentish Stour Countryside Partnership (secondary).
- **My discrepancy note:** Secondary calendars differ widely: vegsoc-seasonal lists January and September to December; kentishstour-calendar lists April to early July. AHDB dates used (rule 2).

#### Monkfish, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ····IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in February–November. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in January–December. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary).
- **My discrepancy note:** ffs-seasonality marks best quality Jan-Apr and Oct-Dec only, against cgsg-monkfish-white's all year; CGSG (primary) kept. seafish-seafood-guide (2009, background only) gives best Oct-May.

#### Sloes, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·······································IIIIIIIII····
Mine     ·································aaaaaIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October–November. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in September–December; avail August–September. Sources: Woodland Trust (primary), Country Life (secondary).
- **My discrepancy note:** countrylife-wild-fruit (John Wright) has the fruit ripening late August to early November (weeks 34-45); its earlier start is shown as avail.

#### Wild strawberries, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················IIIIIIII······················
Mine     ······················IIIIIIIIIIIIIaaaa·············
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–July. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in June–August; avail September. Sources: Woodland Trust (primary), BBC Countryfile (secondary), National Geographic (secondary).
- **My discrepancy note:** wt-foraging-sep says fruit appears from July onwards (week 27), against June (week 23) in wt-foraging-jul; the July post's text is used.

#### Meadowsweet, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················IIIIIIIIIIIII·················
Mine     ······················IIIIIIIIaaaaaaaaaaaaa·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–August. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in June–July; avail August–October. Sources: Woodland Trust (primary), NatureScot (primary).
- **My discrepancy note:** WT gives flowering to October (weeks to 43); NatureScot June-July only.

#### Elderberries, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························aaaaaIIII·············
Mine     ··························aaaaIIIIIIIIIaaaa·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September; avail August. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in August–September; avail July and October. Sources: Woodland Trust (primary), Wicked Leeks (Riverford) (secondary), National Geographic (secondary).
- **My discrepancy note:** riverford-autumn-foraging gives September-October (weeks 36-43).

#### Crab apples, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ···································IIIIIIII·········
Mine     ······························IIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–October. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in August–October. Sources: Woodland Trust (primary), National Geographic (secondary).

#### Lettuce, Iceberg

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················IIIIIIIIIIIIIIIIIIIIIIIIII·········
Mine     ·············aaaaIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–October. Sources: New Covent Garden Market, Fresh Produce Journal.
- **Mine (moderate):** in May–October; avail April and November. Sources: Defra (primary), AHDB Horticulture (primary), FreshPlaza (trade), The Vegetarian Society (secondary).

#### Horseradish, (whole) (vs my *Cultivated*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    sssssssssssssaaaaIIIII·············aaaaIIIIsssssssss
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May and October; avail April and September; store November–March. Sources: New Covent Garden Market.
- **Mine (low):** in January–December. Sources: Tracklements (secondary), Royal Horticultural Society (secondary), Defra (primary), Freshview Foods (secondary).

#### Brown crab, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ····IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII·············
Mine     IIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in February–September. Sources: Flying Fish Seafoods.
- **Mine (low):** in October–March; avail April–September. Sources: Cornwall Good Seafood Guide (primary), Fish is the Dish (Seafish) (primary), Flying Fish Seafoods (secondary), Cefas (via GOV.UK) (primary).
- **My discrepancy note:** Best-to-eat sources disagree by more than 4 weeks, so confidence is low. cgsg-crab ticks all 12 months but its text says winter is best (rule 1 applied: October-March used). Seafish gives March-June as best quality UK-wide (fitd-crab). Flying Fish, a Cornish wholesaler, marks best quality for live cock crab and picked meat in March-June and September-December, not January-February or July-August (

#### Chicory & Radicchio, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     IIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–October; avail May and November. Sources: New Covent Garden Market, Charles Dowding.
- **Mine (low):** in September–February; avail March–August. Sources: The Vegetarian Society (secondary), Oddbox (secondary), Hubbub (secondary).
- **My discrepancy note:** vegsoc-seasonal marks all twelve months; oddbox-seasonal March-July and September-February; hubbub-seasonal September-November and January-February.

#### Clams, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIII·········IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaa··aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–February. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail January–December. Sources: Kent and Essex Inshore Fisheries and Conservation Authority (primary).
- **My discrepancy note:** Pass 3 change: the line was empty. The trial is under a voluntary code, not a byelaw, and its window has moved each year, so these weeks may change.

#### Lettuce, Little gem

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIaaaa·········
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–September; avail March and October. Sources: New Covent Garden Market.
- **Mine (low):** in January–December. Sources: Defra (primary), Fresh Produce Journal (trade).

#### Dandelion, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········IIIIIIIIIaaaaa······························
Mine     aaaaaaaaIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–April; avail May. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in March–May; avail June–February. Sources: Woodland Trust (primary), Love Cairngorms (secondary).
- **My discrepancy note:** natgeo-calendar gives a June peak (weeks 23-26), probably for flowers.

#### Scallops, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIaaaaIIIIIIIIIIIIIIIIIIIIII····
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–May and July–November; avail March and June. Sources: Flying Fish Seafoods.
- **Mine (low):** in January–December. Sources: Cornwall Good Seafood Guide (primary), Fish is the Dish (Seafish) (primary), Flying Fish Seafoods (secondary), Defra (primary).
- **My discrepancy note:** Best-to-eat sources clash, so confidence is low. Seafish gives August-September as best quality UK-wide (fitd-scallops); Flying Fish marks September-October as best quality for Looe Bay half-shell scallops (flyingfish-seasonality); Defra says summer scallops are roe-less with poor meat yield (defra-king-scallop-fmp-annexes-2023). With no agreed peak, the regional guide's all-year window is kept. C

#### Sage, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     aaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–October; avail March and November. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in March–August; avail September–February. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** Category-wide window Apr-Sep (fpj-herbs-uk-kitchens) is not specific to evergreen herbs.

#### Thyme, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············aaaaIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     aaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–October; avail April and November. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in May–August; avail September–April. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** Category-wide window Apr-Sep (fpj-herbs-uk-kitchens) is not specific to evergreen herbs.

#### Pumpkin, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    sssssssssssss······················IIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaa················aIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–December; store January–March. Sources: New Covent Garden Market.
- **Mine (low):** in August–December; avail January–March and July. Sources: The Vegetarian Society (secondary), Kentish Stour Countryside Partnership (secondary), Foodomarket (wholesaler) (secondary), Grocery Gazette (trade).
- **My discrepancy note:** foodomarket-season gives September to February; kentishstour-calendar runs to March.

#### Kohlrabi, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················aaaaIIIIIIIIIIIIIIIIIIIIII····
Mine     ·················IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–November; avail June. Sources: New Covent Garden Market.
- **Mine (low):** in May–December. Sources: Royal Horticultural Society (secondary), New Covent Garden Market (Covent Garden Market Authority) (trade), The Vegetarian Society (secondary).
- **My discrepancy note:** vegsoc-seasonal gives July-September; oddbox-seasonal June-February. More than 4 weeks apart.

#### Field mushrooms, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························IIIIIIIIIIIII·········
Mine     ·················aaaaaaaaaIIIIIIIIIIIIIIIIIaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–October. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in July–October; avail May–June and November. Sources: First Nature (secondary), Wild Food UK (secondary), Mushroom Diary (secondary), NERC Open Research Archive (UKCEH) (primary).
- **My discrepancy note:** firstnature-field-mushroom: Jun-Oct; wildfooduk-field-mushroom: May-Nov; mushroomdiary-calendar: Jul-Oct.

#### Turnips, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIII·········IIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–April. Sources: New Covent Garden Market, Defra.
- **Mine (low):** in January–December. Sources: Defra (primary), The Vegetarian Society (secondary), Freshview Foods (secondary).
- **My discrepancy note:** vegsoc-seasonal lists only Jan, Jun-Jul and Sep-Dec; a supplier calendar has British turnips in December, ending in April (freshview-seasonality). Both are secondary and conflict with the year-round Defra quotes. Low because the dates rest on reading one year of price tables, not on a named season.

#### Watercress, Wild

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········IIIIIIIIIIIIIIIIII·········IIIIIIIIIIIII····
Mine     ········IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–June and September–November. Sources: Forestheart.
- **Mine (low):** in March–November. Sources: Wild Food UK (secondary), Country Life (secondary), The Courier (secondary).

#### Pak choi, Outdoor

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························IIIIIIIIIIIII·············
Mine     ·················aaaaaIIIIIIIIIIIIIaaaa·············
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–September. Sources: New Covent Garden Market.
- **Mine (low):** in June–August; avail May and September. Sources: Freshview Foods (secondary), Hubbub (secondary), Oddbox (secondary).

#### Marjoram & Oregano, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIIIaaaa·········
Mine     ········aaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIaaaa·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–September; avail May and October. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in May–September; avail March–April and October. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** Category-wide window Apr-Sep (fpj-herbs-uk-kitchens) starts about 4 weeks before the in window.

#### Ceps, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························IIIIIIIIIIIII·········
Mine     ··························IIIIIIIIIIIIIIIIIaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–October. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in July–October; avail November. Sources: Woodland Trust (primary), Wild Food UK (secondary), Mushroom Diary (secondary), Freshview Foods (secondary).
- **My discrepancy note:** wildfooduk-cep gives Aug-Oct, starting about 4 weeks after the primary source's summer start.

#### Plaice, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** in April–December; avail January–March. Sources: Direct Seafoods (secondary).

#### Samphire, (whole) (vs my *Marsh samphire (wild)*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················aaaaIIIIIIIII·················
Mine     ·················aaaaaIIIIIIIIIaaaa·················
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–August; avail June. Sources: New Covent Garden Market.
- **Mine (low):** in June–August; avail May and August. Sources: Galloway Wild Foods (secondary), CPRE Norfolk (secondary), KL Magazine (secondary), Riverford (secondary).
- **My discrepancy note:** wildwalks-marsh-samphire gives the peak as June-August (weeks 23-35); klmag-samphire late June or early July to end of August (26-35); vice-samphire has a restaurant serving it June-September (23-39), though sellers called it woody by the end of August. countryfile-monthly lists marsh samphire under December, which no other source supports.

#### Walnuts, Fresh

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·······································IIII·········
Mine     ·······································IIIIIIIII····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October. Sources: New Covent Garden Market.
- **Mine (low):** in October–November. Sources: Sharpham Park (secondary), Hodmedod's (secondary), Roughway Farm (secondary).

#### Hen of the woods, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························IIIIIIIIIIIIIIIII·········
Mine     ··························aaaaIIIIIIIIIIIIIaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–October. Sources: First Nature.
- **Mine (low):** in August–October; avail July and November. Sources: Wild Food UK (secondary), Mushroom Diary (secondary), NERC Open Research Archive (UKCEH) (primary), Nature (secondary).
- **My discrepancy note:** wildfooduk-hen-of-the-woods: Aug-Nov; mushroomdiary-calendar: Jul-Oct.

#### Jerusalem artichokes, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIII·······························aaaaIIIIIIIII
Mine     IIIIIIIIaaaaa··························aaaaIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in November–February; avail October. Sources: New Covent Garden Market.
- **Mine (low):** in November–February; avail March and October. Sources: The Vegetarian Society (secondary), Freshview Foods (secondary).
- **My discrepancy note:** freshview-seasonality runs about four weeks longer at each end (Oct-Mar) than vegsoc-seasonal (Nov-Feb).

## 3. Mine is shorter (26)

Yours is on sale in every week mine is, and in more weeks besides.

#### Oysters, Native

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIaaaaa········aaaaaIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIII··························IIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–April; avail May and August. Sources: Shellfish Act 1967.
- **Mine (high):** in October–March. Sources: legislation.gov.uk (primary), Cornwall Good Seafood Guide (primary), Fish is the Dish (Seafish) (primary), Marine Conservation Society Good Fish Guide (primary).

#### Shallots, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIII·········IIIIIIIIIIIIIIIII
Mine     ssssssssssssssssssssssssss·········IIIIIIIIsssssssss
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–June. Sources: New Covent Garden Market.
- **Mine (moderate):** in September–October; store November–June. Sources: Oldershaw Group (primary), Fresh Produce Journal (Fruitnet) (trade), Royal Horticultural Society (secondary).
- **My discrepancy note:** A smaller grower's British season was due to start in August (fpj-shallots-back), and RHS says shallots ripen mid to late summer (rhs-shallots): that is harvest, before the curing Oldershaw describes, so the market start follows Oldershaw. The previous store end (end of March) was extrapolated from RHS home-storage advice and is replaced by Oldershaw's June.

#### Globe artichokes, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     ······················IIIIIIIIIIIIIIIII·············
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–October; avail May and November. Sources: New Covent Garden Market.
- **Mine (moderate):** in June–September. Sources: The Caterer (trade), Abel & Cole (secondary), Food and Travel (secondary), The Vegetarian Society (secondary).
- **My discrepancy note:** vegsoc-seasonal lists an unspecified 'artichoke' in March to May, which can't be confirmed as globe; not used.

#### Peas, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIIIaaaa·········
Mine     ······················aaaIIIIIIIIaaaaaa·············
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–September; avail May and October. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in June–August; avail June and August–September. Sources: Yes Peas! (PEAS / BGA Ltd) (primary), Fresh Produce Journal (Fruitnet) (trade), lovefood.com (secondary).

#### Pears, Comice & Concorde

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ssssssss·······························IIIIIIIIIIIII
Mine     ssssssss·······························IIIIsssssssss
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October–December; store January–February. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in October; store November–February. Sources: British Apples & Pears Ltd (primary), Defra (primary).
- **My discrepancy note:** Defra's wholesale series quoted home-grown Doyenne du Comice until 13 Apr 2026, about seven weeks past BAPL's February end, and from 12 Oct 2026 (defra-wholesale-prices). Defra has no Concorde series, so the dates of this combined line are not changed (rule 8); a Comice-only line would run store to week 15.

#### Pears, Conference

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ssssssssssssssssssssss·············IIIIIIIIIIIIIIIII
Mine     ssssssssssssssssssssss·············IIIIIIIIsssssssss
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–December; store January–May. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in September–October; store November–May. Sources: British Apples & Pears Ltd (primary), Fresh Produce Journal (Fruitnet) (trade), FoodIngredientsFirst (trade).

#### Spring onions, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············aaaaaaaaaIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     ·············aaaIIIIIIIIIIIIIIIIIIIIIIII············
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–October; avail April–May and November. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in April–October; avail April. Sources: FreshPlaza (trade), G's Fresh (secondary), The Vegetarian Society (secondary).
- **My discrepancy note:** vegsoc-seasonal lists spring onions January to October, about 16 weeks earlier at the start; it is secondary and gives no basis, so it is not used for dates. gs-sandfields-spring-onions starts in April, about three weeks before the trade source.

#### Hazelnuts, Wild

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························IIIIIIIIIIIIIIIIII····
Mine     ·································IIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–November. Sources: Forestheart.
- **Mine (moderate):** in August–October. Sources: Woodland Trust (primary).

#### Sweetcorn, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························aaaaIIIIIIIIIIIIIaaaaa····
Mine     ····························IIIIIIIIIIIII···········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–October; avail July and November. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in July–October. Sources: Defra (primary), The Vegetarian Society (secondary), Plantura (secondary).

#### Beetroot, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    sssssssssssssssssaaaaaIIIIIIIIIIIIIIIIIIIIIsssssssss
Mine     sssssssssssssssssssssssssaIIIIIIIIIIIIIIIIIsssssssss
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–October; avail May; store November–April. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in July–October; avail June; store November–June. Sources: Countryside (NFU Countryside Online) (trade), Fresh Produce Journal (Fruitnet) (trade), Defra (primary).
- **My discrepancy note:** Clamp storage is straw-covered field storage, not controlled storage; it is marked store because the roots are lifted and held, not left growing. The store end (wk 25) is inferred from the Defra quotes, not stated by a grower; no source says how long clamped or cold-stored UK beetroot lasts.

#### Medlars, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·······································aaaaIIIIIIIII
Mine     ··········································IIIIII····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in November–December; avail October. Sources: New Covent Garden Market.
- **Mine (moderate):** in October–November. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (Fruitnet) (trade).

#### Onions, (whole) (vs my *all lines combined*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ssssssssssssssssssssssaaaaIIIIIIIIIIIIIaaaasssssssss
Mine     ssssssssssssssssssssssssssssIIIIIIIIIIIaaaasssssssss
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–September; avail June and October; store November–May. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in July–September; avail October; store November–July. Sources: AHDB Horticulture (primary), Fresh Produce Journal (Fruitnet) (trade), FreshPlaza (trade).
- **My discrepancy note:** One grower finished packing UK stored crop in mid-July (wk 28), with two to three weeks of imports in July (fpj-onions-year-round); AHDB has CA stock covering all of July (to wk 30). In 2019 UK stocks ran very low by late May (freshplaza-bopa-2019).

#### Courgettes, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIIIaaaa·········
Mine     ······················aaIIIIIIIIIIIIIIIaaaa·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–September; avail May and October. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in June–September; avail June and October. Sources: Defra (primary), The Vegetarian Society (secondary), Kentish Stour Countryside Partnership (secondary), Ocado (secondary).
- **My discrepancy note:** Two calendars give June to October (vegsoc-seasonal, kentishstour-calendar), about four weeks past the last Defra quote; gbc-courgettes gives June to September; foodomarket-season gives June to August.

#### Turkey, (whole) (vs my *Traditional farm-fresh*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ···········································aaaaaIIII
Mine     ················································IIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in December; avail November. Sources: Traditional Farmfresh Turkey Association.
- **Mine (moderate):** in December. Sources: Love British Food (TFTA trade stand) (trade), Farmers Weekly, quoting the TFTA (trade), Farmers Weekly, quoting Peeles Rare Breed Turkeys (trade).

#### Sprats, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIII······················IIIIIIIIIIIIIIIII
Mine     aaaa·······································aaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–March. Sources: M&J Seafood.
- **Mine (low):** avail November–January. Sources: Kent and Essex Inshore Fisheries and Conservation Authority (primary).

#### Walnuts, Wild

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················IIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     ·······································IIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–November. Sources: Forestheart.
- **Mine (low):** in October. Sources: Woodland Trust (primary).

#### Edible flowers, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIIIIIIIIIIIIIIII·············
Mine     ·················IIIIIIIIIIIII······················
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–September. Sources: New Covent Garden Market.
- **Mine (low):** in May–July. Sources: Oddbox (secondary), Hubbub (secondary), The Vegetarian Society (secondary).

#### Peppers, Outdoor

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················IIIIIIIIIIIIIIIIIIIIIIIIII·········
Mine     ······························IIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–October. Sources: New Covent Garden Market.
- **Mine (low):** in August–October. Sources: Plantura (secondary), Horticultural Development Company, a division of AHDB (primary).

#### Parsley, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     ·················IIIIIIIIIIIIIIIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–October; avail March and November. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in May–October. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade), Horticultural Development Company (AHDB) (primary).
- **My discrepancy note:** Category-wide window Apr-Sep (fpj-herbs-uk-kitchens) differs by about 4 weeks at each end.

#### Cavolo nero, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaa·········IIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–April; avail April–May. Sources: BBC Good Food, Great British Chefs.
- **Mine (low):** in June–February; avail March. Sources: FreshPlaza (trade), Freshview Foods (secondary).
- **My discrepancy note:** Mudwalls Farm starts in late August and runs through winter to February/March (freshplaza-cavolo-mudwalls), over 4 weeks later than A.H. Worth's June start; A.H. Worth ends in December.

#### Tomatoes, Outdoor

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················aaaaIIIIIIIIIIIIIaaaa·········
Mine     ······························IIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–September; avail June and October. Sources: New Covent Garden Market, Defra.
- **Mine (low):** in August–October. Sources: Plantura (secondary), Horticultural Development Company, a division of AHDB (primary).

#### Basil, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················aaaaIIIIIIIIIIIIIaaaa·········
Mine     ······················IIIIIIIIIIIII·················
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–September; avail June and October. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in June–August. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** Category-wide window Apr-Sep, with Mar and Oct as shoulders (fpj-herbs-uk-kitchens), runs about 9 weeks earlier and 4 weeks later than the basil-specific dates.

#### Chillies, (whole) (vs my *Glasshouse*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaa
Mine     ·················IIIIIIIIIIIIIIIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–November; avail December. Sources: New Covent Garden Market.
- **Mine (low):** in May–October. Sources: Horticultural Development Company, a division of AHDB (primary), The Vegetarian Society (secondary).

#### Lamb, Milk-fed spring

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIaaaa··························
Mine     ·············IIII···································
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–May; avail June. Sources: Lishman's.
- **Mine (low):** in April. Sources: Foreign, Commonwealth & Development Office blogs (Martin Oxley) (secondary), The Caterer (trade), National Sheep Association (primary).

#### Morels, Market

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIII······························
Mine     ·················IIIII······························
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–May; avail March. Sources: New Covent Garden Market.
- **Mine (low):** in May. Sources: Freshview Foods (secondary), The Staff Canteen (trade), JancisRobinson.com (secondary), Woodland Trust (primary).

#### Girolles, Market

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························IIIIIIIIIIIIIIIIIIIIII····
Mine     ···························IIIIIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–November. Sources: New Covent Garden Market.
- **Mine (low):** in July–October. Sources: The Staff Canteen (trade), The Staff Canteen (secondary).

## 4. Shifted (25)

The seasons overlap, but they start or end at different times.

#### Potatoes, New

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIII·············
Mine     ················aIIIIIIIIIIIIIaaa···················
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–September; avail May. Sources: New Covent Garden Market.
- **Mine (high):** in May–July; avail April and August. Sources: Defra (UK GI scheme) (primary), Scottish Government (primary), AHDB Horticulture (primary).

#### Cockles, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     IIIIIIIIaaaaa·········aaaaaaaaIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–November; avail May. Sources: Common knowledge, Good Fish Guide — includes "common knowledge".
- **Mine (moderate):** in August–February; avail March and June–July. Sources: Marine Conservation Society Good Fish Guide (primary), Eastern Inshore Fisheries and Conservation Authority (primary), Kent and Essex Inshore Fisheries and Conservation Authority (primary).

#### Celeriac, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIaaaasssssssssssssssssssssssssssIIIIIIIIIIIIIIIII
Mine     ssssssssssssssssssssssssssssssIIIIIIIIIIIIIIIIIIssss
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–January; avail February; store March–August. Sources: New Covent Garden Market, RHS, Defra.
- **Mine (moderate):** in August–November; store December–July. Sources: Fresh Produce Journal (Fruitnet) (trade), Jack Buck Farms / Farmers Guardian (trade).
- **My discrepancy note:** Both sources trace back to the same grower, so this is effectively one grower's season. 'Until July' read as through July (wk 30), leaving no gap before the August harvest.

#### Rhubarb, Forced

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIII······························IIIIIIIII
Mine     aaIIIIIIIIIIIaaaaaaaa·······························
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in November–March. Sources: New Covent Garden Market.
- **Mine (moderate):** in January–March; avail January and April–May. Sources: Defra (primary), The Caterer (trade), Fresh Produce Journal (Fruitnet) (trade), Defra (GOV.UK) (primary).
- **My discrepancy note:** Growers and a wholesaler gave mid-January to March, finishing before outdoor rhubarb reaches market in April (caterer-forced-rhubarb, undated but 2010 or later; fpj-oldroyd-rhubarb, about 2009), against Defra's quotes to 25 May 2026, about eight weeks later.

#### Potatoes, Maincrop

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ssssssssssssssssssssss·············aaaaIIIIIIIIIIIII
Mine     ssssssssssssssssssssss········aaaaaIIIIIIIIsssssssss
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October–December; avail September; store January–May. Sources: New Covent Garden Market.
- **Mine (moderate):** in September–October; avail August; store November–May. Sources: AHDB Horticulture (primary), AHDB (primary), Defra (UK GI scheme) (primary), Fresh Produce Journal (Fruitnet) (trade).
- **My discrepancy note:** Cranfield researchers say storage of up to eight months may be halved to about four since the CIPC sprout suppressant was withdrawn (potatopro-cranfield-storage-2025), so the late-spring store tail may be thinner than AHDB's 2015 Sept-May figure suggests.

#### Cabbage, Red

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ssssssssssssssssssssss····aaaaIIIIIIIIIIIIIIIIIIssss
Mine     aaaaaaaaaaaaassssssssssssssaaaaaaaaIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–November; avail July; store December–May. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in September–December; avail January–March and July–August; store April–July. Sources: The Caterer (trade), FreshPlaza (trade), Defra (primary).
- **My discrepancy note:** Naylor puts all stock in store from November (freshplaza-cabbage-naylor), but Produce World cuts fresh until March (freshplaza-redcabbage-produceworld). Secondary calendars: September-February (vegsoc-seasonal, oddbox-seasonal); March-August and October-January (freshview-seasonality).

#### Salsify, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIII··························aaaaaIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaa·························IIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–January; avail August. Sources: BBC Good Food.
- **Mine (moderate):** in September–February; avail March. Sources: The Caterer (trade), The Scottish Farmer (trade), The Grocer (trade), Freshview Foods (secondary).
- **My discrepancy note:** Whether Jan-Mar supply is stored roots or late liftings is not stated: AB's harvest ends in December but supply continues to spring. The Caterer's 2019 market report said salsify then on sale was mainly Belgian (caterer-salsify-2019).

#### Cabbage, Winter white

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ssssssssssssssssssssssssss····aaaaaIIIIIIIIIIIIIIIII
Mine     sssssssssssssssssssssssssssIIIIIIIIIIIIIIIIIIIIIssss
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–December; avail August; store January–June. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in July–November; store December–July. Sources: FreshPlaza (trade), Defra (primary), The Vegetarian Society (secondary).
- **My discrepancy note:** Secondary calendars count winter months as in season with no store distinction: August-November and January-February (vegsoc-seasonal); July-February (oddbox-seasonal).

#### Blackberries, Wild

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························IIIIIIIIIIIII·············
Mine     ·····························IIIIIIIIIIIaaaaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–September. Sources: Forestheart.
- **Mine (moderate):** in July–October; avail October–November. Sources: Woodland Trust (primary), Borough Market (secondary), The Vegetarian Society (secondary).
- **My discrepancy note:** Other secondary lists give July to October (vegsoc-seasonal) and, for Scotland, July to about October (courier-scotland-july), not split by wild or cultivated. Borough Market's start (August) is about two weeks after the Woodland Trust's late July.

#### Broccoli, Purple sprouting

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    aaaaIIIIIIIIIIIIIaaaaa··························aaaa
Mine     aaaaIIIIIIIIIIIIIaa····················aaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in February–April; avail December–January and May. Sources: New Covent Garden Market, Rocket Gardens.
- **Mine (moderate):** in February–April; avail October–January and May. Sources: The Caterer (trade), The Grocer (trade), AHDB Horticulture (primary), Tozer Seeds (secondary).
- **My discrepancy note:** vegsoc-seasonal gives February-March only; oddbox-seasonal February-April; freshview-seasonality August-March.

#### Raspberries, (whole) (vs my *Field & tunnel*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················IIIIIIIIIIIIIIIIIIIIIIIIII·········
Mine     ······················IIIIIIIIIIIIIIIIIIIIIaa·······
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–October. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in June–October; avail November. Sources: Fresh Produce Journal (Fruitnet) (trade), FarmingUK (trade), The Grocer (trade).

#### Hops, Flowers

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························IIIIIIIII·············
Mine     ·································aaIIIIaa···········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–September. Sources: Forestheart.
- **Mine (moderate):** in September; avail August and October. Sources: British Hop Association (primary), Society of Independent Brewers (SIBA) (trade), Hukins Hops (secondary), Adnams (secondary).

#### Chervil, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIIIIIIIIIaaaaa·················
Mine     ······················IIIIIIIIIIIIIIIIIIIIIIIIII····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–July; avail March and August. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in June–November. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** Category-wide window Apr-Sep (fpj-herbs-uk-kitchens) starts about 9 weeks earlier and ends about 9 weeks earlier than the chervil-specific dates.

#### Garlic, (whole) (vs my *all lines combined*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ssssssssssssssssssssssaaaaaaaaIIIIIIIIIIIIIIIIIIIIII
Mine     sssssssssssssssssIIIIIIIIIIIIIIIIIIIIIIsssssssssssss
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–December; avail June–July; store January–May. Sources: New Covent Garden Market, RHS.
- **Mine (low):** in May–September; store October–April. Sources: The Garlic Farm (Isle of Wight) (secondary), Fresh Produce Journal (Fruitnet) (trade), Royal Horticultural Society (secondary), The Vegetarian Society (secondary).
- **My discrepancy note:** Store end is my extrapolation from RHS home-storage guidance: softneck keeps to mid-spring, hardneck four to six months (rhs-garlic). No commercial storage source found.

#### Lettuce, Round

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIIIIIIIIIIIIIIII·············
Mine     ······················IIIIIIIIIIIIIIIIIIIIIIIIII····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–September. Sources: New Covent Garden Market.
- **Mine (low):** in June–November. Sources: Fresh Produce Journal (trade), FreshPlaza (trade).

#### Squash, (whole) (vs my *Winter*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    sssssssssssss·················aaaaaIIIIIIIIsssssssss
Mine     aaaaaaaa···························aaaaIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September–October; avail August; store November–March. Sources: New Covent Garden Market.
- **Mine (low):** in October–December; avail January–February and September. Sources: Fresh Produce Journal (Fruitnet) (trade), The Vegetarian Society (secondary), Foodomarket (wholesaler) (secondary), Plantura (secondary).
- **My discrepancy note:** vegsoc-seasonal gives butternut from September, about four weeks before the Barfoots harvest; plantura-calendar lists butternut in November only.

#### Chard, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················IIIIIIIIIIIIIIIIIIIIIIIIII·········
Mine     ······················IIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–October. Sources: New Covent Garden Market.
- **Mine (low):** in June–December. Sources: The Vegetarian Society (secondary), Oddbox (secondary), Hubbub (secondary), Freshview Foods (secondary).
- **My discrepancy note:** hubbub-seasonal gives June-August; freshview-seasonality April and July-August from an Evesham grower.

#### Marrow, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························aaaaIIIIIIIIIIIIIaaaaa····
Mine     ·················IIIIIIIIIIIIIIIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–October; avail July and November. Sources: New Covent Garden Market.
- **Mine (low):** in May–October. Sources: Kentish Stour Countryside Partnership (secondary), The Vegetarian Society (secondary).

#### Sorrel, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIIIIIIIIIaaaaa·················
Mine     ·············IIIIIIIIIIIIIIIIIIIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–July; avail March and August. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in April–October. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** Category-wide window Apr-Sep (fpj-herbs-uk-kitchens) ends about 4 weeks earlier.

#### Chives, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········aaaaaIIIIIIIIIIIIIIIIIIIIIIaaaa·············
Mine     ·················IIIIIIIIIIIIIIIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–August; avail March and September. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in May–October. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** A Surrey grower expected UK chives from June even in its earliest-ever season (fpj-herbfresh-early-start), about 5 weeks after the start here; this is a single undated year, so the herb-specific season is kept. Category-wide window Apr-Sep (fpj-herbs-uk-kitchens).

#### Girolles, Wild

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················IIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     ··························IIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–October; avail November. Sources: First Nature.
- **Mine (low):** in July–December. Sources: Woodland Trust (primary), Wild Food UK (secondary), Mushroom Diary (secondary), The Staff Canteen (trade).
- **My discrepancy note:** wildfooduk-chanterelle: May-Nov; mushroomdiary-calendar: Jun-Nov. Start differs by about 8 weeks from the primary source, so confidence low.

#### Radishes, (whole) (vs my *Salad radish*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     ········IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–November. Sources: New Covent Garden Market.
- **Mine (low):** in March–October. Sources: The Vegetarian Society (secondary).

#### Mangetout, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················IIIIIIIIIIIII·················
Mine     ··························aaaaIIIIIIIII·············
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–August. Sources: BBC Good Food.
- **Mine (low):** in August–September; avail July. Sources: The Vegetarian Society (secondary), Kentish Stour Countryside Partnership (secondary).

#### Lovage, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············aaaaIIIIIIIIIIIIIIIIIIaaaa·············
Mine     ········IIIIIIIIIIIIIIIIIIIIIIIIIII·················
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–August; avail April and September. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in March–August. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** Category-wide window Apr-Sep (fpj-herbs-uk-kitchens) differs by about 4 weeks at each end.

#### Gooseberries, Wild

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························IIIIIIIIIIIII·············
Mine     ······················IIIIIIIIIIIII·················
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–September. Sources: Forestheart.
- **Mine (low):** in June–August. Sources: Wild Food UK (secondary), The Foraging Course Company (secondary).
- **My discrepancy note:** The Foraging Course Company gives fruit from summer to early autumn (foragingcourse-gooseberry), running about four weeks past Wild Food UK's August end.

## 5. Same supply, different peak (76)

Both say the food is on sale in the same weeks, to within four. They disagree only on which of those weeks are `in`. Most of these come from the year-round rule or from a regional guide's best months.

#### Whelks, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (high):** avail January–December. Sources: Sussex Inshore Fisheries and Conservation Authority (primary), Kent and Essex Inshore Fisheries and Conservation Authority (primary).
- **My discrepancy note:** Pass 3 change: April-June was in; it is a landings peak, not a best-to-eat window, so it is now avail. Landings peaks differ by area: Sussex January-April (sussex-ifca-species); Kent and Essex April-June, or April-July in the 2025 report, with the low in July-September (kefca-whelk-report-2025-01, kefca-whelk-report-2026-01); Eastern IFCA, Norfolk and the Wash, January-June (as quoted in kefca-whe

#### Scallops, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (high):** in November–May; avail June–October. Sources: Sussex Inshore Fisheries and Conservation Authority (primary), Marine Management Organisation (GOV.UK) (primary).
- **My discrepancy note:** The MMO offshore 7d closure (1 July-30 September; open weeks 1-26 and 40-52 by the legal-week rule) is shorter than the Sussex inshore closure (1 June-31 October) by about 4 weeks at each end (mmo-king-scallop-closure-2026, sussex-ifca-regulations). Defra describes the IFCA 3-6nm zone as closed for about six months over summer, roughly May-September (defra-king-scallop-fmp-annexes-2023). Seafish's

#### Brown crab, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaIIIIIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (moderate):** in March–June; avail July–February. Sources: Fish is the Dish (Seafish) (primary), Northumberland Seafood (Amble Development Trust) (secondary), Northumberland Inshore Fisheries and Conservation Authority (primary).
- **My discrepancy note:** The landings sources put the busiest fishing in May-December (mcs-brown-crab-northumberland) and the biggest landings in Q4 (nifca-crab-2023), while the best-quality window is March-June (fitd-crab). The same Seafish page also says fresh crab is best enjoyed April-October; its labelled best-quality months are used.

#### Brown crab, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaIIIIIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (moderate):** in March–June; avail July–February. Sources: Fish is the Dish (Seafish) (primary), Sussex Inshore Fisheries and Conservation Authority (primary), Cefas (via GOV.UK) (primary), Brighton & Newhaven Fish Sales (secondary).
- **My discrepancy note:** Pass 3 change: the earlier in window of August-November was a landings peak, not a best-to-eat window (cefas-crab-assessments-2019), so it is now avail. That peak falls outside the March-June best-quality months (fitd-crab). The same Seafish page also says fresh crab is best enjoyed April-October.

#### Langoustines, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (moderate):** in October–February; avail March–September. Sources: Fish is the Dish (Seafish) (primary), Scottish Government (primary), Marine Conservation Society Good Fish Guide (primary).
- **My discrepancy note:** Pass 3 change: the earlier in window, June-August, was the landings peak (scotgov-nephrops-fmp). It now falls in avail, because the best-quality months are winter (fitd-langoustines).

#### Sardines, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIaaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in August–January; avail February–July. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Marine Stewardship Council (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary).
- **My discrepancy note:** As for Cornish fishery MSC: ffs-seasonality marks best quality Jan-Apr and Oct-Dec against cgsg-sardine's Aug-Jan.

#### Mussels, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (moderate):** in October–March; avail April–September. Sources: Fish is the Dish (Seafish) (primary), The Grocer (trade), Dalegate Market, Burnham Deepdale (secondary), Saveur (secondary).
- **My discrepancy note:** The Brancaster retailer's September-April runs about 4 weeks wider at each end than the Seafish best-quality months (dalegate-brancaster-mussels, fitd-mussels). The Wash dredge notice gives an opening date only (eifca-wash-mussel-dredge-2025). No Eastern IFCA page giving SE months was found.

#### Mussels, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in October–March; avail April–September. Sources: Fish is the Dish (Seafish) (primary), Flying Fish Seafoods (secondary), Cornwall Good Seafood Guide (primary), The Grocer (trade).
- **My discrepancy note:** CGSG (updated October 2017) ticks all 12 months as best to eat for farmed mussels and names no peak (cgsg-mussels). Pass 3 change: the line was in all year.

#### Scallops, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (moderate):** in November–May; avail May–October. Sources: North Eastern Inshore Fisheries and Conservation Authority (primary), Scottish Government (primary), Defra (primary).
- **My discrepancy note:** Seafish's consumer guide gives August-September as best quality and April-September as the most readily available months, UK-wide (fitd-scallops). That clashes with Defra, which says summer scallops are roe-less with poor meat yield (defra-king-scallop-fmp-annexes-2023), and with the legal season. The legal season is kept (rule 4).

#### Dab, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in June–December; avail January–May. Sources: Cornwall Good Seafood Guide (primary), Flying Fish Seafoods (secondary), Marine Conservation Society (primary).
- **My discrepancy note:** cgsg-dab also ticks January, inside its own stated spawning period; rule 1 applied, so January is avail. Flying Fish Seafoods marks no best-quality months for dabs, which on its key means consistent quality all year (flyingfish-seasonality), against the regional guide's window; the primary source is used.

#### Spring greens, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIaaaaaaaaIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–May; avail June–July. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in January–October; avail November–December. Sources: The Vegetarian Society (secondary), Oddbox (secondary), Defra (primary), The Caterer (trade).
- **My discrepancy note:** freshview-seasonality runs January-November; kentishstour-seasonal marks all year.

#### Strawberries, (whole) (vs my *Field & tunnel*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIaaaa·············
Mine     ·················IIIIIIIIIIIIIIIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–August; avail May and September. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in May–October. Sources: Fresh Produce Journal (Fruitnet) (trade), FreshPlaza (trade).

#### Witch sole, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (moderate):** in August–March; avail April–July. Sources: Cornwall Good Seafood Guide (primary), Direct Seafoods (secondary).
- **My discrepancy note:** For the North Sea, the 2026 report says witch spawns from March and should be avoided then (directseafoods-spring-2026), and Northumberland Seafood gives spawning as May-September (northumberland-witch, 2016). The summer 2025 report calls witch in season in summer (directseafoods-summer-2025), inside cgsg-witch's spawning period.

#### Megrim, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (moderate):** in May–December; avail January–April. Sources: Cornwall Good Seafood Guide (primary), Direct Seafoods (secondary).
- **My discrepancy note:** The 2026 report has megrim improving in April (directseafoods-spring-2026), four weeks before cgsg-megrim and the 2025 report.

#### Turbot, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in June–February; avail March–May. Sources: Cornwall Good Seafood Guide (primary), Direct Seafoods (secondary), Flying Fish Seafoods (secondary).
- **My discrepancy note:** cgsg-turbot says turbot spawn April-August in most of their range, which overlaps its June-August ticks; the ticks are used. Flying Fish Seafoods marks no best-quality months for turbot, which on its key means consistent quality all year (flyingfish-seasonality), against the regional guide's window; the primary source is used.

#### Skates and rays, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in June–February; avail March–May. Sources: Cornwall Good Seafood Guide (primary).
- **My discrepancy note:** Cuckoo and small-eyed ray are ticked from July, not June (cgsg-cuckoo-ray, cgsg-small-eyed-ray); spotted ray is ticked all year (cgsg-spotted-ray). Thornback lay eggs March-September (ices-fishmap-thornback) and blonde ray February-August (cgsg-blonde-ray), overlapping the June-August ticks. Flying Fish Seafoods marks no best-quality months for skate wings, which on its key means consistent qualit

#### Watercress, Cultivated

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaaaaaIIIIIIIIIIIIIaaaaaaaaa····
Mine     ·················IIIIIIIIIIIIIIIIIIIIIIIIIIaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–September; avail May–June and October–November. Sources: New Covent Garden Market.
- **Mine (moderate):** in May–October; avail November. Sources: FarmingUK (trade), Dorset View (secondary), Farming Monthly (trade), HortiDaily (trade).
- **My discrepancy note:** In 2023 The Watercress Company's managing director said the UK season usually runs May to November (dorsetview-watercress-2023), about four weeks longer than its late-October end in 2020 (farminguk-watercress-2020); the 2023 source is local news, so the trade source's end date is kept and November stays avail. vegsoc-seasonal gives March-December; kentishstour-seasonal March-November.

#### Sea kale, Forced

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIII··························IIII
Mine     IIIIIIIIIIIIIaaaaaaaaa··························aaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in December–May. Sources: Westlands.
- **Mine (moderate):** in January–March; avail April–May and December. Sources: Fresh Produce Journal (Fruitnet) (trade), The Grocer (trade), The List (secondary), The Staff Canteen (trade).
- **My discrepancy note:** A Westlands advertorial (Jan 2017) gives a December to May season (staffcanteen-westlands-sea-kale-2017); December and April to May kept as avail.

#### Lamb, Salt marsh

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················aaaaIIIIIIIIIIIIIIIIIaaaaaaaaa
Mine     ······················IIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–October; avail June and November–December. Sources: Farm Contractor.
- **Mine (moderate):** in June–December. Sources: Defra (GOV.UK) (primary), Farmers Weekly, quoting a Holker Estate tenant (trade), Lishman's of Ilkley (butcher) (secondary).

#### Peppers, Glasshouse

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············aaaaaaaaaaaaaIIIIIIIIIIIIIaaaaaaaaa····
Mine     ············aaaaaaaaaaIIIIIIIIIIIIIaaaaaaaaaaa······
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–September; avail April–June and October–November. Sources: Defra.
- **Mine (moderate):** in June–August; avail March–May and September–November. Sources: Horticultural Development Company, a division of AHDB (primary), HortiDaily (trade), Lea Valley Growers Association (primary), Defra (primary).
- **My discrepancy note:** The Lea Valley growers' secretary said the 2017 crop started in January and would run to November (hortidaily-peppers-lvga-2017), about ten weeks earlier than AHDB's start; Defra also has a home-grown elongated pepper quote in December 2025. Defra's last quote (12 Oct 2026) is about five weeks before AHDB's mid-November end. AHDB dates used.

#### Broccoli, Calabrese

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     ·················IIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–October; avail May and November. Sources: New Covent Garden Market, Defra, RHS, Garden Organic.
- **Mine (moderate):** in May–November. Sources: AHDB Horticulture (primary), Defra (primary), FreshPlaza (trade).
- **My discrepancy note:** Defra quotes home-grown calabrese from early June to late October (weeks 23-43; November not in the data read); vegsoc-seasonal gives June-October. Riviera's comment implies a normal start in late June (about week 25).

#### Hake, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in April–January; avail February–March. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary), ITV News (secondary).
- **My discrepancy note:** ffs-seasonality marks no best-quality months for it (meaning consistent quality all year), against cgsg-hake's Feb-Mar spawning gap; CGSG kept.

#### Whiting, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in May–February; avail March–April. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary).
- **My discrepancy note:** ffs-seasonality marks no best-quality months for it (meaning consistent quality all year), against cgsg-whiting's Mar-Apr gap; CGSG kept.

#### John Dory, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in April–January; avail February–March. Sources: Cornwall Good Seafood Guide (Cornwall Wildlife Trust) (primary), Flying Fish Seafoods (secondary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary).
- **My discrepancy note:** ffs-seasonality marks no best-quality months for it (meaning consistent quality all year), against cgsg-john-dory's Feb-Mar gap; CGSG kept. seafish-seafood-guide (2009, background only) lists it as available all year.

#### Octopus, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (moderate):** in May–February; avail March–April. Sources: Cornwall Good Seafood Guide (primary), Flying Fish Seafoods (secondary), Marine Conservation Society (primary).
- **My discrepancy note:** Flying Fish Seafoods marks no best-quality months for octopus, which on its key means consistent quality all year (flyingfish-seasonality), against the regional guide's window; the primary source is used.

#### Pears, Williams

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························aaaaaIIIIaaaa·········
Mine     ································IIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September; avail August and October. Sources: New Covent Garden Market.
- **Mine (moderate):** in August–October. Sources: British Apples & Pears Ltd (primary).

#### Morels, Wild

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ········IIIIIIIIIIIIIIaaaa··························
Mine     ········aaaaaIIIIIIIII······························
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–May; avail June. Sources: First Nature.
- **Mine (moderate):** in April–May; avail March. Sources: The Wildlife Trusts (primary), Woodland Trust (primary), Royal Botanic Gardens, Kew (Grow Wild) (primary).
- **My discrepancy note:** woodlandtrust-morel: Mar-May; wildlifetrusts-morel: Apr-May.

#### Lamb, Hogget

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    aaaaIIIIIIIIIIIIIaaaaa······························
Mine     IIIIIIIIIIIIIaaaaaaaaaa·····························
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in February–April; avail January and May. Sources: Lishman's.
- **Mine (moderate):** in January–March; avail April–June. Sources: National Sheep Association (primary), Quality Meat Scotland (primary), AHDB (primary).
- **My discrepancy note:** The tail-off varies by year: QMS 2026 shows a sharp drop after Easter (early April); QMS 2013 and AHDB 2023 show hoggs still on the market in May and early June.

#### Broad beans, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················aaaaIIIIIIIIIaaaa·············
Mine     ······················IIIIIIIIIaaaaaaaa·············
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–August; avail June and September. Sources: New Covent Garden Market, Defra.
- **Mine (moderate):** in June–August; avail August–September. Sources: Defra (primary), lovefood.com (secondary), Food and Travel (secondary), The Vegetarian Society (secondary).
- **My discrepancy note:** lovefood-peas-broad-beans names July and August as the best months, ending about four weeks after the last Defra quote; vegsoc-seasonal gives June to August.

#### Sweet chestnuts, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·······································IIIIIIIIIaaaa
Mine     ·······································IIIIaaaaaa···
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October–November; avail December. Sources: Common knowledge — includes "common knowledge".
- **Mine (moderate):** in October; avail November–December. Sources: Woodland Trust (primary), National Geographic (secondary).

#### Lamb, New-season

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············aaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIaaaa
Mine     ·············aaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–November; avail April–May and December. Sources: National Sheep Association, AHDB, AHDB.
- **Mine (moderate):** in August–November; avail April–July and December. Sources: National Sheep Association (primary), AHDB (primary), Quality Meat Scotland (primary), FarmingUK, quoting Hybu Cig Cymru (trade).
- **My discrepancy note:** AHDB says late summer and early autumn (August to October); NSA says autumn (September to November); HCC puts the Welsh peak in August to early September (farminguk-hcc-lamb-season). The in window spans August to November to cover both primary sources.

#### Blackcurrants & Redcurrants, (whole) (vs my *all lines combined*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························aaaaIIIII·················
Mine     ······················aaaIIIIIIIIaa·················
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August; avail July. Sources: New Covent Garden Market, Defra.
- **Mine (low/moderate):** in June–August; avail June and August. Sources: Fresh Produce Journal (Fruitnet), quoting the Blackcurrant Foundation (trade), Fruit & Vine, quoting the Blackcurrant Foundation (trade), Fruit & Vine (trade), Countryside (NFU) (trade), Defra (primary), Borough Market (secondary), Rectory Farm (Stanton St John, Oxford) (secondary), The Vegetarian Society (secondary).
- **My discrepancy note:** Other secondary lists give June to August (vegsoc-seasonal) and, for Scotland, end of May to end of July (courier-scotland-july). The Norfolk grower profile also says the season usually ends in early August (countryside-blackcurrant-grower), about two weeks before its own mid-August end. Defra's 2026 quotes start about five weeks after the secondary sources' late-June start and run about four week

#### Cod, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** avail January–December. Sources: Northumberland Seafood (Amble Development Trust) (secondary), Marine Conservation Society, Good Fish Guide (primary), Undercurrent News (trade), Seafish (primary).

#### Cod, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail January–December. Sources: Kent and Essex Inshore Fisheries and Conservation Authority (primary), Brighton & Newhaven Fish Sales (secondary), Marine Conservation Society, Good Fish Guide (primary), Undercurrent News (trade).

#### Haddock, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** avail January–December. Sources: Northumberland Seafood (Amble Development Trust) (secondary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary), Northumberland Seafood (primary).

#### Haddock, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail January–December. Sources: Brighton & Newhaven Fish Sales (secondary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary), Brighton & Newhaven Fish Sales (primary).

#### Pollock, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** avail January–December. Sources: UK Government (Offshore Energy Strategic Environmental Assessment) (primary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary), Northumberland Seafood (Amble Development Trust) (secondary).

#### Monkfish, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail January–December. Sources: Brighton & Newhaven Fish Sales (secondary), Marine Conservation Society, Good Fish Guide (primary).

#### Gurnard, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** avail January–December. Sources: UK Government (Offshore Energy Strategic Environmental Assessment) (primary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary).

#### Skates and rays, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** avail January–December. Sources: Marine Conservation Society (primary).

#### Skates and rays, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail January–December. Sources: Kent and Essex IFCA (primary), Kent and Essex Inshore Fisheries and Conservation Authority (primary), Brighton & Newhaven Fish Sales (secondary).
- **My discrepancy note:** The same profile says thornback are traditionally present from early spring to late autumn (kefca-thornback-smp-2014), and they lay eggs inshore March-September (ices-fishmap-thornback, kentessex-ifca-thornback); its explicit all-year season is used (rule 1).

#### Dab, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** avail January–December. Sources: Northumberland Seafood (Amble Development Trust) (secondary), Marine Conservation Society (primary), Northumberland Seafood (primary).

#### Halibut, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** avail January–December. Sources: Northumberland Seafood (Amble Development Trust) (secondary), Cornwall Good Seafood Guide (primary), Marine Conservation Society (primary).

#### Monkfish, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaa
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–November; avail December. Sources: Northumberland Seafood.
- **Mine (low):** avail January–December. Sources: Northumberland Seafood (Amble Development Trust) (secondary), Marine Conservation Society, Good Fish Guide (primary).

#### Hake, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    aaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–December; avail January–February. Sources: Northumberland Seafood.
- **Mine (low):** avail January–December. Sources: Scottish Government (primary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary), Northumberland Seafood (Amble Development Trust) (secondary).

#### Whiting, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** in December–February; avail March–November. Sources: Northumberland Seafood (Amble Development Trust) (secondary), Marine Conservation Society, Good Fish Guide (primary), UK Government (Offshore Energy Strategic Environmental Assessment) (primary).

#### Squid, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** in December–February; avail March–November. Sources: Direct Seafoods (secondary), The Fishing Daily (trade), UK Government (GOV.UK assets), Offshore Energy SEA (primary), Seafish (primary).
- **My discrepancy note:** The best-to-eat source (December-February) and the landings source (mostly May-October) disagree about when squid is landed; in is kept (rule 5). The 2009 national guide, now background only, gave best October-March (seafish-seafood-guide).

#### Squid, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** in December–February; avail March–November. Sources: Direct Seafoods (secondary), UK Government (GOV.UK assets) (primary), Seafish (primary), Brighton & Newhaven Fish Sales (secondary).
- **My discrepancy note:** gov-sea4-cephalopods puts squid in the southern North Sea mainly in late spring and summer, outside the winter in-season window. The 2009 national guide, now background only, said squid was available all year, best October-March (seafish-seafood-guide).

#### Lemon sole, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** in June–August; avail September–May. Sources: Direct Seafoods (secondary), Northumberland Seafood (Amble Development Trust) (secondary).
- **My discrepancy note:** The winter 2025 report says lemon sole spawns in summer (directseafoods-winter-2025), against spring in Seafish's 2014 species guide (seafish-lemon-sole). The 2009 national guide, now background only, gave a season of May-March (seafish-seafood-guide), much wider than the summer window here.

#### Lemon sole, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** in June–August; avail September–May. Sources: Direct Seafoods (secondary), Brighton & Newhaven Fish Sales (secondary).
- **My discrepancy note:** The winter 2025 report says lemon sole spawns in summer (directseafoods-winter-2025), against spring in Seafish's 2014 species guide (seafish-lemon-sole). The 2009 national guide, now background only, gave a season of May-March (seafish-seafood-guide), much wider than the summer window here.

#### Wood sorrel, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Forestheart.
- **Mine (low):** in March–May; avail June–February. Sources: Galloway Wild Foods (secondary), BBC Countryfile (secondary), Wild Food UK (secondary), The Foraging Course Company (secondary).

#### Mackerel, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    aaaaaaaa·····IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     aaaaaaaa·····aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–November; avail January–February. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail January–February and April–November. Sources: Kent and Essex Inshore Fisheries and Conservation Authority (primary), Sussex Inshore Fisheries and Conservation Authority (primary), Brighton & Newhaven Fish Sales (secondary).
- **My discrepancy note:** cgsg-mackerel (western Channel) marks Jan-Mar and Jul-Dec as best to eat. seafish-seafood-guide (2009) is background only under the fish brief (all year, best in summer); its in weeks (Jun-Aug) were dropped.

#### Hake, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ····aaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     ····aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–October; avail February and November. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail February–November. Sources: Marine Conservation Society, Good Fish Guide (primary), Sussex Inshore Fisheries and Conservation Authority (primary), Kent and Essex Inshore Fisheries and Conservation Authority (primary).

#### Gurnard, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIII·················IIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaaaaaa·················aaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in October–May. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail October–May. Sources: Kent and Essex Inshore Fisheries and Conservation Authority (primary), Sussex Inshore Fisheries and Conservation Authority (primary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary).

#### Grey mullet, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
Mine     ·············aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–November. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail April–November. Sources: Kent and Essex Inshore Fisheries and Conservation Authority (primary), Marine Conservation Society, Good Fish Guide (primary).

#### Rosemary, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in May–August; avail September–April. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** Category-wide window Apr-Sep (fpj-herbs-uk-kitchens) is not specific to evergreen herbs.

#### Red mullet, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······················IIIIIIIIIIIIIaaaaIIIIIIIIIIIII
Mine     ······················aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–August and October–December; avail September. Sources: Northumberland Seafood.
- **Mine (low):** avail June–December. Sources: Northumberland Seafood (Amble Development Trust) (secondary), Marine Conservation Society, Good Fish Guide (primary), Seafish (primary), Northumberland Seafood (primary).

#### Sardines, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    aaaaaaaa······················IIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaa······················aaaaaaaaaaaaaaaaaaaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–December; avail January–February. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail August–February. Sources: Marine Conservation Society, Good Fish Guide (primary), Sussex Inshore Fisheries and Conservation Authority (primary), Kent and Essex Inshore Fisheries and Conservation Authority (primary).

#### Squid, South West

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Flying Fish Seafoods.
- **Mine (low):** in July–February; avail March–June. Sources: Cornwall Good Seafood Guide (primary), Flying Fish Seafoods (secondary), Direct Seafoods (secondary).
- **My discrepancy note:** cgsg-squid-european ticks July-January, leaving February unticked. Flying Fish Seafoods marks October-March as best quality (flyingfish-seasonality), and a national market report says native squid is in season in winter (directseafoods-winter-2025): both start about thirteen weeks later than cgsg-squid-veined, so confidence is low.

#### Cucumber, Glasshouse

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ····aaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaaa····
Mine     IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–October; avail February and November. Sources: Defra.
- **Mine (low):** in January–November. Sources: AHDB Horticulture (primary), Defra (primary), Kentish Stour Countryside Partnership (secondary), Farm-Direct (secondary).
- **My discrepancy note:** Defra quotes home-grown cucumbers only from mid-March to mid-October (weeks 11-41), over 4 weeks shorter at each end than AHDB; kentishstour-seasonal gives protected April-September.

#### Tarragon, (whole) (vs my *Outdoor*)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················aaaaaIIIIIIIIIIIIIIIIIaaaa·········
Mine     ·············IIIIIIIIIIIIIIIIIIIIIIIIIIIIII·········
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in June–September; avail May and October. Sources: Common knowledge — includes "common knowledge".
- **Mine (low):** in April–October. Sources: Royal Horticultural Society (secondary), Fresh Produce Journal (trade).
- **My discrepancy note:** Category-wide window Apr-Sep (fpj-herbs-uk-kitchens) ends about 4 weeks earlier.

#### Cuttlefish, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·············IIIIIIIIIIIII··························
Mine     ·············aaaaaaaaaaaaaaaaa······················
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in April–June. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail April–July. Sources: Marine Management Organisation (primary), Brighton & Newhaven Fish Sales (secondary).
- **My discrepancy note:** Seafish says the south-coast trap fishery usually runs in summer and autumn, when cuttlefish come inshore to spawn (seafish-gear-cuttlefish-pots), against April-July from the MMO, a gap of more than four weeks. A University of Brighton project, run 2018-19, describes the Hastings fishery as seasonal and targeting the overwintering population, without months (brighton-sepia-hastings).

#### Turbot, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** in June–February; avail March–May. Sources: Direct Seafoods (secondary), Northumberland Seafood (Amble Development Trust) (secondary).
- **My discrepancy note:** northumberland-turbot's April-August breeding overlaps June-August, which the market reports treat as in season.

#### Turbot, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** in June–February; avail March–May. Sources: Direct Seafoods (secondary), Brighton & Newhaven Fish Sales (secondary).

#### Ling, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIaaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** in June–February; avail March–May. Sources: Northumberland Seafood (Amble Development Trust) (secondary), Scottish Government (primary), Marine Conservation Society, Good Fish Guide (primary).
- **My discrepancy note:** govscot-ling-fmp-2025 gives Northern Shelf spawning as April-June at 100-300 m, about a month later than northumberland-ling's spring, and does not link it to eating or catch timing.

#### Fennel, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ··························IIIIIIIIIIIIIIIIIIIIII····
Mine     ··························IIIIIIIIIaaaaaaaaaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in July–November. Sources: New Covent Garden Market.
- **Mine (low):** in July–August; avail September–November. Sources: The Vegetarian Society (secondary), Kentish Stour Countryside Partnership (secondary).
- **My discrepancy note:** vegsoc-seasonal: July to August; kentishstour-calendar: July to November. The shared months are in, the rest avail.

#### Hedgehog fungus, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························IIIIIIIIIIIIIIIIIIIIII
Mine     ······························IIIIIIIIIIIIIaaaaa····
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in August–December. Sources: First Nature.
- **Mine (low):** in August–October; avail November. Sources: Wild Food UK (secondary), Mushroom Diary (secondary), The Staff Canteen (trade).

#### Plaice, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** in April–December; avail January–March. Sources: Direct Seafoods (secondary).
- **My discrepancy note:** The 2009 national guide, now background only, gave best May-January (seafish-seafood-guide): about four weeks later at the start, and January in, against the 2025-26 reports.

#### Dover sole, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** in July–March; avail April–June. Sources: Direct Seafoods (secondary), Northumberland Seafood (Amble Development Trust) (secondary).
- **My discrepancy note:** Northumberland Seafood says sole is at its best April-June (northumberland-dover-sole, 2016), the opposite of the 2026 report; the newer source is used. The spring 2025 report put best quality from May (directseafoods-spring-2025), against July here.

#### Dover sole, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     IIIIIIIIIIIIIaaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** in July–March; avail April–June. Sources: Direct Seafoods (secondary), Sussex IFCA (primary).
- **My discrepancy note:** Sussex IFCA's main sole seasons are spring and autumn (sussex-ifca-commercial), and Essex sole peaked around June 2025 (kefca-essex-2025-jan-jun): both partly inside the April-June spawning window that the 2026 report advises avoiding. The spring 2025 report put best quality from May (directseafoods-spring-2025).

#### Brill, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** in April–December; avail January–March. Sources: Direct Seafoods (secondary).

#### Brill, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** in April–December; avail January–March. Sources: Direct Seafoods (secondary).

#### Herring, North East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
Mine     aaaaaaaaIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIaaaa
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in January–December. Sources: Northumberland Seafood.
- **Mine (low):** in March–November; avail December–February. Sources: Northumberland Seafood (Amble Development Trust) (secondary), Fish Focus (trade), Marine Stewardship Council (primary).
- **My discrepancy note:** The second pass had in = mid-Jul-Aug from the fishery report alone (fishfocus-mackerel-2024); under the fish brief that is a landings window, and the Northumberland best-to-eat window is wider. gov-sea4-fish-baseline gives Aug-Sep Buchan/Shetland spawning, inside the in window; no source links it to eating quality.

#### Spider crab, South East

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·················IIIIIIIII··························
Mine     ·················aaaaaaaaa··························
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in May–June. Sources: Brighton & Newhaven Fish Sales.
- **Mine (low):** avail May–June. Sources: North Norfolk News (secondary), Sussex Inshore Fisheries and Conservation Authority (primary), Brighton & Newhaven Fish Sales (secondary).

#### Hops, Shoots

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ·········IIIIIIIII··································
Mine     ·········aaaaIIII···································
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in March–May. Sources: Forestheart.
- **Mine (low):** in April; avail March. Sources: Slow Food in the UK (secondary), Totally Wild UK (secondary), Hogs Back Brewery (secondary), British Guild of Beer Writers (trade).
- **My discrepancy note:** slowfood-hopshoots starts in March (week 10); totallywild-hops starts in early April (week 14).

#### Damsons, (whole)

```
         J   F   M    A   M   J    J   A   S    O   N   D    
Yours    ······························aaaaaIIII·············
Mine     ······························IIIIIIIII·············
```
*Key: I = in season · a = avail · s = store · · = none*

- **Yours:** in September; avail August. Sources: New Covent Garden Market.
- **Mine (low):** in August–September. Sources: The Vegetarian Society (secondary), Royal Horticultural Society (secondary).

## 6. I found no data, so yours stands (4)

- Radishes, Mooli: yours is in June–November; avail May and December (New Covent Garden Market)
- Lettuce, Curly: yours is in July–October; avail May–June and November (New Covent Garden Market)
- Courgette flowers, (whole): yours is in June–August (BBC Good Food)
- Grapes, (whole): yours is in September–October; avail August (RHS, FreshPlaza)

## 7. Agree (63)

Romanesco, Runner & French beans, Quince, Bilberries, Spruce tips, Coriander, Mint, Plums, Elderflower, Wild duck, Gooseberries (Cultivated), Hazelnuts (Cultivated), Spinach, Sea kale (Wild), Apples (Braeburn), Apples (Golden Delicious), Apples (Royal Gala), Apples (Russet), Dill, Sea bass (South East), Clams (South West), Goose, Grouse, Partridge, Asparagus, Apples (Cox), Figs, Sea trout (North East), Pheasant, Woodcock, Venison (Red & fallow), Hare, Cauliflower, Pak choi (Glasshouse), Lettuce (Glasshouse), Rocket, Cress, Apples (Bramley), Cherries, Loganberries & Tayberries, Giant puffball, Oyster mushrooms (Cultivated), Cultivated mushrooms, Shiitake, Bay, Lobster (North East), Lobster (South East), Lobster (South West), Oysters (Rock), Oysters (Porthilly rock), Scallops (Orkney, hand-dived), Farmed salmon (Glenarm, Northern Ireland), Farmed salmon (Loch Duart, Scotland), Beef, Pork, Venison (Roe), Venison (Chinese water deer), Venison (Muntjac), Wood pigeon, Rabbit, Squirrel, Chicken, Duck.

## 8. Lines I have that you don't (48)

These are splits the research found. Each has a reason in its `notes.season`.

- horseradish: Wild (method, low)
- potatoes: Pembrokeshire (region, high)
- potatoes: Cornish (region, low)
- leeks: Welsh (PGI) (region, high)
- broccoli: Purple sprouting, summer (variety, moderate)
- cabbage: Pointed (variety, moderate)
- watercress: Glasshouse (method, moderate)
- asparagus: Protected (method, moderate)
- celery: Fenland (region, high)
- squash: Summer (variety, low)
- damsons: Westmorland (region, moderate)
- raspberries: Glasshouse (method, low)
- strawberries: Glasshouse (method, moderate)
- wild-garlic: Scotland (region, low)
- samphire: Rock samphire (variety, low)
- samphire: Glasshouse (hydroponic) (method, moderate)
- bilberries: Scotland (region, moderate)
- basil: Glasshouse (method, moderate)
- chives: Glasshouse (method, low)
- coriander: Glasshouse (method, moderate)
- dill: Glasshouse (method, low)
- marjoram-oregano: Glasshouse (method, low)
- mint: Glasshouse (method, moderate)
- parsley: Glasshouse (method, moderate)
- rosemary: Glasshouse (method, moderate)
- sage: Glasshouse (method, low)
- sorrel: Glasshouse (method, low)
- tarragon: Glasshouse (method, low)
- thyme: Glasshouse (method, moderate)
- tea: Scotland (region, low)
- herring: SE (region, moderate)
- ling: SW (region, moderate)
- halibut: Farmed (method, low)
- skates-and-rays: Undulate ray (Channel) (variety, high)
- brown-crab: Norfolk (Cromer) (region, moderate)
- langoustines: Farn Deeps (region, low)
- oysters: Native – Colchester (region, high)
- spider-crab: SW (region, moderate)
- turkey: Turkey (whole, moderate)
- grouse: Northern Ireland (region, high)
- pheasant: Northern Ireland (region, high)
- partridge: Northern Ireland (region, high)
- wild-duck: GB foreshore (region, high)
- woodcock: Scotland (region, high)
- venison: Red & fallow, Scotland (region, high)
- venison: Farmed (method, moderate)
- hare: Scotland (region, high)
- hare: Northern Ireland (region, high)

## 9. Sources

- You cite 60 sources and I cite 701. Only 30 websites appear in both: agriland.co.uk, ahdb.org.uk, basc.org.uk, brighton-fish-sales.co.uk, britishapplesandpears.co.uk, businesswales.gov.wales, countrylife.co.uk, devonandsevernifca.gov.uk, en.wikipedia.org, farming.co.uk, first-nature.com, flyingfishseafoods.co.uk, foodingredientsfirst.com, freshplaza.com, fruitnet.com, fwi.co.uk, gallowaywildfoods.com, gov.uk, greatbritishchefs.com, legislation.gov.uk, lishmansbutchers.co.uk, mcsuk.org, msc.org, nature.scot, newcoventgardenmarket.com, northumberlandseafood.co.uk, rhs.org.uk, seafish.org, thestaffcanteen.com, tregothnan.co.uk.
- Your rings citing "common knowledge" (38): Basil, Bay, Beef, Bilberries, Brown shrimp, Ceps, Chervil, Chicken, Chives, Cockles, Coriander, Crab apples, Dandelion, Dill, Duck, Elderberries, Elderflower, Field mushrooms, Lovage, Marjoram & Oregano, Meadowsweet, Mint, Nettles, Parsley, Pork, Rosehips, Rosemary, Sage, Sea beet, Sea buckthorn, Sloes, Sorrel, Squirrel, Sweet chestnuts, Tarragon, Thyme, Wild garlic, Wild strawberries.
