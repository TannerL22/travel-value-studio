"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, BookOpen, GitCompareArrows, Map, X } from "lucide-react";

import { RankingList } from "@/components/discover/RankingList";
import { PreferenceBar } from "@/components/preferences/PreferenceBar";
import { PreferenceDrawer } from "@/components/preferences/PreferenceDrawer";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useModalDialog } from "@/hooks/useModalDialog";
import { useOrigins } from "@/hooks/useOrigins";
import { useRankings } from "@/hooks/useRankings";
import { DEFAULT_FILTERS, parsePreferences, preferencesToSearchParams } from "@/lib/preferences";
import type { FilterState, RankingRow } from "@/lib/types";

const WorldMap = dynamic(() => import("@/components/WorldMap").then((module) => module.WorldMap), {
  ssr: false,
  loading: () => <MapLoading />,
});

const countryKey = (country: RankingRow) => (country.iso3 ?? country.country ?? "unknown").toUpperCase();

export default function Home() {
  const router = useRouter();
  const showDesktopMap = useMediaQuery("(min-width: 1024px)");
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

  const preferenceQuery = useMemo(() => preferencesToSearchParams(filters).toString(), [filters]);

  const handleCountryHover = useCallback((country: RankingRow | null) => {
    setHoveredCountryKey(country ? countryKey(country) : null);
  }, []);

  const openCountry = useCallback((country: RankingRow) => {
    const code = country.iso3?.toUpperCase();
    if (!code) {
      toast.error("This destination does not have a country code for detail navigation.");
      return;
    }
    router.push(`/country/${code}?${preferenceQuery}`);
  }, [preferenceQuery, router]);

  const openCompare = useCallback(() => router.push(`/compare?${preferenceQuery}`), [preferenceQuery, router]);
  const openMethodology = useCallback(() => router.push(`/methodology?${preferenceQuery}`), [preferenceQuery, router]);

  const handleMobileMapSelect = useCallback((country: RankingRow) => {
    setIsMobileMapOpen(false);
    openCountry(country);
  }, [openCountry]);

  return (
    <AppShell>
      <Toaster theme="dark" />

      <header className="mb-6 flex flex-col gap-5 lg:mb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-cyan-300/80">Discover</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Where your money buys more life</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-[15px]">
            Compare purchasing power with the living-standard, service, stability and current FX effects that shape destination value.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button type="button" variant="ghost" className="min-h-11 gap-2 px-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white" onClick={openCompare}>
            <GitCompareArrows className="h-4 w-4" /> <span className="hidden min-[390px]:inline">Compare</span>
          </Button>
          <Button type="button" variant="ghost" className="min-h-11 gap-2 px-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white" onClick={openMethodology}>
            <BookOpen className="h-4 w-4" /> <span className="hidden min-[390px]:inline">Methodology</span>
          </Button>
          <Button type="button" variant="ghost" className="min-h-11 gap-2 px-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white lg:hidden" onClick={() => setIsMobileMapOpen(true)}>
            <Map className="h-4 w-4" /> <span className="hidden min-[390px]:inline">Map</span>
          </Button>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger aria-label="Sort destinations" className="col-span-3 min-h-11 w-full border-white/[0.08] bg-transparent text-sm text-zinc-300 sm:w-52"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950 text-zinc-100">
              <SelectItem value="value">Sort: Value score</SelectItem>
              <SelectItem value="purchasing_power">Sort: Purchasing power</SelectItem>
              <SelectItem value="stability">Sort: Stability</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="mb-7">
        <PreferenceBar values={filters} origins={origins} onOpen={() => setIsPreferenceOpen(true)} />
      </div>

      {rankingsError ? (
        <div className="mb-5 flex items-start gap-3 border-y border-amber-300/15 bg-amber-300/[0.025] px-1 py-4 text-sm text-zinc-300" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
          <div><p className="font-medium text-zinc-100">Rankings could not be refreshed.</p><p className="mt-1 text-xs leading-5 text-zinc-400">The ranking service is unavailable. If cached results remain visible, treat them as potentially stale.</p></div>
        </div>
      ) : null}

      <section className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1.62fr)_minmax(360px,1fr)] lg:items-start" aria-label="Map and ranked destinations">
        <div className="sticky top-24 min-w-0">
          {showDesktopMap ? (
            <WorldMap results={results} activeCountryKey={hoveredCountryKey} onCountryHover={handleCountryHover} onCountryClick={openCountry} />
          ) : <MapLoading />}
          <div className="mt-3 flex items-center justify-between gap-4 px-1 text-xs text-zinc-500">
            <span>Map colour represents Quality-Adjusted Value.</span>
            <span>{results.length ? `${results.length} destinations` : ""}</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3 px-1">
            <h2 className="text-sm font-semibold text-zinc-200">Ranked destinations</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">Hover or focus to locate a destination on the map.</p>
          </div>
          <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain pr-2 [scrollbar-color:#3f3f46_transparent] [scrollbar-width:thin]">
            <RankingList results={sortedResults} loading={loading} activeCountryKey={hoveredCountryKey} onCountryHover={handleCountryHover} onCountrySelect={openCountry} compact skeletonCount={6} />
          </div>
        </div>
      </section>

      <section className="lg:hidden" aria-label="Ranked destinations">
        <RankingList results={sortedResults} loading={loading} activeCountryKey={hoveredCountryKey} onCountryHover={handleCountryHover} onCountrySelect={openCountry} skeletonCount={7} />
      </section>

      {isMobileMapOpen ? (
        <div
          ref={mobileMapDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-map-title"
          tabIndex={-1}
          className="fixed inset-0 z-[65] flex flex-col bg-zinc-950 lg:hidden"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div><p className="text-xs text-zinc-500">Discovery map</p><p id="mobile-map-title" className="mt-0.5 text-sm font-semibold text-white">Quality-Adjusted Value</p></div>
            <button ref={mobileMapCloseRef} type="button" onClick={() => setIsMobileMapOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Close map"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-1 items-center overflow-auto px-3 py-4 sm:px-5">
            <WorldMap results={results} activeCountryKey={hoveredCountryKey} onCountryHover={handleCountryHover} onCountryClick={handleMobileMapSelect} />
          </div>
          <div className="border-t border-white/[0.07] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-xs text-zinc-500">Select a country to open its full value analysis.</div>
        </div>
      ) : null}

      <PreferenceDrawer isOpen={isPreferenceOpen} values={filters} setValues={setFilters} origins={origins} onClose={() => setIsPreferenceOpen(false)} />
    </AppShell>
  );
}

function MapLoading() {
  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950/70" aria-live="polite" aria-busy="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_40%,rgba(34,211,238,0.06),transparent_36%)]" aria-hidden="true" />
      <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">Loading map…</p>
    </div>
  );
}
