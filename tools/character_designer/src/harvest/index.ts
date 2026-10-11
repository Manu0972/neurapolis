import path from "node:path";
import type { HarvestedImage } from "./ddg.ts";
import { ddgImages } from "./ddg.ts";
import { bingImages } from "./bing.ts";
import { wikimediaImages } from "./wikimedia.ts";
import { searxngImages } from "./searxng.ts";
import { downloadImages } from "./download.ts";

export type { HarvestedImage } from "./ddg.ts";
export { ddgImages } from "./ddg.ts";
export { bingImages } from "./bing.ts";
export { wikimediaImages } from "./wikimedia.ts";
export { searxngImages } from "./searxng.ts";
export { downloadImages } from "./download.ts";

export type HarvestSource = "bing" | "ddg" | "wikimedia" | "searxng";

export interface HarvestOptions {
  query: string;
  limit?: number;
  sources?: HarvestSource[];
  cacheDir?: string;
}

export interface HarvestResult {
  ok: boolean;
  count: number;
  cacheDir: string;
  files: string[];
  sources: string[];
  perSource: Record<string, number>;
}

export async function harvest(opts: HarvestOptions): Promise<HarvestResult> {
  const {
    query,
    limit = 30,
    sources = ["bing", "wikimedia"],
    cacheDir = path.join(process.cwd(), ".cache", "references"),
  } = opts;

  const all: HarvestedImage[] = [];
  const seen = new Set<string>();
  const perSource: Record<string, number> = {};

  const pushAll = (items: HarvestedImage[], name: string): void => {
    let added = 0;
    for (const img of items) {
      if (seen.has(img.url)) continue;
      seen.add(img.url);
      all.push(img);
      added++;
    }
    perSource[name] = added;
  };

  if (sources.includes("bing")) {
    const r = await bingImages(query, limit);
    pushAll(r, "bing");
    console.log(`  [harvest] bing: ${r.length} URLs`);
  }
  if (sources.includes("wikimedia")) {
    const r = await wikimediaImages(query, limit);
    pushAll(r, "wikimedia");
    console.log(`  [harvest] wikimedia: ${r.length} URLs`);
  }
  if (sources.includes("ddg")) {
    const r = await ddgImages(query, limit);
    pushAll(r, "ddg");
    console.log(`  [harvest] ddg: ${r.length} URLs`);
  }
  if (sources.includes("searxng")) {
    const r = await searxngImages(query, limit);
    pushAll(r, "searxng");
    console.log(`  [harvest] searxng: ${r.length} URLs`);
  }

  console.log(`  [harvest] Total: ${all.length} URLs uniques → downloading...`);
  const files = await downloadImages(all.slice(0, limit), cacheDir);

  return {
    ok: files.length > 0,
    count: files.length,
    cacheDir,
    files,
    sources: [...sources],
    perSource,
  };
}
