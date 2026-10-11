/**
 * Lighting, Color Palettes & Camera Setups Module.
 * Models cinematic lighting setups (Chiaroscuro, Hygge 1800K, Studio Softbox, Cyber Neon, Ethereal)
 * and optical camera compositions (focal lengths, shot angles, depth of field).
 */

import type { LightingAndCameraProfile } from '../types.ts';

export interface LightingPresetDefinition {
  presetName: string;
  primaryLightSource: string;
  rimLightingColor: string;
  shadowQuality: 'sharp_cel_shaded' | 'soft_ambient_occlusion' | 'chiaroscuro_dramatic';
  colorGrading: string;
  colorTemperatureK: number;
  subsurfaceScattering: boolean;
  cameraFocalLength: string;
  cameraAngles: string[];
  shotComposition: string;
  depthOfField: string;
}

export const LIGHTING_PRESETS: Record<string, LightingPresetDefinition> = {
  chiaroscuro_dramatic: {
    presetName: 'Chiaroscuro Dramatic Action',
    primaryLightSource: 'Directional 45° overhead high-intensity key light casting deep volumetric shadows',
    rimLightingColor: 'Electric azure (#38BDF8) or crisp lunar white (#F8FAFC) rim light separating subject from dark backdrop',
    shadowQuality: 'chiaroscuro_dramatic',
    colorGrading: 'High-contrast cinematic action grade, desaturated shadows with luminous spectral highlights',
    colorTemperatureK: 4500,
    subsurfaceScattering: true,
    cameraFocalLength: '85mm portrait prime',
    cameraAngles: ['Low-angle heroic upward tilt', 'Dynamic 3/4 action perspective', 'Profile silhouettes'],
    shotComposition: 'Subject framed heroically with dynamic diagonal tension lines and negative space',
    depthOfField: 'f/1.8 shallow depth with creamy background bokeh and laser-sharp iris focus'
  },

  hygge_golden_hour: {
    presetName: 'Hygge 1800K Warm Sunset & Dusk',
    primaryLightSource: 'Low-slung setting sun projecting warm amber rays (1800K-2200K) across facial planes and clothing textures',
    rimLightingColor: 'Warm golden honey (#F59E0B) edge glow with subtle periwinkle violet ambient fill',
    shadowQuality: 'soft_ambient_occlusion',
    colorGrading: 'Comforting nostalgic warmth, soft rolloff in highlights, lavender-tinted cool shadows',
    colorTemperatureK: 1900,
    subsurfaceScattering: true,
    cameraFocalLength: '50mm natural eye perspective',
    cameraAngles: ['Eye-level conversational portrait', '3/4 gentle profile', 'Over-the-shoulder golden glow'],
    shotComposition: 'Centered intimate portrait capturing emotional authenticity and gentle ambient glow',
    depthOfField: 'f/2.0 soft atmospheric blur with warm dust motes floating in light rays'
  },

  studio_softbox: {
    presetName: 'Master Character Model Sheet Studio Daylight',
    primaryLightSource: 'Dual large octagonal softboxes providing clean 5500K neutral daylight illumination across all turnaround angles',
    rimLightingColor: 'Neutral pure daylight contour (#FFFFFF) eliminating camera-shadow bleed',
    shadowQuality: 'soft_ambient_occlusion',
    colorGrading: 'Color-calibrated production reference grade, linear gamma, true-to-life pigment accuracy',
    colorTemperatureK: 5500,
    subsurfaceScattering: true,
    cameraFocalLength: '85mm distortion-free reference telephoto',
    cameraAngles: ['Orthographic eye-level front view', 'Exact lateral 90° profile', 'Exact 180° back view', '3/4 dynamic reference'],
    shotComposition: 'T-pose / neutral standing pose centered on neutral 18% gray studio backdrop with scale grid',
    depthOfField: 'f/8.0 deep focus keeping full body from head to footwear completely tack-sharp'
  },

  cyber_neon_noir: {
    presetName: 'Cyber Neon Noir & City Rain Reflections',
    primaryLightSource: 'Neon storefront sign glow (hot magenta #EC4899 and electric cyan #06B6D4) reflecting off damp asphalt and clothing membranes',
    rimLightingColor: 'Bicolor counter-rim lights: cyan on left shoulder, vibrant magenta on right jawline',
    shadowQuality: 'chiaroscuro_dramatic',
    colorGrading: 'Neo-Tokyo / Seoul rain night grading, saturated specular highlights cutting through obsidian blacks',
    colorTemperatureK: 6500,
    subsurfaceScattering: true,
    cameraFocalLength: '35mm cinematic environmental wide',
    cameraAngles: ['Low-angle street level looking up', 'Tilted Dutch angle action snapshot', 'Intense direct close-up'],
    shotComposition: 'Asymmetrical wide shot with wet street reflections leading gaze towards character silhouette',
    depthOfField: 'f/1.4 extreme bokeh turning city rain and neon lights into luminous circles'
  },

  ethereal_sunlight: {
    presetName: 'Ethereal High-Key Daylight & Sunburst',
    primaryLightSource: 'High-altitude brilliant celestial sunburst with volumetric god rays streaming from behind',
    rimLightingColor: 'Intense incandescent champagne-gold rim (#FEF08A) illuminating hair halo and shoulder contours',
    shadowQuality: 'soft_ambient_occlusion',
    colorGrading: 'Dreamy high-key exposure with subtle chromatic aberration at highlight boundaries',
    colorTemperatureK: 5200,
    subsurfaceScattering: true,
    cameraFocalLength: '135mm telephoto compression',
    cameraAngles: ['Heroic low angle', 'Contemplative 3/4 looking toward horizon', 'Close beauty portrait'],
    shotComposition: 'Heroic silhouette bathed in sunlight halo, wind-blown fabric and hair strands',
    depthOfField: 'f/2.0 dreamy compression with celestial flare'
  }
};

export function getLightingProfile(presetName: string = 'chiaroscuro_dramatic'): LightingAndCameraProfile {
  const p = LIGHTING_PRESETS[presetName] ?? LIGHTING_PRESETS.chiaroscuro_dramatic;
  return {
    presetName: p.presetName,
    primaryLightSource: p.primaryLightSource,
    rimLightingColor: p.rimLightingColor,
    shadowQuality: p.shadowQuality,
    colorGrading: p.colorGrading,
    colorTemperatureK: p.colorTemperatureK,
    subsurfaceScattering: p.subsurfaceScattering,
    cameraFocalLength: p.cameraFocalLength,
    cameraAngles: p.cameraAngles,
    shotComposition: p.shotComposition,
    depthOfField: p.depthOfField
  };
}
