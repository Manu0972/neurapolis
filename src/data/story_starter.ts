/**
 * Récit : premier jeu (Antigravity livre la version longue dans src/data/story/lucien.ts, qui
 * se branchera dans src/data/story_registry.ts). Textes neutres en genre ; `{prenom}` est
 * remplacé par le prénom du joueur.
 */
import type { StoryBeat } from '../core/story_types';

export const STARTER_ORIGIN: StoryBeat = {
  id: 'origine',
  trigger: { day: 0 },
  title: 'La nuit de la Maison du Peuple — 31 août 2020',
  pages: [
    'L’orage roule sur la vallée du Taret comme autrefois les marteaux-pilons de Taret-Acier. Demain, c’est la rentrée en cinquième au collège Jean-Moulin. Ce soir, {prenom} aide à vider la vieille bibliothèque du comité d’entreprise, au premier étage de la Maison du Peuple.',
    'Six mille livres, fermés depuis 2014, l’année où les hauts-fourneaux se sont éteints. Papy Lucien en a été le bibliothécaire bénévole pendant quarante ans. Il est mort l’automne dernier. Ses livres partent au pilon lundi.',
    'Un éclair, puis le noir : le courant saute dans toute la rue des Rosiers. Lampe de poche entre les dents, {prenom} grimpe sur l’escabeau pour attraper une dernière pile de volumes reliés de rouge. L’étagère gémit. La crémaillère cède.',
    'Les livres tombent comme de la suie. Quand {prenom} rouvre les yeux, couché sur le lino froid, des pages couvertes de l’écriture penchée de Lucien sont éparpillées partout. Certaines reliures sont bizarres : deux livres ennemis cousus ensemble, Ford avec Ohno, Smith avec Marx, Keynes avec Hayek.',
    'Et dans l’oreille droite, une voix calme, avec un accent écossais d’un autre siècle : « N’aie pas peur, mon enfant. Ce n’est pas de la bienveillance du boulanger que nous attendons notre pain, mais de son intérêt. Relève-toi. Cette ville est un marché qui ne sait pas encore qu’il respire. Je vais t’apprendre à l’entendre. »',
  ],
  note: 'En première page, au crayon : « Pour mon petit enfant. L’économie n’est pas une météo qui tombe du ciel. C’est une machine construite par des gens. Démonte-la, comprends-la, et remonte-la pour ceux qui n’ont que leurs bras. — Lucien »',
  ghost: 'smith',
};

export const STARTER_BEATS: readonly StoryBeat[] = [
  {
    id: 'cahier_1', trigger: { concepts: 1 }, title: 'Cahier n° 1 — Les billes de la cour',
    pages: [
      'Dans le cartable, un cahier d’écolier de 1958 : celui de Lucien, à douze ans. Il y tenait les comptes d’un trafic de billes dans la cour de l’école des Roses.',
      '« 3 agates contre 1 calot. Le calot est rare, donc il vaut plus. Mais si tout le monde veut des agates demain, c’est moi qui serai riche. » Il avait souligné « demain » deux fois.',
    ],
    note: '« Le prix, c’est ce que les autres croient que la chose vaudra. »',
    ghost: 'smith',
  },
  {
    id: 'cahier_2', trigger: { concepts: 3 }, title: 'Cahier n° 2 — Pourquoi relier les ennemis',
    pages: [
      'Une lettre glissée dans le Capital : Lucien explique au comité d’entreprise pourquoi il fait relier deux livres opposés sous une même couverture.',
      '« Un ouvrier qui ne lit qu’un camp se fait manipuler par l’autre. Je veux qu’ils se disputent dans la même reliure, comme ils se disputent dans nos têtes. C’est comme ça qu’on pense par soi-même. »',
    ],
    note: '« Écoute toujours les deux moitiés. Puis décide seul. »',
    ghost: 'marx',
  },
  {
    id: 'cahier_3', trigger: { tier: 2 }, title: 'Cahier n° 3 — L’hiver 1982',
    pages: [
      'Des photos jaunies : des ouvriers autour d’un feu de palettes devant les grilles de l’aciérie, en décembre 1982. Lucien, au premier rang, tient une thermos.',
      '« Trois semaines de grève. On a tenu parce que l’épicerie Bertin faisait crédit. Les petits commerces ont sauvé l’usine, cet hiver-là. Personne ne l’a jamais écrit. Alors je l’écris. »',
    ],
    note: '« Un quartier qui fait crédit à ses voisins est plus solide qu’une banque. »',
    ghost: 'ostrom',
  },
  {
    id: 'cahier_4', trigger: { tier: 3 }, title: 'Cahier n° 4 — Le 14 avril 2014',
    pages: [
      'La dernière coulée du haut-fourneau n° 2. Lucien avait 68 ans, il était venu en retraité, derrière les grilles. Thierry, ton père, était de l’équipe de nuit.',
      '« Ils ont dit : la conjoncture. Comme si c’était la pluie. Ce n’était pas la pluie, c’était une décision prise à Néo-Baie par des gens qui n’avaient jamais vu la flamme. »',
      'Sous la date, d’une écriture tremblée : « Un jour, quelqu’un d’ici prendra ces décisions-là. J’espère qu’il se souviendra de la flamme. »',
    ],
    ghost: 'keynes',
  },
];
