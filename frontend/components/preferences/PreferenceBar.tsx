"use client";

import { Globe2, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PREFERENCE_DEFINITIONS, preferenceLevel } from "@/lib/preferences";
import type { FilterState, Origin } from "@/lib/types";

type PreferenceBarProps = {
  values: FilterState;
  origins: Origin[];
  onOpen: () => void;
};

export function PreferenceBar({ values, origins, onOpen }: PreferenceBarProps) {
  const origin = origins.find((item) => item.code === values.origin_iso3);
  const referenceName = origin?.name ?? values.origin_iso3;
  const currency = origin?.currency ?? "";

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/55 px-4 py-4 backdrop-blur-xl sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <button
          type="button"
          onClick={onOpen}
          className="group flex min-w-0 items-center gap-3 text-left"
          aria-label="Edit reference market and preferences"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition group-hover:border-white/20 group-hover:text-white">
            <Globe2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Reference market</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {referenceName}{currency ? <span className="font-normal text-zinc-400"> · {currency}</span> : null}
            </p>
          </div>
        </button>

        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 xl:max-w-3xl">
          {PREFERENCE_DEFINITIONS.map((preference) => (
            <button
              key={preference.key}
              type="button"
              onClick={onOpen}
              className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-white/10 hover:bg-white/[0.05]"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{preference.shortLabel}</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{preferenceLevel(preference.key, values[preference.key])}</p>
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onOpen}
          className="h-10 shrink-0 gap-2 border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-200 hover:bg-white/[0.07] hover:text-white"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Edit preferences
        </Button>
      </div>
    </section>
  );
}
