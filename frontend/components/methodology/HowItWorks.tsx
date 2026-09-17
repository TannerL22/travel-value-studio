import { Building2, CircleDollarSign, Gauge, MapPinned, Waves } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: CircleDollarSign,
    title: "Start with your money",
    text: "Your reference market sets both the currency used for FX comparison and the purchasing-power benchmark. A GBP holder from the UK is therefore evaluated differently from a USD holder from the US.",
  },
  {
    number: "02",
    icon: Gauge,
    title: "Measure what it buys",
    text: "Private-consumption PPP and current market FX estimate broad destination purchasing power relative to your reference market. Extreme differences are deliberately compressed so cheapness cannot dominate without limit.",
  },
  {
    number: "03",
    icon: Building2,
    title: "Check whether everyday life clears your bar",
    text: "Basic Comfort, Service Depth and Political Stability only reduce a destination when it falls short of the level implied by your preferences. Stronger conditions do not create unlimited bonuses.",
  },
  {
    number: "04",
    icon: Waves,
    title: "Ask whether the currency is unusually favourable now",
    text: "A bounded FX timing layer compares recent bilateral currency conditions across several horizons. It can move the ranking modestly, but it cannot overwhelm structural purchasing power and usability.",
  },
  {
    number: "05",
    icon: MapPinned,
    title: "Then investigate cities",
    text: "Country value comes first. Inside attractive countries, City Usability helps order returned major-city candidates using local amenity depth plus supporting national mobility and digital context. City scores never alter the country ranking.",
  },
] as const;

export function HowItWorks() {
  return (
    <section>
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">How it works</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">From foreign currency to a destination shortlist</h2>
        <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
          Travel Value Studio is not trying to find the cheapest country. It asks where your money buys unusually strong day-to-day living after accounting for minimum living standards, service depth, stability and current currency conditions.
        </p>
      </div>

      <div className="mt-8 grid gap-3 lg:grid-cols-5">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <article key={step.number} className="relative rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold tracking-[0.16em] text-zinc-600">{step.number}</span>
                <Icon className="h-4 w-4 text-cyan-300/80" />
              </div>
              <h3 className="mt-5 text-base font-semibold leading-6 text-white">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{step.text}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-950/45 p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Country scoring logic</p>
        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-[760px] items-center gap-2 text-sm">
            <FormulaTerm label="Structural value" note="Origin-relative purchasing power" />
            <Operator value="×" />
            <FormulaTerm label="Comfort" note="Shortfall penalty" />
            <Operator value="×" />
            <FormulaTerm label="Services" note="Shortfall penalty" />
            <Operator value="×" />
            <FormulaTerm label="Stability" note="Shortfall penalty" />
            <Operator value="×" />
            <FormulaTerm label="FX timing" note="Bounded overlay" />
            <Operator value="→" />
            <FormulaTerm label="Value score" note="0–100 relative ranking" emphasize />
          </div>
        </div>
        <p className="mt-4 max-w-4xl text-xs leading-5 text-zinc-600">
          A penalty of 1.00 is neutral; values below 1.00 reduce the score. Missing stability evidence is neutral rather than treated as poor performance, and Stability set to Ignore is exactly neutral. The final 0–100 value score is comparative within the current country universe, not an absolute quality-of-life rating.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Principle title="No rich-country bonus" text="Comfort and service layers are designed as floors. Once a destination clears your requirement, additional wealth or infrastructure does not keep compounding the score." />
        <Principle title="Missing is not bad" text="Where practical, missing evidence reduces coverage or leaves an effect neutral instead of silently converting data gaps into poor performance." />
        <Principle title="Country first, city second" text="Country purchasing power is not mixed with city POI evidence. City intelligence is a separate drill-down after the country screen." />
      </div>
    </section>
  );
}

function FormulaTerm({ label, note, emphasize = false }: { label: string; note: string; emphasize?: boolean }) {
  return (
    <div className={`min-w-[118px] rounded-xl border px-3 py-3 ${emphasize ? "border-cyan-300/20 bg-cyan-300/[0.06]" : "border-white/10 bg-white/[0.025]"}`}>
      <p className={`font-medium ${emphasize ? "text-cyan-100" : "text-zinc-200"}`}>{label}</p>
      <p className="mt-1 text-[10px] leading-4 text-zinc-600">{note}</p>
    </div>
  );
}

function Operator({ value }: { value: string }) {
  return <span className="shrink-0 px-1 text-zinc-600">{value}</span>;
}

function Principle({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] px-4 py-4">
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-600">{text}</p>
    </div>
  );
}
