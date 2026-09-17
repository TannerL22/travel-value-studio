# Frontend v2 Phase 10 — Product Polish, Performance & QA

Date: 2026-09-17

## Scope

Phase 10 is the final frontend product pass. It intentionally preserves the production ranking model and the Phase 1–9 information architecture while tightening visual hierarchy, client work, and the main user journeys.

## Product polish completed

- Reduced the repeated rounded-card / micro-label / uppercase-tracking visual language on the primary product surfaces.
- Reworked the global header into a quieter product navigation bar.
- Flattened the Discover preference summary into one contextual strip instead of five boxed controls.
- Simplified destination results: rank + ISO context are compact, condition scores are plain text rather than pills, metrics use one divider, and explanatory drivers remain tied to backend effects.
- Reworked country detail into a more editorial page: lighter hero, restrained single destination image, flatter ranking-driver/value/foundation sections, and less nested card chrome.
- Reworked comparison selector, selected-country summaries, trade-off interpretation, and scope note into the same restrained visual system.
- Reworked the plain-language methodology flow so the five steps read as one sequence rather than five dashboard cards.
- Preserved the technical/advanced evidence views where denser bordered structures genuinely help auditability.

## Performance and correctness changes

### Destination-result rerenders

`DestinationResult` is memoized and now receives stable selection/hover callbacks instead of a new row-specific click closure on every ranking-list render. This reduces avoidable rerenders when map/list hover state changes.

### Motion runtime

The live Discover surface no longer imports Framer Motion. The interface uses simple CSS state transitions; reduced-motion behavior from Phase 9 remains intact through global CSS. The package is still present in the dependency manifest/lockfile and can be removed in a future dependency-maintenance pass.

### Map loading

The D3 world map is now loaded through a dynamic import. The desktop map is mounted only when a desktop media query matches. On smaller screens the ranking list remains primary and the map chunk is not mounted until the user explicitly opens Map.

This keeps the map available without making closed mobile-map usage pay the full rendering cost up front.

### Country imagery

The Pexels proxy had a cache-shape bug: a fresh response returned `{ url, photographer, photographer_url }`, while an in-memory cache hit returned the raw Pexels photo object. Country detail expects `data.url`, so repeat cache hits could silently lose the image.

Phase 10 now caches and returns one stable response shape. It also prefers Pexels `large` over `large2x` for the restrained detail panel and adds shared/CDN stale-while-revalidate cache headers.

## Code-level user-flow audit

The following flows were traced through the current route and state code:

1. **Discover → change reference market/preferences**
   - Semantic controls still map to the same continuous backend values.
   - Ranking requests remain debounced.
   - URL state remains bookmarkable/shareable.

2. **Discover → sort**
   - Sort changes presentation order only.
   - Backend `rank` remains visible and is not recomputed in the frontend.
   - Map colour remains Quality-Adjusted Value.

3. **Discover list/map → country**
   - Active preference query is preserved in `/country/{ISO3}`.
   - Mobile map is still a focus-trapped dialog.

4. **Country → Compare / Methodology / Back**
   - All links preserve the same preference context.
   - Housing remains explicitly outside the score.

5. **Country → city shortlist**
   - City Usability remains separate from country ranking.
   - Mobility/Digital remain labelled as national context.
   - Technical city evidence remains behind disclosure.

6. **Compare**
   - Supports up to three destinations.
   - Country set is encoded in the URL.
   - Trade-off interpretation reads production metrics only and does not choose a winner or create another score.

7. **Methodology**
   - Plain-language explanation remains first.
   - Advanced component contract and source registry remain live backend-driven.
   - Missing-data rules and housing/travel/visa/personal-safety limitations remain explicit.

8. **Loading/error/empty states**
   - Phase 9 persistent states remain in place for Discover, Country, Compare, Methodology and city retrieval.

## Stale-logic sweep

The Phase 10 source sweep found no live user-facing return of:

- star ratings;
- `Strong Arbitrage`, `Mixed Value`, or similar frontend verdict labels;
- visitor-arrival cards;
- legacy PPP Advantage presentation;
- a frontend-created destination score;
- a comparison winner.

Legacy fields remain in compatibility types/backend audit data where needed, but they are not the consumer presentation.

## CI acceptance

The final Phase 10 head must pass:

```text
Frontend
- ESLint
- Next.js production build

Backend
- compile
- sanity checks
- Phase 2 FX checks
- Phase 3 Basic Comfort checks
- Phase 4 Service Depth checks
- Phase 5 City Intelligence checks
- Phase 6 Mobility/Digital checks
- Phase 7 Ranking Rebuild checks
```

## Manual browser/device QA still required before a public release

This phase can verify source paths and CI in the current environment, but CI is not a substitute for a real rendered-device pass. Before public release, run the current `main` build against a live backend and visually exercise at minimum:

- 375px iPhone-class viewport;
- 430px large-phone viewport;
- tablet portrait/landscape;
- laptop and large desktop;
- keyboard-only navigation;
- reduced-motion OS setting;
- slow/failing backend responses;
- real Pexels images of varied aspect/content;
- GBP → Japan, USD → Argentina, EUR → Thailand;
- cheapness/comfort extremes and Stability = Ignore;
- browser back/forward and shared URLs.

## Important backend release blocker discovered during final QA

Frontend Phase 10 does **not** change ranking semantics. However, final source review confirms that `/api/rankings` still calls legacy `compute_scores()` before `apply_phase7_country_ranking()`.

Although Phase 7 prevents the legacy score from determining final ordering, `compute_scores()` contains a `dropna(subset=["score"])` gate. This means legacy GDP-era requirements can still affect which countries reach the Phase 7 ranking universe at all.

Before calling the overall product/model production-frozen:

1. remove the legacy filtering gate from the production universe;
2. compute any legacy audit fields without filtering rows (or left-join them back);
3. compare country counts/universe before and after the change;
4. identify destinations previously excluded solely by legacy score prerequisites;
5. rerun empirical/adversarial ranking and control-sensitivity validation.

This is a backend model-integrity issue, not a frontend Phase 10 issue, and should be treated as the next highest-priority task.
