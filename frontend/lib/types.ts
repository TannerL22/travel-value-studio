export interface Origin {
  name: string;
  code: string;
  pp_multiplier: number;
  currency: string;
}

export interface FilterState {
  year: number;
  origin_iso3: string;
  budget_sens: number;
  comfort: number;
  supply_need: number;
  risk_pri: number;
}

export type RankingRow = {
  country?: string | null;
  iso3?: string | null;
  rank?: number | null;
  score?: number | null;
  Score?: number | null;
  value_multiplier_relative?: number | null;
  structural_purchasing_power?: number | null;
  purchasing_power_advantage_pct?: number | null;
  structural_value_factor?: number | null;
  fx_opportunity?: number | null;
  fx_opportunity_multiplier?: number | null;
  basic_comfort?: number | null;
  basic_comfort_penalty?: number | null;
  service_depth?: number | null;
  service_depth_penalty?: number | null;
  stability?: number | null;
  stability_penalty?: number | null;
  quality_adjusted_value?: number | null;
  score_infra?: number | null;
  score_safety?: number | null;
  wgi_political_stability?: number | null;
  intl_arrivals?: number | null;
  data_quality_score?: number | null;
  data_quality_grade?: "A" | "B" | "C" | "D" | null;
  data_quality_flags?: string[] | null;
  fx_tailwind_1y?: number | null;
  fx_tailwind_3y?: number | null;
  fx_tailwind_recent_ratio?: number | null;
  fx_tailwind_1y_pct?: number | null;
  fx_tailwind_3y_pct?: number | null;
  fx_tailwind_signal?: number | null;
  fx_tailwind_source?: string | null;
  fx_tailwind_interpretation?: string | null;
  fx_tailwind_origin_currency?: string | null;
  fx_tailwind_origin_1y?: number | null;
  fx_tailwind_origin_3y?: number | null;
  fx_tailwind_origin_recent_ratio?: number | null;
  fx_tailwind_origin_1y_pct?: number | null;
  fx_tailwind_origin_3y_pct?: number | null;
  fx_tailwind_origin_interpretation?: string | null;
  fx_tailwind_origin_source?: string | null;
  fx_frankfurter_date?: string | null;
  fx_frankfurter_1y_date?: string | null;
  fx_frankfurter_3y_date?: string | null;
  component_fx_tailwind?: number | null;
  component_fx_tailwind_source?: string | null;
  component_ppp_advantage?: number | null;
  component_comfort_floor?: number | null;
  component_tourism_depth?: number | null;
  component_safety_stability?: number | null;
  component_overall_value?: number | null;
};

export type CityRow = {
  city_id?: string | null;
  city_name?: string | null;
  population?: number | null;
  area_km2?: number | null;
  amenity_depth?: number | null;
  amenity_rank_within_country?: number | null;
  amenity_total_per_10k?: number | null;
  amenity_food_drink_score?: number | null;
  amenity_shopping_score?: number | null;
  amenity_health_care_score?: number | null;
  amenity_recreation_culture_score?: number | null;
  amenity_lifestyle_services_score?: number | null;
  amenity_lodging_score?: number | null;
  amenity_source?: string | null;
  amenity_query_success?: boolean | null;
  mobility?: number | null;
  mobility_gtfs_feed_count?: number | null;
  mobility_gtfs_official_feed_count?: number | null;
  mobility_gtfs_evidence?: string | null;
  digital_convenience?: number | null;
  digital_convenience_coverage?: number | null;
  city_usability?: number | null;
  city_usability_coverage?: number | null;
  city_usability_rank_within_country?: number | null;
};

export type CityResponse = {
  meta?: Record<string, unknown>;
  results?: CityRow[];
};
