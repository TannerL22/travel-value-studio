import { CalendarDays, Coins, TrendingUp } from "lucide-react";

import { formatFxRankingEffect } from "@/lib/ranking-explanations";
import type { RankingRow } from "@/lib/types";
import { SectionHeading } from "@/components/country/RankingDrivers";

export function ValueSummary({ country, referenceLabel }: { country: RankingRow; referenceLabel: string }) {
  const pp = country.structural_purchasing_power ?? country.value_multiplier_relative ?? null;
  const advantage = country.purchasing_power_advantage_pct ?? (pp != null ? (pp - 1) * 100 : null);

  return (
    <section>
      <SectionHeading
        eyebrow="Current value & currency"
        title="How far your money goes — and whether FX is helping now"
        description={`Purchasing power is measured relative to ${referenceLabel}. FX timing is a separate, bounded adjustment so a short-term currency move cannot overwhelm structural destination value.`}
      />
      <div className="mt-6 grid gap-6 border-y border-white/[0.08] py-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/[0.08]">
        <MetricBlock icon={Coins} label="Structural purchasing power" value={pp != null ? `${pp.toFixed(2)}×` : "N/A"} note="Broad private-consumption purchasing power relative to your reference market; not a personal daily-budget forecast." />
        <MetricBlock icon={TrendingUp} label="Purchasing-power difference" value={advantage != null ? `${advantage >= 0 ? "+" : ""}${Math.round(advantage)}%` : "N/A"} note="Positive means your reference-market money buys more broad consumption locally." />
        <MetricBlock icon={CalendarDays} label="Current FX rank effect" value={formatFxRankingEffect(country)} note={country.fx_frankfurter_date ? `Latest market-FX observation: ${country.fx_frankfurter_date}.` : "FX effect is bounded and becomes neutral when reliable evidence is unavailable."} />
      </div>
    </section>
  );
}

function MetricBlock({ icon: Icon, label, value, note }: { icon: typeof Coins; label: string; value: string; note: string }) {
  return (
    <div className="md:px-6 md:first:pl-0 md:last:pr-0">
      <div className="flex items-center gap-2 text-zinc-500"><Icon className="h-4 w-4" aria-hidden="true" /><p className="text-sm font-medium text-zinc-300">{label}</p></div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">{note}</p>
    </div>
  );
}
