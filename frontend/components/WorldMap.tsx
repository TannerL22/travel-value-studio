"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth, geoGraticule, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { type Feature, type FeatureCollection, type Geometry } from "geojson";

import { formatFxRankingEffect } from "@/lib/ranking-explanations";
import type { RankingRow } from "@/lib/types";

type CountryProperties = {
  name?: string;
  "Alpha-3"?: string;
};

type CountryFeature = Feature<Geometry, CountryProperties> & {
  id?: string | number;
};

type CountryCollection = FeatureCollection<Geometry, CountryProperties> & {
  features: CountryFeature[];
};

type WorldMapProps = {
  results: RankingRow[];
  onCountryClick: (country: RankingRow) => void;
  activeCountryKey?: string | null;
  onCountryHover?: (country: RankingRow | null) => void;
  className?: string;
};

type TooltipState = {
  country: RankingRow;
  x: number;
  y: number;
};

const width = 960;
const height = 480;

const countryKey = (country: RankingRow) => (country.iso3 ?? country.country ?? "").toUpperCase();

const valueScore = (country: RankingRow) =>
  country.quality_adjusted_value ?? country.Score ?? country.score ?? null;

const purchasingPower = (country: RankingRow) =>
  country.structural_purchasing_power ?? country.value_multiplier_relative ?? null;

export function WorldMap({
  results,
  onCountryClick,
  activeCountryKey = null,
  onCountryHover,
  className = "",
}: WorldMapProps) {
  const [geoData, setGeoData] = useState<CountryCollection | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/world.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Map data request failed");
        return response.json() as Promise<CountryCollection>;
      })
      .then((data) => active && setGeoData(data))
      .catch(() => active && setGeoData(null));
    return () => {
      active = false;
    };
  }, []);

  const colorScale = useMemo(
    () => scaleLinear<string>().domain([0, 50, 100]).range(["#17202a", "#155e75", "#22d3ee"]),
    []
  );

  const resultsMap = useMemo(() => {
    const map = new Map<string, RankingRow>();
    results.forEach((row) => {
      if (row.iso3) map.set(row.iso3.toUpperCase(), row);
      if (row.country) map.set(row.country.toUpperCase(), row);
    });
    return map;
  }, [results]);

  const mapPaths = useMemo(() => {
    if (!geoData) return null;
    const projection = geoEqualEarth().fitSize([width, height], geoData as GeoPermissibleObjects);
    const path = geoPath(projection);
    const graticule = geoGraticule();
    return {
      spherePath: path({ type: "Sphere" } as GeoPermissibleObjects) ?? "",
      graticulePath: path(graticule() as GeoPermissibleObjects) ?? "",
      countries: geoData.features.map((feature) => {
        const iso3 = String(feature.id ?? feature.properties?.["Alpha-3"] ?? "").toUpperCase();
        const name = feature.properties?.name?.toUpperCase() ?? "";
        const data = resultsMap.get(iso3) ?? resultsMap.get(name);
        const score = data ? valueScore(data) : null;
        return {
          data,
          fill: score != null ? colorScale(score) : "#27272a",
          key: iso3 || name,
          path: path(feature as GeoPermissibleObjects) ?? "",
        };
      }),
    };
  }, [colorScale, geoData, resultsMap]);

  const updateTooltipPosition = (country: RankingRow, clientX: number, clientY: number) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = Math.min(Math.max(clientX - bounds.left + 14, 12), Math.max(12, bounds.width - 210));
    const y = Math.min(Math.max(clientY - bounds.top + 14, 12), Math.max(12, bounds.height - 126));
    setTooltip({ country, x, y });
  };

  const setHoveredCountry = (country: RankingRow | null) => {
    onCountryHover?.(country);
    if (!country) setTooltip(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[2/1] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 ${className}`}
    >
      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-zinc-950/75 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-[#17202a] via-[#155e75] to-[#22d3ee]" />
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">Value score</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="World map colored by quality-adjusted destination value" className="h-full w-full">
        {mapPaths ? (
          <>
            <path d={mapPaths.spherePath} fill="transparent" stroke="#ffffff10" strokeWidth={0.7} />
            <path d={mapPaths.graticulePath} fill="none" stroke="#ffffff08" strokeWidth={0.6} />
            {mapPaths.countries.map((country) => {
              const active = country.data != null && countryKey(country.data) === activeCountryKey?.toUpperCase();
              return (
                <path
                  key={country.key}
                  d={country.path}
                  fill={country.fill}
                  stroke={active ? "#f4f4f5" : "#09090b"}
                  strokeWidth={active ? 1.5 : 0.35}
                  opacity={activeCountryKey && country.data && !active ? 0.74 : 1}
                  className={country.data ? "cursor-pointer transition-[opacity,stroke,stroke-width,filter] duration-150 hover:brightness-125 focus:outline-none" : undefined}
                  role={country.data ? "button" : undefined}
                  tabIndex={country.data ? 0 : -1}
                  aria-label={country.data ? `${country.data.country ?? country.data.iso3}, value rank ${country.data.rank ?? "unavailable"}` : undefined}
                  onClick={() => country.data && onCountryClick(country.data)}
                  onMouseEnter={(event) => {
                    if (!country.data) return;
                    setHoveredCountry(country.data);
                    updateTooltipPosition(country.data, event.clientX, event.clientY);
                  }}
                  onMouseMove={(event) => {
                    if (country.data) updateTooltipPosition(country.data, event.clientX, event.clientY);
                  }}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onFocus={() => {
                    if (!country.data) return;
                    setHoveredCountry(country.data);
                    setTooltip({ country: country.data, x: 18, y: 18 });
                  }}
                  onBlur={() => setHoveredCountry(null)}
                  onKeyDown={(event) => {
                    if (country.data && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onCountryClick(country.data);
                    }
                  }}
                />
              );
            })}
          </>
        ) : (
          <text x="50%" y="50%" textAnchor="middle" className="fill-zinc-500 text-sm">Loading map</text>
        )}
      </svg>

      {tooltip ? <MapTooltip tooltip={tooltip} /> : null}

      <div className="pointer-events-none absolute bottom-3 left-4 text-[10px] text-zinc-600">
        Hover or focus a country for details · select to explore
      </div>
    </div>
  );
}

function MapTooltip({ tooltip }: { tooltip: TooltipState }) {
  const { country, x, y } = tooltip;
  const score = valueScore(country);
  const pp = purchasingPower(country);

  return (
    <div
      className="pointer-events-none absolute z-20 w-48 rounded-xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl"
      style={{ left: x, top: y }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{country.country ?? country.iso3 ?? "Unknown"}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-500">Rank #{country.rank ?? "—"}</p>
        </div>
        <p className="text-xl font-semibold tabular-nums text-white">{score != null ? Math.round(score) : "—"}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
        <div>
          <p className="text-sm font-medium tabular-nums text-zinc-100">{pp != null ? `${pp.toFixed(2)}×` : "—"}</p>
          <p className="text-[9px] uppercase tracking-[0.1em] text-zinc-500">Purchasing power</p>
        </div>
        <div>
          <p className="text-sm font-medium tabular-nums text-zinc-100">{formatFxRankingEffect(country)}</p>
          <p className="text-[9px] uppercase tracking-[0.1em] text-zinc-500">FX effect</p>
        </div>
      </div>
    </div>
  );
}
