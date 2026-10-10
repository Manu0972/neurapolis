/**
 * Wikimedia Commons image search.
 * 100% free, no auth, no rate-limit issues. API: /w/api.php
 * Less "artistic" than Pinterest but rock-solid.
 */

import type { HarvestedImage } from "./ddg.ts";

export async function wikimediaImages(query: string, limit = 30): Promise<HarvestedImage[]> {
  const results: HarvestedImage[] = [];
  const seen = new Set<string>();

  try {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrnamespace", "6"); // File namespace
    url.searchParams.set("gsrlimit", String(Math.min(limit, 50)));
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|size|mime");
    url.searchParams.set("iiurlwidth", "1024");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "ChimeraForge/1.0 (character-designer; contact: local-user)",
        "Accept": "application/json",
      },
    });

    if (!res.ok) throw new Error(`Wikimedia HTTP ${res.status}`);
    const data = (await res.json()) as {
      query?: {
        pages?: Record<string, {
          title: string;
          imageinfo?: Array<{ url: string; thumburl?: string; width: number; height: number; mime: string }>;
        }>;
      };
    };

    const pages = data.query?.pages || {};
    for (const page of Object.values(pages)) {
      if (results.length >= limit) break;
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const imgUrl = info.thumburl || info.url;
      if (!imgUrl || seen.has(imgUrl)) continue;
      if (!/^image\/(jpeg|png|webp)/.test(info.mime)) continue;
      if (info.width < 400 || info.height < 400) continue;
      seen.add(imgUrl);
      results.push({
        source: "ddg",
        url: imgUrl,
        alt: page.title,
        width: info.width,
        height: info.height,
      });
    }
  } catch (e) {
    console.warn(`[wikimedia] Failed:`, e instanceof Error ? e.message : e);
  }

  return results;
}
