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

The workbook was inspected programmatically and parsed locally from the official `.xls` file. The raw workbook is not stored in the repository. `xlrd` was used locally for extraction only and was not added as a project dependency.

## Basket Items Populated

The Tokyo Metro basket row uses the official regular ticket fare table. It records the minimum adult fare band, 1-6 km, as a conservative single-ride benchmark. Tokyo Metro fares vary by distance, so this should be treated as a clean fare-table benchmark rather than an average tourist ride cost.

## Remaining Japan Work

- Parse additional Japan Tourism Agency workbook tables, especially total trip expenditure per person by nationality/region and any length-of-stay context useful for per-day normalization.
- Decide how to map JTA spend categories into tourist-basket categories without double counting package-tour components.
- Pin exact downloadable endpoints for relevant JNTO dynamic graph tables if available.
- Identify an official JR/Shinkansen fare reference before populating intercity rail benchmarks.
- Add city-level accommodation/item prices only when official or high-confidence source-backed data is available.
