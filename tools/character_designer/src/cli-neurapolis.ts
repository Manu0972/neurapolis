/**
 * Génère les 8 PNJ dans le vrai style NEURAPOLIS (cel-shading anime).
 * Utilise style_lock_neurapolis.json comme source de vérité.
 */

import fs from "node:fs";
import { generateManifest } from "./forge/generate.ts";
import { readJsonSafe } from "./util/read_json.ts";

const COMFY_URL = process.env.COMFY_URL;
if (!COMFY_URL) { console.error("❌ COMFY_URL manquant"); process.exit(1); }

interface StyleLock {
  generation_images: { positif: string; negatif: string };
  style: { nom: string; mots_cles: string[]; harmonie: string[] };
  ambiance: { lumiere: string };
  personnages: { proportions_adulte: string; enfant_12_ans: string };
  palettes: {
    peaux: Record<string, { lumiere: string; demi_teinte: string; ombre: string }>;
    cheveux: Record<string, { lumiere: string; demi_teinte: string; ombre: string }>;
  };
}

const limit = parseInt(process.argv[2] || "8", 10);
const resume = process.argv.includes("--resume");

const lockPath = "manifests/style_lock_neurapolis.json";
if (!fs.existsSync(lockPath)) {
  console.error(`❌ ${lockPath} introuvable.`);
  console.error("   → Récupère-le depuis le git (git show HEAD:art/references/style_lock_neurapolis.json)");
  process.exit(1);
}

const lock = readJsonSafe<StyleLock>(lockPath);

// Construit le prompt style lock : positif + ambiance + harmonie
const styleLockPrompt = [
  lock.generation_images.positif,
  lock.style.mots_cles?.join(", "),
  lock.ambiance.lumiere,
  "cel shading, flat color shadows with crisp edges, warm colored shadows, clean dark brown outline #2a1a14, harmonious proportions, realistic anatomy slightly simplified",
].filter(Boolean).join(", ");

const negative = [
  lock.generation_images.negatif,
  "photorealistic, gray shadows, pure black outline, noisy shading, gradient shading, school uniform, fantasy armor, chibi, 3d uncanny, plastic",
].filter(Boolean).join(", ");

console.log(`\n🎨 NEURAPOLIS style lock: ${lock.style.nom}\n`);
console.log(`   Prompt: ${styleLockPrompt.slice(0, 150)}...\n`);
console.log(`   Negative: ${negative.slice(0, 100)}...\n`);

const r = await generateManifest({
  manifestPath: "manifests/npcs.json",
  workflowPath: "src/forge/workflows/portrait_neurapolis.json",
  outputDir: "output/portraits",
  comfyUrl: COMFY_URL,
  styleLock: styleLockPrompt,
  paletteHint: [],
  width: 1024,
  height: 1024,
  steps: 30,
  cfg: 7.0,
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