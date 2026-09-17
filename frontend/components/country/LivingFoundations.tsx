import { Building2, HeartPulse, Landmark } from "lucide-react";

import { SectionHeading } from "@/components/country/RankingDrivers";
import type { RankingRow } from "@/lib/types";

export function LivingFoundations({ country }: { country: RankingRow }) {
  return (
    <section>
      <SectionHeading
        eyebrow="Living foundations"
        title="The conditions that can reduce otherwise-cheap destination value"
        description="These are threshold-style safeguards, not rich-country bonuses. They matter when a destination falls short of the level implied by your preferences."
      />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <FoundationCard
          icon={HeartPulse}
          label="Basic comfort"
          score={country.basic_comfort}
          factor={country.basic_comfort_penalty}
          coverage={country.basic_comfort_coverage}
          note="Water, sanitation, electricity, internet access and health-service baseline."
        />
        <FoundationCard
          icon={Building2}
          label="Service depth"
          score={country.service_depth}
          factor={country.service_depth_penalty}
          coverage={country.service_depth_coverage}
          note="Established accommodation and visitor-service supply; not a tourism-popularity score."
        />
        <FoundationCard
          icon={Landmark}
          label="Political stability"
          score={country.stability ?? country.component_safety_stability}
          factor={country.stability_penalty}
          coverage={country.stability_evidence_coverage}
          note="WGI-led political stability context. It is not a complete crime or personal-safety measure."
        />
      </div>
    </section>
  );
}

function FoundationCard({ icon: Icon, label, score, factor, coverage, note }: { icon: typeof HeartPulse; label: string; score?: number | null; factor?: number | null; coverage?: number | null; note: string }) {
  const effect = typeof factor === "number" && Number.isFinite(factor) ? (factor - 1) * 100 : null;
  const effectLabel = effect == null ? "No effect data" : Math.abs(effect) < 0.5 ? "No material penalty" : `${Math.round(effect)}% rank effect`;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-zinc-500"><Icon className="h-4 w-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.14em]">{label}</p></div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] ${effect != null && effect < -0.5 ? "border-amber-300/20 bg-amber-300/5 text-amber-300" : "border-white/10 bg-white/[0.03] text-zinc-400"}`}>{effectLabel}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-white">{score != null && Number.isFinite(score) ? Math.round(score) : "N/A"}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-zinc-300" style={{ width: `${score != null ? Math.max(0, Math.min(100, score)) : 0}%` }} /></div>
      <p className="mt-3 text-xs leading-5 text-zinc-500">{note}</p>
      {coverage != null ? <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-zinc-600">Evidence coverage {Math.round(coverage * 100)}%</p> : null}
    </div>
  );
}
