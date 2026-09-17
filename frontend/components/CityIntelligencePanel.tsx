"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, MapPin, TrainFront, Wifi } from "lucide-react";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

type CityRow = {
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
  amenity_release?: string | null;
  amenity_query_success?: boolean | null;
  amenity_flags?: string[] | null;
  mobility?: number | null;
  mobility_source?: string | null;
  mobility_gtfs_feed_count?: number | null;
  mobility_gtfs_official_feed_count?: number | null;
  mobility_gtfs_evidence?: string | null;
  mobility_gtfs_providers?: string[] | null;
  digital_convenience?: number | null;
  digital_convenience_coverage?: number | null;
  digital_internet_users_pct?: number | null;
  digital_fixed_broadband_per_100?: number | null;
  digital_payments_pct?: number | null;
};

type CityResponse = {
  meta?: {
    city_source?: string | null;
    city_source_warning?: string | null;
    amenity_source?: string | null;
    amenity_footprint_method?: string | null;
    amenity_score_status?: string | null;
    mobility_source?: string | null;
    mobility_catalog_warning?: string | null;
    digital_source?: string | null;
    phase6_country_source_warning?: string | null;
  };
  results?: CityRow[];
};

type CityIntelligencePanelProps = {
  iso3?: string | null;
};

const compactNumber = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
};

const scoreLabel = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return Math.round(value).toString();
};

export function CityIntelligencePanel({ iso3 }: CityIntelligencePanelProps) {
  const [cities, setCities] = useState<CityRow[]>([]);
  const [meta, setMeta] = useState<CityResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!iso3) return;
    const controller = new AbortController();

    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setFailed(false);
      setCities([]);
      setMeta(null);
    });

    fetch(`${API_BASE_URL}/api/cities/${encodeURIComponent(iso3)}?limit=6&include_amenities=1&include_usability=1`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("City intelligence request failed");
        return response.json() as Promise<CityResponse>;
      })
      .then((data) => {
        setCities(data.results ?? []);
        setMeta(data.meta ?? null);
      })
      .catch((error: { name?: string }) => {
        if (error?.name !== "AbortError") setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [iso3]);

  if (!iso3) return null;

  const categoryRows = (city: CityRow) => [
    ["Food", city.amenity_food_drink_score],
    ["Shop", city.amenity_shopping_score],
    ["Health", city.amenity_health_care_score],
    ["Leisure", city.amenity_recreation_culture_score],
    ["Lifestyle", city.amenity_lifestyle_services_score],
    ["Stay", city.amenity_lodging_score],
  ] as const;

  return (
    <div className="mb-7 rounded-xl border border-amber-400/10 bg-amber-400/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">City Intelligence · Phases 5–6</p>
          <p className="mt-1 text-xs text-zinc-300">Dense everyday choice, practical transport context and low digital friction.</p>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-zinc-400">Diagnostic only · ranking unchanged until Phase 7</span>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 p-4 text-xs text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading city usability evidence…
        </div>
      ) : failed ? (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/5 p-4 text-xs leading-5 text-zinc-400">
          City evidence is currently unavailable. Missing evidence does not reduce the country ranking.
        </div>
      ) : cities.length === 0 ? (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/5 p-4 text-xs leading-5 text-zinc-400">
          No harmonized city match is currently available for this country.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {cities.map((city) => {
            const observed = city.amenity_depth != null;
            const gtfsPositive = city.mobility_gtfs_evidence === "positive_catalog_evidence";
            return (
              <div key={city.city_id ?? city.city_name} className="rounded-lg border border-white/5 bg-zinc-950/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                      <p className="truncate text-xs font-semibold text-white">{city.city_name ?? "Unknown city"}</p>
                      {city.amenity_rank_within_country != null ? <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">#{city.amenity_rank_within_country} amenity candidate</span> : null}
                    </div>
                    <p className="mt-1 pl-5 text-[10px] text-zinc-500">Pop. {compactNumber(city.population)} · {city.area_km2 != null ? `${Math.round(city.area_km2)} km²` : "area N/A"} · {city.amenity_total_per_10k != null ? `${city.amenity_total_per_10k.toFixed(1)} POIs / 10k` : "POI density unavailable"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">Amenity depth</p>
                    <p className="text-lg font-semibold text-white">{scoreLabel(city.amenity_depth)}</p>
                  </div>
                </div>

                {observed ? (
                  <div className="mt-3 grid grid-cols-6 gap-1">
                    {categoryRows(city).map(([label, score]) => (
                      <div key={label} className="rounded bg-white/5 px-1.5 py-1.5 text-center">
                        <p className="text-[8px] uppercase tracking-[0.08em] text-zinc-500">{label}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-zinc-200">{scoreLabel(score)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] leading-4 text-zinc-500">Amenity evidence unavailable — this city remains unranked rather than being scored as zero.</p>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                  <div className="rounded-md bg-white/[0.03] p-2">
                    <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.1em] text-zinc-500"><TrainFront className="h-3 w-3" /> Mobility</div>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{scoreLabel(city.mobility)}</p>
                    <p className="mt-0.5 text-[8px] text-zinc-600">Country transport baseline</p>
                  </div>
                  <div className="rounded-md bg-white/[0.03] p-2">
                    <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.1em] text-zinc-500"><Wifi className="h-3 w-3" /> Digital</div>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{scoreLabel(city.digital_convenience)}</p>
                    <p className="mt-0.5 text-[8px] text-zinc-600">Connectivity + payments</p>
                  </div>
                  <div className="rounded-md bg-white/[0.03] p-2">
                    <p className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">GTFS evidence</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-100">{gtfsPositive ? `${city.mobility_gtfs_feed_count ?? 0} matched feed${city.mobility_gtfs_feed_count === 1 ? "" : "s"}` : "Unknown"}</p>
                    <p className="mt-0.5 text-[8px] text-zinc-600">{gtfsPositive && city.mobility_gtfs_official_feed_count ? `${city.mobility_gtfs_official_feed_count} official` : "No match ≠ no transit"}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-zinc-500">
        <Building2 className="mt-0.5 h-3 w-3 shrink-0" />
        <p>
          Amenity Depth uses GHS-WUP urban centres plus Overture Places. Phase 6 Mobility uses WEF Ground & Port Infrastructure as a comparable national baseline and MobilityDatabase only as positive city-level GTFS evidence; an unmatched feed is unknown, not poor transit. Digital Convenience blends ITU/WDI connectivity, 2024 Global Findex digital payments and WEF ICT readiness. These fields remain diagnostics until Phase 7 validation{meta?.amenity_score_status ? ` — ${meta.amenity_score_status}` : ""}.
        </p>
      </div>
    </div>
  );
}
