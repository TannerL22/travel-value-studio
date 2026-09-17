"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RankingRow } from "@/lib/types";

type CompareSelectorProps = {
  selected: RankingRow[];
  options: RankingRow[];
  onAdd: (iso3: string) => void;
  onRemove: (iso3: string) => void;
};

export function CompareSelector({ selected, options, onAdd, onRemove }: CompareSelectorProps) {
  const selectedCodes = new Set(selected.map((country) => country.iso3?.toUpperCase()).filter(Boolean));
  const available = options.filter((country) => country.iso3 && !selectedCodes.has(country.iso3.toUpperCase()));

  return (
    <section className="border-y border-white/[0.08] py-5 sm:py-6" aria-labelledby="compare-selector-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-300/80">Destinations</p>
          <h2 id="compare-selector-title" className="mt-1.5 text-xl font-semibold tracking-tight text-white">Choose two or three countries</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Every destination uses the same reference market and preferences. Comparison describes trade-offs without creating another score.
          </p>
        </div>

        {selected.length < 3 ? (
          <div className="w-full sm:w-72">
            <Select onValueChange={onAdd} value="">
              <SelectTrigger aria-label="Add destination to comparison" className="min-h-11 border-white/[0.08] bg-transparent text-zinc-200">
                <SelectValue placeholder="Add destination" />
              </SelectTrigger>
              <SelectContent className="max-h-80 border-white/10 bg-zinc-950 text-zinc-100">
                {available.map((country) => (
                  <SelectItem key={country.iso3 ?? country.country} value={country.iso3 ?? ""}>
                    #{country.rank ?? "—"} · {country.country ?? country.iso3}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-live="polite">
        {selected.map((country) => {
          const code = country.iso3?.toUpperCase() ?? "";
          return (
            <div key={code} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/[0.04] py-1 pl-3 pr-1 text-sm text-zinc-200">
              <span className="text-xs tabular-nums text-zinc-500">#{country.rank ?? "—"}</span>
              <span>{country.country ?? code}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(code)}
                className="h-9 w-9 rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                aria-label={`Remove ${country.country ?? code} from comparison`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}

        {Array.from({ length: Math.max(0, 2 - selected.length) }).map((_, index) => (
          <div key={`empty-${index}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-white/10 px-3 py-2 text-sm text-zinc-500" aria-hidden="true">
            <Plus className="h-3.5 w-3.5" /> Add destination
          </div>
        ))}
      </div>
    </section>
  );
}
