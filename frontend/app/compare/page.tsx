import { CompareClient } from "@/components/compare/CompareClient";
import { AppShell } from "@/components/shell/AppShell";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CompareRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawSearchParams = await searchParams;
  const query = new URLSearchParams();
  Object.entries(rawSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value != null) query.set(key, value);
  });

  return (
    <AppShell>
      <CompareClient queryString={query.toString()} />
    </AppShell>
  );
}
