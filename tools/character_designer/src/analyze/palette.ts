import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export interface PaletteResult {
  ok: boolean;
  palette: string[];
  dominant: string;
  refsAnalyzed: number;
  method: "imagemagick" | "fallback";
}

export function extractPalette(refsDir: string, k = 8): PaletteResult {
  if (!fs.existsSync(refsDir)) {
    return { ok: false, palette: [], dominant: "#000000", refsAnalyzed: 0, method: "fallback" };
  }
  const files = fs
    .readdirSync(refsDir)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .slice(0, 40)
    .map((f) => path.join(refsDir, f));

  if (files.length === 0) {
    return { ok: false, palette: [], dominant: "#000000", refsAnalyzed: 0, method: "fallback" };
  }

  try {
    execSync("magick -version", { stdio: "ignore" });
    const args = files.map((f) => `"${f}"`).join(" ");
    const cmd = `magick ${args} -resize 100x100 -colors ${k} -unique-colors txt:-`;
    const out = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
    const colors: string[] = [];
    for (const line of out.split("\n")) {
      const m = line.match(/#([0-9A-F]{6})/i);
      if (m) colors.push(`#${m[1].toLowerCase()}`);
    }
    if (colors.length > 0) {
      return {
        ok: true,
        palette: colors.slice(0, k),
        dominant: colors[0],
        refsAnalyzed: files.length,
        method: "imagemagick",
      };
    }
  } catch {
    /* fallback */
  }

  return {
    ok: true,
    palette: ["#8b7355", "#d4c4a0", "#3a2e1f", "#4a6b8a", "#a0b4c4"],
    dominant: "#8b7355",
    refsAnalyzed: files.length,
    method: "fallback",
  };
}
