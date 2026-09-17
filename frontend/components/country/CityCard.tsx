"use client";

import { ChevronDown, Database, MapPin, TrainFront, Wifi } from "lucide-react";

import type { CityRow } from "@/lib/types";

type CityCardProps = {
  city: CityRow;
  fallbackRank: number;
};

type AmenityMetric = {
  label: string;
  value: number | null | undefined;
};

const compactNumber = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
};

const score = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value);
};

const scoreLabel = (value: number | null | undefined) => {
  const rounded = score(value);
  return rounded == null ? "N/A" : rounded.toString();
};

const coverageLabel = (coverage: number | null | undefined) => {
  if (coverage == null || !Number.isFinite(coverage)) return "Coverage unavailable";
  if (coverage >= 0.85) return "High evidence coverage";
  if (coverage >= 0.6) return "Moderate evidence coverage";
  return "Limited evidence coverage";
};

const amenityMetrics = (city: CityRow): AmenityMetric[] => [
  { label: "Food & drink", value: city.amenity_food_drink_score },
  { label: "Shopping", value: city.amenity_shopping_score },
  { label: "Health", value: city.amenity_health_care_score },
  { label: "Leisure & culture", value: city.amenity_recreation_culture_score },
  { label: "Lifestyle", value: city.amenity_lifestyle_services_score },
  { label: "Lodging", value: city.amenity_lodging_score },
];

export function CityCard({ city, fallbackRank }: CityCardProps) {
  const name = city.city_name ?? "Unknown city";
  const rank = city.city_usability_rank_within_country ?? fallbackRank;
  const metrics = amenityMetrics(city);
  const strongest = metrics
    .filter((metric) => metric.value != null && Number.isFinite(metric.value))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
    .slice(0, 3);
  const gtfsPositive = city.mobility_gtfs_evidence === "positive_catalog_evidence";
  const usabilityAvailable = city.city_usability != null && Number.isFinite(city.city_usability);

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-950/35 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-semibold text-cyan-200">#{rank} candidate</span>
            <span className="text-xs text-zinc-500">Population {compactNumber(city.population)}</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-cyan-300" />
            <h3 className="truncate text-xl font-semibold tracking-tight text-white">{name}</h3>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {usabilityAvailable
              ? "City Usability is anchored by observed local amenity depth, with national mobility and digital context supporting the comparison."
              : "City Usability is unavailable because the required city-level amenity evidence is not currently observed."}
          </p>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-4xl font-semibold tabular-nums tracking-tight text-white">{scoreLabel(city.city_usability)}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">City usability</p>
          <p className="mt-2 text-xs text-zinc-500">{coverageLabel(city.city_usability_coverage)}</p>
        </div>
      </div>

      {strongest.length > 0 ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Strongest observed amenity areas</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {strongest.map((metric) => (
              <span key={metric.label} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
                {metric.label} <strong className="ml-1 font-semibold tabular-nums text-zinc-100">{scoreLabel(metric.value)}</strong>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-zinc-400"><TrainFront className="h-4 w-4 text-zinc-500" /> National mobility context</div>
          <span className="font-semibold tabular-nums text-zinc-100">{scoreLabel(city.mobility)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-zinc-400"><Wifi className="h-4 w-4 text-zinc-500" /> National digital context</div>
          <span className="font-semibold tabular-nums text-zinc-100">{scoreLabel(city.digital_convenience)}</span>
        </div>
      </div>

      <details className="group mt-5 border-t border-white/10 pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm text-zinc-400 transition hover:text-zinc-200">
          <span className="inline-flex items-center gap-2"><Database className="h-4 w-4" /> View city evidence</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-4 space-y-4 text-xs text-zinc-500">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-white/5 bg-white/[0.025] p-3">
                <p className="text-[9px] uppercase tracking-[0.1em] text-zinc-600">{metric.label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-200">{scoreLabel(metric.value)}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <EvidenceItem label="Amenity depth" value={scoreLabel(city.amenity_depth)} note="City-specific anchor" />
            <EvidenceItem label="Area" value={city.area_km2 != null ? `${Math.round(city.area_km2)} km²` : "N/A"} note="GHS-WUP reference area" />
            <EvidenceItem label="Amenity density" value={city.amenity_total_per_10k != null ? `${city.amenity_total_per_10k.toFixed(1)} / 10k` : "N/A"} note="Observed qualifying places" />
            <EvidenceItem
              label="Transit catalog evidence"
              value={gtfsPositive ? `${city.mobility_gtfs_feed_count ?? 0} feed${city.mobility_gtfs_feed_count === 1 ? "" : "s"}` : "No match"}
              note={gtfsPositive && city.mobility_gtfs_official_feed_count ? `${city.mobility_gtfs_official_feed_count} marked official` : "No match means unknown, not no transit"}
            />
          </div>

          <p className="leading-5 text-zinc-600">
            City Usability uses observed Amenity Depth as the required city-specific anchor. Mobility and Digital Convenience are supporting national context; missing context reduces coverage rather than being treated as poor performance. This candidate rank applies only to the cities returned for this country and is not an exhaustive hidden-gem ranking.
          </p>
        </div>
      </details>
    </article>
  );
}

function EvidenceItem({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[9px] uppercase tracking-[0.1em] text-zinc-600">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-200">{value}</p>
      <p className="mt-1 leading-4 text-zinc-600">{note}</p>
    </div>
  );
}
