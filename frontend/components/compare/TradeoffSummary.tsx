import { ArrowRightLeft } from "lucide-react";

import { comparisonInsights } from "@/lib/comparison";
import type { RankingRow } from "@/lib/types";

export function TradeoffSummary({ countries }: { countries: RankingRow[] }) {
  const insights = comparisonInsights(countries);
  if (countries.length < 2 || insights.length === 0) return null;

  return (
    <section className="border-y border-white/[0.08] py-6">
      <div className="flex items-start gap-3">
        <ArrowRightLeft className="mt-1 h-4 w-4 shrink-0 text-cyan-300/75" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-cyan-300/80">Trade-offs</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white">Where the differences actually are</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
            Observed metric differences only—no preferred destination and no separate comparison score.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-x-8 gap-y-4 lg:grid-cols-2">
        {insights.map((insight) => (
          <p key={insight.metricKey} className="border-t border-white/[0.06] pt-4 text-sm leading-6 text-zinc-300">{insight.text}</p>
        ))}
      </div>
    </section>
  );
}
