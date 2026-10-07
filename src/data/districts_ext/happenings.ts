/**
 * NEURAPOLIS — Fil d'actualités des 9 quartiers d'extension (Workflow AG-3 Phase 2)
 *
 * Quarante-cinq événements uniques (exactement 5 pour chacun des 9 quartiers),
 * ancrés dans la vie quotidienne, l'histoire ouvrière et les tensions économiques
 * de Val-Ferrand.
 *
 * Invariants stricts :
 * - Données pures typées et déterministes (zéro Math.random, zéro Date.now).
 * - Identifiants uniques au format snake_case sans accent.
 * - Multiplicateurs de demande strictement compris entre 0.6 et 1.5.
 * - Durées en jours entières comprises entre 2 et 30.
 * - Réactions de fantômes canoniques issues du panthéon de l'Ascension.
 * - Neutralité de genre absolue : aucun vocatif genré adressé au joueur.
 */

import type { Sector } from '../../core/happenings_types';
import type { ResidentDistrict } from '../residents/residents';

export interface DistrictHappening {
  /** Identifiant unique en snake_case sans accent. */
  id: string;
  /** Quartier impacté parmi les 9 districts d'extension. */
  district: ResidentDistrict;
  /** Palier minimum d'Ascension requis pour déclencher l'événement (2 à 6). */
  minTier: 2 | 3 | 4 | 5 | 6;
  /** Titre diégétique et percutant de la dépêche. */
  headline: string;
  /** Corps de l'article détaillant l'impact sur la vie locale et l'économie. */
  body: string;
  /** Impacts sectoriels mesurés avec multiplicateur borné et durée en jours. */
  effects: { sector: Sector; mult: number; days: number }[];
  /** Réaction philosophique et doctrinale d'un fantôme de l'Ascension. */
  reaction: { ghost: string; text: string };
}

export const DISTRICT_HAPPENINGS: readonly DistrictHappening[] = [
  // =========================================================================
  // 1. GARE EST (gare_est) — Le carrefour du rail et du triage ouvrier
  // =========================================================================
  {
    id: 'happening_gare_est_retard_fret_charbon',
    district: 'gare_est',
    minTier: 2,
    headline: 'Aiguillage gelé en gare de triage : trois trains de fret bloqués sur l’axe Est',
    body: 'Un incident technique paralyse le triage ferroviaire à l’entrée de la gare. Les cargaisons de minerai et de pièces de fonderie accumulent quarante-huit heures de retard, contraignant les ateliers à ralentir leurs cadences et dynamisant les bistrots de quai.',
    effects: [
      { sector: 'logistique', mult: 0.75, days: 5 },
      { sector: 'commerce', mult: 1.25, days: 4 },
    ],
    reaction: {
      ghost: 'ohno',
      text: 'Quand le flux tendu rencontre un aiguillage grippé, toute la chaîne s’effondre. Le stock tampon n’est pas un luxe, c’est une assurance-vie.',
    },
  },
  {
    id: 'happening_gare_est_marche_nocturne_parvis',
    district: 'gare_est',
    minTier: 2,
    headline: 'Bourse d’échange improvisée sur le parvis : les navetteurs bousculent les commerces',
    body: 'Face aux retards répétés des TER de fin de journée, un marché spontané d’échange de livres, de conserves artisanales et de pièces mécaniques s’est installé devant la marquise en fonte, stimulant le commerce informel et la papeterie locale.',
    effects: [
      { sector: 'commerce', mult: 1.3, days: 6 },
      { sector: 'culture', mult: 1.2, days: 7 },
    ],
    reaction: {
      ghost: 'polanyi',
      text: 'L’échange marchand se ré-encastre spontanément dans la sociabilité dès que les institutions défaillent. La place redevient une communauté.',
    },
  },
  {
    id: 'happening_gare_est_greve_controleurs_ter',
    district: 'gare_est',
    minTier: 3,
    headline: 'Préavis de grève des contrôleurs : affluence record au Relais des Quais',
    body: 'Le syndicat des cheminots débraye pour exiger des embauches aux guichets de nuit. Les voyageurs en transit restent bloqués plusieurs heures en salle des pas perdus, provoquant une envolée des ventes de café, de casse-croûtes et de journaux.',
    effects: [
      { sector: 'alimentation', mult: 1.4, days: 6 },
      { sector: 'logistique', mult: 0.65, days: 6 },
    ],
    reaction: {
      ghost: 'marx',
      text: 'Sans le travail vivant des cheminots, les machines de fer sont immobiles. Le capital découvre brutalement qui produit la valeur de circulation.',
    },
  },
  {
    id: 'happening_gare_est_rehabilitation_halles_fret',
    district: 'gare_est',
    minTier: 3,
    headline: 'Modernisation des anciennes halles messageries : spéculation sur les baux',
    body: 'La communauté urbaine lance les appels d’offres pour réhabiliter trois mille mètres carrés de docks ferroviaires en ateliers d’artisans. Les loyers des arcades environnantes flambent immédiatement de 20 %.',
    effects: [
      { sector: 'immobilier', mult: 1.35, days: 14 },
      { sector: 'services', mult: 1.15, days: 10 },
    ],
    reaction: {
      ghost: 'ricardo',
      text: 'La rente foncière s’élève à la simple perspective d’un aménagement public. Le propriétaire récolte ce que la collectivité sème.',
    },
  },
  {
    id: 'happening_gare_est_navette_autonome_test',
    district: 'gare_est',
    minTier: 4,
    headline: 'Expérimentation d’une navette robotisée vers les fonderies : grogne des chauffeurs',
    body: 'Un consortium régional déploie une navette sans chauffeur entre la gare Est et les fonderies du Taret. Le saut technologique divise les usagers entre admiration pour l’innovation et solidarité avec les chauffeurs de bus.',
    effects: [
      { sector: 'tech', mult: 1.4, days: 12 },
      { sector: 'services', mult: 0.8, days: 8 },
    ],
    reaction: {
      ghost: 'schumpeter',
      text: 'La destruction créatrice en plein mouvement : l’ancien mode de transport vacille devant l’innovation, ouvrant de nouvelles opportunités de profit.',
    },
  },

  // =========================================================================
  // 2. ZONE HYPERVAL (hyperval) — La forteresse logistique et les cadences froides
  // =========================================================================
  {
    id: 'happening_hyperval_panne_serveurs_drive',
    district: 'hyperval',
    minTier: 2,
    headline: 'Bug massif des serveurs du Drive HyperVal : les clients refluent vers les épiceries',
    body: 'Une panne informatique générale bloque les bornes de retrait et le système de scan automatisé de la grande plateforme. Incapables de récupérer leurs commandes, des centaines de foyers se rabattent sur les commerces de quartier.',
    effects: [
      { sector: 'commerce', mult: 1.45, days: 4 },
      { sector: 'tech', mult: 0.7, days: 4 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'Quand le géant trébuche, la concurrence atomisée reprend ses droits. La main invisible préfère mille boutiques agiles à un colosse paralysé.',
    },
  },
  {
    id: 'happening_hyperval_cadences_debrayage_quais',
    district: 'hyperval',
    minTier: 2,
    headline: 'Débrayage spontané sur les quais logistiques : les semi-remorques à l’arrêt',
    body: 'Les caristes et préparateurs de commandes cessent le travail deux heures par vacation pour dénoncer le durcissement des quotas de colis au casque vocal. Les livraisons régionales accusent un sévère coup de frein.',
    effects: [
      { sector: 'logistique', mult: 0.7, days: 5 },
      { sector: 'alimentation', mult: 0.85, days: 5 },
    ],
    reaction: {
      ghost: 'dejours',
      text: 'Le corps finit toujours par dire non quand l’organisation nie la souffrance mentale. Le chronomètre ne remplace pas le respect du travail réel.',
    },
  },
  {
    id: 'happening_hyperval_braderie_invendus_textile',
    district: 'hyperval',
    minTier: 3,
    headline: 'Ouverture exceptionnelle d’un hangar de déstockage : ruée sur les fins de séries',
    body: 'HyperVal liquide les stocks textiles d’une grande enseigne en faillite avec des rabais atteignant 70 %. Une marée de consommateurs envahit le boulevard Taret, vidant les rayons en quelques heures.',
    effects: [
      { sector: 'mode', mult: 1.4, days: 7 },
      { sector: 'commerce', mult: 1.25, days: 5 },
    ],
    reaction: {
      ghost: 'hayek',
      text: 'Le signal-prix fonctionne avec une efficacité redoutable : baissez le prix relatif, et la demande absorbe instantanément les surplus accumulés.',
    },
  },
  {
    id: 'happening_hyperval_nouveaux_algorithmes_routage',
    district: 'hyperval',
    minTier: 4,
    headline: 'HyperVal déploie une IA prédictive pour tracer chaque seconde des livreurs',
    body: 'La direction inaugure un logiciel d’optimisation dynamique des trajets et de surveillance biométrique des temps de pause. Les syndicats dénoncent un flicage intolérable pendant que les investisseurs saluent des gains de marge.',
    effects: [
      { sector: 'tech', mult: 1.35, days: 10 },
      { sector: 'services', mult: 0.75, days: 7 },
    ],
    reaction: {
      ghost: 'zuboff',
      text: 'L’extraction de données comportementales ne tolère aucun recoin d’intimité. Le travailleur est dépouillé de son rythme propre au profit d’un modèle prédictif.',
    },
  },
  {
    id: 'happening_hyperval_monopole_centrale_achat',
    district: 'hyperval',
    minTier: 5,
    headline: 'Enquête de la répression des fraudes sur les marges arrières d’HyperVal',
    body: 'Des perquisitions sont menées dans les bureaux de la centrale d’achat pour abus de position dominante envers les maraîchers et PME de la vallée. L’enseigne suspend temporairement ses remises agressives.',
    effects: [
      { sector: 'finance', mult: 0.8, days: 14 },
      { sector: 'commerce', mult: 1.2, days: 12 },
    ],
    reaction: {
      ghost: 'graeber',
      text: 'Des armées de juristes et de contrôleurs pour négocier des centimes sur le dos des producteurs : voilà la quintessence de la bureaucratie marchande.',
    },
  },

  // =========================================================================
  // 3. BASSIN INDUSTRIEL (industrie) — L'antre des fondeurs et des machines lourdes
  // =========================================================================
  {
    id: 'happening_industrie_surpression_haut_fourneau',
    district: 'industrie',
    minTier: 3,
    headline: 'Alerte de sécurité au laminoir : interruption des coulées d’acier pendant dix jours',
    body: 'Une fissure sur le circuit de refroidissement de la coulée continue force l’arrêt d’urgence des installations métallurgiques. La demande en pièces de rechange et maintenance industrielle explose tandis que l’offre d’acier se tarit.',
    effects: [
      { sector: 'industrie', mult: 0.65, days: 10 },
      { sector: 'services', mult: 1.35, days: 8 },
    ],
    reaction: {
      ghost: 'ford',
      text: 'Quand la chaîne principale s’arrête, le coût fixe tourne à vide. La régularité de la machine est la condition sine qua non de la rentabilité.',
    },
  },
  {
    id: 'happening_industrie_reconversion_forge_verte',
    district: 'industrie',
    minTier: 3,
    headline: 'Inauguration de l’atelier de métallerie solaire : l’acier recyclé séduit la région',
    body: 'Un collectif d’anciens ouvriers et de jeunes ingénieurs lance un four à arc électrique alimenté en énergie renouvelable pour refondre les rebuts de cuivre et d’aluminium. Les commandes affluent de tout le département.',
    effects: [
      { sector: 'industrie', mult: 1.35, days: 15 },
      { sector: 'energie', mult: 1.3, days: 12 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Boucler le cycle des matières sans dévorer la planète : voilà l’économie régénérative à l’œuvre, ancrée dans les besoins réels du territoire.',
    },
  },
  {
    id: 'happening_industrie_hausse_cours_manganese',
    district: 'industrie',
    minTier: 4,
    headline: 'Flambée mondiale du cours des métaux spéciaux : les ateliers sous tension',
    body: 'Les tensions géopolitiques font bondir le prix du manganèse et du nickel de 40 %. Les ateliers mécaniques de la rue de la Coulée doivent réviser leurs devis d’urgence ou rogner drastiquement sur leurs marges.',
    effects: [
      { sector: 'finance', mult: 1.25, days: 14 },
      { sector: 'industrie', mult: 0.8, days: 14 },
    ],
    reaction: {
      ghost: 'ricardo',
      text: 'La loi des rendements décroissants et la rareté géologique s’imposent aux hommes. Le prix s’ajuste à la ressource la plus difficile à extraire.',
    },
  },
  {
    id: 'happening_industrie_audit_pollution_sols',
    district: 'industrie',
    minTier: 5,
    headline: 'Rapport alarmant sur les métaux lourds : chantiers d’usines mis sous tutelle',
    body: 'Une expertise indépendante révèle des taux anormaux d’hydrocarbures et de plomb près des anciens crassiers. Les permis de construire sont gelés le temps des analyses, freinant l’immobilier d’entreprise.',
    effects: [
      { sector: 'immobilier', mult: 0.7, days: 21 },
      { sector: 'services', mult: 1.25, days: 18 },
    ],
    reaction: {
      ghost: 'ostrom',
      text: 'La terre et l’eau sont des biens communs que l’industrie a dégradés sans rendre de comptes. Sans gestion communautaire responsable, la tragédie guette.',
    },
  },
  {
    id: 'happening_industrie_commande_militaire_blindage',
    district: 'industrie',
    minTier: 5,
    headline: 'Important contrat ferroviaire et blindé pour la fonderie : embauches massives',
    body: 'L’État notifie une commande pluriannuelle d’essieux forgés et de structures renforcées. Le bassin industriel renoue avec les heures supplémentaires et un afflux de jeunes apprentis.',
    effects: [
      { sector: 'industrie', mult: 1.45, days: 28 },
      { sector: 'commerce', mult: 1.2, days: 20 },
    ],
    reaction: {
      ghost: 'keynes',
      text: 'La commande publique ranime l’activité là où le marché hésitait. L’effet multiplicateur d’un franc investi par l’État irrigue toute l’économie locale.',
    },
  },

  // =========================================================================
  // 4. LES HAUTS DU TARET (collines) — Le belvédère feutré et les coteaux
  // =========================================================================
  {
    id: 'happening_collines_gel_printanier_vergers',
    district: 'collines',
    minTier: 3,
    headline: 'Nuit polaire sur les hauteurs : le gel détruit la moitié des fleurs de pommiers',
    body: 'Une vague de gel tardif frappe les vergers des coteaux du Taret. Les arboriculteurs tentent de sauver les récoltes avec des braseros, mais la pénurie future de fruits locaux fait déjà grimper les cours.',
    effects: [
      { sector: 'alimentation', mult: 0.75, days: 12 },
      { sector: 'commerce', mult: 1.15, days: 8 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'La rareté immédiate tire les prix vers le haut. Le marché s’ajuste implacablement aux aléas de la nature sans égard pour les prévisions.',
    },
  },
  {
    id: 'happening_collines_villa_ecologique_prix_archi',
    district: 'collines',
    minTier: 4,
    headline: 'Une résidence bioclimatique primée : vague d’investisseurs sur les hauteurs',
    body: 'L’éco-demeure construite sur les coteaux par Hugo de La Tour reçoit un prix d’architecture national. Des acquéreurs fortunés de la métropole prospectent pour acquérir des parcelles sur les hauteurs.',
    effects: [
      { sector: 'immobilier', mult: 1.45, days: 16 },
      { sector: 'services', mult: 1.2, days: 10 },
    ],
    reaction: {
      ghost: 'weber',
      text: 'L’architecture d’avant-garde est le signe distinctif du prestige moderne. On n’achète pas seulement des murs, on matérialise son statut dans la hiérarchie sociale.',
    },
  },
  {
    id: 'happening_collines_panne_relais_antenne_4g',
    district: 'collines',
    minTier: 4,
    headline: 'Foudre sur le pylône des crêtes : blackout numérique partiel sur les coteaux',
    body: 'Un violent orage met hors service l’émetteur principal des collines. Privés de haut débit et de téléconsultation, les résidents se déplacent physiquement en ville pour effectuer leurs démarches.',
    effects: [
      { sector: 'tech', mult: 0.7, days: 6 },
      { sector: 'services', mult: 1.25, days: 5 },
    ],
    reaction: {
      ghost: 'zuboff',
      text: 'Quand le réseau numérique s’éteint, l’extraction des données comportementales s’interrompt et la vie locale retrouve brièvement son autonomie.',
    },
  },
  {
    id: 'happening_collines_foire_miel_plantes_aromatiques',
    district: 'collines',
    minTier: 5,
    headline: 'Succès éclatant de la foire aux miels et tisanes des crêtes : afflux touristique',
    body: 'Les apiculteurs et herboristes des coteaux organisent leur marché annuel sous les marronniers du belvédère. Plus de trois mille visiteurs se pressent pour déguster les récoltes de montagne.',
    effects: [
      { sector: 'alimentation', mult: 1.35, days: 7 },
      { sector: 'culture', mult: 1.3, days: 6 },
    ],
    reaction: {
      ghost: 'polanyi',
      text: 'La valorisation des terroirs prouve que l’attachement au lieu prime sur la standardisation marchande. Le goût local résiste au rouleau compresseur.',
    },
  },
  {
    id: 'happening_collines_fermeture_route_plateau_eboulement',
    district: 'collines',
    minTier: 6,
    headline: 'Éboulement rocheux sur la route de Néo-Baie : le belvédère temporairement isolé',
    body: 'Des pluies torrentielles provoquent une coulée de boue coupant l’accès direct vers le littoral. Les trajets sont déviés par la vallée, allongeant considérablement les temps de livraison des grossistes.',
    effects: [
      { sector: 'logistique', mult: 0.75, days: 14 },
      { sector: 'commerce', mult: 0.85, days: 10 },
    ],
    reaction: {
      ghost: 'hayek',
      text: 'Toute perturbation des voies physiques de communication désorganise les plans individuels et exige une réallocation immédiate des ressources.',
    },
  },

  // =========================================================================
  // 5. BERGES DE LA MALTERIE (berges) — Le canal, les péniches et la mémoire de l'eau
  // =========================================================================
  {
    id: 'happening_berges_fete_ecluse_guinguette',
    district: 'berges',
    minTier: 4,
    headline: 'Grand bal musette et championnat de belote à l’écluse : foule festive sur les quais',
    body: 'Paulo Ferreira fête l’anniversaire de sa guinguette avec orchestre accordéon et buvettes au bord de l’eau. Les familles et ouvriers du quartier y dépensent généreusement leurs étrennes.',
    effects: [
      { sector: 'culture', mult: 1.45, days: 5 },
      { sector: 'alimentation', mult: 1.35, days: 5 },
    ],
    reaction: {
      ghost: 'polanyi',
      text: 'La culture populaire réaffirme ses rites de convivialité. C’est dans ces fêtes partagées que se resserre le lien social entre les habitants.',
    },
  },
  {
    id: 'happening_berges_crue_saisonniere_canal',
    district: 'berges',
    minTier: 4,
    headline: 'Montée des eaux du Taret : le chemin de halage submergé sur deux kilomètres',
    body: 'Après des pluies continues sur les massifs amont, le canal déborde sur les berges basses. Les loueurs de cycles et terrasses de péniches doivent évacuer leur matériel en catastrophe.',
    effects: [
      { sector: 'services', mult: 0.7, days: 6 },
      { sector: 'commerce', mult: 0.85, days: 5 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'La nature rappelle ses limites physiques aux aménageurs imprudents. Respecter le lit des cours d’eau coûte moins cher que d’éponger leurs crues.',
    },
  },
  {
    id: 'happening_berges_peniche_bio_cooperative',
    district: 'berges',
    minTier: 4,
    headline: 'Arrivée d’un convoi fluvial de farines artisanales : approvisionnement doux réussi',
    body: 'Une péniche chargée de trente tonnes de céréales bio cultivées en amont accoste quai de la Malterie. Déchargée sans camion grâce aux brouettes citoyennes, la cargaison alimente les fournils à bas coût.',
    effects: [
      { sector: 'alimentation', mult: 1.3, days: 8 },
      { sector: 'logistique', mult: 1.25, days: 8 },
    ],
    reaction: {
      ghost: 'ostrom',
      text: 'La logistique coopérative et fluviale : une réponse sobre et collective à la tyrannie du transport routier polluant.',
    },
  },
  {
    id: 'happening_berges_brouillage_ondes_radio_pirate',
    district: 'berges',
    minTier: 4,
    headline: 'Brouillage mystérieux des fréquences sur les quais : Radio Taret coupée',
    body: 'Des interférences électromagnétiques puissantes perturbent la station locale associative et les liaisons VHF des bateliers. Les riverains s’indignent de cette attaque contre l’information libre.',
    effects: [
      { sector: 'medias', mult: 0.7, days: 7 },
      { sector: 'tech', mult: 1.2, days: 5 },
    ],
    reaction: {
      ghost: 'graeber',
      text: 'La première tentation du pouvoir face à la parole autonome est toujours de brouiller le signal. Le contrôle de l’espace hertzien est une guerre politique.',
    },
  },
  {
    id: 'happening_berges_projet_marina_luxe_refus',
    district: 'berges',
    minTier: 4,
    headline: 'La mairie rejette le projet d’amarrage privé : victoire des péniches associatives',
    body: 'Après trois mois de mobilisation des pêcheurs et maraîchers, le conseil municipal enterre le projet de marina pour yachts électriques, garantissant le maintien des tarifs d’amarrage populaires.',
    effects: [
      { sector: 'immobilier', mult: 0.85, days: 12 },
      { sector: 'culture', mult: 1.25, days: 10 },
    ],
    reaction: {
      ghost: 'marx',
      text: 'La résistance collective a fait reculer la privatisation de l’espace public. Quand les usagers s’unissent, la rente recule devant le bien commun.',
    },
  },

  // =========================================================================
  // 6. LE FAUBOURG SAINT-ÉLOI (faubourg) — L'artère commerçante et ses ateliers
  // =========================================================================
  {
    id: 'happening_faubourg_chantier_voie_tramway',
    district: 'faubourg',
    minTier: 4,
    headline: 'Percée de la plateforme du futur tramway : tranchée ouverte sur l’avenue',
    body: 'Les travaux de pose des rails de la ligne 2 coupent l’accès aux trottoirs commerçants pendant trois semaines. Les vitrines de mode et les papeteries enregistrent une chute brutale de fréquentation.',
    effects: [
      { sector: 'commerce', mult: 0.7, days: 18 },
      { sector: 'mode', mult: 0.75, days: 15 },
    ],
    reaction: {
      ghost: 'keynes',
      text: 'Les travaux d’infrastructure créent des désagréments à court terme pour engendrer une prospérité décuplée à long terme. Patience civique !',
    },
  },
  {
    id: 'happening_faubourg_festival_vitrines_vintage',
    district: 'faubourg',
    minTier: 4,
    headline: 'Nocturne des artisans et friperies du Faubourg : ruée des chineurs de la région',
    body: 'Nadia Haddad et le collectif des commerçants illuminent les boutiques de vêtements rétro et ateliers de retouche jusqu’à minuit. La clientèle branchée afflue, dévalisant les portants.',
    effects: [
      { sector: 'mode', mult: 1.45, days: 6 },
      { sector: 'commerce', mult: 1.3, days: 5 },
    ],
    reaction: {
      ghost: 'schumpeter',
      text: 'Recycler le vieux pour en faire du branché : l’innovation de style réinvente la valeur sans créer de matière neuve. Du génie marchand !',
    },
  },
  {
    id: 'happening_faubourg_panne_gaz_boulangeries',
    district: 'faubourg',
    minTier: 4,
    headline: 'Coupure de gaz inopinée dans l’artère centrale : les fours à pain à l’arrêt forcé',
    body: 'Une rupture de canalisation lors des terrassements prive tout le secteur d’énergie gazière pendant quarante-huit heures. Les pâtisseries et snacks ferment leurs cuisines, jetant leurs pâtes.',
    effects: [
      { sector: 'alimentation', mult: 0.65, days: 4 },
      { sector: 'energie', mult: 0.7, days: 4 },
    ],
    reaction: {
      ghost: 'taylor',
      text: 'Une seule défaillance dans les utilités de base paralyse l’ensemble du rendement. La maintenance préventive des réseaux est le socle de toute efficacité.',
    },
  },
  {
    id: 'happening_faubourg_lutte_anti_guerre_prix_epiceries',
    district: 'faubourg',
    minTier: 4,
    headline: 'Pacte de non-agression tarifaire entre épiciers de nuit : entente locale',
    body: 'Face aux guerres de prix ruineuses sur les sodas et boîtes de conserve, les six petits épiciers du faubourg s’accordent sur une grille de prix plancher pour préserver leurs marges de survie.',
    effects: [
      { sector: 'commerce', mult: 1.25, days: 10 },
      { sector: 'alimentation', mult: 1.15, days: 10 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'Les gens du même métier se réunissent rarement sans que la conversation n’aboutisse à une conspiration contre le public ou à une hausse des prix !',
    },
  },
  {
    id: 'happening_faubourg_succes_atelier_reparation_high_tech',
    district: 'faubourg',
    minTier: 5,
    headline: 'Explosion des demandes chez Répar’Tout : les habitants boudent le neuf jetable',
    body: 'L’atelier de Kofi Mensah croule sous les smartphones, fers à repasser et téléviseurs à réparer. Le délai d’attente passe à trois semaines, illustrant le retour en force de l’économie circulaire.',
    effects: [
      { sector: 'services', mult: 1.4, days: 14 },
      { sector: 'tech', mult: 1.25, days: 12 },
    ],
    reaction: {
      ghost: 'dejours',
      text: 'La fierté de réparer ce qui est brisé restaure le sens du métier. L’artisanat de précision redonne au travailleur sa dignité d’auteur.',
    },
  },

  // =========================================================================
  // 7. GRAND ENSEMBLE DES ROSES SUD (grand_ensemble) — Les barres solidaires
  // =========================================================================
  {
    id: 'happening_grand_ensemble_panne_ascenseurs_barre_d',
    district: 'grand_ensemble',
    minTier: 5,
    headline: 'Trois tours sans ascenseur depuis cinq jours : mobilisation d’entraide solidaire',
    body: 'Une rupture de câbles immobilise les monte-charges de la barre des Écluses. Les jeunes du quartier organisent une chaîne humaine de portage de sacs de courses et médicaments jusqu’au quinzième étage.',
    effects: [
      { sector: 'services', mult: 1.35, days: 7 },
      { sector: 'logistique', mult: 1.2, days: 6 },
    ],
    reaction: {
      ghost: 'ostrom',
      text: 'Là où le bailleur démissionne, la communauté auto-organise ses propres services. Le capital social de proximité comble les faillites institutionnelles.',
    },
  },
  {
    id: 'happening_grand_ensemble_inauguration_tiers_lieu_sante',
    district: 'grand_ensemble',
    minTier: 5,
    headline: 'Ouverture du dispensaire participatif des Roses : consultations à prix libre',
    body: 'Porté par Nora Martin et un groupe d’infirmières bénévoles, un local associatif accueille les habitants pour des soins de base et du soutien psychologique, réduisant les tensions hospitalières.',
    effects: [
      { sector: 'services', mult: 1.3, days: 12 },
      { sector: 'alimentation', mult: 1.1, days: 8 },
    ],
    reaction: {
      ghost: 'dejours',
      text: 'Préserver la santé physique et mentale des soignants et des soignés est la condition préalable de toute société vivable. Le soin n’est pas une marchandise.',
    },
  },
  {
    id: 'happening_grand_ensemble_tournoi_foot_inter_quartiers',
    district: 'grand_ensemble',
    minTier: 5,
    headline: 'Tournoi des Cités sur le terrain synthétique : affluence festive et buvettes pleines',
    body: 'Seize équipes de jeunes s’affrontent sous les encouragements de tout le quartier. Les buvettes associatives et marchands ambulants de crêpes et boissons tournent à plein régime tout le week-end.',
    effects: [
      { sector: 'alimentation', mult: 1.4, days: 5 },
      { sector: 'culture', mult: 1.35, days: 4 },
    ],
    reaction: {
      ghost: 'graeber',
      text: 'Le sport collectif gratuit est un creuset d’intégration et de joie populaire. L’émulation fraternelle y produit une richesse humaine bien supérieure aux fictions bureaucratiques.',
    },
  },
  {
    id: 'happening_grand_ensemble_renovation_thermique_facades',
    district: 'grand_ensemble',
    minTier: 5,
    headline: 'Pose des échafaudages pour l’isolation extérieure : chantiers dans les barres',
    body: 'Le plan de rénovation énergétique des barres HLM démarre enfin. Les marteaux-piqueurs et bâches occultent les fenêtres, perturbant la tranquillité mais stimulant l’emploi des artisans locaux.',
    effects: [
      { sector: 'immobilier', mult: 1.3, days: 20 },
      { sector: 'services', mult: 1.15, days: 15 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Isoler les passoires thermiques, c’est respecter le plafond écologique tout en assurant le plancher social des plus modestes. Double dividende !',
    },
  },
  {
    id: 'happening_grand_ensemble_borne_recharge_solaire_partagee',
    district: 'grand_ensemble',
    minTier: 5,
    headline: 'Mise en service d’une station solaire citoyenne pour vélos-cargos et scooters',
    body: 'L’amicale des locataires installe quarante panneaux photovoltaïques en toiture pour alimenter les triporteurs des coursiers. La facture électrique du collectif baisse de 30 %.',
    effects: [
      { sector: 'energie', mult: 1.4, days: 15 },
      { sector: 'tech', mult: 1.25, days: 12 },
    ],
    reaction: {
      ghost: 'polanyi',
      text: 'L’appropriation citoyenne de l’énergie soustrait un besoin vital aux spéculations de marché. La démocratie commence à la prise de courant.',
    },
  },

  // =========================================================================
  // 8. FRICHE TARET SUD (friche_sud) — Les cathédrales d'acier reconquises
  // =========================================================================
  {
    id: 'happening_friche_sud_decouverte_metaux_caches',
    district: 'friche_sud',
    minTier: 5,
    headline: 'Trésor sous les gravats : dix tonnes de câbles de cuivre exhumées d’un laminoir',
    body: 'Lors du déblaiement d’une travée écroulée, des artisans récupérateurs mettent au jour un stock de bobines de cuivre oublié depuis 2014. La vente aux fonderies locales injecte une manne financière inattendue.',
    effects: [
      { sector: 'industrie', mult: 1.35, days: 8 },
      { sector: 'finance', mult: 1.2, days: 6 },
    ],
    reaction: {
      ghost: 'ricardo',
      text: 'Une ressource dormante réintroduite sur le marché fait temporairement baisser le coût marginal de production. Mais la rente de découverte s’épuise vite.',
    },
  },
  {
    id: 'happening_friche_sud_intervention_police_rave_sauvage',
    district: 'friche_sud',
    minTier: 5,
    headline: 'Fête clandestine dans la nef des hauts-fourneaux : fermeture temporaire des accès',
    body: 'Un rassemblement de deux mille danseurs dans la cathédrale d’acier désaffectée provoque des tensions avec la préfecture. Les patrouilles bouclent le périmètre, gelant les ateliers créatifs.',
    effects: [
      { sector: 'culture', mult: 0.7, days: 7 },
      { sector: 'services', mult: 0.8, days: 5 },
    ],
    reaction: {
      ghost: 'weber',
      text: 'L’effervescence dionysiaque heurte de plein fouet l’ordre bureaucratique et policier. L’autorité légale-rationnelle rétablit ses bornes par la contrainte.',
    },
  },
  {
    id: 'happening_friche_sud_cooperative_reparation_cycles',
    district: 'friche_sud',
    minTier: 5,
    headline: 'Karim et ses compagnons doublent la capacité de leur atelier d’auto-réparation',
    body: 'Grâce à la récupération d’outillage lourd et à des baux précaires accordés par la ville, l’atelier solidaire remet en circulation deux cents vélos par mois, dopant les mobilités douces.',
    effects: [
      { sector: 'services', mult: 1.4, days: 14 },
      { sector: 'logistique', mult: 1.2, days: 12 },
    ],
    reaction: {
      ghost: 'ostrom',
      text: 'Des outils partagés gérés par leurs usagers : l’exemple parfait d’un commun productif qui échappe tant à l’État qu’à la spéculation privée.',
    },
  },
  {
    id: 'happening_friche_sud_vente_encheres_machines_vintage',
    district: 'friche_sud',
    minTier: 5,
    headline: 'Vente aux enchères de tours et fraiseuses historiques : duel d’acheteurs',
    body: 'Le liquidateur judiciaire met en vente les dernières machines manuelles de l’usine Taret-Acier. Des industriels nostalgiques et des collectifs d’artisans surenchérissent sur chaque pièce en fonte.',
    effects: [
      { sector: 'finance', mult: 1.35, days: 10 },
      { sector: 'industrie', mult: 1.25, days: 8 },
    ],
    reaction: {
      ghost: 'marx',
      text: 'Le capital fixe du passé vendu au plus offrant. Ces machines ont absorbé la sueur de trois générations d’ouvriers avant de finir sous le marteau du commissaire.',
    },
  },
  {
    id: 'happening_friche_sud_pollution_sol_retard_tiers_lieu',
    district: 'friche_sud',
    minTier: 5,
    headline: 'Découverte de solvants dans les cuves : le grand projet de halle bio reporté',
    body: 'Des prélèvements révèlent une contamination des sols sous l’ancienne friche industrielle. Les travaux d’aménagement de la grande brasserie coopérative doivent être suspendus pour dépollution.',
    effects: [
      { sector: 'immobilier', mult: 0.65, days: 25 },
      { sector: 'alimentation', mult: 0.85, days: 20 },
    ],
    reaction: {
      ghost: 'raworth',
      text: 'Le passif environnemental de l’ancienne industrie ne s’efface pas d’un coup de baguette magique. Le coût écologique finit toujours par être payé.',
    },
  },

  // =========================================================================
  // 9. LE PLATEAU DE BELLEVUE (bellevue) — L'horizon civique et le calme résidentiel
  // =========================================================================
  {
    id: 'happening_bellevue_salon_vins_bio_plateau',
    district: 'bellevue',
    minTier: 6,
    headline: 'Dégustation huppée de vins biodynamiques à la Maison Vasseur : afflux de gourmets',
    body: 'Charles Vasseur réunit les vignerons les plus réputés du vignoble régional dans sa cour d’honneur. La bourgeoisie locale et les cadres d’HyperVal s’y pressent pour commander des caisses entières.',
    effects: [
      { sector: 'alimentation', mult: 1.45, days: 6 },
      { sector: 'commerce', mult: 1.35, days: 6 },
    ],
    reaction: {
      ghost: 'weber',
      text: 'La consommation ostentatoire de produits rares certifie l’appartenance aux classes supérieures. Le goût raffiné est avant tout un marqueur de statut social.',
    },
  },
  {
    id: 'happening_bellevue_greve_cantine_lycee_elite',
    district: 'bellevue',
    minTier: 6,
    headline: 'Débrayage du personnel de cantine au lycée : les élèves au restaurant',
    body: 'Les agents de restauration protestent contre le non-remplacement des départs à la retraite. Faute de repas chaud, les lycéens fortunés envahissent les salons de thé et boulangeries de la rue du Lycée.',
    effects: [
      { sector: 'alimentation', mult: 1.35, days: 5 },
      { sector: 'services', mult: 0.75, days: 5 },
    ],
    reaction: {
      ghost: 'smith',
      text: 'Quand le service institutionnel s’interrompt, les élèves aisés votent avec leur porte-monnaie en stimulant les commerçants voisins.',
    },
  },
  {
    id: 'happening_bellevue_flambee_foncier_residentiel',
    district: 'bellevue',
    minTier: 6,
    headline: 'Record historique du prix au mètre carré sur les parcelles de Bellevue',
    body: 'L’attrait pour le calme verdoyant et la proximité du plateau pousse les prix de l’immobilier au-delà de 4 500 euros le mètre carré. Les jeunes ménages sont exclus du secteur.',
    effects: [
      { sector: 'immobilier', mult: 1.45, days: 25 },
      { sector: 'finance', mult: 1.3, days: 20 },
    ],
    reaction: {
      ghost: 'ricardo',
      text: 'La rente foncière différentielle bat son plein : l’attrait d’un cadre d’exception enrichit sans effort les propriétaires du sol.',
    },
  },
  {
    id: 'happening_bellevue_debat_polemique_librairie',
    district: 'bellevue',
    minTier: 6,
    headline: 'Rencontre houleuse à la Librairie des Glycines sur la fin du travail ouvrier',
    body: 'La venue d’un sociologue venu présenter son essai sur la désindustrialisation suscite une vive controverse entre intellectuels des Hauts et anciens syndicalistes venus de la vallée.',
    effects: [
      { sector: 'culture', mult: 1.4, days: 7 },
      { sector: 'medias', mult: 1.3, days: 6 },
    ],
    reaction: {
      ghost: 'marx',
      text: 'La désindustrialisation n’est pas un accident de parcours : c’est la logique implacable du capital qui déserte dès que le taux de profit s’érode.',
    },
  },
  {
    id: 'happening_bellevue_fermeture_temporaire_agence_bancaire',
    district: 'bellevue',
    minTier: 6,
    headline: 'Refonte architecturale de la banque privée du Belvédère : retraits au ralenti',
    body: 'L’établissement financier principal du plateau ferme son agence trois semaines pour aménager des salons de gestion de patrimoine VIP. Les flux de crédit locaux tournent temporairement au ralenti.',
    effects: [
      { sector: 'finance', mult: 0.7, days: 21 },
      { sector: 'services', mult: 0.85, days: 15 },
    ],
    reaction: {
      ghost: 'keynes',
      text: 'Lorsque la circulation des crédits ralentit ne serait-ce que temporairement, la machine économique tout entière ressent un coup de frein.',
    },
  },
];
