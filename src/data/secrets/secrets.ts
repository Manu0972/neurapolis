/**
 * Secrets explorables de Val-Ferrand (Workflow AG-2 Phase 4).
 * Au moins 16 secrets autonomes ancrés dans l'histoire industrielle, ouvrière
 * et collective de Val-Ferrand, découvrables par le joueur.
 * Conforme à docs/ASCENSION.md, docs/lore/HISTOIRE-ASCENSION.md,
 * ANTIGRAVITY-WORKFLOW-AG2.md §4 et explorer_survey_2/handoff.md §4.3.
 */

import type { PlaceId } from '../../core/types';

export interface SecretDef {
  id: string;
  title: string;
  where: { place?: PlaceId; street?: string; hint: string };
  when?: { hour?: [number, number]; weekday?: number[]; weather?: 'pluie' | 'soleil' | 'nuages' };
  requires?: { tier?: number; concepts?: number; contact?: string; flag?: string };
  clue: string;
  reward: { kind: 'concept' | 'contact' | 'objet' | 'argent' | 'idee'; value: string | number };
  lore: string;
}

export const SECRETS: readonly SecretDef[] = [
  {
    id: 'tombe_lucien',
    title: 'La sépulture de Lucien au cimetière ouvrier',
    where: { street: 'Rue des Houillères', hint: 'contre le muret de schiste du vieux carré des fondeurs' },
    when: { hour: [17, 21], weather: 'soleil' },
    requires: { tier: 2, concepts: 3 },
    clue: 'Dans les vieux papiers de Nora : « Papy Lucien repose là où les terrils projettent leur ombre le soir, rue des Houillères. »',
    reward: { kind: 'concept', value: 'communs' },
    lore: 'Lucien repose sous une sobre stèle de fonte coulée par ses camarades de 1984. Une rose sauvage pousse entre deux dalles. Un mot gravé : « Ce que nous laissons appartient à ceux qui bâtissent ». En observant ce carré ouvrier, tu comprends que la richesse d’un quartier repose sur ce que les générations précédentes ont mis en partage sans chercher à se l’approprier.',
  },
  {
    id: 'salle_muree_peuple',
    title: 'La salle murée de la Maison du Peuple',
    where: { street: 'Avenue Jean-Jaurès', hint: 'derrière la grande boiserie de chêne du foyer civique' },
    when: { hour: [18, 21], weekday: [1, 2, 3, 4, 5] },
    requires: { tier: 3, concepts: 4 },
    clue: 'Une archive syndicale mentionne une pièce aveugle condamnée après la grève générale de 1974, avenue Jean-Jaurès.',
    reward: { kind: 'objet', value: 'room_tampon_encreur_commercial' },
    lore: 'Une petite pièce oubliée où les ouvriers imprimaient leurs tracts à la ronéo dans la clandestinité. Des caisses de papier jauni, l’odeur d’encre grasse et un tampon de cuivre intact portant la devise de l’entraide ouvrière. Cet instrument d’authentification servait à valider les bons de solidarité alimentaire du comité de grève.',
  },
  {
    id: 'fournisseur_clandestin_pont',
    title: 'Le troc nocturne sous le viaduc ferroviaire',
    where: { street: 'Rue du Laminoir', hint: 'sous la troisième travée du pont en fonte de la voie ferrée' },
    when: { hour: [6, 8], weekday: [6] },
    requires: { tier: 2 },
    clue: 'Karim murmure qu’un mécanicien à la retraite échange des roulements d’usine le samedi à l’aube, rue du Laminoir.',
    reward: { kind: 'concept', value: 'asymetrie_information' },
    lore: 'Un coffre de break ouvert dans la brume matinale, des pièces de transmission introuvables sur catalogue officiel. Les prix se négocient d’un hochement de tête entre initiés. L’acheteur ignore la provenance exacte et l’usure réelle des métaux, illustrant parfaitement comment l’asymétrie d’information paralyse la confiance et déforme le marché.',
  },
  {
    id: 'archives_verrerie',
    title: 'Les registres secrets des maîtres-verriers',
    where: { street: 'Rue de la Verrerie', hint: 'dans un regard technique dissimulé sous les pavés de l’ancien atelier' },
    when: { hour: [14, 18] },
    requires: { concepts: 3, contact: 'samir' },
    clue: 'Samir se rappelle que les formules de trempe de 1960 étaient scellées sous le trottoir de la rue de la Verrerie.',
    reward: { kind: 'objet', value: 'room_coffret_echantillons_metaux_rares' },
    lore: 'Une boîte de plomb étanche renfermant les proportions exactes du quartz et du manganèse. Les verriers de Val-Ferrand savaient résister aux chocs thermiques mieux que quiconque dans la région. Ce savoir-faire métallurgique et minéral constitue le capital technique immatériel sur lequel la renaissance industrielle de la vallée peut s’appuyer.',
  },
  {
    id: 'passage_souterrain_canal',
    title: 'Le boyau d’évacuation de la Malterie',
    where: { street: 'Quai de la Malterie', hint: 'un conduit maçonné à fleur d’eau dissimulé sous une péniche amarrée' },
    when: { hour: [20, 23], weather: 'pluie' },
    requires: { tier: 3, contact: 'leila' },
    clue: 'Un vieux batelier raconte sur le quai qu’un tunnel reliait jadis la brasserie au canal pour charger de nuit sans taxe d’octroi.',
    reward: { kind: 'argent', value: 80 },
    lore: 'L’eau clapote sourdement contre la voûte de briques sombres. Une cache aménagée dans la pierre calcaire a conservé une tirelire en fer-blanc contenant de vieilles pièces et un carnet de contrebande fluviale de 1962. Ce réseau informel permettait d’échapper aux barrières tarifaires locales imposées par les grands négociants de la métropole.',
  },
  {
    id: 'frequence_radio_secours',
    title: 'L’émetteur de secours de Radio-Taret',
    where: { place: 'friche', hint: 'dans la gaine technique de l’ancien transformateur haute tension' },
    when: { hour: [19, 22] },
    requires: { concepts: 2, contact: 'karim' },
    clue: 'Une note griffonnée sur le transistor de Karim indique une fréquence de relais cachée dans la friche.',
    reward: { kind: 'objet', value: 'room_poste_radio_transistor' },
    lore: 'Des quartz d’émission étiquetés « 108.4 MHz Relais B » reliés à une batterie stationnaire encore en état. C’est par ici que la voix des grévistes contournait le brouillage préfectoral lors des manifestations de l’hiver 1983. En récupérant ce récepteur, tu rétablis le contact avec la mémoire vivante des luttes radiophoniques citoyennes.',
  },
  {
    id: 'caisse_solidarite_mineurs',
    title: 'La caisse de secours mutuel de la Mine',
    where: { street: 'Rue de la Mine', hint: 'une niche derrière une borne d’amarrage en fonte scellée au trottoir' },
    when: { hour: [12, 14] },
    requires: { tier: 2 },
    clue: 'Une dépêche historique évoque la tirelire des mineurs de fond, dissimulée rue de la Mine pour subvenir aux blessés.',
    reward: { kind: 'argent', value: 50 },
    lore: 'Un boîtier de fer forgé verrouillé par un loquet à secret que la rouille n’a pas entièrement bloqué. À l’intérieur, des sous mis en commun sou par sou pour payer les soins du médecin aux familles touchées par les coups de grisou. C’est le principe fondateur de la mutualisation des risques et de l’assurance solidaire avant l’État-providence.',
  },
  {
    id: 'boussole_arpenteur_terril',
    title: 'La boussole oubliée des géomètres du Taret',
    where: { street: 'Rue Ambroise-Croizat', hint: 'au pied du transformateur électrique à l’angle de la rue' },
    when: { hour: [10, 16] },
    requires: { concepts: 2 },
    clue: 'Un ancien plan d’arpentage de la cité mentionne un repère de nivellement rue Ambroise-Croizat.',
    reward: { kind: 'objet', value: 'room_boussole_scout_cuivre' },
    lore: 'Un étui de cuir patiné renfermant un instrument d’optique et de visée en laiton lourd. Il servait aux arpenteurs de la Compagnie des Mines à mesurer l’affaissement lent des galeries souterraines sous les cités ouvrières. Cette boussole de précision symbolise la rigueur du calcul d’ingénieur face aux forces invisibles du sous-sol.',
  },
  {
    id: 'recette_tisane_bertin',
    title: 'Le cahier secret d’infusions de Mme Bertin',
    where: { place: 'epicerie', hint: 'sous le tiroir double-fond de la réserve d’épices' },
    when: { hour: [14, 18], weekday: [3] },
    requires: { contact: 'bertin', tier: 2 },
    clue: 'Mme Bertin confie un jour : « Mon mélange secret pour calmer les nerfs après les inventaires est noté au fond de mon meuble d’apothicaire. »',
    reward: { kind: 'concept', value: 'souffrance_travail' },
    lore: 'Trois cahiers d’écolier répertoriant les herbes cueillies sur les talus de la voie ferrée et les coteaux sauvages. Tilleul, mélisse, camomille et reine-des-prés : ce que la médecine du travail ne reconnaissait pas, l’écoute bienveillante de l’épicière le soulageait. Tu y découvres que la santé mentale des travailleuses et travailleurs est le socle invisible de toute économie durable.',
  },
  {
    id: 'tampon_imprimerie_clandestine',
    title: 'La matrice d’imprimerie de Louise-Michel',
    where: { street: 'Rue Louise-Michel', hint: 'dans le conduit de cheminée aveugle du porche d’entrée en briques' },
    when: { hour: [16, 20] },
    requires: { concepts: 5 },
    clue: 'La Gazette des Roses cite une cachette sous le porche de la rue Louise-Michel où les premiers bulletins ouvriers étaient composés.',
    reward: { kind: 'concept', value: 'capture_reglementaire' },
    lore: 'Des caractères d’imprimerie en plomb rangés dans un tiroir de typographe soigneusement graissé. Un tract de 1936 prêt pour la presse : « Pain, Paix, Liberté ». Les lois sur l’affichage et l’impression de l’époque avaient été dictées par les trusts sidérurgiques pour étouffer toute contestation locale, parfait exemple de capture réglementaire par les intérêts dominants.',
  },
  {
    id: 'wagon_postal_gare',
    title: 'Le wagon postal abandonné de l’Est',
    where: { street: "Boulevard de l'Est", hint: 'derrière le grillage du faisceau de voies de garage' },
    when: { hour: [18, 22] },
    requires: { tier: 3 },
    clue: 'Un cheminot retraité raconte qu’un wagon postal dort sur les voies de garage du Boulevard de l’Est depuis le dernier tri nocturne de 1996.',
    reward: { kind: 'concept', value: 'effet_reseau' },
    lore: 'Les casiers de tri en bois de hêtre portent encore les étiquettes métalliques des gares de la région : Néo-Baie, Plateau Blanc, La Houillère. Un demi-million de plis postaux traversaient ce maillage ferroviaire chaque nuit. Plus le réseau ferroviaire comptait de gares raccordées, plus l’utilité du service grandissait exponentiellement pour chaque habitant.',
  },
  {
    id: 'lingot_derniere_coulee',
    title: 'Le lingot commémoratif de la dernière coulée',
    where: { street: 'Rue des Forges', hint: 'scellé dans la maçonnerie du muret d’enceinte de l’ancienne forge' },
    when: { hour: [11, 15] },
    requires: { contact: 'samir', tier: 3 },
    clue: 'Samir évoque avec émotion un morceau d’acier frappé du sceau de 2014, caché dans le mur de la rue des Forges.',
    reward: { kind: 'objet', value: 'room_lingot_acier_grave_souvenir' },
    lore: 'Une barre d’acier brut de cinq kilos, froide et polie au grain fin, frappée du millésime 2014. C’est l’ultime coulée du convertisseur n°1 avant l’extinction définitive des hauts-fourneaux de Val-Ferrand. Les ouvriers l’ont scellée ici pour rappeler aux générations futures que leur ville a été forgée dans le feu et le métal.',
  },
  {
    id: 'herbier_abandonne_parc',
    title: 'La grainothèque sauvage du Parc des Roses',
    where: { place: 'parc', hint: 'dans le tronc creux du vieux saule pleureur au bord du bassin' },
    when: { hour: [8, 12], weather: 'soleil' },
    requires: { concepts: 3 },
    clue: 'Lucien notait : « Les enfants du quartier ont caché leurs graines de tournesol dans le tronc du saule du parc. »',
    reward: { kind: 'objet', value: 'room_bocal_echantillons_graines' },
    lore: 'Des sachets en papier kraft étiquetés avec une écriture d’écolier soignée. Des semences rustiques de haricots grimpants, de tomates anciennes et de courges adaptées aux sols métallifères du bassin minier. Cette réserve biologique populaire a survécu aux années d’abandon, prête à reverdir les friches urbaines.',
  },
  {
    id: 'boite_vintage_bertin_archives',
    title: 'La boîte à bonbons de la première épicerie',
    where: { street: 'Rue Ambroise-Croizat', hint: 'derrière la grille de ventilation basse d’une cave d’immeuble' },
    when: { hour: [14, 17] },
    requires: { contact: 'bertin' },
    clue: 'Mme Bertin se souvient avoir égaré une boîte en fer blanc de 1968 lors de son premier emménagement rue Croizat.',
    reward: { kind: 'objet', value: 'room_boite_biscuits_vintage_bertin' },
    lore: 'Le couvercle en tôle lithographiée montre une illustration de marché aux paniers d’osier des années 1960. À l’intérieur, les premiers tickets de caisse manuscrits de la boutique et trois médailles corporatives du travail. Cette boîte témoigne de la naissance du commerce de proximité et de la confiance bâtie sur le crédit gratuit aux familles en difficulté.',
  },
  {
    id: 'lampe_etudes_laminoir',
    title: 'La lampe d’ingénieur de l’Atelier',
    where: { place: 'friche', hint: 'sur la mezzanine de la halle sud, derrière une armoire électrique éventrée' },
    when: { hour: [15, 19] },
    requires: { contact: 'karim', tier: 2 },
    clue: 'Karim indique qu’une lampe d’architecte intacte est restée sur la mezzanine poussiéreuse de la halle.',
    reward: { kind: 'objet', value: 'room_lampe_architecte_articulee' },
    lore: 'Un bras articulé à ressorts en acier laqué vert anglais avec un réflecteur en tôle émaillée. Elle a éclairé les calculs de résistance des matériaux du pont de Néo-Baie et les épures du laminoir dans les années 1970. Posée sur ton établi, elle offre la lumière idéale pour concevoir les nouveaux projets techniques du quartier.',
  },
  {
    id: 'carte_vallee_dessin_inedit',
    title: 'Le calque d’urbanisme d’époque',
    where: { place: 'college', hint: 'au dos d’un panneau d’affichage de la salle de géographie' },
    when: { hour: [12, 14], weekday: [1, 2, 4, 5] },
    requires: { concepts: 4 },
    clue: 'Yasmine a repéré un rouleau de papier calque punaisé derrière les cartes de France du collège Jean-Moulin.',
    reward: { kind: 'objet', value: 'room_carte_murale_valferrand_1970' },
    lore: 'Un tracé minutieux au lavis d’encre de Chine montrant la cité idéale imaginée par les urbanistes ouvriers en 1970 : tramways légers, ceintures maraîchères partagées et cités-jardins autonomes. Ce plan visionnaire prouve que le développement économique peut s’harmoniser avec l’écologie et l’émancipation collective.',
  },
];
