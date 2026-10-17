/**
 * Dévoilement progressif du HUD (vague 5). Au début, l'écran ne montre que le bandeau de mission,
 * la mini-carte et l'horloge. Chaque autre élément apparaît quand une mission en a besoin, seul,
 * avec UNE phrase qui dit à quoi il sert. Fonctions pures (testables sans DOM) ; l'état « déjà
 * montré » vit dans `w.seen['hud:<élément>']` (pas de changement de schéma).
 */
import type { WorldState } from '../core/types';
import type { MissionStep } from '../simulation/missions';
import { chapter1Sales, chapter1Team } from '../simulation/campaign';

export type HudPart = 'argent' | 'plan' | 'menu' | 'temps' | 'besoins' | 'telephone' | 'conseil' | 'actus';

/** Ordre de présentation et phrase d'accueil de chaque élément. */
export const HUD_PARTS: ReadonlyArray<{ id: HudPart; intro: string }> = [
  { id: 'argent', intro: '💶 Ton argent de poche : c’est lui qui paie ton stock et tes projets.' },
  { id: 'plan', intro: '🗺️ Le plan de la ville (touche M) : pour retrouver un lieu.' },
  { id: 'menu', intro: '☰ Le menu : sauvegardes, son, caméra et tous les panneaux détaillés.' },
  { id: 'temps', intro: '⏩ Le temps : accélère ou fais passer les heures quand tu dois attendre.' },
  { id: 'besoins', intro: '❤️ Tes besoins : mange, repose-toi, sinon tout devient plus dur.' },
  { id: 'telephone', intro: '📱 Ton téléphone (touche P) : tes affaires, ta banque et tes contacts.' },
  { id: 'conseil', intro: '👻 Le Conseil : des voix du passé te conseillent avant tes grandes décisions.' },
  { id: 'actus', intro: '📰 Les actualités : ce qui se passe dans le pays et pèse sur tes prix.' },
];

export const hudSeenKey = (p: HudPart): string => `hud:${p}`;

/** Un besoin devient préoccupant : il faut montrer les jauges. */
function needsAlarm(w: WorldState): boolean {
  const n = w.player.needs;
  return n.fatigue >= 70 || n.faim >= 70 || n.stress >= 70 || n.moral <= 30;
}

/** Éléments dont la partie a besoin maintenant (dans l'ordre de HUD_PARTS). */
export function hudPartsWanted(w: WorldState, step: MissionStep | null): HudPart[] {
  const after1 = w.campaign.currentChapter > 1 || w.campaign.completedChapters.includes(1);
  const active = w.project?.active ?? false;
  const want: Record<HudPart, boolean> = {
    argent: after1 || active || step?.action?.do === 'acheter_stock' || step?.id === 'c1:stock:aller',
    plan: after1 || active,
    menu: after1 || chapter1Sales(w) >= 1,
    temps: after1 || chapter1Team(w) >= 1 || (step?.kind === 'attendre' && step.id !== 'sommeil' && step.id !== 'en-cours'),
    besoins: after1 || needsAlarm(w),
    telephone: after1,
    conseil: after1,
    actus: after1,
  };
  return HUD_PARTS.map((p) => p.id).filter((id) => want[id]);
}

/**
 * Le prochain élément à dévoiler (un seul à la fois) : le premier voulu et pas encore montré.
 * Une partie déjà avancée (après le chapitre 1, ou ancienne sauvegarde) dévoile tout d'un coup,
 * sans phrases : `silent` vaut alors vrai.
 */
export function nextHudReveal(w: WorldState, step: MissionStep | null): { part: HudPart; silent: boolean } | null {
  const part = hudPartsWanted(w, step).find((p) => !w.seen[hudSeenKey(p)]);
  if (!part) return null;
  const silent = w.campaign.currentChapter > 2;
  return { part, silent };
}
