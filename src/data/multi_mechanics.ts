/**
 * Les 14 mécaniques du multijoueur : coopération, zone grise, sabotage. Chacune illustre un
 * concept d'économie et fait réagir deux penseurs (un pour, un contre). Les textes d'Antigravity
 * (workflow AG-3, src/data/multi/flavor.ts) pourront remplacer ces textes de départ.
 * Les chiffres des effets sont dans src/simulation/multiplayer.ts.
 * `{autre}` est remplacé par le nom de l'autre joueur.
 */
import type { MultiMechanicId, MultiMode } from '../core/multiplayer_types';
import { MULTI_FLAVOR_BY_ID } from './multi/flavor';
import { CONCEPT_BY_ID } from './ascension/concepts';

export interface MultiMechanicDef {
  id: MultiMechanicId;
  kind: 'coop' | 'zone_grise' | 'sabotage';
  icon: string;
  label: string;
  pitch: string;
  /** L'autre doit accepter (proposition) ; sinon l'action part directement. */
  needsAccept: boolean;
  /** Coût pour celui qui agit (€). */
  cost: number;
  /** Jours entre deux utilisations envers le même joueur. */
  cooldownDays: number;
  /** Chance que la cible découvre qui l'a visée (sabotage). */
  discovery: number;
  concept: string;
  toActor: string;
  toTarget: string;
  discovered: string;
  ghostFor: { ghost: string; text: string };
  ghostAgainst: { ghost: string; text: string };
  /** Leçon d'économie (AG-3). */
  lesson?: string;
}

const BASE_MECHANICS: readonly MultiMechanicDef[] = [
  // ---------- Coopération ----------
  {
    id: 'pret', kind: 'coop', icon: '🤝', label: 'Prêter de l’argent', needsAccept: true, cost: 0, cooldownDays: 1, discovery: 0,
    pitch: 'Tu avances une somme à {autre}, remboursée dans 14 jours, avec ou sans intérêts.',
    concept: 'levier',
    toActor: '{autre} a accepté ton prêt.', toTarget: '{autre} te propose un prêt.', discovered: '',
    ghostFor: { ghost: 'keynes', text: 'L’argent qui dort ne crée rien. Prêté, il fait tourner deux affaires au lieu d’une.' },
    ghostAgainst: { ghost: 'smith', text: 'Prête à un ami, et tu risques de perdre l’argent et l’ami. Écris les conditions.' },
  },
  {
    id: 'coentreprise', kind: 'coop', icon: '🏗️', label: 'S’associer (coentreprise)', needsAccept: true, cost: 0, cooldownDays: 7, discovery: 0,
    pitch: 'Pendant 14 jours, vous mettez en commun 15 % de vos bénéfices et vos clientèles se recommandent l’une l’autre (+6 % de demande chacun).',
    concept: 'capital_social',
    toActor: 'Coentreprise signée avec {autre}.', toTarget: '{autre} te propose une coentreprise.', discovered: '',
    ghostFor: { ghost: 'ostrom', text: 'Deux qui partagent les risques tiennent plus longtemps qu’un seul qui les porte tous.' },
    ghostAgainst: { ghost: 'hobbes', text: 'Ton associé·e d’aujourd’hui connaîtra demain tous tes secrets.' },
  },
  {
    id: 'achats_groupes', kind: 'coop', icon: '📦', label: 'Commander ensemble chez les grossistes', needsAccept: true, cost: 0, cooldownDays: 7, discovery: 0,
    pitch: 'Une commande commune : 8 % de remise chez tous les grossistes pendant 7 jours, pour vous deux.',
    concept: 'economies_echelle',
    toActor: 'Achats groupés avec {autre} : −8 % chez les grossistes.', toTarget: '{autre} propose de grouper vos commandes.', discovered: '',
    ghostFor: { ghost: 'ford', text: 'Plus on commande, moins chaque carton coûte. À deux, vous êtes déjà un gros client.' },
    ghostAgainst: { ghost: 'ohno', text: 'Grouper, c’est bien, tant que personne ne se retrouve avec le stock de l’autre sur les bras.' },
  },
  {
    id: 'recommandation', kind: 'coop', icon: '📣', label: 'Envoyer tes clients chez l’autre', needsAccept: false, cost: 0, cooldownDays: 3, discovery: 0,
    pitch: 'Tu recommandes {autre} à ta clientèle : +15 % de demande chez lui ou elle pendant 5 jours ; ta réputation y gagne.',
    concept: 'capital_social',
    toActor: 'Tu as recommandé {autre} à tes clients.', toTarget: '{autre} t’envoie ses clients : la demande monte.', discovered: '',
    ghostFor: { ghost: 'bourdieu', text: 'Ton réseau est un capital. Le prêter, c’est le faire grandir.' },
    ghostAgainst: { ghost: 'machiavel', text: 'Tes clients te font confiance à toi. Assure-toi qu’ils reviendront.' },
  },
  {
    id: 'formation', kind: 'coop', icon: '🎓', label: 'Apprendre un concept à l’autre', needsAccept: false, cost: 0, cooldownDays: 2, discovery: 0,
    pitch: 'Tu expliques à {autre} un concept de ton carnet : il ou elle l’apprend et gagne de l’expérience.',
    concept: 'communs',
    toActor: 'Tu as appris un concept à {autre}.', toTarget: '{autre} t’a expliqué un concept de son carnet.', discovered: '',
    ghostFor: { ghost: 'ostrom', text: 'Le savoir est un commun : le partager ne te l’enlève pas.' },
    ghostAgainst: { ghost: 'schumpeter', text: 'Ton avance, c’est ce que tu sais et que les autres ignorent. Tu viens d’en donner un morceau.' },
  },
  {
    id: 'garant_mutuel', kind: 'coop', icon: '✍️', label: 'Te porter garant·e (prête-nom)', needsAccept: true, cost: 0, cooldownDays: 14, discovery: 0,
    pitch: 'Si tu peux signer en adulte (18 ans ou prête-nom), tu signes pour {autre} pendant 30 jours : ses limites d’âge des affaires tombent.',
    concept: 'alea_moral',
    toActor: 'Tu signes pour {autre} pendant 30 jours.', toTarget: '{autre} propose de signer pour toi.', discovered: '',
    ghostFor: { ghost: 'smith', text: 'La confiance entre marchands est la monnaie la plus solide.' },
    ghostAgainst: { ghost: 'hayek', text: 'Celui qui signe sans risquer son argent prend moins de précautions. C’est l’aléa moral.' },
  },
  // ---------- Zone grise ----------
  {
    id: 'entente_prix', kind: 'zone_grise', icon: '🤫', label: 'S’entendre sur les prix', needsAccept: true, cost: 0, cooldownDays: 10, discovery: 0,
    pitch: 'Pendant 10 jours, vous ne vous faites plus concurrence : +12 % de demande chacun. Mais c’est illégal : chaque jour, l’Autorité de la concurrence peut tomber dessus.',
    concept: 'oligopole',
    toActor: 'Entente conclue avec {autre}. Chut.', toTarget: '{autre} te propose de s’entendre sur les prix.', discovered: '',
    ghostFor: { ghost: 'machiavel', text: 'Deux loups qui chassent ensemble mangent mieux que deux loups qui se battent.' },
    ghostAgainst: { ghost: 'smith', text: 'Les gens du même métier se réunissent rarement sans que cela finisse en conspiration contre le public.' },
  },
  // ---------- Sabotage ----------
  {
    id: 'guerre_des_prix', kind: 'sabotage', icon: '💥', label: 'Casser les prix', needsAccept: false, cost: 120, cooldownDays: 5, discovery: 1,
    pitch: 'Tu vends à perte pendant 7 jours (120 € de marge sacrifiée) : la demande de {autre} chute de 15 %.',
    concept: 'dumping',
    toActor: 'Guerre des prix lancée contre {autre}.', toTarget: 'Quelqu’un casse les prix autour de toi : tes clients filent.', discovered: 'C’est {autre} qui casse les prix pour te couler.',
    ghostFor: { ghost: 'schumpeter', text: 'La concurrence est une destruction. Créatrice, si tu as mieux à proposer après.' },
    ghostAgainst: { ghost: 'marx', text: 'Vendre à perte pour tuer l’autre, puis remonter les prix : le monopole n’est jamais loin.' },
  },
  {
    id: 'rumeur', kind: 'sabotage', icon: '🗣️', label: 'Faire courir une rumeur', needsAccept: false, cost: 0, cooldownDays: 4, discovery: 0.35,
    pitch: '« Il paraît que… » : la réputation de {autre} baisse et sa demande aussi pendant 4 jours. Si on remonte à toi, c’est ta réputation qui trinque.',
    concept: 'asymetrie_information',
    toActor: 'La rumeur sur {autre} fait le tour du quartier.', toTarget: 'Une rumeur court sur ton commerce. Les clients hésitent.', discovered: 'La rumeur vient de {autre}. Tout le quartier le sait maintenant.',
    ghostFor: { ghost: 'machiavel', text: 'La réputation est une arme. Celle des autres aussi.' },
    ghostAgainst: { ghost: 'akerlof', text: 'Quand on ne sait plus à qui faire confiance, tout le marché s’effondre, pas seulement ta cible.' },
  },
  {
    id: 'debauchage', kind: 'sabotage', icon: '🧲', label: 'Débaucher un employé', needsAccept: false, cost: 80, cooldownDays: 7, discovery: 1,
    pitch: 'Tu proposes mieux à l’employé·e le moins bien payé·e de {autre}. S’il ou elle gagne moins de 12 €/h, il ou elle part.',
    concept: 'concurrence_deloyale',
    toActor: 'Tu as tenté de débaucher chez {autre}.', toTarget: 'Un de tes employés a reçu une offre d’ailleurs.', discovered: 'L’offre venait de {autre}.',
    ghostFor: { ghost: 'smith', text: 'Le travail va où il est le mieux payé. Paie bien, et personne ne partira.' },
    ghostAgainst: { ghost: 'dejours', text: 'Un collectif de travail ne se remplace pas par une ligne de salaire.' },
  },
  {
    id: 'signalement', kind: 'sabotage', icon: '📋', label: 'Signaler à l’inspection', needsAccept: false, cost: 0, cooldownDays: 7, discovery: 0.5,
    pitch: 'Un signalement anonyme : les commerces de {autre} sont inspectés, fermés une journée (sauf réputation de 70 ou plus).',
    concept: 'capture_reglementaire',
    toActor: 'Signalement envoyé contre {autre}.', toTarget: 'Inspection surprise : tes commerces ferment pour la journée.', discovered: 'Le signalement venait de {autre}.',
    ghostFor: { ghost: 'hobbes', text: 'Sans règles appliquées, c’est la guerre de tous contre tous. Les inspecteurs sont là pour ça.' },
    ghostAgainst: { ghost: 'ostrom', text: 'Utiliser la règle commune comme une arme privée, c’est l’abîmer pour tout le monde.' },
  },
  {
    id: 'rachat_fournisseur', kind: 'sabotage', icon: '🚚', label: 'Rafler le stock des grossistes', needsAccept: false, cost: 200, cooldownDays: 7, discovery: 1,
    pitch: 'Tu achètes tout ce qui reste chez les grossistes : pendant 5 jours, {autre} paie ses marchandises 12 % plus cher.',
    concept: 'monopole',
    toActor: 'Stocks raflés : {autre} va payer plus cher.', toTarget: 'Les grossistes sont à sec : tes achats coûtent 12 % de plus.', discovered: 'C’est {autre} qui a vidé les entrepôts.',
    ghostFor: { ghost: 'ricardo', text: 'Qui tient la ressource rare fixe le prix. Simple arithmétique.' },
    ghostAgainst: { ghost: 'raworth', text: 'Affamer le marché pour gagner une bataille, c’est scier la branche sur laquelle tout le monde est assis.' },
  },
  {
    id: 'espionnage', kind: 'sabotage', icon: '🔍', label: 'Lire les comptes de l’autre', needsAccept: false, cost: 30, cooldownDays: 3, discovery: 0.25,
    pitch: 'Un contact te passe les chiffres de {autre} : argent, chiffre d’affaires, palier.',
    concept: 'asymetrie_information',
    toActor: 'Tu as les comptes de {autre}.', toTarget: 'Quelqu’un s’est intéressé de près à tes comptes.', discovered: 'C’est {autre} qui a fouillé tes comptes.',
    ghostFor: { ghost: 'hayek', text: 'L’information, c’est le prix avant le prix. Celui qui sait avant les autres gagne.' },
    ghostAgainst: { ghost: 'smith', text: 'Un marché où chacun espionne l’autre est un marché où plus personne n’investit.' },
  },
  {
    id: 'bail_coupe', kind: 'sabotage', icon: '🔑', label: 'Louer le local que l’autre vise', needsAccept: false, cost: 0, cooldownDays: 0, discovery: 1,
    pitch: 'Les locaux que tu loues ne sont plus disponibles pour {autre} : premier arrivé, premier servi.',
    concept: 'rente',
    toActor: 'Tu as pris ce local avant {autre}.', toTarget: '{autre} vient de louer un local avant toi.', discovered: '',
    ghostFor: { ghost: 'ricardo', text: 'La meilleure place rapporte une rente à qui l’occupe le premier.' },
    ghostAgainst: { ghost: 'marx', text: 'Tu n’as rien produit : tu as juste pris la place.' },
  },
];

/** Les textes d'Antigravity (AG-3) remplacent ceux de départ ; les règles chiffrées restent celles du moteur. */
export const MULTI_MECHANICS: readonly MultiMechanicDef[] = BASE_MECHANICS.map((m) => {
  const f = MULTI_FLAVOR_BY_ID[m.id];
  if (!f) return m;
  return {
    ...m, label: f.label, pitch: f.pitch, toActor: f.toActor, toTarget: f.toTarget, discovered: f.discovered || m.discovered,
    ghostFor: f.ghostFor, ghostAgainst: f.ghostAgainst, concept: CONCEPT_BY_ID[f.concept] ? f.concept : m.concept, lesson: f.lesson,
  };
});

export const MULTI_MECHANIC_BY_ID: Readonly<Record<MultiMechanicId, MultiMechanicDef>> = Object.fromEntries(MULTI_MECHANICS.map((m) => [m.id, m])) as Record<MultiMechanicId, MultiMechanicDef>;

export const MULTI_MODES: readonly { id: MultiMode; label: string; pitch: string }[] = [
  { id: 'cooperation', label: '🤝 Coopération', pitch: 'Ensemble contre la vallée : prêts, associations, achats groupés. Pas de sabotage.' },
  { id: 'libre', label: '⚖️ Libre', pitch: 'Tout est permis : s’allier, s’entendre, se trahir. La relation se construit… ou se casse.' },
  { id: 'rivalite', label: '⚔️ Rivalité', pitch: 'Deux empires, une seule vallée : seuls la zone grise et le sabotage sont ouverts.' },
];

/** La mécanique est-elle permise dans ce mode ? */
export function mechanicAllowed(mode: MultiMode, kind: MultiMechanicDef['kind']): boolean {
  if (mode === 'cooperation') return kind === 'coop';
  if (mode === 'rivalite') return kind !== 'coop';
  return true;
}
