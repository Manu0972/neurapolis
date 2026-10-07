/**
 * NEURAPOLIS — Chargeur d'assets pixel-art (claude-assets-v1).
 * Charge les images PNG en parallèle depuis public/assets/.
 * Expose un objet `AssetKit` utilisable par le renderer une fois prêt.
 */

/** Résultat du chargement complet du kit. */
export interface AssetKit {
  tiles: HTMLImageElement;
  buildings: Record<string, HTMLImageElement>;
  characters: Record<string, HTMLImageElement>;
  props: Record<string, HTMLImageElement>;
  backdrop: Record<string, HTMLImageElement>;
  light: Record<string, HTMLImageElement>;
  ready: true;
}

const BASE = './assets';

function loadImg(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${path}`));
    // Build en un seul fichier : les images sont embarquées (data URI) dans la page.
    const embedded = (globalThis as { __NEURAPOLIS_ASSETS__?: Record<string, string> }).__NEURAPOLIS_ASSETS__;
    img.src = embedded?.[path] ?? `${BASE}/${path}`;
  });
}

async function loadGroup(dir: string, names: string[]): Promise<Record<string, HTMLImageElement>> {
  const entries = await Promise.all(
    names.map(async (n) => {
      const img = await loadImg(`${dir}/${n}.png`);
      return [n, img] as const;
    }),
  );
  return Object.fromEntries(entries);
}

let cached: AssetKit | null = null;
let loading: Promise<AssetKit> | null = null;

/** Charge tout le kit d'assets. Appels multiples renvoient la même promesse. */
export function loadAssetKit(): Promise<AssetKit> {
  if (cached) return Promise.resolve(cached);
  if (loading) return loading;

  loading = (async (): Promise<AssetKit> => {
    const [tiles, buildings, characters, props, backdrop, light] = await Promise.all([
      loadImg('tiles/tiles.png'),
      loadGroup('buildings', [
        'epicerie_jour', 'epicerie_allume',
        'maison_jour', 'maison_allume',
        'immeuble_jour', 'immeuble_allume',
      ]),
      loadGroup('characters', ['joueur', 'camarade', 'adulte']),
      loadGroup('props', [
        'banc', 'lampadaire_off', 'lampadaire_on', 'jardiniere',
        'cageots_fruits', 'poubelle', 'arbre', 'cerisier',
        'buisson_rosiers', 'ardoise_pain', 'cloture',
        'chat_0', 'chat_1', 'fumee_0', 'fumee_1', 'fumee_2',
        'feuille_0', 'feuille_1',
      ]),
      loadGroup('backdrop', [
        'ciel_jour_480x128', 'ciel_soir_480x128',
        'nuages_200x40', 'skyline_cite_480x80',
      ]),
      loadGroup('light', [
        'halo_chaud_96', 'halo_fenetre_64',
        'flaque_sol_128x48', 'vignette_480x270',
      ]),
    ]);

    cached = { tiles, buildings, characters, props, backdrop, light, ready: true };
    return cached;
  })();

  return loading;
}

/** Renvoie le kit déjà chargé ou null si pas encore prêt. */
export function getAssetKit(): AssetKit | null {
  return cached;
}
