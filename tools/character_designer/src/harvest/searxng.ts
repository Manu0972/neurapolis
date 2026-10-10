import type { HarvestedImage } from "./ddg.ts";

export async function searxngImages(
  query: string,
  limit = 30,
  instance = process.env.SEARXNG_URL || "http://localhost:8080"
): Promise<HarvestedImage[]> {
  const results: HarvestedImage[] = [];
  const seen = new Set<string>();
  try {
    const url = new URL("/search", instance);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("categories", "images");
    url.searchParams.set("safesearch", "0");
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`SearXNG HTTP ${res.status}`);
    const data = (await res.json()) as { results?: Array<{ img_src: string; title: string; width?: number; height?: number }> };
    for (const r of data.results || []) {
      if (results.length >= limit) break;
      if (r.img_src && !seen.has(r.img_src)) {
        seen.add(r.img_src);
        results.push({ source: "searxng", url: r.img_src, alt: r.title, width: r.width, height: r.height });
      }
    }
  } catch (e) {
    console.warn(`[searxng] Failed:`, e instanceof Error ? e.message : e);
  }
  return results;
}
