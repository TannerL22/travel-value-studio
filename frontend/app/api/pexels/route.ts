import { NextResponse } from "next/server";

type PexelsPhoto = {
  src?: {
    large2x?: string;
    large?: string;
    original?: string;
  };
  photographer?: string;
  photographer_url?: string;
};

type PexelsSearchResponse = {
  photos?: PexelsPhoto[];
};

type CountryImage = {
  url: string;
  photographer?: string;
  photographer_url?: string;
};

const cache = new Map<string, CountryImage>();
const responseHeaders = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const cached = cache.get(query);
  if (cached) {
    return NextResponse.json(cached, { headers: responseHeaders });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  const url =
    "https://api.pexels.com/v1/search?orientation=landscape&size=large&per_page=1&query=" +
    encodeURIComponent(query);

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Pexels request failed" }, { status: 502 });
  }

  const data = (await response.json()) as PexelsSearchResponse;
  const photo = data.photos?.[0];
  if (!photo) {
    return NextResponse.json({ error: "No results" }, { status: 404 });
  }

  const resolved: CountryImage = {
    // `large` is ample for the restrained country-detail panel and avoids paying
    // for a 2x asset by default. Fall back only when the preferred size is absent.
    url: photo.src?.large || photo.src?.large2x || photo.src?.original || "",
    photographer: photo.photographer,
    photographer_url: photo.photographer_url,
  };

  if (!resolved.url) {
    return NextResponse.json({ error: "No usable image" }, { status: 404 });
  }

  cache.set(query, resolved);
  return NextResponse.json(resolved, { headers: responseHeaders });
}
