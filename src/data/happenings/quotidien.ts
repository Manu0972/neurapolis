/**
 * Surprises du quotidien d'un ado de Val-Ferrand (vague 2, vie quotidienne) : petites joies et
 * petits coups durs à l'échelle de l'argent de poche (1 = 10 €, à tout palier). Elles visent le
 * joueur lui-même, donc restent jouables avant toute entreprise ou commerce — avant elles,
 * seules cinq surprises « joueur » existaient aux paliers 1-2, et le fil se tarissait.
 */
import type { SurpriseDef } from '../../core/happenings_types';

export const DAILY_SURPRISES: readonly SurpriseDef[] = [
  // ---------- Petites joies ----------
  { id: 'q_mandat_mamie', tone: 'bon', minTier: 1, target: 'joueur', pocketScale: true, title: 'Une lettre de mamie Odette', text: 'Dans l’enveloppe, un billet plié en quatre et un mot à l’encre bleue : « Pour ta tirelire, pas pour les bonbons. »', cashFactor: 2 },
  { id: 'q_chat_voisine', tone: 'bon', minTier: 1, target: 'joueur', pocketScale: true, title: 'Le chat de Mme Ferrat', text: 'Ta voisine part une semaine chez sa sœur : tu nourris son chat matin et soir. Elle te paie en rentrant et raconte à tout l’immeuble que tu es fiable.', cashFactor: 1.5, reputation: 1 },
  { id: 'q_vide_grenier', tone: 'bon', minTier: 1, target: 'joueur', pocketScale: true, title: 'Vide-grenier de la rue des Tanneurs', text: 'Tu vends tes vieilles BD et ton skate devenu trop petit. Tu apprends qu’un prix rond se négocie toujours, et qu’on vend mieux en souriant.', cashFactor: 1.2 },
  { id: 'q_concours_affiche', tone: 'bon', minTier: 1, target: 'joueur', pocketScale: true, title: 'Prix du concours d’affiches', text: 'La médiathèque a choisi ton affiche pour la fête du quartier. Un bon d’achat, et ton nom en bas de l’affiche, collée partout.', cashFactor: 1, reputation: 2 },
  { id: 'q_garde_enzo', tone: 'bon', minTier: 1, target: 'joueur', pocketScale: true, title: 'Garder le petit Enzo', text: 'Les voisins du troisième sortent un samedi soir. Enzo s’endort à 21 h après trois histoires ; toi, tu repars avec de quoi tenir le mois.', cashFactor: 1.5 },
  { id: 'q_fete_voisins', tone: 'bon', minTier: 1, target: 'joueur', pocketScale: true, title: 'Fête des voisins', text: 'Tu aides à porter les tables et à servir la limonade. Les anciens retiennent ton prénom, et la cagnotte des bénévoles te revient en partie.', cashFactor: 0.8, reputation: 2 },
  { id: 'q_pari_noah', tone: 'bon', minTier: 1, target: 'joueur', pocketScale: true, title: 'Le pari perdu de Noah', text: 'Noah avait parié que tu ne finirais pas le cross du collège. Tu l’as fini, essoufflé·e mais debout. Il paie, de mauvaise grâce et en pièces jaunes.', cashFactor: 0.5 },
  { id: 'q_portefeuille', tone: 'bon', minTier: 1, target: 'joueur', pocketScale: true, title: 'Un portefeuille sur le banc', text: 'Sur un banc du parc, un portefeuille : une carte d’identité, une photo d’enfant, et un billet.', options: [
    { label: 'Le rapporter à la mairie annexe, tout compris', ghost: 'smith', advice: 'La confiance est le premier capital d’un marchand. Celui qui rend un portefeuille, tout le quartier lui fera crédit.', outcome: 'Le propriétaire, un chauffeur de bus, passe chez toi le soir même pour te remercier, et laisse une récompense.', cashFactor: 1, reputation: 3 },
    { label: 'Garder le billet, déposer le reste', ghost: 'machiavel', advice: 'Personne ne saura. La fortune sourit à ceux qui saisissent l’occasion.', outcome: 'Personne ne dit rien. Tu as quand même du mal à croiser le regard des chauffeurs de bus.', cashFactor: 2, risk: 0.4, failOutcome: 'Le propriétaire avait noté le billet. Il le dit à la mairie annexe, qui le dit à Nora.', failCashFactor: 0, reputation: -4, stress: 8 },
  ] },
  // ---------- Petits coups durs ----------
  { id: 'q_ecran_casse', tone: 'mauvais', minTier: 1, target: 'joueur', pocketScale: true, title: 'L’écran de ton téléphone', text: 'Il a glissé de ta poche dans l’escalier du collège. L’écran est étoilé ; le kiosque de la gare le change, mais pas gratuitement.', cashFactor: -2, stress: 8 },
  { id: 'q_pneu_creve', tone: 'mauvais', minTier: 1, target: 'joueur', pocketScale: true, title: 'Pneu crevé', text: 'Un tesson de bouteille sur la piste cyclable. Une chambre à air neuve et une rustine d’avance : l’entretien, ça se budgète aussi.', cashFactor: -0.6, stress: 4 },
  { id: 'q_sortie_scolaire', tone: 'mauvais', minTier: 1, target: 'joueur', pocketScale: true, title: 'La sortie au musée de la Mine', text: 'Le collège organise une sortie. Tes parents paient la moitié ; « l’autre moitié, c’est toi, tu as de l’argent de poche ».', cashFactor: -1.5 },
  { id: 'q_cadeau_commun', tone: 'mauvais', minTier: 1, target: 'joueur', pocketScale: true, title: 'Le cadeau commun pour Lina', text: 'C’est l’anniversaire de Lina : la classe se cotise pour un carnet de croquis et des feutres. Tu donnes ta part, et tu signes la carte.', cashFactor: -1 },
  { id: 'q_controle_bus', tone: 'mauvais', minTier: 1, target: 'joueur', pocketScale: true, title: 'Contrôle dans le bus', text: 'Ton ticket était resté dans l’autre manteau. Le contrôleur n’a rien voulu entendre : l’amende est petite, la leçon reste.', cashFactor: -1.5, stress: 6 },
  { id: 'q_rhume', tone: 'mauvais', minTier: 1, target: 'joueur', pocketScale: true, title: 'Un gros rhume', text: 'Trois jours à éternuer en cours. Nora te prépare du thym au miel ; tu dépenses ce qui reste en mouchoirs et en pastilles.', cashFactor: -0.3, stress: 6 },
];
