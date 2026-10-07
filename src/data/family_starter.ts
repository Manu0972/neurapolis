/**
 * Famille et collège : premier jeu de contenu (Antigravity livrera le grand lot dans
 * src/data/story/family.ts). Canon :
 * - Nora, aide-soignante de nuit à l'hôpital de Val-Ferrand : pousse vers les études, fière et
 *   inquiète, dort le jour quand toi tu es en classe.
 * - Thierry, fondeur licencié en 2014 quand les hauts-fourneaux ont fermé, aujourd'hui cariste à
 *   l'entrepôt du Drive HyperVal — le grand rival de son enfant. Méfiant envers le risque, il voit
 *   pourtant en toi « celui qui ne finira pas comme moi ».
 * - Le grand-père Lucien (mort en 2019) : fondeur, délégué syndical, bibliothécaire du comité
 *   d'entreprise. Ses livres annotés sont à l'origine des voix.
 */
import type { FamilyLine, ParentId, SessionId } from '../core/family_types';

export const PARENTS: Record<ParentId, { name: string; icon: string; job: string }> = {
  nora: { name: 'Nora', icon: '👩‍⚕️', job: 'aide-soignante de nuit à l’hôpital de Val-Ferrand' },
  thierry: { name: 'Thierry', icon: '👷', job: 'cariste à l’entrepôt du Drive HyperVal, ancien fondeur de Taret-Acier' },
};

export const SCHOOL_STAFF = {
  principal: { name: 'Mme Garnier', role: 'principale du collège Jean-Moulin' },
  cpe: { name: 'M. Haddad', role: 'conseiller principal d’éducation' },
} as const;

export const SESSION_SUBJECT: Record<SessionId, string[]> = {
  matin: ['Maths avec Mme Moreau', 'Français avec M. Lefèvre', 'Histoire-géo avec Mme Diallo', 'Anglais avec Mr. Barnes', 'SVT avec M. Roche'],
  apres: ['Technologie avec M. Roche', 'EPS au gymnase', 'Arts plastiques avec Mme Pinto', 'Maths avec Mme Moreau', 'Musique avec M. Fauré'],
};

/** Moments de classe (un par séance suivie). */
export const CLASS_MOMENTS: readonly { text: string; comprehension: number; mood: number }[] = [
  { text: 'Interro surprise sur les pourcentages. Tu repenses à tes marges du stand : facile.', comprehension: 2, mood: 3 },
  { text: 'Noah te fait passer un mot : « On vend des cartes à la récré ? » Mme Moreau l’intercepte et le lit à voix haute.', comprehension: 0, mood: 5 },
  { text: 'Lina explique un exercice au tableau mieux que la prof. Tu prends des notes, et des idées.', comprehension: 2, mood: 1 },
  { text: 'Exposé de Yasmine sur la fermeture des hauts-fourneaux en 2014. Toute la classe se tait. Ton père y travaillait.', comprehension: 1, mood: -2 },
  { text: 'Tu t’endors pendant le cours de musique. Personne ne t’a vu… sauf M. Fauré.', comprehension: 0, mood: -1 },
  { text: 'Débat en éducation civique : « Le Drive HyperVal est-il bon pour la ville ? » Tu as beaucoup à dire.', comprehension: 2, mood: 4 },
  { text: 'Contrôle de géographie sur la vallée du Taret. Tu connais chaque rue par cœur.', comprehension: 1, mood: 2 },
  { text: 'Une voix murmure une réponse pendant l’exercice. Tu ne sais plus si c’est triché.', comprehension: 1, mood: 0 },
];

const r = (label: string, trust: number, worry: number, pride: number, answer: string): FamilyLine['replies'][number] =>
  ({ label, effect: { trust, worry, pride }, answer });

export const STARTER_FAMILY_LINES: readonly FamilyLine[] = [
  { id: 'd_premier', speaker: 'les_deux', when: 'diner', mood: 'tendre', text: 'Thierry pose les pâtes sur la table. Nora, en blouse, part dans une heure pour sa garde de nuit. « Alors, ce collège ? »', replies: [
    r('Raconter ta journée en détail', 3, -3, 2, 'Nora sourit : « Tu parles comme ton grand-père. Lui aussi racontait tout. »'),
    r('« Ça va. » et finir ton assiette', -1, 2, 0, 'Thierry et Nora échangent un regard. Ils n’insistent pas, cette fois.'),
  ] },
  { id: 'd_hyperval', speaker: 'thierry', when: 'diner', mood: 'inquiet', text: '« Au Drive, ils parlent de toi. Le petit qui vend des goûters. Mon chef a rigolé. Moi, je savais pas trop quoi dire. »', replies: [
    r('« Tu peux être fier, papa. »', 2, 0, 4, 'Il hausse les épaules, mais ses yeux brillent. « Fais juste attention. Les gros mangent les petits. »'),
    r('« Ton chef, il rira moins dans dix ans. »', -2, 4, 3, '« Doucement. C’est mon boulot, ce Drive. C’est lui qui paie tes pâtes. »'),
    r('Lui demander comment c’était, Taret-Acier', 4, -2, 2, 'Il parle longtemps des hauts-fourneaux, de Lucien, de 2014. Tu ne l’avais jamais entendu autant.'),
  ] },
  { id: 'd_nora_nuit', speaker: 'nora', when: 'diner', mood: 'espoir', text: 'Nora noue ses cheveux avant de partir à l’hôpital. « Moi je soigne des gens toute la nuit pour un salaire de misère. Toi, promets-moi de faire des études. »', replies: [
    r('« Promis, maman. »', 3, -4, 1, '« Et le business ? » « Les deux. » Elle rit : « Tu tiens de ton père, têtu. »'),
    r('« Les études, c’est pas le seul chemin. »', -2, 5, 1, 'Elle se fige. « Le seul chemin, peut-être pas. Le plus sûr, oui. On en reparle. »'),
  ] },
  { id: 'a_absence', speaker: 'les_deux', when: 'absence', mood: 'fache', text: 'Le téléphone fixe a sonné à 17 h. C’était le collège. « Tu n’étais pas en cours. Où étais-tu ? »', replies: [
    r('Dire la vérité : le business', 2, 4, -2, 'Thierry soupire. « Au moins tu ne mens pas. Mais l’école, c’est non négociable. »'),
    r('Inventer une excuse', -6, 2, 0, 'Nora te regarde longtemps. Elle ne dit rien. Tu sais qu’elle n’est pas dupe.'),
    r('Promettre que ça ne se reproduira pas', 1, -2, 0, '« On te fait confiance. Ne nous fais pas regretter. »'),
  ] },
  { id: 'n_bonne', speaker: 'nora', when: 'bonne_note', mood: 'fier', text: 'Nora a vu ta note sur l’application du collège. Elle l’a montrée à toutes ses collègues de nuit. « Mon enfant ! »', replies: [
    r('La serrer dans tes bras', 2, -3, 4, 'Elle sent l’hôpital et le café. Elle ne te lâche pas tout de suite.'),
    r('« C’était facile. »', 0, 0, 2, '« Facile pour toi. Garde ça précieusement. »'),
  ] },
  { id: 'n_mauvaise', speaker: 'thierry', when: 'mauvaise_note', mood: 'inquiet', text: '« Une mauvaise note. Ça arrive. Mais si c’est à cause de ton commerce, on va devoir en parler sérieusement. »', replies: [
    r('Reconnaître que tu t’es dispersé', 3, -2, 0, '« C’est déjà bien de le voir. Ton grand-père disait : on ne peut pas tenir deux pelles à la fois. »'),
    r('« Le commerce m’apprend plus que l’école. »', -3, 5, 1, 'Thierry repose sa fourchette. « Moi aussi j’ai cru ça, à ton âge. »'),
  ] },
  { id: 'b_reussite', speaker: 'thierry', when: 'reussite_business', mood: 'espoir', text: 'Thierry a entendu parler de ta réussite par un collègue. « Tu sais, à ton âge, je pensais déjà à l’usine. Toi tu penses à autre chose. C’est bien. »', replies: [
    r('« Un jour, tu ne travailleras plus pour HyperVal. »', 2, 1, 4, 'Il rit doucement. « On verra. En attendant, finis tes devoirs, patron. »'),
    r('Lui proposer de t’aider le samedi', 4, -1, 3, 'Il hésite, puis hoche la tête. « Le samedi, alors. Pas plus. »'),
  ] },
  { id: 'b_echec', speaker: 'nora', when: 'echec_business', mood: 'tendre', text: '« J’ai su pour ton affaire. Ça ne marche pas toujours, mon cœur. Ce n’est pas toi qui as échoué, c’est un essai. »', replies: [
    r('Lui raconter ce que tu as appris', 3, -4, 2, 'Elle écoute, sérieuse. « Tu vois, tu as déjà grandi. »'),
    r('« J’aurais dû vous écouter. »', 2, -2, 0, '« Non. Tu aurais dû t’écouter, et nous parler. C’est différent. »'),
  ] },
  { id: 'f_fatigue', speaker: 'nora', when: 'fatigue', mood: 'inquiet', text: 'Nora, qui rentre de sa nuit, te croise dans la cuisine. « Tu as une mine affreuse. Tu dors combien d’heures en ce moment ? »', replies: [
    r('« Pas assez. Je vais ralentir. »', 3, -4, 0, '« Le corps, il ne fait pas crédit. Crois-en une aide-soignante. »'),
    r('« Ça va, je gère. »', -1, 4, 0, '« C’est exactement ce que disent mes patients avant de tomber. »'),
  ] },
  { id: 'c_convoc', speaker: 'les_deux', when: 'convocation', mood: 'fache', text: 'Une lettre de Mme Garnier, la principale. « Vos parents sont convoqués jeudi. » Thierry l’a posée sur la table, sans un mot.', replies: [
    r('Tout leur expliquer avant le rendez-vous', 4, 0, 0, '« Merci de nous le dire toi-même. On ira ensemble, et on écoutera. »'),
    r('Te taire', -4, 5, 0, 'Le silence dure tout le repas.'),
  ] },
  { id: 'd_lucien', speaker: 'thierry', when: 'diner', mood: 'tendre', text: 'Thierry tourne un vieux livre entre ses mains, plein de notes au crayon. « C’était à ton grand-père. Il annotait tout. Tu veux le garder ? »', replies: [
    r('Le prendre avec précaution', 3, -2, 2, 'Dans la marge, une écriture penchée : « Ceux qui lisent ensemble ne sont jamais seuls. » Une voix, en toi, se tait pour écouter.'),
    r('« Plus tard. »', 0, 0, 0, 'Il le repose sur l’étagère. « Il t’attendra. »'),
  ] },
  { id: 'd_argent', speaker: 'les_deux', when: 'diner', mood: 'inquiet', text: 'La facture d’électricité est sur la table. Nora fait des calculs au dos d’une enveloppe. Thierry fait semblant de ne pas regarder.', replies: [
    r('Proposer de participer avec ton argent', 3, -2, 4, 'Thierry refuse d’abord. Puis accepte, la voix serrée. « Juste ce mois-ci. »'),
    r('Faire semblant de ne rien voir', 0, 1, 0, 'Tu manges en silence. Tu as tout vu.'),
  ] },
];
