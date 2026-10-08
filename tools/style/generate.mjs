#!/usr/bin/env node
/**
 * Génération d'images de concept par catégorie, chacune avec SON verrou de style (art/style-locks/).
 * Une catégorie = un style = un workflow ComfyUI (SDXL) : on ne mélange jamais deux styles.
 *
 *   node tools/style/generate.mjs <personnages|fantomes|decors|interface> "<sujet>" [options]
 *     --age N        âge du personnage (personnages) : moins de 18 ans → règles mineurs appliquées
 *     --seed N       graine (défaut : dérivée du sujet, reproductible)
 *     --n N          nombre d'images (défaut 3)
 *     --server URL   serveur ComfyUI (défaut http://127.0.0.1:8188)
 *     --ckpt NOM     checkpoint SDXL (défaut sd_xl_base_1.0.safetensors ; licence à vérifier pour tout autre)
 *     --turbo        SDXL-Lightning (LoRA 4 pas, ByteDance, OpenRAIL++) : ~7× plus rapide
 *     --tenues       personnages : 5 variantes (matin, travail, jour, soir, nuit), même graine
 *     --dry          n'envoie rien : écrit le workflow dans tools/style/workflows/<catégorie>.json
 *
 * Sorties : art/concepts/<catégorie>/<sujet>-<graine>.png (fantômes : passer ensuite pixelize.py).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CATEGORIES = ['personnages', 'fantomes', 'decors', 'interface'];

function parseArgs(argv) {
  const [categorie, sujet, ...rest] = argv;
  const opts = { n: 3, server: 'http://127.0.0.1:8188', ckpt: 'sd_xl_base_1.0.safetensors', dry: false, turbo: false, tenues: false };
  for (let i = 0; i < rest.length; i++) {
    const k = rest[i];
    if (k === '--dry') opts.dry = true;
    else if (k === '--turbo') opts.turbo = true;
    else if (k === '--tenues') opts.tenues = true;
    else if (k === '--age') opts.age = Number(rest[++i]);
    else if (k === '--seed') opts.seed = Number(rest[++i]);
    else if (k === '--n') opts.n = Number(rest[++i]);
    else if (k === '--server') opts.server = rest[++i];
    else if (k === '--ckpt') opts.ckpt = rest[++i];
    else throw new Error(`option inconnue : ${k}`);
  }
  if (!CATEGORIES.includes(categorie)) throw new Error(`catégorie attendue : ${CATEGORIES.join(', ')}`);
  if (!sujet) throw new Error('sujet manquant (ex. "a tall curvy woman with box braids, ebony skin")');
  return { categorie, sujet, opts };
}

/** FNV-1a 32 bits : graine stable tirée du sujet. */
function hashSeed(text) {
  let h = 0x811c9dc5;
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}

export function buildPrompts(lock, sujet, age) {
  const g = lock.generation;
  let positif = g.positif.replace('{sujet}', sujet);
  if (lock.categorie === 'personnages' && age !== undefined && age <= g.mineurs.age_max) {
    const bas = sujet.toLowerCase();
    const interdit = g.mineurs.mots_interdits.find((m) => bas.includes(m));
    if (interdit) throw new Error(`refusé : « ${interdit} » est interdit pour un personnage de moins de 18 ans`);
    positif += `, ${age} years old, ${g.mineurs.ajout_positif}`;
  }
  return { positif, negatif: g.negatif };
}

/** Tenues selon le moment de la journée (verrou personnages, `tenues_journee`). */
export const TENUES = {
  matin: 'wearing pajamas or a bathrobe, at home in the morning',
  travail: 'wearing an everyday work or school outfit',
  jour: 'wearing a casual everyday streetwear outfit',
  soir: 'wearing comfy loungewear in the evening',
  nuit: 'wearing simple sleepwear',
};

/** SDXL-Lightning : LoRA 4 pas (à placer dans ComfyUI/models/loras). */
export const LIGHTNING = { lora: 'sdxl_lightning_4step_lora.safetensors', steps: 4, cfg: 1.0, sampler: 'euler', scheduler: 'sgm_uniform' };

/** Workflow ComfyUI au format API : SDXL texte → image (option turbo : SDXL-Lightning). */
export function buildWorkflow(lock, prompts, seed, n, ckpt, prefix, turbo = false) {
  const g = lock.generation;
  const model = turbo ? ['8', 0] : ['1', 0];
  const s = turbo ? { steps: LIGHTNING.steps, cfg: LIGHTNING.cfg, sampler_name: LIGHTNING.sampler, scheduler: LIGHTNING.scheduler }
    : { steps: g.pas, cfg: g.cfg, sampler_name: g.sampler, scheduler: g.scheduler };
  const wf = {
    '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: ckpt } },
    '2': { class_type: 'CLIPTextEncode', inputs: { text: prompts.positif, clip: ['1', 1] } },
    '3': { class_type: 'CLIPTextEncode', inputs: { text: prompts.negatif, clip: ['1', 1] } },
    '4': { class_type: 'EmptyLatentImage', inputs: { width: g.largeur, height: g.hauteur, batch_size: n } },
    '5': { class_type: 'KSampler', inputs: { model, positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0], seed, ...s, denoise: 1 } },
    '6': { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] } },
    '7': { class_type: 'SaveImage', inputs: { images: ['6', 0], filename_prefix: prefix } },
  };
  if (turbo) wf['8'] = { class_type: 'LoraLoaderModelOnly', inputs: { model: ['1', 0], lora_name: LIGHTNING.lora, strength_model: 1.0 } };
  return wf;
}

async function generate(opts, wf, categorie) {
  const res = await fetch(`${opts.server}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: wf }) });
  if (!res.ok) throw new Error(`ComfyUI a refusé : ${res.status} ${await res.text()}`);
  const { prompt_id: id } = await res.json();
  const out = join(ROOT, 'art', 'concepts', categorie); mkdirSync(out, { recursive: true });
  for (let t = 0; t < 600; t++) {
    const h = await (await fetch(`${opts.server}/history/${id}`)).json();
    const done = h[id];
    if (done) {
      for (const node of Object.values(done.outputs ?? {})) {
        for (const im of node.images ?? []) {
          const q = new URLSearchParams({ filename: im.filename, subfolder: im.subfolder, type: im.type });
          const buf = Buffer.from(await (await fetch(`${opts.server}/view?${q}`)).arrayBuffer());
          const file = join(out, im.filename.split('/').pop());
          writeFileSync(file, buf); console.log(`image : ${file}`);
        }
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('délai dépassé (10 min)');
}

async function run() {
  const { categorie, sujet, opts } = parseArgs(process.argv.slice(2));
  const lock = JSON.parse(readFileSync(join(ROOT, 'art', 'style-locks', `${categorie}.json`), 'utf8'));
  const seed = Number.isFinite(opts.seed) ? opts.seed : hashSeed(sujet);
  const slug = sujet.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  if (opts.tenues && categorie !== 'personnages') throw new Error('--tenues ne concerne que les personnages');
  // Même graine pour toutes les tenues : le même personnage change seulement de vêtements.
  const jobs = opts.tenues ? Object.entries(TENUES).map(([m, t]) => [m, `${sujet}, ${t}`]) : [['', sujet]];
  for (const [moment, s] of jobs) {
    const prompts = buildPrompts(lock, s, opts.age);
    const prefix = `neurapolis/${categorie}/${slug}${moment ? '-' + moment : ''}-${seed}`;
    const wf = buildWorkflow(lock, prompts, seed, opts.n, opts.ckpt, prefix, opts.turbo);
    if (opts.dry) {
      const dir = join(ROOT, 'tools', 'style', 'workflows'); mkdirSync(dir, { recursive: true });
      const name = `${categorie}${opts.turbo ? '-turbo' : ''}${moment ? '-' + moment : ''}.json`;
      writeFileSync(join(dir, name), JSON.stringify(wf, null, 2) + '\n');
      console.log(`workflow écrit : tools/style/workflows/${name}`);
    } else {
      await generate(opts, wf, categorie);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((e) => { console.error(e.message); process.exit(1); });
}
