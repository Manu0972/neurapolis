import { ComfyClient } from "./forge/comfy_client.ts";
import { readJsonSafe } from "./util/read_json.ts";

const COMFY_URL = process.env.COMFY_URL;
if (!COMFY_URL) {
  console.error("❌ COMFY_URL manquant");
  process.exit(1);
}

const client = new ComfyClient({ endpoint: COMFY_URL });

console.log("\n🔍 Diagnostic ComfyUI\n");
console.log(`   URL: ${COMFY_URL}\n`);

// 1. Vérifier que ComfyUI répond
const alive = await client.isAvailable();
console.log(`   ${alive ? "✅" : "❌"} ComfyUI ${alive ? "ONLINE" : "INJOIGNABLE"}`);
if (!alive) process.exit(1);

// 2. Lister les checkpoints disponibles
const checkpoints = await client.listCheckpoints();
console.log(`   📦 Checkpoints disponibles (${checkpoints.length}):`);
for (const c of checkpoints) console.log(`      - ${c}`);

// 3. Vérifier que le checkpoint attendu existe
const expected = "sdxl_base.safetensors";
const found = checkpoints.includes(expected);
console.log(`\n   ${found ? "✅" : "❌"} Checkpoint attendu "${expected}" ${found ? "TROUVÉ" : "MANQUANT"}`);
if (!found) {
  console.log(`\n   → Le workflow référence "${expected}" mais ce fichier n'est pas dans models/checkpoints/`);
  console.log(`   → Relance la Cellule 1 sur Colab pour le télécharger.`);
  process.exit(1);
}

// 4. Lire le workflow pour vérifier qu'il est valide
const wf = readJsonSafe<Record<string, unknown>>("src/forge/workflows/portrait_sdxl.json");
const nodeIds = Object.keys(wf);
console.log(`\n   📋 Workflow: ${nodeIds.length} nœuds (${nodeIds.join(", ")})`);
console.log(`   ✅ Diagnostic OK — prêt à générer\n`);
