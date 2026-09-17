import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { formatDriverEffect, rankingDrivers } from "@/lib/ranking-explanations";
import type { RankingRow } from "@/lib/types";

export function RankingDrivers({ country }: { country: RankingRow }) {
  const drivers = rankingDrivers(country);
  const helps = drivers.filter((driver) => driver.direction === "help").slice(0, 3);
  const limits = drivers.filter((driver) => driver.direction === "limit").slice(0, 3);

  return (
    <section>
      <SectionHeading eyebrow="Why it ranks" title="What is helping — and what is holding it back" />
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <DriverColumn title="Helps" tone="positive">
          {helps.length ? helps.map((driver) => (
            <DriverRow key={driver.key} label={driver.label} effect={formatDriverEffect(driver.effectPct)} direction="help" />
          )) : <EmptyRow text="No material positive adjustment beyond the neutral baseline." />}
        </DriverColumn>

        <DriverColumn title="Limits" tone="negative">
          {limits.length ? limits.map((driver) => (
            <DriverRow key={driver.key} label={driver.label} effect={formatDriverEffect(driver.effectPct)} direction="limit" />
          )) : <EmptyRow text="No material shortfall penalty under your current preferences." />}
        </DriverColumn>

        <DriverColumn title="Not modeled" tone="neutral">
          <div className="space-y-3">
            <ScopeRow label="Temporary furnished housing" note="30–90 day accessible rental pricing remains outside the score." />
            <ScopeRow label="Travel-to-destination cost" note="Flights and other access costs are deliberately excluded." />
            <ScopeRow label="Personal crime risk" note="Political stability is not a complete traveler-safety measure." />
          </div>
        </DriverColumn>
      </div>
    </section>
  );
}

function DriverColumn({ title, tone, children }: { title: string; tone: "positive" | "negative" | "neutral"; children: React.ReactNode }) {
  const toneClass = tone === "positive" ? "text-emerald-300" : tone === "negative" ? "text-amber-300" : "text-zinc-300";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${toneClass}`}>{title}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function DriverRow({ label, effect, direction }: { label: string; effect: string; direction: "help" | "limit" }) {
  const Icon = direction === "help" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-sm text-zinc-300">
        <Icon className={`h-4 w-4 ${direction === "help" ? "text-emerald-400" : "text-amber-300"}`} />
        <span>{label}</span>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums text-white">{effect}</span>
    </div>
  );
}

function ScopeRow({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex gap-2">
      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
      <div><p className="text-sm text-zinc-300">{label}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{note}</p></div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm leading-6 text-zinc-500">{text}</p>;
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
      {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{description}</p> : null}
    </div>
  );
}
