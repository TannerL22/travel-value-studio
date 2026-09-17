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
    <section>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Side-by-side evidence</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">How the destinations differ</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
          These are the same production metrics used elsewhere in Travel Value Studio. Higher values are shown without converting them into a separate comparison verdict.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="w-[31%] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Metric</th>
              {countries.map((country) => {
                const code = country.iso3?.toUpperCase() ?? "";
                const href = `/country/${code}${queryString ? `?${queryString}` : ""}`;
                return (
                  <th key={code} className="px-5 py-4 align-top">
                    <Link href={href} className="group block">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Rank #{country.rank ?? "—"}</p>
                      <p className="mt-1 text-base font-semibold text-white transition group-hover:text-cyan-200">{country.country ?? code}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-600">{code}</p>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_METRICS.map((metric) => (
              <tr key={metric.key} className="border-b border-white/[0.06] last:border-b-0">
                <th className="px-5 py-4 align-top font-normal">
                  <p className="text-sm font-medium text-zinc-300">{metric.label}</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-600">{metric.description}</p>
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
              <th className="px-5 py-4 align-top font-normal">
                <p className="text-sm font-medium text-zinc-300">Data quality</p>
                <p className="mt-1 text-xs leading-5 text-zinc-600">Current backend evidence grade for the country result.</p>
              </th>
              {countries.map((country) => (
                <td key={`quality-${country.iso3 ?? country.country}`} className="px-5 py-4 align-top">
                  <p className="text-xl font-semibold text-zinc-100">{country.data_quality_grade ?? "N/A"}</p>
                  {country.data_quality_score != null ? <p className="mt-1 text-xs tabular-nums text-zinc-600">{Math.round(country.data_quality_score)}/100</p> : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
