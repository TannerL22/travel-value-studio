"use client";

import { useEffect, useMemo, useState } from "react";
import { geoEqualEarth, geoGraticule, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { type Feature, type FeatureCollection, type Geometry } from "geojson";

import { type RankingRow } from "@/app/page";

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
};

const width = 960;
const height = 480;

export function WorldMap({ results, onCountryClick }: WorldMapProps) {
  const [geoData, setGeoData] = useState<CountryCollection | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/world.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Map data request failed");
        return response.json() as Promise<CountryCollection>;
      })
      .then((data) => {
        if (active) setGeoData(data);
      })
      .catch(() => {
        if (active) setGeoData(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 50, 100])
      .range(["#ef4444", "#eab308", "#10b981"]);
  }, []);

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

    const projection = geoEqualEarth().fitSize(
      [width, height],
      geoData as GeoPermissibleObjects
    );
    const path = geoPath(projection);
    const graticule = geoGraticule();
    const spherePath = path({ type: "Sphere" } as GeoPermissibleObjects) ?? "";
    const graticulePath = path(graticule() as GeoPermissibleObjects) ?? "";

    return {
      spherePath,
      graticulePath,
      countries: geoData.features.map((feature) => {
        const iso3 = String(feature.id ?? feature.properties?.["Alpha-3"] ?? "").toUpperCase();
        const name = feature.properties?.name?.toUpperCase() ?? "";
        const data = resultsMap.get(iso3) ?? resultsMap.get(name);
        const score = data?.Score ?? data?.score ?? null;

        return {
          data,
          fill: score != null ? colorScale(score) : "#27272a",
          key: iso3 || name,
          name,
          path: path(feature as GeoPermissibleObjects) ?? "",
        };
      }),
    };
  }, [colorScale, geoData, resultsMap]);

  return (
    <div className="group relative aspect-[2/1] w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/40">
      <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-10 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Value Score
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="World map colored by destination value score"
        className="h-full w-full"
      >
        {mapPaths ? (
          <>
            <path d={mapPaths.spherePath} fill="transparent" stroke="#ffffff10" strokeWidth={0.7} />
            <path d={mapPaths.graticulePath} fill="none" stroke="#ffffff08" strokeWidth={0.6} />
            {mapPaths.countries.map((country) => (
              <path
                key={country.key}
                d={country.path}
                fill={country.fill}
                stroke="#09090b"
                strokeWidth={0.35}
                className="transition-colors duration-200 hover:fill-zinc-500"
                role={country.data ? "button" : undefined}
                tabIndex={country.data ? 0 : -1}
                onClick={() => country.data && onCountryClick(country.data)}
                onKeyDown={(event) => {
                  if (country.data && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onCountryClick(country.data);
                  }
                }}
              />
            ))}
          </>
        ) : (
          <text x="50%" y="50%" textAnchor="middle" className="fill-zinc-500 text-sm">
            Loading map
          </text>
        )}
      </svg>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/10 bg-zinc-900/80 p-3 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Interactive Map
        </p>
        <p className="text-xs text-zinc-300">Click a country to see deep dive stats.</p>
      </div>
    </div>
  );
}
