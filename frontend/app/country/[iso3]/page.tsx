import { CountryDetailClient } from "@/components/country/CountryDetailClient";
import { AppShell } from "@/components/shell/AppShell";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CountryRoute({
  params,
  searchParams,
}: {
  params: Promise<{ iso3: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ iso3 }, rawSearchParams] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams();
  Object.entries(rawSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value != null) query.set(key, value);
  });

  return (
    <AppShell>
      <CountryDetailClient iso3={iso3.toUpperCase()} queryString={query.toString()} />
    </AppShell>
  );
}
