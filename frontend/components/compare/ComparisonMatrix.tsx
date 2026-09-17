import Link from "next/link";

import { COMPARISON_METRICS } from "@/lib/comparison";
import type { RankingRow } from "@/lib/types";

type ComparisonMatrixProps = {
  countries: RankingRow[];
  queryString: string;
};

export function ComparisonMatrix({ countries, queryString }: ComparisonMatrixProps) {
  if (countries.length < 2) return null;

  return (
    <section aria-labelledby="comparison-matrix-title">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Side-by-side evidence</p>
        <h2 id="comparison-matrix-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">How the destinations differ</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          These are the same production metrics used elsewhere in Travel Value Studio. Higher values are shown without converting them into a separate comparison verdict.
        </p>
        <p className="mt-2 text-xs text-zinc-500 sm:hidden">Swipe horizontally or focus the table region and use horizontal scrolling to view every destination.</p>
      </div>

      <div
        className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
        role="region"
        aria-label="Scrollable destination comparison table"
        tabIndex={0}
      >
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">Side-by-side destination comparison using the current reference market and preferences.</caption>
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className="w-[31%] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Metric</th>
              {countries.map((country) => {
                const code = country.iso3?.toUpperCase() ?? "";
                const href = `/country/${code}${queryString ? `?${queryString}` : ""}`;
                return (
                  <th key={code} scope="col" className="px-5 py-4 align-top">
                    <Link href={href} className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Rank #{country.rank ?? "—"}</p>
                      <p className="mt-1 text-base font-semibold text-white transition group-hover:text-cyan-200">{country.country ?? code}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-500">{code}</p>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_METRICS.map((metric) => (
              <tr key={metric.key} className="border-b border-white/[0.06] last:border-b-0">
                <th scope="row" className="px-5 py-4 align-top font-normal">
                  <p className="text-sm font-medium text-zinc-200">{metric.label}</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">{metric.description}</p>
                </th>
                {countries.map((country) => {
                  const code = country.iso3?.toUpperCase() ?? country.country ?? "unknown";
                  const value = metric.getValue(country);
                  return (
                    <td key={`${metric.key}-${code}`} className="px-5 py-4 align-top">
                      <p className="text-xl font-semibold tabular-nums tracking-tight text-zinc-100">{metric.format(value)}</p>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th scope="row" className="px-5 py-4 align-top font-normal">
                <p className="text-sm font-medium text-zinc-200">Data quality</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">Current backend evidence grade for the country result.</p>
              </th>
              {countries.map((country) => (
                <td key={`quality-${country.iso3 ?? country.country}`} className="px-5 py-4 align-top">
                  <p className="text-xl font-semibold text-zinc-100">{country.data_quality_grade ?? "N/A"}</p>
                  {country.data_quality_score != null ? <p className="mt-1 text-xs tabular-nums text-zinc-500">{Math.round(country.data_quality_score)}/100</p> : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
