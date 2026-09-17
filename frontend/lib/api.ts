import type { CityResponse, FilterState, Origin, RankingRow } from "@/lib/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchRankings(filters: FilterState, signal?: AbortSignal): Promise<RankingRow[]> {
  const response = await fetch(apiUrl("/api/rankings"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
    signal,
  });
  return parseJson<RankingRow[]>(response);
}

export async function fetchOrigins(signal?: AbortSignal): Promise<Origin[]> {
  const response = await fetch(apiUrl("/api/origins"), { signal });
  return parseJson<Origin[]>(response);
}

export async function fetchCities(countryIso3: string, signal?: AbortSignal): Promise<CityResponse> {
  const iso3 = countryIso3.toUpperCase().trim();
  const response = await fetch(
    apiUrl(`/api/cities/${encodeURIComponent(iso3)}?limit=6&include_amenities=1&include_usability=1`),
    { signal },
  );
  return parseJson<CityResponse>(response);
}
