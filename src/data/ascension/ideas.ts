/**
 * Les paliers et les idées de business de l'Ascension (docs/ASCENSION.md §3). Au moins cinq
 * idées par palier, au choix libre ; plusieurs à la fois si le joueur veut.
 * Chiffres : `market` = chiffre d'affaires quotidien atteignable avec tout le marché de l'idée.
 */
import type { TierId } from '../../core/ascension_types';
import type { Sector } from '../../core/happenings_types';
import { EXTRA_IDEAS } from '../ascension_ext/ideas';

export interface TierDef {
  id: TierId;
  name: string;
  scale: string;
  lore: string;
}

export const TIERS: readonly TierDef[] = [
  { id: 1, name: 'La Cour', scale: 'le collège Jean-Moulin', lore: 'Tout commence entre la grille et le préau. Ici, la monnaie, ce sont aussi les services rendus et les cartes échangées.' },
  { id: 2, name: 'Le Quartier', scale: 'les Roses et le Centre', lore: 'Les commerçants te connaissent de vue. Tu passes du « petit qui vend des goûters » à « celui qui a toujours une idée ».' },
  { id: 3, name: 'La Ville', scale: 'Val-Ferrand', lore: 'Ton nom apparaît dans La Gazette des Roses. Les banques te rappellent. Le maire, pas encore.' },
  { id: 4, name: 'La Vallée', scale: 'la Vallée du Taret et Néo-Baie', lore: 'De la Gare au port de Néo-Baie, tes camionnettes roulent. On parle de toi aux comptoirs que tu n’as jamais vus.' },
  { id: 5, name: 'Le Pays', scale: 'le territoire national', lore: 'Ton entreprise a un siège, un conseil d’administration et des ennemis. Les régulateurs lisent tes comptes.' },
  { id: 6, name: 'Le Monde', scale: 'l’international', lore: 'Des conteneurs à ton nom traversent les océans. Les voix dans ta tête n’ont jamais été aussi nombreuses à se disputer.' },
];

export interface IdeaDef {
  id: string;
  tier: TierId;
  /** Secteur touché par le fil d'infos et les surprises. */
  sector: Sector;
  name: string;
  icon: string;
  pitch: string;
  /** Chiffre d'affaires quotidien à part de marché totale (€). */
  market: number;
  /** Marge brute (part du prix qui reste après la marchandise). */
  margin: number;
  /** Coûts fixes quotidiens au niveau 1 (€). */
  fixed: number;
  /** Part de marché visée à qualité moyenne. */
  baseShare: number;
  /** Mise de départ (€). */
  startCost: number;
  /** Double face qui se dispute la décision de lancement. */
  duel: string;
  /** Connexions qui facilitent (−25 % au lancement, +10 % de part visée). */
  eases?: string[];
  /** Connexions indispensables. */
  needs?: string[];
  minAge?: number;
  /** Drapeau du monde requis (ex. choix du laminoir). */
  flag?: { id: string; value: number; text: string };
}

const BASE_IDEAS: readonly IdeaDef[] = [
  // ---------- Palier 1 : la Cour ----------
  { id: 'soutien_scolaire', tier: 1, sector: 'services', name: 'Soutien scolaire entre élèves', icon: '📐', pitch: 'Des sixièmes paient en goûters, puis en euros, pour réussir leurs contrôles de maths. Tes meilleurs élèves deviennent tes « profs ».', market: 30, margin: 0.75, fixed: 6, baseShare: 0.5, startCost: 15, duel: 'taylor_dejours', eases: ['lina'] },
  { id: 'cartes_collection', tier: 1, sector: 'commerce', name: 'Bourse aux cartes à collectionner', icon: '🃏', pitch: 'Les cartes rares de la saison circulent sous les préaux. Toi, tu tiens le cahier des cotes et tu prends une petite commission.', market: 28, margin: 0.4, fixed: 3, baseShare: 0.55, startCost: 20, duel: 'smith_marx', eases: ['noah'] },
  { id: 'gouters_cour', tier: 1, sector: 'alimentation', name: 'Goûters de la cour', icon: '🍪', pitch: 'Le Stand des Roses a ouvert la voie. Maintenant, il faut nourrir tout le collège à la récré de 10 h, avant la cantine.', market: 40, margin: 0.5, fixed: 5, baseShare: 0.45, startCost: 25, duel: 'ford_ohno', eases: ['bertin'] },
  { id: 'reparation_velos_cour', tier: 1, sector: 'services', name: 'Réparation de vélos devant le collège', icon: '🔧', pitch: 'Karim te prête des outils. Chambres à air, freins, chaînes : les vélos du parking attendent un mécano.', market: 26, margin: 0.65, fixed: 5, baseShare: 0.5, startCost: 20, duel: 'schumpeter_ostrom', eases: ['karim'] },
  { id: 'journal_college', tier: 1, sector: 'medias', name: 'Le journal du collège et ses petites annonces', icon: '📰', pitch: 'Quatre pages photocopiées, les ragots du CDI et des petites annonces payantes. Yasmine écrit, tu vends.', market: 22, margin: 0.6, fixed: 4, baseShare: 0.6, startCost: 15, duel: 'keynes_hayek', eases: ['yasmine'] },

  // ---------- Palier 2 : le Quartier ----------
  { id: 'livraison_courses', tier: 2, sector: 'logistique', name: 'Livraison de courses aux anciens', icon: '🛒', pitch: 'Dans les barres des Roses, les ascenseurs tombent en panne et les anciens n’osent plus sortir. Toi, tu montes les sacs.', market: 380, margin: 0.35, fixed: 29, baseShare: 0.4, startCost: 350, duel: 'taylor_dejours', eases: ['noah', 'bertin'] },
  { id: 'friperie_quartier', tier: 2, sector: 'mode', name: 'Friperie et retouches', icon: '👕', pitch: 'Les vêtements des grands frères et des grands-mères, triés, lavés, retouchés : le vintage est à la mode, même à Val-Ferrand.', market: 320, margin: 0.6, fixed: 37, baseShare: 0.35, startCost: 400, duel: 'ricardo_raworth' },
  { id: 'cantine_solidaire', tier: 2, sector: 'alimentation', name: 'Cantine de quartier à prix libre', icon: '🍲', pitch: 'Midi, salle paroissiale prêtée, une soupe et un plat. Ceux qui peuvent paient plus, les autres moins.', market: 420, margin: 0.45, fixed: 42, baseShare: 0.4, startCost: 450, duel: 'smith_marx', eases: ['samir'] },
  { id: 'conciergerie', tier: 2, sector: 'services', name: 'Conciergerie des commerçants', icon: '🗝️', pitch: 'Clés, colis, plantes à arroser, petites réparations : les commerçants du Centre te confient ce qu’ils n’ont pas le temps de faire.', market: 300, margin: 0.7, fixed: 46, baseShare: 0.4, startCost: 300, duel: 'taylor_dejours', eases: ['bertin'] },
  { id: 'agence_fetes', tier: 2, sector: 'culture', name: 'Agence de fêtes et d’anniversaires', icon: '🎉', pitch: 'Ballons, sono, gâteaux, animation : les familles des Roses veulent des fêtes comme à la télé, pour trois fois moins cher.', market: 450, margin: 0.5, fixed: 43, baseShare: 0.35, startCost: 500, duel: 'keynes_hayek' },

  // ---------- Palier 3 : la Ville ----------
  { id: 'chaine_boulangeries', tier: 3, sector: 'alimentation', name: 'Chaîne de boulangeries-snacks', icon: '🥖', pitch: 'Trois fournils, une recette de pain au levain, un snack du midi pour les ouvriers du Centre. Le pari : la même qualité partout.', market: 5200, margin: 0.4, fixed: 340, baseShare: 0.3, startCost: 6000, duel: 'ford_ohno' },
  { id: 'coursiers_ville', tier: 3, sector: 'logistique', name: 'Coursiers à vélo de Val-Ferrand', icon: '🚲', pitch: 'Les commerçants livrent en ville sans camionnette : triporteurs, vélos cargo et une appli maison. Noah connaît chaque raccourci.', market: 4200, margin: 0.45, fixed: 360, baseShare: 0.35, startCost: 5000, duel: 'taylor_dejours', eases: ['noah', 'karim'] },
  { id: 'marque_vetements', tier: 3, sector: 'mode', name: 'Marque de vêtements « Taret »', icon: '🧥', pitch: 'Des vestes de travail recoupées, l’acier en logo : Val-Ferrand devient une marque. Reste à savoir où la vendre.', market: 4800, margin: 0.55, fixed: 410, baseShare: 0.28, startCost: 7000, duel: 'ricardo_raworth', eases: ['yasmine'] },
  { id: 'appli_commercants', tier: 3, sector: 'tech', name: 'Appli des commerçants de la ville', icon: '📱', pitch: 'Carte de fidélité commune, commandes, livraisons : une seule appli pour toutes les boutiques indépendantes contre le Drive HyperVal.', market: 4000, margin: 0.8, fixed: 530, baseShare: 0.3, startCost: 8000, duel: 'schumpeter_ostrom', eases: ['okafor'] },
  { id: 'agence_immobiliere', tier: 3, sector: 'immobilier', name: 'Agence de locaux commerciaux', icon: '🏢', pitch: 'Tu connais chaque vitrine vide de la ville. Tu mets en relation propriétaires et porteurs de projets, et tu prends ta commission.', market: 3600, margin: 0.85, fixed: 500, baseShare: 0.3, startCost: 6000, duel: 'keynes_hayek', minAge: 16 },
  { id: 'salle_halle', tier: 3, sector: 'culture', name: 'Salle de concert de la halle', icon: '🎸', pitch: 'La halle du laminoir devenue tiers-lieu cherche un exploitant pour ses concerts du vendredi.', market: 4400, margin: 0.6, fixed: 510, baseShare: 0.35, startCost: 7000, duel: 'schumpeter_ostrom', flag: { id: 'laminoirChoix', value: 3, text: 'La halle du laminoir doit être devenue un tiers-lieu.' } },

  // ---------- Palier 4 : la Vallée ----------
  { id: 'franchise_gouters', tier: 4, sector: 'alimentation', name: 'Franchise « Goûters des Roses »', icon: '🏪', pitch: 'Ta recette, ton enseigne, ta méthode : d’autres jeunes l’ouvrent dans chaque ville de la vallée et te versent une redevance.', market: 48000, margin: 0.5, fixed: 3300, baseShare: 0.25, startCost: 60000, duel: 'smith_marx', eases: ['lina'] },
  { id: 'centrale_achat', tier: 4, sector: 'commerce', name: 'Centrale d’achat des indépendants', icon: '📦', pitch: 'Le neveu de Mme Bertin a un entrepôt à Néo-Baie. Ensemble, vous achetez pour cent épiceries à la fois, au prix du Drive.', market: 60000, margin: 0.18, fixed: 1500, baseShare: 0.25, startCost: 70000, duel: 'ford_ohno', eases: ['bertin', 'okafor'] },
  { id: 'conserverie_vallee', tier: 4, sector: 'alimentation', name: 'Conserverie de la Vallée', icon: '🥫', pitch: 'Les méthodes d’Île Saphir appliquées aux pommes du Taret et aux tommes du Plateau Blanc : des bocaux qui voyagent.', market: 45000, margin: 0.42, fixed: 2600, baseShare: 0.25, startCost: 65000, duel: 'ford_ohno', eases: ['ingrid', 'odile'] },
  { id: 'transport_vallee', tier: 4, sector: 'logistique', name: 'Transport régional de marchandises', icon: '🚚', pitch: 'Des camionnettes électriques entre la Gare, les hameaux et le port. Les grossistes n’attendront plus le jeudi.', market: 52000, margin: 0.3, fixed: 2100, baseShare: 0.25, startCost: 75000, duel: 'keynes_hayek', eases: ['noah'] },
  { id: 'cooperative_laminoir', tier: 4, sector: 'industrie', name: 'Atelier coopératif du laminoir', icon: '⚙️', pitch: 'Les machines de la halle, les bras de TaretCoop : pièces de vélo, mobilier urbain, réparations industrielles pour toute la vallée.', market: 55000, margin: 0.35, fixed: 3200, baseShare: 0.3, startCost: 60000, duel: 'schumpeter_ostrom', needs: ['taretcoop'], eases: ['karim', 'samir'] },

  // ---------- Palier 5 : le Pays ----------
  { id: 'usine_velos', tier: 5, sector: 'industrie', name: 'Usine de vélos cargo', icon: '🏭', pitch: 'Le vélo cargo de Karim, en série. Le pays entier veut livrer sans camion ; il faut une usine, des fournisseurs, une chaîne.', market: 520000, margin: 0.32, fixed: 18000, baseShare: 0.2, startCost: 650000, duel: 'ford_ohno', eases: ['karim', 'taretcoop'], minAge: 18 },
  { id: 'plateforme_livraison', tier: 5, sector: 'logistique', name: 'Plateforme nationale de livraison', icon: '📲', pitch: 'Un réseau de coursiers dans cinquante villes. Toute la question : salariés ou indépendants payés à la course ?', market: 600000, margin: 0.25, fixed: 15000, baseShare: 0.18, startCost: 700000, duel: 'taylor_dejours', minAge: 18 },
  { id: 'banque_cooperative', tier: 5, sector: 'finance', name: 'Banque des petits commerces', icon: '🏦', pitch: 'Les banques classiques ne prêtent pas aux épiceries. Toi, tu connais leurs comptes mieux qu’elles : tu prêtes, et tu en vis.', market: 480000, margin: 0.55, fixed: 29000, baseShare: 0.2, startCost: 800000, duel: 'keynes_hayek', eases: ['lina'], minAge: 18 },
  { id: 'media_national', tier: 5, sector: 'medias', name: 'Média national indépendant', icon: '📡', pitch: 'De La Gazette des Roses à un média lu dans tout le pays. Yasmine dirige la rédaction ; toi, tu dois le rendre rentable sans le vendre.', market: 420000, margin: 0.5, fixed: 23000, baseShare: 0.2, startCost: 550000, duel: 'smith_marx', needs: ['yasmine'], minAge: 18 },
  { id: 'chaine_magasins', tier: 5, sector: 'commerce', name: 'Chaîne nationale d’épiceries de quartier', icon: '🛍️', pitch: 'Ce que le Drive HyperVal a tué, tu le rouvres : cent épiceries de proximité, une logistique commune, un visage dans chaque rue.', market: 650000, margin: 0.22, fixed: 14000, baseShare: 0.18, startCost: 900000, duel: 'ricardo_raworth', eases: ['bertin', 'okafor'], minAge: 18 },

  // ---------- Palier 6 : le Monde ----------
  { id: 'import_export', tier: 6, sector: 'commerce', name: 'Maison d’import-export du port', icon: '🚢', pitch: 'Leïla t’ouvre les quais de Néo-Baie. Café, cacao, pièces détachées : tu achètes là où c’est produit, tu vends là où c’est rare.', market: 5200000, margin: 0.16, fixed: 69000, baseShare: 0.15, startCost: 6000000, duel: 'ricardo_raworth', eases: ['leila'] },
  { id: 'marque_mondiale', tier: 6, sector: 'mode', name: 'Marque Taret à l’international', icon: '🌍', pitch: 'La veste d’ouvrier de Val-Ferrand vendue à Tokyo et New York. L’authenticité est un produit ; jusqu’où peux-tu la vendre ?', market: 4800000, margin: 0.5, fixed: 180000, baseShare: 0.14, startCost: 7000000, duel: 'ricardo_raworth', eases: ['yasmine'] },
  { id: 'energie_iles', tier: 6, sector: 'energie', name: 'Énergie autonome pour les îles', icon: '🔋', pitch: 'Ce qu’Ingrid a fait pour Île Saphir, d’autres îles le veulent : batteries, éoliennes, câbles. Un marché mondial et fragile.', market: 5600000, margin: 0.3, fixed: 130000, baseShare: 0.14, startCost: 8000000, duel: 'schumpeter_ostrom', needs: ['ingrid'] },
  { id: 'fonds_investissement', tier: 6, sector: 'finance', name: 'Fonds d’investissement des territoires', icon: '💼', pitch: 'Ton argent travaille pour d’autres Val-Ferrand : tu finances les usines fermées qui veulent renaître.', market: 4500000, margin: 0.7, fixed: 260000, baseShare: 0.15, startCost: 9000000, duel: 'keynes_hayek', eases: ['lina'] },
  { id: 'fondation_communs', tier: 6, sector: 'services', name: 'Réseau mondial des communs', icon: '🌳', pitch: 'Coopératives, fablabs, épiceries solidaires : un réseau qui partage outils, méthodes et achats d’un continent à l’autre.', market: 3800000, margin: 0.45, fixed: 170000, baseShare: 0.18, startCost: 5000000, duel: 'schumpeter_ostrom', eases: ['taretcoop', 'odile'] },
];

/**
 * Idées d'Antigravity (workflow AG-2, src/data/ascension_ext/ideas.ts). Sans frais fixes donnés,
 * on applique la règle des idées de base : environ 55 % de la marge brute attendue.
 */
export const IDEAS: readonly IdeaDef[] = [
  ...BASE_IDEAS,
  ...EXTRA_IDEAS.filter((x) => !BASE_IDEAS.some((b) => b.id === x.id)).map((x): IdeaDef => ({
    ...x,
    fixed: x.fixed ?? Math.round((x.market * x.margin * x.baseShare * 0.55) / 100) * 100,
  })),
];

export const IDEA_BY_ID: Readonly<Record<string, IdeaDef>> = Object.fromEntries(IDEAS.map((i) => [i.id, i]));

/** Preuves exigées pour atteindre chaque palier (le palier 1 est ouvert d'emblée). */
export interface TierRequirement {
  profit: number;
  concepts: number;
  contacts: number;
  reputation?: number;
  age?: number;
}

export const TIER_REQUIREMENTS: Readonly<Record<Exclude<TierId, 1>, TierRequirement>> = {
  2: { profit: 150, concepts: 1, contacts: 0, reputation: 40 },
  3: { profit: 3000, concepts: 3, contacts: 2 },
  4: { profit: 40000, concepts: 5, contacts: 4, age: 15 },
  5: { profit: 500000, concepts: 8, contacts: 5, age: 18 },
  6: { profit: 6000000, concepts: 11, contacts: 7 },
};
