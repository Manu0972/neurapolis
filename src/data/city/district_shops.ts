/**
 * Commerçants des nouveaux quartiers (grande carte, 2026-10-07) : ils tiennent boutique dès le
 * début de la partie, dans les locaux les plus passants de leur quartier ; ce sont tes futurs
 * concurrents quand le quartier s'ouvrira. Personnages inventés pour Val-Ferrand.
 */
import type { ProductCategory } from '../../core/economy_types';

export interface DistrictShopDef {
  id: string;
  /** Préfixe des locaux du quartier (layout.ts). */
  district: 'gare_est' | 'berges' | 'faubourg' | 'bellevue';
  shopName: string;
  owner: string;
  greeting: string;
  categories: readonly ProductCategory[];
  strength: number;
}

export const DISTRICT_SHOPS: readonly DistrictShopDef[] = [
  // Gare Est : les voyageurs pressés, les cheminots, les premiers trains.
  { id: 'gare_est_relais', district: 'gare_est', shopName: 'Le Relais des Quais', owner: 'Mireille Castan', greeting: 'Un café avant le 6 h 12 ? Je l’ai déjà mis en route.', categories: ['cafe', 'boisson', 'snack'], strength: 1.05 },
  { id: 'gare_est_presse', district: 'gare_est', shopName: 'Presse & Billets', owner: 'Hamid Rezki', greeting: 'Le journal, un ticket, une info sur la grève de demain : tout est ici.', categories: ['papeterie', 'livre', 'snack'], strength: 0.95 },
  { id: 'gare_est_cordonnier', district: 'gare_est', shopName: 'Cordonnerie de la Gare', owner: 'Ange Peretti', greeting: 'Une semelle, une clé, une fermeture : je répare tout ce qui marche.', categories: ['service'], strength: 0.85 },
  { id: 'gare_est_fournil', district: 'gare_est', shopName: 'Fournil du Cheminot', owner: 'Odette Lambrecht', greeting: 'Le pain des cheminots sort à 4 h. Les touristes, eux, arrivent à 9 h et il n’y en a plus.', categories: ['boulangerie', 'snack'], strength: 1.1 },
  // Berges de la Malterie : le canal, les péniches, les familles du dimanche.
  { id: 'berges_guinguette', district: 'berges', shopName: 'La Guinguette de l’Écluse', owner: 'Paulo Ferreira', greeting: 'Ici, on danse le dimanche depuis 1952. Les autres jours, on vend des glaces.', categories: ['boisson', 'snack', 'cafe'], strength: 1.0 },
  { id: 'berges_peche', district: 'berges', shopName: 'Pêche & Canal', owner: 'Gérard Lefebvre', greeting: 'Les sandres sont revenus depuis que la brasserie filtre ses eaux. Ça, c’est une victoire.', categories: ['service', 'velo'], strength: 0.8 },
  { id: 'berges_primeur', district: 'berges', shopName: 'Les Jardins de la Malterie', owner: 'Aïcha Bouzid', greeting: 'Tout vient des jardins ouvriers de la rive sud. Le reste, je ne le vends pas.', categories: ['frais', 'epicerie'], strength: 1.05 },
  { id: 'berges_cycles', district: 'berges', shopName: 'Cycles du Halage', owner: 'Yann Le Goff', greeting: 'Le chemin de halage, c’est quarante kilomètres sans voiture. Il te faut un vélo qui tienne.', categories: ['velo', 'service'], strength: 0.95 },
  { id: 'berges_bouquins', district: 'berges', shopName: 'Bouquins au fil de l’eau', owner: 'Rosa Mendès', greeting: 'Un livre lu sur le quai vaut deux livres lus au lit.', categories: ['livre', 'papeterie'], strength: 0.85 },
  // Faubourg Saint-Éloi : le quartier commerçant le plus dense, et le plus disputé.
  { id: 'faubourg_epicerie', district: 'faubourg', shopName: 'Épicerie Saint-Éloi', owner: 'Mehmet Yildiz', greeting: 'Ouvert jusqu’à minuit, sept jours sur sept. La concurrence dort, moi pas.', categories: ['epicerie', 'frais', 'boisson'], strength: 1.15 },
  { id: 'faubourg_patisserie', district: 'faubourg', shopName: 'Pâtisserie Delorme', owner: 'Brigitte Delorme', greeting: 'Trois générations de Delorme, et le même mille-feuille.', categories: ['boulangerie', 'snack'], strength: 1.1 },
  { id: 'faubourg_mode', district: 'faubourg', shopName: 'Atelier Saint-Éloi', owner: 'Nadia Haddad', greeting: 'Je recouds les vestes de Taret-Acier et les revends aux Parisiens. Trois fois le prix.', categories: ['vetement'], strength: 1.0 },
  { id: 'faubourg_cafe', district: 'faubourg', shopName: 'Café des Fondeurs', owner: 'Jo Marchetti', greeting: 'On refait le monde au comptoir depuis la fermeture du haut-fourneau. Il n’est toujours pas refait.', categories: ['cafe', 'boisson'], strength: 1.05 },
  { id: 'faubourg_fleurs', district: 'faubourg', shopName: 'Fleurs de Saint-Éloi', owner: 'Lucie Vannier', greeting: 'Les fleurs, c’est le seul produit qu’on achète pour quelqu’un d’autre.', categories: ['fleur'], strength: 0.9 },
  { id: 'faubourg_reparation', district: 'faubourg', shopName: 'Répar’Tout', owner: 'Kofi Mensah', greeting: 'Téléphone, grille-pain, radio de 1974 : si ça a un circuit, ça se répare.', categories: ['service'], strength: 0.95 },
  { id: 'faubourg_papeterie', district: 'faubourg', shopName: 'Papeterie du Faubourg', owner: 'Denise Arnaud', greeting: 'Les cartables de la rentrée, je les commande en mars. Toi aussi, tu devrais prévoir.', categories: ['papeterie', 'livre'], strength: 0.9 },
  { id: 'faubourg_snack', district: 'faubourg', shopName: 'Snack Saint-Éloi', owner: 'Ryad Benamar', greeting: 'Le kebab du dernier service de l’usine. Les recettes n’ont pas changé, le prix un peu.', categories: ['snack', 'boisson'], strength: 1.05 },
  // Bellevue : le résidentiel calme, qui paie bien et compare tout.
  { id: 'bellevue_epicerie_fine', district: 'bellevue', shopName: 'Maison Vasseur', owner: 'Charles Vasseur', greeting: 'Huile d’olive de Kalamata, café de Huila. Bellevue aime ce qui vient de loin.', categories: ['epicerie', 'boisson'], strength: 1.1 },
  { id: 'bellevue_boulangerie', district: 'bellevue', shopName: 'Le Pain de Bellevue', owner: 'Sophie Garnier', greeting: 'Levain naturel, farine du Plateau Blanc. Oui, c’est plus cher.', categories: ['boulangerie'], strength: 1.05 },
  { id: 'bellevue_concept', district: 'bellevue', shopName: 'Comptoir Bellevue', owner: 'Thomas Leclerc', greeting: 'Un concept-store : café, vêtements et plantes. On vend surtout une ambiance.', categories: ['cafe', 'vetement', 'fleur'], strength: 0.95 },
  { id: 'bellevue_librairie', district: 'bellevue', shopName: 'Librairie des Glycines', owner: 'Anne-Marie Roux', greeting: 'Les gens d’ici lisent beaucoup. Surtout des livres sur comment réussir.', categories: ['livre', 'papeterie'], strength: 1.0 },
  { id: 'bellevue_primeur', district: 'bellevue', shopName: 'Primeur des Hauts', owner: 'Moussa Saidi', greeting: 'Bio, local, de saison : trois mots qui doublent un prix.', categories: ['frais'], strength: 1.0 },
];
