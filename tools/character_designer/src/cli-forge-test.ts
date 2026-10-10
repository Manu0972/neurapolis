import fs from "node:fs";
import { generateManifest } from "./forge/generate.ts";
import { readJsonSafe } from "./util/read_json.ts";

const COMFY_URL = process.env.COMFY_URL;
if (!COMFY_URL) {
  console.error("❌ COMFY_URL manquant. Crée un fichier .env avec COMFY_URL=https://xxx.trycloudflare.com");
  process.exit(1);
}

const kind = (process.argv[2] as "npc" | "ghost") || "npc";
const limit = parseInt(process.argv[3] || "2", 10);
const resume = process.argv.includes("--resume");

const manifestPath = kind === "npc" ? "manifests/npcs.json" : "manifests/ghosts.json";
const lockKey = kind === "npc" ? "npc_cozy_pixel" : "ghost_gen1_classical";

const locksFile = readJsonSafe<{ locks: Record<string, { style_lock: string; palette_hint: string[]; width: number; height: number; steps: number; cfg: number }> }>("manifests/style_lock.json");
const lock = locksFile.locks[lockKey];

console.log(`\n🎨 Forge: ${kind} (limit=${limit}, resume=${resume})\n`);
console.log(`   Style lock: ${lockKey}`);
console.log(`   Palette   : ${lock.palette_hint.join(" ")}\n`);

const r = await generateManifest({
  manifestPath,
  workflowPath: "src/forge/workflows/portrait_sdxl.json",
  outputDir: "output/portraits",
  comfyUrl: COMFY_URL,
  styleLock: lock.style_lock,
  paletteHint: lock.palette_hint,
  width: lock.width,
  height: lock.height,
  steps: lock.steps,
  cfg: lock.cfg,
  limit,
  resume,
});

console.log(`\n═══════════════════════════════════════════`);
console.log(`  Générés : ${r.generated}`);
console.log(`  Skippés : ${r.skipped}`);
console.log(`  Échecs  : ${r.failed}`);
console.log(`═══════════════════════════════════════════\n`);

if (r.errors.length > 0) {
  console.log("Erreurs:");
  for (const e of r.errors) console.log(`  ${e.id}: ${e.error.slice(0, 150)}`);
}
