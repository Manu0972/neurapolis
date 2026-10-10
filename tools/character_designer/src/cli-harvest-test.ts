import { harvest } from "./harvest/index.ts";
import { analyzeStyle } from "./analyze/index.ts";

const query = process.argv[2] || "cozy pixel art rpg portrait";
console.log(`\n🎨 Harvesting: "${query}"\n`);

const r = await harvest({ query, limit: 25, sources: ["bing", "wikimedia"] });
console.log(`\n✅ Downloaded: ${r.count} images`);
console.log(`   Répartition: ${JSON.stringify(r.perSource)}`);
console.log(`   Cache: ${r.cacheDir}\n`);

if (r.ok) {
  const dna = await analyzeStyle(r.cacheDir, query);
  console.log("🧬 Style DNA:");
  console.log(JSON.stringify(dna, null, 2));
}
