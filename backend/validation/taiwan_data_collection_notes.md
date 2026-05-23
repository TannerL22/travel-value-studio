# Taiwan Official Data Collection Notes

This pass starts the Taiwan side of the Japan/Taiwan validation scaffold using official Taiwan Tourism Administration sources only. It does not prove a Japan/Taiwan value conclusion yet.

## Official Pages Inspected

- Taiwan Tourism Administration visitor consumption and trends survey page: `https://admin.taiwan.net.tw/BusinessInfo/Articles?a=14693`
- 2024 summary PDF: `https://admin.taiwan.net.tw/fapi/AttFile?id=38415&type=AttFile`
- 2024 detailed PDF: `https://admin.taiwan.net.tw/fapi/AttFile?id=38416&type=AttFile`

The landing page lists both 2024 PDF attachments. The summary PDF is about 993 KB and the detailed report is about 16 MB.

## Data Parsed

`taiwan_official_visitor_spend.csv` was populated from the 2024 summary PDF with headline Total-level values:

- average spend per person per day: TWD 5,870 / USD 182.83
- average spend per person per trip: TWD 40,975 / USD 1,276
- total tourism expenditure excluding international airfare: TWD 321.967 billion / USD 10.028 billion
- broad per-day category values from the summary text/Table 17: hotel expenditure, food and drink outside hotels, domestic transport, entertainment, miscellaneous, and shopping

`taiwan_official_length_of_stay.csv` was populated from the same summary PDF:

- average stay: 6.98 nights

`taiwan_official_visitor_spend_per_day.csv` keeps the officially reported per-day values rather than forcing a derived value. The reported per-trip value divided by average nights reconciles within rounding.

`taiwan_official_visitor_spend_summary.csv` provides a compact Total row for comparison with Japan.

## Caveats

- The Taiwan source reports average stay in nights, not calendar days.
- Headline per-day and per-trip spend are official reported values. Category TWD values are derived from official USD category values using the report's official 2024 average exchange rate of 32.108 TWD/USD.
- Category values are broad survey spend categories, not observed item prices for hotels, meals, metro rides, or attractions.
- The summary PDF includes major-market per-day spend narrative, but this pass does not populate origin-market detail because matching origin-level length-of-stay and per-trip values were not extracted cleanly.
- The detailed PDF was identified and text-extracted, but deeper table parsing is left for a later focused pass because the report is large and category/origin tables need careful mapping.
- Taiwan category labels do not map one-to-one with Japan JTA categories. Any Japan/Taiwan comparison should use only fields that exist cleanly for both countries or explicitly document the mapping.

## Remaining Taiwan Work

- Parse the detailed PDF tables for origin-market category spend only if the table structure can be extracted reliably.
- Confirm whether official machine-readable Taiwan tourism statistics are available for these survey outputs.
- Add official Taipei Metro and Taiwan High Speed Rail fare-table items separately.
- Build a comparison summary using only comparable Japan and Taiwan fields.
