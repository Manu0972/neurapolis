import fs from "node:fs";
import { ComfyClient } from "./forge/comfy_client.ts";
import { readJsonSafe } from "./util/read_json.ts";

const COMFY_URL = process.env.COMFY_URL;
if (!COMFY_URL) { console.error("❌ COMFY_URL manquant"); process.exit(1); }

const manifest = readJsonSafe<any>("manifests/ghosts.json");
const limit = parseInt(process.argv[2] || "8", 10);
const resume = process.argv.includes("--resume");

console.log(`\n👻 FANTÔMES — ${manifest.characters.length} penseurs, limit ${limit}\n`);

const client = new ComfyClient({ endpoint: COMFY_URL });
if (!(await client.isAvailable())) { console.error("❌ ComfyUI injoignable"); process.exit(1); }

let ok = 0, skip = 0, fail = 0;

for (let i = 0; i < Math.min(limit, manifest.characters.length); i++) {
  const c = manifest.characters[i];
  const dest = `output/ghosts/${c.id}.png`;

  if (resume && fs.existsSync(dest)) {
    console.log(`  [${i+1}/${limit}] ${c.id} — skip`);
    skip++;
    continue;
  }

  const prompt = `${manifest.style_base}, ${c.prompt}`;
  console.log(`\n  [${i+1}/${limit}] ${c.id}`);

  try {
    const files = await client.generate({
      prompt,
      negative: manifest.negative,
      seed: c.seed,
      width: 512,
      height: 512,
      steps: 30,
      cfg: 7.5,
      workflowPath: "src/forge/workflows/portrait_neurapolis.json",
      outputDir: "output/ghosts/_tmp",
    });
    if (files.length > 0) {
      fs.mkdirSync("output/ghosts", { recursive: true });
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.renameSync(files[0], dest);
      fs.rmSync("output/ghosts/_tmp", { recursive: true, force: true });
      console.log(`       ✓ ${dest}`);
      ok++;
    } else { fail++; }
  } catch (e) {
    fail++;
    console.log(`       ✗ ${e instanceof Error ? e.message.slice(0, 100) : e}`);
  }
}

console.log(`\n═══════════════════════════════════════════`);
console.log(`  ✅ ${ok} | ⏭ ${skip} | ❌ ${fail}`);
console.log(`═══════════════════════════════════════════\n`);