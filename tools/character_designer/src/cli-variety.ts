/**
 * Mode VARIÃ‰TÃ‰ NEURAPOLIS â€” v2 (fix resume + Lightning 4-step)
 * Force un skin + style unique par perso. Skip si dÃ©jÃ  gÃ©nÃ©rÃ©.
 */

import fs from "node:fs";
import { ComfyClient } from "./forge/comfy_client.ts";
import { readJsonSafe } from "./util/read_json.ts";

const COMFY_URL = process.env.COMFY_URL;
if (!COMFY_URL) { console.error("âŒ COMFY_URL manquant"); process.exit(1); }

interface StyleLock {
  generation_images: { positif: string; negatif: string };
  style: { nom: string; mots_cles: string[] };
  ambiance: { lumiere: string };
  palettes: {
    peaux: Record<string, { lumiere: string; demi_teinte: string; ombre: string }>;
    cheveux: Record<string, { lumiere: string; demi_teinte: string; ombre: string }>;
  };
}

const lock = readJsonSafe<StyleLock>("manifests/style_lock_neurapolis.json");

const STYLE_VARIANTS = [
  { id: "webtoon_action",  lock: "korean webtoon manhwa illustration, sharp cel-shading, vibrant saturated colors, dramatic cyan or orange rim light" },
  { id: "anime_soft",      lock: "soft anime illustration, pastel palette, gentle diffused light, watercolor background, kawaii aesthetic" },
  { id: "seinen_dark",     lock: "detailed seinen manga illustration, fine ink hatching, dramatic chiaroscuro, muted warm palette, melancholic" },
  { id: "semi_realistic",  lock: "semi-realistic digital painting, subtle subsurface scattering, painterly brushstrokes, cinematic lighting" },
  { id: "flat_vector",     lock: "flat vector illustration, geometric shapes, minimal 5-color palette, no gradients, modern editorial" },
  { id: "lowpoly_render",  lock: "low poly 3D render, faceted planes, flat shading, pastel colors, blender cycles aesthetic" },
  { id: "chibi_cute",      lock: "chibi character illustration, oversized head, tiny body, big expressive eyes, kawaii sparkles" },
  { id: "retro_90s",       lock: "90s anime aesthetic, cel-shaded, warm muted palette, film grain, nostalgic atmosphere" },
];

const SKIN_KEYS = Object.keys(lock.palettes.peaux);
const HAIR_KEYS = Object.keys(lock.palettes.cheveux);

const limit = parseInt(process.argv[2] || "8", 10);
const resume = process.argv.includes("--resume");
const forceVariant = (() => {
  const i = process.argv.indexOf("--variant");
  return i > 0 ? process.argv[i + 1] : null;
})();

const manifest = readJsonSafe<{ characters: Array<{ id: string; seed: number; prompt: string; age?: number }> }>("manifests/npcs.json");

console.log(`\nðŸŽ¨ VARIÃ‰TÃ‰ v2 â€” ${STYLE_VARIANTS.length} styles, ${SKIN_KEYS.length} peaux\n`);

const client = new ComfyClient({ endpoint: COMFY_URL });

if (!(await client.isAvailable())) {
  console.error("âŒ ComfyUI injoignable");
  process.exit(1);
}

let generated = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < Math.min(limit, manifest.characters.length); i++) {
  const c = manifest.characters[i];
  const skinKey = SKIN_KEYS[i % SKIN_KEYS.length];
  const hairKey = HAIR_KEYS[(i + 2) % HAIR_KEYS.length];
  const style = forceVariant
    ? STYLE_VARIANTS.find(v => v.id === forceVariant) || STYLE_VARIANTS[0]
    : STYLE_VARIANTS[i % STYLE_VARIANTS.length];

  const dest = `output/portraits/${c.id}_${style.id}.png`;

  // FIX : skip si le fichier final existe
  if (resume && fs.existsSync(dest)) {
    console.log(`  [${i + 1}/${limit}] ${c.id} Ã— ${style.id} â€” skip`);
    skipped++;
    continue;
  }

  const skin = lock.palettes.peaux[skinKey];
  const hair = lock.palettes.cheveux[hairKey];

  const prompt = [
    lock.generation_images.positif,
    style.lock,
    `character with ${skinKey} skin tone (highlight ${skin.lumiere}, mid ${skin.demi_teinte}, shadow ${skin.ombre})`,
    `with ${hairKey} hair (highlight ${hair.lumiere}, mid ${hair.demi_teinte}, shadow ${hair.ombre})`,
    c.prompt,
    "natural body proportions, complete anatomy",
    lock.ambiance.lumiere,
  ].filter(Boolean).join(", ");

  const negative = [
    lock.generation_images.negatif,
    "same face repeated, identical skin tone, boring uniformity",
  ].join(", ");

  console.log(`\n  [${i + 1}/${limit}] ${c.id} Ã— ${style.id}`);
  console.log(`       Peau : ${skinKey} | Cheveux : ${hairKey}`);

  try {
    // âš¡ Workflow Lightning (4 steps, cfg 2)
    const files = await client.generate({
      prompt,
      negative,
      seed: c.seed,
      width: 1024,
      height: 1024,
      steps: 30,
      cfg: 7.0,
      workflowPath: "src/forge/workflows/portrait_neurapolis.json",
      outputDir: "output/portraits/_tmp",
    });

    if (files.length > 0) {
      fs.mkdirSync("output/portraits", { recursive: true });
      fs.renameSync(files[0], dest);
      fs.rmSync("output/portraits/_tmp", { recursive: true, force: true });
      console.log(`       âœ“ ${dest}`);
      generated++;
    } else {
      failed++;
    }
  } catch (e) {
    failed++;
    console.log(`       âœ— ${e instanceof Error ? e.message.slice(0, 120) : e}`);
  }
}

console.log(`\nâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`);
console.log(`  GÃ©nÃ©rÃ©s : ${generated} | SkippÃ©s : ${skipped} | Ã‰checs : ${failed}`);
console.log(`â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n`);