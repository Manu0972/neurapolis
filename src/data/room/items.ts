/**
 * Objets décoratifs et fonctionnels de la chambre du joueur (docs/ASCENSION.md & docs/VISION.md).
 * De la chambre d'écolier de la Cité des Roses au bureau du magnat de l'industrie.
 * Chaque objet raconte une étape de l'ascension et apporte un bonus passif.
 */

export interface RoomItem {
  id: string;
  name: string;
  icon: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  how: string;
  lore: string;
  bonus?: {
    kind: 'stress' | 'negociation' | 'organisation' | 'recherche' | 'chance' | 'plan';
    value: number;
  };
}

export const ROOM_ITEMS: readonly RoomItem[] = [
  // ==========================================
  // PALIER 1 : LA COUR (L’enfance et l'éveil)
  // ==========================================
  {
    id: 'room_photo_lucien_fonderie',
    name: 'Photo encadrée de papy Lucien',
    icon: '🖼️',
    tier: 1,
    how: 'Posée sur la table de nuit dès le début de l’aventure.',
    lore: 'Lucien en bleu de chauffe devant le haut-fourneau n°2 en 1984, lunettes de protection relevées sur le front et sourire franc. Il a écrit au dos : « Le feu ne brûle que ceux qui l’oublient. »',
    bonus: { kind: 'stress', value: -5 },
  },
  {
    id: 'room_reveil_mecanique_rouille',
    name: 'Vieux réveil mécanique Bayard',
    icon: '⏰',
    tier: 1,
    how: 'Trouvé sur l’établi de Lucien.',
    lore: 'Un tic-tac d’airain rassurant qui rythme les levers matinaux à 6h30 avant la première tournée de livraison de goûters.',
    bonus: { kind: 'organisation', value: 2 },
  },
  {
    id: 'room_classeur_cartes_holographiques',
    name: 'Classeur des créatures du Taret',
    icon: '🃏',
    tier: 1,
    how: 'Commercer avec les élèves de la cour au Palier 1.',
    lore: 'Une collection complète de cartes fictives échangées sous le préau. La cote des monstres de ferraille y est soigneusement annotée au crayon.',
    bonus: { kind: 'negociation', value: 2 },
  },
  {
    id: 'room_tirelire_cochon_fonte',
    name: 'Tirelire en fonte des fondeurs',
    icon: '🐷',
    tier: 1,
    how: 'Cadeau de Thierry pour ses douze ans.',
    lore: 'Coulée dans les ateliers d’apprentissage de Taret-Acier en 1975. Impossible à ouvrir sans dévisser un écrou de douze sous le ventre.',
    bonus: { kind: 'organisation', value: 1 },
  },
  {
    id: 'room_boite_biscuits_vintage_bertin',
    name: 'Boîte en fer blanc « Épicerie Bertin 1968 »',
    icon: '🥫',
    tier: 1,
    how: 'Offerte par Mme Bertin après la première commande de gros.',
    lore: 'Une boîte illustrée d’un marché d’antan, idéale pour dissimuler les billets de cinq euros et les reçus de caisse manuscrits.',
    bonus: { kind: 'chance', value: 2 },
  },
  {
    id: 'room_boussole_scout_cuivre',
    name: 'Boussole de géomètre en cuivre',
    icon: '🧭',
    tier: 1,
    how: 'Trouvée dans les cartons de la bibliothèque du CE.',
    lore: 'Un instrument d’arpentage qui servait à tracer les galeries de mine et les conduites du canal.',
    bonus: { kind: 'plan', value: 2 },
  },
  {
    id: 'room_poste_radio_transistor',
    name: 'Transistor à piles Radio-Taret',
    icon: '📻',
    tier: 1,
    how: 'Réparé avec Karim à l’Atelier Populaire.',
    lore: 'Capte les bulletins météo locaux et les chroniques syndicales sur les ondes moyennes le matin à sept heures.',
    bonus: { kind: 'recherche', value: 2 },
  },

  // ==========================================
  // PALIER 2 : LE QUARTIER (L’ancrage et les commerces)
  // ==========================================
  {
    id: 'room_enseigne_miniature_bois',
    name: 'Maquette miniature de l’étal de marché',
    icon: '🎪',
    tier: 2,
    how: 'Fabriquée par Zoé après l’inauguration sur la place.',
    lore: 'Une réplique en balsa et toile rayée rouge et blanche de ton premier stand commercial officiel.',
    bonus: { kind: 'stress', value: -4 },
  },
  {
    id: 'room_calculatrice_ruban_comptable',
    name: 'Calculatrice à ruban imprimant Citizen',
    icon: '📠',
    tier: 2,
    how: 'Achetée d’occasion à la ressourcerie.',
    lore: 'Le crépitement rythmé du rouleau de papier blanc rassure les fins de mois : chaque addition est imprimée en noir et rouge.',
    bonus: { kind: 'organisation', value: 3 },
  },
  {
    id: 'room_tampon_encreur_commercial',
    name: 'Tampon bois officiel à ton nom',
    icon: '📑',
    tier: 2,
    how: 'Commandé chez l’imprimeur après la signature du premier bail.',
    lore: 'L’encre violette marque chaque facture d’un sceau artisanal : « Entreprise {nom} — Val-Ferrand ». Une grande fierté.',
    bonus: { kind: 'negociation', value: 3 },
  },
  {
    id: 'room_caisse_monnayeur_acier',
    name: 'Monnayeur de chauffeur de bus 1980',
    icon: '🪙',
    tier: 2,
    how: 'Don d’un vieux chauffeur reconnaissant de la ligne 4.',
    lore: 'Cinq tubes à ressorts pour distribuer les pièces de un et deux euros à une vitesse d’éclair lors des marchés du samedi.',
    bonus: { kind: 'organisation', value: 2 },
  },
  {
    id: 'room_carte_murale_valferrand_1970',
    name: 'Plan d’urbanisme d’époque de Val-Ferrand',
    icon: '🗺️',
    tier: 2,
    how: 'Décrochée des archives de la Maison du Peuple.',
    lore: 'Une carte monumentale où figurent encore les voies ferrées de l’usine, punaisée au-dessus du bureau avec des feutres de couleur traçant les tournées.',
    bonus: { kind: 'plan', value: 3 },
  },
  {
    id: 'room_lampe_architecte_articulee',
    name: 'Lampe d’atelier articulée émaillée vert',
    icon: '💡',
    tier: 2,
    how: 'Récupérée dans les bureaux d’études de la friche.',
    lore: 'Projette un halo chaud et précis sur les livres de comptes tard le soir sans réveiller l’appartement.',
    bonus: { kind: 'recherche', value: 2 },
  },
  {
    id: 'room_bocal_echantillons_graines',
    name: 'Herbier en bocaux des maraîchers',
    icon: '🌱',
    tier: 2,
    how: 'Cadeau de la coopérative agricole du Taret.',
    lore: 'Douze flacons d’apothicaire contenant les semences de blé ancien, de seigle et de tournesol qui approvisionnent tes boutiques.',
    bonus: { kind: 'chance', value: 2 },
  },

  // ==========================================
  // PALIER 3 : LA VILLE (L’entrepreneuriat urbain)
  // ==========================================
  {
    id: 'room_tableau_liege_organigramme',
    name: 'Grand tableau de liège des équipes',
    icon: '📋',
    tier: 3,
    how: 'Installé après l’embauche des premiers salariés.',
    lore: 'Des fiches cartonnées reliées par des fils de laine : Noah à la logistique, Lina aux contrats, les plannings et les contacts clés.',
    bonus: { kind: 'organisation', value: 4 },
  },
  {
    id: 'room_telecom_sans_fil_pro',
    name: 'Combiné téléphonique professionnel à trois lignes',
    icon: '☎️',
    tier: 3,
    how: 'Acheté lors de l’ouverture du bureau avenue Jaurès.',
    lore: 'Permet de basculer en direct entre l’entrepôt de la Friche, le grossiste d’HyperVal et la mairie.',
    bonus: { kind: 'negociation', value: 4 },
  },
  {
    id: 'room_lingot_acier_grave_souvenir',
    name: 'Miniature de lingot d’acier gravé',
    icon: '🧱',
    tier: 3,
    how: 'Cadeau de Samir pour les 15 ans du joueur.',
    lore: 'Coulé dans le dernier fourneau de Taret-Acier en 2014. Gravé : « Résiste et bâtis ». Un presse-papier d’un poids imposant.',
    bonus: { kind: 'stress', value: -6 },
  },
  {
    id: 'room_trophee_jeune_artisan_agglomeration',
    name: 'Trophée d’Argent du Commerce Citoyen',
    icon: '🏆',
    tier: 3,
    how: 'Remis par le président de la Chambre de Commerce.',
    lore: 'Une statuette en fer forgé récompensant la revitalisation des commerces du centre-ville historique.',
    bonus: { kind: 'chance', value: 3 },
  },
  {
    id: 'room_ordinateur_portable_reconditionne',
    name: 'PC portable reconditionné sous Linux',
    icon: '💻',
    tier: 3,
    how: 'Monté avec M. Lambert au club de techno.',
    lore: 'Fait tourner des tableurs géants et les premiers scripts d’optimisation des stocks sans dépendre des logiciels propriétaires coûteux.',
    bonus: { kind: 'recherche', value: 4 },
  },
  {
    id: 'room_barometre_marine_laiton',
    name: 'Baromètre anéroïde en laiton marin',
    icon: '🌡️',
    tier: 3,
    how: 'Acheté auprès d’un marinier du canal de la Malterie.',
    lore: 'Prédit la pluie et les gelées douze heures à l’avance : idéal pour commander les fruits et ajuster les stocks de parapluies.',
    bonus: { kind: 'plan', value: 3 },
  },
  {
    id: 'room_cadenas_blinde_caisse_forte',
    name: 'Clé en bronze du premier entrepôt',
    icon: '🗝️',
    tier: 3,
    how: 'Signature du bail de stockage à la Friche.',
    lore: 'Une lourde clé ancienne qui ouvre la grille du hangar n°4, premier sanctuaire logistique de tes flottes de livraison.',
    bonus: { kind: 'organisation', value: 2 },
  },

  // ==========================================
  // PALIER 4 : LA VALLÉE (La chaîne logistique régionale)
  // ==========================================
  {
    id: 'room_maquette_cargo_neo_baie',
    name: 'Maquette en bois du cargo l’Espérance',
    icon: '🚢',
    tier: 4,
    how: 'Offerte par Leïla après le premier contrat à la criée.',
    lore: 'Rappelle les liaisons maritimes et fluviales qui descendent le Taret jusqu’à l’océan.',
    bonus: { kind: 'negociation', value: 4 },
  },
  {
    id: 'room_carte_lumineuse_reseau_vallee',
    name: 'Panneau lumineux des flux de la Vallée',
    icon: '💡',
    tier: 4,
    how: 'Conçu avec les équipes de développement du Palier 4.',
    lore: 'Des diodes LED s’allument pour signaler les livraisons en cours entre Val-Ferrand, Néo-Baie et le Plateau Blanc.',
    bonus: { kind: 'plan', value: 4 },
  },
  {
    id: 'room_registre_cuir_grands_livres',
    name: 'Grand livre des comptes relié en cuir pleine fleur',
    icon: '📖',
    tier: 4,
    how: 'Relié par la coopérative des imprimeurs de la vallée.',
    lore: 'Contient l’historique certifié de chaque centime de chiffre d’affaires et de salaire versé depuis la première année.',
    bonus: { kind: 'organisation', value: 4 },
  },
  {
    id: 'room_medaille_merite_cooperatif',
    name: 'Médaille d’Honneur de la Coopération Régionale',
    icon: '🎖️',
    tier: 4,
    how: 'Attribuée par l’Union des Sociétés Coopératives.',
    lore: 'Récompense la création de partenariats équitables et de réseaux de distribution sans écrasement des petits producteurs.',
    bonus: { kind: 'stress', value: -7 },
  },
  {
    id: 'room_micro_studio_podcast_economie',
    name: 'Microphone de studio Shure SM7B',
    icon: '🎙️',
    tier: 4,
    how: 'Acheté pour enregistrer les chroniques économiques avec Yasmine.',
    lore: 'Sert à diffuser la voix des alternatives économiques et à débattre des doctrines de société sur les radios étudiantes.',
    bonus: { kind: 'recherche', value: 3 },
  },
  {
    id: 'room_casque_antibruit_chantier_pro',
    name: 'Casque antibruit Peltor d’ingénieur',
    icon: '🎧',
    tier: 4,
    how: 'Fourni lors des visites de la centrale d’Île Saphir.',
    lore: 'Permet de s’isoler totalement dans sa bulle de concentration pour rédiger les plans stratégiques au milieu du tumulte.',
    bonus: { kind: 'stress', value: -5 },
  },
  {
    id: 'room_coffret_echantillons_metaux_rares',
    name: 'Nuancier des alliages du laminoir',
    icon: '🔬',
    tier: 4,
    how: 'Don de la coopérative TaretCoop.',
    lore: 'Échantillons d’aciers spéciaux et d’aluminium recyclé destinés aux mobilités décarbonées.',
    bonus: { kind: 'recherche', value: 4 },
  },

  // ==========================================
  // PALIER 5 : LE PAYS (L’envergure nationale et les sièges)
  // ==========================================
  {
    id: 'room_double_ecran_trader_bloomberg',
    name: 'Double écran haute résolution de suivi des cours',
    icon: '🖥️',
    tier: 5,
    how: 'Installé lors de l’ouverture du siège national.',
    lore: 'Affiche en temps réel les prix des céréales à Euronext, les taux de la BCE et la courbe d’inflation nationale.',
    bonus: { kind: 'recherche', value: 5 },
  },
  {
    id: 'room_fauteuil_cuir_direction_ergonomique',
    name: 'Fauteuil de bureau ergonomique en cuir havane',
    icon: '🪑',
    tier: 5,
    how: 'Acheté lors de la signature de la charte nationale de bien-être.',
    lore: 'Soutien lombaire parfait pour les séances de négociation marathoniennes de douze heures avec les banques d’affaires.',
    bonus: { kind: 'stress', value: -8 },
  },
  {
    id: 'room_maquette_usine_zero_carbone',
    name: 'Maquette architecturale du laminoir solaire',
    icon: '🏭',
    tier: 5,
    how: 'Présentée lors du plan de réindustrialisation verte.',
    lore: 'Bâtiment à énergie positive avec toitures photovoltaïques et récupération de chaleur fatale pour chauffer les serres du quartier.',
    bonus: { kind: 'plan', value: 5 },
  },
  {
    id: 'room_titre_actionnaire_fondateur_cadre',
    name: 'Premier certificat d’actions citoyennes encadré',
    icon: '📜',
    tier: 5,
    how: 'Émis lors de la transformation en Société à Mission.',
    lore: 'Porte les signatures de Nora, Thierry, Noah, Lina, Samir, Karim et de deux cents habitants de la Cité des Roses.',
    bonus: { kind: 'chance', value: 4 },
  },
  {
    id: 'room_stylo_plume_or_accords_nationaux',
    name: 'Stylo plume en ébonite et plume d’or 18 carats',
    icon: '✒️',
    tier: 5,
    how: 'Offert par la fédération nationale des PME solidaires.',
    lore: 'A servi à parapher la convention collective nationale et les accords d’intéressement exemplaires de ton groupe.',
    bonus: { kind: 'negociation', value: 5 },
  },
  {
    id: 'room_globe_terrestre_physique_retro_eclaire',
    name: 'Globe terrestre physique géant rétro-éclairé',
    icon: '🌍',
    tier: 5,
    how: 'Cadeau de M. Girard pour son départ en retraite.',
    lore: 'Les grands courants maritimes et les reliefs y sont gravés en relief sensible au doigt.',
    bonus: { kind: 'plan', value: 4 },
  },
  {
    id: 'room_dictionnaire_philosophie_economique',
    name: 'Les six volumes du Dictionnaire de l’Économie Politique (1852)',
    icon: '📚',
    tier: 5,
    how: 'Racheté aux enchères pour compléter les carnets de Lucien.',
    lore: 'Des pages d’érudition reliées en maroquin où Smith, Say, Sismondi et Proudhon dialoguent avec une clarté limpide.',
    bonus: { kind: 'recherche', value: 5 },
  },

  // ==========================================
  // PALIER 6 : LE MONDE (Le conglomérat et l’Histoire)
  // ==========================================
  {
    id: 'room_terminal_maritime_satellite',
    name: 'Console satellite de suivi des navires marchands',
    icon: '🛰️',
    tier: 6,
    how: 'Raccordée lors du premier affrètement de cargo à voiles.',
    lore: 'Trace la position GPS heure par heure des voiliers de transport qui traversent l’Atlantique sans consommer de fioul.',
    bonus: { kind: 'plan', value: 6 },
  },
  {
    id: 'room_horloge_mondiale_quatre_fuseaux',
    name: 'Horloge murale quadri-fuseau (Paris, Tokyo, New York, Dakar)',
    icon: '🕒',
    tier: 6,
    how: 'Installée dans le salon lors des négociations internationales.',
    lore: 'Permet de synchroniser les appels avec les coopératives agricoles africaines et les centres de recherche tokyoïtes.',
    bonus: { kind: 'organisation', value: 5 },
  },
  {
    id: 'room_sceau_cire_conglomerat_valferrand',
    name: 'Sceau d’État en argent et manche d’ébène',
    icon: '🏛️',
    tier: 6,
    how: 'Créé pour sceller les traités de gouvernance partagée.',
    lore: 'Grave dans la cire rouge l’emblème du conglomérat : deux mains unies entourant une rose et une roue dentée.',
    bonus: { kind: 'negociation', value: 6 },
  },
  {
    id: 'room_legion_honneur_citoyenne',
    name: 'Croix de l’Ordre National du Mérite Économique',
    icon: '🏅',
    tier: 6,
    how: 'Décernée sur proposition conjointe des syndicats et du gouvernement.',
    lore: 'Une distinction nationale acceptée à une seule condition : qu’elle reste exposée dans la chambre de la Cité des Roses.',
    bonus: { kind: 'chance', value: 5 },
  },
  {
    id: 'room_maquette_fusee_materiaux_circulaires',
    name: 'Maquette du projet aérospatial en acier recyclé',
    icon: '🚀',
    tier: 6,
    how: 'Développée en partenariat avec les universités européennes.',
    lore: 'Preuve que le métal né dans la vallée du Taret peut un jour voyager jusqu’aux étoiles.',
    bonus: { kind: 'recherche', value: 6 },
  },
  {
    id: 'room_arbre_genealogique_fondateurs_acier',
    name: 'Fresque généalogique des bâtisseurs de Val-Ferrand',
    icon: '🌳',
    tier: 6,
    how: 'Peinte par Zoé pour la célébration du centenaire.',
    lore: 'Relie les mineurs de 1890, les métallos de 1950, Lucien, Nora, Thierry, et les dizaines de milliers de salariés d’aujourd’hui.',
    bonus: { kind: 'stress', value: -10 },
  },
  {
    id: 'room_carnet_noir_notes_propres_joueur',
    name: 'Le Carnet Noir : Tes propres notes d’ascension',
    icon: '📓',
    tier: 6,
    how: 'Rempli page après page par le joueur de 12 à 18 ans.',
    lore: 'Tes propres théorèmes, tes erreurs surmontées, tes victoires morales et tes conseils pour la génération qui viendra après toi.',
    bonus: { kind: 'plan', value: 6 },
  },
];
