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
    <section className="border-b border-white/[0.08] pb-8 sm:pb-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)] lg:items-stretch">
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                <ArrowLeft className="h-4 w-4" /> Back to Discover
              </Link>
              <Link href={compareHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 sm:justify-start">
                <GitCompareArrows className="h-4 w-4" /> Compare destination
              </Link>
            </div>

            <p className="mt-8 text-sm text-zinc-500">
              {country.iso3 ?? ""}{country.rank != null ? <span> · Global value rank #{country.rank}</span> : null}
            </p>
            <h1 className="mt-2 break-words text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">{name}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-[15px]">
              Current destination value relative to {referenceLabel}. Purchasing power is adjusted only when comfort, services, stability or current FX conditions materially affect the selected preference profile.
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            <HeroMetric label="Value score" value={valueScore != null ? Math.round(valueScore).toString() : "N/A"} />
            <HeroMetric label="Purchasing power" value={pp != null ? `${pp.toFixed(2)}×` : "N/A"} />
            <HeroMetric label="FX effect" value={formatFxRankingEffect(country)} />
            <HeroMetric label="Data quality" value={country.data_quality_grade ?? "N/A"} />
          </div>
        </div>

        <div className="relative min-h-72 overflow-hidden rounded-2xl bg-zinc-900 lg:min-h-[360px]">
          {imageUrl ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} role="img" aria-label={`${name} destination image`} />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.14),transparent_45%),linear-gradient(145deg,#18181b,#09090b)]" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/15 to-transparent" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <p className="text-xs font-medium text-zinc-300">Housing is not yet modeled</p>
            <p className="mt-1.5 max-w-sm text-xs leading-5 text-zinc-400">Furnished 30–90 day stays remain outside the score because comparable free global data are not robust enough.</p>
            <Link href={methodologyHref} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-medium text-cyan-200 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
              Review model scope <ExternalLink className="h-3 w-3" />
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
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}
