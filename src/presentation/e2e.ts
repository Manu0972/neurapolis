/**
 * Test de bout en bout dans le vrai navigateur (ouvrir l'URL du jeu avec « ?e2e »).
 * Joue une vraie partie par les mêmes chemins que le joueur (interaction E, téléphone,
 * boucle de jeu en temps réel accéléré) et affiche un rapport. Le rapport est aussi exposé
 * dans `window.__NEURAPOLIS_E2E__` pour être lu par un outil d'automatisation.
 */
import { createCustomWorld } from '../core/player_customization';
import type { WorldState } from '../core/types';
import { startGame } from './game';

interface Step { name: string; ok: boolean; detail: string }
interface Qa {
  interact(): void;
  prompt(): string;
  units(): { id: string; door: { x: number; y: number }; address: string }[];
  pickup(id: string): { x: number; y: number } | null;
  eco: {
    orderStock(w: WorldState, biz: string, g: string, lines: { productId: string; qty: number }[]): { ok: boolean; message: string };
    transferCash(w: WorldState, biz: string, amount: number): { ok: boolean; message: string };
    setOpen(w: WorldState, biz: string, open: boolean): { ok: boolean; message: string };
  };
}

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function until(cond: () => boolean, timeoutMs: number): Promise<boolean> {
  const t0 = performance.now();
  while (performance.now() - t0 < timeoutMs) {
    if (cond()) return true;
    await wait(100);
  }
  return cond();
}

export async function runE2E(root: HTMLElement): Promise<Step[]> {
  const steps: Step[] = [];
  const check = (name: string, ok: boolean, detail = ''): void => {
    steps.push({ name, ok, detail });
    console[ok ? 'log' : 'error'](`[E2E] ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  const world = createCustomWorld({ seed: 2026, customization: { firstName: 'Test', lastName: 'E2E' } });
  world.player.money = 120;
  // Le scénario teste la gestion : la scène d'origine (récit) est considérée comme vue.
  if (world.story) world.story.originDone = true;
  startGame(root, world);
  await wait(800);
  const hook = (window as unknown as { __NEURAPOLIS__?: { world: WorldState; qa: Qa } }).__NEURAPOLIS__;
  check('le jeu démarre et expose son état', !!hook && hook.world === world);
  if (!hook) return steps;
  const { qa } = hook;

  const canvas = root.querySelector<HTMLCanvasElement>('canvas.map-canvas-3d');
  check('le rendu 3D est actif', !!canvas && canvas.width > 0 && getComputedStyle(canvas).display !== 'none');

  // 1. Louer l'étal n° 1 : se placer devant, appuyer sur E, signer dans le téléphone.
  const stall = qa.units().find((u) => u.id === 'etal_1')!;
  world.player.pos = { ...stall.door };
  check('l’invite propose de louer l’étal', /Étal à louer/.test(qa.prompt()), qa.prompt());
  qa.interact();
  await wait(200);
  const signBtn = [...document.querySelectorAll<HTMLButtonElement>('.phone button')].find((b) => b.textContent === 'Signer le bail' && !b.disabled);
  check('le téléphone s’ouvre sur l’annonce', !!signBtn);
  signBtn?.click();
  await wait(100);
  const createBtn = [...document.querySelectorAll<HTMLButtonElement>('.phone button')].find((b) => b.textContent === 'Créer le commerce');
  createBtn?.click();
  await wait(100);
  const biz = Object.keys(world.economy?.businesses ?? {})[0];
  check('le bail est signé et le commerce créé', !!world.economy?.leases['etal_1'] && !!biz);
  document.querySelector<HTMLButtonElement>('.modal-close')?.click();
  if (!biz) return steps;

  // 2. Commander chez Mme Bertin, aller chercher les cartons, les déposer à l'étal.
  qa.eco.transferCash(world, biz, 40);
  const order = qa.eco.orderStock(world, biz, 'g_bertin_depannage', [
    { productId: 'p_gouter_biscuits', qty: 15 }, { productId: 'p_jus_pomme', qty: 10 }, { productId: 'p_pomme', qty: 10 },
  ]);
  check('commande payée, cartons à retirer', order.ok, order.message);
  const pickup = qa.pickup('g_bertin_depannage');
  if (pickup) world.player.pos = { ...pickup };
  check('l’invite propose de charger les cartons', /Charger les cartons/.test(qa.prompt()), qa.prompt());
  qa.interact();
  check('les cartons sont dans les bras', (world.economy?.carried.length ?? 0) > 0);
  world.player.pos = { ...stall.door };
  check('l’invite propose de décharger', /Décharger/.test(qa.prompt()), qa.prompt());
  qa.interact();
  const stock = Object.values(world.economy!.businesses[biz]!.stock).flat().reduce((s, l) => s + l.qty, 0);
  check('la marchandise est en rayon', stock === 35, `${stock} unités`);

  // 3. Ouvrir et vendre : le temps passe pour de vrai (boucle de jeu, vitesse ×20).
  const open = qa.eco.setOpen(world, biz, true);
  check('l’étal ouvre', open.ok, open.message);
  world.time.speed = 20;
  const sold = await until(() => (world.economy?.businesses[biz]?.today.customers ?? 0) > 0 || (world.economy?.businesses[biz]?.history.length ?? 0) > 0, 90_000);
  const today = world.economy?.businesses[biz]?.today;
  check('des clients achètent pendant que le joueur tient l’étal', sold, `${today?.customers ?? 0} clients, ${today?.revenue.toFixed(2) ?? 0} €`);
  world.time.speed = 1;

  // 4. Sauvegarde : l'état économique survit à un aller-retour par le stockage local.
  try {
    localStorage.setItem('neurapolis.save.e2e', JSON.stringify(world));
    const back = JSON.parse(localStorage.getItem('neurapolis.save.e2e') ?? '{}') as WorldState;
    check('la sauvegarde conserve le commerce', !!back.economy?.businesses[biz]);
    localStorage.removeItem('neurapolis.save.e2e');
  } catch (err) {
    check('la sauvegarde conserve le commerce', false, String(err));
  }
  return steps;
}

/** Lance le scénario et affiche le rapport par-dessus le jeu. */
export async function mountE2E(root: HTMLElement): Promise<void> {
  const steps = await runE2E(root);
  const ok = steps.every((s) => s.ok);
  (window as unknown as { __NEURAPOLIS_E2E__: unknown }).__NEURAPOLIS_E2E__ = { ok, steps };
  const panel = document.createElement('div');
  panel.className = 'e2e-report';
  panel.innerHTML = `<b>${ok ? '✅ E2E réussi' : '❌ E2E en échec'}</b> — ${steps.filter((s) => s.ok).length}/${steps.length} étapes`;
  const list = document.createElement('ol');
  for (const s of steps) {
    const li = document.createElement('li');
    li.textContent = `${s.ok ? '✓' : '✗'} ${s.name}${s.detail ? ` — ${s.detail}` : ''}`;
    li.style.color = s.ok ? '#8fe0a0' : '#ff9a8a';
    list.appendChild(li);
  }
  panel.appendChild(list);
  document.body.appendChild(panel);
}
