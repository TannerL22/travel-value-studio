"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Database, Search, ShieldCheck } from "lucide-react";

import { METHODOLOGY_COMPONENT_ORDER, SOURCE_PRIORITY_FIELDS } from "@/lib/methodology";
import type { MethodologySummary, SourceField } from "@/lib/methodology";

export function AdvancedMethodology({ methodology, sourceRegistry }: { methodology: MethodologySummary; sourceRegistry: Record<string, SourceField> }) {
  const [query, setQuery] = useState("");
  const [showAllSources, setShowAllSources] = useState(false);

  const components = useMemo(() => {
    const source = methodology.phase_7_components ?? {};
    const ordered = METHODOLOGY_COMPONENT_ORDER.map((key) => [key, source[key]] as const).filter(([, value]) => Boolean(value));
    const orderedKeys = new Set(ordered.map(([key]) => key));
    const remaining = Object.entries(source).filter(([key]) => !orderedKeys.has(key));
    return [...ordered, ...remaining];
  }, [methodology.phase_7_components]);

  const sourceFields = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const fields = Object.values(sourceRegistry);
    const priorityIndex = new Map(SOURCE_PRIORITY_FIELDS.map((field, index) => [field, index]));
    const ordered = [...fields].sort((a, b) => {
      const ai = priorityIndex.get(a.field_name) ?? Number.POSITIVE_INFINITY;
      const bi = priorityIndex.get(b.field_name) ?? Number.POSITIVE_INFINITY;
      if (ai !== bi) return ai - bi;
      return (a.label ?? a.field_name).localeCompare(b.label ?? b.field_name);
    });
    if (!normalized) return ordered;
    return ordered.filter((field) => [field.label, field.field_name, field.source, field.indicator, field.measures, field.caveat]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalized));
  }, [query, sourceRegistry]);

  const visibleSources = showAllSources || query ? sourceFields : sourceFields.slice(0, 12);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 lg:p-8">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-white/10 bg-zinc-950/50 p-2.5 text-zinc-400"><ShieldCheck className="h-4 w-4" /></div>
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Advanced methodology & evidence</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Inspect the model rather than taking it on faith</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            This section exposes the backend model contract, known limitations, missing-data philosophy and source registry. It is deliberately more technical than the product-facing explanation above.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-3 lg:grid-cols-3">
        <InfoBlock label="Product question" text={methodology.product_question ?? "Where does foreign currency buy the most usable quality of day-to-day life?"} />
        <InfoBlock label="Target user" text={methodology.target_user ?? "A globally mobile foreign-currency holder considering a stay of several weeks to several months."} />
        <InfoBlock label="Scope" text={methodology.scope ?? "Country purchasing power and usability with a separate city drill-down."} />
      </div>

      <details className="group mt-6 rounded-2xl border border-white/10 bg-zinc-950/30" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-zinc-200">Component contract</p>
            <p className="mt-1 text-xs text-zinc-600">What each production or diagnostic layer measures—and what it does not.</p>
          </div>
          <ChevronDown className="h-4 w-4 text-zinc-600 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-2">
          {components.map(([key, component]) => (
            <article key={key} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-100">{component?.label ?? key}</h3>
                {component?.status ? <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-zinc-600">{humanizeStatus(component.status)}</span> : null}
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-400">{component?.measures ?? "No measure description available."}</p>
              {component?.caveat ? <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-5 text-zinc-600"><strong className="font-medium text-zinc-500">Caveat:</strong> {component.caveat}</p> : null}
            </article>
          ))}
        </div>
      </details>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-white/10 bg-zinc-950/30 p-5">
          <p className="text-sm font-semibold text-zinc-200">Missing-data rules</p>
          <div className="mt-4 space-y-4">
            <Rule title="Missing is not automatically poor" text="Where the model can remain neutral, absence of evidence does not become a negative score. City and component coverage are tracked separately." />
            <Rule title="Fallbacks carry weaker confidence" text="Fallback sources are used selectively rather than blended as though they were equivalent to the preferred source." />
            <Rule title="City evidence cannot rescue country evidence" text="City Usability remains a diagnostic drill-down. It never changes the country Quality-Adjusted Value ranking." />
            <Rule title="FX is timing evidence, not a forecast" text="Historical bilateral currency moves are bounded and used only as a modest current-opportunity overlay." />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/30 p-5">
          <p className="text-sm font-semibold text-zinc-200">Known limitations</p>
          <div className="mt-4 space-y-2">
            {(methodology.known_limitations ?? []).map((limitation) => (
              <div key={limitation} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-5 text-zinc-500">{limitation}</div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/30 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><Database className="h-4 w-4 text-zinc-500" /><p className="text-sm font-semibold text-zinc-200">Source registry</p></div>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-600">Search the backend registry by field, source, indicator, measure or caveat. Priority production fields appear first.</p>
          </div>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search source registry</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sources" className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/70 pl-9 pr-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-cyan-300/30" />
          </label>
        </div>

        <div className="mt-5 space-y-2">
          {visibleSources.map((field) => <SourceRow key={field.field_name} field={field} />)}
          {visibleSources.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-600">No registry fields match “{query}”.</div> : null}
        </div>

        {!query && sourceFields.length > 12 ? (
          <button type="button" onClick={() => setShowAllSources((value) => !value)} className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-zinc-200">
            {showAllSources ? "Show priority sources" : `Show all ${sourceFields.length} registry fields`}
          </button>
        ) : null}
      </section>
    </section>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return <div className="rounded-xl border border-white/[0.07] bg-zinc-950/30 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">{label}</p><p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p></div>;
}

function Rule({ title, text }: { title: string; text: string }) {
  return <div><p className="text-xs font-medium text-zinc-300">{title}</p><p className="mt-1 text-xs leading-5 text-zinc-600">{text}</p></div>;
}

function SourceRow({ field }: { field: SourceField }) {
  return (
    <details className="group rounded-xl border border-white/[0.06] bg-white/[0.015]">
      <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center">
        <div><p className="text-sm font-medium text-zinc-300">{field.label}</p><p className="mt-1 text-[10px] text-zinc-700">{field.indicator ?? field.field_name}</p></div>
        <p className="text-xs leading-5 text-zinc-500">{field.source}</p>
        <div className="flex items-center gap-2"><span className="rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-zinc-600">{field.recommended_confidence ?? "confidence N/A"}</span><ChevronDown className="h-3.5 w-3.5 text-zinc-700 transition-transform group-open:rotate-180" /></div>
      </summary>
      <div className="grid gap-3 border-t border-white/[0.06] px-4 py-4 text-xs leading-5 text-zinc-600 md:grid-cols-2">
        <div><strong className="font-medium text-zinc-500">Measures:</strong> {field.measures ?? "Not documented."}</div>
        <div><strong className="font-medium text-zinc-500">Caveat:</strong> {field.caveat ?? "No caveat recorded."}</div>
        <div><strong className="font-medium text-zinc-500">Geography:</strong> {field.geographic_level ?? "N/A"}</div>
        <div><strong className="font-medium text-zinc-500">Frequency:</strong> {field.frequency ?? "N/A"} · <strong className="font-medium text-zinc-500">Type:</strong> {field.field_type ?? "N/A"}</div>
      </div>
    </details>
  );
}

function humanizeStatus(status: string) {
  return status.replace(/^production_phase_\d+$/, "production").replace(/^production_phase_\d+_penalty$/, "production penalty").replace(/^city_phase_\d+$/, "city evidence").replace(/^city_context_phase_\d+$/, "country context").replace(/^diagnostic_phase_\d+$/, "diagnostic").replaceAll("_", " ");
}
