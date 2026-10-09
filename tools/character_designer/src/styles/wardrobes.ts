/**
 * Wardrobe Matrix and Clothing Layers Module.
 * Implements K-Streetwear, Techwear, Fantasy, Martial, and Classic Tailoring
 * with dual-state support: Duty (operational/official) vs Private (casual/loungewear).
 */

import type { 
  ClothingStyleCategory, 
  ClothingLayer, 
  ClothingMatrixPreset, 
  AttireState 
} from '../types.ts';

export const WARDROBE_PRESETS: Record<ClothingStyleCategory, ClothingMatrixPreset> = {
  streetwear: {
    style: 'streetwear',
    name: 'Seoul K-Streetwear & Contemporary Layering',
    description: 'Voluminous parachute silhouettes, multi-pocket cargo trousers, oversized heavyweight hoodies, and designer court sneakers.',
    dutyLayers: [
      {
        layerName: 'base',
        description: 'Ribbed heavyweight cotton crewneck tank',
        fabricType: '280gsm organic combed cotton',
        tensionFoldsAndDrapes: 'Snug fit across thoracic arch with stretch tension lines',
        colorHexOrTone: '#F3F4F6 (Chalk White)'
      },
      {
        layerName: 'inner',
        description: 'Boxy drop-shoulder distressed graphic hoodie',
        fabricType: '450gsm French terry fleece',
        tensionFoldsAndDrapes: 'Deep horizontal drape folds around elbows and kangaroo pocket',
        colorHexOrTone: '#111827 (Jet Black)'
      },
      {
        layerName: 'outer',
        description: 'Cropped tactical denim trucker jacket with matte black hardware',
        fabricType: '14oz Japanese selvedge denim',
        tensionFoldsAndDrapes: 'Stiff structural silhouette with sharp angular collar folds',
        colorHexOrTone: '#1F2937 (Dark Charcoal)'
      },
      {
        layerName: 'bottom',
        description: 'Wide-leg multi-pocket parachute cargo pants with toggle cuffs',
        fabricType: 'Ripstop nylon cotton blend',
        tensionFoldsAndDrapes: 'Bellowing stacked folds pooling gracefully over sneaker collars',
        colorHexOrTone: '#374151 (Slate Grey)'
      },
      {
        layerName: 'footwear',
        description: 'Deconstructed retro court high-top sneakers with aged yellowed sole',
        fabricType: 'Full-grain leather and suede panels',
        tensionFoldsAndDrapes: 'Rigid supportive ankle padding and textured geometric tread',
        colorHexOrTone: '#E5E7EB / #1E40AF (White & Royal Blue)'
      },
      {
        layerName: 'accessories',
        description: 'Layered Cuban link silver chains, matte black cross-body utility pouch, and wired studio earphones',
        fabricType: '925 sterling silver, Cordura ballistic nylon',
        tensionFoldsAndDrapes: 'Free-hanging metallic drape resting in sternal groove',
        colorHexOrTone: '#9CA3AF (Brushed Silver)'
      }
    ],
    privateLayers: [
      {
        layerName: 'base',
        description: 'Ultra-soft oversized vintage washed t-shirt',
        fabricType: '220gsm enzyme-washed modal cotton',
        tensionFoldsAndDrapes: 'Loose relaxed drape outlining natural chest and shoulder slope',
        colorHexOrTone: '#4B5563 (Washed Ash)'
      },
      {
        layerName: 'bottom',
        description: 'Loose fleece lounge sweatpants with drawstring waistband',
        fabricType: 'Heavy brushed fleece',
        tensionFoldsAndDrapes: 'Soft rounded gather folds over hips and knees',
        colorHexOrTone: '#1F2937 (Heather Charcoal)'
      },
      {
        layerName: 'footwear',
        description: 'Molded slide sandals with thick ergonomic sole',
        fabricType: 'EVA foam',
        tensionFoldsAndDrapes: 'Seamless one-piece minimalist contour',
        colorHexOrTone: '#111827 (Black)'
      },
      {
        layerName: 'accessories',
        description: 'Thin titanium round wire-frame spectacles and simple fabric wristband',
        fabricType: 'Titanium and braided cord',
        tensionFoldsAndDrapes: 'Lightweight resting comfortably on nasal bridge',
        colorHexOrTone: '#6B7280 (Gunmetal)'
      }
    ],
    fabricTextures: ['Heavy French terry', 'Selvedge denim', 'Ripstop nylon', 'Brushed modal cotton'],
    characteristicSilhouettes: ['Drop-shoulder oversized upper', 'Wide-leg stacked bottoms', 'Cropped outer layers'],
    recommendedAccessories: ['Silver chain necklaces', 'Ballistic cross-body pouch', 'Beanie or bucket hat']
  },

  techwear: {
    style: 'techwear',
    name: 'Cyberpunk & Modular Tactical Techwear',
    description: 'Weatherproof technical textiles, Fidlock magnetic buckles, articulated ergonomic gussets, and utilitarian modular attachments.',
    dutyLayers: [
      {
        layerName: 'base',
        description: 'Compression mock-neck base layer with targeted thermal ventilation zones',
        fabricType: 'Elastane merino technical blend',
        tensionFoldsAndDrapes: 'Skin-tight anatomical tension tracing muscle contours',
        colorHexOrTone: '#0F172A (Deep Obsidian)'
      },
      {
        layerName: 'outer',
        description: 'Asymmetric 3-layer waterproof shell jacket with Fidlock magnetic sling',
        fabricType: 'GORE-TEX Pro 3L membrane',
        tensionFoldsAndDrapes: 'Crisp geometric origami-like folds along storm flap and articulation darts',
        colorHexOrTone: '#020617 (Matte Black)'
      },
      {
        layerName: 'bottom',
        description: 'Articulated ergonomic cargo trousers with waterproof zippered holster pockets',
        fabricType: 'Schoeller Dryskin with DWR coating',
        tensionFoldsAndDrapes: 'Tapered knee darts creating pre-bent articulated silhouette',
        colorHexOrTone: '#1E293B (Shadow Slate)'
      },
      {
        layerName: 'footwear',
        description: 'Waterproof tactical combat boots with Vibram Megagrip lugged outsole and BOA dial system',
        fabricType: 'Cordura ballistic nylon and rubberized rand',
        tensionFoldsAndDrapes: 'Reinforced rigid heel counter and armored toe box',
        colorHexOrTone: '#000000 (Blackout)'
      },
      {
        layerName: 'accessories',
        description: 'Chest rig harness with molle webbing, modular utility carabiners, and stealth wrist communicator',
        fabricType: 'Aircraft aluminum and Mil-spec webbing',
        tensionFoldsAndDrapes: 'Tensioned diagonal straps crossing sternum and lats',
        colorHexOrTone: '#38BDF8 / #0F172A (Cyan Accent on Matte Black)'
      }
    ],
    privateLayers: [
      {
        layerName: 'base',
        description: 'Relaxed technical waffle-knit long-sleeve top',
        fabricType: 'Breathable bamboo poly blend',
        tensionFoldsAndDrapes: 'Gentle drape across shoulders and relaxed sleeves',
        colorHexOrTone: '#1E293B (Dark Navy)'
      },
      {
        layerName: 'bottom',
        description: 'Minimalist four-way stretch commuter jogger pants',
        fabricType: 'Technical stretch twill',
        tensionFoldsAndDrapes: 'Smooth clean line with elasticated ankle cuffs',
        colorHexOrTone: '#0F172A (Graphite)'
      },
      {
        layerName: 'footwear',
        description: 'Slip-on knit trail recovery shoes',
        fabricType: 'Engineered knit and cushioned foam',
        tensionFoldsAndDrapes: 'Sock-like snug wrap over instep',
        colorHexOrTone: '#334155 (Slate)'
      },
      {
        layerName: 'accessories',
        description: 'Carbon fiber minimalist signet ring and smart wrist tracker',
        fabricType: 'Matte carbon composite',
        tensionFoldsAndDrapes: 'Seamless low-profile fit',
        colorHexOrTone: '#475569 (Matte Graphite)'
      }
    ],
    fabricTextures: ['GORE-TEX Pro', 'Schoeller Dryskin', 'Cordura 1000D', 'Mil-spec webbing'],
    characteristicSilhouettes: ['Tapered carrot leg', 'High-collar cowl neck', 'Articulated limb segments'],
    recommendedAccessories: ['Fidlock utility harness', 'Chest rig', 'Waterproof sling bag']
  },

  fantasy: {
    style: 'fantasy',
    name: 'High Fantasy & Arcane Adventurer',
    description: 'Enchanted leather pauldrons, flowing embroidered travel mantles, silver filigree bracers, and runic textiles.',
    dutyLayers: [
      {
        layerName: 'base',
        description: 'Linen tunic with high mandarin collar and embroidered runic trim',
        fabricType: 'Hand-loomed raw linen',
        tensionFoldsAndDrapes: 'Natural gathering at belted waist and billowed sleeves',
        colorHexOrTone: '#F5F5F4 (Warm Alabaster)'
      },
      {
        layerName: 'outer',
        description: 'Tailored leather gambeson with boiled-leather shoulder pauldrons and sweeping half-cape',
        fabricType: 'Tanned calfskin and heavy wool cloak',
        tensionFoldsAndDrapes: 'Stout protective chest drape with graceful billowing cape folds',
        colorHexOrTone: '#3F2E23 (Deep Walnut Brown) with #3B82F6 (Azure Mantle)'
      },
      {
        layerName: 'bottom',
        description: 'Reinforced riding trousers with double-layered inner thigh suede patches',
        fabricType: 'Heavy wool serge and suede',
        tensionFoldsAndDrapes: 'Snug fit tucked seamlessly into tall boots',
        colorHexOrTone: '#1C1917 (Earthy Charcoal)'
      },
      {
        layerName: 'footwear',
        description: 'Tall knee-high combat riding boots with steel buckle fastenings',
        fabricType: 'Weathered oiled leather',
        tensionFoldsAndDrapes: 'Supple wrinkles around ankle flexion zone with polished shin guards',
        colorHexOrTone: '#292524 (Dark Espresso)'
      },
      {
        layerName: 'accessories',
        description: 'Tooled leather broadsword baldric, silver filigree bracers with glowing mana sapphire, and guild signet',
        fabricType: 'Engraved sterling silver and dyed harness leather',
        tensionFoldsAndDrapes: 'Firm diagonal torso band securing scabbard across back',
        colorHexOrTone: '#D4AF37 (Antique Gold) & #60A5FA (Arcane Glow)'
      }
    ],
    privateLayers: [
      {
        layerName: 'base',
        description: 'Loose open-collar natural linen poet shirt with braided laces',
        fabricType: 'Soft washed raw linen',
        tensionFoldsAndDrapes: 'Generous soft folds draped casually over chest and wrists',
        colorHexOrTone: '#E7E5E4 (Oatmeal Cream)'
      },
      {
        layerName: 'bottom',
        description: 'Comfortable relaxed drawstring breeches',
        fabricType: 'Homespun brushed wool blend',
        tensionFoldsAndDrapes: 'Relaxed folds tapering slightly at calf',
        colorHexOrTone: '#44403C (Warm Stone)'
      },
      {
        layerName: 'footwear',
        description: 'Soft indoor leather moccasins with fleece lining',
        fabricType: 'Supple deerskin',
        tensionFoldsAndDrapes: 'Conforming flexibly to foot contours',
        colorHexOrTone: '#78716C (Muted Taupe)'
      },
      {
        layerName: 'accessories',
        description: 'Carved wooden charm on leather cord and leather bound spell-journal',
        fabricType: 'Polished cedar wood and calfskin',
        tensionFoldsAndDrapes: 'Resting gently over chest',
        colorHexOrTone: '#A8A29E (Wood & Parchment)'
      }
    ],
    fabricTextures: ['Boiled leather', 'Raw linen', 'Heavy wool serge', 'Weathered suede'],
    characteristicSilhouettes: ['Sweeping asymmetrical mantle', 'Belted waist silhouette', 'High-riding boots'],
    recommendedAccessories: ['Runic bracers', 'Tooled leather belt', 'Gems & spell pouches']
  },

  martial: {
    style: 'martial',
    name: 'Modern Martial Arts & Neo-Traditional Hanbok / Gi',
    description: 'Deconstructed crossover lapels, wrist wraps, wide-legged hakama / modern hanbok pants, and agile combat footwear.',
    dutyLayers: [
      {
        layerName: 'base',
        description: 'Fitted sleeveless compression training top',
        fabricType: 'Sweat-wicking stretch technical jersey',
        tensionFoldsAndDrapes: 'Firm anatomical compression accentuating torso musculature',
        colorHexOrTone: '#18181B (Pitch Black)'
      },
      {
        layerName: 'outer',
        description: 'Modernized cropped martial jacket with crossover collar and wide tactical sash',
        fabricType: 'Heavy double-weave hemp and ripstop cotton',
        tensionFoldsAndDrapes: 'Structured crossover fold across chest held by knotted belt',
        colorHexOrTone: '#09090B (Onyx) with #DC2626 (Crimson Trim)'
      },
      {
        layerName: 'bottom',
        description: 'Pleated wide-leg martial trousers tapering sharply at tied calves',
        fabricType: 'Medium-weight durable cotton twill',
        tensionFoldsAndDrapes: 'Deep fluid vertical pleats designed for high-kick mobility',
        colorHexOrTone: '#18181B (Onyx Black)'
      },
      {
        layerName: 'footwear',
        description: 'Lightweight split-toe agile combat tabi shoes with reinforced gum rubber sole',
        fabricType: 'Reinforced canvas and natural gum rubber',
        tensionFoldsAndDrapes: 'Close glove-like wrap around toes and arch',
        colorHexOrTone: '#27272A (Charcoal)'
      },
      {
        layerName: 'accessories',
        description: 'Tight cotton canvas forearm wraps, weighted hand bandages, and blackened iron warrior pendant',
        fabricType: 'Bleached cotton wraps and hand-forged wrought iron',
        tensionFoldsAndDrapes: 'Layered spiral compression binding forearms and knuckles',
        colorHexOrTone: '#FAFAFA (Bone White) & #52525B (Iron)'
      }
    ],
    privateLayers: [
      {
        layerName: 'base',
        description: 'Relaxed kimono-collar linen loungewear robe',
        fabricType: 'Pre-washed lightweight linen',
        tensionFoldsAndDrapes: 'Flowing effortless drape with loose tied waist chord',
        colorHexOrTone: '#27272A (Soft Black)'
      },
      {
        layerName: 'bottom',
        description: 'Straight-cut relaxed linen lounging pants',
        fabricType: 'Airy linen blend',
        tensionFoldsAndDrapes: 'Gentle vertical drape with comfortable looseness',
        colorHexOrTone: '#3F3F46 (Dark Ash)'
      },
      {
        layerName: 'footwear',
        description: 'Woven straw zori sandals with soft velvet thong straps',
        fabricType: 'Natural rush grass and velvet',
        tensionFoldsAndDrapes: 'Flat traditional profile',
        colorHexOrTone: '#A1A1AA (Natural Straw & Black Velvet)'
      },
      {
        layerName: 'accessories',
        description: 'Smooth wooden prayer bead bracelet (108 beads) and bamboo fan',
        fabricType: 'Polished sandalwood',
        tensionFoldsAndDrapes: 'Draped snugly around left wrist',
        colorHexOrTone: '#71717A (Sandalwood)'
      }
    ],
    fabricTextures: ['Double-weave hemp', 'Bleached cotton canvas', 'Heavy ripstop twill', 'Washed linen'],
    characteristicSilhouettes: ['Crossover collar chest drape', 'Pleated wide-leg pants', 'Wrapped forearms'],
    recommendedAccessories: ['Hand bandages', 'Tactical sash belt', 'Iron medallion']
  },

  classic_tailoring: {
    style: 'classic_tailoring',
    name: 'Bespoke Haute Tailoring & Executive Sartorial',
    description: 'Savile Row / Neapolitan precision tailoring, structured shoulder roping, peak lapels, and fine Oxford leather craftsmanship.',
    dutyLayers: [
      {
        layerName: 'base',
        description: 'Crisp Egyptian cotton dress shirt with Italian spread collar and French double cuffs',
        fabricType: '120s two-ply royal Oxford cotton',
        tensionFoldsAndDrapes: 'Form-fitting darted waist with crisp knife-edge sleeve creases',
        colorHexOrTone: '#FFFFFF (Pure Optical White)'
      },
      {
        layerName: 'inner',
        description: 'Six-button tailored waistcoat with silk satin back and cinch buckle',
        fabricType: 'Super 150s worsted wool and mulberry silk',
        tensionFoldsAndDrapes: 'Contoured hugging of torso arch and thoracic taper',
        colorHexOrTone: '#1E293B (Midnight Navy)'
      },
      {
        layerName: 'outer',
        description: 'Double-breasted tailored jacket with prominent 10cm peak lapels and structured roped shoulders',
        fabricType: 'Super 150s Merino wool with pinstripe weave',
        tensionFoldsAndDrapes: 'Impeccable clean hourglass drape accentuating broad shoulders and lean waist',
        colorHexOrTone: '#0F172A (Deep Ink Navy with subtle chalk stripe)'
      },
      {
        layerName: 'bottom',
        description: 'High-waisted trousers with double forward pleats and side tab adjusters',
        fabricType: 'Matching worsted wool',
        tensionFoldsAndDrapes: 'Immaculate vertical front crease ending in a slight break above shoes',
        colorHexOrTone: '#0F172A (Deep Ink Navy)'
      },
      {
        layerName: 'footwear',
        description: 'Hand-burnished wholecut Oxford dress shoes with mirror-shine cap toe',
        fabricType: 'French box calf leather and oak bark tanned leather soles',
        tensionFoldsAndDrapes: 'Seamless sculptured leather with deep lustrous patina',
        colorHexOrTone: '#451A03 (Deep Burnished Burgundy / Oxblood)'
      },
      {
        layerName: 'accessories',
        description: 'Heavy silk jacquard necktie, folded linen pocket square, mother-of-pearl cufflinks, and luxury mechanical chronometer',
        fabricType: 'Handmade Italian silk, platinum, and alligator leather strap',
        tensionFoldsAndDrapes: 'Dimpled necktie knot resting firmly in collar point',
        colorHexOrTone: '#1E3A8A (Navy/Gold Accent) & #CBD5E1 (Polished Platinum)'
      }
    ],
    privateLayers: [
      {
        layerName: 'base',
        description: 'Finely spun cashmere and silk knit crewneck sweater',
        fabricType: 'Mongolian pure 2-ply cashmere',
        tensionFoldsAndDrapes: 'Soft feather-light drape over shoulders and chest',
        colorHexOrTone: '#334155 (Slate Blue Heather)'
      },
      {
        layerName: 'bottom',
        description: 'Relaxed tailored wool-flannel drawstring trousers',
        fabricType: 'Soft melange flannel wool',
        tensionFoldsAndDrapes: 'Gentle drape maintaining clean lines with comfortable give',
        colorHexOrTone: '#475569 (Charcoal Flannel)'
      },
      {
        layerName: 'footwear',
        description: 'Unlined Italian suede penny loafers',
        fabricType: 'Velvety reverse calf suede',
        tensionFoldsAndDrapes: 'Soft conforming arch without stiff lining',
        colorHexOrTone: '#78350F (Cognac Tan Suede)'
      },
      {
        layerName: 'accessories',
        description: 'Ultra-thin gold dress watch on Horween cordovan strap and horn-rimmed reading glasses',
        fabricType: 'Rose gold and genuine tortoise acetate',
        tensionFoldsAndDrapes: 'Understated elegance on wrist and collar',
        colorHexOrTone: '#F59E0B (Warm Rose Gold)'
      }
    ],
    fabricTextures: ['Super 150s Merino wool', 'Royal Oxford cotton', 'Mulberry silk', 'Box calf leather'],
    characteristicSilhouettes: ['Double-breasted peak lapel', 'High-waisted pleated trousers', 'Hourglass waist taper'],
    recommendedAccessories: ['Silk jacquard tie', 'Platinum cufflinks', 'Mechanical chronograph']
  }
};

/**
 * Resolves wardrobe layers according to selected style and attire state ('duty' | 'private' | 'hybrid').
 */
export function getWardrobeLayers(
  style: ClothingStyleCategory, 
  state: AttireState = 'duty'
): ClothingLayer[] {
  const preset = WARDROBE_PRESETS[style] ?? WARDROBE_PRESETS.streetwear;
  if (state === 'private') {
    return preset.privateLayers;
  }
  if (state === 'hybrid') {
    // Blends duty outer/footwear with private relaxed inner
    return [
      preset.privateLayers[0], // relaxed inner
      preset.dutyLayers[1] ?? preset.dutyLayers[0], // duty outer
      preset.dutyLayers[3] ?? preset.privateLayers[1], // bottom
      preset.dutyLayers[4] ?? preset.privateLayers[2], // footwear
      preset.dutyLayers[5] ?? preset.privateLayers[3]  // accessories
    ].filter(Boolean);
  }
  return preset.dutyLayers;
}
