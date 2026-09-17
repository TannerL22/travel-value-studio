import { CountryDetailClient } from "@/components/country/CountryDetailClient";
import { AppShell } from "@/components/shell/AppShell";

export default async function CountryRoute({ params }: { params: Promise<{ iso3: string }> }) {
  const { iso3 } = await params;
  return (
    <AppShell>
      <CountryDetailClient iso3={iso3.toUpperCase()} />
    </AppShell>
  );
}
