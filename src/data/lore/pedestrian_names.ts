/**
 * 120 noms et prénoms réalistes pour la génération de piétons à Val-Ferrand.
 * Reflète la sociologie d'une ville moyenne ouvrière française (racines locales,
 * migrations métallurgiques et minières italiennes, espagnoles, polonaises et maghrébines).
 * Référence : docs/ANTIGRAVITY-BRIEF-2026-10-07.md (tâche A-3.3).
 */

export const PEDESTRIAN_FIRST_NAMES: readonly string[] = [
  // Filles & Femmes
  'Camille', 'Léa', 'Inès', 'Sarah', 'Manon', 'Chloé', 'Emma', 'Julie', 'Nour', 'Lucie',
  'Monique', 'Simone', 'Yasmine', 'Fatima', 'Colette', 'Sylvie', 'Hélène', 'Valérie', 'Samira', 'Claire',
  'Elena', 'Rosa', 'Kenza', 'Juliette', 'Marie', 'Salma', 'Pauline', 'Amélie', 'Zohra', 'Océane',
  'Margaux', 'Aurore', 'Roxane', 'Nathalie', 'Mélanie', 'Khadija', 'Nadia', 'Céline', 'Sabrina', 'Élise',
  'Alice', 'Mathilde', 'Noémie', 'Louise', 'Lucile', 'Adèle', 'Bérénice', 'Jeanne', 'Diane', 'Perrine',
  'Sofia', 'Maria', 'Dounia', 'Amina', 'Myriam', 'Assia', 'Lila', 'Clémence', 'Émilie', 'Audrey',

  // Garçons & Hommes
  'Noah', 'Samir', 'Karim', 'Lucas', 'Hugo', 'Arthur', 'Maxime', 'Enzo', 'Thomas', 'Antoine',
  'Jean-Luc', 'Nadir', 'Marc', 'Serge', 'Philippe', 'Gilles', 'Baptiste', 'Yannick', 'Bruno', 'Damien',
  'Hervé', 'Christian', 'Éric', 'Mehdi', 'Sofiane', 'Rachid', 'Julien', 'Alexandre', 'Romain', 'Valentin',
  'Clément', 'Théo', 'Mathieu', 'Florian', 'Quentin', 'Benjamin', 'Adrien', 'Guillaume', 'Benoît', 'Nicolas',
  'Fabien', 'Vincent', 'Laurent', 'Stéphane', 'Christophe', 'David', 'Patrick', 'Michel', 'Alain', 'Bernard',
  'Malik', 'Idriss', 'Youssef', 'Tariq', 'Bilal', 'Mateo', 'Lorenzo', 'Marco', 'Paolo', 'Gabriel',
] as const;

export const PEDESTRIAN_LAST_NAMES: readonly string[] = [
  // Noms locaux & Vallée du Taret
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'Andre', 'Lefevre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'Francois', 'Martinez',
  'Legrand', 'Garnier', 'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas',
  'Perrin', 'Morin', 'Mathieu', 'Clement', 'Gauthier', 'Dumont', 'Lopez', 'Fontaine', 'Chevalier', 'Robin',

  // Mémoire industrielle & migrations métallurgiques (Polonais, Italiens, Espagnols, Maghrébins)
  'Bouzid', 'Mansouri', 'Belkacem', 'Zeroual', 'Benali', 'Diallo', 'Kessler', 'Kowalski', 'Nowak', 'Wisniewski',
  'Rossi', 'Moretti', 'Bianchi', 'Ferrari', 'Ricci', 'Romano', 'Gallo', 'Esposito', 'Conti', 'De Luca',
  'Fernandez', 'Gonzalez', 'Rodriguez', 'Sanchez', 'Perez', 'Gomez', 'Ruiz', 'Diaz', 'Alvarez', 'Torres',
  'Haddad', 'Amrani', 'Bennani', 'Kacemi', 'Saidi', 'Messaoudi', 'Dahmani', 'Slimani', 'Brahimi', 'Hamidi',
  'Vasseur', 'Le Gall', 'Maréchal', 'Tardieu', 'Vautrin', 'Levêque', 'Sorel', 'Chardin', 'Morvan', 'Renaud',
  'Meunier', 'Klein', 'Caron', 'Dupuis', 'Bertin', 'Pujol', 'Giraud', 'de Saint-Amand', 'Kaci', 'Traoré',
] as const;

/**
 * Générateur déterministe simple de passants pour peupler les trottoirs 3D.
 */
export function generateRandomPedestrianName(seedIndex: number): { firstName: string; lastName: string; fullName: string } {
  const firstName = PEDESTRIAN_FIRST_NAMES[seedIndex % PEDESTRIAN_FIRST_NAMES.length]!;
  const lastName = PEDESTRIAN_LAST_NAMES[(seedIndex * 7 + 13) % PEDESTRIAN_LAST_NAMES.length]!;
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
  };
}
