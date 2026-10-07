/**
 * Fil d'actualités et dépêches du monde (docs/ASCENSION.md & docs/VISION.md).
 * Événements macroéconomiques, sectoriels et locaux influençant la demande
 * et commentés par les voix des penseurs.
 */

export type Sector =
  | 'alimentation'
  | 'commerce'
  | 'services'
  | 'logistique'
  | 'mode'
  | 'tech'
  | 'immobilier'
  | 'culture'
  | 'industrie'
  | 'finance'
  | 'energie'
  | 'medias';

export type NewsCategory = 'geopolitique' | 'economie' | 'tech' | 'social' | 'climat' | 'local';

export interface NewsTemplate {
  id: string;
  category: NewsCategory;
  minTier: 1 | 2 | 3 | 4 | 5 | 6;
  headline: string;
  body: string;
  effects: { sector: Sector; mult: number; days: number }[];
  reaction: {
    ghost: string;
    text: string;
  };
}

export const NEWS_TEMPLATES: readonly NewsTemplate[] = [
  // ==========================================
  // PALIER 1 : LA COUR (Collège & Quartier des Roses)
  // ==========================================
  {
    id: 'news_local_penurie_sucre_bertin',
    category: 'local',
    minTier: 1,
    headline: 'Retard de livraison à l’épicerie Bertin : stocks de biscuits sous tension',
    body: 'Une panne de camionnette bloque les réapprovisionnements de farine et de sucre chez Mme Bertin. Les prix du vrac augmentent de 15 % dans le quartier des Roses.',
    effects: [{ sector: 'alimentation', mult: 0.85, days: 4 }],
    reaction: {
      ghost: 'ohno',
      text: 'Le juste-à-temps sans fournisseur de secours est une illusion. Les rayons vides font perdre plus que le coût d’un carton de réserve.',
    },
  },
  {
    id: 'news_local_greve_bus_taret',
    category: 'social',
    minTier: 1,
    headline: 'Ligne 4 en grève : les collégiens et ouvriers marchent à pied',
    body: 'Les chauffeurs du réseau Taret-Bus réclament une prime de chaleur. Les élèves arrivent en retard et affluent vers les commerces de proximité immédiate.',
    effects: [
      { sector: 'commerce', mult: 1.25, days: 3 },
      { sector: 'services', mult: 0.8, days: 3 },
    ],
    reaction: {
      ghost: 'marx',
      text: 'Quand le travail s’arrête, la ville mesure enfin qui produit réellement la valeur. La proximité redevient une force.',
    },
  },
  {
    id: 'news_local_canicule_cour_recre',
    category: 'climat',
    minTier: 1,
    headline: 'Alerte canicule : 34°C mesurés dans la cour en goudron du collège',
    body: 'Le principal interdit les courses dans la cour. Les ventes de boissons fraîches et de fruits explosent tandis que les biscuits étouffent la soif.',
    effects: [
      { sector: 'alimentation', mult: 1.3, days: 5 },
      { sector: 'culture', mult: 0.7, days: 5 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Le goudron accumule la chaleur jusqu’à l’invivable. L’activité humaine doit respecter les limites thermiques de son écosystème.',
    },
  },
  {
    id: 'news_local_brocante_roses',
    category: 'local',
    minTier: 1,
    headline: 'Grande brocante d’automne sur la place des Roses',
    body: 'Une centaine d’habitants déballent leurs greniers. Les cartes à collectionner, les vieux livres et les jeux d’occasion s’échangent sous les platanes.',
    effects: [
      { sector: 'commerce', mult: 1.35, days: 2 },
      { sector: 'culture', mult: 1.4, days: 2 },
    ],
    reaction: {
      ghost: 'ostrom',
      text: 'La place publique redevient un espace commun où les règles d’échange s’inventent entre voisins, sans intermédiaire prédateur.',
    },
  },
  {
    id: 'news_local_controle_police_marche',
    category: 'local',
    minTier: 1,
    headline: 'Ronde municipale renforcée autour de la place du Marché',
    body: 'La police municipale vérifie les autorisations de vente à la sauvette devant le collège. Les vendeurs informels doivent se faire discrets ou coopérer.',
    effects: [
      { sector: 'commerce', mult: 0.8, days: 6 },
      { sector: 'services', mult: 0.9, days: 4 },
    ],
    reaction: {
      ghost: 'weber',
      text: 'L’autorité légale-rationnelle s’impose par l’uniforme et le formulaire. Sans règle formelle, aucun commerce ne franchit le seuil du quartier.',
    },
  },
  {
    id: 'news_local_succes_atelier_karim',
    category: 'social',
    minTier: 1,
    headline: 'L’Atelier Populaire du Taret répare 50 vélos d’élèves en une semaine',
    body: 'Karim et ses bénévoles redonnent vie aux vieux vélos abandonnés dans les caves HLM. La mobilité douce gagne toute la jeunesse ouvrière.',
    effects: [
      { sector: 'services', mult: 1.4, days: 7 },
      { sector: 'logistique', mult: 1.15, days: 5 },
    ],
    reaction: {
      ghost: 'dejours',
      text: 'Le travail artisanal bien fait redonne de la fierté et tisse du lien social bien au-delà de la simple rentabilité financière.',
    },
  },
  {
    id: 'news_local_carte_panini_collector',
    category: 'local',
    minTier: 1,
    headline: 'Fièvre des cartes collector : une édition limitée embrase les préaux',
    body: 'Les élèves s’arrachent la carte holographique du champion régional. La spéculation s’installe entre les casiers avec des cours doublés en récréation.',
    effects: [
      { sector: 'commerce', mult: 1.45, days: 6 },
      { sector: 'medias', mult: 1.2, days: 4 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'La rareté engendre la valeur d’échange. Ce n’est ni bien ni mal, c’est le signal spontané du désir des acheteurs.',
    },
  },
  {
    id: 'news_local_recuperation_papier_college',
    category: 'social',
    minTier: 1,
    headline: 'Campagne de récupération des manuels scolaires au CDI',
    body: 'Mme Moreau organise un troc solidaire de fiches de révision et de fournitures scolaires pour alléger le budget des familles précaires.',
    effects: [
      { sector: 'services', mult: 1.2, days: 8 },
      { sector: 'commerce', mult: 0.9, days: 8 },
    ],
    reaction: {
      ghost: 'marx',
      text: 'L’entraide entre familles ouvrières montre que la solidarité précède le marché lorsque le pouvoir d’achat vient à manquer.',
    },
  },
  {
    id: 'news_local_pluie_torrentielle_taret',
    category: 'climat',
    minTier: 1,
    headline: 'Le Taret monte de deux mètres : quais fermés et caves inondées',
    body: 'De violents orages d’automne noient les passages souterrains. Les déplacements se compliquent et les habitants restent confinés chez eux.',
    effects: [
      { sector: 'commerce', mult: 0.7, days: 3 },
      { sector: 'logistique', mult: 0.65, days: 3 },
      { sector: 'alimentation', mult: 1.2, days: 3 },
    ],
    reaction: {
      ghost: 'hayek',
      text: 'Les chocs imprévisibles révèlent la résilience des structures légères. Ceux qui ont trop de dettes fixes boivent la tasse en premier.',
    },
  },
  {
    id: 'news_local_nouvelle_rotative_gazette',
    category: 'local',
    minTier: 1,
    headline: 'La Gazette des Roses imprime son numéro spécial rentrée',
    body: 'Le journal associatif du quartier consacre sa une aux espoirs de reconversion de la friche. Les commerçants locaux y achètent leurs premiers encarts.',
    effects: [
      { sector: 'medias', mult: 1.35, days: 7 },
      { sector: 'commerce', mult: 1.1, days: 5 },
    ],
    reaction: {
      ghost: 'bourdieu',
      text: 'Le journal local produit du capital symbolique : paraître dans ses colonnes transforme un simple vendeur en figure reconnue du quartier.',
    },
  },

  // ==========================================
  // PALIER 2 : LE QUARTIER (Centre, Marché, Avenue Jaurès)
  // ==========================================
  {
    id: 'news_quartier_hausse_loyers_jaures',
    category: 'economie',
    minTier: 2,
    headline: 'Avenue Jean-Jaurès : les propriétaires réclament 10 % de plus aux baux commerciaux',
    body: 'La rareté des locaux avec vitrine pousse les loyers à la hausse. Les jeunes commerçants doivent augmenter leurs rotations pour amortir leurs charges fixes.',
    effects: [
      { sector: 'immobilier', mult: 1.3, days: 15 },
      { sector: 'commerce', mult: 0.85, days: 12 },
    ],
    reaction: {
      ghost: 'ricardo',
      text: 'La rente foncière prélève sa dîme sur le travail productif sans rien créer elle-même. C’est la loi de la rente différentielle.',
    },
  },
  {
    id: 'news_quartier_promo_agressive_hyperval',
    category: 'economie',
    minTier: 2,
    headline: 'Le Drive HyperVal lance une campagne « Prix Coûtant » agressive',
    body: 'Pendant deux semaines, les géants de la périphérie bradent les produits d’épicerie. Les commerçants du centre doivent miser sur l’accueil et le conseil.',
    effects: [
      { sector: 'commerce', mult: 0.75, days: 10 },
      { sector: 'alimentation', mult: 0.8, days: 10 },
      { sector: 'logistique', mult: 1.25, days: 10 },
    ],
    reaction: {
      ghost: 'ford',
      text: 'Le volume écrase tout sur son passage. Si tu ne peux pas rivaliser sur les coûts, ne joue pas sur leur terrain standardisé.',
    },
  },
  {
    id: 'news_quartier_label_terroir_taret',
    category: 'local',
    minTier: 2,
    headline: 'Création du label « Maraîchers de la Vallée du Taret »',
    body: 'Une vingtaine de producteurs locaux s’unissent pour garantir fraîcheur et prix équitables sur les étals du marché municipal. L’engouement citoyen est immédiat.',
    effects: [
      { sector: 'alimentation', mult: 1.4, days: 14 },
      { sector: 'commerce', mult: 1.15, days: 10 },
    ],
    reaction: {
      ghost: 'ostrom',
      text: 'En définissant des règles claires d’adhésion et de contrôle mutuel, la communauté valorise ses ressources sans se faire dépouiller.',
    },
  },
  {
    id: 'news_quartier_inspection_hygiene_surprise',
    category: 'social',
    minTier: 2,
    headline: 'Vague de contrôles sanitaires inopinés dans les snacks et marchés',
    body: 'Les inspecteurs vérifient les chaînes du froid et la traçabilité des denrées. Les commerces rigoureux gagnent la confiance des familles.',
    effects: [
      { sector: 'alimentation', mult: 0.9, days: 6 },
      { sector: 'services', mult: 1.1, days: 6 },
    ],
    reaction: {
      ghost: 'taylor',
      text: 'La méthode et la traçabilité ne sont pas de la paperasse inutile : ce sont les garanties indispensables de la pérennité industrielle.',
    },
  },
  {
    id: 'news_quartier_penurie_cafe_cours_mondial',
    category: 'economie',
    minTier: 2,
    headline: 'Flambée des cours mondiaux de l’arabica : la tasse passe le cap symbolique',
    body: 'Les sécheresses en Amérique du Sud réduisent les récoltes. Les cafés de la place doivent rogner sur leurs marges ou répercuter la hausse au comptoir.',
    effects: [
      { sector: 'alimentation', mult: 0.88, days: 12 },
      { sector: 'commerce', mult: 0.95, days: 8 },
    ],
    reaction: {
      ghost: 'hayek',
      text: 'Le système des prix répercute une sécheresse à dix mille kilomètres sans qu’aucun ministre n’ait besoin de signer un décret.',
    },
  },
  {
    id: 'news_quartier_fete_printemps_rues_pietonnes',
    category: 'local',
    minTier: 2,
    headline: 'Le centre-ville entièrement piétonnier pour la Fête du Printemps',
    body: 'Les voitures sont interdites pendant trois jours. Des terrasses éphémères et des concerts de rue attirent les familles des communes voisines.',
    effects: [
      { sector: 'commerce', mult: 1.35, days: 4 },
      { sector: 'culture', mult: 1.5, days: 4 },
      { sector: 'alimentation', mult: 1.4, days: 4 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Rendre la ville aux piétons vivifie le tissu social et stimule l’économie locale tout en réduisant l’empreinte carbone.',
    },
  },
  {
    id: 'news_quartier_greve_poubelles_centre',
    category: 'social',
    minTier: 2,
    headline: 'Dépôts d’ordures en souffrance : le ramassage municipal bloqué',
    body: 'Les éboueurs de l’agglomération réclament une reconnaissance de la pénibilité. L’odeur et l’encombrement des trottoirs éloignent les promeneurs.',
    effects: [
      { sector: 'commerce', mult: 0.78, days: 5 },
      { sector: 'services', mult: 0.85, days: 5 },
    ],
    reaction: {
      ghost: 'dejours',
      text: 'On ne remarque l’utilité vitale des métiers invisibles que le jour où la souffrance les pousse à interrompre le service.',
    },
  },
  {
    id: 'news_quartier_mode_friperie_vintage',
    category: 'economie',
    minTier: 2,
    headline: 'Engouement pour le vintage : la seconde main séduit les jeunes de Val-Ferrand',
    body: 'Face au coût des vêtements neufs, la friperie et la retouche deviennent branchées. Les boutiques traditionnelles constatent une baisse de fréquentation.',
    effects: [
      { sector: 'mode', mult: 1.4, days: 16 },
      { sector: 'commerce', mult: 1.1, days: 10 },
    ],
    reaction: {
      ghost: 'schumpeter',
      text: 'La seconde main détruit les marges du prêt-à-porter standardisé pour recréer une valeur fondée sur l’originalité et le recyclage.',
    },
  },
  {
    id: 'news_quartier_fermeture_bureau_poste',
    category: 'social',
    minTier: 2,
    headline: 'Le bureau de poste des Roses réduit ses horaires d’ouverture',
    body: 'La direction supprime les créneaux du samedi matin. Les commerçants du quartier peinent à déposer leurs recettes et à affranchir leurs colis.',
    effects: [
      { sector: 'logistique', mult: 0.82, days: 14 },
      { sector: 'services', mult: 0.9, days: 10 },
    ],
    reaction: {
      ghost: 'bourdieu',
      text: 'Le retrait des services publics dégrade le capital spatial des quartiers populaires au profit des zones d’activités périphériques.',
    },
  },
  {
    id: 'news_quartier_succes_marche_nocturne',
    category: 'local',
    minTier: 2,
    headline: 'Le marché nocturne du jeudi fait le plein sur les quais du canal',
    body: 'Artisans, créateurs et producteurs régalent les promeneurs jusqu’à 22h. Les chiffres d’affaires de la soirée compensent un début de semaine calme.',
    effects: [
      { sector: 'alimentation', mult: 1.3, days: 6 },
      { sector: 'culture', mult: 1.25, days: 6 },
      { sector: 'commerce', mult: 1.2, days: 6 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'Adapter ses horaires au rythme de vie des clients est la plus élémentaire des leçons de commerce : l’offre répond au temps libre.',
    },
  },

  // ==========================================
  // PALIER 3 : LA VILLE (Agglomération de Val-Ferrand & Bassin Industriel)
  // ==========================================
  {
    id: 'news_ville_crise_laminoir_taret_inquietude',
    category: 'social',
    minTier: 3,
    headline: 'Menace sur le Laminoir Taret : 1 300 emplois industriels dans l’angoisse',
    body: 'Le groupe sidérurgique européen évoque une surcapacité de production. Les syndicats appellent à la mobilisation générale dans toute la vallée.',
    effects: [
      { sector: 'industrie', mult: 0.7, days: 20 },
      { sector: 'commerce', mult: 0.82, days: 15 },
      { sector: 'alimentation', mult: 0.9, days: 15 },
    ],
    reaction: {
      ghost: 'rosa',
      text: 'La mondialisation financière dévore l’appareil productif local dès que le taux de profit baisse d’un demi-point à Wall Street.',
    },
  },
  {
    id: 'news_ville_subvention_reconversion_friche',
    category: 'economie',
    minTier: 3,
    headline: 'L’agglomération vote une enveloppe de 2 millions pour la réhabilitation de la Friche',
    body: 'Des hangars désaffectés vont être transformés en pépinière d’artisans et dépôts partagés. Les loyers de stockage s’annoncent très compétitifs.',
    effects: [
      { sector: 'immobilier', mult: 1.25, days: 24 },
      { sector: 'logistique', mult: 1.3, days: 20 },
      { sector: 'services', mult: 1.2, days: 16 },
    ],
    reaction: {
      ghost: 'keynes',
      text: 'Quand l’investissement privé hésite, la dépense publique doit amorcer la pompe pour réveiller les énergies endormies.',
    },
  },
  {
    id: 'news_ville_panne_serveurs_paiement_cb',
    category: 'tech',
    minTier: 3,
    headline: 'Panne nationale des terminaux de paiement par carte bancaire',
    body: 'Un bug logiciel paralyse les règlements sans contact pendant 48 heures. Seuls les commerces acceptant le liquide et la monnaie locale travaillent normalement.',
    effects: [
      { sector: 'commerce', mult: 0.72, days: 3 },
      { sector: 'tech', mult: 0.65, days: 3 },
    ],
    reaction: {
      ghost: 'hayek',
      text: 'Une infrastructure hyper-centralisée crée des points de défaillance systémiques. La monnaie physique reste la meilleure assurance-vie.',
    },
  },
  {
    id: 'news_ville_succes_cooperative_logistique',
    category: 'social',
    minTier: 3,
    headline: 'Les livreurs à vélo s’organisent en Société Coopérative Ouvrière',
    body: 'Refusant la précarité des plateformes américaines, vingt coursiers de Val-Ferrand lancent leur propre application solidaire avec salaires décents.',
    effects: [
      { sector: 'logistique', mult: 1.35, days: 18 },
      { sector: 'services', mult: 1.2, days: 14 },
    ],
    reaction: {
      ghost: 'marx',
      text: 'Les travailleurs s’approprient leurs outils de production et leur plateforme technique : voilà le début de l’émancipation concrète.',
    },
  },
  {
    id: 'news_ville_hausse_taxe_fonciere_commerces',
    category: 'economie',
    minTier: 3,
    headline: 'Hausse de 6 % de la contribution économique territoriale à Val-Ferrand',
    body: 'Pour combler le déficit municipal, la mairie alourdit la fiscalité locale des locaux professionnels. Les marges nettes des boutiques se contractent.',
    effects: [
      { sector: 'commerce', mult: 0.9, days: 20 },
      { sector: 'immobilier', mult: 0.88, days: 20 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'L’impôt doit être proportionné, prévisible et modéré ; frapper l’activité avant même qu’elle ne dégage un profit décourage l’effort.',
    },
  },
  {
    id: 'news_ville_essor_biere_artisanale_canal',
    category: 'local',
    minTier: 3,
    headline: 'La Brasserie de la Malterie décroche une médaille d’or agricole',
    body: 'La bière au houblon du Taret devient la boisson tendance des bars de l’agglomération. La demande dépasse les capacités actuelles de mise en bouteille.',
    effects: [
      { sector: 'alimentation', mult: 1.45, days: 15 },
      { sector: 'culture', mult: 1.2, days: 10 },
    ],
    reaction: {
      ghost: 'schumpeter',
      text: 'L’artisanat de qualité recrée une prime de monopole temporaire grâce à l’excellence de son procédé et à son authenticité.',
    },
  },
  {
    id: 'news_ville_chantier_voie_verte_canal',
    category: 'local',
    minTier: 3,
    headline: 'Inauguration de la Voie Verte cyclable entre la Cité des Roses et la Friche',
    body: 'Dix kilomètres de piste sécurisée relient désormais les quartiers d’habitation aux zones d’ateliers. Les flux de piétons et de cyclistes doublent.',
    effects: [
      { sector: 'services', mult: 1.3, days: 25 },
      { sector: 'commerce', mult: 1.18, days: 20 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Une infrastructure publique bien pensée régénère les liaisons écologiques et transforme la circulation urbaine sans pollution.',
    },
  },
  {
    id: 'news_ville_controle_urssaf_plateformes',
    category: 'social',
    minTier: 3,
    headline: 'L’URSSAF requalifie en contrat de travail les livreurs d’une fausse franchise',
    body: 'Les autorités traquent le salariat déguisé. Les entreprises qui déclarent honnêtement leurs salariés gagnent en sécurité juridique.',
    effects: [
      { sector: 'services', mult: 0.88, days: 12 },
      { sector: 'logistique', mult: 0.92, days: 10 },
    ],
    reaction: {
      ghost: 'weber',
      text: 'L’État de droit veille à ce que la concurrence déloyale fondée sur la fraude sociale ne détruise pas les entreprises honnêtes.',
    },
  },
  {
    id: 'news_ville_penurie_emballages_carton',
    category: 'economie',
    minTier: 3,
    headline: 'Pénurie de pâte à papier : les cartons de livraison se négocient à prix d’or',
    body: 'Les papeteries européennes réduisent leur production sous le poids des coûts de l’énergie. Les grossistes rationnent les boîtes et cagettes d’expédition.',
    effects: [
      { sector: 'logistique', mult: 0.78, days: 15 },
      { sector: 'commerce', mult: 0.9, days: 10 },
    ],
    reaction: {
      ghost: 'ohno',
      text: 'Réutilisez les contenants ! Jeter un carton après un seul voyage est une absurdité que seule l’illusion de l’abondance a rendue tolérable.',
    },
  },
  {
    id: 'news_ville_salon_habitat_eco_responsable',
    category: 'climat',
    minTier: 3,
    headline: 'Succès populaire au Salon de l’Éco-Habitat au Parc des Expositions',
    body: 'Isolation biosourcée, pompes à chaleur et matériaux de réemploi attirent 15 000 visiteurs. Les artisans du bâtiment garnissent leurs carnets de commandes.',
    effects: [
      { sector: 'immobilier', mult: 1.35, days: 14 },
      { sector: 'services', mult: 1.25, days: 10 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Quand l’économie sert à adapter l’habitat aux exigences thermiques de demain, le profit s’aligne enfin sur l’intérêt des vivants.',
    },
  },

  // ==========================================
  // PALIER 4 : LA VALLÉE (Vallée du Taret & Port de Néo-Baie)
  // ==========================================
  {
    id: 'news_vallee_crue_canal_malterie_peniches',
    category: 'climat',
    minTier: 4,
    headline: 'Crues exceptionnelles : le fret fluvial interrompu sur le canal de la Malterie',
    body: 'Les écluses sont bloquées sous des troncs d’arbres charriés par les pluies. Les marchandises lourdes doivent basculer d’urgence sur la route.',
    effects: [
      { sector: 'logistique', mult: 0.7, days: 12 },
      { sector: 'industrie', mult: 0.85, days: 10 },
    ],
    reaction: {
      ghost: 'ford',
      text: 'La logistique bimodale est obligatoire : un industriel qui dépend d’une seule voie d’eau reste à la merci du moindre orage.',
    },
  },
  {
    id: 'news_vallee_greve_dockers_neo_baie',
    category: 'social',
    minTier: 4,
    headline: 'Les dockers du port de Néo-Baie bloquent les terminaux de conteneurs',
    body: 'Le conflit social paralyse les débarquements de denrées et de matières premières pendant une semaine. Les grossistes régionaux rationnent leurs clients.',
    effects: [
      { sector: 'logistique', mult: 0.6, days: 8 },
      { sector: 'commerce', mult: 0.8, days: 8 },
      { sector: 'alimentation', mult: 0.85, days: 8 },
    ],
    reaction: {
      ghost: 'marx',
      text: 'Le port de Néo-Baie démontre que le commerce mondial repose sur les bras de ceux qui déchargent les cales au vent glacé.',
    },
  },
  {
    id: 'news_vallee_essor_tourisme_vert_plateau',
    category: 'climat',
    minTier: 4,
    headline: 'Le Plateau Blanc labellisé Grand Site Naturel Régional',
    body: 'Les randonneurs affluent vers les fromageries coopératives et les auberges paysannes. Les produits d’alpage s’exportent dans toute la vallée.',
    effects: [
      { sector: 'culture', mult: 1.45, days: 21 },
      { sector: 'alimentation', mult: 1.35, days: 18 },
    ],
    reaction: {
      ghost: 'ostrom',
      text: 'La protection d’un paysage naturel peut générer une prospérité partagée si les habitants gardent la maîtrise de son exploitation.',
    },
  },
  {
    id: 'news_vallee_rachat_plateforme_grossistes_hyperval',
    category: 'economie',
    minTier: 4,
    headline: 'HyperVal rachète le principal grossiste de fruits et légumes de Néo-Baie',
    body: 'Le conglomérat de distribution tente de verrouiller les approvisionnements régionaux pour étouffer les magasins indépendants.',
    effects: [
      { sector: 'logistique', mult: 1.25, days: 15 },
      { sector: 'commerce', mult: 0.8, days: 15 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'Les marchands du même ordre se réunissent rarement, fût-ce pour se divertir, sans que la conversation n’aboutisse à une conspiration contre le public.',
    },
  },
  {
    id: 'news_vallee_penurie_carburant_raffinerie',
    category: 'economie',
    minTier: 4,
    headline: 'Pénurie de carburant : files d’attente géantes aux stations de la Vallée',
    body: 'Un incident technique sur le terminal pétrolier de Néo-Baie bloque les livraisons de diesel. Les tournées de livraison coûtent le double.',
    effects: [
      { sector: 'energie', mult: 1.5, days: 7 },
      { sector: 'logistique', mult: 0.72, days: 7 },
      { sector: 'commerce', mult: 0.85, days: 7 },
    ],
    reaction: {
      ghost: 'hayek',
      text: 'L’illusion d’une énergie bon marché et inépuisable s’effondre. Le rationnement par les prix s’installe brutalement.',
    },
  },
  {
    id: 'news_vallee_succes_franchise_locale_valferrand',
    category: 'economie',
    minTier: 4,
    headline: 'Un réseau de boulangeries coopératives ouvre sa dixième boutique dans la Vallée',
    body: 'La formule qui associe farine locale, salaires équitables et pain au levain gagne les communes voisines avec une rentabilité exemplaire.',
    effects: [
      { sector: 'commerce', mult: 1.35, days: 20 },
      { sector: 'alimentation', mult: 1.25, days: 18 },
    ],
    reaction: {
      ghost: 'schumpeter',
      text: 'La franchise bien calibrée est le véhicule idéal de diffusion d’une innovation organisationnelle à travers tout un territoire.',
    },
  },
  {
    id: 'news_vallee_chute_fret_ferroviaire_sncf',
    category: 'social',
    minTier: 4,
    headline: 'Fermeture de la gare de triage de Val-Ferrand Sud',
    body: 'L’opérateur ferroviaire supprime le trafic de wagons isolés. Les industriels de la vallée doivent louer des flottes de poids lourds polluants.',
    effects: [
      { sector: 'logistique', mult: 0.8, days: 25 },
      { sector: 'industrie', mult: 0.88, days: 20 },
    ],
    reaction: {
      ghost: 'bourdieu',
      text: 'La logique de court terme des gestionnaires technocrates démantèle les infrastructures collectives que plusieurs générations d’ouvriers avaient bâties.',
    },
  },
  {
    id: 'news_vallee_explosion_commandes_en_ligne_locales',
    category: 'tech',
    minTier: 4,
    headline: 'L’application « Terroir Direct Taret » dépasse les 50 000 commandes',
    body: 'Les habitants commandent leurs paniers hebdomadaires directement auprès des coopératives de la vallée, contournant les supermarchés.',
    effects: [
      { sector: 'tech', mult: 1.4, days: 22 },
      { sector: 'alimentation', mult: 1.3, days: 18 },
      { sector: 'commerce', mult: 1.15, days: 15 },
    ],
    reaction: {
      ghost: 'schumpeter',
      text: 'L’effet de réseau joue à plein : plus les producteurs rejoignent la plateforme, plus les consommateurs s’y pressent.',
    },
  },
  {
    id: 'news_vallee_vague_froid_gelees_vergers',
    category: 'climat',
    minTier: 4,
    headline: 'Gelées tardives en avril : 60 % des bourgeons de pommiers détruits',
    body: 'Les vergers de la vallée sont durement touchés. Les prix du jus de pomme artisanal et des compotes vont flamber dès l’automne prochain.',
    effects: [
      { sector: 'alimentation', mult: 0.8, days: 16 },
      { sector: 'commerce', mult: 0.92, days: 12 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'L’instabilité climatique frappe directement le capital naturel. L’économie ne peut pas croître sur une terre dont les saisons déraillent.',
    },
  },
  {
    id: 'news_vallee_accord_salarial_historique_laminoir',
    category: 'social',
    minTier: 4,
    headline: 'Accord d’entreprise au Laminoir : 4,5 % d’augmentation et participation aux bénéfices',
    body: 'Après trois semaines de bras de fer, la direction cède. Le pouvoir d’achat ouvrier repart à la hausse dans toutes les communes du bassin.',
    effects: [
      { sector: 'commerce', mult: 1.25, days: 28 },
      { sector: 'alimentation', mult: 1.2, days: 25 },
      { sector: 'industrie', mult: 1.15, days: 20 },
    ],
    reaction: {
      ghost: 'keynes',
      text: 'Augmenter les salaires populaires soutient la demande globale : cet argent ne dort pas dans des paradis fiscaux, il circule dans les commerces.',
    },
  },

  // ==========================================
  // PALIER 5 : LE PAYS (Échelle Nationale & Grands Marchés)
  // ==========================================
  {
    id: 'news_pays_flambee_taux_directeurs_bce',
    category: 'economie',
    minTier: 5,
    headline: 'La Banque Centrale relève ses taux de 75 points de base',
    body: 'Pour freiner l’inflation, le crédit bancaire devient cher. Les projets d’expansion industrielle et les achats immobiliers subissent un coup de frein brutal.',
    effects: [
      { sector: 'finance', mult: 0.75, days: 30 },
      { sector: 'immobilier', mult: 0.78, days: 30 },
      { sector: 'commerce', mult: 0.88, days: 25 },
    ],
    reaction: {
      ghost: 'hayek',
      text: 'L’argent artificiellement bon marché a nourri des investissements hasardeux. L’ajustement des taux rétablit la réalité économique.',
    },
  },
  {
    id: 'news_pays_hausse_smic_inflation',
    category: 'social',
    minTier: 5,
    headline: 'Revalorisation automatique du SMIC de 3,8 % au 1er janvier',
    body: 'Les coûts salariaux augmentent pour tous les employeurs, mais des millions de salariés modestes récupèrent du pouvoir d’achat pour leur panier de courses.',
    effects: [
      { sector: 'commerce', mult: 1.15, days: 24 },
      { sector: 'alimentation', mult: 1.2, days: 20 },
      { sector: 'services', mult: 0.9, days: 18 },
    ],
    reaction: {
      ghost: 'keynes',
      text: 'La propension marginale à consommer des bas salaires est proche de 100 %. Chaque euro d’augmentation repart instantanément dans la machine.',
    },
  },
  {
    id: 'news_pays_crise_energetique_bouclier_tarifaire',
    category: 'economie',
    minTier: 5,
    headline: 'Explosion des cours du mégawattheure : le gouvernement active le bouclier tarifaire PME',
    body: 'Les usines électro-intensives et les boulangeries artisanales réduisent leurs cadences nocturnes pour éviter des factures quadruplées.',
    effects: [
      { sector: 'energie', mult: 1.45, days: 22 },
      { sector: 'industrie', mult: 0.8, days: 20 },
      { sector: 'alimentation', mult: 0.85, days: 16 },
    ],
    reaction: {
      ghost: 'taylor',
      text: 'La chasse au gaspillage énergétique exige une réorganisation rigoureuse des plages horaires de cuisson et d’usinage.',
    },
  },
  {
    id: 'news_pays_loi_anti_gaspillage_circulaire',
    category: 'climat',
    minTier: 5,
    headline: 'Entrée en vigueur de la loi interdisant la destruction des invendus non alimentaires',
    body: 'Grandes enseignes et fabricants de vêtements doivent donner ou recycler leurs stocks dormants sous peine de lourdes amendes.',
    effects: [
      { sector: 'mode', mult: 1.3, days: 25 },
      { sector: 'logistique', mult: 1.2, days: 20 },
      { sector: 'commerce', mult: 0.92, days: 15 },
    ],
    reaction: {
      ghost: 'ohno',
      text: 'Détruire ce qui a coûté du travail et de la matière première est le symptôme terminal de la surproduction fordiste aveugle.',
    },
  },
  {
    id: 'news_pays_penurie_semi_conducteurs_auto',
    category: 'tech',
    minTier: 5,
    headline: 'Pénurie mondiale de puces électroniques : les lignes de montage de camions à l’arrêt',
    body: 'Les délais de livraison de nouvelles camionnettes passent à neuf mois. Le marché des véhicules utilitaires d’occasion s’envole.',
    effects: [
      { sector: 'tech', mult: 0.7, days: 28 },
      { sector: 'logistique', mult: 0.82, days: 24 },
      { sector: 'industrie', mult: 0.85, days: 20 },
    ],
    reaction: {
      ghost: 'ricardo',
      text: 'Pousser la spécialisation jusqu’à dépendre de trois usines à l’autre bout du globe rend toute l’industrie occidentale vulnérable.',
    },
  },
  {
    id: 'news_pays_offensive_autorite_concurrence_grande_distribution',
    category: 'economie',
    minTier: 5,
    headline: 'L’Autorité de la Concurrence inflige 80 millions d’amende aux centrales d’achat de géants du drive',
    body: 'Les pratiques d’écrasement tarifaire imposées aux petits fournisseurs de terroir sont sanctionnées. Les producteurs reprennent de la marge.',
    effects: [
      { sector: 'commerce', mult: 1.22, days: 25 },
      { sector: 'alimentation', mult: 1.28, days: 20 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'Le rôle essentiel du souverain est d’empêcher les monopoles d’étrangler le libre jeu des petits acteurs indépendants.',
    },
  },
  {
    id: 'news_pays_boom_e_commerce_livraison_express',
    category: 'tech',
    minTier: 5,
    headline: 'Le commerce électronique franchit la barre des 150 milliards d’euros en France',
    body: 'Les entrepôts géants se multiplient le long des autoroutes. La pression sur les chauffeurs et préparateurs de commandes atteint un pic historique.',
    effects: [
      { sector: 'logistique', mult: 1.4, days: 30 },
      { sector: 'tech', mult: 1.35, days: 25 },
      { sector: 'commerce', mult: 0.85, days: 20 },
    ],
    reaction: {
      ghost: 'dejours',
      text: 'La cadence du clic impose une souffrance silencieuse derrière les murs anonymes des hangars logistiques de banlieue.',
    },
  },
  {
    id: 'news_pays_greve_interprofessionnelle_retraites',
    category: 'social',
    minTier: 5,
    headline: 'Journée nationale de grève et manifestations massives dans 250 villes',
    body: 'Transports ferroviaires, raffineries et lycées sont bloqués. La vie économique tourne au ralenti mais les débats citoyens s’animent sur toutes les places.',
    effects: [
      { sector: 'logistique', mult: 0.65, days: 4 },
      { sector: 'industrie', mult: 0.75, days: 4 },
      { sector: 'medias', mult: 1.45, days: 6 },
    ],
    reaction: {
      ghost: 'rosa',
      text: 'La grève de masse n’est pas un simple arrêt de travail : c’est l’étincelle où la classe ouvrière prend conscience de son pouvoir collectif.',
    },
  },
  {
    id: 'news_pays_plan_national_reindustrialisation_verte',
    category: 'economie',
    minTier: 5,
    headline: 'Lancement du plan « France Industrie Verte » : 5 milliards d’aides aux PME',
    body: 'Le plan soutient l’électrification des usines, le recyclage des métaux et la fabrication de vélos et batteries sur le sol national.',
    effects: [
      { sector: 'industrie', mult: 1.35, days: 28 },
      { sector: 'finance', mult: 1.25, days: 24 },
      { sector: 'energie', mult: 1.2, days: 20 },
    ],
    reaction: {
      ghost: 'keynes',
      text: 'C’est par de grands programmes d’État que se réorientent les capitaux vers les besoins cruciaux des cinquante prochaines années.',
    },
  },
  {
    id: 'news_pays_scandale_sanitaire_viande_industrielle',
    category: 'social',
    minTier: 5,
    headline: 'Fraude à la viande avariée : des millions de barquettes rappelées en supermarché',
    body: 'Les consommateurs se détournent massivement des plats préparés industriels pour se ruer vers les boucheries de quartier et artisans de terroir.',
    effects: [
      { sector: 'alimentation', mult: 1.35, days: 20 },
      { sector: 'commerce', mult: 1.15, days: 15 },
    ],
    reaction: {
      ghost: 'bourdieu',
      text: 'Le dégoût de la malbouffe industrielle pousse les classes populaires vers la recherche de dignité alimentaire et de circuits certifiés.',
    },
  },

  // ==========================================
  // PALIER 6 : LE MONDE (Commerce International, Macroéconomie & Conglomérat)
  // ==========================================
  {
    id: 'news_monde_guerre_commerciale_droits_douane_acier',
    category: 'geopolitique',
    minTier: 6,
    headline: 'Guerre douanière : taxe de 25 % sur les importations d’acier et d’aluminium',
    body: 'L’affrontement géopolitique entre blocs économiques renchérit brutalement les matières premières lourdes mais protège les laminoirs européens.',
    effects: [
      { sector: 'industrie', mult: 1.3, days: 30 },
      { sector: 'logistique', mult: 0.8, days: 26 },
      { sector: 'finance', mult: 0.85, days: 20 },
    ],
    reaction: {
      ghost: 'ricardo',
      text: 'Le protectionnisme sauve des emplois locaux à court terme mais rétrécit le volume global du commerce mondial au détriment de l’efficience.',
    },
  },
  {
    id: 'news_monde_blocage_canal_suez_porte_conteneurs',
    category: 'geopolitique',
    minTier: 6,
    headline: 'Un porte-conteneurs géant bloque le canal maritime international',
    body: 'Dix pour cent du commerce mondial se retrouvent à l’arrêt pendant deux semaines. Les taux de fret maritime sont multipliés par trois.',
    effects: [
      { sector: 'logistique', mult: 0.62, days: 15 },
      { sector: 'commerce', mult: 0.78, days: 15 },
      { sector: 'industrie', mult: 0.82, days: 12 },
    ],
    reaction: {
      ghost: 'ohno',
      text: 'Faire naviguer des marchandises sur vingt mille kilomètres pour gagner deux centimes par pièce démontre l’absurdité du gigantisme.',
    },
  },
  {
    id: 'news_monde_choc_petrolier_embargo_golfe',
    category: 'geopolitique',
    minTier: 6,
    headline: 'Tensions géopolitiques majeures : le baril de brut dépasse les 120 dollars',
    body: 'Tous les coûts de transport, de plasturgie et d’engrais s’envolent à travers la planète. Les entreprises locales peu dépendantes des énergies fossiles tirent leur épingle du jeu.',
    effects: [
      { sector: 'energie', mult: 1.5, days: 28 },
      { sector: 'logistique', mult: 0.68, days: 24 },
      { sector: 'industrie', mult: 0.8, days: 20 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Le rappel à l’ordre énergétique est cruel mais inévitable. Ceux qui n’ont pas décarboné leur outil de production seront balayés.',
    },
  },
  {
    id: 'news_monde_effondrement_banque_affaires_internationale',
    category: 'economie',
    minTier: 6,
    headline: 'Faillite d’un géant bancaire de Wall Street : vent de panique sur les marchés mondiaux',
    body: 'Le crédit interbancaire se gèle. Les multinationales suspendent leurs acquisitions et consolident leur trésorerie dans les banques coopératives et étatiques.',
    effects: [
      { sector: 'finance', mult: 0.65, days: 25 },
      { sector: 'immobilier', mult: 0.75, days: 20 },
      { sector: 'commerce', mult: 0.85, days: 18 },
    ],
    reaction: {
      ghost: 'marx',
      text: 'Le capital financier fictif s’évapore en fumée : seule subsiste la valeur réelle créée par le travail humain et les biens tangibles.',
    },
  },
  {
    id: 'news_monde_traite_mondial_taxation_multinationales',
    category: 'economie',
    minTier: 6,
    headline: 'Accord historique de 130 pays : impôt minimal mondial de 15 % sur les bénéfices',
    body: 'La chasse aux paradis fiscaux complique l’optimisation agressive des conglomérats. L’avantage concurrentiel des multinationales s’atténue au profit des acteurs ancrés dans leurs territoires.',
    effects: [
      { sector: 'finance', mult: 0.9, days: 30 },
      { sector: 'commerce', mult: 1.18, days: 25 },
      { sector: 'industrie', mult: 1.15, days: 20 },
    ],
    reaction: {
      ghost: 'weber',
      text: 'La bureaucratie fiscale internationale restaure la légitimité de l’impôt face à la prédation des cartels apatrides.',
    },
  },
  {
    id: 'news_monde_percee_ia_automatisation_tertiaire',
    category: 'tech',
    minTier: 6,
    headline: 'Une avancée majeure en intelligence artificielle automatise la gestion des stocks et de la comptabilité',
    body: 'Les entreprises qui adoptent les nouveaux logiciels réduisent leurs frais généraux de 30 % mais affrontent des questions éthiques sur l’emploi de bureau.',
    effects: [
      { sector: 'tech', mult: 1.45, days: 30 },
      { sector: 'services', mult: 1.25, days: 25 },
      { sector: 'finance', mult: 1.2, days: 20 },
    ],
    reaction: {
      ghost: 'schumpeter',
      text: 'C’est le cœur battant de la destruction créatrice : les vieux métiers comptables s’effacent devant les algorithmes, créant de nouvelles frontières de valeur.',
    },
  },
  {
    id: 'news_monde_accord_climat_taxe_carbone_frontieres',
    category: 'climat',
    minTier: 6,
    headline: 'L’Union Européenne active le mécanisme d’ajustement carbone aux frontières',
    body: 'L’acier, le ciment et les engrais importés sans contraintes environnementales subissent une surtaxe compensatoire. Les usines décarbonées deviennent ultra-rentables.',
    effects: [
      { sector: 'industrie', mult: 1.35, days: 30 },
      { sector: 'energie', mult: 1.2, days: 25 },
      { sector: 'logistique', mult: 0.88, days: 20 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Internaliser les coûts écologiques dans le prix des marchandises importées est la seule manière d’obliger le commerce mondial à respecter le plafond planétaire.',
    },
  },
  {
    id: 'news_monde_krach_crypto_actifs_speculatifs',
    category: 'economie',
    minTier: 6,
    headline: 'Effondrement de 70 % des cryptomonnaies : 1 000 milliards de dollars de pertes',
    body: 'La bulle spéculative éclate. Les investisseurs dégrisés réorientent leurs capitaux vers l’économie réelle, les usines et les commerces de détail solides.',
    effects: [
      { sector: 'finance', mult: 0.7, days: 20 },
      { sector: 'commerce', mult: 1.15, days: 20 },
      { sector: 'immobilier', mult: 1.1, days: 15 },
    ],
    reaction: {
      ghost: 'hayek',
      text: 'Le marché purge impitoyablement les illusions monétaires privées qui n’avaient pour fondement que la cupidité et la crédulité.',
    },
  },
  {
    id: 'news_monde_essor_sud_global_cooperations_sud_sud',
    category: 'geopolitique',
    minTier: 6,
    headline: 'Les pays émergents concluent un mégatraités d’échange en monnaies locales',
    body: 'Le monopole du dollar dans les transactions de matières premières et d’énergie s’effrite. Les conglomérats doivent diversifier leurs devises de facturation.',
    effects: [
      { sector: 'finance', mult: 0.85, days: 28 },
      { sector: 'logistique', mult: 1.15, days: 25 },
      { sector: 'commerce', mult: 1.1, days: 20 },
    ],
    reaction: {
      ghost: 'rosa',
      text: 'L’hégémonie impérialiste des vieilles puissances financières se heurte enfin à la volonté des peuples du Sud de commercer selon leurs propres intérêts.',
    },
  },
  {
    id: 'news_monde_debat_nationalisation_strategique_conglomerats',
    category: 'social',
    minTier: 6,
    headline: 'Débat houleux à l’Assemblée : faut-il encadrer ou nationaliser les méga-conglomérats industriels ?',
    body: 'Face au pouvoir démesuré des conglomérats qui pèsent des milliards et influencent les lois de l’État, les députés exigent la présence obligatoire de salariés et citoyens aux conseils d’administration.',
    effects: [
      { sector: 'finance', mult: 0.8, days: 30 },
      { sector: 'industrie', mult: 1.1, days: 25 },
      { sector: 'medias', mult: 1.4, days: 25 },
    ],
    reaction: {
      ghost: 'ostrom',
      text: 'Un conglomérat devenu trop grand pour échouer doit être gouverné comme un bien commun, avec la participation de ceux dont il affecte l’existence quotidienne.',
    },
  },
  {
    id: 'news_local_festival_cinema_ouvrier',
    category: 'local',
    minTier: 1,
    headline: 'Le cinéma associatif Le Rex projette les archives de Taret-Acier',
    body: 'Les séances font salle comble dans le quartier des Roses. La nostalgie industrielle pousse les familles à se réunir dans les petits commerces voisins.',
    effects: [
      { sector: 'culture', mult: 1.4, days: 5 },
      { sector: 'alimentation', mult: 1.2, days: 5 },
    ],
    reaction: {
      ghost: 'bourdieu',
      text: 'La mémoire ouvrière est un ciment culturel puissant qui rassemble les générations au-delà de la simple consommation marchande.',
    },
  },
  {
    id: 'news_quartier_taxe_plastique_jetable',
    category: 'climat',
    minTier: 2,
    headline: 'Arrêté municipal : les barquettes en plastique jetable surtaxées à Val-Ferrand',
    body: 'Les traiteurs et snacks doivent basculer vers des contenants réutilisables ou consignés. Les clients saluent l’initiative mais les marges sont bousculées.',
    effects: [
      { sector: 'alimentation', mult: 0.92, days: 10 },
      { sector: 'commerce', mult: 1.1, days: 8 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Taxer le déchet à sa source oblige les flux de matières à tourner en boucle fermée plutôt qu’en ligne droite vers la décharge.',
    },
  },
  {
    id: 'news_vallee_coop_agricole_meunerie',
    category: 'economie',
    minTier: 3,
    headline: 'La coopérative céréalière du Taret remet en service l’ancien moulin à eau',
    body: 'Une farine biologique moulue à la meule de pierre approvisionne désormais les boulangeries de la vallée à prix stable garanti sur l’année.',
    effects: [
      { sector: 'alimentation', mult: 1.3, days: 20 },
      { sector: 'industrie', mult: 1.15, days: 15 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'La proximité du meunier et du boulanger élimine les intermédiaires superflus et rétablit une juste réciprocité de voisinage.',
    },
  },
  {
    id: 'news_pays_loi_transparence_algorithmes',
    category: 'tech',
    minTier: 5,
    headline: 'Loi Transparence : les plateformes de livraison forcées d’ouvrir leurs algorithmes',
    body: 'Le Parlement exige que le calcul des courses et des primes soit lisible pour tous les travailleurs indépendants. Les commissions des plateformes reculent.',
    effects: [
      { sector: 'tech', mult: 0.88, days: 25 },
      { sector: 'logistique', mult: 1.22, days: 20 },
    ],
    reaction: {
      ghost: 'weber',
      text: 'Quand le pouvoir arbitraire d’un code privé s’impose à des milliers de vies, seule la délibération démocratique peut rétablir l’ordre juste.',
    },
  },
  {
    id: 'news_monde_sommet_matieres_premieres_circulaires',
    category: 'geopolitique',
    minTier: 6,
    headline: 'Sommet mondial de Genève : l’acier recyclé classé matière stratégique prioritaire',
    body: 'Face à la raréfaction du minerai de fer pur, les hauts-fourneaux électriques et laminoirs de recyclage reçoivent des commandes records de tous les continents.',
    effects: [
      { sector: 'industrie', mult: 1.45, days: 30 },
      { sector: 'finance', mult: 1.2, days: 25 },
    ],
    reaction: {
      ghost: 'schumpeter',
      text: 'La véritable industrie du XXIe siècle ne creuse plus la terre : elle réutilise le métal usé avec une technologie de rupture.',
    },
  },
];
