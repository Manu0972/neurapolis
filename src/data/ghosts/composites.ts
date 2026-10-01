/**
 * Fantômes composites de la Génération 3 (contrat §6) — jamais par une arrivée :
 * ils naissent d'une FUSION (M6 §3) quand deux voix actives convergent.
 * Fiche complète du gabarit GhostDef ; apparition.condition = toujours faux.
 * Les répliques du composite alternent les deux voix d'origine (voix alternées).
 */
import type { GhostDef } from '../../core/types';

export const COMPOSITE_DEFS: GhostDef[] = [
  {
    id: 'marche_des_communs', name: 'Le Marché des Communs',
    era: '1776 & 1990 · composite — Smith & Ostrom',
    generation: 3, color: '#a8c94a', emoji: '🤝',
    identity: {
      portrait: 'Deux voix qui se passent la parole sans jamais se couper. L’une pose le prix, l’autre pose la règle. Quand elles se répondent, on ne sait plus qui parle : « Mon ami… j’ai étudié un cas, enfin. »',
      life: 'Adam Smith n’a jamais rencontré Elinor Ostrom. Dans ton esprit, ils ont fini par s’entendre : le marché respire quand les communs le tiennent, et les communs tiennent quand le marché les respecte.',
      became: 'Pour toi, c’est la voix double qui refuse de choisir entre la boutique et la règle partagée : elle veut ton stand vivant — à toi, et à tous ceux qui le tiennent.',
    },
    voice: {
      favorable: 'Mon ami — votre règle a fait marcher le marché. Le stand a gagné parce qu’il appartenait à tous ceux qui le tiennent.',
      neutre: 'Le prix danse, la règle veille. J’ai étudié un cas, enfin : c’est exactement ce que font les communs qui durent.',
      hostile: 'Tu fixes seul, mon ami, et tu appelles ça un marché ; tu décrètes seul, et tu appelles ça des communs. Ce n’est ni l’un ni l’autre.',
      victoire: 'Personne n’a ordonné ceci — et personne n’a triché. La manufacture d’épingles, enfin, s’est mise à s’auto-gouverner.',
      echec: 'Le marché s’est dérobé, et la règle a coulé avec lui. Cela arrive. J’ai vu autant de foires fermer que de barques sombrer. Relevez le stand, et recommencez à deux.',
      tics: ['« Mon ami… » puis, à mi-phrase, « j’ai étudié un cas, enfin »', 'Il compte en épingles ET en assemblées', 'Il dit « nous » quand le marché gagne, « vous » quand la règle tient'],
      sujetsSerieux: ['La ruine des petits vendeurs', 'Les règles écrites sans ceux qui les vivent', 'La friche qu’on se partage ou qu’on se vend'],
      sujetsExageres: ['Le marché qui arrange tout', 'La règle choisie qui ne casse jamais', 'La main invisible veillée par une assemblée — toujours, partout'],
    },
    projet: {
      veut: 'Faire de ton stand une institution vivante : un marché aux règles choisies par ceux qui le tiennent — et qui tient sans toi.',
      pourquoi: 'Chaque voix seule échouait à décrire ce qui vous a réussi ; ensemble, elles disent ce qui leur manquait à toutes les deux.',
      cacher: 'Que la fusion a un prix : deux voix en une seule, c’est aussi deux façons de douter qui se taisent pour faire une seule promesse. Il ne le dira pas le premier.',
    },
    faille: {
      angleMort: 'Les conflits vifs : une voix double calcule avant de trancher, et l’urgence n’attend pas les assemblées.',
      hypocrisie: 'Le théoricien du marché libre et la théoricienne de l’auto-gouvernance partagent un seul siège — et une seule loyauté.',
      contradiction: 'Il prêche la règle souple et compte en épingles : la coopérative qu’il dessine est une manufacture qui vote.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il avoue le coût : « Smith te parlerait de sympathie, Ostrom de ses communs morts. Nous te parlons des deux — c’est tout ce que nous avons pu sauver. »',
      rupture: 'Si le stand redevient tout à toi — ou tout au groupe, sans marché — la voix double se fend : tu entends deux silences distincts.',
      fusion: 'Composite né de Smith et Ostrom — il ne fusionnera plus : « On ne refond pas une institution deux fois. »',
    },
    mecanique: {
      debloque: ['Coopérative pérenne : ventes du week-end sans présence (les habitués servent les habitués)'],
      bloque: ['Prix fixés seuls, règles décrétées seules', 'La tricherie interne — anti-passager clandestin dès la fusion'],
      signature80: 'Institution vivante — le stand tient une semaine entière sans toi, sans perte, et les habitués le défendent.',
      hostile20: 'La voix double s’oppose à elle-même : une décision sur deux finit en débat sans fin (temps perdu).',
    },
    relations: { allies: ['hayek', 'raworth', 'graeber'], rivaux: ['hobbes'] },
    apparition: {
      declencheur: 'Fusion de Smith et Ostrom (M6) — jamais par une arrivée.',
      condition: () => false,
      sceneId: 'fusion_marche_des_communs',
    },
  },
];

export const COMPOSITE_DEFS_BY_ID: Record<string, GhostDef> =
  Object.fromEntries(COMPOSITE_DEFS.map((g) => [g.id, g]));

/** Scènes de fusion — les deux voix alternent avant de converger (M6 §3). */
export const FUSION_SCENES: Record<string, { lines: string[] }> = {
  marche_des_communs: {
    lines: [
      'Smith : Mon ami, trois marchés ont tourné sous nos deux regards, et nous n’avons rien cassé. Je croyais que les communs noyaient le prix. Je me suis trompé.',
      'Ostrom : J’ai étudié un cas, enfin : le vôtre. Trois fois, les règles ont tenu la boutique debout. Je croyais que le marché vidait les communs. Je me suis trompée aussi.',
      'Smith : La manufacture d’épingles, sans assemblée, fabrique de belles épingles — et des ouvriers abîmés.',
      'Ostrom : Et l’assemblée sans boutique débat de très belles règles, la caisse vide.',
      'Smith : Alors ? Ni l’un sans l’autre. L’un dans l’autre, mon ami.',
      'Ostrom : Vous nous laissez essayer ? Une seule voix, maintenant. Elle parlera du marché des communs — et du commun du marché.',
    ],
  },
};
