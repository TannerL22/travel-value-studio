import { AlertTriangle, CheckCircle2, Database, House } from "lucide-react";

import { SectionHeading } from "@/components/country/RankingDrivers";
import type { RankingRow } from "@/lib/types";

export function EvidenceSummary({ country }: { country: RankingRow }) {
  const flags = country.data_quality_flags?.filter(Boolean) ?? [];

  return (
    <section>
      <SectionHeading
        eyebrow="Confidence & limitations"
        title="What the model knows — and what it deliberately leaves out"
        description="Missing evidence is generally treated as lower confidence rather than as proof that conditions are poor."
      />
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-zinc-500"><Database className="h-4 w-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Data quality</p></div>
          <div className="mt-4 flex items-end gap-3"><p className="text-4xl font-semibold text-white">{country.data_quality_grade ?? "N/A"}</p>{country.data_quality_score != null ? <p className="pb-1 text-sm text-zinc-500">{Math.round(country.data_quality_score)}/100</p> : null}</div>
          {flags.length ? (
            <div className="mt-5 space-y-2">
              {flags.slice(0, 6).map((flag) => <div key={flag} className="flex gap-2 text-xs leading-5 text-zinc-500"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/70" /><span>{flag.replaceAll("_", " ")}</span></div>)}
            </div>
          ) : (
            <div className="mt-5 flex gap-2 text-xs leading-5 text-zinc-500"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /><span>No additional data-quality flags were returned for this destination.</span></div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-zinc-500"><House className="h-4 w-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Model limitations</p></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Limitation title="Temporary housing" text="Furnished 30–90 day housing accessible to a foreign visitor is not included because free global data are not currently comparable enough." />
            <Limitation title="Travel costs" text="Flights, visas, relocation and travel-to-destination costs are outside the destination-value score." />
            <Limitation title="Personal safety" text="Political stability should not be read as a comprehensive crime, conflict or traveler-safety score." />
            <Limitation title="City ranking" text="City usability helps order returned candidates but does not change the country Quality-Adjusted Value ranking." />
            <Limitation title="Personal basket" text="Purchasing power is a broad private-consumption comparison, not a prediction of your own monthly spend." />
            <Limitation title="FX timing" text="Historical currency strength is a bounded timing signal, not an exchange-rate forecast." />
          </div>
        </div>
      </div>
    </section>
  );
}

function Limitation({ title, text }: { title: string; text: string }) {
  return <div><p className="text-sm font-medium text-zinc-200">{title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p></div>;
}
