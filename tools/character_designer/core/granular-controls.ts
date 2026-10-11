/**
 * Granular Aesthetic and Anatomical Controls for Claude Code and Antigravity.
 * Provides continuous sliders (0.0 to 1.0) and discrete categorical selectors
 * for musculature, WHR, bust drape, galbe/glute shelves, facial ratios,
 * clothing matrices, and ethnicity presets without artificial censorship.
 */

import {
  GenderIdentity,
  BodyArchetype,
  FacialCanons,
  BodyMorphometrics,
  ClothingLayer,
  ClothingStyleCategory,
  ClothingMatrixPreset,
  EthnicityCategory,
  EthnicityPreset,
  GranularSlidersInput,
  MuscularityLevelDiscrete,
  BustFullnessDiscrete,
  GalbeCurvatureDiscrete
} from './types.js';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ==========================================
// 1. CLOTHING MATRICES
// ==========================================

export const CLOTHING_MATRICES: Record<ClothingStyleCategory, ClothingMatrixPreset> = {
  streetwear: {
    style: 'streetwear',
    name: 'K-Streetwear Contemporain & Urban Manhwa',
    description: 'Silhouettes surdimensionnées, superpositions fluides, streetwear coréen moderne et accents de haute joaillerie urbaine.',
    characteristicSilhouettes: [
      'Pantalons cargo larges multi-poches avec sangles pendantes',
      'Hoodies oversize en coton lourd 450 GSM avec capuche structurée',
      'Sneakers montantes à semelles graphiques sculptées (Dunks / Chunky runners)',
      'Superposition t-shirt blanc long dépassant sous sweat court',
      'Veste universitaire bicolore ou bomber en nylon soyeux'
    ],
    fabricTextures: [
      'Coton lourd french terry brossé',
      'Sergé de coton résistant',
      'Denim brut selvedge avec délavage aux genoux',
      'Toile ripstop légère et nylon mat',
      'Maille côtelée épaisse aux poignets et col'
    ],
    recommendedAccessories: [
      'Chaîne en argent 925 à mailles cubaines avec pendentif minimaliste',
      'Casquette de baseball en sergé noir ou bob hat en toile',
      'Écouteurs supra-auriculaires portés négligemment autour du cou',
      'Sacoche cross-body en cuir grainé ou nylon technique',
      'Bagues d’argent gravées aux index et auriculaires'
    ],
    defaultLayers: [
      {
        layerName: 'base',
        description: 'T-shirt blanc col rond en jersey de coton souple 220 GSM, coupe décontractée légèrement plus longue que la couche supérieure',
        fabricType: 'Jersey de coton peigné respirant',
        tensionFoldsAndDrapes: 'Plis naturels drapés sur le torse, ourlet visible sous le sweat',
        colorHexOrTone: '#F3F4F6'
      },
      {
        layerName: 'inner',
        description: 'Sweat à capuche oversize noir lavé à la pierre avec coutures d’épaules tombantes',
        fabricType: 'Molleton de coton épais 450 GSM',
        tensionFoldsAndDrapes: 'Poches kangourou avec plis de tension horizontaux, capuche retombant avec volume naturel',
        colorHexOrTone: '#1F2937'
      },
      {
        layerName: 'outer',
        description: 'Blouson bomber court satiné vert sauge foncé avec doublure orange thermique et poche manche zippée',
        fabricType: 'Nylon satiné déperlant haute densité',
        tensionFoldsAndDrapes: 'Fronces élastiquées le long des coutures de bras créant du volume',
        colorHexOrTone: '#2D3748'
      },
      {
        layerName: 'bottom',
        description: 'Pantalon cargo wide-leg gris anthracite avec poches à soufflet 3D sur les cuisses et cordons de serrage aux chevilles',
        fabricType: 'Sergé de coton lourd pré-lavé',
        tensionFoldsAndDrapes: 'Cassures amples et plis accordéon tombant sur le cou-de-pied de la basket',
        colorHexOrTone: '#374151'
      },
      {
        layerName: 'footwear',
        description: 'Baskets montantes rétro-bicolores blanc et noir à semelles crantées en gomme avec lacets plats en coton ciré',
        fabricType: 'Cuir pleine fleur et semelle intermédiaire EVA',
        tensionFoldsAndDrapes: 'Plis d’aisance sur l’empeigne avant, tige montante maintenant la cheville',
        colorHexOrTone: '#111827'
      },
      {
        layerName: 'accessories',
        description: 'Collier double chaîne argentée avec médaillon gravé, montre sport à lunette acier brossé et écouteurs sans fil autour du cou',
        fabricType: 'Acier chirurgical 316L et polymère mat',
        tensionFoldsAndDrapes: 'Rigide, reflets spéculaires francs',
        colorHexOrTone: '#E5E7EB'
      }
    ]
  },

  techwear: {
    style: 'techwear',
    name: 'Cybernetic Techwear & Tactical Urban Utility',
    description: 'Esthétique futuriste utilitaire, boucles magnétiques Fidlock, membranes imperméables laminées et ergonomie de combat urbain.',
    characteristicSilhouettes: [
      'Veste à capuche modulaire en Gore-Tex Pro avec cols montants asymétriques',
      'Pantalons articulés fuselés avec poches de transport cargo modulaires PALS/MOLLE',
      'Bottes tactiques légères avec système de laçage rapide BOA',
      'Harnais tactiques thoraciques croisés avec étuis modulaires magnétiques',
      'Manches ergonomiques pré-courbées avec inserts extensibles aux coudes'
    ],
    fabricTextures: [
      'Membrane 3 couches imper-respirante laminée DWR (Durable Water Repellent)',
      'Nylon Cordura 500D résistant à l’abrasion',
      'Tissu extensible quadri-directionnel Schoeller Dryskin',
      'Sangles en nylon balistique militaire',
      'Fermetures étanches soudées YKK Aquaguard'
    ],
    recommendedAccessories: [
      'Harnais de poitrine avec poche pour tablette/données sécurisée',
      'Boucles magnétiques Fidlock V-buckle en aluminium noirci',
      'Gants tactiques demi-doigts avec paume antidérapante en kevlar',
      'Masque filtrant demi-visage ergonomique en néoprène avec valves',
      'Sangles élastiques de compression de cuisse'
    ],
    defaultLayers: [
      {
        layerName: 'base',
        description: 'Sous-vêtement technique de compression noir à manches longues avec gestion thermique et zones de compression musculaire',
        fabricType: 'Élasthanne et microfibre polyamide technique',
        tensionFoldsAndDrapes: 'Moulant, épouse parfaitement la musculature du torse et les deltoïdes',
        colorHexOrTone: '#0F172A'
      },
      {
        layerName: 'inner',
        description: 'Gilet utilitaire tactique zippé avec système de fixation modulaire et poches zippées discrètes',
        fabricType: 'Cordura 330D déperlant',
        tensionFoldsAndDrapes: 'Ajusté au torse avec sangles latérales de réglage sous tension',
        colorHexOrTone: '#1E293B'
      },
      {
        layerName: 'outer',
        description: 'Veste technique hardshell noire à capuche tempête, rabat asymétrique et fermetures étanches Aquaguard thermocollées',
        fabricType: 'Gore-Tex Pro 3 couches mat avec renforts ripstop',
        tensionFoldsAndDrapes: 'Plis géométriques angulaires rigides, col cheminée rigide montant jusqu’au menton',
        colorHexOrTone: '#0B0F19'
      },
      {
        layerName: 'bottom',
        description: 'Pantalon tactique articulé fuselé avec genoux préformés, poches cargo ergonomiques à accès latéral et zips d’aération',
        fabricType: 'Schoeller Dryskin quadri-extensible avec renforts genoux Cordura',
        tensionFoldsAndDrapes: 'Plis horizontaux articulés au-dessus du genou, serrage cheville ajusté',
        colorHexOrTone: '#111827'
      },
      {
        layerName: 'footwear',
        description: 'Bottes tactiques mi-montantes ultra-légères à semelle Vibram tout-terrain et système de serrage rapide à câble',
        fabricType: 'Tige en cuir nubuck déperlant et polymère thermoplastique',
        tensionFoldsAndDrapes: 'Semelle profilée avec crampons agressifs autonettoyants',
        colorHexOrTone: '#030712'
      },
      {
        layerName: 'accessories',
        description: 'Sangle de cuisse modulaire avec boucle magnétique Fidlock, mousqueton tactique noir et montre militaire altimètre',
        fabricType: 'Sangle polyamide renforcée et alliage d’aluminium mat',
        tensionFoldsAndDrapes: 'Sangle tendue sur la cuisse soulignant le galbe musculaire du quadriceps',
        colorHexOrTone: '#1F2937'
      }
    ]
  },

  modern_hanbok_kimono: {
    style: 'modern_hanbok_kimono',
    name: 'Modern Hanbok / Kimono Neo-Traditionnel',
    description: 'Fusion contemporaine de drapés ancestraux asiatiques (Jeogori/Haori croisés) avec coupes urbaines modernes et tissus nobles.',
    characteristicSilhouettes: [
      'Veste croisée Jeogori/Haori à revers en soie avec liens de nouage Otgoreum modernes',
      'Pantalons larges plissés inspirés du Hakama ou du Baji traditionnel',
      'Manteau long Durumagi fluide ouvert porté sur vêtements contemporains',
      'Lignes épurées en V au niveau du cou valorisant la clavicule et la posture',
      'Contrastes subtils entre soie fluide et lin texturé'
    ],
    fabricTextures: [
      'Soie sauvage Dupioni avec reflets changeants',
      'Lin naturel coréen Mosi fin et aéré',
      'Laine froide de tailleur pour un tombé vertical impeccable',
      'Satin de coton avec broderies ton-sur-ton de motifs nuages/dragons stylisés',
      'Cordons tressés en soie dense'
    ],
    recommendedAccessories: [
      'Norigae contemporain stylisé avec pompon en fil de soie et nœud Maedeup',
      'Bague d’argent gravée de sceaux traditionnels ou jade néphrite vert pâle',
      'Chaussons modernes hybrides combinant semelle sneaker et empeigne Kkotsin',
      'Écharpe fine en mousseline de soie à bords vifs',
      'Éventail pliant en bambou laqué noir glissé dans la ceinture'
    ],
    defaultLayers: [
      {
        layerName: 'base',
        description: 'Débardeur col dégagé en soie mélangée ivoire avec finition bord-franc',
        fabricType: 'Mousseline de soie et coton biologique',
        tensionFoldsAndDrapes: 'Drapé doux épousant la ligne des clavicules et le haut du torse',
        colorHexOrTone: '#F9FAFB'
      },
      {
        layerName: 'inner',
        description: 'Veste Jeogori moderne croisée bleu nuit profond avec col Dongjeong blanc immaculé et nouage asymétrique',
        fabricType: 'Lin Mosi fin doublé de soie',
        tensionFoldsAndDrapes: 'Encolure en V nette avec rubans Otgoreum flottants le long du buste',
        colorHexOrTone: '#1E3A8A'
      },
      {
        layerName: 'outer',
        description: 'Manteau long Durumagi noir fluide sans col avec fentes latérales hautes pour faciliter la marche dynamique',
        fabricType: 'Laine froide japonaise d’été avec tombé lourd',
        tensionFoldsAndDrapes: 'Grands pans de tissu ondulant au vent lors des déplacements',
        colorHexOrTone: '#0F172A'
      },
      {
        layerName: 'bottom',
        description: 'Pantalon large plissé noir façon Hakama moderne avec plis marqués à la vapeur et ceinture large nouée',
        fabricType: 'Sergé de viscose et laine infroissable',
        tensionFoldsAndDrapes: 'Plis verticaux solennels s’évasant avec le mouvement des jambes',
        colorHexOrTone: '#111827'
      },
      {
        layerName: 'footwear',
        description: 'Chaussures basses d’inspiration traditionnelle avec bout relevé subtil et semelle cuvette moderne amortissante',
        fabricType: 'Cuir mat noir doux avec passepoil en soie blanche',
        tensionFoldsAndDrapes: 'Ligne fuselée élégante prolongeant la cheville',
        colorHexOrTone: '#0A0A0A'
      },
      {
        layerName: 'accessories',
        description: 'Ornement Norigae moderne en argent brossé avec pendentif en jade céladon et bague d’annulaire martelée',
        fabricType: 'Argent sterling 925 et pierre de jade translucide',
        tensionFoldsAndDrapes: 'Suspendu à la ceinture avec pompon soyeux tombant droit',
        colorHexOrTone: '#A7F3D0'
      }
    ]
  },

  light_armor: {
    style: 'light_armor',
    name: 'Tactical Light Armor & Hunter Vanguard',
    description: 'Armure d’assaut légère pour chasseur de donjon manhwa : composites articulés, mailles balistiques et plaques anatomiques sculptées.',
    characteristicSilhouettes: [
      'Plastron anatomique rigide sculptant les pectoraux et les obliques avec dégagement sternal',
      'Épaulières segmentées plates permettant l’amplitude maximale de frappe',
      'Brassards et protège-avant-bras avec gouttières de guidage défensives',
      'Ceinturon d’artillerie avec tassettes articulées protégeant les hanches',
      'Jambières et grèves ajustées soulignant les muscles du mollet'
    ],
    fabricTextures: [
      'Plaques composites polymère-carbone avec finition titane bleuté ou noir mat',
      'Maille balistique tricotée kevlar/aramide résistante aux perforations',
      'Cuir tanné végétal rigide 4mm avec bouclerie en acier bruni',
      'Plaques articulées rivetées avec rondelles de friction en téflon',
      'Doublure intérieure en néoprène alvéolé absorbant les chocs'
    ],
    recommendedAccessories: [
      'Gantelets renforcés avec articulations des phalanges en composite rigide',
      'Fourreau d’arme dorsale ou latérale à dégagement rapide',
      'Harnais lombaire de répartition de charge avec sangle de rappel',
      'Protège-gorge articulé profilé à profil bas',
      'Runes ou circuits de flux d’énergie gravés sur les bords de plaques'
    ],
    defaultLayers: [
      {
        layerName: 'base',
        description: 'Combinaison de dessous d’armure étanche respirante avec canaux de ventilation anatomiques et rembourrage sous-claviculaire',
        fabricType: 'Tricot aramide technique et élasthanne balistique',
        tensionFoldsAndDrapes: 'Extrêmement près du corps, met en valeur les sillons musculaires',
        colorHexOrTone: '#18181B'
      },
      {
        layerName: 'inner',
        description: 'Corset lombaire et cotte de mailles moderne fine protégeant l’abdomen et les flancs',
        fabricType: 'Micro-anneaux d’acier titane entrelacés sur doublure cuir',
        tensionFoldsAndDrapes: 'Souple et épousant la cambrure de la taille sans gêner la flexion',
        colorHexOrTone: '#27272A'
      },
      {
        layerName: 'outer',
        description: 'Cuirasse pectorale profilée en composite noir mat avec arête centrale dynamique et épaulières plates triples',
        fabricType: 'Fibre de carbone matricée et alliage léger bruni',
        tensionFoldsAndDrapes: 'Coque rigide sculptée avec découpe soulignant les pectoraux et la ligne des abdos',
        colorHexOrTone: '#09090B'
      },
      {
        layerName: 'bottom',
        description: 'Pantalon de combat blindé avec cuissots intégrés et renforts matelassés sur les hanches et les adducteurs',
        fabricType: 'Tissu ripstop militaire renforcé de kevlar',
        tensionFoldsAndDrapes: 'Ajusté sur les cuisses avec tension sur les sangles de maintien',
        colorHexOrTone: '#1F2937'
      },
      {
        layerName: 'footwear',
        description: 'Bottes de combat blindées avec plaques de tibia profilées, protection de malléole et semelles à crampons d’accroche',
        fabricType: 'Cuir de bœuf épais et plaques composites avant',
        tensionFoldsAndDrapes: 'Structure montante rigide protégeant jusqu’au genou',
        colorHexOrTone: '#111827'
      },
      {
        layerName: 'accessories',
        description: 'Gantelets de préhension avec phalanges articulées, ceinturon à boucle tactique d’acier trempé et étui modulaire',
        fabricType: 'Alliage d’acier tungstène et cuir gras',
        tensionFoldsAndDrapes: 'Fixations à cliquet rigides, bords chanfreinés lustrés',
        colorHexOrTone: '#3F3F46'
      }
    ]
  },

  elegant: {
    style: 'elegant',
    name: 'Haute Couture Élégante & Tailoring Aristocratique',
    description: 'Coupe tailleur impeccable, étoffes précieuses, lignes fluides soulignant la stature et le maintien altier.',
    characteristicSilhouettes: [
      'Costume trois pièces sur-mesure ou robe de soirée sculpturale près du corps',
      'Veste croisée à revers en pointe de satin avec épaules montées à la napolitaine',
      'Pardessus droit en cachemire lourd avec col relevable',
      'Taille cintrée avec précision sans aucun pli d’excès',
      'Pantalon habillé sans pince à pli marqué et bas légèrement cassant sur le soulier'
    ],
    fabricTextures: [
      'Laine Super 150s d’Italie au lustre satiné discret',
      'Cachemire peigné double face au toucher velouté',
      'Soie sergée lourde pour les doublures et cravates/foulards',
      'Coton Sea Island extra-long pour la chemise immaculée',
      'Cuir Boxcalf verni à la glace pour les souliers'
    ],
    recommendedAccessories: [
      'Montre habillée extra-plate à cadran guilloché et bracelet crocodile noir',
      'Boutons de manchette en or blanc avec nacre noire sertie',
      'Pochette de costume en lin blanc pliée avec rigueur',
      'Chevalière sobre en platine portée à l’auriculaire',
      'Lunettes fines à monture titane sans cerclage'
    ],
    defaultLayers: [
      {
        layerName: 'base',
        description: 'Chemise ajustée blanc pur à col italien renforcé, poignets mousquetaires et plastron invisible',
        fabricType: 'Popeline de coton d’Égypte 140 fils au cm',
        tensionFoldsAndDrapes: 'Tombé sans faux pli, col montant net encadrant le cou avec autorité',
        colorHexOrTone: '#FFFFFF'
      },
      {
        layerName: 'inner',
        description: 'Gilet de costume croisé noir cintrable au dos avec boutons en corne véritable',
        fabricType: 'Laine mérinos extra-fine filée serré',
        tensionFoldsAndDrapes: 'Maintient la taille fermement en place et affine le profil',
        colorHexOrTone: '#18181B'
      },
      {
        layerName: 'outer',
        description: 'Veste de costume sur-mesure noir onyx à revers châle en satin de soie et épaules nettes sans excès',
        fabricType: 'Laine peignée italienne et revers en satin de soie royale',
        tensionFoldsAndDrapes: 'Épaule parfaitement calée, taille cintrée dessinant un V-taper ou sablier flatteur',
        colorHexOrTone: '#0A0A0A'
      },
      {
        layerName: 'bottom',
        description: 'Pantalon de tailleur fuselé noir à bande de satin latérale discrète et pli central acéré',
        fabricType: 'Laine Super 150s au tombé fluide',
        tensionFoldsAndDrapes: 'Ligne droite ininterrompue descendant jusqu’au cou-de-pied avec une seule cassure',
        colorHexOrTone: '#0F172A'
      },
      {
        layerName: 'footwear',
        description: 'Souliers Richelieu à bout droit perforé en cuir noir glacé au miroir, semelle cuir cousue Blake',
        fabricType: 'Cuir box-calf pleine fleur français',
        tensionFoldsAndDrapes: 'Forme effilée soulignant la cambrure du pied avec patine brillante',
        colorHexOrTone: '#000000'
      },
      {
        layerName: 'accessories',
        description: 'Montre vintage extra-plate en or blanc, boutons de manchette argent et pochette de soie noire',
        fabricType: 'Métaux précieux et soie Jacquard',
        tensionFoldsAndDrapes: 'Finition joaillière impeccable, reflets spéculaires contrôlés',
        colorHexOrTone: '#E4E4E7'
      }
    ]
  }
};

// ==========================================
// 2. ETHNICITY & PHENOTYPE PRESETS
// ==========================================

export const ETHNICITY_PRESETS: Record<EthnicityCategory, EthnicityPreset> = {
  east_asian: {
    category: 'east_asian',
    name: 'Est-Asiatique (Corée / Japon / Chine)',
    skinMelaninTone: 'Teint clair à hâlé doré subtil avec nuance porcelaine lumineuse',
    skinHexDefault: '#F5DEB3',
    undertone: 'warm_golden',
    facialTraitsDescription: 'Double pli de paupière soigné (double eyelid), canthal tilt positif alerte, nez droit à arête fine et pointe définie, pommettes hautes douces, mâchoire en V élégante ou mandibule athlétique définie.',
    epicanthicFold: 'slight_subtle',
    hairTextureDefaults: ['Lisse dense noir jais avec brillance soyeuse', 'Ondulation souple deux-blocs (comma cut)'],
    eyeHueDefaults: ['Obsidienne sombre avec iris dégradé', 'Brun noisette chaleureux avec anneau limbique marqué']
  },

  south_asian: {
    category: 'south_asian',
    name: 'Sud-Asiatique (Inde / Pakistan / Sri Lanka)',
    skinMelaninTone: 'Teint ambré riche à bronze cuivré lumineux avec sous-ton chaud et reflets miel',
    skinHexDefault: '#C68A4C',
    undertone: 'warm_golden',
    facialTraitsDescription: 'Grands yeux en amande intenses avec longs cils fournis, arête nasale droite ou légèrement aquiline sculptée, lèvres pleines avec arc de cupidon net, structure malaire prononcée.',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Ondulations épaisses brillantes noir profond', 'Boucles souples texturées avec volume naturel'],
    eyeHueDefaults: ['Marron velours profond', 'Ambre doré mordoré', 'Noisette foncé étincelant']
  },

  african: {
    category: 'african',
    name: 'Afro-descendant / Panafricain',
    skinMelaninTone: 'Mélanine profonde éclatante, allant de l’ébène riche au bronze chocolaté avec sous-tons chauds dorés ou rouges',
    skinHexDefault: '#5C3826',
    undertone: 'deep_espresso_warm',
    facialTraitsDescription: 'Pommettes hautes majestueuses très sculptées, lèvres généreuses harmonieuses, nez aux narines délicatement dessinées avec arête ferme, mâchoire anguleuse et puissante.',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Tresses cornrows ou locks sculptées nettes', 'Dégradé afro texturé précis au millimètre (clean taper fade)'],
    eyeHueDefaults: ['Brun onyx profond intense', 'Chocolat noir avec iris étoilé']
  },

  caucasian: {
    category: 'caucasian',
    name: 'Caucasien / Européen',
    skinMelaninTone: 'Teint ivoire clair à olive méditerranéen avec reflets pêche ou rosés naturels',
    skinHexDefault: '#F6D7B0',
    undertone: 'fair_peachy',
    facialTraitsDescription: 'Arcade sourcilière marquée créant un regard perçant en profondeur, arête nasale haute et définie, angle gonial de la mandibule franc, lèvres moyennement définies.',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Ondulations moyennes souples châtain ou blond foncé', 'Mèches dégradées décoiffées avec texture mate'],
    eyeHueDefaults: ['Bleu acier perçant', 'Gris ardoise', 'Vert émeraude', 'Noisette changeant']
  },

  latin_american: {
    category: 'latin_american',
    name: 'Latino-Américain / Métissé',
    skinMelaninTone: 'Teint doré olive chaleureux avec éclat hâlé ensoleillé naturel',
    skinHexDefault: '#D7A15C',
    undertone: 'warm_golden',
    facialTraitsDescription: 'Traits expressifs dynamiques, yeux pétillants en amande, mâchoire ferme avec menton net, lèvres charnues et pommettes pleines sculptées par la lumière.',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Ondulations souples noires ou brun foncé', 'Dégradé court avec boucles définies sur le dessus'],
    eyeHueDefaults: ['Marron chaud étincelant', 'Ambre miel liquide', 'Brun sombre profond']
  },

  middle_eastern: {
    category: 'middle_eastern',
    name: 'Moyen-Oriental / Arabe / Persan',
    skinMelaninTone: 'Teint hâlé olive doré chaleureux avec grain de peau fin et lumineux',
    skinHexDefault: '#CFA76E',
    undertone: 'neutral_olive',
    facialTraitsDescription: 'Sourcils denses arqués avec caractère, yeux en amande intenses au contour naturel sombre, arête nasale noble et droite, mandibule carrée bien assise.',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Cheveux noirs épais ondulés lustrés', 'Barbe de 3 jours soigneusement taillée et contours nets'],
    eyeHueDefaults: ['Brun café très sombre', 'Noisette ambré chaleureux', 'Onyx noir magnétique']
  },

  southeast_asian: {
    category: 'southeast_asian',
    name: 'Sud-Est Asiatique (Vietnam / Thaïlande / Indonésie)',
    skinMelaninTone: 'Teint doré ambré chaud avec sous-tons cuivrés doux et grain soyeux',
    skinHexDefault: '#D4A373',
    undertone: 'warm_golden',
    facialTraitsDescription: 'Forme de visage harmonieuse, grands yeux chaleureux avec léger repli palpébral, nez proportionné avec pointe ronde délicate, lèvres charnues avec sourire engageant.',
    epicanthicFold: 'slight_subtle',
    hairTextureDefaults: ['Lisse noir souple brillant', 'Coupe texturée moderne avec mèches effilées'],
    eyeHueDefaults: ['Brun noir profond', 'Marron noisette chaud']
  },

  nordic: {
    category: 'nordic',
    name: 'Nordique / Scandinave',
    skinMelaninTone: 'Teint très clair diaphane porcelaine avec nuances rosées et sous-tons frais',
    skinHexDefault: '#FFE0BD',
    undertone: 'cool_pink',
    facialTraitsDescription: 'Pommettes hautes saillantes, arête du nez droite et haute, sourcils clairs délimités, regard perçant et mâchoire carrée géométrique.',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Blond platine ou châtain très clair lisse et fin', 'Coupe structurée en mèches aériennes'],
    eyeHueDefaults: ['Bleu glacier perçant', 'Gris polaire froid', 'Bleu ciel limpide']
  },

  indigenous_american: {
    category: 'indigenous_american',
    name: 'Amérindien / Autochtone',
    skinMelaninTone: 'Teint cuivré bronze profond chaleureux avec sous-tons ocre rougeoyants',
    skinHexDefault: '#B26D45',
    undertone: 'deep_espresso_warm',
    facialTraitsDescription: 'Pommettes très hautes et anguleuses, arcade sourcilière digne et affirmée, nez aquilin majestueux, mâchoire large et menton solide.',
    epicanthicFold: 'slight_subtle',
    hairTextureDefaults: ['Cheveux noirs droits très épais et lourds', 'Longue chevelure lustrée tressée ou flottante'],
    eyeHueDefaults: ['Marron foncé profond captivant', 'Noir obsidienne']
  },

  polynesian: {
    category: 'polynesian',
    name: 'Polynésien / Pacifique',
    skinMelaninTone: 'Teint doré caramel à bronze ensoleillé généreux avec reflet satiné',
    skinHexDefault: '#BD8052',
    undertone: 'warm_golden',
    facialTraitsDescription: 'Ossature faciale solide et imposante, arcades sourcilières fortes, yeux chaleureux expressifs, lèvres pleines généreuses, mâchoire large imposante.',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Ondulations volumineuses épaisses noir ébène', 'Boucles amples lustrées tombant sur les épaules'],
    eyeHueDefaults: ['Brun sombre chaud', 'Marron noisette profond']
  },

  fantasy_hybrid: {
    category: 'fantasy_hybrid',
    name: 'Hybride Fantastique / Hunter Awakened',
    skinMelaninTone: 'Teint translucide luminescent avec légères micro-veines azurées sous-cutanées ou hâle cendré mystique',
    skinHexDefault: '#E2E8F0',
    undertone: 'cool_pink',
    facialTraitsDescription: 'Oreilles légèrement effilées au sommet de l’hélix, pupilles réactives avec reflets bioluminescents, symétrie faciale quasi divine, mâchoire ciselée sans aucun défaut.',
    epicanthicFold: 'slight_subtle',
    hairTextureDefaults: ['Argenté lunaire avec reflets métalliques', 'Noir de jais avec reflets bleu nuit électrique'],
    eyeHueDefaults: ['Bleu néon incandescence mana', 'Ambre doré foudroyant', 'Violet améthyste profond']
  }
};

// ==========================================
// 3. GRANULAR SLIDER RESOLUTION FUNCTIONS
// ==========================================

export interface MuscularityResolution {
  level: number; // 0.0 to 1.0
  discreteName: MuscularityLevelDiscrete;
  description: string;
  vascularity: number; // 0.0 to 1.0
  abdominalDefinition: string;
  latissimusSpreading: string;
  deltoidSeparation: string;
}

export function resolveMuscularity(
  slider?: number,
  discrete?: MuscularityLevelDiscrete,
  gender: GenderIdentity = 'male'
): MuscularityResolution {
  let val = slider;

  if (val === undefined && discrete) {
    switch (discrete) {
      case 'lean':
      case 'lean_subtle': val = 0.20; break;
      case 'athletic':
      case 'athletic_toned': val = 0.40; break;
      case 'chiseled':
      case 'chiseled_ripped': val = 0.65; break;
      case 'bodybuilder':
      case 'bodybuilder_dense': val = 0.80; break;
      case 'hyper_mass':
      case 'hyper-mass':
      case 'hyper_mass_demon': val = 0.95; break;
    }
  }

  const defaultMuscularity = gender === 'female' ? 0.35 : (gender === 'male' ? 0.60 : 0.40);
  val = clamp(val ?? defaultMuscularity, 0.0, 1.0);

  let discreteName: MuscularityLevelDiscrete;
  let description: string;
  let abdominalDefinition: string;
  let latissimusSpreading: string;
  let deltoidSeparation: string;
  const vascularity = clamp((val - 0.4) * 1.6, 0.0, 1.0);

  if (val < 0.30) {
    discreteName = 'lean_subtle';
    description = 'Silhouette élancée et longiligne, découpes musculaires discrètes, lignes douces et fluides.';
    abdominalDefinition = 'Paroi abdominale plate avec sillon médian subtil.';
    latissimusSpreading = 'Dorsaux discrets sans évasement prononcé.';
    deltoidSeparation = 'Épaules douces, continuité harmonieuse avec la ligne des clavicules.';
  } else if (val < 0.50) {
    discreteName = 'athletic_toned';
    description = 'Physique d’athlète ou danseur, musculature fonctionnelle tonique sans excès de masse.';
    abdominalDefinition = '4 à 6 plaquettes abdominales dessinées avec clarté sous la peau.';
    latissimusSpreading = 'V-taper naturel débutant sous les aisselles.';
    deltoidSeparation = 'Deltoïdes antérieurs et latéraux bien détachés du biceps.';
  } else if (val < 0.75) {
    discreteName = 'chiseled_ripped';
    description = 'Standard manhwa héroïque de combat : muscles denses, découpe chirurgicale et pourcentage de masse grasse minimal.';
    abdominalDefinition = '8 plaquettes abdominales ciselées en brique, dentelés antérieurs (serratus) tranchants et ceinture d’Adonis profonde.';
    latissimusSpreading = 'V-taper agressif avec grand dorsal déployé en ailes.';
    deltoidSeparation = 'Épaules rondes en noix de coco avec striations apparentes.';
  } else if (val < 0.90) {
    discreteName = 'bodybuilder_dense';
    description = 'Masse musculaire colossale, hypertrophie avancée, épaisseur du dos et des membres imposante.';
    abdominalDefinition = 'Bloc abdominal massif et strié avec obliques externes hypertrophiés.';
    latissimusSpreading = 'Dorsaux ultra-larges comprimant les aisselles en posture neutre.';
    deltoidSeparation = 'Trois faisceaux deltoïdiens séparés par des sillons profonds.';
  } else {
    discreteName = 'hyper_mass_demon';
    description = 'Hypertrophie surhumaine type "Demon Back" : sapin de Noël lombaire, striations fibrillaires et vascularisation céphalique rampante.';
    abdominalDefinition = 'Gaufrier abdominal démesuré à 8 blocs striés parsemé de veines turgescentes.';
    latissimusSpreading = 'Dorsaux titanesques débordant largement du tronc même de face.';
    deltoidSeparation = 'Deltoïdes massifs zébrés de striations fibreuses avec trapèzes montant jusqu’aux oreilles.';
  }

  return {
    level: val,
    discreteName,
    description,
    vascularity,
    abdominalDefinition,
    latissimusSpreading,
    deltoidSeparation
  };
}

export interface BustResolution {
  volume: number; // 0.0 to 1.0
  discreteName: BustFullnessDiscrete;
  description: string;
  gravityDrape: string;
  cleavageContour: string;
}

export function resolveBust(
  slider?: number,
  discrete?: BustFullnessDiscrete,
  gender: GenderIdentity = 'female',
  naturalGravity: boolean = true
): BustResolution {
  let val = slider;

  if (val === undefined && discrete) {
    switch (discrete) {
      case 'petite':
      case 'subtle_petite': val = 0.15; break;
      case 'athletic':
      case 'athletic_firm': val = 0.35; break;
      case 'medium':
      case 'medium_classic': val = 0.55; break;
      case 'voluptuous':
      case 'voluptuous_full': val = 0.75; break;
      case 'monumental':
      case 'monumental_heavy': val = 0.95; break;
    }
  }

  const defaultBust = gender === 'female' ? 0.55 : (gender === 'male' ? 0.40 : 0.35);
  val = clamp(val ?? defaultBust, 0.0, 1.0);

  let discreteName: BustFullnessDiscrete;
  let description: string;
  let gravityDrape: string;
  let cleavageContour: string;

  if (gender === 'male') {
    discreteName = val > 0.6 ? 'medium_classic' : 'athletic_firm';
    description = `Pectoraux masculins sculptés (volume ${(val * 10).toFixed(1)}/10), insertion sternale nette et sillon sous-pectoral franc.`;
    gravityDrape = 'Masse musculaire dense soutenue par le squelette thoracique sans relâchement.';
    cleavageContour = 'Fente sternale verticale profonde entre les deux masses pectorales carrées.';
  } else if (gender === 'androgynous' || gender === 'non-binary') {
    discreteName = val > 0.6 ? 'medium_classic' : (val > 0.3 ? 'athletic_firm' : 'subtle_petite');
    description = `Torse androgyne aux lignes pures et athlétiques (volume ${(val * 10).toFixed(1)}/10), continuité gracieuse avec les clavicules.`;
    gravityDrape = 'Drapé discret et naturel épousant la structure thoracique.';
    cleavageContour = 'Sillon sternal subtil créant une ombre délicate.';
  } else {
    if (val < 0.25) {
      discreteName = 'subtle_petite';
      description = 'Poitrine menue et délicate, profil athlétique et élégant.';
      gravityDrape = 'Tissu ferme et compact, transition douce avec la cage thoracique.';
      cleavageContour = 'Sillon sternal discret et naturel.';
    } else if (val < 0.45) {
      discreteName = 'athletic_firm';
      description = 'Poitrine athlétique tonique équilibrée, maintien vigoureux et proportion harmonieuse.';
      gravityDrape = 'Léger arrondi inférieur naturel avec maintien musculaire.';
      cleavageContour = 'Séparation nette et gracieuse entre les deux seins.';
    } else if (val < 0.68) {
      discreteName = 'medium_classic';
      description = 'Volume moyen classique voluptueux en goutte d’eau respectant la pesanteur naturelle.';
      gravityDrape = naturalGravity
        ? 'Drapé réaliste en larme descendant doucement vers le bas avec transition souple sur les côtes.'
        : 'Courbure sphérique soutenue avec projection dynamique.';
      cleavageContour = 'Sillon central délicat créant une ombre subtile en lumière zénithale.';
    } else if (val < 0.88) {
      discreteName = 'voluptuous_full';
      description = 'Poitrine très généreuse et pulpeuse, courbure affirmée et masse naturelle sans artifice.';
      gravityDrape = naturalGravity
        ? 'Pesanteur anatomique authentique : masse tombante en goutte d’eau avec pli sous-mammaire distinct et drapé sur l’abdomen.'
        : 'Projection volumétrique généreuse et bombée.';
      cleavageContour = 'Décolleté profond naturel avec contact doux des tissus le long du sternum.';
    } else {
      discreteName = 'monumental_heavy';
      description = 'Poitrine spectaculaire de proportion manhwa mature avec masse lourde et présence magnétique sans retenue.';
      gravityDrape = naturalGravity
        ? 'Poids important de tissu adipeux et glandulaire avec affaissement naturel réaliste et compression contre la paroi thoracique.'
        : 'Volume extrême projeté vers l’avant.';
      cleavageContour = 'Sillon sternal comprimé profond avec transition continue vers la ligne des clavicules.';
    }
  }

  return {
    volume: val,
    discreteName,
    description,
    gravityDrape,
    cleavageContour
  };
}

export interface GalbeResolution {
  curvature: number; // 0.0 to 1.0
  discreteName: GalbeCurvatureDiscrete;
  description: string;
  shelfDefinition: string;
  hipThighTransition: string;
}

export function resolveGalbe(
  slider?: number,
  discrete?: GalbeCurvatureDiscrete,
  gender: GenderIdentity = 'female'
): GalbeResolution {
  let val = slider;

  if (val === undefined && discrete) {
    switch (discrete) {
      case 'lean':
      case 'lean_straight': val = 0.15; break;
      case 'firm':
      case 'athletic':
      case 'firm_athletic': val = 0.35; break;
      case 'full':
      case 'full_rounded': val = 0.60; break;
      case 'shelf':
      case 'hourglass':
      case 'deep_hourglass_shelf': val = 0.82; break;
      case 'hyper':
      case 'hyper_curvaceous': val = 0.98; break;
    }
  }

  const defaultGalbe = gender === 'female' ? 0.65 : (gender === 'male' ? 0.40 : 0.50);
  val = clamp(val ?? defaultGalbe, 0.0, 1.0);

  let discreteName: GalbeCurvatureDiscrete;
  let description: string;
  let shelfDefinition: string;
  let hipThighTransition: string;

  if (val < 0.25) {
    discreteName = 'lean_straight';
    description = 'Courbure fessière discrète et rectiligne, ligne fuselée droite.';
    shelfDefinition = 'Léger bombement sans cassure lombaire marquée.';
    hipThighTransition = 'Transition droite et élancée vers les ischio-jambiers.';
  } else if (val < 0.48) {
    discreteName = 'firm_athletic';
    description = 'Galbe athlétique tonique, fessier haut galbé par le sport (sprinter / fitness).';
    shelfDefinition = 'Plateau fessier ferme avec sillon sous-fessier court et net.';
    hipThighTransition = 'Courbure musculaire nette des fessiers supérieurs (gluteus medius) et ischios.';
  } else if (val < 0.75) {
    discreteName = 'full_rounded';
    description = 'Galbe fessier plein, généreux et harmonieusement arrondi, silhouette sablier prononcée.';
    shelfDefinition = 'Cambrure lombaire accentuée créant un décroché net au-dessus du sacrum.';
    hipThighTransition = 'Transition pleine et sinueuse épousant la rondeur des hanches vers le haut des cuisses.';
  } else if (val < 0.92) {
    discreteName = 'deep_hourglass_shelf';
    description = 'Étagère fessière spectaculaire type manhwa : projection arrière maximale et évasement latéral des hanches.';
    shelfDefinition = 'Plateau fessier prononcé avec lordose esthétique plongeante et rebond volumineux.';
    hipThighTransition = 'Évasement latéral profond (hip dip comblé) avec courbes amples drapant le vêtement.';
  } else {
    discreteName = 'hyper_curvaceous';
    description = 'Galbe volumétrique extrême, courbures voluptueuses dominantes marquant l’espace sans compromis.';
    shelfDefinition = 'Volume fessier colossal projeté en porte-à-faux avec pli sous-fessier profond.';
    hipThighTransition = 'Hanches ultra-larges et cuisses galbées formant un arc sculptural dramatique.';
  }

  return {
    curvature: val,
    discreteName,
    description,
    shelfDefinition,
    hipThighTransition
  };
}

// ==========================================
// 4. BIOMETRIC BUILDERS
// ==========================================

export function buildFacialCanons(
  input: GranularSlidersInput,
  gender: GenderIdentity = 'male'
): FacialCanons {
  const rawThirds = input.facialThirdsRatio ?? [1.0, 1.0, 1.0];
  const thirds: [number, number, number] = [
    clamp(rawThirds[0] ?? 1.0, 0.4, 2.0),
    clamp(rawThirds[1] ?? 1.0, 0.4, 2.0),
    clamp(rawThirds[2] ?? 1.0, 0.4, 2.0)
  ];
  const defaultCanthal = gender === 'female' ? 4.5 : (gender === 'male' ? 3.0 : 4.0);
  const defaultGonial = gender === 'female' ? 128 : (gender === 'male' ? 118 : 122);
  const defaultBigonial = gender === 'female' ? 0.74 : (gender === 'male' ? 0.86 : 0.80);
  const defaultNasolabial = gender === 'female' ? 100 : (gender === 'male' ? 92 : 96);

  const canthalTilt = clamp(input.canthalTiltDegrees ?? defaultCanthal, -8.0, 12.0);
  const gonialAngle = clamp(input.gonialAngleDegrees ?? defaultGonial, 105, 140);
  const bigonialWidth = clamp(input.bigonialWidthRatio ?? defaultBigonial, 0.60, 0.96);
  const cheekboneProminence = clamp(input.cheekboneProminence ?? 0.72, 0.0, 1.0);
  const philtrumToChin = clamp(input.philtrumToChinRatio ?? 0.50, 0.30, 0.70);
  const nasolabialAngle = clamp(input.nasolabialAngleDegrees ?? defaultNasolabial, 80, 120);

  const isMale = gender === 'male';
  const isFemale = gender === 'female';

  let eyeDetails: string;
  let noseDetails: string;
  let lipDetails: string;
  let jawlineDescription: string;

  if (isMale) {
    eyeDetails = `Regard perçant intense avec double paupière marquée, canthal tilt positif (+${canthalTilt}°), iris obsidienne avec anneau limbique foncé et micro-reflets spéculaires acérés.`;
    noseDetails = `Arête nasale haute et droite, dos du nez rectiligne sans bosse, pointe ferme bien définie avec angle nasolabial de ${nasolabialAngle}°.`;
    lipDetails = `Lèvres sculptées aux contours nets, lèvre inférieure légèrement plus pleine, arc de cupidon défini avec philtrum à ratio ${philtrumToChin.toFixed(2)}.`;
    jawlineDescription = `Mâchoire carrée athlétique, angle gonial net de ${gonialAngle}°, largeur bigoniale robuste (${bigonialWidth.toFixed(2)}) et menton saillant avec fente centrale discrète.`;
  } else if (isFemale) {
    eyeDetails = `Grands yeux en amande captivants, canthal tilt alerte (+${canthalTilt}°), cils denses, iris lumineux avec dégradé chaud et reflets d'étoile doubles.`;
    noseDetails = `Nez délicat à l'arête fine et élégante, pointe subtilement relevée avec angle nasolabial harmonieux de ${nasolabialAngle}°.`;
    lipDetails = `Lèvres pleines satinées avec arc de cupidon gracieux, lèvre inférieure pulpeuse et teinte rosée naturelle avec éclat brillant.`;
    jawlineDescription = `Ligne de mâchoire en V élégante et fluide (angle gonial ${gonialAngle}°), menton délicat et pommettes hautes saillantes sculptées (${cheekboneProminence.toFixed(2)}).`;
  } else {
    eyeDetails = `Regard captivant et magnétique, canthal tilt alerte (+${canthalTilt}°), iris profonds avec micro-reflets lumineux et contours de paupières nets.`;
    noseDetails = `Arête nasale pure et sculptée, profil droit élégant avec angle nasolabial harmonieux de ${nasolabialAngle}°.`;
    lipDetails = `Lèvres définies au contour net, arc de cupidon gracieux avec ratio philtrum de ${philtrumToChin.toFixed(2)}.`;
    jawlineDescription = `Ligne mandibulaire androgyne équilibrée (angle gonial ${gonialAngle}°, largeur bigoniale ${bigonialWidth.toFixed(2)}) associant netteté et finesse des pommettes (${cheekboneProminence.toFixed(2)}).`;
  }

  return {
    facialThirdsRatio: thirds,
    facialFifthsEyeRatio: 1.0,
    canthalTiltDegrees: canthalTilt,
    gonialAngleDegrees: gonialAngle,
    cheekboneToJawRatio: +(1.0 / bigonialWidth).toFixed(2),
    bigonialWidthRatio: bigonialWidth,
    philtrumToChinRatio: philtrumToChin,
    nasolabialAngleDegrees: nasolabialAngle,
    cheekboneProminence: cheekboneProminence,
    eyeDetails,
    noseDetails,
    lipDetails,
    jawlineDescription
  };
}

export function buildMorphometrics(
  input: GranularSlidersInput,
  gender: GenderIdentity = 'male',
  archetype: BodyArchetype = 'lean_athletic'
): BodyMorphometrics {
  const isFemale = gender === 'female';
  const isMale = gender === 'male';

  // Resolve muscularity
  const muscle = resolveMuscularity(input.muscularitySlider, input.muscularityDiscrete, gender);

  // Resolve bust
  const bust = resolveBust(input.bustVolumeSlider, input.bustDiscrete, gender, input.bustNaturalGravity ?? true);

  // Resolve galbe
  const galbe = resolveGalbe(input.galbeSlider, input.galbeDiscrete, gender);

  // Defaults based on gender
  const whrDefault = isFemale ? 0.68 : (isMale ? 0.85 : 0.76);
  const shrDefault = isFemale ? 1.08 : (isMale ? 1.52 : 1.25);
  const cwrDefault = isFemale ? 1.35 : (isMale ? 1.42 : 1.38);
  const heightDefault = isFemale ? 172 : (isMale ? 186 : 178);

  // Ratios clamped
  const whr = clamp(input.waistToHipRatio ?? whrDefault, 0.55, 1.10);
  const shr = clamp(input.shoulderToHipRatio ?? shrDefault, 0.90, 1.85);
  const cwr = clamp(input.chestToWaistRatio ?? cwrDefault, 1.00, 1.70);

  const height = clamp(input.heightCm ?? heightDefault, 140, 225);
  const headHeight = clamp(input.headHeightRatio ?? 8.2, 6.0, 9.5);

  // Uncensored detailed anatomical descriptions
  let bustChestDesc: string;
  let waistAbdomenDesc: string;
  let hipGluteDesc: string;
  let legsCalvesDesc: string;
  let backShouldersDesc: string;
  let handsFeetDesc: string;

  if (isFemale) {
    bustChestDesc = `${bust.description} ${bust.gravityDrape} ${bust.cleavageContour} Tissu naturel souple sans raideur artificielle.`;
    waistAbdomenDesc = `Taille fine et marquée avec ratio taille/hanche WHR exceptionnel de ${whr.toFixed(2)}. ${muscle.abdominalDefinition} Flancs lisses et cambrure lombaire sensuelle.`;
    hipGluteDesc = `Bassin évasé féminin avec WHR ${whr.toFixed(2)}. ${galbe.description} ${galbe.shelfDefinition} ${galbe.hipThighTransition}`;
    legsCalvesDesc = `Jambes interminables aux proportions de ${headHeight.toFixed(1)} têtes, quadriceps élancés avec galbe subtil du vaste médial, mollets fuselés et chevilles fines.`;
    backShouldersDesc = `Épaules délicates et clavicules apparentes bien soulignées (SHR ${shr.toFixed(2)}), dos cambré souple avec sillon vertébral central gracieusement ombré.`;
    handsFeetDesc = `Mains fines aux doigts effilés et ongles soignés à la coupe naturelle, poignets délicats, pieds cambrés élégants.`;
  } else if (isMale) {
    bustChestDesc = `Torse athlétique aux pectoraux carrés ciselés (projection ${bust.volume.toFixed(2)}), sillon sternal profond et insertion anatomique franche sur les clavicules.`;
    waistAbdomenDesc = `Taille étroite gainée par un corset musculaire dense (WHR ${whr.toFixed(2)}). ${muscle.abdominalDefinition} Obliques externes puissants et sillon iliaque (ceinture d’Adonis) profondément creusé.`;
    hipGluteDesc = `Bassin androïde étroit et compact. Fessiers athlétiques fermes et denses (galbe ${(galbe.curvature * 10).toFixed(1)}/10) formant une base de propulsion puissante.`;
    legsCalvesDesc = `Cuisses d’athlète puissantes : séparation nette du vaste latéral et du vaste médial en goutte d’eau au-dessus de la rotule, mollets denses et tendons d’Achille acérés.`;
    backShouldersDesc = `Carrure en V spectaculaire (SHR ${shr.toFixed(2)}). ${muscle.deltoidSeparation} ${muscle.latissimusSpreading} Arbre de Noël vertébral ciselé et trapèzes imposants.`;
    handsFeetDesc = `Grandes mains de combattant aux articulations définies, paumes solides, veines céphaliques traçantes sur les métacarpes et prise ferme.`;
  } else {
    bustChestDesc = `Torse androgyne tonique et élancé (volume ${bust.volume.toFixed(2)}). ${bust.description} ${bust.gravityDrape}`;
    waistAbdomenDesc = `Taille svelte et gainée avec ratio WHR de ${whr.toFixed(2)}. ${muscle.abdominalDefinition} Flancs nets sans excès.`;
    hipGluteDesc = `Bassin androgyne harmonieux avec WHR ${whr.toFixed(2)}. ${galbe.description} ${galbe.shelfDefinition} ${galbe.hipThighTransition}`;
    legsCalvesDesc = `Jambes longilignes équilibrées aux proportions de ${headHeight.toFixed(1)} têtes, musculature fuselée et chevilles soignées.`;
    backShouldersDesc = `Carrure équilibrée et gracieuse (SHR ${shr.toFixed(2)}), ligne des clavicules pure et dos souple bien dessiné.`;
    handsFeetDesc = `Mains expressives aux doigts longs et fins, poignets élégants et tenue assurée.`;
  }

  const bodyFat = input.bodyFatCategory ?? (muscle.level > 0.7 ? 'ultra_lean' : 'athletic_toned');

  return {
    heightCm: height,
    weightKg: isFemale
      ? Math.round(height * 0.35 + muscle.level * 10)
      : (isMale ? Math.round(height * 0.45 + muscle.level * 18) : Math.round(height * 0.40 + muscle.level * 14)),
    headHeightRatio: headHeight,
    waistToHipRatio: whr,
    shoulderToHipRatio: shr,
    chestToWaistRatio: cwr,
    muscularityLevel: muscle.level,
    bustVolume: bust.volume,
    galbeCurvature: galbe.curvature,
    bodyFatCategory: bodyFat,
    anatomicalFeatures: {
      bustChestDescription: bustChestDesc,
      waistAbdomenDescription: waistAbdomenDesc,
      hipGluteDescription: hipGluteDesc,
      legsCalvesDescription: legsCalvesDesc,
      backShouldersDescription: backShouldersDesc,
      handsFeetDescription: handsFeetDesc
    }
  };
}

export function buildWardrobeForStyle(
  style: ClothingStyleCategory,
  palette?: { primary: string; secondary: string; accent: string }
): ClothingLayer[] {
  const preset = CLOTHING_MATRICES[style] ?? CLOTHING_MATRICES.streetwear;
  const layers = JSON.parse(JSON.stringify(preset.defaultLayers)) as ClothingLayer[];

  if (palette) {
    if (layers[1]) layers[1].colorHexOrTone = palette.primary;
    if (layers[2]) layers[2].colorHexOrTone = palette.secondary;
    if (layers[5]) layers[5].colorHexOrTone = palette.accent;
  }

  return layers;
}
