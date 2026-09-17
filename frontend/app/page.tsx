"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { BookOpen, Map, X } from "lucide-react";

import { RankingList } from "@/components/discover/RankingList";
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

export default function Home() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [urlHydrated, setUrlHydrated] = useState(false);
  const [sortBy, setSortBy] = useState<"value" | "purchasing_power" | "stability">("value");
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isPreferenceOpen, setIsPreferenceOpen] = useState(false);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);
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

  const openCountry = (country: RankingRow) => {
    const code = country.iso3?.toUpperCase();
    if (!code) {
      toast.error("This destination does not have a country code for detail navigation.");
      return;
    }
    const params = preferencesToSearchParams(filters).toString();
    router.push(`/country/${code}?${params}`);
  };

  const handleMobileMapSelect = (country: RankingRow) => {
    setIsMobileMapOpen(false);
    openCountry(country);
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
            onCountryClick={openCountry}
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
              <p className="mt-1 text-sm text-zinc-400">Hover a result to locate it on the map. Select it for the full country analysis.</p>
            </div>
          </div>
          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 [scrollbar-color:#3f3f46_transparent] [scrollbar-width:thin]">
            <RankingList
              results={sortedResults}
              loading={loading}
              activeCountryKey={hoveredCountryKey}
              onCountryHover={handleCountryHover}
              onCountrySelect={openCountry}
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
          onCountrySelect={openCountry}
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
            <div className="border-t border-white/10 px-4 py-3 text-center text-xs text-zinc-500">Select a country to open its full value analysis.</div>
          </motion.div>
        ) : null}
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
