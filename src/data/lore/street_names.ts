/**
 * Noms de voies, places, quais et impasses de Val-Ferrand.
 * Ancrage historique : mémoire ouvrière, métallurgie de la Vallée du Taret,
 * géographie locale du canal et renouveau citoyen.
 * Référence : docs/VISION.md §3 et docs/ANTIGRAVITY-BRIEF-2026-10-07.md (tâche A-3.1).
 */

export interface StreetDef {
  readonly id: string;
  readonly name: string;
  readonly kind: 'rue' | 'avenue' | 'boulevard' | 'place' | 'quai' | 'impasse' | 'passage' | 'allee';
  readonly district: 'cite_des_roses' | 'centre_marche' | 'friche_industrielle' | 'rives_canal' | 'zone_hyperval';
  readonly description: string;
  readonly historicalNote?: string;
}

export const STREET_NAMES: readonly StreetDef[] = [
  // Cité des Roses (Quartier résidentiel historique de 1965)
  {
    id: 'rue_des_rosiers',
    name: 'Rue des Rosiers',
    kind: 'rue',
    district: 'cite_des_roses',
    description: 'Artère centrale pavée reliant les barres HLM à la place du quartier.',
    historicalNote: 'Aménagée en 1966 lors de l’inauguration de la Cité des Roses pour les familles d’ouvriers.',
  },
  {
    id: 'allee_des_aubepines',
    name: 'Allée des Aubépines',
    kind: 'allee',
    district: 'cite_des_roses',
    description: 'Chemin piétonnier bordé d’arbres menant à l’école primaire et au collège.',
  },
  {
    id: 'impasse_du_fournil',
    name: 'Impasse du Fournil',
    kind: 'impasse',
    district: 'cite_des_roses',
    description: 'Ruelle calme derrière l’ancienne boulangerie coopérative.',
  },
  {
    id: 'rue_des_lilas',
    name: 'Rue des Lilas',
    kind: 'rue',
    district: 'cite_des_roses',
    description: 'Bordée de petits jardins partagés entretenus par les résidents.',
  },
  {
    id: 'passage_des_ecoliers',
    name: 'Passage des Écoliers',
    kind: 'passage',
    district: 'cite_des_roses',
    description: 'Raccourci piétonnier très emprunté le matin entre les immeubles et le portail du collège.',
  },
  {
    id: 'square_des_solidaires',
    name: 'Square des Solidaires',
    kind: 'place',
    district: 'cite_des_roses',
    description: 'Espace de jeu et bancs ombragés où les aînés du quartier se retrouvent.',
  },

  // Centre & Place du Marché
  {
    id: 'place_du_marche',
    name: 'Place du Marché',
    kind: 'place',
    district: 'centre_marche',
    description: 'Cœur palpitant de Val-Ferrand avec sa fontaine centrale et ses étals du mardi et samedi.',
    historicalNote: 'Ancienne place d’armes devenue forum civil à la fin du XIXe siècle.',
  },
  {
    id: 'avenue_jean_jaures',
    name: 'Avenue Jean-Jaurès',
    kind: 'avenue',
    district: 'centre_marche',
    description: 'Avenue commerçante principale bordée de vitrines, cafés et enseignes indépendantes.',
  },
  {
    id: 'rue_de_la_republique',
    name: 'Rue de la République',
    kind: 'rue',
    district: 'centre_marche',
    description: 'Axe reliant l’Hôtel de Ville à la gare de Val-Ferrand.',
  },
  {
    id: 'rue_victor_hugo',
    name: 'Rue Victor-Hugo',
    kind: 'rue',
    district: 'centre_marche',
    description: 'Rue étroite où se trouvent librairies, marchands de journaux et papeteries.',
  },
  {
    id: 'passage_du_commerce',
    name: 'Passage du Commerce',
    kind: 'passage',
    district: 'centre_marche',
    description: 'Galerie commerçante couverte sous verrière du début du XXe siècle.',
  },
  {
    id: 'rue_des_artisans',
    name: 'Rue des Artisans',
    kind: 'rue',
    district: 'centre_marche',
    description: 'Rue pavée animée abritant fleuristes, cordonniers et marchands de bouche.',
  },
  {
    id: 'place_de_la_maison_du_peuple',
    name: 'Place de la Maison du Peuple',
    kind: 'place',
    district: 'centre_marche',
    description: 'Esplanade devant la Maison du Peuple, lieu traditionnel des assemblées citoyennes.',
  },
  {
    id: 'rue_gambetta',
    name: 'Rue Gambetta',
    kind: 'rue',
    district: 'centre_marche',
    description: 'Rue passante accueillant banques locales, assurances et cabinets médicaux.',
  },

  // Friche Industrielle & Mémoire Ouvrière
  {
    id: 'boulevard_des_metallos',
    name: 'Boulevard des Métallos',
    kind: 'boulevard',
    district: 'friche_industrielle',
    description: 'Large boulevard industriel longeant l’ancien périmètre de Taret-Acier.',
    historicalNote: 'Témoin des défilés ouvriers des grandes grèves de 1974 et 1995.',
  },
  {
    id: 'rue_des_hauts_fourneaux',
    name: 'Rue des Hauts-Fourneaux',
    kind: 'rue',
    district: 'friche_industrielle',
    description: 'Voie pavée lourde menant à l’accès sud des 38 hectares de la Friche Taret.',
    historicalNote: 'Vestige direct de l’époque de production de fonte brute arrêtée en 2014.',
  },
  {
    id: 'rue_du_laminoir',
    name: 'Rue du Laminoir',
    kind: 'rue',
    district: 'friche_industrielle',
    description: 'Axe menant aux hangars où subsistent encore les activités du laminoir.',
  },
  {
    id: 'impasse_de_la_forge',
    name: 'Impasse de la Forge',
    kind: 'impasse',
    district: 'friche_industrielle',
    description: 'Bordée d’ateliers mécaniques indépendants et du garage solidaire de Karim.',
  },
  {
    id: 'rue_des_gueules_noires',
    name: 'Rue des Gueules-Noires',
    kind: 'rue',
    district: 'friche_industrielle',
    description: 'Voie rendant hommage aux mineurs de charbon de la Vallée du Taret.',
  },
  {
    id: 'allee_de_la_recup',
    name: 'Allée de la Récup’',
    kind: 'allee',
    district: 'friche_industrielle',
    description: 'Chemin tracé récemment reliant les ateliers d’artistes et la ressourcerie citoyenne.',
  },
  {
    id: 'passage_des_syndicats',
    name: 'Passage des Syndicats',
    kind: 'passage',
    district: 'friche_industrielle',
    description: 'Cour intérieure pavée devant l’ancienne bourse du travail locale.',
  },

  // Rives du Canal de la Malterie
  {
    id: 'quai_du_canal',
    name: 'Quai du Canal',
    kind: 'quai',
    district: 'rives_canal',
    description: 'Promenade pavée longeant le canal, très fréquentée les dimanches après-midi.',
  },
  {
    id: 'quai_de_la_malterie',
    name: 'Quai de la Malterie',
    kind: 'quai',
    district: 'rives_canal',
    description: 'Quai de déchargement historique où s’amarre aujourd’hui la péniche-marché solidaire.',
  },
  {
    id: 'rue_de_lecluse',
    name: 'Rue de l’Écluse',
    kind: 'rue',
    district: 'rives_canal',
    description: 'Rue calme surplombant l’écluse numéro 4 du Taret.',
  },
  {
    id: 'quai_des_peniches',
    name: 'Quai des Péniches',
    kind: 'quai',
    district: 'rives_canal',
    description: 'Zone d’amarrage des bateaux de plaisance et des cafés flottants.',
  },
  {
    id: 'passerelle_des_haleurs',
    name: 'Passerelle des Haleurs',
    kind: 'passage',
    district: 'rives_canal',
    description: 'Passerelle métallique piétonne franchissant le canal vers le parc communal.',
  },

  // Zone Commerciale & Périphérie HyperVal
  {
    id: 'avenue_de_l_industrie',
    name: 'Avenue de l’Industrie',
    kind: 'avenue',
    district: 'zone_hyperval',
    description: 'Grande artère à 4 voies desservant les zones d’activité et les entrepôts logistiques.',
  },
  {
    id: 'rue_des_entrepots',
    name: 'Rue des Entrepôts',
    kind: 'rue',
    district: 'zone_hyperval',
    description: 'Voie logistique où circulent camionnettes et semi-remorques de livraison.',
  },
  {
    id: 'rond_point_de_la_rocade',
    name: 'Rond-Point de la Rocade',
    kind: 'place',
    district: 'zone_hyperval',
    description: 'Nœud routier majeur distribuant le trafic vers l’autoroute A41 et le Drive HyperVal.',
  },
  {
    id: 'allee_des_grossistes',
    name: 'Allée des Grossistes',
    kind: 'allee',
    district: 'zone_hyperval',
    description: 'Zone fermée regroupant les dépôts de gros en fruits, boissons et pièces détachées.',
  },
] as const;
