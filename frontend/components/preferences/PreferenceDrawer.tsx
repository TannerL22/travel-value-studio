"use client";

import { useRef } from "react";
import { Check, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useModalDialog } from "@/hooks/useModalDialog";
import {
  PREFERENCE_DEFINITIONS,
  preferenceLevel,
  resetPreferenceValues,
} from "@/lib/preferences";
import type { FilterState, Origin } from "@/lib/types";

type PreferenceDrawerProps = {
  isOpen: boolean;
  values: FilterState;
  setValues: (values: FilterState) => void;
  origins: Origin[];
  onClose: () => void;
};

export function PreferenceDrawer({ isOpen, values, setValues, origins, onClose }: PreferenceDrawerProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  useModalDialog({ open: isOpen, onClose, containerRef: dialogRef, initialFocusRef: closeButtonRef });

  if (!isOpen) return null;

  const setField = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setValues({ ...values, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preference-drawer-title"
        aria-describedby="preference-drawer-description"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[460px] sm:rounded-none sm:rounded-l-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Your setup</p>
            <h2 id="preference-drawer-title" className="mt-1 text-xl font-semibold text-white">Reference market & preferences</h2>
            <p id="preference-drawer-description" className="mt-2 max-w-sm text-sm leading-5 text-zinc-400">Rankings update as you change these settings. The underlying model values remain continuous even though the summary uses plain-language labels.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            aria-label="Close preferences"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          <section>
            <label htmlFor="reference-market" className="text-xs font-semibold text-zinc-200">Reference market</label>
            <p className="mt-1 text-xs leading-5 text-zinc-400">This sets both the purchasing-power benchmark and the currency used for bilateral FX opportunity.</p>
            <select
              id="reference-market"
              className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
              value={values.origin_iso3}
              onChange={(event) => setField("origin_iso3", event.target.value)}
            >
              {origins.length === 0 ? (
                <option value={values.origin_iso3}>Loading reference markets…</option>
              ) : (
                origins.map((origin) => (
                  <option key={origin.code} value={origin.code}>
                    {origin.name} · {origin.currency}
                  </option>
                ))
              )}
            </select>
          </section>

          <div className="my-6 h-px bg-white/10" />

          <section className="space-y-7" aria-label="Ranking preferences">
            {PREFERENCE_DEFINITIONS.map((preference) => {
              const value = values[preference.key];
              const level = preferenceLevel(preference.key, value);
              return (
                <div key={preference.key}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{preference.label}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">{preference.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-200">{level}</span>
                  </div>

                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={[value]}
                    onValueChange={(nextValue) => setField(preference.key, nextValue[0] ?? 0)}
                    aria-label={preference.label}
                    aria-valuetext={level}
                    className="mt-4 py-2 [&_[data-slot=slider-range]]:bg-cyan-400 [&_[data-slot=slider-thumb]]:h-5 [&_[data-slot=slider-thumb]]:w-5 [&_[data-slot=slider-thumb]]:border-cyan-300 [&_[data-slot=slider-thumb]]:ring-cyan-400/30"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{preference.lowLabel}</span>
                    <span>{preference.highLabel}</span>
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-zinc-950/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setValues(resetPreferenceValues(values))}
            className="min-h-11 gap-2 text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset preferences
          </Button>
          <Button type="button" onClick={onClose} className="min-h-11 gap-2 bg-cyan-300 px-5 text-zinc-950 hover:bg-cyan-200">
            <Check className="h-4 w-4" />
            Done
          </Button>
        </div>
      </section>
    </div>
  );
}
