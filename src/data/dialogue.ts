/**
 * Répliques du joueur dans les dialogues à choix multiples (M2).
 * Chaque ton a des effets distincts sur la relation 4D (aucune statistique sans
 * conséquence) et fait pratiquer une compétence (XP par pratique, M3).
 */
import type { Rel4, SkillId } from '../core/types';

export interface DialogueReply {
  id: string;
  label: string;
  relation: Partial<Rel4>;
  skill?: SkillId; // compétence pratiquée (XP)
  xp?: number;     // XP gagnés (1 par défaut)
}

// Équilibrage M7 : communication xp 2 — le recrutement (niveau 2 = 9 XP) reste
// atteignable en première semaine par le dialogue, sans gâcher la partie.
export const DIALOGUE_REPLIES: DialogueReply[] = [
  { id: 'chaleureux', label: '« Ça me fait plaisir de te parler ! »', relation: { amitie: 1 }, skill: 'communication', xp: 2 },
  { id: 'curieux', label: '« Raconte-m’en plus… »', relation: { confiance: 1 }, skill: 'recherche', xp: 1 },
  { id: 'motive', label: '« Et si on faisait ça ensemble ? »', relation: { respect: 1 }, skill: 'communication', xp: 2 },
  { id: 'taquin', label: '« Tu me testes, là. »', relation: { rivalite: 1 }, skill: 'negociation', xp: 1 },
  { id: 'partir', label: '« Bon, je dois y aller. »', relation: {} },
];

export const REL_LABELS: Record<keyof Rel4, string> = {
  amitie: 'amitié',
  confiance: 'confiance',
  respect: 'respect',
  rivalite: 'rivalité',
};

/* ------------------------------------------------------------------------------------------
 * Conversations (vague 7) : chaque sujet donne une réplique du PNJ, puis 3 réponses du joueur
 * propres au sujet ; le PNJ réagit à la réponse, et l'on revient au menu des sujets restants
 * (chaque sujet une fois par conversation) ou l'on se dit au revoir. Plus d'impasse.
 * ---------------------------------------------------------------------------------------- */

/** Ton d'une réponse (= identifiant d'une entrée de DIALOGUE_REPLIES, qui porte les effets). */
export type DialogueTone = 'chaleureux' | 'curieux' | 'motive' | 'taquin';

export const TONE_ICONS: Record<DialogueTone, string> = { chaleureux: '😊', curieux: '🤔', motive: '🤝', taquin: '😏' };

/** Nom affiché des sujets (les clés viennent de src/data/npcs.ts). */
export const TOPIC_LABELS: Record<string, string> = {
  accueil: '👋 Salut, ça va ?', projet: '🍪 Le projet', argent: '💶 L’argent', ecole: '📚 L’école',
  quartier: '🏘️ Le quartier', travail: '🔧 Le travail', friche: '🏭 La friche', epicerie: '🛒 L’épicerie',
  histoire: '📜 L’histoire', coop: '🤝 La coop', conseil: '💡 Un conseil', service: '🧺 Un service', cours: '✏️ Le cours',
};

type TopicReply = { tone: DialogueTone; label: string };

/** Réponses du joueur, propres à chaque sujet (le ton fixe les effets). */
export const TOPIC_REPLIES: Record<string, readonly TopicReply[]> = {
  accueil: [
    { tone: 'chaleureux', label: '« Ça me fait plaisir de te voir ! »' },
    { tone: 'curieux', label: '« Et toi, quoi de neuf ? »' },
    { tone: 'taquin', label: '« T’as une tête de lundi matin, toi. »' },
  ],
  projet: [
    { tone: 'motive', label: '« Et si on le montait ensemble ? »' },
    { tone: 'curieux', label: '« Tu ferais comment, toi ? »' },
    { tone: 'taquin', label: '« Je parie que je vends plus que toi. »' },
  ],
  argent: [
    { tone: 'motive', label: '« On pourrait en gagner ensemble, non ? »' },
    { tone: 'curieux', label: '« Tu crois qu’on peut gagner combien ? »' },
    { tone: 'chaleureux', label: '« Moi non plus, j’ai pas un rond. On est pareils. »' },
  ],
  ecole: [
    { tone: 'chaleureux', label: '« Tu m’aides pour les devoirs ? Je t’aide pour le reste. »' },
    { tone: 'curieux', label: '« C’est quoi, ton secret pour être aussi organisée ? »' },
    { tone: 'taquin', label: '« Toi, t’as déjà fini l’année, avoue. »' },
  ],
  quartier: [
    { tone: 'curieux', label: '« Qu’est-ce qui manque, ici ? »' },
    { tone: 'motive', label: '« On pourrait changer ça, à notre échelle. »' },
    { tone: 'chaleureux', label: '« J’aime bien la Cité, moi, malgré tout. »' },
  ],
  travail: [
    { tone: 'curieux', label: '« C’était comment, l’usine ? »' },
    { tone: 'chaleureux', label: '« Vos mains, elles valent de l’or. »' },
    { tone: 'motive', label: '« Un jour, il y aura du travail ici. Je m’y mets. »' },
  ],
  friche: [
    { tone: 'motive', label: '« Moi, j’y crois. On commence quand ? »' },
    { tone: 'curieux', label: '« Il faudrait quoi, pour rouvrir un atelier ? »' },
    { tone: 'taquin', label: '« Un atelier ? Dans ce tas de rouille ? »' },
  ],
  epicerie: [
    { tone: 'chaleureux', label: '« Je viendrai vous faire les courses, s’il faut. »' },
    { tone: 'curieux', label: '« Pourquoi les gens vont au drive, à votre avis ? »' },
    { tone: 'motive', label: '« On va l’aider, l’épicerie. Promis. »' },
  ],
  histoire: [
    { tone: 'curieux', label: '« Racontez-moi encore, s’il vous plaît. »' },
    { tone: 'chaleureux', label: '« Mon grand-père en parlait aussi. »' },
    { tone: 'taquin', label: '« C’était pas mieux avant, quand même ? »' },
  ],
  coop: [
    { tone: 'curieux', label: '« Une voix par tête, même pour moi ? »' },
    { tone: 'motive', label: '« Je veux en être. Comment on rejoint ? »' },
    { tone: 'taquin', label: '« Neuf personnes et un rêve… et un budget ? »' },
  ],
  conseil: [
    { tone: 'curieux', label: '« Comment on sait ce que le client veut ? »' },
    { tone: 'chaleureux', label: '« Merci, je le note dans mon carnet. »' },
    { tone: 'motive', label: '« Je vais essayer dès demain. »' },
  ],
  service: [
    { tone: 'motive', label: '« C’est sérieux. Qu’est-ce que je peux faire pour vous ? »' },
    { tone: 'curieux', label: '« Un prix… c’est-à-dire ? »' },
    { tone: 'taquin', label: '« Et si je négocie, j’ai un caramel en plus ? »' },
  ],
  cours: [
    { tone: 'curieux', label: '« Laquelle des trois est la plus juste ? »' },
    { tone: 'motive', label: '« Je vais essayer sur mon stand. »' },
    { tone: 'chaleureux', label: '« Votre cours m’aide vraiment, madame. »' },
  ],
};

/** Réponses de secours pour un sujet inconnu (aucune impasse). */
export const DEFAULT_TOPIC_REPLIES: readonly TopicReply[] = [
  { tone: 'chaleureux', label: '« Ça me fait plaisir de te parler ! »' },
  { tone: 'curieux', label: '« Raconte-m’en plus… »' },
  { tone: 'motive', label: '« Et si on faisait ça ensemble ? »' },
];

/** Réaction de chaque PNJ selon le ton de la réponse (`{e}` : accord avec le joueur). */
export const NPC_REACTIONS: Record<string, Partial<Record<DialogueTone, string>>> = {
  noah: {
    chaleureux: 'Noah sourit jusqu’aux oreilles. « T’es vraiment trop sympa, toi. »',
    curieux: '« Attends, je te montre mes croquis ! » Il sort un carnet plein de dessins.',
    motive: '« Ensemble ? Grave ! Moi je fais l’affiche, toi tu fais les comptes. »',
    taquin: '« Ah ouais ? Pari tenu. Le perdant paie les bonbons. »',
  },
  lina: {
    chaleureux: 'Lina rougit un peu. « Merci. On fait une bonne équipe, je crois. »',
    curieux: '« Un agenda, des listes, et je ne promets jamais ce que je ne peux pas tenir. »',
    motive: '« D’accord. Mais on écrit les rôles noir sur blanc. »',
    taquin: '« Très drôle. » Elle note quelque chose dans son carnet. Ça ne présage rien de bon.',
  },
  yasmine: {
    chaleureux: '« C’est gentil. Ici, on se serre les coudes. »',
    curieux: '« Un endroit où les jeunes peuvent se retrouver. Et des commerces près de chez soi. »',
    motive: '« À ton échelle, c’est déjà beaucoup. Commence petit. »',
    taquin: '« Toi, tu iras loin. Ou tu finiras en retenue. »',
  },
  karim: {
    chaleureux: 'Karim détourne les yeux, ému. « Ça fait longtemps qu’on ne m’a pas dit ça. »',
    curieux: '« Dur. Bruyant. Mais on était fiers. On savait faire quelque chose ensemble. »',
    motive: '« Si tu montes un truc, je donne un coup de main. Gratuit, pour commencer. »',
    taquin: '« Ha ! T’as du répondant, toi. »',
  },
  monique: {
    chaleureux: '« Tu es un amour. Tiens, prends un bonbon à la violette. »',
    curieux: '« Oh, j’en aurais des choses à te raconter… Assieds-toi deux minutes. »',
    motive: '« Si tu fais ça, je ferai passer le mot à tout l’immeuble. »',
    taquin: '« Petit{e} insolent{e} ! » Elle rit quand même.',
  },
  samir: {
    chaleureux: '« Content de te voir motivé{e}. La coop a besoin de gens comme toi. »',
    curieux: '« Oui, même toi. Une personne, une voix. C’est ça qui change tout. »',
    motive: '« Viens à la prochaine réunion, à la friche. On t’attend. »',
    taquin: '« Le budget ? On y travaille. Les rêves, eux, sont gratuits. »',
  },
  bertin: {
    chaleureux: '« Ça me fait du bien, un client qui sourit. »',
    curieux: '« Le drive est moins cher, c’est tout. Mais ici, on se connaît. Ça compte, non ? »',
    motive: '« Alors on fait affaire. Si tu es sérieux, je te fais un prix sur le stock. »',
    taquin: '« Toi, tu sais marchander. Bon… un caramel. Un seul. »',
  },
  moreau: {
    chaleureux: '« Merci. C’est pour ça que j’enseigne. »',
    curieux: '« Aucune n’est “la” bonne. Tout dépend de ce que tu veux encourager. »',
    motive: '« Excellent. Observe, note, et raconte-nous en classe. »',
    taquin: '« Je vois que tu as de l’esprit. Mets-le dans ta copie, aussi. »',
  },
};

export const GENERIC_REACTIONS: Record<DialogueTone, string> = {
  chaleureux: '« Ça fait plaisir. »',
  curieux: '« Bonne question… »',
  motive: '« Pourquoi pas ! »',
  taquin: '« Toi alors… »',
};

/** Même ton deux fois dans la conversation : une réaction différente (pas de perroquet). */
export const REPEAT_REACTIONS: Record<DialogueTone, string> = {
  chaleureux: 'Un vrai sourire. « Décidément, t’es de bonne humeur aujourd’hui ! »',
  curieux: '« T’en poses, des questions ! Mais c’est bien, ça veut dire que tu réfléchis. »',
  motive: '« Toi, t’as de la suite dans les idées. Ok, on en reparle sérieusement. »',
  taquin: '« Encore ? Tu cherches la bagarre ou quoi ? » Un petit rire quand même.',
};

/** Au revoir de chaque PNJ (fin claire de la conversation). */
export const NPC_GOODBYES: Record<string, string> = {
  noah: '« À plus ! Passe au parc après les cours. »',
  lina: '« À demain. N’oublie pas tes devoirs. »',
  yasmine: '« Bonne journée, et fais attention à toi. »',
  karim: '« Allez, file. Et garde la tête haute. »',
  monique: '« Au revoir, mon petit. Bonjour à ta mère ! »',
  samir: '« Salut. Pense à la coop ! »',
  bertin: '« À bientôt. Et reviens me voir. »',
  moreau: '« À demain en cours. »',
};
