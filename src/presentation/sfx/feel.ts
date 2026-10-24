/**
 * Branchement des sensations dans la boucle de jeu : un seul appel `frame()` par image depuis
 * game.ts. Pas selon le sol et la vitesse, porte + fondu en passant un seuil, nappes d'ambiance,
 * ventes (caisse, pièces), fenêtres et téléphone (sons d'ouverture / fermeture), invite qui pulse,
 * arrivée sur la balise. Les retours visuels sont dans feedback.ts, les sons dans index.ts.
 */
import { benchSfxOffline, sfx } from './index';
import { audio } from '../audio';
import { FootstepClock, ambienceLevels, coinCount, edge, newSales, panelCue, type FootSurface } from './logic';
import { coinBurst, fadeVeil, installButtonBounce, popPrompt } from './feedback';
import { reduceMotion } from './prefs';

export interface FeelDeps {
  root: HTMLElement;
  modalEl: HTMLElement;
  promptEl: HTMLElement;
  /** Là où filent les pièces des ventes (caisse du stand / commerces), sinon le porte-monnaie. */
  cashEl: HTMLElement;
  moneyEl: HTMLElement;
  /** Secousse de caméra (amplitude en mètres) ; ignorée si « Réduire les animations ». */
  shake?: (amp: number) => void;
}

export interface FeelFrame {
  /** Secondes depuis l'image précédente. */
  dt: number;
  /** Vitesse du joueur (m/s) ; 0 s'il ne marche pas (fenêtre ouverte, vélo…). */
  speed: number;
  surface: FootSurface;
  inside: boolean;
  meteo: string | undefined;
  hour: number;
  location: string;
  /** Compteur cumulé des clients servis aujourd'hui dans les commerces du joueur. */
  customers: number;
}

export interface GameFeel {
  frame(f: FeelFrame): void;
  /** Vente au stand : caisse, pièces depuis `from` (bouton) vers la caisse, montant qui flotte. */
  sale(amount: number, from?: Element | null): void;
  /** « Mission accomplie » (jingle) ou « Chapitre terminé » (fanfare) et très légère secousse. */
  mission(chapter: boolean): void;
}

const fmtEur = (v: number): string => `+${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function createGameFeel(deps: FeelDeps): GameFeel {
  const steps = new FootstepClock();
  let wasInside: boolean | null = null;
  let ambT = 1;
  let lastCustomers = -1;
  let pendingSales = 0;
  let saleCooldown = 0;
  const cash = (): HTMLElement => (deps.cashEl.offsetParent ? deps.cashEl : deps.moneyEl);
  const screenMid = (): { x: number; y: number } => ({ x: innerWidth / 2, y: innerHeight * 0.55 });

  // Fenêtres et téléphone : on écoute la classe `hidden` et le contenu de la fenêtre.
  let open = !deps.modalEl.classList.contains('hidden');
  let phone = false;
  if (typeof MutationObserver === 'function') {
    new MutationObserver((muts) => {
      const isOpen = !deps.modalEl.classList.contains('hidden') && deps.modalEl.childElementCount > 0;
      const isPhone = isOpen ? !!deps.modalEl.querySelector('.phone') : phone;
      const cue = panelCue(open, isOpen, isOpen ? isPhone : phone);
      if (cue) {
        if (cue.startsWith('phone')) sfx.phone(cue === 'phone-open');
        else sfx.panel(cue === 'panel-open');
        const panel = deps.modalEl.firstElementChild;
        if (cue.endsWith('open')) popIn(panel);
      } else if (isOpen && muts.some((m) => m.type === 'childList' && m.addedNodes.length > 0)) {
        sfx.panel(true); // une fenêtre en remplace une autre
      }
      open = isOpen;
      phone = isPhone;
    }).observe(deps.modalEl, { attributes: true, attributeFilter: ['class'], childList: true });
  }

  // Invite « E — … » : petit pop quand une nouvelle action devient possible.
  let lastPrompt = '';
  if (typeof MutationObserver === 'function') {
    new MutationObserver(() => {
      const visible = !deps.promptEl.classList.contains('hidden');
      const text = visible ? deps.promptEl.textContent ?? '' : '';
      if (text && text !== lastPrompt) popPrompt(deps.promptEl);
      lastPrompt = text;
    }).observe(deps.promptEl, { attributes: true, attributeFilter: ['class'], childList: true, characterData: true, subtree: true });
  }

  installButtonBounce(deps.root, () => sfx.tick());

  function popIn(el: Element | null): void {
    if (!el || reduceMotion() || typeof (el as HTMLElement).animate !== 'function') return;
    (el as HTMLElement).animate([{ opacity: 0, scale: '0.96' }, { opacity: 1, scale: '1' }], { duration: 180, easing: 'ease-out' });
  }

  const api: GameFeel = {
    frame(f: FeelFrame): void {
      const dt = Math.max(0, Math.min(0.1, f.dt));
      // Pas : la cadence suit la vitesse, le son suit le sol.
      if (steps.update(dt, f.speed)) sfx.step(f.surface, f.speed);
      // Seuil franchi : porte qui s'ouvre puis se referme, fondu bref.
      if (wasInside !== null) {
        const e = edge(wasInside, f.inside);
        if (e) {
          sfx.doorOpen();
          sfx.doorClose(0.38);
          fadeVeil();
        }
      }
      wasInside = f.inside;
      audio.setIndoor(f.inside);
      // Nappes d'ambiance (2 fois par seconde suffit : les volumes glissent d'eux-mêmes).
      ambT += dt;
      if (ambT >= 0.5) {
        ambT = 0;
        sfx.ambience(ambienceLevels({ meteo: f.meteo, inside: f.inside, hour: f.hour, location: f.location }));
      }
      // Ventes des commerces : caisse + pièces, regroupées (une salve au plus toutes les 1,2 s).
      if (lastCustomers >= 0) pendingSales += newSales(lastCustomers, f.customers);
      lastCustomers = f.customers;
      saleCooldown -= dt;
      if (pendingSales > 0 && saleCooldown <= 0) {
        sfx.sale(pendingSales + 2);
        coinBurst(screenMid(), cash(), Math.min(8, 2 + pendingSales));
        pendingSales = 0;
        saleCooldown = 1.2;
      }
    },
    sale(amount: number, from?: Element | null): void {
      if (!(amount > 0)) return;
      const n = coinCount(amount);
      sfx.sale(n);
      const r = from?.getBoundingClientRect();
      const at = r && r.width > 0 ? { x: r.left + r.width / 2, y: r.top } : screenMid();
      coinBurst(at, cash(), n, fmtEur(amount));
    },
    mission(chapter: boolean): void {
      if (chapter) audio.playChapterComplete();
      else sfx.mission();
      if (!reduceMotion()) deps.shake?.(chapter ? 0.07 : 0.04);
    },
  };
  // Mesures et essais en développement (console : __sfx.stats(), await __sfx.bench(), __sfx.feel.sale(12)).
  if (import.meta.env?.DEV && typeof window !== 'undefined') {
    Object.assign(window, { __sfx: { stats: () => sfx.stats(), bench: benchSfxOffline, sfx, feel: api } });
  }
  return api;
}
