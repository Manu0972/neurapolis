/**
 * Textes des cinématiques et des pensées du personnage (vague 7, retour de l'utilisateur :
 * « au début, une cinématique dans la bibliothèque » ; « pourquoi le personnage veut gagner de
 * l'argent ? il faut une pensée dans sa tête »). Canon : src/data/story_starter.ts (la nuit de la
 * Maison du Peuple, Papy Lucien) et src/data/family_starter.ts (Nora, Thierry).
 * `{prenom}` et `{e}` sont remplacés par simulation/story.ts › personalize.
 */

/** Sous-titres de la nuit de la Maison du Peuple, un par plan (même ordre que le plan de caméra). */
export const ORIGIN_SUBTITLES: readonly string[] = [
  '31 août 2020. L’orage roule sur la vallée du Taret. Demain, c’est la rentrée en cinquième.',
  'Ce soir, {prenom} aide à vider la vieille bibliothèque de la Maison du Peuple. Six mille livres.',
  'Papy Lucien en a été le bibliothécaire pendant quarante ans. Lundi, ses livres partent au pilon.',
  'Un éclair. Le courant saute. L’étagère gémit… et tout dégringole.',
  'Au milieu des livres tombés, un vieux carnet. L’écriture penchée de Lucien : « Pour mon petit enfant. »',
  'Les pages s’allument. Des reliures étranges : Smith cousu avec Marx, Keynes avec Hayek…',
  'Et soudain, des voix. Toutes petites. Toutes douces. « N’aie pas peur. »',
  '« Je suis Adam Smith. Cette ville est un marché qui ne sait pas encore qu’il respire. Je vais t’apprendre à l’entendre. »',
];

/** Carton de fin de la cinématique d'ouverture (fondu vers le matin, devant chez soi). */
export const ORIGIN_OUTRO = 'Le lendemain matin, devant chez toi…';

/** Fin du chapitre 1 (≈ 15 s, sur les toits de la Cité des Roses au crépuscule). */
export const CHAPTER1_END_SUBTITLES: readonly string[] = [
  'Le soir tombe sur la Cité des Roses. Le stand a tenu bon.',
  'Premiers clients, premiers euros… et des amis à bord.',
  'Au loin, les grilles de Taret-Acier. Smith murmure : « Ce n’est qu’un début. »',
];

export const CHAPTER1_END_OUTRO = 'Fin du chapitre 1 — Les Goûters de Val-Ferrand';

/**
 * Pensées du début du chapitre 1 : pourquoi {prenom} veut gagner de l'argent. Ton d'un enfant
 * de 12 ans, à la première personne. Une seule à la fois, puis la première voix répond.
 */
export const OPENING_THOUGHTS: readonly string[] = [
  'Purée… j’ai même pas d’argent. Quinze euros, c’est tout ce qui me reste.',
  'Papa porte des cartons au Drive toute la journée, maman enchaîne les gardes de nuit. Je vais pas encore leur demander des sous…',
  'J’aimerais bien en gagner moi-même. Mais comment on fait, à douze ans ? Je suis pas né{e} riche, moi.',
];

/** La première voix répond dans sa tête (Adam Smith, celui de la nuit de la bibliothèque). */
export const OPENING_VOICE = {
  ghost: 'smith',
  text: 'Gagner de l’argent ? Commence par regarder ce dont les autres ont envie, {prenom}. Le goûter de quatre heures, par exemple… Mais d’abord, fais quelques pas : une ville se comprend avec les pieds.',
} as const;

/** Drapeau (w.seen) : les pensées d'ouverture ont été vues. */
export const OPENING_THOUGHTS_FLAG = 'recit:pensees_c1';
/** Drapeau (w.seen) : la cinématique de fin du chapitre 1 a été vue. */
export const CHAPTER1_END_FLAG = 'recit:cine_fin_c1';
