/**
 * Vie au collège : premiers événements (Antigravity livre la suite dans src/data/school/events.ts,
 * workflow AG-2 phase 5). Textes neutres en genre ; `{prenom}` remplacé par le moteur.
 */
export interface SchoolEvent {
  id: string;
  title: string;
  text: string;
  characters: string[];
  minAge?: number;
  tier?: number;
  options: {
    label: string;
    ghost: string;
    advice: string;
    outcome: string;
    effects: { relations?: Record<string, number>; average?: number; stress?: number; moral?: number; reputation?: number; pride?: number };
  }[];
}

export const STARTER_SCHOOL_EVENTS: readonly SchoolEvent[] = [
  {
    id: 'delegue', title: 'Élection des délégués de classe', characters: ['lina', 'noah'],
    text: 'Mme Moreau annonce l’élection des délégués. Lina se présente. Noah te pousse du coude : « Vas-y, toi. Tout le monde t’achète des goûters, tout le monde votera pour toi. »',
    options: [
      { label: 'Te présenter contre Lina', ghost: 'machiavel', advice: 'Le pouvoir se prend quand il se présente. Tu as déjà une clientèle : fais-en des électeurs.', outcome: 'Tu gagnes de deux voix. Lina te félicite du bout des lèvres.', effects: { relations: { lina: -6, noah: 4 }, reputation: 3, stress: 4 } },
      { label: 'Soutenir Lina et faire campagne pour elle', ghost: 'ostrom', advice: 'Une bonne règle choisie ensemble vaut mieux qu’un chef. Aide celle qui sait écrire les règles.', outcome: 'Lina est élue. Elle te glisse : « Je n’oublierai pas. »', effects: { relations: { lina: 8 }, moral: 3 } },
    ],
  },
  {
    id: 'triche', title: 'Un contrôle et une photo qui circule', characters: ['noah'],
    text: 'La veille du contrôle de maths, Noah te montre une photo du sujet volée dans la salle des profs. « Je te l’envoie ? Ça t’évite de réviser ce soir, tu as ton stand. »',
    options: [
      { label: 'Refuser et réviser', ghost: 'weber', advice: 'Une réussite volée ne vaut rien : la confiance se bâtit sur la règle tenue quand personne ne regarde.', outcome: 'Tu révises tard. 15/20, honnêtement gagné.', effects: { average: 0.4, stress: 6, relations: { noah: -2 }, pride: 2 } },
      { label: 'Prendre la photo', ghost: 'machiavel', advice: 'Tout le monde l’aura. Ne te pénalise pas par principe.', outcome: 'Le prof change le sujet au dernier moment : il savait. Toute la classe est punie.', effects: { average: -0.3, stress: 8, reputation: -2 } },
      { label: 'Prévenir Mme Moreau sans donner de nom', ghost: 'rousseau', advice: 'Le contrat commun protège tout le monde, même ceux qui le trahissent.', outcome: 'Le sujet est changé discrètement. Noah ne saura jamais qui.', effects: { average: 0.2, relations: { noah: 1 }, moral: 2 } },
    ],
  },
  {
    id: 'harcelement', title: 'Le nouveau près des casiers', characters: ['yasmine'],
    text: 'Trois troisièmes coincent un nouvel élève près des casiers et vident son sac par terre. Yasmine te regarde : « On fait quelque chose ? »',
    options: [
      { label: 'Intervenir avec Yasmine', ghost: 'dejours', advice: 'Ce qu’on laisse faire aux autres finit par nous abîmer aussi. Va.', outcome: 'Les grands reculent devant deux voix. Le nouveau s’appelle Malik ; il dessine des logos incroyables.', effects: { relations: { yasmine: 8 }, reputation: 3, stress: 5, moral: 5 } },
      { label: 'Aller chercher M. Haddad, le CPE', ghost: 'weber', advice: 'L’institution existe pour ça. Utilise-la.', outcome: 'M. Haddad arrive vite. Sanction, convocation des parents des grands.', effects: { relations: { yasmine: 3 }, moral: 2 } },
      { label: 'Passer ton chemin', ghost: 'hobbes', advice: 'Chacun pour sa peau. Tu as assez de batailles.', outcome: 'Tu passes. Yasmine ne te parle plus de la journée.', effects: { relations: { yasmine: -8 }, moral: -4 } },
    ],
  },
  {
    id: 'expo_metiers', title: 'Forum des métiers au gymnase', characters: ['lina'],
    text: 'Le forum des métiers : un banquier, une infirmière, un ingénieur du laminoir… et un stand vide. M. Haddad te propose de parler de ton commerce aux sixièmes.',
    options: [
      { label: 'Présenter ton affaire', ghost: 'schumpeter', advice: 'Raconte ce que tu inventes : c’est la meilleure publicité qui soit.', outcome: 'Vingt sixièmes posent des questions. Trois veulent travailler pour toi.', effects: { reputation: 4, pride: 4, stress: 3 } },
      { label: 'Écouter l’ingénieur du laminoir', ghost: 'ricardo', advice: 'Apprends ce que d’autres font mieux que toi avant de parler.', outcome: 'Il parle de 2032 avec inquiétude. Tu prends des notes sur la vallée.', effects: { average: 0.2, moral: 1 } },
    ],
  },
  {
    id: 'cantine', title: 'La cantine augmente ses prix', characters: ['noah', 'yasmine'],
    text: 'Le repas de la cantine passe de 3,20 € à 3,80 €. Des familles des Roses ne pourront plus payer. Yasmine veut lancer une pétition, Noah veut vendre des sandwichs moins chers devant la grille.',
    options: [
      { label: 'Signer et porter la pétition', ghost: 'marx', advice: 'Quand le prix exclut, c’est le prix qu’il faut changer, pas les gens.', outcome: 'Deux cents signatures. Le conseil départemental crée un tarif social.', effects: { relations: { yasmine: 6 }, reputation: 3 } },
      { label: 'Vendre des sandwichs avec Noah', ghost: 'smith', advice: 'Une demande non servie est une affaire, mon ami. Sers-la.', outcome: 'Vous vendez tout le premier jour… et le principal vous l’interdit le troisième.', effects: { relations: { noah: 6 }, reputation: -1, stress: 3 } },
    ],
  },
  {
    id: 'conseil_classe', title: 'Conseil de classe du trimestre', characters: [],
    text: 'Le bulletin arrive. Le professeur principal a écrit : « Élève brillant·e mais dispersé·e. » Tes parents le lisent ce soir.',
    options: [
      { label: 'Leur montrer toi-même avant qu’ils le trouvent', ghost: 'rousseau', advice: 'La sincérité désarme. Dis-le avant qu’on te le dise.', outcome: 'Thierry sourit à « brillant », Nora soupire à « dispersé ». Ils te remercient d’être venu·e en parler.', effects: { pride: 3, moral: 2 } },
      { label: 'Laisser le bulletin au fond du sac', ghost: 'machiavel', advice: 'Ce qu’ils ne savent pas ne les inquiète pas.', outcome: 'L’application du collège l’envoie quand même à Nora à 2 h du matin, pendant sa garde.', effects: { pride: -3, stress: 6 } },
    ],
  },
];
