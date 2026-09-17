"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { AlertCircle, BookOpen, GitCompareArrows, Map, X } from "lucide-react";

import { RankingList } from "@/components/discover/RankingList";
import { PreferenceBar } from "@/components/preferences/PreferenceBar";
import { PreferenceDrawer } from "@/components/preferences/PreferenceDrawer";
import { AppShell } from "@/components/shell/AppShell";
import { WorldMap } from "@/components/WorldMap";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { useModalDialog } from "@/hooks/useModalDialog";
import { useOrigins } from "@/hooks/useOrigins";
import { useRankings } from "@/hooks/useRankings";
import { DEFAULT_FILTERS, parsePreferences, preferencesToSearchParams } from "@/lib/preferences";
import type { FilterState, RankingRow } from "@/lib/types";

const countryKey = (country: RankingRow) => (country.iso3 ?? country.country ?? "unknown").toUpperCase();

export default function Home() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const mobileMapDialogRef = useRef<HTMLDivElement | null>(null);
  const mobileMapCloseRef = useRef<HTMLButtonElement | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [urlHydrated, setUrlHydrated] = useState(false);
  const [sortBy, setSortBy] = useState<"value" | "purchasing_power" | "stability">("value");
  const [isPreferenceOpen, setIsPreferenceOpen] = useState(false);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);
  const [hoveredCountryKey, setHoveredCountryKey] = useState<string | null>(null);

  useModalDialog({
    open: isMobileMapOpen,
    onClose: () => setIsMobileMapOpen(false),
    containerRef: mobileMapDialogRef,
    initialFocusRef: mobileMapCloseRef,
  });

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

  const preferenceQuery = () => preferencesToSearchParams(filters).toString();

  const openCountry = (country: RankingRow) => {
    const code = country.iso3?.toUpperCase();
    if (!code) {
      toast.error("This destination does not have a country code for detail navigation.");
      return;
    }
    router.push(`/country/${code}?${preferenceQuery()}`);
  };

  const openCompare = () => router.push(`/compare?${preferenceQuery()}`);
  const openMethodology = () => router.push(`/methodology?${preferenceQuery()}`);

  const handleMobileMapSelect = (country: RankingRow) => {
    setIsMobileMapOpen(false);
    openCountry(country);
  };

  return (
    <AppShell>
      <Toaster theme="dark" />

      <div className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">Global Rankings</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Where Your Money Buys More Life</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Compare origin-relative purchasing power with the living-standard, service, stability and current FX effects that shape the final ranking.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <Button type="button" variant="outline" className="min-h-11 border-white/10 bg-zinc-950/60 px-3 text-[11px] uppercase tracking-[0.12em] text-zinc-200 sm:text-xs sm:tracking-[0.16em]" onClick={openCompare}>
            <GitCompareArrows className="h-3.5 w-3.5" /> <span className="hidden min-[390px]:inline">Compare</span>
          </Button>
          <Button type="button" variant="outline" className="min-h-11 border-white/10 bg-zinc-950/60 px-3 text-[11px] uppercase tracking-[0.12em] text-zinc-200 sm:text-xs sm:tracking-[0.16em]" onClick={openMethodology}>
            <BookOpen className="h-3.5 w-3.5" /> <span className="hidden min-[390px]:inline">Method</span>
          </Button>
          <Button type="button" variant="outline" className="min-h-11 gap-2 border-white/10 bg-zinc-950/60 px-3 text-[11px] uppercase tracking-[0.12em] text-zinc-200 lg:hidden" onClick={() => setIsMobileMapOpen(true)}>
            <Map className="h-3.5 w-3.5" /> <span className="hidden min-[390px]:inline">Map</span>
          </Button>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger aria-label="Sort destinations" className="col-span-3 min-h-11 w-full border-white/10 bg-zinc-950/60 text-xs uppercase tracking-[0.14em] text-zinc-200 sm:w-56"><SelectValue placeholder="Sort by" /></SelectTrigger>
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

      {rankingsError ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-sm text-zinc-300" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
          <div><p className="font-medium text-zinc-100">Rankings could not be refreshed.</p><p className="mt-1 text-xs leading-5 text-zinc-400">The ranking service is unavailable. If cached results remain visible, treat them as potentially stale.</p></div>
        </div>
      ) : null}

      <section className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] lg:items-start" aria-label="Map and ranked destinations">
        <div className="sticky top-5 min-w-0">
          <WorldMap results={results} activeCountryKey={hoveredCountryKey} onCountryHover={handleCountryHover} onCountryClick={openCountry} />
          <div className="mt-3 flex items-center justify-between gap-4 px-1 text-xs text-zinc-400">
            <span>Map color always represents Quality-Adjusted Value.</span>
            <span>{results.length ? `${results.length} destinations` : ""}</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Ranked destinations</p>
              <p className="mt-1 text-sm text-zinc-300">Hover or focus a result to locate it on the map. Select it for the full country analysis.</p>
            </div>
          </div>
          <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pr-2 [scrollbar-color:#3f3f46_transparent] [scrollbar-width:thin]">
            <RankingList results={sortedResults} loading={loading} activeCountryKey={hoveredCountryKey} onCountryHover={handleCountryHover} onCountrySelect={openCountry} compact skeletonCount={6} />
          </div>
        </div>
      </section>

      <section className="lg:hidden" aria-label="Ranked destinations">
        <RankingList results={sortedResults} loading={loading} activeCountryKey={hoveredCountryKey} onCountryHover={handleCountryHover} onCountrySelect={openCountry} skeletonCount={7} />
      </section>

      <AnimatePresence initial={!reduceMotion}>
        {isMobileMapOpen ? (
          <motion.div
            ref={mobileMapDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-map-title"
            tabIndex={-1}
            className="fixed inset-0 z-[65] flex flex-col bg-zinc-950 lg:hidden"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Discovery map</p><p id="mobile-map-title" className="mt-1 text-sm font-semibold text-white">Quality-Adjusted Value</p></div>
              <button ref={mobileMapCloseRef} type="button" onClick={() => setIsMobileMapOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Close map"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-1 items-center overflow-auto px-3 py-4 sm:px-5">
              <WorldMap results={results} activeCountryKey={hoveredCountryKey} onCountryHover={handleCountryHover} onCountryClick={handleMobileMapSelect} />
            </div>
            <div className="border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-xs text-zinc-400">Select a country to open its full value analysis.</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <PreferenceDrawer isOpen={isPreferenceOpen} values={filters} setValues={setFilters} origins={origins} onClose={() => setIsPreferenceOpen(false)} />
    </AppShell>
  );
}
