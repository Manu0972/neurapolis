/**
 * Bing Images scraper — V2 uses the /images/async endpoint.
 * This endpoint returns a clean HTML fragment with all metadata inline.
 * No auth, no cookies, no CSRF tokens required.
 */

import type { HarvestedImage } from "./ddg.ts";

export async function bingImages(query: string, limit = 30): Promise<HarvestedImage[]> {
  const results: HarvestedImage[] = [];
  const seen = new Set<string>();

  const count = Math.min(35, Math.max(20, limit));
  const url = `https://www.bing.com/images/async?q=${encodeURIComponent(query)}&first=0&count=${count}&mmasync=1&darkschemeovr=1`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.bing.com/images/search",
      },
    });

    if (!res.ok) throw new Error(`Bing HTTP ${res.status}`);
    const html = await res.text();
    console.log(`  [bing] Got ${html.length} bytes`);

    // Match <a class="iusc" m="{...json...}">
    const re = /<a[^>]*class="iusc"[^>]*m="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      if (results.length >= limit) break;
      try {
        const decoded = m[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
        const meta = JSON.parse(decoded) as { murl?: string; t?: string };
        if (meta.murl && !seen.has(meta.murl)) {
          seen.add(meta.murl);
          results.push({
            source: "ddg",
            url: meta.murl,
            alt: meta.t || query,
          });
        }
      } catch { /* skip malformed */ }
    }

    // Fallback: try mediaurl attribute directly
    if (results.length === 0) {
      const re2 = /mediaurl=([^&\s"]+)/g;
      while ((m = re2.exec(html)) !== null) {
        if (results.length >= limit) break;
        const u = decodeURIComponent(m[1]);
        if (!seen.has(u) && /\.(jpe?g|png|webp)/i.test(u)) {
          seen.add(u);
          results.push({ source: "ddg", url: u, alt: query });
        }
      }
    }
  } catch (e) {
    console.warn(`[bing] Failed:`, e instanceof Error ? e.message : e);
  }

  return results;
}
