/**
 * Commerces concurrents de la ville : des commerçants du lore (src/data/lore/shopkeepers.ts,
 * Antigravity) occupent une partie des locaux dès le début de la partie. Leurs locaux ne sont
 * pas à louer ; ils attirent une partie de la clientèle des commerces voisins du joueur
 * qui vendent les mêmes catégories. Attribution déterministe (aucun hasard du monde).
 */
import type { ProductCategory } from '../../core/economy_types';
import { SHOPKEEPERS } from '../lore/shopkeepers';
import { CITY } from './layout';
import { DISTRICT_SHOPS } from './district_shops';

export interface CompetitorDef {
  id: string;
  unitId: string;
  shopName: string;
  owner: string;
  greeting: string;
  categories: readonly ProductCategory[];
  /** Force commerciale (0,7 à 1,2) : réputation et fidélité de la clientèle. */
  strength: number;
}

const CATEGORIES: Record<string, readonly ProductCategory[]> = {
  boulangerie: ['boulangerie', 'snack'],
  kiosque_presse: ['papeterie', 'livre', 'snack', 'boisson'],
  fleuriste: ['fleur'],
  librairie_papeterie: ['livre', 'papeterie'],
  cafe: ['cafe', 'boisson', 'snack'],
  commerce_traditionnel: ['frais', 'epicerie'],
  friperie: ['vetement'],
  epicerie_fine: ['epicerie', 'frais', 'boisson'],
  pharmacie: ['service'],
  optique: ['service'],
  ressourcerie: ['vetement', 'service'],
  menuiserie: ['service'],
  textile: ['vetement'],
  commerce_specialise: ['service'],
  snack: ['snack', 'boisson', 'boulangerie'],
};

/** Commerçants qui tiennent boutique en ville (les autres ont déjà un lieu propre : épicerie Bertin, Drive, canal, grossistes). */
const IN_TOWN = [
  'jean_boulanger', 'claire_cafe', 'nadir_kiosque', 'antoine_libraire', 'colette_fleuriste', 'samira_snack',
  'marc_boucherie', 'serge_primeur', 'helene_friperie', 'valerie_pharmacie', 'sarah_salon_the', 'gilles_optique',
];

function assign(): CompetitorDef[] {
  // Locaux fermés (hors étals), les plus passants d'abord ; un sur deux reste libre pour le joueur.
  const units = CITY.units
    .filter((u) => u.id.startsWith('local_'))
    .sort((a, b) => b.footTraffic - a.footTraffic || a.id.localeCompare(b.id));
  const out: CompetitorDef[] = [];
  let k = 0;
  units.forEach((u, i) => {
    if (i % 2 === 0 || k >= IN_TOWN.length) return;
    const sk = SHOPKEEPERS.find((s) => s.id === IN_TOWN[k]);
    k += 1;
    if (!sk) return;
    out.push({
      id: `concurrent_${sk.id}`,
      unitId: u.id,
      shopName: sk.shopName,
      owner: sk.name,
      greeting: sk.greetingPhrase,
      categories: CATEGORIES[sk.businessType] ?? ['snack'],
      strength: 0.7 + ((sk.age * 7 + sk.name.length) % 50) / 100,
    });
  });
  return out;
}

/**
 * Grande carte : les commerçants des nouveaux quartiers prennent un local sur trois parmi les
 * plus passants de leur quartier (les autres restent libres pour le joueur).
 */
function assignDistricts(): CompetitorDef[] {
  const out: CompetitorDef[] = [];
  const districts = [...new Set(DISTRICT_SHOPS.map((s) => s.district))];
  for (const d of districts) {
    const units = CITY.units
      .filter((u) => u.id.startsWith(`${d}_`) && !/^gare_est_/.test(u.id) === (d !== 'gare_est'))
      .sort((a, b) => b.footTraffic - a.footTraffic || a.id.localeCompare(b.id));
    const shops = DISTRICT_SHOPS.filter((s) => s.district === d);
    shops.forEach((s, k) => {
      const u = units[k * 3 + 1];
      if (!u) return;
      out.push({ id: `concurrent_${s.id}`, unitId: u.id, shopName: s.shopName, owner: s.owner, greeting: s.greeting, categories: s.categories, strength: s.strength });
    });
  }
  return out;
}

export const COMPETITORS: readonly CompetitorDef[] = [...assign(), ...assignDistricts()];
export const COMPETITOR_BY_UNIT: Readonly<Record<string, CompetitorDef>> = Object.fromEntries(COMPETITORS.map((c) => [c.unitId, c]));
