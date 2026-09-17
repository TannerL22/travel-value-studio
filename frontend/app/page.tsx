"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, BookOpen, Globe, LayoutGrid, Plus, X } from "lucide-react";

import { ControlPanel } from "@/components/ControlPanel";
import { DestinationCard } from "@/components/DestinationCard";
import { DestinationModal } from "@/components/DestinationModal";
import { MethodologyPanel } from "@/components/MethodologyPanel";
import { AppShell } from "@/components/shell/AppShell";
import { WorldMap } from "@/components/WorldMap";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { useOrigins } from "@/hooks/useOrigins";
import { useRankings } from "@/hooks/useRankings";
import { apiUrl } from "@/lib/api";
import { DEFAULT_FILTERS, parsePreferences, preferencesToSearchParams } from "@/lib/preferences";
import type { FilterState, RankingRow } from "@/lib/types";

const countryKey = (country: RankingRow) => country.iso3 ?? country.country ?? "unknown";

const formatMetric = (value: number | null | undefined, suffix = "") => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return `${value.toFixed(2)}${suffix}`;
};

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [urlHydrated, setUrlHydrated] = useState(false);
  const [sortBy, setSortBy] = useState<"value" | "purchasing_power" | "stability">("value");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [compareList, setCompareList] = useState<RankingRow[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<RankingRow | null>(null);

  const { origins, error: originsError } = useOrigins();
  const { results, loading: rankingsLoading, error: rankingsError } = useRankings(filters, urlHydrated);
  const loading = rankingsLoading || !urlHydrated;

  useEffect(() => {
    const applyUrlState = () => {
      setFilters(parsePreferences(new URLSearchParams(window.location.search)));
      setUrlHydrated(true);
    };
    applyUrlState();
    window.addEventListener("popstate", applyUrlState);
    return () => window.removeEventListener("popstate", applyUrlState);
  }, []);

  useEffect(() => {
    if (!urlHydrated) return;
    const params = preferencesToSearchParams(filters);
    const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history.replaceState(null, "", next);
  }, [filters, urlHydrated]);

  useEffect(() => {
    if (originsError) toast.error("Failed to load country list.");
  }, [originsError]);

  useEffect(() => {
    if (rankingsError) toast.error("Failed to connect to backend.");
  }, [rankingsError]);

  useEffect(() => {
    const controller = new AbortController();
    const names = results.map((row) => row.country ?? row.iso3 ?? "").filter((name) => name && !imageMap[name]);
    if (names.length === 0) return () => controller.abort();

    const fetchImages = async () => {
      const updates: Record<string, string> = {};
      for (const name of names) {
        try {
          const response = await fetch(`/api/pexels?q=${encodeURIComponent(name)}%20travel`, { signal: controller.signal });
          if (!response.ok) continue;
          const data = (await response.json()) as { url?: string };
          if (data.url) updates[name] = data.url;
        } catch (error) {
          if ((error as { name?: string }).name === "AbortError") break;
        }
      }
      if (Object.keys(updates).length > 0) setImageMap((prev) => ({ ...prev, ...updates }));
    };
    void fetchImages();
    return () => controller.abort();
  }, [results, imageMap]);

  const toggleCompare = (country: RankingRow) => {
    const key = countryKey(country);
    if (compareList.some((c) => countryKey(c) === key) && compareList.length <= 2) setIsCompareOpen(false);
    setCompareList((prev) => {
      if (prev.some((c) => countryKey(c) === key)) return prev.filter((c) => countryKey(c) !== key);
      if (prev.length >= 3) {
        toast.error("You can compare up to 3 countries at once.");
        return prev;
      }
      return [...prev, country];
    });
  };

  const scoreValues = useMemo(
    () => results.map((r) => r.quality_adjusted_value ?? r.Score ?? r.score ?? null).filter((v): v is number => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b),
    [results]
  );

  const scorePercentile = (value: number | null) => {
    if (value == null || scoreValues.length === 0) return null;
    if (scoreValues.length === 1) return 1;
    const idx = scoreValues.findIndex((v) => v >= value);
    const resolved = idx === -1 ? scoreValues.length - 1 : idx;
    return resolved / (scoreValues.length - 1);
  };

  const sortedResults = useMemo(() => {
    const items = [...results];
    if (sortBy === "purchasing_power") {
      return items.sort((a, b) => (b.structural_purchasing_power ?? b.value_multiplier_relative ?? -Infinity) - (a.structural_purchasing_power ?? a.value_multiplier_relative ?? -Infinity));
    }
    if (sortBy === "stability") {
      return items.sort((a, b) => (b.stability ?? b.component_safety_stability ?? -Infinity) - (a.stability ?? a.component_safety_stability ?? -Infinity));
    }
    return items.sort((a, b) => (b.quality_adjusted_value ?? b.Score ?? b.score ?? -Infinity) - (a.quality_adjusted_value ?? a.Score ?? a.score ?? -Infinity));
  }, [results, sortBy]);

  return (
    <AppShell>
      <Toaster theme="dark" />

      <div className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Global Rankings</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Where Your Money Buys More Life</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Broad purchasing power adjusted by current comfort, service-depth, and stability evidence. Destination costs only; travel-to-destination costs are outside scope.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button type="button" variant="outline" className="h-10 border-white/10 bg-zinc-950/60 px-3 text-xs uppercase tracking-[0.16em] text-zinc-200" onClick={() => setIsMethodologyOpen(true)}>
            <BookOpen className="h-3.5 w-3.5" /> Method
          </Button>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "map")} className="rounded-lg border border-white/10 bg-zinc-950/60 p-1">
            <TabsList className="h-8 bg-transparent">
              <TabsTrigger value="grid" className="h-full gap-2 px-3 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white"><LayoutGrid className="h-3.5 w-3.5" /> Grid</TabsTrigger>
              <TabsTrigger value="map" className="h-full gap-2 px-3 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white"><Globe className="h-3.5 w-3.5" /> Map</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="h-10 w-full border-white/10 bg-zinc-950/60 text-xs uppercase tracking-[0.16em] text-zinc-200 sm:w-56"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950 text-zinc-100">
              <SelectItem value="value">Quality-Adjusted Value</SelectItem>
              <SelectItem value="purchasing_power">Purchasing Power</SelectItem>
              <SelectItem value="stability">Stability</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-8">
        <ControlPanel values={filters} setValues={setFilters} origins={origins} />
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div key="grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <Skeleton className="aspect-[4/3] w-full bg-white/10" />
                    <div className="space-y-2 p-4"><Skeleton className="h-4 w-2/3 bg-white/10" /><Skeleton className="h-3 w-1/3 bg-white/10" /></div>
                  </div>
                ))
              : sortedResults.map((row, index) => {
                  const name = row.country ?? row.iso3 ?? "Unknown";
                  const valueScore = row.quality_adjusted_value ?? row.Score ?? row.score ?? null;
                  const pp = row.structural_purchasing_power ?? row.value_multiplier_relative ?? null;
                  const service = (row.service_depth ?? row.component_tourism_depth ?? 0) / 100;
                  const stability = (row.stability ?? row.component_safety_stability ?? 0) / 100;
                  const qualityScore = Math.max(0, Math.min(1, (service + stability) / 2));
                  const starRating = Math.max(1, Math.min(5, Math.round(qualityScore * 10) / 2));
                  const qualityLabel = starRating >= 4.5 ? "High usability" : starRating >= 3.5 ? "Good usability" : starRating >= 2.5 ? "Mixed usability" : "Thin usability";
                  const scorePercent = scorePercentile(valueScore);
                  const topPercent = scorePercent != null ? Math.max(1, Math.round((1 - scorePercent) * 100)) : null;
                  const verdict = pp == null ? "Value unclear" : pp >= 2 && qualityScore >= 0.65 ? "Strong Arbitrage" : pp >= 1.5 ? "High Purchasing Power" : valueScore != null && valueScore >= 70 ? "Quality Value" : "Mixed Value";

                  return (
                    <DestinationCard
                      key={`${name}-${index}`}
                      country={{
                        name,
                        valueTopPercent: topPercent,
                        valueTitle: "Quality-adjusted value percentile",
                        verdict,
                        starRating,
                        qualityLabel,
                        imageUrl: imageMap[name],
                        stability,
                        serviceDepth: service,
                        arrivals: row.intl_arrivals,
                        purchasingPower: pp,
                      }}
                      index={index}
                      onClick={() => setSelectedCountry(row)}
                    />
                  );
                })}
          </motion.div>
        ) : (
          <motion.div key="map" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full">
            <WorldMap results={results} onCountryClick={(country) => setSelectedCountry(country)} />
          </motion.div>
        )}
      </AnimatePresence>

      {selectedCountry ? (
        <DestinationModal
          country={selectedCountry}
          isOpen
          onClose={() => setSelectedCountry(null)}
          allResults={results}
          imageUrl={imageMap[selectedCountry.country ?? selectedCountry.iso3 ?? ""]}
          onCompare={toggleCompare}
          isComparing={compareList.some((c) => countryKey(c) === countryKey(selectedCountry))}
        />
      ) : null}

      <AnimatePresence>
        {compareList.length > 0 ? (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-max -translate-x-1/2 sm:bottom-6 sm:w-auto">
            <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-zinc-900/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:gap-6 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3">
                {compareList.map((c) => (
                  <div key={countryKey(c)} className="group relative">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-[10px] font-bold text-white sm:h-10 sm:w-10">
                      {imageMap[c.country ?? c.iso3 ?? ""] ? <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${imageMap[c.country ?? c.iso3 ?? ""]})` }} /> : c.iso3?.slice(0, 2)}
                    </div>
                    <button onClick={() => toggleCompare(c)} className="absolute -right-1 -top-1 rounded-full border border-white/10 bg-zinc-950 p-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"><X className="h-2.5 w-2.5" /></button>
                  </div>
                ))}
                {Array.from({ length: 3 - compareList.length }).map((_, i) => <div key={i} className="hidden h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/10 text-zinc-600 sm:flex"><Plus className="h-4 w-4" /></div>)}
              </div>
              <div className="hidden h-8 w-px bg-white/10 sm:block" />
              <Button className="h-9 gap-2 rounded-full bg-emerald-500 px-4 text-white hover:bg-emerald-600 sm:h-10 sm:px-6" disabled={compareList.length < 2} onClick={() => setIsCompareOpen(true)}>
                Compare <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isCompareOpen && compareList.length >= 2 ? <ComparisonPanel countries={compareList} imageMap={imageMap} onClose={() => setIsCompareOpen(false)} onRemove={toggleCompare} /> : null}
      </AnimatePresence>

      <MethodologyPanel apiUrl={apiUrl} isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
    </AppShell>
  );
}

type ComparisonPanelProps = {
  countries: RankingRow[];
  imageMap: Record<string, string>;
  onClose: () => void;
  onRemove: (country: RankingRow) => void;
};

function ComparisonPanel({ countries, imageMap, onClose, onRemove }: ComparisonPanelProps) {
  const metricRows = [
    { label: "Quality-adjusted value", getValue: (c: RankingRow) => Math.round(c.quality_adjusted_value ?? c.Score ?? c.score ?? 0).toString() },
    { label: "Purchasing power", getValue: (c: RankingRow) => formatMetric(c.structural_purchasing_power ?? c.value_multiplier_relative, "x") },
    { label: "FX opportunity", getValue: (c: RankingRow) => c.fx_opportunity != null ? Math.round(c.fx_opportunity).toString() : "N/A" },
    { label: "Basic comfort", getValue: (c: RankingRow) => c.basic_comfort != null ? Math.round(c.basic_comfort).toString() : "N/A" },
    { label: "Service depth", getValue: (c: RankingRow) => c.service_depth != null ? Math.round(c.service_depth).toString() : "N/A" },
    { label: "Stability", getValue: (c: RankingRow) => c.stability != null ? Math.round(c.stability).toString() : "N/A" },
  ];

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-3 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl" initial={{ y: 32, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 32, scale: 0.98 }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Comparison</p><h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">Purchasing-power tradeoffs</h2></div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300" aria-label="Close comparison"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-w-[680px]">
          <div className="grid" style={{ gridTemplateColumns: `minmax(9rem, 0.8fr) repeat(${countries.length}, minmax(0, 1fr))` }}>
            <div className="border-b border-white/10 bg-zinc-950/60 p-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Metric</div>
            {countries.map((country) => {
              const name = country.country ?? country.iso3 ?? "Unknown";
              const imageUrl = imageMap[name];
              return (
                <div key={countryKey(country)} className="relative border-b border-l border-white/10 bg-zinc-950/40 p-4">
                  <button type="button" onClick={() => onRemove(country)} className="absolute right-3 top-3 rounded-full bg-zinc-950/80 p-1 text-zinc-400" aria-label={`Remove ${name} from comparison`}><X className="h-3.5 w-3.5" /></button>
                  <div className="flex items-center gap-3 pr-8">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">{imageUrl ? <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} /> : null}</div>
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{name}</p><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">{country.iso3 ?? "N/A"}</p></div>
                  </div>
                </div>
              );
            })}
            {metricRows.map((row) => (
              <div className="contents" key={row.label}>
                <div className="border-b border-white/10 bg-zinc-950/50 p-4 text-xs uppercase tracking-[0.16em] text-zinc-500">{row.label}</div>
                {countries.map((country) => <div key={`${row.label}-${countryKey(country)}`} className="border-b border-l border-white/10 p-4 text-sm font-medium text-zinc-100">{row.getValue(country)}</div>)}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
