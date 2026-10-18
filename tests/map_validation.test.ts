import { describe, expect, it } from 'vitest';
import { convertirPlacesEnCarte, validerCarte, type CarteSpec } from '../src/simulation/map_validation';
import { PLACES } from '../src/data/places';

describe('Validateur de cartes (map_validation)', () => {
  it('valide une carte correcte sans erreur', () => {
    const carteValide: CarteSpec = {
      lieux: [
        { id: 'maison', nom: 'Chez toi' },
        { id: 'place', nom: 'Place du marché' },
        { id: 'college', nom: 'Collège des Roses' },
      ],
      liaisons: [
        { de: 'maison', vers: 'place' },
        { de: 'place', vers: 'college' },
      ],
      depart: 'maison',
    };

    const erreurs = validerCarte(carteValide);
    expect(erreurs).toEqual([]);
  });

  it('détecte un identifiant de lieu dupliqué', () => {
    const carte: CarteSpec = {
      lieux: [
        { id: 'maison', nom: 'Chez toi' },
        { id: 'maison', nom: 'Deuxième maison' },
        { id: 'place', nom: 'Place du marché' },
      ],
      liaisons: [
        { de: 'maison', vers: 'place' },
      ],
      depart: 'maison',
    };

    const erreurs = validerCarte(carte);
    expect(erreurs.some((e) => e.includes('dupliqué') && e.includes('maison'))).toBe(true);
  });

  it('détecte un lieu avec un nom vide', () => {
    const carte: CarteSpec = {
      lieux: [
        { id: 'maison', nom: 'Chez toi' },
        { id: 'place', nom: '   ' },
      ],
      liaisons: [
        { de: 'maison', vers: 'place' },
      ],
      depart: 'maison',
    };

    const erreurs = validerCarte(carte);
    expect(erreurs.some((e) => e.includes('nom vide') && e.includes('place'))).toBe(true);
  });

  it('détecte une liaison vers un lieu inconnu', () => {
    const carte: CarteSpec = {
      lieux: [
        { id: 'maison', nom: 'Chez toi' },
        { id: 'place', nom: 'Place du marché' },
      ],
      liaisons: [
        { de: 'maison', vers: 'inconnu' },
      ],
      depart: 'maison',
    };

    const erreurs = validerCarte(carte);
    expect(erreurs.some((e) => e.includes('lieu inconnu') && e.includes('inconnu'))).toBe(true);
  });

  it('détecte une liaison en boucle (un lieu vers lui-même)', () => {
    const carte: CarteSpec = {
      lieux: [
        { id: 'maison', nom: 'Chez toi' },
        { id: 'place', nom: 'Place du marché' },
      ],
      liaisons: [
        { de: 'maison', vers: 'place' },
        { de: 'place', vers: 'place' },
      ],
      depart: 'maison',
    };

    const erreurs = validerCarte(carte);
    expect(erreurs.some((e) => e.includes('boucle') && e.includes('place'))).toBe(true);
  });

  it('détecte une liaison en double', () => {
    const carte: CarteSpec = {
      lieux: [
        { id: 'maison', nom: 'Chez toi' },
        { id: 'place', nom: 'Place du marché' },
      ],
      liaisons: [
        { de: 'maison', vers: 'place' },
        { de: 'place', vers: 'maison' },
      ],
      depart: 'maison',
    };

    const erreurs = validerCarte(carte);
    expect(erreurs.some((e) => e.includes('double') && (e.includes('maison') || e.includes('place')))).toBe(true);
  });

  it('détecte un lieu orphelin (inaccessible depuis le départ via BFS)', () => {
    const carte: CarteSpec = {
      lieux: [
        { id: 'maison', nom: 'Chez toi' },
        { id: 'place', nom: 'Place du marché' },
        { id: 'friche', nom: 'Friche Taret' },
      ],
      liaisons: [
        { de: 'maison', vers: 'place' },
      ],
      depart: 'maison',
    };

    const erreurs = validerCarte(carte);
    expect(erreurs.some((e) => e.includes('inaccessible') && e.includes('friche'))).toBe(true);
  });

  it('détecte un lieu de départ inexistant dans les lieux', () => {
    const carte: CarteSpec = {
      lieux: [
        { id: 'maison', nom: 'Chez toi' },
        { id: 'place', nom: 'Place du marché' },
      ],
      liaisons: [
        { de: 'maison', vers: 'place' },
      ],
      depart: 'inexistant',
    };

    const erreurs = validerCarte(carte);
    expect(erreurs.some((e) => e.includes('lieu de départ') && e.includes('inexistant'))).toBe(true);
  });

  it('valide la carte actuelle du jeu adaptée depuis PLACES', () => {
    // Les 6 lieux fondamentaux de Val-Ferrand connectés au réseau urbain
    const liaisonsValFerrand = [
      { de: 'maison', vers: 'place' },
      { de: 'place', vers: 'epicerie' },
      { de: 'place', vers: 'parc' },
      { de: 'place', vers: 'college' },
      { de: 'place', vers: 'friche' },
    ];

    const carteActuelle = convertirPlacesEnCarte(PLACES, liaisonsValFerrand, 'maison');
    const erreurs = validerCarte(carteActuelle);

    expect(erreurs).toEqual([]);
    expect(carteActuelle.lieux).toHaveLength(6);
  });
});
