import Link from "next/link";
import { ArrowLeft, ExternalLink, GitCompareArrows } from "lucide-react";

import { formatFxRankingEffect } from "@/lib/ranking-explanations";
import type { RankingRow } from "@/lib/types";

type CountryHeroProps = {
  country: RankingRow;
  backHref: string;
  compareHref: string;
  methodologyHref: string;
  imageUrl?: string | null;
  referenceLabel: string;
};

const score = (country: RankingRow) => country.quality_adjusted_value ?? country.Score ?? country.score ?? null;
const purchasingPower = (country: RankingRow) => country.structural_purchasing_power ?? country.value_multiplier_relative ?? null;

export function CountryHero({ country, backHref, compareHref, methodologyHref, imageUrl, referenceLabel }: CountryHeroProps) {
  const name = country.country ?? country.iso3 ?? "Unknown destination";
  const valueScore = score(country);
  const pp = purchasingPower(country);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55">
      <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Discover
            </Link>
            <Link href={compareHref} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white">
              <GitCompareArrows className="h-4 w-4" /> Compare this destination
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            <span>{country.iso3 ?? ""}</span>
            {country.rank != null ? <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">Global value rank #{country.rank}</span> : null}
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Current destination value relative to {referenceLabel}. The score combines purchasing power with preference-controlled comfort, service, stability and FX effects.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <HeroMetric label="Value score" value={valueScore != null ? Math.round(valueScore).toString() : "N/A"} />
            <HeroMetric label="Purchasing power" value={pp != null ? `${pp.toFixed(2)}×` : "N/A"} />
            <HeroMetric label="FX rank effect" value={formatFxRankingEffect(country)} />
            <HeroMetric label="Data quality" value={country.data_quality_grade ?? "N/A"} />
          </div>
        </div>

        <div className="relative min-h-64 border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
          {imageUrl ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.18),transparent_45%),linear-gradient(145deg,#18181b,#09090b)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Important scope note</p>
            <p className="mt-2 text-sm leading-5 text-zinc-300">Temporary furnished housing for 30–90 day stays is not yet modeled.</p>
            <Link href={methodologyHref} className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200">
              Model scope <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
    </div>
  );
}
