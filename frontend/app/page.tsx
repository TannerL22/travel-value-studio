"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, BookOpen, Map, Plus, X } from "lucide-react";

import { RankingList } from "@/components/discover/RankingList";
import { DestinationModal } from "@/components/DestinationModal";
import { MethodologyPanel } from "@/components/MethodologyPanel";
import { PreferenceBar } from "@/components/preferences/PreferenceBar";
import { PreferenceDrawer } from "@/components/preferences/PreferenceDrawer";
import { AppShell } from "@/components/shell/AppShell";
import { WorldMap } from "@/components/WorldMap";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { useOrigins } from "@/hooks/useOrigins";
import { useRankings } from "@/hooks/useRankings";
import { apiUrl } from "@/lib/api";
import { DEFAULT_FILTERS, parsePreferences, preferencesToSearchParams } from "@/lib/preferences";
import type { FilterState, RankingRow } from "@/lib/types";

const countryKey = (country: RankingRow) => (country.iso3 ?? country.country ?? "unknown").toUpperCase();

const formatMetric = (value: number | null | undefined, suffix = "") => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return `${value.toFixed(2)}${suffix}`;
};

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [urlHydrated, setUrlHydrated] = useState(false);
  const [sortBy, setSortBy] = useState<"value" | "purchasing_power" | "stability">("value");
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [compareList, setCompareList] = useState<RankingRow[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isPreferenceOpen, setIsPreferenceOpen] = useState(false);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<RankingRow | null>(null);
  const [hoveredCountryKey, setHoveredCountryKey] = useState<string | null>(null);

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
    if (!selectedCountry) return;
    const name = selectedCountry.country ?? selectedCountry.iso3 ?? "";
    if (!name || imageMap[name]) return;

    const controller = new AbortController();
    fetch(`/api/pexels?q=${encodeURIComponent(name)}%20travel`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { url?: string } | null) => {
        if (data?.url) setImageMap((previous) => ({ ...previous, [name]: data.url as string }));
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name !== "AbortError") return;
      });

    return () => controller.abort();
  }, [selectedCountry, imageMap]);

  useEffect(() => {
    if (!isMobileMapOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMapOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMapOpen]);

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

  const handleCountryHover = (country: RankingRow | null) => {
    setHoveredCountryKey(country ? countryKey(country) : null);
  };

  const handleMobileMapSelect = (country: RankingRow) => {
    setIsMobileMapOpen(false);
    setSelectedCountry(country);
  };

  return (
    <AppShell>
      <Toaster theme="dark" />

      <div className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Global Rankings</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Where Your Money Buys More Life</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Compare origin-relative purchasing power with the living-standard, service, stability and current FX effects that shape the final ranking.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button type="button" variant="outline" className="h-10 border-white/10 bg-zinc-950/60 px-3 text-xs uppercase tracking-[0.16em] text-zinc-200" onClick={() => setIsMethodologyOpen(true)}>
            <BookOpen className="h-3.5 w-3.5" /> Method
          </Button>
          <Button type="button" variant="outline" className="h-10 gap-2 border-white/10 bg-zinc-950/60 px-3 text-xs uppercase tracking-[0.16em] text-zinc-200 lg:hidden" onClick={() => setIsMobileMapOpen(true)}>
            <Map className="h-3.5 w-3.5" /> Map
          </Button>
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
        <PreferenceBar values={filters} origins={origins} onOpen={() => setIsPreferenceOpen(true)} />
      </div>

      <section className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] lg:items-start">
        <div className="sticky top-5 min-w-0">
          <WorldMap
            results={results}
            activeCountryKey={hoveredCountryKey}
            onCountryHover={handleCountryHover}
            onCountryClick={(country) => setSelectedCountry(country)}
          />
          <div className="mt-3 flex items-center justify-between gap-4 px-1 text-xs text-zinc-600">
            <span>Map color always represents Quality-Adjusted Value.</span>
            <span>{results.length ? `${results.length} destinations` : ""}</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Ranked destinations</p>
              <p className="mt-1 text-sm text-zinc-400">Hover a result to locate it on the map.</p>
            </div>
          </div>
          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 [scrollbar-color:#3f3f46_transparent] [scrollbar-width:thin]">
            <RankingList
              results={sortedResults}
              loading={loading}
              activeCountryKey={hoveredCountryKey}
              onCountryHover={handleCountryHover}
              onCountrySelect={setSelectedCountry}
              compact
              skeletonCount={6}
            />
          </div>
        </div>
      </section>

      <section className="lg:hidden">
        <RankingList
          results={sortedResults}
          loading={loading}
          activeCountryKey={hoveredCountryKey}
          onCountryHover={handleCountryHover}
          onCountrySelect={setSelectedCountry}
          skeletonCount={7}
        />
      </section>

      <AnimatePresence>
        {isMobileMapOpen ? (
          <motion.div
            className="fixed inset-0 z-[65] flex flex-col bg-zinc-950 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Discovery map</p>
                <p className="mt-1 text-sm font-semibold text-white">Quality-Adjusted Value</p>
              </div>
              <button type="button" onClick={() => setIsMobileMapOpen(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300" aria-label="Close map">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-1 items-center px-3 py-4 sm:px-5">
              <WorldMap
                results={results}
                activeCountryKey={hoveredCountryKey}
                onCountryHover={handleCountryHover}
                onCountryClick={handleMobileMapSelect}
              />
            </div>
            <div className="border-t border-white/10 px-4 py-3 text-center text-xs text-zinc-500">Select a country to inspect its value drivers.</div>
          </motion.div>
        ) : null}
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
                    <button onClick={() => toggleCompare(c)} className="absolute -right-1 -top-1 rounded-full border border-white/10 bg-zinc-950 p-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100" aria-label={`Remove ${c.country ?? c.iso3 ?? "country"} from comparison`}><X className="h-2.5 w-2.5" /></button>
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

      <PreferenceDrawer
        isOpen={isPreferenceOpen}
        values={filters}
        setValues={setFilters}
        origins={origins}
        onClose={() => setIsPreferenceOpen(false)}
      />

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
