import { describe, expect, it } from 'vitest';
import { LANDMARKS } from '../src/data/city/landmarks';
import { PLACES } from '../src/data/places';
import { DISTRICTS } from '../src/data/districts/index';
import { CITY } from '../src/data/city/layout';

// Liste courte des grandes enseignes/marques réelles (moteurs de recherche, grande distribution, GAFA, constructeurs, etc.)
const FORBIDDEN_BRANDS = [
  'Amazon',
  'Google',
  'Apple',
  'Microsoft',
  'Facebook',
  'Twitter',
  'Instagram',
  'TikTok',
  'Uber',
  'Tesla',
  'Sony',
  'Samsung',
  'Carrefour', // Note: Carrefour comme marque commerciale (attention aux faux positifs de nom de rue/lieu diégétique "Carrefour des...")
  'Auchan',
  'Lidl',
  'Leclerc',
  'Ikea',
  'Starbucks',
  "McDonald's",
  'McDonalds',
  'Decathlon',
  'Fnac',
  'Darty',
  'Total',
  'Renault',
  'Peugeot',
  'Citroën',
  'Citroen',
];

const GENDERED_PATTERNS = [
  /\(e\)/i,
  /\(es\)/i,
  /·e\b/i,
  /·es\b/i,
  /\[e\]/i,
  /\[es\]/i,
  /\bprêt\/prête\b/i,
  /\bconnecté\/connectée\b/i,
  /\bseul\/seule\b/i,
  /\binscrit\/inscrite\b/i,
  /\b\w+\/\w+e\b/i,
];

interface TextRecord {
  file: string;
  id: string;
  field: string;
  text: string;
  isName: boolean;
  category: 'landmark' | 'place' | 'district' | 'poi' | 'road';
}

function collectTextRecords(): TextRecord[] {
  const records: TextRecord[] = [];

  // Landmarks
  for (const l of LANDMARKS) {
    records.push({ file: 'src/data/city/landmarks.ts', id: l.id, field: 'name', text: l.name, isName: true, category: 'landmark' });
    records.push({ file: 'src/data/city/landmarks.ts', id: l.id, field: 'lore', text: l.lore, isName: false, category: 'landmark' });
    for (const a of l.activities) {
      records.push({
        file: 'src/data/city/landmarks.ts',
        id: `${l.id}.${a.id}`,
        field: 'title',
        text: a.title,
        isName: false,
        category: 'landmark',
      });
      records.push({
        file: 'src/data/city/landmarks.ts',
        id: `${l.id}.${a.id}`,
        field: 'text',
        text: a.text,
        isName: false,
        category: 'landmark',
      });
    }
  }

  // Places
  for (const p of PLACES) {
    records.push({ file: 'src/data/places.ts', id: p.id, field: 'name', text: p.name, isName: true, category: 'place' });
    records.push({ file: 'src/data/places.ts', id: p.id, field: 'description', text: p.description, isName: false, category: 'place' });
    for (const a of p.actions) {
      records.push({
        file: 'src/data/places.ts',
        id: `${p.id}.${a.id}`,
        field: 'label',
        text: a.label,
        isName: false,
        category: 'place',
      });
    }
  }

  // Districts & POIs
  for (const d of DISTRICTS) {
    records.push({ file: `src/data/districts/${d.id}.ts`, id: d.id, field: 'name', text: d.name, isName: true, category: 'district' });
    records.push({ file: `src/data/districts/${d.id}.ts`, id: d.id, field: 'description', text: d.description, isName: false, category: 'district' });
    records.push({ file: `src/data/districts/${d.id}.ts`, id: d.id, field: 'economicRole', text: d.economicRole, isName: false, category: 'district' });

    if (d.poiDetails) {
      for (const poi of d.poiDetails) {
        records.push({ file: `src/data/districts/${d.id}.ts`, id: poi.id, field: 'name', text: poi.name, isName: true, category: 'poi' });
        records.push({ file: `src/data/districts/${d.id}.ts`, id: poi.id, field: 'description', text: poi.description, isName: false, category: 'poi' });
        records.push({ file: `src/data/districts/${d.id}.ts`, id: poi.id, field: 'atmosphere', text: poi.atmosphere, isName: false, category: 'poi' });
        records.push({ file: `src/data/districts/${d.id}.ts`, id: poi.id, field: 'systemicRole', text: poi.systemicRole, isName: false, category: 'poi' });
      }
    }
  }

  // City Roads
  for (const r of CITY.roads) {
    records.push({ file: 'src/data/city/layout.ts', id: `road.${r.name}`, field: 'name', text: r.name, isName: true, category: 'road' });
  }

  return records;
}

describe('Maps & Districts Text Linting', () => {
  const records = collectTextRecords();

  it('ne contient aucune marque réelle de la liste', () => {
    const violations: string[] = [];

    for (const record of records) {
      for (const brand of FORBIDDEN_BRANDS) {
        // "Carrefour" as a common noun in French ("Carrefour des...") should not match if it's "Carrefour des ..."
        if (brand === 'Carrefour' && /\bCarrefour des\b/i.test(record.text)) {
          continue;
        }
        const regex = new RegExp(`\\b${brand}\\b`, 'i');
        if (regex.test(record.text)) {
          violations.push(
            `Fichier: ${record.file} | ID: ${record.id} | Champ: ${record.field} | Marque détectée: "${brand}" | Texte: "${record.text}"`
          );
        }
      }
    }

    expect(
      violations,
      `Marques réelles trouvées dans les cartes:\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('ne contient pas de formes genrées adressées au joueur', () => {
    const violations: string[] = [];

    for (const record of records) {
      for (const pattern of GENDERED_PATTERNS) {
        if (pattern.test(record.text)) {
          violations.push(
            `Fichier: ${record.file} | ID: ${record.id} | Champ: ${record.field} | Motif: ${pattern} | Texte: "${record.text}"`
          );
        }
      }
    }

    expect(
      violations,
      `Formes genrées trouvées dans les textes de lieux:\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('ne contient pas de doublon de nom entre cartes/lieux distincts', () => {
    // ROSES_DISTRICT POIs are detailed breakdowns of the historical PLACES items in src/data/places.ts.
    // Except for expected place/POI correlation between ROSES_DISTRICT and PLACES, no distinct locations should share the exact same name.
    const nameMap = new Map<string, Array<{ file: string; id: string; category: string }>>();

    for (const record of records) {
      if (!record.isName) continue;
      const normalizedName = record.text.trim().toLowerCase();
      const existing = nameMap.get(normalizedName) || [];
      existing.push({ file: record.file, id: record.id, category: record.category });
      nameMap.set(normalizedName, existing);
    }

    const duplicates: string[] = [];
    for (const [name, locs] of nameMap.entries()) {
      // Exclude identical entries (e.g., roads listed multiple times in layout)
      const distinctEntries = locs.filter(
        (loc, index, self) =>
          index === self.findIndex((t) => t.file === loc.file && t.id === loc.id)
      );

      // If a PLACES entry and a ROSES_DISTRICT POI share the same name (e.g., "Épicerie Bertin" place vs POI), that's the same physical location in Roses district.
      const isPlaceAndDistrictPoiMatch =
        distinctEntries.length === 2 &&
        distinctEntries.some((e) => e.category === 'place') &&
        distinctEntries.some((e) => e.category === 'poi');

      if (distinctEntries.length > 1 && !isPlaceAndDistrictPoiMatch) {
        const desc = distinctEntries.map((l) => `${l.file}:${l.id}`).join(', ');
        duplicates.push(`Nom en doublon: "${name}" aux emplacements: ${desc}`);
      }
    }

    expect(
      duplicates,
      `Doublons de noms de lieux trouvés:\n${duplicates.join('\n')}`
    ).toEqual([]);
  });
});
