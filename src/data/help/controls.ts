/**
 * Aide du jeu (V1.1, lot A) : « à quoi sert ce bouton ? ».
 * Un seul registre pour tout l'écran : chaque élément annoté `data-help="<id>"` a sa fiche ici,
 * et chaque fenêtre (par son titre) peut avoir sa fiche « ❓ ». Les textes décrivent les commandes
 * et les règles, jamais ce qui va arriver dans l'histoire.
 */

export interface HelpEntry {
  title: string;
  body: string;
  /** Raccourci clavier, s'il y en a un. */
  key?: string;
}

/** Fiches des éléments de l'interface en jeu, par identifiant `data-help`. */
export const CONTROL_HELP: Readonly<Record<string, HelpEntry>> = {
  // ---------- Carte d'état (haut gauche) ----------
  clock: { title: 'Heure, date et météo', body: 'L’heure et le jour dans le jeu. La météo change l’humeur des gens, tes ventes et ce qu’on a envie d’acheter.' },
  'pace:pause': { title: 'Pause', body: 'Le temps s’arrête. Tes actions (parler, acheter, travailler) le font quand même avancer de leur durée.' },
  'pace:reel': { title: 'Temps réel', body: 'Une minute de jeu dure une vraie minute. Pour flâner et tout regarder.' },
  'pace:lent': { title: 'Lent', body: 'Une minute de jeu dure 4 secondes.' },
  'pace:normal': { title: 'Normal', body: 'Une minute de jeu dure 1 seconde. L’allure conseillée.' },
  'pace:rapide': { title: 'Rapide (×5)', body: 'Le temps file cinq fois plus vite qu’en normal. Pratique pour attendre une heure précise.' },
  'pace:tres_rapide': { title: 'Très rapide (×20)', body: 'Le temps file vingt fois plus vite. Les fenêtres importantes mettent quand même le jeu en pause.' },
  'task-toggle': { title: 'Les actions prennent du temps', body: 'Allumé : parler, acheter, travailler ou décharger fait avancer l’horloge de la durée de l’action. Éteint : les actions sont instantanées.' },
  skip: { title: 'Passer le temps', body: 'Finir la journée, passer la semaine, le mois ou les vacances. Tout est vraiment simulé (cours, repas, tes affaires), puis un bilan s’affiche. Le saut s’arrête tout seul si quelque chose d’important arrive.' },
  multi: { title: 'Multijoueur', body: 'Jouer à plusieurs en réseau local ou via NordVPN Meshnet. Chacun vit sa propre vie dans la même ville : vous pouvez vous associer, vous prêter de l’argent… ou vous saboter.' },
  'need:fatigue': { title: 'Fatigue', body: 'Monte quand tu marches, travailles ou veilles. Dors chez toi pour la faire baisser. Trop fatigué, tu apprends et vends moins bien.' },
  'need:faim': { title: 'Faim', body: 'Monte avec le temps. Mange (à la maison, à la cantine, dans un commerce) pour la faire baisser.' },
  'need:stress': { title: 'Stress', body: 'Monte avec les soucis d’argent, les disputes et les échecs. Le repos, les amis et les loisirs le font baisser.' },
  'need:moral': { title: 'Moral', body: 'Ton humeur générale. Les réussites, les bons moments et les gens que tu aimes le font remonter.' },
  campaign: { title: 'Objectif du chapitre', body: 'Ce que tu cherches à accomplir en ce moment, avec ta progression. Clique pour replier ou déplier la carte.' },

  // ---------- Colonne droite ----------
  money: { title: 'Ton argent', body: 'L’argent que tu as sur toi. Il sert à acheter, investir et rembourser. S’il tombe à zéro, tes parents peuvent t’aider (Famille & collège).' },
  biz: { title: 'Tes affaires', body: 'Le résumé de tes commerces et projets en cours : ce qu’ils rapportent aujourd’hui.' },
  phone: { title: 'Téléphone', body: 'Messages, banque, contacts, achats (dont le vélo), applis du jeu. Le centre de ta vie de tous les jours.', key: 'P' },
  map: { title: 'Plan de la ville', body: 'Le grand plan de Val-Ferrand : les quartiers, les lieux importants, les arrêts de bus et où tu te trouves.', key: 'M' },
  menu: { title: 'Tous les panneaux', body: 'Ouvre le tiroir avec tous les panneaux du jeu (sauvegardes, personnage, relations, entreprises…), la caméra et le son.' },
  'ghost-companion': { title: 'Les fantômes', body: 'Les penseurs qui t’accompagnent. Quand l’un d’eux a quelque chose à dire, sa bulle apparaît : clique pour l’écouter.' },
  'help-btn': { title: 'Aide : qu’est-ce que c’est ?', body: 'Active le mode aide, puis clique sur n’importe quel bouton ou jauge pour savoir à quoi il sert. Échap pour sortir. Au survol, une bulle d’aide apparaît aussi toute seule.', key: 'F1' },

  // ---------- Bas de l'écran ----------
  minimap: { title: 'Mini-carte', body: 'Ce qu’il y a autour de toi, le nord en haut. Le nom de la rue est écrit dessous. Pour le grand plan, touche M.' },
  news: { title: 'Fil d’actualité', body: 'Les nouvelles de la ville et de l’économie. Elles peuvent changer les prix et ce que les gens achètent.' },
  'action-btn': { title: 'Interagir', body: 'Parler, entrer, acheter, utiliser : quand quelque chose est à portée, son nom s’affiche en bas de l’écran.', key: 'E' },
  'ghost-bar': { title: 'Barre des fantômes', body: 'Les têtes des penseurs qui veulent te parler. Elles bougent quand l’un d’eux a un conseil ou un avis.' },

  // ---------- Caméra et son ----------
  'cam:rotl': { title: 'Pivoter à gauche', body: 'Tourne la caméra autour de ton personnage. Tu peux aussi faire un clic glissé.', key: 'R' },
  'cam:rotr': { title: 'Pivoter à droite', body: 'Tourne la caméra autour de ton personnage. Tu peux aussi faire un clic glissé.', key: 'T' },
  'cam:view': { title: 'Vue rue / plongée', body: 'Passe de la vue à hauteur de rue à la vue de dessus.', key: 'V' },
  'cam:zin': { title: 'Zoom avant', body: 'Rapproche la caméra. La molette marche aussi.' },
  'cam:zout': { title: 'Zoom arrière', body: 'Éloigne la caméra. La molette marche aussi.' },
  'cam:3d': { title: '3D ou plan 2D', body: 'Bascule entre la ville en 3D et un plan 2D plus léger, utile sur un ordinateur peu puissant.' },
  'cam:mute': { title: 'Son', body: 'Coupe ou rallume tous les sons du jeu.' },

  // ---------- Tiroir des panneaux ----------
  'nav:💾 Sauvegardes': { title: 'Sauvegardes', body: 'Enregistrer dans un emplacement, recharger, exporter ta partie dans un fichier ou l’importer. Le jeu enregistre aussi tout seul chaque fin de journée.' },
  'nav:📱 Téléphone': { title: 'Téléphone', body: 'Le même que le bouton 📱 : messages, banque, contacts et applis.', key: 'P' },
  'nav:Personnage': { title: 'Personnage', body: 'Ta fiche : caractéristiques, compétences et leur progression, ton apparence.' },
  'nav:Relations': { title: 'Relations', body: 'Les gens que tu connais et ce qu’ils pensent de toi. Une bonne relation ouvre des portes.' },
  'nav:Stratégie / Carte': { title: 'Stratégie', body: 'Tes plans en plusieurs étapes pour atteindre un grand objectif.' },
  'nav:Entreprises & Rôles': { title: 'Entreprises & rôles', body: 'Tes commerces : stocks, prix, employés, résultats du jour.' },
  'nav:Marchands & Tiers': { title: 'Marchands', body: 'Les commerçants avec qui tu fais affaire. Plus tu es fidèle, plus tu obtiens de remises et d’exclusivités.' },
  'nav:Actualités & Chocs': { title: 'Actualités', body: 'Les événements économiques et ce qu’ils changent pour toi.' },
  'nav:Études & Famille': { title: 'Études & famille', body: 'Tes notes, le collège, tes parents, et l’aide qu’ils peuvent t’apporter.' },
  'nav:Chambre & plans': { title: 'Chambre & plans', body: 'Ta chambre, ton quartier général : les objets que tu as gagnés et ce qu’ils t’apportent.' },
  'nav:Carnets de Lucien': { title: 'Carnets de Lucien', body: 'Les carnets trouvés au début de l’aventure, à lire au fil du jeu.' },
  'nav:Projet': { title: 'Projet', body: 'Ton grand projet en cours et ce qu’il te reste à faire.' },
  'nav:Concurrence': { title: 'Concurrence', body: 'Les autres commerces qui vendent comme toi, leurs prix et leurs parts de marché.' },
  'nav:Conseil': { title: 'Conseil', body: 'Réunir les fantômes pour avoir leurs avis sur une décision.' },
  'nav:Journal': { title: 'Journal', body: 'Tout ce qui t’est arrivé, avec les raisons (« pourquoi ceci est arrivé ? »).' },
};

/** Fiches « ❓ » des fenêtres, par titre exact de la fenêtre. */
export const SCREEN_HELP: Readonly<Record<string, HelpEntry>> = {
  '📱 Téléphone': { title: 'Le téléphone', body: 'Chaque appli est une partie de ta vie : messages de tes proches, banque (argent, achats comme le vélo), contacts, actualités. Touche P pour l’ouvrir, Échap pour le fermer.' },
  '🗺️ Plan de Val-Ferrand': { title: 'Le plan', body: 'Toute la ville. Les quartiers grisés ne sont pas encore ouverts. Repère les lieux, les arrêts de bus et ta position. Touche M.' },
  '📅 Passer le temps': { title: 'Passer le temps', body: 'Choisis une durée : le jeu simule réellement chaque jour (cours, repas, sommeil, tes affaires). Si quelque chose d’important arrive, le saut s’arrête pour te laisser décider. Un bilan résume ce qui s’est passé.' },
  '📡 Multijoueur': { title: 'Jouer à plusieurs', body: 'L’hôte lance le serveur (bouton « Héberger » ou jouer-en-lan.bat), les autres entrent son adresse puis « Se connecter ». Chacun garde sa partie ; vous voyez vos avatars et pouvez vous proposer prêts, alliances ou coups bas.' },
  '💾 Sauvegardes': { title: 'Les sauvegardes', body: 'Plusieurs emplacements, plus la sauvegarde automatique de fin de journée. Exporte ta partie en fichier avant de changer d’ordinateur ou de navigateur.' },
  '👪 Famille & collège': { title: 'Famille & collège', body: 'Tes notes, les rendez-vous du collège, l’humeur de tes parents. S’il te manque de l’argent, tu peux leur demander de l’aide, contre un peu de leur confiance.' },
  '🧸 Ta chambre': { title: 'Ta chambre', body: 'Ton quartier général. Les objets posés ici te donnent des bonus ; certains se gagnent, d’autres s’achètent ou se fabriquent.' },
  '👕 Armoire': { title: 'L’armoire', body: 'Change de tenue. Ce que tu portes change la façon dont certains te voient.' },
  '🚌 Bus du Taret': { title: 'Le bus', body: 'Choisis ta destination : le trajet prend du temps de jeu et coûte un ticket, valable sur toutes les lignes avec correspondance.' },
  '🚆 Départs': { title: 'La gare', body: 'Partir quelques jours découvrir un autre territoire. Le temps passe pendant le voyage et tes affaires continuent de tourner sans toi.' },
  '📒 Carnet d’économie': { title: 'Le carnet d’économie', body: 'Les notions que tu as découvertes en jouant. Les quiz te permettent de les retenir et de débloquer la suite.' },
  '⏳ Remonter le temps': { title: 'Remonter le temps', body: 'Revenir à un moment passé de ta partie pour essayer un autre choix.' },
  'Ton personnage': { title: 'Ton personnage', body: 'Tes six caractéristiques et tes compétences. Elles progressent quand tu les utilises.' },
  'Tes relations': { title: 'Tes relations', body: 'Chaque personne a un niveau de confiance envers toi, qui monte ou descend selon ce que tu fais pour elle… ou contre elle.' },
  'Entreprises & Rôles': { title: 'Tes entreprises', body: 'Pour chaque commerce : prix, stock, qualité, employés et résultat du jour. Ajuste et regarde l’effet le lendemain.' },
  'Journal': { title: 'Le journal', body: 'L’historique de ta partie. Chaque entrée explique ses causes.' },
};
