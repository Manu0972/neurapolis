/**
 * Logique de simulation pure pour les cartes stratégiques des paliers 4 à 6.
 * Dit quelles cartes, régions et lieux sont débloqués selon le palier d'Ascension,
 * les contacts noués et les entreprises lancées.
 *
 * Déterministe, sans effets de bord, sans DOM, sans Math.random() ni Date.now().
 */
import type { WorldState } from '../core/types';
import type { VentureRun } from '../core/ascension_types';
import type { StrategicLocationDef, StrategicMapDef, StrategicMapTier } from '../data/maps/types';
import { STRATEGIC_MAP_BY_TIER } from '../data/maps';

export function isStrategicMapUnlocked(w: WorldState): boolean {
  if (w.economy?.sandbox) return true;
  return (w.ascension?.tier ?? 1) >= 4;
}

export function unlockedMapTiers(w: WorldState): StrategicMapTier[] {
  const currentTier = w.ascension?.tier ?? 1;
  const allTiers: StrategicMapTier[] = [4, 5, 6];
  if (w.economy?.sandbox) return allTiers;
  return allTiers.filter((t) => currentTier >= t);
}

export function getStrategicMap(tier: StrategicMapTier): StrategicMapDef | undefined {
  return STRATEGIC_MAP_BY_TIER[tier];
}

export interface LocationStatus {
  unlocked: boolean;
  reason?: string;
  activeVentures: VentureRun[];
}

export function getLocationStatus(w: WorldState, location: StrategicLocationDef): LocationStatus {
  const sandbox = !!w.economy?.sandbox;
  const contacts = w.ascension?.contacts ?? {};
  const ventures = w.ascension?.ventures ?? {};

  // Entreprises actives liées à ce lieu
  const activeVentures: VentureRun[] = [];
  if (location.ideas) {
    for (const ideaId of location.ideas) {
      const v = ventures[ideaId];
      if (v && !v.closed) {
        activeVentures.push(v);
      }
    }
  }

  // Vérification de contact requis
  if (!sandbox && location.requiresContact && location.requiresContact.length > 0) {
    const hasContact = location.requiresContact.some((c) => contacts[c] !== undefined);
    if (!hasContact) {
      return {
        unlocked: false,
        reason: `Exige un contact établi parmi : ${location.requiresContact.join(', ')}.`,
        activeVentures,
      };
    }
  }

  // Vérification d'entreprise requise
  if (!sandbox && location.requiresVenture && location.requiresVenture.length > 0) {
    const hasVenture = location.requiresVenture.some((vId) => ventures[vId] && !ventures[vId]!.closed);
    if (!hasVenture) {
      return {
        unlocked: false,
        reason: `Exige le lancement préalable d’une entreprise clé.`,
        activeVentures,
      };
    }
  }

  return {
    unlocked: true,
    activeVentures,
  };
}

export interface StrategicMapSummary {
  tier: StrategicMapTier;
  mapDef: StrategicMapDef;
  unlocked: boolean;
  totalLocations: number;
  unlockedLocations: number;
  activeVenturesCount: number;
}

export function getStrategicMapSummary(w: WorldState, tier: StrategicMapTier): StrategicMapSummary | undefined {
  const mapDef = getStrategicMap(tier);
  if (!mapDef) return undefined;

  const isUnlocked = isStrategicMapUnlocked(w) && unlockedMapTiers(w).includes(tier);
  let unlockedLocs = 0;
  const activeVentureIds = new Set<string>();

  for (const loc of mapDef.locations) {
    const st = getLocationStatus(w, loc);
    if (st.unlocked) unlockedLocs += 1;
    for (const v of st.activeVentures) {
      activeVentureIds.add(v.ideaId);
    }
  }

  return {
    tier,
    mapDef,
    unlocked: isUnlocked,
    totalLocations: mapDef.locations.length,
    unlockedLocations: unlockedLocs,
    activeVenturesCount: activeVentureIds.size,
  };
}
