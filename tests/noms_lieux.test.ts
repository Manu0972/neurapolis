/**
 * Garde-fou « noms de lieux » (sprint V1, vague 10) : les noms affichés au joueur (lieux, intérieurs,
 * pièces, mobilier, rues, quartiers, enseignes, arrêts, commerces) suivent la typographie française,
 * n'exposent aucun identifiant technique et désignent chaque lieu par un seul nom canonique.
 */
import { describe, expect, it } from 'vitest';
import { PLACES } from '../src/data/places';
import { INTERIOR_PLACES } from '../src/data/interiors';
import { CITY, CITY_AREAS } from '../src/data/city/layout';
import { DISTRICTS } from '../src/data/districts';
import { DISTRICT_SHOPS } from '../src/data/city/district_shops';
import { LANDMARKS } from '../src/data/city/landmarks';
import { BUS_LINES, BUS_STOPS } from '../src/data/city/transit';
import { COMPETITORS } from '../src/data/city/competitors';
import { VENDOR_DEFS } from '../src/data/vendors';

type Cat = 'lieu' | 'interieur' | 'rue' | 'enseigne' | 'quartier' | 'arret' | 'commerce' | 'poi';
interface Nom { cat: Cat; src: string; texte: string }

function collecte(): Nom[] {
  const o: Nom[] = [];
  const add = (cat: Cat, src: string, texte: unknown): void => { if (typeof texte === 'string' && texte) o.push({ cat, src, texte }); };
  for (const p of PLACES) { add('lieu', `place:${p.id}`, p.name); for (const a of p.actions) add('interieur', `place:${p.id}/${a.id}`, a.label); }
  for (const [id, ip] of Object.entries(INTERIOR_PLACES)) {
    add('lieu', `interieur:${id}`, ip.title);
    for (const r of ip.rooms) {
      add('interieur', `salle:${r.id}`, r.name);
      for (const f of r.furniture) { add('interieur', `meuble:${f.id}`, f.name); add('interieur', `action:${f.actionId}`, f.actionLabel); }
      for (const l of r.links ?? []) add('interieur', `lien:${r.id}->${l.to}`, l.label);
    }
  }
  for (const r of CITY.roads) add('rue', `rue:${r.id}`, r.name);
  for (const b of CITY.blocks) add('quartier', `ilot:${b.id}`, b.name);
  for (const b of CITY.buildings) add('enseigne', `batiment:${b.id}`, b.label);
  for (const a of CITY_AREAS) add('quartier', `zone:${a.id}`, a.name);
  for (const d of DISTRICTS) { add('quartier', `quartier:${d.id}`, d.name); for (const p of d.poiDetails ?? []) add('poi', `poi:${p.id}`, p.name); for (const p of d.pois) add('poi', `pois:${d.id}`, p); }
  for (const s of DISTRICT_SHOPS) add('commerce', `commerce:${s.id}`, s.shopName);
  for (const c of COMPETITORS) add('commerce', `concurrent:${c.id}`, c.shopName);
  for (const l of LANDMARKS) add('lieu', `repere:${l.id}`, l.name);
  for (const l of BUS_LINES) add('arret', `ligne:${l.id}`, l.name);
  for (const s of BUS_STOPS) add('arret', `arret:${s.id}`, s.name);
  for (const v of Object.values(VENDOR_DEFS)) add('commerce', `vendeur:${v.id}`, v.name);
  return o;
}

const NOMS = collecte();
/** Les marques de commerces peuvent porter une esperluette (« Presse & Billets »). */
const sansMarques = NOMS.filter((n) => n.cat !== 'commerce');

/** Mots à majuscule admis au milieu d'un nom (noms propres, toponymes, titres officiels). */
const PROPRES = new Set([
  'Val-Ferrand', 'Roses', 'Taret', 'Taret-Acier', 'Malterie', 'Bertin', 'Marché', 'Peuple', 'Canal', 'Bassin', 'Tramway', 'TER',
  'Jean-Moulin', 'Karim', 'Noah', 'Moreau', 'Lucien', 'Mme', 'Nord', 'Sud', 'Est', 'Ouest', 'HyperVal', 'Selecta', 'Saint-Éloi',
  'Louise-Michel', 'Marcel-Cerdan', 'Jean-Jaurès', 'Val-Libre', 'Recup’Métal', 'Égalité', 'Hauts', 'Hangar', 'Friche', 'Cité',
  'Place', 'Parc', 'Quai', 'Rue', 'Avenue', 'Boulevard', 'Allée', 'Chemin', 'Route', 'Pont', 'Gare', 'Halle', 'Hub', 'Écluse', 'Écureuils',
  'Éoliennes', 'Quatre-Vents', 'Alizés', 'Viaduc', 'Puits', 'Terminus', 'Heureux', 'Pêcheurs', 'Ligne', 'Rive', 'Centre', 'Vallée', 'Bellevue',
  'Forge', 'Grand', 'Ensemble', 'Laminoir', 'Tilleuls', 'Jaurès', 'Verriers', 'Collège', 'Hôpital', 'Lycée', 'Stade', 'Cimetière', 'Mairie',
  'Plateau', 'Blanc', 'Néo-Baie', 'Belvédère', 'Glycines', 'Houillères', 'Ambroise-Croizat', 'Ambroise-Paré', 'Henri-Barbusse',
  'Pierre-Mendès-France', 'Salvador-Allende', 'Fondeurs', 'Haut-Fourneau', 'Hauts-Tilleuls', 'Collines', 'Vergers', 'Entrepôts', 'Grossistes',
  'Coulée', 'Brasserie', 'Écluses', 'Forges', 'Verrerie', 'Mine', 'Lycée', 'Parvis', 'Cordonnerie', 'Zone', 'Faubourg', 'Berges', 'Drive',
  'Kiosque', 'Atelier', 'Tour', 'Bâtiment', 'Haut-fourneau', 'Radio', 'Discount', 'L’Égalité', 'Le',
]);

describe('noms de lieux — typographie française', () => {
  it('aucune particule en capitale à l’anglaise (« Place Du Marché », « Salle De Classe »)', () => {
    const PARTICULES = /(?<!«\s)(?<=\S\s)(Du|De|Des|La|Le|Les|Aux|Au|Et|Sur|Sous|Dans|Pour|En|Chez|Un|Une)\s/;
    const fautes = NOMS.filter((n) => PARTICULES.test(n.texte)).map((n) => `${n.src} : ${n.texte}`);
    expect(fautes).toEqual([]);
  });

  it('pas d’esperluette « & » dans les noms de lieux, pièces et mobilier (hors enseignes de commerces)', () => {
    const fautes = sansMarques.filter((n) => n.texte.includes(' & ')).map((n) => `${n.src} : ${n.texte}`);
    expect(fautes).toEqual([]);
  });

  it('pas de Title Case anglais : les mots communs prennent une minuscule', () => {
    const fautes: string[] = [];
    for (const n of sansMarques) {
      if (n.cat === 'rue' || n.cat === 'quartier' || n.cat === 'arret') continue; // toponymes officiels : majuscules de nom propre déjà vérifiées par la liste des rues
      const mots = n.texte.replace(/«|»|\(|\)|—|·|–|[.,:;]/g, ' ').split(/\s+/).filter(Boolean);
      mots.forEach((m, i) => {
        if (i === 0 || !/^[A-ZÉÈÀ]/.test(m) || m.length === 1) return; // lettres de bâtiment (« bâtiment A »)
        if (!PROPRES.has(m)) fautes.push(`${n.src} : « ${m} » dans « ${n.texte} »`);
      });
    }
    expect(fautes).toEqual([]);
  });

  it('les rues, quartiers et arrêts commencent par un générique ou un nom propre et n’ont pas de particule capitalisée', () => {
    for (const n of NOMS.filter((x) => x.cat === 'rue')) expect(n.texte, n.src).toMatch(/^(Rue|Avenue|Boulevard|Allée|Chemin|Route|Quai|Place) /);
  });

  it('les adresses des locaux suivent l’usage (« 12 avenue Jean-Jaurès »)', () => {
    for (const u of CITY.units) {
      if (u.buildingId.startsWith('etal_')) { expect(u.address).toMatch(/^Étal n° \d+, place du Marché$/); continue; }
      expect(u.address, u.id).toMatch(/^\d+ (rue|avenue|boulevard|allée|chemin|route|quai|place|impasse|passage|cours) /);
    }
  });
});

describe('noms de lieux — rien de technique à l’écran', () => {
  it('aucun identifiant (snake_case, camelCase, numéro de série, undefined) dans les noms affichés', () => {
    const TECH = /[a-z]+_[a-z]+|undefined|null|\[object|\bNaN\b|\b[a-z]+[A-Z][a-z]+\b|\b[a-z]{1,3}\d{2,}\b|\b(local|unite|unit|id)[ _-]?\d+/;
    const fautes = NOMS.filter((n) => TECH.test(n.texte)).map((n) => `${n.src} : ${n.texte}`);
    expect(fautes).toEqual([]);
  });

  it('les îlots sont nommés en français (« îlot n° 3 »), jamais par leur identifiant', () => {
    for (const b of CITY.blocks) expect(b.name, b.id).not.toMatch(/\d{3,}/);
  });

  it('chaque lieu jouable a un nom (jamais son identifiant)', () => {
    for (const p of PLACES) { expect(p.name).not.toBe(p.id); expect(p.name.length).toBeGreaterThan(3); }
  });
});

describe('noms de lieux — un seul nom canonique', () => {
  const cle = (s: string): string => s.toLowerCase().replace(/[’']/g, '’');

  it('aucune variante de casse ou d’apostrophe pour un même nom (« Place du marché » / « Place du Marché »)', () => {
    const variantes = new Map<string, Set<string>>();
    for (const n of NOMS) {
      const k = cle(n.texte);
      if (!variantes.has(k)) variantes.set(k, new Set());
      variantes.get(k)!.add(n.texte);
    }
    const fautes = [...variantes.values()].filter((v) => v.size > 1).map((v) => [...v].join(' / '));
    expect(fautes).toEqual([]);
  });

  it('les intérieurs, la fiche du lieu et l’enseigne du bâtiment portent le même nom', () => {
    for (const p of PLACES) {
      if (p.id === 'maison') continue;
      expect(INTERIOR_PLACES[p.id].title, `intérieur ${p.id}`).toBe(p.name);
      const bat = CITY.buildings.find((b) => b.place === p.id && b.label === p.name);
      if (['college', 'epicerie', 'parc'].includes(p.id)) expect(bat, `enseigne ${p.id}`).toBeDefined();
    }
    const maison = CITY.buildings.find((b) => b.place === 'maison')!;
    expect(maison.label).toBe('Chez toi — Cité des Roses, bâtiment A');
    expect(PLACES.find((p) => p.id === 'maison')!.name).toMatch(/^Chez toi — Cité des Roses, /);
  });

  it('la place du Marché porte le même nom partout où elle est nommée (lieu, rue, arrêt, quartier)', () => {
    expect(PLACES.find((p) => p.id === 'place')!.name).toBe('Place du Marché');
    expect(CITY.blocks.some((b) => b.name === 'Place du Marché')).toBe(true);
    expect(BUS_STOPS.some((s) => s.name === 'Place du Marché')).toBe(true);
  });

  it('rues, enseignes de bâtiments et commerces concurrents sont uniques', () => {
    const doublons = (l: string[]): string[] => l.filter((x, i) => l.indexOf(x) !== i);
    // Une rue compte plusieurs tronçons, mais toujours dans le même sens.
    const axes = new Map<string, Set<string>>();
    for (const r of CITY.roads) axes.set(r.name, (axes.get(r.name) ?? new Set()).add(r.axis));
    expect([...axes].filter(([, a]) => a.size > 1).map(([n]) => n)).toEqual([]);
    expect(doublons(CITY.buildings.map((b) => b.label).filter((x): x is string => !!x))).toEqual([]);
    expect(doublons(DISTRICT_SHOPS.map((s) => s.shopName))).toEqual([]);
    expect(doublons(CITY.blocks.map((b) => b.name))).toEqual([]);
  });
});
