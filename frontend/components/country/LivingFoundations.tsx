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
      <div className="mt-6 grid gap-7 border-y border-white/[0.08] py-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/[0.08]">
        <FoundationBlock
          icon={HeartPulse}
          label="Basic comfort"
          score={country.basic_comfort}
          factor={country.basic_comfort_penalty}
          coverage={country.basic_comfort_coverage}
          note="Water, sanitation, electricity, internet access and health-service baseline."
        />
        <FoundationBlock
          icon={Building2}
          label="Service depth"
          score={country.service_depth}
          factor={country.service_depth_penalty}
          coverage={country.service_depth_coverage}
          note="Established accommodation and visitor-service supply; not a tourism-popularity score."
        />
        <FoundationBlock
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

function FoundationBlock({ icon: Icon, label, score, factor, coverage, note }: { icon: typeof HeartPulse; label: string; score?: number | null; factor?: number | null; coverage?: number | null; note: string }) {
  const effect = typeof factor === "number" && Number.isFinite(factor) ? (factor - 1) * 100 : null;
  const effectLabel = effect == null ? "No effect data" : Math.abs(effect) < 0.5 ? "No material penalty" : `${Math.round(effect)}% rank effect`;
  return (
    <div className="md:px-6 md:first:pl-0 md:last:pr-0">
      <div className="flex items-center gap-2 text-zinc-500"><Icon className="h-4 w-4" aria-hidden="true" /><p className="text-sm font-medium text-zinc-300">{label}</p></div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-white">{score != null && Number.isFinite(score) ? Math.round(score) : "N/A"}</p>
        <span className={effect != null && effect < -0.5 ? "text-xs font-medium text-amber-200" : "text-xs text-zinc-500"}>{effectLabel}</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-zinc-300" style={{ width: `${score != null ? Math.max(0, Math.min(100, score)) : 0}%` }} /></div>
      <p className="mt-3 text-xs leading-5 text-zinc-500">{note}</p>
      {coverage != null ? <p className="mt-2 text-xs text-zinc-600">Evidence coverage {Math.round(coverage * 100)}%</p> : null}
    </div>
  );
}
