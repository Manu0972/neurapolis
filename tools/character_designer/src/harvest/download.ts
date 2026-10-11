import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { HarvestedImage } from "./ddg.ts";

const DEFAULT_CACHE = path.join(process.cwd(), ".cache", "references");

export async function downloadImages(
  images: HarvestedImage[],
  cacheDir = DEFAULT_CACHE,
  maxBytes = 8 * 1024 * 1024
): Promise<string[]> {
  fs.mkdirSync(cacheDir, { recursive: true });
  const saved: string[] = [];
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "image/*,*/*;q=0.8",
  };
  const CONCURRENCY = 6;
  for (let i = 0; i < images.length; i += CONCURRENCY) {
    const batch = images.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (img) => {
        try {
          const res = await fetch(img.url, { headers });
          if (!res.ok) return null;
          const ct = res.headers.get("content-type") || "";
          if (!ct.startsWith("image/")) return null;
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > maxBytes || buf.length < 4096) return null;
          const ext = ct.split("/")[1]?.split(";")[0]?.replace("jpeg", "jpg") || "jpg";
          const hash = crypto.createHash("md5").update(img.url).digest("hex").slice(0, 10);
          const filename = `${img.source}_${hash}.${ext}`;
          const filepath = path.join(cacheDir, filename);
          fs.writeFileSync(filepath, buf);
          return filepath;
        } catch {
          return null;
        }
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) saved.push(r.value);
    }
  }
  return saved;
}
