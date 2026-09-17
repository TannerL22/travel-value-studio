"use client";

import { Info } from "lucide-react";

import type { FilterState, Origin } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type { FilterState, Origin } from "@/lib/types";

type ControlPanelProps = {
  values: FilterState;
  setValues: (v: FilterState) => void;
  origins: Origin[];
};

export function ControlPanel({ values, setValues, origins }: ControlPanelProps) {
  const setField = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setValues({ ...values, [key]: value });
  };

  const controls = [
    {
      key: "budget_sens" as const,
      label: "Cheapness Priority",
      help: "Higher = make origin-relative private-consumption purchasing power more decisive. Phase 7 saturates the ranking effect beyond roughly 1/3x–3x so extreme PPP/FX values cannot dominate indefinitely.",
      accent: "[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500 [&_[data-slot=slider-thumb]]:ring-emerald-500/40",
    },
    {
      key: "comfort" as const,
      label: "Comfort Requirement",
      help: "Higher = more strongly penalize destinations that fail the modern basic-services floor. Destinations that clear the threshold do not receive an unlimited development bonus.",
      accent: "[&_[data-slot=slider-range]]:bg-emerald-400/70 [&_[data-slot=slider-thumb]]:border-emerald-300 [&_[data-slot=slider-thumb]]:ring-emerald-500/30",
    },
    {
      key: "supply_need" as const,
      label: "Service Depth Requirement",
      help: "Higher = more strongly penalize thin accommodation and established visitor-service supply. WEF TTDI supply evidence is preferred; arrivals fallback has lower penalty authority.",
      accent: "[&_[data-slot=slider-range]]:bg-zinc-200/60 [&_[data-slot=slider-thumb]]:border-zinc-200 [&_[data-slot=slider-thumb]]:ring-white/20",
    },
    {
      key: "risk_pri" as const,
      label: "Stability Priority",
      help: "Higher = more strongly penalize low WGI political stability. Zero means exactly ignore stability; missing WGI evidence is neutral rather than treated as poor conditions.",
      accent: "[&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-400 [&_[data-slot=slider-thumb]]:ring-indigo-500/40",
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <section className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 backdrop-blur-xl sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(14rem,0.8fr)_minmax(0,2.2fr)] xl:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Reference market</p>
            <div className="mt-3 flex items-center gap-2">
              <select
                className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                value={values.origin_iso3}
                onChange={(event) => setField("origin_iso3", event.target.value)}
              >
                {origins.length === 0 ? (
                  <option value="USA">Loading countries...</option>
                ) : (
                  origins.map((origin) => (
                    <option key={origin.code} value={origin.code} className="bg-zinc-900 text-zinc-200">
                      {origin.name} · {origin.currency}
                    </option>
                  ))
                )}
              </select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="rounded-md p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200" aria-label="Reference market info"><Info className="h-4 w-4" /></button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">The selected country provides both the purchasing-power reference level and the currency used for bilateral FX opportunity.</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {controls.map((control) => (
              <div key={control.key} className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-zinc-400">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{control.label}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label={`${control.label} info`} className="shrink-0 text-zinc-500 transition hover:text-zinc-200"><Info className="h-3.5 w-3.5" /></button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">{control.help}</TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="shrink-0 text-zinc-200">{values[control.key].toFixed(2)}</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[values[control.key]]}
                  onValueChange={(value) => setField(control.key, value[0] ?? 0)}
                  className={control.accent}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
