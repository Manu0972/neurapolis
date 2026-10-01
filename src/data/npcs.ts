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
