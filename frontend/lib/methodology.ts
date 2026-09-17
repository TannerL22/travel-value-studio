export type MethodologyComponent = {
  label?: string;
  status?: string;
  measures?: string;
  caveat?: string;
};

export type MethodologySummary = {
  model_contract?: string;
  product_question?: string;
  target_user?: string;
  scope?: string;
  current_model_status?: string;
  known_limitations?: string[];
  phase_7_components?: Record<string, MethodologyComponent>;
};

export type SourceField = {
  field_name: string;
  label: string;
  source: string;
  indicator?: string | null;
  frequency?: string;
  geographic_level?: string;
  field_type?: string;
  measures?: string;
  caveat?: string;
  recommended_confidence?: string;
};

export const METHODOLOGY_COMPONENT_ORDER = [
  "structural_purchasing_power",
  "basic_comfort",
  "service_depth",
  "stability",
  "fx_opportunity",
  "quality_adjusted_value",
  "amenity_depth",
  "mobility",
  "digital_convenience",
  "city_usability",
] as const;

export const SOURCE_PRIORITY_FIELDS = [
  "structural_value_factor",
  "ppp_private_lcu_per_int",
  "basic_comfort",
  "service_depth",
  "stability_penalty",
  "fx_opportunity",
  "amenity_depth",
  "mobility",
  "digital_convenience",
  "city_usability",
  "city_usability_coverage",
] as const;
