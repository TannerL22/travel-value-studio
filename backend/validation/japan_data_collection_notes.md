# Japan Official Data Collection Notes

This pass starts the Japan side of the Japan/Taiwan validation scaffold using official sources only. It does not prove a Japan/Taiwan value conclusion yet.

## Official Pages Inspected

- Japan Tourism Agency International Visitor Survey landing page: `https://www.mlit.go.jp/kankocho/en/siryou/toukei/syouhityousa.html`
- Japan Tourism Agency Calendar Year 2025 Excel file: `https://www.mlit.go.jp/kankocho/content/001992700.xls`
- JNTO Japan Tourism Statistics graph portal: `https://statistics.jnto.go.jp/en/graph/`
- Tokyo Metro regular ticket fare page: `https://www.tokyometro.jp/en/ticket/regular/index.html`

## Data Parsed

`japan_official_visitor_spend.csv` was populated from the Japan Tourism Agency Calendar Year 2025 workbook, `Annex 2`.

Fields extracted:

- visitor origin market
- spend category
- expenditure value in JPY
- expenditure basis
- source period
- source confidence

`japan_official_length_of_stay.csv` was populated from the same workbook, `Table 4-1 Average Number of Nights - by Nationality/Region`.

Fields extracted:

- visitor origin market
- average number of nights
- stay basis
- source period
- source confidence

`japan_official_visitor_spend_per_day.csv` was derived by dividing official Annex 2 per-trip spend by official Table 4-1 average nights for matching origin markets. `japan_official_visitor_spend_summary.csv` provides a compact view for Total, UK, Taiwan, and United States origin markets.

The workbook was inspected programmatically and parsed locally from the official `.xls` file. The raw workbook is not stored in the repository. `xlrd` was used locally for extraction only and was not added as a project dependency.

## Per-Day Normalization Caveats

- The official length-of-stay table reports average nights, not calendar days. The validation files keep `stay_basis` as `nights` and use the value as a per-day denominator only for approximate validation.
- Origin-market matching is exact by the workbook's nationality/region labels. Per-day values are only calculated where spend and length-of-stay markets match.
- Package-tour components and domestic revenue out of package-tour costs can affect category interpretation.
- The official `Transport` category includes local and intercity transport, so the summary leaves `local_transport_per_day_jpy` blank rather than forcing a misleading local-only estimate.
- The food/drink summary maps only to the official `Restaurant, fast food, cafe etc.` category; it does not include all food-related shopping.

## Basket Items Populated

The Tokyo Metro basket row uses the official regular ticket fare table. It records the minimum adult fare band, 1-6 km, as a conservative single-ride benchmark. Tokyo Metro fares vary by distance, so this should be treated as a clean fare-table benchmark rather than an average tourist ride cost.

## Remaining Japan Work

- Parse additional Japan Tourism Agency workbook tables, especially purpose-of-visit splits and any fields useful for converting survey categories into a tourist basket without double counting.
- Decide how to map JTA spend categories into tourist-basket categories without double counting package-tour components.
- Pin exact downloadable endpoints for relevant JNTO dynamic graph tables if available.
- Identify an official JR/Shinkansen fare reference before populating intercity rail benchmarks.
- Add city-level accommodation/item prices only when official or high-confidence source-backed data is available.
