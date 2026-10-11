import fs from "node:fs";
import path from "node:path";
import { ComfyClient } from "./comfy_client.ts";
import { readJsonSafe } from "../util/read_json.ts";

export interface ManifestCharacter {
  id: string;
  seed: number;
  prompt: string;
  age?: number;
  gen?: number;
}

export interface Manifest {
  version: number;
  game: string;
  kind: "npc" | "ghost";
  style_base?: string;
  negative: string;
  characters: ManifestCharacter[];
  generations?: Record<string, { style_base: string; palette_hint: string[] }>;
}

export interface GenerateManifestOptions {
  manifestPath: string;
  workflowPath: string;
  outputDir: string;
  comfyUrl: string;
  styleLock?: string;
  paletteHint?: string[];
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  limit?: number;
  resume?: boolean;
}

export interface GenerateResult {
  ok: boolean;
  generated: number;
  skipped: number;
  failed: number;
  files: string[];
  errors: Array<{ id: string; error: string }>;
}

export async function generateManifest(opts: GenerateManifestOptions): Promise<GenerateResult> {
  const manifest = readJsonSafe<Manifest>(opts.manifestPath);
  const client = new ComfyClient({ endpoint: opts.comfyUrl });

  if (!(await client.isAvailable())) {
    return { ok: false, generated: 0, skipped: 0, failed: 0, files: [], errors: [{ id: "*", error: `ComfyUI unreachable at ${opts.comfyUrl}` }] };
  }

  fs.mkdirSync(opts.outputDir, { recursive: true });

  const result: GenerateResult = { ok: true, generated: 0, skipped: 0, failed: 0, files: [], errors: [] };
  const characters = opts.limit ? manifest.characters.slice(0, opts.limit) : manifest.characters;

  for (let i = 0; i < characters.length; i++) {
    const c = characters[i];
    const dest = path.join(opts.outputDir, `${c.id}.png`);

    if (opts.resume && fs.existsSync(dest)) {
      console.log(`  [${i + 1}/${characters.length}] ${c.id} — skip (exists)`);
      result.skipped++;
      continue;
    }

    const parts: string[] = [];
    if (opts.styleLock) parts.push(opts.styleLock);

    if (manifest.generations && c.gen != null) {
      const genStyle = manifest.generations[`gen${c.gen}`]?.style_base;
      if (genStyle) parts.push(genStyle);
    } else if (manifest.style_base) {
      parts.push(manifest.style_base);
    }

    parts.push(c.prompt);
    if (opts.paletteHint && opts.paletteHint.length > 0) {
      parts.push(`color palette ${opts.paletteHint.join(", ")}`);
    }

    const fullPrompt = parts.filter(Boolean).join(", ");

    console.log(`  [${i + 1}/${characters.length}] ${c.id} — generating...`);

    try {
      const files = await client.generate({
        prompt: fullPrompt,
        negative: manifest.negative,
        seed: c.seed,
        width: opts.width ?? 768,
        height: opts.height ?? 768,
        steps: opts.steps ?? 28,
        cfg: opts.cfg ?? 6.5,
        workflowPath: opts.workflowPath,
        outputDir: opts.outputDir,
      });

      if (files.length > 0) {
        fs.renameSync(files[0], dest);
        result.generated++;
        result.files.push(dest);
        console.log(`       ✓ saved: ${path.basename(dest)}`);
      } else {
        result.failed++;
        result.errors.push({ id: c.id, error: "no image returned" });
      }
    } catch (e) {
      result.failed++;
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push({ id: c.id, error: msg });
      console.log(`       ✗ failed: ${msg.slice(0, 120)}`);
    }
  }

  return result;
}
