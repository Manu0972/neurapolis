import fs from "node:fs";
import { ComfyClient } from "./forge/comfy_client.ts";
import { readJsonSafe } from "./util/read_json.ts";

const COMFY_URL = process.env.COMFY_URL;
if (!COMFY_URL) { console.error("❌ COMFY_URL manquant"); process.exit(1); }

const lock = readJsonSafe<any>("manifests/style_lock_minimal.json");
const manifest = readJsonSafe<any>("manifests/npcs.json");

const limit = parseInt(process.argv[2] || "22", 10);
const resume = process.argv.includes("--resume");

console.log(`\n🎨 PNJ — ${manifest.characters.length} persos, limit ${limit}\n`);

const client = new ComfyClient({ endpoint: COMFY_URL });
if (!(await client.isAvailable())) { console.error("❌ ComfyUI injoignable"); process.exit(1); }

let ok = 0, skip = 0, fail = 0;
const t0 = Date.now();

for (let i = 0; i < Math.min(limit, manifest.characters.length); i++) {
  const c = manifest.characters[i];
  const dest = `output/portraits/${c.id}.png`;

  if (resume && fs.existsSync(dest)) {
    console.log(`  [${i+1}/${limit}] ${c.id} — skip`);
    skip++;
    continue;
  }

  const prompt = `${c.prompt}, ${lock.style.base_prompt}`;
  const negative = `${lock.generation_images.negatif}, ${manifest.negative}`;

  console.log(`\n  [${i+1}/${limit}] ${c.id}`);

  try {
    const files = await client.generate({
      prompt,
      negative,
      seed: c.seed,
      width: 832,
      height: 1216,
      steps: 30,
      cfg: 7.0,
      workflowPath: "src/forge/workflows/portrait_neurapolis.json",
      outputDir: "output/portraits/_tmp",
    });
    if (files.length > 0) {
      fs.mkdirSync("output/portraits", { recursive: true });
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.renameSync(files[0], dest);
      fs.rmSync("output/portraits/_tmp", { recursive: true, force: true });
      console.log(`       ✓ ${dest}`);
      ok++;
    } else { fail++; }
  } catch (e) {
    fail++;
    console.log(`       ✗ ${e instanceof Error ? e.message.slice(0, 100) : e}`);
  }
}

const mins = ((Date.now() - t0) / 60000).toFixed(1);
console.log(`\n═══════════════════════════════════════════`);
console.log(`  ✅ ${ok} | ⏭ ${skip} | ❌ ${fail} — ${mins} min`);
console.log(`═══════════════════════════════════════════\n`);