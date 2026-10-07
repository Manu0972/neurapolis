/**
 * GPS (V1.1, lot B), côté présentation : choix de la destination (liste, recherche, clic sur le
 * plan), bandeau de guidage, recalcul quand on s'écarte du chemin, arrivée. L'itinéraire est
 * calculé par `simulation/route.ts` ; rien n'est écrit dans le monde (pas de sauvegarde).
 */
import type { WorldState } from '../core/types';
import { BUS_LINE_BY_ID, BUS_STOP_BY_ID } from '../data/city/transit';
import { busHint, findRoute, gpsDestinations, remainingMeters, searchDestinations, type GpsDestination, type Route } from '../simulation/route';
import { setGpsRoute } from './minimap';
import { setHelp } from './help';

const RECHECK_MS = 700;
const OFF_ROUTE_M = 6;
const ARRIVED_M = 4;

export interface GpsDeps {
  world: WorldState;
  pose: () => { x: number; z: number };
  setRoute3D: (points: { x: number; y: number }[] | null) => void;
  toast: (text: string, ok: boolean) => void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function fmtMeters(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${Math.max(0, Math.round(m))} m`;
}

export class GpsController {
  readonly chip: HTMLElement;
  private dest: GpsDestination | null = null;
  private route: Route | null = null;
  private lastCheck = 0;
  private hintText = '';
  private readonly label: HTMLElement;
  private readonly hint: HTMLElement;

  constructor(private readonly deps: GpsDeps) {
    this.chip = el('div', 'gps-chip hidden');
    setHelp(this.chip, 'gps');
    const row = el('div', 'gps-chip-row');
    this.label = el('span', 'gps-chip-label', '');
    const stop = el('button', 'gps-chip-stop', '✕');
    stop.type = 'button';
    stop.setAttribute('aria-label', 'Arrêter le guidage');
    stop.addEventListener('click', () => this.clear());
    row.append(this.label, stop);
    this.hint = el('div', 'gps-chip-hint', '');
    this.chip.append(row, this.hint);
  }

  get active(): GpsDestination | null {
    return this.dest;
  }

  /** Point d'arrivée (pour le faisceau de repère 3D). */
  get target(): { x: number; y: number } | null {
    return this.dest ? { x: this.dest.x, y: this.dest.y } : null;
  }

  go(dest: GpsDestination): boolean {
    if (dest.locked) {
      this.deps.toast(`${dest.name} est dans un quartier encore fermé.`, false);
      return false;
    }
    const p = this.deps.pose();
    const route = findRoute(this.deps.world, { x: p.x, y: p.z }, dest);
    if (!route) {
      this.deps.toast(`Pas de chemin à pied jusqu’à ${dest.name}.`, false);
      return false;
    }
    this.dest = dest;
    const bus = busHint({ x: p.x, y: p.z }, dest, route.meters);
    this.hintText = bus
      ? `🚌 Plus rapide en bus : ${bus.lines.map((l) => BUS_LINE_BY_ID[l]?.name ?? l).join(' puis ')}, de « ${BUS_STOP_BY_ID[bus.board]?.name} » à « ${BUS_STOP_BY_ID[bus.alight]?.name} »${bus.transfer ? ` (changement à « ${BUS_STOP_BY_ID[bus.transfer]?.name} »)` : ''}.`
      : '';
    this.apply(route);
    this.deps.toast(`🧭 Itinéraire vers ${dest.name} : ${fmtMeters(route.meters)}.`, true);
    return true;
  }

  clear(): void {
    this.dest = null;
    this.route = null;
    setGpsRoute(null);
    this.deps.setRoute3D(null);
    this.chip.classList.add('hidden');
  }

  private apply(route: Route): void {
    this.route = route;
    setGpsRoute({ points: route.points, dest: this.dest! });
    this.deps.setRoute3D(route.points);
    this.chip.classList.remove('hidden');
    this.refreshLabel(route.meters);
  }

  private refreshLabel(meters: number): void {
    if (!this.dest) return;
    const text = `🧭 ${this.dest.name} · ${fmtMeters(meters)}`;
    if (this.label.textContent !== text) this.label.textContent = text;
    if (this.hint.textContent !== this.hintText) this.hint.textContent = this.hintText;
    this.hint.classList.toggle('hidden', !this.hintText);
  }

  /** Appelé par la boucle de jeu : distance restante, recalcul hors du chemin, arrivée. */
  tick(now: number): void {
    if (!this.dest || !this.route || now - this.lastCheck < RECHECK_MS) return;
    this.lastCheck = now;
    const p = this.deps.pose();
    const here = { x: p.x, y: p.z };
    if (Math.hypot(this.dest.x + 0.5 - here.x, this.dest.y + 0.5 - here.y) <= ARRIVED_M) {
      this.deps.toast(`📍 Tu es arrivé·e : ${this.dest.name}.`, true);
      this.clear();
      return;
    }
    const left = remainingMeters(this.route, here);
    if (left.offRoute > OFF_ROUTE_M) {
      const r = findRoute(this.deps.world, here, this.dest);
      if (r) {
        this.apply(r);
        return;
      }
    }
    this.refreshLabel(left.meters);
  }

  /** Destination la plus proche d'un point cliqué sur le plan (dans un rayon de 30 m). */
  pickNear(x: number, y: number): GpsDestination | null {
    let best: { d: GpsDestination; dist: number } | null = null;
    for (const d of gpsDestinations(this.deps.world)) {
      const dist = Math.hypot(d.x - x, d.y - y);
      if (dist <= 30 && (!best || dist < best.dist)) best = { d, dist };
    }
    return best?.d ?? null;
  }

  /** Panneau de choix : recherche, filtres, liste. `onChosen` ferme la fenêtre du plan. */
  panel(onChosen: () => void): HTMLElement {
    const all = gpsDestinations(this.deps.world);
    const box = el('div', 'gps-panel');
    const head = el('div', 'gps-panel-head');
    const input = el('input', 'gps-search') as HTMLInputElement;
    input.type = 'search';
    input.placeholder = '🔎 Où vas-tu ? (collège, boulangerie, arrêt…)';
    head.appendChild(input);
    if (this.dest) {
      const stop = el('button', 'ph-btn', `✕ Arrêter le guidage (${this.dest.name})`);
      stop.addEventListener('click', () => { this.clear(); render(); });
      head.appendChild(stop);
    }
    const filters = el('div', 'gps-filters');
    const KINDS: [GpsDestination['kind'] | 'tout', string][] = [['tout', 'Tout'], ['lieu', '📍 Lieux'], ['repere', '🏛️ Lieux remarquables'], ['arret', '🚏 Arrêts'], ['commerce', '🏪 Tes commerces']];
    let kind: GpsDestination['kind'] | 'tout' = 'tout';
    const list = el('div', 'gps-list');
    const render = (): void => {
      list.replaceChildren();
      const found = searchDestinations(all, input.value).filter((d) => kind === 'tout' || d.kind === kind);
      if (!found.length) list.appendChild(el('p', 'panel-note', 'Aucun lieu ne correspond.'));
      for (const d of found) {
        const b = el('button', `gps-item${d.locked ? ' locked' : ''}`);
        b.type = 'button';
        b.textContent = `${d.icon} ${d.name}${d.locked ? ' · 🔒 quartier fermé' : ''}`;
        b.addEventListener('click', () => { if (this.go(d)) onChosen(); });
        list.appendChild(b);
      }
    };
    for (const [k, label] of KINDS) {
      const f = el('button', `gps-filter${k === kind ? ' on' : ''}`, label);
      f.type = 'button';
      f.addEventListener('click', () => {
        kind = k;
        for (const c of filters.children) c.classList.remove('on');
        f.classList.add('on');
        render();
      });
      filters.appendChild(f);
    }
    input.addEventListener('input', render);
    box.append(head, filters, list);
    render();
    queueMicrotask(() => input.focus());
    return box;
  }
}
