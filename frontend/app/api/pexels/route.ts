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

const cache = new Map<string, PexelsPhoto>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  if (cache.has(query)) {
    return NextResponse.json(cache.get(query));
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

  cache.set(query, photo);

  return NextResponse.json(
    {
      url: photo.src?.large2x || photo.src?.large || photo.src?.original || "",
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
