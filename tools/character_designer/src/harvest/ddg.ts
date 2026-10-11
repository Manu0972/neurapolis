/**
 * DuckDuckGo image scraper.
 * Zero-dependency: native fetch + regex parsing.
 */
export interface HarvestedImage {
  source: "ddg" | "searxng" | "pinterest";
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export async function ddgImages(query: string, limit = 30): Promise<HarvestedImage[]> {
  const results: HarvestedImage[] = [];
  const seen = new Set<string>();
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);
    const html = await res.text();
    const vqdMatch = html.match(/vqd=['"]?([\d-]+)['"]?/);
    const vqd = vqdMatch ? vqdMatch[1] : null;
    if (!vqd) return results;
    const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://duckduckgo.com/",
        Accept: "application/json",
      },
    });
    if (apiRes.ok) {
      const data = (await apiRes.json()) as { results?: Array<{ image: string; title: string; width: number; height: number }> };
      for (const r of data.results || []) {
        if (results.length >= limit) break;
        if (!seen.has(r.image)) {
          seen.add(r.image);
          results.push({ source: "ddg", url: r.image, alt: r.title, width: r.width, height: r.height });
        }
      }
    }
  } catch (e) {
    console.warn(`[ddg] Failed:`, e instanceof Error ? e.message : e);
  }
  return results;
}
