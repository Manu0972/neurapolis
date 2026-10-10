/**
 * Openverse API client (WordPress Foundation).
 * Free, public, no auth required, CC-licensed images.
 * Docs: https://api.openverse.org/v1/
 */

import type { HarvestedImage } from "./ddg.ts";

export async function openverseImages(query: string, limit = 30): Promise<HarvestedImage[]> {
  const results: HarvestedImage[] = [];
  const seen = new Set<string>();

  try {
    const url = new URL("https://api.openverse.org/v1/images/");
    url.searchParams.set("q", query);
    url.searchParams.set("page_size", String(Math.min(limit, 50)));
    url.searchParams.set("license_type", "all-cc");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "ChimeraForge/1.0 (character-designer; contact: local)",
        "Accept": "application/json",
      },
    });

    if (!res.ok) throw new Error(`Openverse HTTP ${res.status}`);
    const data = (await res.json()) as {
      results?: Array<{ url: string; title?: string; width?: number; height?: number }>;
    };

    for (const r of data.results || []) {
      if (results.length >= limit) break;
      if (r.url && !seen.has(r.url)) {
        seen.add(r.url);
        results.push({
          source: "ddg",
          url: r.url,
          alt: r.title || query,
          width: r.width,
          height: r.height,
        });
      }
    }
  } catch (e) {
    console.warn(`[openverse] Failed:`, e instanceof Error ? e.message : e);
  }

  return results;
}
