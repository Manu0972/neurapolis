/**
 * Manifeste des personnages riggés (chaîne du studio : planche → TRELLIS.2 → squelette UAL).
 * Logique pure, sans Three.js ni DOM : lecture tolérante de `public/personnages/index.json`
 * et correspondance « personnage du jeu → modèle ».
 *
 * Le dossier `public/personnages/` n'est PAS suivi par Git (modèles dérivés de LoRA privés) :
 * sans manifeste, tous les personnages restent procéduraux, exactement comme avant.
 *
 * Formats acceptés :
 *  - le tableau écrit par le studio : `[{ "id": "bertin_1", "glb": "...", "hauteur": 1.65 }]` ;
 *  - un objet : `{ "personnages": [...], "attributions": { "noah": "lycéen_3", "karim": null },
 *    "joueur": "camille_2", "repartition": 0.5 }`.
 * Champs facultatifs d'un modèle : `pnj` (ids attitrés), `age` ou `categorie`
 * (`enfant` | `ado` | `jeune` | `adulte` | `aine`), `auto` (participe à la répartition automatique).
 */

export type AgeClass = 'enfant' | 'ado' | 'jeune' | 'adulte' | 'aine';

/** Tranches de repli (dans l'ordre) quand aucun modèle n'existe pour la tranche voulue : jamais un enfant en adulte. */
export const AGE_FALLBACK: Record<AgeClass, readonly AgeClass[]> = {
  enfant: ['enfant'],
  ado: ['ado', 'jeune'],
  jeune: ['jeune', 'adulte', 'ado'],
  adulte: ['adulte', 'jeune', 'aine'],
  aine: ['aine', 'adulte'],
};

export interface RigModelEntry {
  id: string;
  /** Chemin du .glb relatif à la racine du site (ex. `personnages/bertin_1/rig.glb`). */
  url: string;
  /** Hauteur du modèle (m), information du studio. */
  hauteur?: number;
  ageClass: AgeClass;
  /** Personnages attitrés (ids PNJ, `habitant:…`) : ils prennent ce modèle en priorité. */
  pnj: string[];
  /** Participe à la répartition automatique (par défaut : seulement s'il n'a aucun attitré). */
  auto: boolean;
}

export interface RigManifest {
  models: RigModelEntry[];
  /** Attributions explicites : clé → id de modèle, ou `null` pour forcer le personnage procédural. */
  attributions: Record<string, string | null>;
  /** Modèle du joueur ; sans lui, le joueur garde l'apparence du créateur de personnage. */
  joueur?: string;
  /** Part (0 à 1) des personnages sans attribution qui reçoivent un modèle de la répartition. */
  repartition: number;
}

/** Ce que le jeu sait du personnage à habiller. */
export interface RigRequest {
  /** Identifiant stable : id du PNJ, `habitant:…`, id d'employé, ou `joueur`. */
  key: string;
  role?: 'pnj' | 'joueur';
  age?: number;
  /** Taille voulue (m) : sert à deviner la tranche d'âge quand l'âge est inconnu. */
  heightM?: number;
  /** Modèle imposé (choix du joueur dans le créateur) ; ignoré s'il n'existe pas. */
  model?: string;
}

export const MANIFEST_URL = 'personnages/index.json';
const MODELS_DIR = 'personnages/';

const SAFE_ID = /^[\p{L}\p{N}_.-]{1,64}$/u;

/** Hachage FNV-1a 32 bits (même famille que celui du rendu de la ville). */
export function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Id de PNJ visé par un id de modèle : `bertin_1` → `bertin`, `monique2` → `monique`. */
export function baseIdOf(modelId: string): string {
  return modelId.replace(/[_-]?\d+$/, '') || modelId;
}

export function ageClassOf(age?: number, heightM?: number): AgeClass {
  if (typeof age === 'number' && Number.isFinite(age)) return age < 11 ? 'enfant' : age < 18 ? 'ado' : age < 30 ? 'jeune' : age < 65 ? 'adulte' : 'aine';
  // Tailles du jeu : ~1,52 m à 12 ans, ~1,70 m à 17 ans, 1,72 m adulte (heightForAge).
  if (typeof heightM === 'number' && Number.isFinite(heightM)) return heightM < 1.45 ? 'enfant' : heightM < 1.715 ? 'ado' : 'adulte';
  return 'adulte';
}

function inferAgeClass(raw: Record<string, unknown>, id: string): AgeClass {
  const cat = raw['categorie'];
  if (cat === 'enfant' || cat === 'ado' || cat === 'jeune' || cat === 'adulte' || cat === 'aine') return cat;
  if (typeof raw['age'] === 'number') return ageClassOf(raw['age']);
  const s = id.toLowerCase();
  if (/enfant/.test(s)) return 'enfant';
  if (/a[iî]n[eé]/.test(s)) return 'aine';
  if (/jeune/.test(s)) return 'jeune';
  if (/ado|eleve|élève|college|collège|lyceen|lycéen/.test(s)) return 'ado';
  return 'adulte';
}

/** Chemin de .glb sûr : relatif, sans remontée ; sinon l'emplacement standard `<id>/rig.glb`. */
function modelUrl(id: string, glb: unknown): string {
  if (typeof glb === 'string' && glb.length > 0 && !glb.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(glb) && !glb.split(/[\\/]/).includes('..')) {
    return MODELS_DIR + glb.replace(/\\/g, '/');
  }
  return `${MODELS_DIR}${id}/rig.glb`;
}

/**
 * Lit un manifeste brut (JSON déjà analysé). Renvoie `null` si le contenu n'est pas un manifeste ;
 * les entrées invalides sont ignorées une à une. `knownIds` : ids des PNJ du jeu (pour la
 * convention `bertin_1` → `bertin`).
 */
export function parseManifest(raw: unknown, knownIds: readonly string[] = []): RigManifest | null {
  let list: unknown;
  let opts: Record<string, unknown> = {};
  if (Array.isArray(raw)) list = raw;
  else if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>)['personnages'])) {
    opts = raw as Record<string, unknown>;
    list = opts['personnages'];
  } else return null;
  const known = new Set(knownIds);
  const models: RigModelEntry[] = [];
  const seen = new Set<string>();
  for (const item of list as unknown[]) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const id = r['id'];
    if (typeof id !== 'string' || !SAFE_ID.test(id) || id.startsWith('.') || seen.has(id)) continue;
    // Le studio marque l'état de chaque personnage : on n'embarque que les prêts.
    if (typeof r['etat'] === 'string' && r['etat'] !== 'PRÊT' && r['etat'] !== 'PRET') continue;
    seen.add(id);
    const pnj = Array.isArray(r['pnj']) ? (r['pnj'] as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    for (const cand of [id, baseIdOf(id)]) if (known.has(cand) && !pnj.includes(cand)) pnj.push(cand);
    const hauteur = typeof r['hauteur'] === 'number' && r['hauteur'] > 0.3 && r['hauteur'] < 3 ? r['hauteur'] : undefined;
    models.push({
      id,
      url: modelUrl(id, r['glb']),
      hauteur,
      ageClass: inferAgeClass(r, id),
      pnj,
      auto: typeof r['auto'] === 'boolean' ? r['auto'] : pnj.length === 0,
    });
  }
  const ids = new Set(models.map((m) => m.id));
  const attributions: Record<string, string | null> = {};
  const rawAttr = opts['attributions'];
  if (rawAttr && typeof rawAttr === 'object' && !Array.isArray(rawAttr)) {
    for (const [k, v] of Object.entries(rawAttr as Record<string, unknown>)) {
      if (v === null) attributions[k] = null;
      else if (typeof v === 'string' && ids.has(v)) attributions[k] = v;
    }
  }
  const joueur = typeof opts['joueur'] === 'string' && ids.has(opts['joueur']) ? opts['joueur'] : undefined;
  const rep = typeof opts['repartition'] === 'number' && Number.isFinite(opts['repartition']) ? Math.max(0, Math.min(1, opts['repartition'])) : 1;
  return { models, attributions, joueur, repartition: rep };
}

/**
 * Modèle d'un personnage, ou `null` pour le personnage procédural. Ordre :
 * 1. attribution explicite (`attributions`), 2. joueur (`joueur` seulement, jamais de tirage),
 * 3. modèle attitré (`pnj`, ou convention d'id), 4. répartition déterministe par graine parmi les
 * modèles `auto` de la même tranche d'âge, dans la proportion `repartition`.
 */
export function modelFor(manifest: RigManifest | null, req: RigRequest): RigModelEntry | null {
  if (!manifest || manifest.models.length === 0) return null;
  if (req.model && manifest.models.some((m) => m.id === req.model)) return manifest.models.find((m) => m.id === req.model)!;
  const byId = (id: string | undefined | null): RigModelEntry | null => (id ? manifest.models.find((m) => m.id === id) ?? null : null);
  if (Object.prototype.hasOwnProperty.call(manifest.attributions, req.key)) return byId(manifest.attributions[req.key]);
  if (req.role === 'joueur' || req.key === 'joueur') return byId(manifest.joueur);
  const own = manifest.models.find((m) => m.pnj.includes(req.key));
  if (own) return own;
  const cls = ageClassOf(req.age, req.heightM);
  let pool: RigModelEntry[] = [];
  for (const c of AGE_FALLBACK[cls]) {
    pool = manifest.models.filter((m) => m.auto && m.ageClass === c);
    if (pool.length > 0) break;
  }
  if (pool.length === 0) return null;
  const h = hash32(`rig:${req.key}`);
  if ((h % 10000) / 10000 >= manifest.repartition) return null;
  return pool[hash32(`modele:${req.key}`) % pool.length] ?? null;
}
