"use client";

import { Info } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Origin {
  name: string;
  code: string;
  pp_multiplier: number;
  currency: string;
}

export interface FilterState {
  year: number;
  origin_iso3: string;
  budget_sens: number;
  comfort: number;
  supply_need: number;
  risk_pri: number;
}

type ControlPanelProps = {
  values: FilterState;
  setValues: (v: FilterState) => void;
  origins: Origin[];
};

export function ControlPanel({ values, setValues, origins }: ControlPanelProps) {
  const setField = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setValues({ ...values, [key]: value });
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl">
      <TooltipProvider delayDuration={150}>
        <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Travel Value Studio</p>
            <p className="mt-2 text-sm text-zinc-300">Quality-Adjusted Purchasing Power</p>
          </div>

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">My Money</p>
            <label className="flex flex-col gap-2 text-sm text-zinc-200">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400">
                <span>Origin Currency</span>
                <Tooltip>
                  <TooltipTrigger asChild><button type="button" className="text-zinc-500 hover:text-zinc-200" aria-label="Origin currency info"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger>
                  <TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">Select the country whose primary currency you hold or earn. The model uses that currency for relative purchasing power and bilateral 1W, 1M, 3M, 1Y and 3Y FX opportunity.</TooltipContent>
                </Tooltip>
              </div>
              <select className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/70" value={values.origin_iso3} onChange={(event) => setField("origin_iso3", event.target.value)}>
                {origins.length === 0 ? <option value="USA">Loading countries...</option> : origins.map((origin) => <option key={origin.code} value={origin.code} className="bg-zinc-900 text-zinc-200">{origin.name} · {origin.currency}</option>)}
              </select>
            </label>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Value Preferences</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
                <div className="flex items-center gap-2"><span>Cheapness Priority</span><Tooltip><TooltipTrigger asChild><button type="button" aria-label="Cheapness priority info" className="text-zinc-500 transition hover:text-zinc-200"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">Higher = put more weight on destinations where broad local consumption is inexpensive relative to market exchange rates.</TooltipContent></Tooltip></div>
                <span className="text-zinc-200">{values.budget_sens.toFixed(2)}</span>
              </div>
              <Slider min={0} max={1} step={0.05} value={[values.budget_sens]} onValueChange={(value) => setField("budget_sens", value[0] ?? 0)} className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500 [&_[data-slot=slider-thumb]]:ring-emerald-500/40" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
                <div className="flex items-center gap-2"><span>Comfort Requirement</span><Tooltip><TooltipTrigger asChild><button type="button" aria-label="Comfort requirement info" className="text-zinc-500 transition hover:text-zinc-200"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">Higher = more strongly penalize destinations that fail a modern basic-services floor. Phase 3 uses drinking water, sanitation, electricity, internet use and health-service coverage, with GDP PPP only as a missing-data fallback.</TooltipContent></Tooltip></div>
                <span className="text-zinc-200">{values.comfort.toFixed(2)}</span>
              </div>
              <Slider min={0} max={1} step={0.05} value={[values.comfort]} onValueChange={(value) => setField("comfort", value[0] ?? 0)} className="[&_[data-slot=slider-range]]:bg-emerald-400/70 [&_[data-slot=slider-thumb]]:border-emerald-300 [&_[data-slot=slider-thumb]]:ring-emerald-500/30" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
                <div className="flex items-center gap-2"><span>Service Depth Requirement</span><Tooltip><TooltipTrigger asChild><button type="button" aria-label="Service depth requirement info" className="text-zinc-500 transition hover:text-zinc-200"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">Higher = more strongly penalize destinations with thin accommodation and established visitor-service supply. Phase 4 prefers WEF TTDI Tourist Services & Infrastructure; arrivals per resident are only a reduced-confidence fallback outside TTDI coverage.</TooltipContent></Tooltip></div>
                <span className="text-zinc-200">{values.supply_need.toFixed(2)}</span>
              </div>
              <Slider min={0} max={1} step={0.05} value={[values.supply_need]} onValueChange={(value) => setField("supply_need", value[0] ?? 0)} className="[&_[data-slot=slider-range]]:bg-zinc-200/60 [&_[data-slot=slider-thumb]]:border-zinc-200 [&_[data-slot=slider-thumb]]:ring-white/20" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
                <div className="flex items-center gap-2"><span>Stability Priority</span><Tooltip><TooltipTrigger asChild><button type="button" aria-label="Stability priority info" className="text-zinc-500 transition hover:text-zinc-200"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">Higher = more strongly penalize political instability and violence risk. The current source is not a complete personal-safety or crime measure.</TooltipContent></Tooltip></div>
                <span className="text-zinc-200">{values.risk_pri.toFixed(2)}</span>
              </div>
              <Slider min={0} max={1} step={0.05} value={[values.risk_pri]} onValueChange={(value) => setField("risk_pri", value[0] ?? 0)} className="[&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-400 [&_[data-slot=slider-thumb]]:ring-indigo-500/40" />
            </div>
          </section>

          <section className="mt-auto border-t border-white/10 pt-4">
            <p className="text-[10px] leading-4 text-zinc-500">Phase 6 adds Mobility and Digital Convenience to the city drill-down. They are diagnostics only for now—no extra sliders and no hidden ranking weight until Phase 7 validates how these fields behave across markets.</p>
          </section>
        </div>
      </TooltipProvider>
    </aside>
  );
}
