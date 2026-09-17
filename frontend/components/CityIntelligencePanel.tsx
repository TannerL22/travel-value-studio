"use client";

import { Building2, Gauge, Loader2, MapPin, TrainFront, Wifi } from "lucide-react";

import { useCities } from "@/hooks/useCities";
import type { CityRow } from "@/lib/types";

type CityIntelligencePanelProps = { iso3?: string | null };

const compactNumber = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
};

const scoreLabel = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return Math.round(value).toString();
};

export function CityIntelligencePanel({ iso3 }: CityIntelligencePanelProps) {
  const { cities, meta, loading, error } = useCities(iso3);
  if (!iso3) return null;

  const categoryRows = (city: CityRow) => [
    ["Food", city.amenity_food_drink_score], ["Shop", city.amenity_shopping_score],
    ["Health", city.amenity_health_care_score], ["Leisure", city.amenity_recreation_culture_score],
    ["Lifestyle", city.amenity_lifestyle_services_score], ["Stay", city.amenity_lodging_score],
  ] as const;
  const amenityStatus = typeof meta.amenity_score_status === "string" ? meta.amenity_score_status : null;

  return (
    <div className="mb-7 rounded-xl border border-amber-400/10 bg-amber-400/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">City Intelligence · Phase 7</p>
          <p className="mt-1 text-xs text-zinc-300">Amenity supply plus mobility and digital context, kept separate from the country value score.</p>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-zinc-400">Two-stage model · country rank unchanged</span>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 p-4 text-xs text-zinc-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading city usability evidence…</div>
      ) : error ? (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/5 p-4 text-xs leading-5 text-zinc-400">City evidence is currently unavailable. Missing evidence does not reduce the country ranking.</div>
      ) : cities.length === 0 ? (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/5 p-4 text-xs leading-5 text-zinc-400">No harmonized city match is currently available for this country.</div>
      ) : (
        <div className="mt-4 space-y-2">
          {cities.map((city) => {
            const observed = city.amenity_depth != null;
            const gtfsPositive = city.mobility_gtfs_evidence === "positive_catalog_evidence";
            return (
              <div key={city.city_id ?? city.city_name} className="rounded-lg border border-white/5 bg-zinc-950/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-amber-300" /><p className="truncate text-xs font-semibold text-white">{city.city_name ?? "Unknown city"}</p>{city.city_usability_rank_within_country != null ? <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">#{city.city_usability_rank_within_country} usability candidate</span> : null}</div>
                    <p className="mt-1 pl-5 text-[10px] text-zinc-500">Pop. {compactNumber(city.population)} · {city.area_km2 != null ? `${Math.round(city.area_km2)} km²` : "area N/A"} · {city.amenity_total_per_10k != null ? `${city.amenity_total_per_10k.toFixed(1)} POIs / 10k` : "POI density unavailable"}</p>
                  </div>
                  <div className="shrink-0 text-right"><p className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">City usability</p><p className="text-lg font-semibold text-white">{scoreLabel(city.city_usability)}</p><p className="text-[8px] text-zinc-600">{city.city_usability_coverage != null ? `${Math.round(city.city_usability_coverage * 100)}% evidence` : "coverage N/A"}</p></div>
                </div>

                {observed ? <div className="mt-3 grid grid-cols-3 gap-1 sm:grid-cols-6">{categoryRows(city).map(([label, score]) => <div key={label} className="rounded bg-white/5 px-1.5 py-1.5 text-center"><p className="text-[8px] uppercase tracking-[0.08em] text-zinc-500">{label}</p><p className="mt-0.5 text-[10px] font-medium text-zinc-200">{scoreLabel(score)}</p></div>)}</div> : <p className="mt-2 text-[10px] leading-4 text-zinc-500">Amenity evidence unavailable — City Usability is intentionally unavailable rather than inferred from national context.</p>}

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 sm:grid-cols-4">
                  <div className="rounded-md bg-white/[0.03] p-2"><div className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.1em] text-zinc-500"><Gauge className="h-3 w-3" /> Amenity</div><p className="mt-1 text-sm font-semibold text-zinc-100">{scoreLabel(city.amenity_depth)}</p><p className="mt-0.5 text-[8px] text-zinc-600">60% usability weight</p></div>
                  <div className="rounded-md bg-white/[0.03] p-2"><div className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.1em] text-zinc-500"><TrainFront className="h-3 w-3" /> Mobility</div><p className="mt-1 text-sm font-semibold text-zinc-100">{scoreLabel(city.mobility)}</p><p className="mt-0.5 text-[8px] text-zinc-600">20% · country baseline</p></div>
                  <div className="rounded-md bg-white/[0.03] p-2"><div className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.1em] text-zinc-500"><Wifi className="h-3 w-3" /> Digital</div><p className="mt-1 text-sm font-semibold text-zinc-100">{scoreLabel(city.digital_convenience)}</p><p className="mt-0.5 text-[8px] text-zinc-600">20% · connectivity + payments</p></div>
                  <div className="rounded-md bg-white/[0.03] p-2"><p className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">GTFS evidence</p><p className="mt-1 text-xs font-semibold text-zinc-100">{gtfsPositive ? `${city.mobility_gtfs_feed_count ?? 0} feed${city.mobility_gtfs_feed_count === 1 ? "" : "s"}` : "Unknown"}</p><p className="mt-0.5 text-[8px] text-zinc-600">{gtfsPositive && city.mobility_gtfs_official_feed_count ? `${city.mobility_gtfs_official_feed_count} official` : "No match ≠ no transit"}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-zinc-500"><Building2 className="mt-0.5 h-3 w-3 shrink-0" /><p>Phase 7 City Usability is a coverage-aware geometric blend of Amenity Depth (60%), Mobility (20%) and Digital Convenience (20%). Amenity evidence is required because Mobility/Digital are still mainly national context. It helps order returned city candidates but is not a global city-value score and never changes the country Quality-Adjusted Value{amenityStatus ? ` — ${amenityStatus}` : ""}.</p></div>
    </div>
  );
}
