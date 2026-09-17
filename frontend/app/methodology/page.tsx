import { MethodologyClient } from "@/components/methodology/MethodologyClient";
import { AppShell } from "@/components/shell/AppShell";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function MethodologyRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawSearchParams = await searchParams;
  const query = new URLSearchParams();
  Object.entries(rawSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value != null) query.set(key, value);
  });

  return (
    <AppShell>
      <MethodologyClient queryString={query.toString()} />
    </AppShell>
  );
}
