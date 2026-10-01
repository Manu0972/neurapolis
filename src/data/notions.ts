/**
 * Les notions apprenables en 4 étapes : les 5 du contrat (M3 §3) plus 2
 * ajoutées en M6 pour rendre les seuils de Ricardo (Compréhension ≥50) et
 * de Machiavel (Influence ≥55, contrat §6) atteignables par la maîtrise —
 * la seule voie de progression des caractéristiques (M3).
 * 1 découverte (événement vécu, condition sur un compteur de vie) →
 * 2 explication (cours / livre / fantôme, au choix) → 3 application (3 réussies) →
 * 4 maîtrise (+ caractéristique associée). Données pures — moteur : simulation/notions.ts.
 */
import type { CauseFactor, CharacteristicsId } from '../core/types';

export type ExplanationSource = 'cours' | 'livre' | 'fantome';

export interface NotionDef {
  id: string;
  name: string;
  summary: string;
  characteristic: CharacteristicsId;
  gain: number; // points de caractéristique à la maîtrise
  discover: {
    /** Compteur de vie (w.flags) qui déclenche la découverte. */
    when: { flag: string; min: number };
    text: string;
    causes: CauseFactor[];
  };
  explanations: Record<ExplanationSource, { label: string; text: string }>;
  /** Action (gate de compétence) dont la pratique réussie applique la notion. */
  applicationAction: string;
}

export const EXPLANATION_SOURCES: readonly ExplanationSource[] = ['cours', 'livre', 'fantome'];

export const NOTIONS: NotionDef[] = [
  {
    id: 'interets_divergents',
    name: 'Les intérêts divergent',
    summary: 'Chacun veut quelque chose de différent. Le voir, c’est déjà comprendre la moitié des conflits.',
    characteristic: 'creativite',
    gain: 3,
    discover: {
      when: { flag: 'discussions', min: 3 },
      text: 'Noah veut vendre vite, Lina veut tout noter, toi tu veux juste que ça marche. Trois envies, un seul projet. Pourquoi c’est si compliqué de s’entendre ?',
      causes: [{ facteur: 'discussions avec la bande', seuil: '3', poids: 2 }],
    },
    explanations: {
      cours: {
        label: 'Suivre un cours',
        text: 'En classe, Mme Moreau le dit simplement : un conflit, c’est souvent deux intérêts qui tirent dans des directions différentes. Nommer la différence, c’est déjà le début de la solution.',
      },
      livre: {
        label: 'Lire un livre',
        text: 'Un livre de la bibliothèque raconte des marchands qui se disputaient le même client. Le premier qui a su dire « toi tu veux ça, moi je veux ça » a trouvé l’accord.',
      },
      fantome: {
        label: 'Écouter la voix',
        text: 'Une voix lointaine, au fond de ton esprit : « Cherche les intérêts derrière les opinions. C’est là que les conflits commencent — et que les accords se cachent. »',
      },
    },
    applicationAction: 'arbitrer',
  },
  {
    id: 'egalite_equite_incitation',
    name: 'Égalité, équité, incitation',
    summary: 'Trois façons de partager : pareil pour tous, selon le travail fourni, ou pour motiver.',
    characteristic: 'influence',
    gain: 3,
    discover: {
      when: { flag: 'partages', min: 1 },
      text: 'La question tombe au moment du partage : tout le monde doit-il recevoir pareil, même si on n’a pas travaillé pareil ? Personne n’est d’accord, et c’est normal.',
      causes: [{ facteur: 'premier partage proposé', seuil: '1', poids: 3 }],
    },
    explanations: {
      cours: {
        label: 'Suivre un cours',
        text: 'Trois justices, explique la prof : l’égalité donne pareil à chacun, l’équité tient compte des efforts, l’incitation récompense ce qu’on veut encourager. À toi de choisir — et d’assumer.',
      },
      livre: {
        label: 'Lire un livre',
        text: 'Un vieux livre d’économie compare un équipage de bateau : partage égal, partage selon le travail, ou prime au meilleur marin. Trois règles, trois équipages différents.',
      },
      fantome: {
        label: 'Écouter la voix',
        text: 'Une voix murmure : « Questionne chaque partage : qui gagne quoi, qui est motivé, qui s’arrête de travailler ? Les règles justes se construisent, elles ne se décrètent pas. »',
      },
    },
    applicationAction: 'partager',
  },
  {
    id: 'cout_opportunite',
    name: 'Le coût d’opportunité',
    summary: 'Choisir, c’est renoncer. Ce à quoi tu renonces a un prix.',
    characteristic: 'discipline',
    gain: 3,
    discover: {
      when: { flag: 'depenses', min: 2 },
      text: 'Ton argent part dans les goûters, et du coup pas dans le projet. Chaque euro dépensé est un euro que tu ne dépenseras pas ailleurs. C’est le prix de tes choix.',
      causes: [{ facteur: 'dépenses du quotidien', seuil: '2', poids: 2 }],
    },
    explanations: {
      cours: {
        label: 'Suivre un cours',
        text: 'En cours : le coût d’opportunité, c’est ce qu’on sacrifie quand on choisit. Dormir une heure de plus, c’est renoncer à une heure de révision — ou de jeu.',
      },
      livre: {
        label: 'Lire un livre',
        text: 'Un chapitre parle d’un forgeron qui doit choisir : réparer une charrue ou forger des clous. Le prix des clous, c’est la charrue qu’il n’a pas réparée.',
      },
      fantome: {
        label: 'Écouter la voix',
        text: 'Une voix songeuse : « Tout choix cache un renoncement. Regarde ce que tu abandonnes, tu verras le vrai prix de ce que tu fais. »',
      },
    },
    applicationAction: 'comptes',
  },
  {
    id: 'prix_rarete',
    name: 'Prix et rareté',
    summary: 'Pourquoi ça coûte ce que ça coûte : la rareté, la demande, et le prix.',
    characteristic: 'comprehension',
    gain: 3,
    discover: {
      when: { flag: 'marchandages', min: 1 },
      text: 'Le drive vend moins cher que Mme Bertin. Pourquoi ? Parce qu’il achète en énorme quantité, et que la rareté ne joue pas pour lui. Le prix n’est pas magique.',
      causes: [{ facteur: 'discussions sur les prix avec Mme Bertin', seuil: '1', poids: 2 }],
    },
    explanations: {
      cours: {
        label: 'Suivre un cours',
        text: 'Le prix, dit la prof, se joue entre ce qu’il y a (la rareté) et ce qu’on veut (la demande). Trop d’objets, le prix baisse. Pas assez, il monte.',
      },
      livre: {
        label: 'Lire un livre',
        text: 'Un récit de marché : l’année où les oranges ont gelé, leur prix a flambé. Pas de magie — juste la rareté.',
      },
      fantome: {
        label: 'Écouter la voix',
        text: 'Une voix précise : « Demande-toi toujours ce qui est rare. Celui qui comprend la rareté comprend le prix. »',
      },
    },
    applicationAction: 'reparer',
  },
  {
    id: 'confiance_incitations',
    name: 'Confiance et incitations',
    summary: 'On tient ses promesses quand on y gagne quelque chose — et la confiance se construit sur les promesses tenues.',
    characteristic: 'confiance',
    gain: 3,
    discover: {
      when: { flag: 'arbitrages', min: 1 },
      text: 'Quand tu arbitres, les gens t’écoutent. Pourquoi ? Parce qu’ils te font confiance. Et la confiance, ça se construit à chaque promesse tenue.',
      causes: [{ facteur: 'arbitrage mené à bien', seuil: '1', poids: 3 }],
    },
    explanations: {
      cours: {
        label: 'Suivre un cours',
        text: 'La confiance, explique Mme Moreau, c’est le raccourci des accords : on coopère plus vite quand on croit que l’autre tiendra parole. Les incitations rendent la parole plus facile à tenir.',
      },
      livre: {
        label: 'Lire un livre',
        text: 'Un livre raconte des villages où chacun prête ses outils. Le premier tricheur perd tout : plus personne ne lui prête. La confiance est un capital.',
      },
      fantome: {
        label: 'Écouter la voix',
        text: 'Une voix calme : « La confiance ne se décrète pas. Elle se gagne, promesse tenue après promesse tenue — et elle se perd en une seule. »',
      },
    },
    applicationAction: 'recruter',
  },
  {
    id: 'prevision_incertaine',
    name: 'Prévoir, c’est parier',
    summary: 'Une prévision n’est jamais sûre : c’est un pari qu’on peut corriger — et qu’on apprend à mesurer.',
    characteristic: 'comprehension',
    gain: 5, // + prix_rarete (+3) : 42 + 8 = 50 → seuil de Ricardo (§6) atteignable
    discover: {
      when: { flag: 'previsionsRatees', min: 1 },
      text: 'Ta prévision s’est trompée. Le temps, la demande, les gens : rien n’était exactement comme tu l’avais calculé. Prévoir, ce n’est pas connaître l’avenir — c’est parier avec méthode.',
      causes: [{ facteur: 'prévision ratée', seuil: '1', poids: 3 }],
    },
    explanations: {
      cours: {
        label: 'Suivre un cours',
        text: 'Mme Moreau l’écrit au tableau : une prévision, c’est une hypothèse chiffrée. Elle vaut mieux que rien, à condition de la corriger dès que le réel répond.',
      },
      livre: {
        label: 'Lire un livre',
        text: 'Un livre raconte des météorologues qui notent leurs ratés depuis cent ans. C’est en comptant leurs erreurs qu’ils sont devenus bons — jamais en les cachant.',
      },
      fantome: {
        label: 'Écouter la voix',
        text: 'Une voix sèche et joyeuse : « La fourmi traverse la plage : la complexité venait du sable, pas d’elle. Note tes ratés, jeune ami — c’est ton carnet qui décide. »',
      },
    },
    applicationAction: 'prevision',
  },
  {
    id: 'alliances_durables',
    name: 'Les alliances durables',
    summary: 'Convaincre une fois, c’est un accord. Rassembler des gens qui reviennent, c’est une alliance.',
    characteristic: 'influence',
    gain: 20, // + égalité/équité/incitation (+3) : 35 + 23 = 58 → seuil de Machiavel (§6) atteignable
    discover: {
      when: { flag: 'recrutements', min: 2 },
      text: 'Deux personnes ont rejoint ton stand. Elles ne sont pas venues pour un goûter : elles sont venues parce qu’elles croient que ça peut marcher — avec toi.',
      causes: [{ facteur: 'membres recrutés', seuil: '2', poids: 3 }],
    },
    explanations: {
      cours: {
        label: 'Suivre un cours',
        text: 'En classe : une alliance tient quand chacun y gagne ET y est respecté. Le jour où l’un des deux n’y gagne plus, l’alliance ne tient plus.',
      },
      livre: {
        label: 'Lire un livre',
        text: 'Un livre d’histoire raconte des cités marchandes unies par des traités. Celles qui ont duré tenaient leurs promesses — les autres se faisaient la guerre au premier hiver.',
      },
      fantome: {
        label: 'Écouter la voix',
        text: 'Une voix toscane : « La fortune est un fleuve, mon prince. On ne le traverse pas seul. Choisis tes alliés, tiens-leur parole — et compte ceux qui reviennent. »',
      },
    },
    applicationAction: 'recruter',
  },
];

export const NOTION_BY_ID: Record<string, NotionDef> = Object.fromEntries(NOTIONS.map((n) => [n.id, n]));
