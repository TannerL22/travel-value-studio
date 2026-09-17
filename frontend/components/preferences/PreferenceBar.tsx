"use client";

import { Globe2, SlidersHorizontal } from "lucide-react";

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
    <section className="border-y border-white/[0.08] py-4 sm:py-5" aria-label="Reference market and active preferences">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
        <button
          type="button"
          onClick={onOpen}
          className="group flex min-h-11 min-w-0 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          aria-label="Edit reference market and preferences"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 transition-colors group-hover:text-zinc-100">
            <Globe2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">Reference market</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-zinc-100">
              {referenceName}{currency ? <span className="font-normal text-zinc-400"> · {currency}</span> : null}
            </p>
          </div>
        </button>

        <div className="flex flex-1 flex-wrap gap-x-5 gap-y-2 text-sm xl:justify-center" aria-label="Active preference levels">
          {PREFERENCE_DEFINITIONS.map((preference) => (
            <button
              key={preference.key}
              type="button"
              onClick={onOpen}
              className="min-h-11 rounded-md py-2 text-left text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              <span>{preference.shortLabel}</span>
              <span className="ml-1.5 font-medium text-zinc-200">{preferenceLevel(preference.key, values[preference.key])}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg px-1 text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 xl:self-auto"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Edit preferences
        </button>
      </div>
    </section>
  );
}
