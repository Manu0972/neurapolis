/**
 * Les 8 PNJ de niveau A de la slice — Cité des Roses, Val-Ferrand.
 * Lore réutilisé : friche Taret, TaretCoop (PDF 2), Noah Martin (Bible §7),
 * citoyens récurrents Karim / Monique / Samir (PDF 2).
 */
import type { NpcDef } from '../core/types';

export const NPCS: NpcDef[] = [
  {
    id: 'noah', name: 'Noah Martin', age: 12, role: 'Ami proche · collège des Roses',
    traits: ['Créatif', 'Sociable', 'Impulsif', 'Sensible à la reconnaissance'],
    color: '#4ea1ff',
    routine: [
      { from: '07:00', to: '08:20', place: 'maison', activity: 'prépare son sac' },
      { from: '08:20', to: '16:40', place: 'college', activity: 'en cours' },
      { from: '16:40', to: '18:00', place: 'parc', activity: 'skate avec les copains' },
      { from: '18:00', to: '21:30', place: 'maison', activity: 'dessine chez lui', weekends: true },
    ],
    topics: {
      accueil: ['Hé, tu viens au parc ce soir ? J’ai fabriqué un nouveau design de skate.',
        'T’as vu la friche ? On pourrait faire un spot de fou là-bas.'],
      projet: ['Un stand de goûters ? Génial. Mais attention, Lina va vouloir tout organiser.',
        'Si on vend mes dessins en plus des bonbons, on gagne plus, tu crois pas ?'],
      argent: ['Moi j’ai tout dépensé en cartes. Faut qu’on trouve un truc pour gagner du fric.'],
    },
  },
  {
    id: 'lina', name: 'Lina Kessler', age: 12, role: 'Camarade de classe',
    traits: ['Organisée', 'Prudente', 'Bonnes notes', 'Discrète'],
    color: '#5cd6e8',
    routine: [
      { from: '07:00', to: '08:20', place: 'maison', activity: 'petit-déjeuner' },
      { from: '08:20', to: '16:40', place: 'college', activity: 'en cours' },
      { from: '16:40', to: '17:30', place: 'college', activity: 'étude' },
      { from: '17:30', to: '19:00', place: 'epicerie', activity: 'aide sa mère', weekends: true },
    ],
    topics: {
      accueil: ['J’ai noté tout le programme de la semaine. Toi aussi ?',
        'Mme Bertin dit que l’épicerie perd des clients. Ça m’inquiète.'],
      projet: ['Si on fait un stand, il faut des rôles clairs et une caisse séparée. Sinon ça finit mal.',
        'Je peux tenir les comptes. Mais il faudra décider comment on partage. À l’avance.'],
      ecole: ['Le contrôle de maths approche. Tu révises comment, toi ?'],
    },
  },
  {
    id: 'yasmine', name: 'Yasmine Diallo', age: 13, role: 'Déléguée de classe',
    traits: ['Curieuse', 'Bavarde', 'Sait tout sur tout le monde'],
    color: '#ff8fc0',
    routine: [
      { from: '07:00', to: '08:20', place: 'maison', activity: 'réveil difficile' },
      { from: '08:20', to: '16:40', place: 'college', activity: 'en cours' },
      { from: '16:40', to: '19:00', place: 'place', activity: 'discute avec tout le monde', weekends: true },
    ],
    topics: {
      accueil: ['Tu savais que le fils de Mme Bertin veut vendre l’épicerie ? Enfin, c’est ce qu’on dit.',
        'Ton truc du stand, toute la classe en parle déjà.'],
      quartier: ['La mairie veut « réaménager » la friche. Personne sait ce que ça veut dire.'],
    },
  },
  {
    id: 'karim', name: 'Karim Bensalah', age: 34, role: 'Ancien ouvrier de l’usine Taret',
    traits: ['Ouvrier pragmatique', 'Fier', 'Au chômage depuis 8 mois'],
    color: '#ffc94a',
    routine: [
      { from: '08:00', to: '12:00', place: 'place', activity: 'cherche des annonces' },
      { from: '12:00', to: '14:00', place: 'maison', activity: 'déjeuner' },
      { from: '14:00', to: '18:00', place: 'friche', activity: 'bricole dans la friche', weekends: true },
    ],
    topics: {
      accueil: ['L’usine a fermé, mais mes mains savent encore faire. Le problème, c’est le travail qui manque.',
        'Toi, le gamin, tu ris. Profite. Après, ça se complique.'],
      travail: ['Trente ans j’ai donné à Taret. À la fin, même pas un merci.'],
      friche: ['Dans cette friche, y’a tout pour un atelier. Il manque juste quelqu’un qui croit.'],
    },
  },
  {
    id: 'monique', name: 'Monique Petitjean', age: 71, role: 'Retraitée · comité de quartier',
    traits: ['Mémoire du quartier', 'Vigilante', 'Généreuse avec les enfants'],
    color: '#b78bff',
    routine: [
      { from: '09:00', to: '11:00', place: 'epicerie', activity: 'fait ses courses en discutant', weekends: true },
      { from: '14:00', to: '17:00', place: 'parc', activity: 'sur le banc des anciens', weekends: true },
    ],
    topics: {
      accueil: ['Je suis née dans cette rue. Je connais les coins. On veut pas de bruit, ni de voiture qui klaxonne.',
        'Tiens, le petit entrepreneur. Ta mère doit être fière.'],
      epicerie: ['Sans l’épicerie, les vieux comme moi, on fait comment ? Le drive, moi j’y comprends rien.'],
      histoire: ['Avant, l’usine tournait jour et nuit. On entendait les sirènes changer de poste.'],
    },
  },
  {
    id: 'samir', name: 'Samir Ould-Ali', age: 41, role: 'Fondateur de la coopérative TaretCoop',
    traits: ['Entrepreneur local', 'Tenace', 'Croit au collectif'],
    color: '#3ddc84',
    routine: [
      { from: '08:30', to: '12:30', place: 'friche', activity: 'réunit la coopérative', weekends: true },
      { from: '13:30', to: '17:30', place: 'place', activity: 'démarche des partenaires', weekends: true },
    ],
    topics: {
      accueil: ['TaretCoop, c’est neuf personnes et un rêve : rouvrir un atelier dans la friche.',
        'Les jeunes comme toi, vous êtes notre argument principal devant la mairie.'],
      coop: ['Une coopérative, c’est une voix par tête. Même le gamin de douze ans a sa voix, tu sais.'],
      conseil: ['Un truc que j’ai appris : le client te dit ce qu’il veut. Ton compteur te dit la vérité.'],
    },
  },
  {
    id: 'bertin', name: 'Mme Bertin', age: 58, role: 'Épicière de la Cité des Roses',
    traits: ['Travailleuse', 'Inquiète pour son commerce', 'Connaît tout le monde'],
    color: '#ff9a5c',
    routine: [
      { from: '07:30', to: '13:00', place: 'epicerie', activity: 'tient la boutique', weekends: true },
      { from: '14:30', to: '19:30', place: 'epicerie', activity: 'inventaire et caisse', weekends: true },
    ],
    topics: {
      accueil: ['Prends un caramel. Tu es le seul client qui traîne, aujourd’hui.',
        'Le drive de la grande surface me mange. Deux euros de moins sur tout. Comment je veux rivaliser ?'],
      service: ['Si tu me rends service, je te fais un prix. Mais il faut être sérieux, hein.'],
      quartier: ['Quand l’usine a fermé, j’ai gardé le crédit ouvert trois mois. On se souvient de ça, ici.'],
    },
  },
  {
    id: 'moreau', name: 'Mme Moreau', age: 39, role: 'Professeure principale · 5e B',
    traits: ['Exigeante', 'Juste', 'Cherche à faire réfléchir'],
    color: '#8a9bb8',
    routine: [
      { from: '08:00', to: '12:00', place: 'college', activity: 'enseigne' },
      { from: '13:00', to: '17:00', place: 'college', activity: 'corrige et prépare', weekends: true },
    ],
    topics: {
      cours: ['Intéressant, ton problème de partage. Égalité, équité, incitation : trois justices différentes.',
        'Les théories ne tombent pas du ciel. Elles sont nées de problèmes réels. Comme le tien.'],
      conseil: ['Si tu veux comprendre le commerce, commence par demander à Mme Bertin ce qui la fait vivre — ou mourir.'],
    },
  },
];

export const NPC_BY_ID: Record<string, NpcDef> = Object.fromEntries(NPCS.map((n) => [n.id, n]));

export interface MemoryTopicLine {
  memoryId: string;
  topic: string;
  lines: string[];
}

export const NPC_MEMORY_TOPICS: Record<string, MemoryTopicLine[]> = {
  bertin: [
    {
      memoryId: 'mem_epicerie_difficulte',
      topic: 'accueil',
      lines: [
        'Le drive me fait du mal... L’épicerie est vraiment en difficulté ces temps-ci.',
        'Les clients se font rares avec cette grande surface. Je ne sais pas combien de temps je vais tenir.',
      ],
    },
    {
      memoryId: 'mem_epicerie_difficulte',
      topic: 'epicerie',
      lines: [
        'Si la vitalité de la boutique baisse encore, je devrai fermer plus tôt.',
      ],
    },
    {
      memoryId: 'mem_epicerie_embauche',
      topic: 'accueil',
      lines: [
        'L’activité repart fort ! Je cherche même quelqu’un pour m’aider à l’épicerie.',
        'C’est un plaisir de voir du monde en boutique. On revit !',
      ],
    },
    {
      memoryId: 'mem_epicerie_embauche',
      topic: 'epicerie',
      lines: [
        'Les affaires marchent tellement bien que j’envisage d’embaucher un renfort.',
      ],
    },
    {
      memoryId: 'mem_soutien_courses',
      topic: 'service',
      lines: [
        'Merci pour les livraisons de courses. Ce soutien me redonne vraiment du baume au cœur.',
        'Grâce aux livraisons que vous faites aux anciens, la boutique garde un lien fort avec le quartier.',
      ],
    },
    {
      memoryId: 'mem_soutien_courses',
      topic: 'accueil',
      lines: [
        'Ah, te voilà ! Merci encore pour le coup de main avec les courses des aînés.',
      ],
    },
  ],
  noah: [
    {
      memoryId: 'mem_stand_reussite_collective',
      topic: 'projet',
      lines: [
        'Notre stand collectif marche du tonnerre ! C’est trop fort de bosser ensemble avec l’équipe.',
        'T’as vu les ventes ? Le travail d’équipe paye vraiment !',
      ],
    },
    {
      memoryId: 'mem_stand_reussite_collective',
      topic: 'accueil',
      lines: [
        'Salut ! Je repensais au stand collectif, on a géré de ouf !',
      ],
    },
    {
      memoryId: 'mem_soutien_quartier',
      topic: 'accueil',
      lines: [
        'Tout le monde parle en bien de nos initiatives dans le quartier, ça fait trop plaisir !',
      ],
    },
  ],
  samir: [
    {
      memoryId: 'mem_stand_reussite_collective',
      topic: 'coop',
      lines: [
        'La réussite collective de votre stand prouve la force du modèle coopératif : une voix, de la solidarité !',
        'Voir les jeunes réussir ensemble au stand, c’est exactement l’esprit qu’on veut insuffler à TaretCoop.',
      ],
    },
    {
      memoryId: 'mem_stand_reussite_collective',
      topic: 'accueil',
      lines: [
        'Bravo pour le succès du stand collectif. Vous montrez la voie à tout le quartier !',
      ],
    },
    {
      memoryId: 'mem_soutien_quartier',
      topic: 'accueil',
      lines: [
        'Quand le quartier se serre les coudes, la friche et les commerces locaux revivent.',
      ],
    },
    {
      memoryId: 'mem_soutien_quartier',
      topic: 'conseil',
      lines: [
        'Le soutien du quartier est notre plus grand atout. Continuez d’associer les habitants à vos projets.',
      ],
    },
    {
      memoryId: 'mem_epicerie_difficulte',
      topic: 'accueil',
      lines: [
        'L’épicerie de Mme Bertin souffre face à la grande surface, il faut trouver des solutions collectives.',
      ],
    },
  ],
};
