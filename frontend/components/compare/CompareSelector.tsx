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
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Destinations</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Choose two or three countries</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Comparison uses the same reference market and preference settings for every destination. It does not calculate a separate comparison score.
          </p>
        </div>

        {selected.length < 3 ? (
          <div className="w-full sm:w-72">
            <Select onValueChange={onAdd} value="">
              <SelectTrigger className="h-11 border-white/10 bg-zinc-950/60 text-zinc-200">
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

      <div className="mt-5 flex flex-wrap gap-2">
        {selected.map((country) => {
          const code = country.iso3?.toUpperCase() ?? "";
          return (
            <div key={code} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/45 py-1.5 pl-3 pr-1.5 text-sm text-zinc-300">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">#{country.rank ?? "—"}</span>
              <span>{country.country ?? code}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(code)}
                className="h-7 w-7 rounded-full text-zinc-500 hover:bg-white/10 hover:text-white"
                aria-label={`Remove ${country.country ?? code}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}

        {Array.from({ length: Math.max(0, 2 - selected.length) }).map((_, index) => (
          <div key={`empty-${index}`} className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/10 px-3 py-2 text-sm text-zinc-600">
            <Plus className="h-3.5 w-3.5" /> Add destination
          </div>
        ))}
      </div>
    </section>
  );
}
