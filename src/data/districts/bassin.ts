/**
 * NEURAPOLIS — Quartier : Le Bassin Industriel Nord
 * Spécification détaillée (Survey 2 §3.3, ORIGINAL_REQUEST.md R1).
 */
import type { ExtendedDistrictDef } from './types';

export const BASSIN_DISTRICT: ExtendedDistrictDef = {
  id: 'bassin',
  name: 'Le Bassin Industriel Nord',
  description:
    'Ancien ensemble de fonderies et forges lourdes à sheds de briques rouges et charpentes métalliques rivetées. Reconverti en écosystème d’artisanat lourd autogéré, de valorisation de ferraille et de production énergétique citoyenne.',
  ambientKelvin: 1800,
  pois: [
    'La Forge Commune',
    'Parc Recup’Métal',
    'Chaufferie Citoyenne Biomasse',
    'Hangar Rétrofit 2-Roues',
  ],
  poiDetails: [
    {
      id: 'forge_commune',
      name: 'La Forge Commune',
      description: 'Nef industrielle monumentale de 60 mètres où résonnent les coups d’enclume, équipée de marteaux-pilons réhabilités, de postes de soudure TIG et de tours mécaniques partagés.',
      atmosphere: 'Lueur incandescente des foyers à charbon projetant des halos rougeoyants sur les murs de brique suintant la suie, odeur de fer chauffé et d’huile de lin.',
      systemicRole: 'Atelier de fabrication lourde : production de remorques, présentoirs métalliques et renforts de stands.',
      suggestedActivities: ['forger_une_piece', 'usiner_au_tour', 'apprendre_le_brasage'],
    },
    {
      id: 'recup_metal',
      name: 'Parc Recup’Métal',
      description: 'Cour pavée transformée en labyrinthe ordonné de profilés acier, barres de cuivre, fers plats et cornières triés par calibres et nuances sous l’œil expert de Gérard Boulon.',
      atmosphere: 'Cliquetis des barres métalliques entrechoquées, scintillement des copeaux d’usinage dorés et argentés au sol, odeur piquante de rouille et d’ozone.',
      systemicRole: 'Approvisionnement en matières premières recyclées : réduit drastiquement le coût en capital des aménagements.',
      suggestedActivities: ['fouiller_la_ferraille', 'peser_au_peson', 'troquer_des_boulons'],
    },
    {
      id: 'chaufferie_biomasse',
      name: 'Chaufferie Citoyenne Biomasse',
      description: 'Centrale thermique collective alimentée par les chutes de bois des menuiseries locales et le broyat végétal des parcs, chauffant les ateliers et les écoles mitoyennes.',
      atmosphere: 'Chaleur enveloppante, grondement sourd et régulier du foyer à vis sans fin, parfum résineux de pin broyé et de sciure de chêne.',
      systemicRole: 'Infrastructure d’énergie partagée garantissant le confort thermique des ateliers sans dépendance au gaz importé.',
      suggestedActivities: ['charger_la_tremie', 'verifier_les_manometres', 'se_rechauffer_les_mains'],
    },
    {
      id: 'retrofit_2roues',
      name: 'Hangar Rétrofit 2-Roues',
      description: 'Atelier mécanique spécialisé dans la greffe de moteurs électriques recyclés et batteries reconditionnées sur des cadres de triporteurs, vélos-cargos et vieilles mobylettes.',
      atmosphere: 'Odeur d’électrolyte, bruit sec des clés dynamométriques à cliquet, alignement de batteries lithium étiquetées avec soin.',
      systemicRole: 'Entretien et modernisation de la flotte de logistique douce (triporteurs de distribution de produits locaux).',
      suggestedActivities: ['reparer_un_triporteur', 'tester_un_moteur', 'souder_un_porte_bagages'],
    },
  ],
  keyNpcs: ['djamila_khoury', 'gerard_boulon'],
  dominantGhosts: ['taylor', 'ohno', 'marx', 'raworth'],
  economicRole: 'Surcyclage d’acier, rétrofit électrique de triporteurs et chauffage urbain.',
  paletteDescription: 'Brique rouge foncée, acier bleuté sombre, lueurs incandescentes de soudure jaune-orange 1800K et halos de chaleur.',
  transitions: {
    vers_roses: { targetDistrict: 'roses', targetPoi: 'Friche Taret' },
    vers_caves: { targetDistrict: 'caves', targetPoi: 'Puits de Chaufferie' },
  },
};
