import { ArrowRightLeft } from "lucide-react";

import { comparisonInsights } from "@/lib/comparison";
import type { RankingRow } from "@/lib/types";

export function TradeoffSummary({ countries }: { countries: RankingRow[] }) {
  const insights = comparisonInsights(countries);
  if (countries.length < 2 || insights.length === 0) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.05] p-2 text-cyan-200"><ArrowRightLeft className="h-4 w-4" /></div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Trade-offs</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Where the differences actually are</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
            This section describes observed metric differences only. It does not choose a preferred destination or create another score.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.metricKey} className="rounded-xl border border-white/[0.07] bg-zinc-950/30 p-4">
            <p className="text-sm leading-6 text-zinc-300">{insight.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
