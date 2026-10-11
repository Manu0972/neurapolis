import fs from "node:fs";

/**
 * Reads a JSON file, stripping the UTF-8 BOM if present.
 * PowerShell's Set-Content -Encoding UTF8 writes a BOM on Windows PS 5.1,
 * which breaks JSON.parse. This handles it transparently.
 */
export function readJsonSafe<T = unknown>(filePath: string): T {
  let raw = fs.readFileSync(filePath, "utf-8");
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw) as T;
}
