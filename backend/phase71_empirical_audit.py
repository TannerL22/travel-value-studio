from __future__ import annotations

import json
from typing import Dict, Iterable, List

import numpy as np
import pandas as pd

from data_sources import build_dataset, resolve_origin_context
from production_ranking import prepare_country_evidence, rank_prepared_countries


TARGET_YEAR = 2025
BASELINE = {
    "cheapness_priority": 0.70,
    "comfort_requirement": 0.55,
    "service_requirement": 0.65,
    "stability_priority": 0.75,
}
ORIGINS = ["GBR", "USA", "DEU", "JPN"]
FACE_VALIDITY_ISO3 = ["JPN", "TWN", "THA", "MYS", "PRT", "ESP", "MEX", "POL"]
PRACTICAL_STEP = 0.20


def _finite(value: object) -> float | None:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return numeric if np.isfinite(numeric) else None


def _rank_map(frame: pd.DataFrame) -> Dict[str, int]:
    return {
        str(row["iso3"]): int(row["rank"])
        for _, row in frame[["iso3", "rank"]].dropna().iterrows()
    }


def _top_iso3(frame: pd.DataFrame, n: int) -> List[str]:
    return frame.sort_values("rank").head(n)["iso3"].astype(str).tolist()


def _rank_similarity(a: pd.DataFrame, b: pd.DataFrame) -> Dict[str, object]:
    ra = _rank_map(a)
    rb = _rank_map(b)
    common = sorted(set(ra) & set(rb))
    if not common:
        return {"common_count": 0, "rank_correlation": None, "mean_abs_rank_change": None, "max_abs_rank_change": None, "top20_overlap": None, "largest_movers": []}

    a_vals = np.array([ra[iso] for iso in common], dtype=float)
    b_vals = np.array([rb[iso] for iso in common], dtype=float)
    correlation = float(np.corrcoef(a_vals, b_vals)[0, 1]) if len(common) > 1 else 1.0
    deltas = {iso: rb[iso] - ra[iso] for iso in common}
    abs_deltas = [abs(delta) for delta in deltas.values()]
    top_a = set(_top_iso3(a, 20))
    top_b = set(_top_iso3(b, 20))
    movers = sorted(deltas.items(), key=lambda item: abs(item[1]), reverse=True)[:8]
    names = dict(zip(a["iso3"].astype(str), a["country"].astype(str)))

    return {
        "common_count": len(common),
        "rank_correlation": round(correlation, 4),
        "mean_abs_rank_change": round(float(np.mean(abs_deltas)), 2),
        "max_abs_rank_change": int(max(abs_deltas)),
        "top20_overlap": len(top_a & top_b),
        "largest_movers": [
            {"iso3": iso, "country": names.get(iso, iso), "rank_delta_second_minus_first": int(delta)}
            for iso, delta in movers
        ],
    }


def _rank(prepared: pd.DataFrame, origin_iso3: str, controls: Dict[str, float]) -> pd.DataFrame:
    origin = resolve_origin_context(prepared, origin_iso3)
    return rank_prepared_countries(
        prepared,
        origin_pp_multiplier=float(origin["origin_pp_multiplier"]),
        origin_currency=origin["origin_currency"],
        cheapness_priority=controls["cheapness_priority"],
        comfort_requirement=controls["comfort_requirement"],
        service_requirement=controls["service_requirement"],
        stability_priority=controls["stability_priority"],
    )


def _unique_nonempty(frame: pd.DataFrame, field: str) -> List[str]:
    if field not in frame.columns:
        return []
    return sorted({str(v) for v in frame[field].dropna().tolist() if str(v)})


def _source_counts(prepared: pd.DataFrame) -> Dict[str, object]:
    currency = prepared.get("currency", pd.Series(np.nan, index=prepared.index))
    return {
        "basic_comfort_source": prepared.get("basic_comfort_source", pd.Series(dtype=str)).fillna("missing").value_counts().to_dict(),
        "basic_comfort_warnings": _unique_nonempty(prepared, "basic_comfort_source_warnings"),
        "service_depth_source": prepared.get("service_depth_source", pd.Series(dtype=str)).fillna("missing").value_counts().to_dict(),
        "service_depth_warnings": _unique_nonempty(prepared, "service_depth_source_warnings"),
        "data_quality_grade": prepared.get("data_quality_grade", pd.Series(dtype=str)).fillna("missing").value_counts().to_dict(),
        "wgi_stability_observed": int(pd.to_numeric(prepared.get("wgi_political_stability"), errors="coerce").notna().sum()),
        "wgi_source": _unique_nonempty(prepared, "wgi_political_stability_source"),
        "wgi_warnings": _unique_nonempty(prepared, "wgi_political_stability_warning"),
        "currency_observed": int(currency.notna().sum()),
        "currency_mapping_source": prepared.get("currency_mapping_source", pd.Series(dtype=str)).fillna("missing").value_counts().to_dict(),
        "currency_mapping_warnings": _unique_nonempty(prepared, "currency_mapping_warning"),
        "structural_pp_observed": int(pd.to_numeric(prepared.get("tourism_pp_power"), errors="coerce").gt(0).sum()),
    }


def _fx_coverage(frame: pd.DataFrame) -> Dict[str, object]:
    coverage = pd.to_numeric(frame.get("fx_opportunity_coverage"), errors="coerce").fillna(0.0)
    multiplier = pd.to_numeric(frame.get("fx_opportunity_multiplier"), errors="coerce").fillna(1.0)
    return {
        "source_counts": frame.get("fx_opportunity_source", pd.Series(dtype=str)).fillna("missing").value_counts().to_dict(),
        "observed_count": int(coverage.gt(0).sum()),
        "full_coverage_count": int(coverage.ge(0.999).sum()),
        "non_neutral_multiplier_count": int((multiplier.sub(1.0).abs() > 1e-9).sum()),
        "warning_values": _unique_nonempty(frame, "fx_opportunity_warnings"),
    }


def _face_validity_rows(frame: pd.DataFrame, iso3s: Iterable[str]) -> List[Dict[str, object]]:
    subset = frame[frame["iso3"].isin(list(iso3s))].sort_values("rank")
    rows: List[Dict[str, object]] = []
    for _, row in subset.iterrows():
        rows.append({
            "iso3": str(row["iso3"]),
            "country": str(row["country"]),
            "rank": int(row["rank"]),
            "quality_adjusted_value": _finite(row.get("quality_adjusted_value")),
            "structural_purchasing_power": _finite(row.get("structural_purchasing_power")),
            "basic_comfort": _finite(row.get("basic_comfort")),
            "service_depth": _finite(row.get("service_depth")),
            "stability": _finite(row.get("stability")),
            "fx_opportunity_multiplier": _finite(row.get("fx_opportunity_multiplier")),
            "fx_opportunity_source": row.get("fx_opportunity_source"),
            "data_quality_grade": row.get("data_quality_grade"),
            "legacy_score_available": bool(row.get("legacy_score_available_pre_phase7", False)),
        })
    return rows


def main() -> None:
    raw, _ = build_dataset(target_year=TARGET_YEAR, use_live_fx=True)
    prepared = prepare_country_evidence(raw, target_year=TARGET_YEAR)

    baseline_by_origin: Dict[str, pd.DataFrame] = {}
    origins_summary: Dict[str, object] = {}
    for origin in ORIGINS:
        ranked = _rank(prepared, origin, BASELINE)
        baseline_by_origin[origin] = ranked
        context = resolve_origin_context(prepared, origin)
        origins_summary[origin] = {
            "origin_currency": context.get("origin_currency"),
            "ranked_country_count": len(ranked),
            "fx_coverage": _fx_coverage(ranked),
            "top10": [
                {
                    "rank": int(row["rank"]),
                    "iso3": str(row["iso3"]),
                    "country": str(row["country"]),
                    "qav": round(float(row["quality_adjusted_value"]), 2),
                }
                for _, row in ranked.head(10).iterrows()
            ],
        }

    gbr_baseline = baseline_by_origin["GBR"]
    legacy_available = prepared.get("legacy_score_available_pre_phase7", pd.Series(False, index=prepared.index)).fillna(False).astype(bool)
    ranked_legacy_available = gbr_baseline.get("legacy_score_available_pre_phase7", pd.Series(False, index=gbr_baseline.index)).fillna(False).astype(bool)
    ranked_iso = set(gbr_baseline["iso3"].astype(str))
    production_iso = set(prepared["iso3"].astype(str))
    raw_iso = set(raw["iso3"].astype(str))

    endpoint_audit: Dict[str, object] = {}
    practical_audit: Dict[str, object] = {}
    control_fields = {
        "value": "cheapness_priority",
        "comfort": "comfort_requirement",
        "services": "service_requirement",
        "stability": "stability_priority",
    }
    for label, field in control_fields.items():
        low_controls = dict(BASELINE)
        high_controls = dict(BASELINE)
        low_controls[field] = 0.0
        high_controls[field] = 1.0
        low = _rank(prepared, "GBR", low_controls)
        high = _rank(prepared, "GBR", high_controls)
        endpoint_audit[label] = {
            "low_value": 0.0,
            "high_value": 1.0,
            "universe_identical": set(low["iso3"].astype(str)) == set(high["iso3"].astype(str)),
            **_rank_similarity(low, high),
        }

        practical_low = dict(BASELINE)
        practical_high = dict(BASELINE)
        practical_low[field] = max(0.0, float(BASELINE[field]) - PRACTICAL_STEP)
        practical_high[field] = min(1.0, float(BASELINE[field]) + PRACTICAL_STEP)
        low_local = _rank(prepared, "GBR", practical_low)
        high_local = _rank(prepared, "GBR", practical_high)
        practical_audit[label] = {
            "low_value": practical_low[field],
            "high_value": practical_high[field],
            "universe_identical": set(low_local["iso3"].astype(str)) == set(high_local["iso3"].astype(str)),
            **_rank_similarity(low_local, high_local),
        }

    report = {
        "audit": "Phase 7.1 empirical and control-sensitivity audit",
        "target_year": TARGET_YEAR,
        "baseline_controls": BASELINE,
        "universe": {
            "raw_rows_including_world_bank_aggregates": len(raw),
            "production_country_count": len(prepared),
            "removed_non_country_codes": sorted(raw_iso - production_iso),
            "legacy_score_available_count": int(legacy_available.sum()),
            "gbr_phase71_ranked_count": len(gbr_baseline),
            "gbr_ranked_without_legacy_score_count": int((~ranked_legacy_available).sum()),
            "production_not_ranked_count": len(production_iso - ranked_iso),
            "production_not_ranked_iso3": sorted(production_iso - ranked_iso),
            "ranked_without_legacy_score_iso3": sorted(
                gbr_baseline.loc[~ranked_legacy_available, "iso3"].astype(str).tolist()
            ),
        },
        "coverage": _source_counts(prepared),
        "baseline_by_origin": origins_summary,
        "gbp_face_validity_sample": _face_validity_rows(gbr_baseline, FACE_VALIDITY_ISO3),
        "control_sensitivity_endpoints_gbr": endpoint_audit,
        "control_sensitivity_practical_gbr": practical_audit,
    }

    print("PHASE71_AUDIT_JSON_START")
    print(json.dumps(report, indent=2, sort_keys=True, default=str))
    print("PHASE71_AUDIT_JSON_END")


if __name__ == "__main__":
    main()
