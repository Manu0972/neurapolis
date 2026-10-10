/**
 * Multijoueur en LAN (NordVPN Meshnet ou réseau local) : la session réseau et son panneau.
 *
 * Mondes parallèles reliés : chaque joueur garde sa simulation ; la session échange la présence
 * (avatars dans la ville), l'horloge (l'hôte pilote le temps partagé), les sauts de temps et les
 * interactions (src/simulation/multiplayer.ts). Le premier connecté au salon est l'hôte ; s'il
 * part, le suivant reprend la main.
 */
import type { Notification, PlayerAppearance, PlayerGender, WorldState } from '../core/types';
import type { MultiMechanicId, MultiMode } from '../core/multiplayer_types';
import { CONCEPT_BY_ID } from '../data/ascension/concepts';
import { MULTI_MECHANICS, MULTI_MODES, mechanicAllowed } from '../data/multi_mechanics';
import {
  actBlocker, actOn, ensureMultiplayer, publicProfile, receiveMultiEvent, respondToOffer, upsertPeer,
} from '../simulation/multiplayer';
import { connectRelay, type NetClient, type NetStatus } from '../net/client';
import { NET_PROTOCOL, defaultRelayUrl, normalizeRelayUrl, type GameMsg, type RelayMsg } from '../net/protocol';
import { el } from './ui';

export interface RemotePlayer {
  conn: number;
  id: string;
  name: string;
  appearance: PlayerAppearance;
  gender?: PlayerGender;
  heightM: number;
  x: number;
  z: number;
  h: number;
  s: number;
  inside: boolean;
  /** Dernière position reçue (ms, horloge du navigateur). */
  seenAt: number;
}

export interface SessionHooks {
  /** Notifications de jeu à afficher (toasts, fantômes). */
  notify(list: Notification[]): void;
  /** L'hôte a lancé un saut de temps : on fait le même. */
  skip(kind: 'jour' | 'semaine' | 'mois' | 'vacances'): void;
  /** (Hôte) un joueur demande une autre allure. */
  paceRequest(pace: string): void;
  /** Quelque chose a changé (panneau, HUD). */
  changed(): void;
  /** Apparence et taille du joueur local. */
  me(): { appearance: PlayerAppearance; gender?: PlayerGender; heightM: number };
}

const ID_KEY = 'neurapolis.multijoueur.id';
const ADDR_KEY = 'neurapolis.multijoueur.adresse';

function newPlayerId(): string {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return `j${a[0]!.toString(36)}${a[1]!.toString(36)}`;
}

function stored(key: string): string {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}
function store(key: string, v: string): void {
  try { localStorage.setItem(key, v); } catch { /* préférence perdue : sans gravité */ }
}

export class MultiplayerSession {
  private client: NetClient | null = null;
  status: NetStatus = 'deconnecte';
  detail = '';
  me: number | null = null;
  host: number | null = null;
  mode: MultiMode = 'libre';
  /** Mode choisi localement (appliqué si l'on devient hôte). */
  wantedMode: MultiMode = 'libre';
  readonly remotes = new Map<number, RemotePlayer>();
  /** Horloge de l'hôte (pour les autres joueurs). */
  hostTick: number | null = null;
  hostPace = 'lent';
  readonly chat: { name: string; text: string; mine: boolean }[] = [];
  private lastPose = 0;
  private lastProfile = 0;
  private lastClock = 0;
  private lastOffers = 0;

  constructor(private world: WorldState, private hooks: SessionHooks) {}

  get connected(): boolean { return this.status === 'connecte' && this.me !== null; }
  get isHost(): boolean { return this.connected && this.me === this.host; }
  /** Un autre joueur pilote le temps : on suit son horloge. */
  get followsHost(): boolean { return this.connected && !this.isHost && this.hostTick !== null; }
  get playerCount(): number { return this.connected ? this.remotes.size + 1 : 0; }

  setWorld(w: WorldState): void { this.world = w; }

  connect(address: string, mode: MultiMode): void {
    this.disconnect();
    const m = ensureMultiplayer(this.world, this.world.multiplayer?.selfId || stored(ID_KEY) || newPlayerId());
    store(ID_KEY, m.selfId);
    this.wantedMode = mode;
    this.mode = mode;
    let url: string;
    try {
      url = normalizeRelayUrl(address);
    } catch {
      this.status = 'deconnecte';
      this.detail = 'Adresse invalide.';
      this.hooks.changed();
      return;
    }
    if (!url) {
      this.detail = 'Indique l’adresse de l’hôte (ex. 100.64.12.34:8765).';
      this.hooks.changed();
      return;
    }
    store(ADDR_KEY, address);
    this.client = connectRelay(url, {
      onMessage: (msg) => this.onRelay(msg),
      onStatus: (s, detail) => {
        this.status = s;
        this.detail = detail ?? '';
        if (s !== 'connecte') { this.me = null; this.remotes.clear(); this.hostTick = null; }
        this.hooks.changed();
      },
    });
  }

  disconnect(): void {
    this.client?.close();
    this.client = null;
    this.status = 'deconnecte';
    this.me = null;
    this.host = null;
    this.hostTick = null;
    this.remotes.clear();
    this.hooks.changed();
  }

  private send(msg: GameMsg): void { this.client?.send(msg); }

  private hello(reply = false): GameMsg {
    const me = this.hooks.me();
    return { t: 'hello', v: NET_PROTOCOL, player: publicProfile(this.world), appearance: me.appearance, gender: me.gender, heightM: me.heightM, mode: this.isHost ? this.mode : undefined, reply };
  }

  private onRelay(msg: RelayMsg): void {
    switch (msg.t) {
      case 'welcome':
        this.me = msg.you;
        this.host = msg.host;
        if (this.isHost) this.mode = this.wantedMode;
        this.send(this.hello());
        break;
      case 'host':
        this.host = msg.conn;
        if (this.isHost) { this.mode = this.mode || this.wantedMode; this.hostTick = null; this.send(this.hello(true)); }
        break;
      case 'leave': {
        const r = this.remotes.get(msg.conn);
        this.remotes.delete(msg.conn);
        if (r) this.hooks.notify([{ kind: 'info', text: `📡 ${r.name} a quitté la partie.` }]);
        break;
      }
      case 'join':
        break;
      case 'relay':
        this.onGame(msg.conn, msg.msg);
        break;
      default:
        break;
    }
    this.hooks.changed();
  }

  private onGame(conn: number, msg: GameMsg): void {
    const now = performance.now();
    switch (msg.t) {
      case 'hello': {
        if (msg.v !== NET_PROTOCOL) {
          this.hooks.notify([{ kind: 'alerte', text: `📡 ${msg.player.name} joue avec une autre version du jeu : mettez-vous à jour tous les deux.` }]);
          return;
        }
        const known = this.remotes.has(conn);
        upsertPeer(this.world, msg.player);
        this.remotes.set(conn, {
          conn, id: msg.player.id, name: msg.player.name, appearance: msg.appearance, gender: msg.gender, heightM: msg.heightM,
          x: this.remotes.get(conn)?.x ?? 0, z: this.remotes.get(conn)?.z ?? 0, h: 0, s: 0, inside: true, seenAt: now,
        });
        if (conn === this.host && msg.mode) this.mode = msg.mode;
        if (!known) this.hooks.notify([{ kind: 'bien', text: `📡 ${msg.player.name} est dans la partie.` }]);
        if (!msg.reply) this.send(this.hello(true));
        break;
      }
      case 'profile':
        upsertPeer(this.world, msg.player);
        break;
      case 'pose': {
        const r = this.remotes.get(conn);
        if (r) Object.assign(r, { x: msg.x, z: msg.z, h: msg.h, s: msg.s, inside: msg.inside, seenAt: now });
        break;
      }
      case 'clock':
        if (conn === this.host) { this.hostTick = msg.tick; this.hostPace = msg.pace; this.mode = msg.mode; }
        break;
      case 'pace':
        if (this.isHost) this.hooks.paceRequest(msg.pace);
        break;
      case 'skip':
        if (conn === this.host) this.hooks.skip(msg.kind);
        break;
      case 'event': {
        const notes = receiveMultiEvent(this.world, msg.ev);
        if (notes.length) this.hooks.notify(notes);
        break;
      }
      case 'chat':
        this.chat.push({ name: msg.name, text: msg.text, mine: false });
        if (this.chat.length > 30) this.chat.shift();
        this.hooks.notify([{ kind: 'info', text: `💬 ${msg.name} : ${msg.text}` }]);
        break;
      default:
        break;
    }
  }

  /** Chaque image : position, profil, horloge (hôte), événements à envoyer. */
  update(nowMs: number, pose: { x: number; z: number; heading: number; speed: number }, inside: boolean, pace: string): void {
    if (!this.connected) return;
    const m = this.world.multiplayer;
    if (nowMs - this.lastPose > 100) {
      this.lastPose = nowMs;
      this.send({ t: 'pose', p: m?.selfId ?? '', x: Math.round(pose.x * 100) / 100, z: Math.round(pose.z * 100) / 100, h: Math.round(pose.heading * 100) / 100, s: Math.round(pose.speed * 10) / 10, inside });
    }
    if (nowMs - this.lastProfile > 5000) {
      this.lastProfile = nowMs;
      this.send({ t: 'profile', player: publicProfile(this.world) });
    }
    if (this.isHost && nowMs - this.lastClock > 500) {
      this.lastClock = nowMs;
      this.send({ t: 'clock', tick: this.world.time.tick, pace, mode: this.mode });
    }
    for (const ev of m?.outbox.splice(0) ?? []) this.send({ t: 'event', ev });
    const offers = m?.offers.length ?? 0;
    if (offers !== this.lastOffers) { this.lastOffers = offers; this.hooks.changed(); }
  }

  /** L'hôte saute le temps : tout le monde suit. */
  broadcastSkip(kind: 'jour' | 'semaine' | 'mois' | 'vacances', target: number): void {
    if (this.isHost) this.send({ t: 'skip', kind, target });
  }

  requestPace(pace: string): void {
    this.send({ t: 'pace', pace });
  }

  say(text: string): void {
    const t = text.trim().slice(0, 200);
    if (!t) return;
    const name = this.world.player.firstName || this.world.player.name;
    this.send({ t: 'chat', p: this.world.multiplayer?.selfId ?? '', name, text: t });
    this.chat.push({ name, text: t, mine: true });
    if (this.chat.length > 30) this.chat.shift();
  }

  /** Autres joueurs visibles dehors (position récente). */
  visibleRemotes(nowMs: number): RemotePlayer[] {
    return [...this.remotes.values()].filter((r) => !r.inside && nowMs - r.seenAt < 60000);
  }

  pendingOffers(): number { return this.world.multiplayer?.offers.length ?? 0; }

  savedAddress(): string { return stored(ADDR_KEY); }
}

// ---------- Panneau ----------

export interface MultiPanelCtx {
  session: MultiplayerSession;
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
  toast(text: string, ok: boolean): void;
  notify(list: Notification[]): void;
}

const eur = (v: number): string => `${Math.round(v).toLocaleString('fr-FR')} €`;

function button(label: string, onClick: () => void, cls = 'ph-btn'): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

export function openMultiplayerPanel(ctx: MultiPanelCtx): void {
  const { session: s, world: w } = ctx;
  const body = el('div', 'panel-body mp-panel');
  const rerender = (): void => openMultiplayerPanel(ctx);

  if (!s.connected) {
    body.appendChild(el('p', 'panel-desc', 'Jouez à plusieurs dans la même ville : chacun garde sa vie et ses affaires, mais vous pouvez vous associer… ou vous saboter.'));
    const help = el('ol', 'mp-help');
    for (const line of [
      'Activez NordVPN Meshnet sur vos deux ordinateurs et ajoutez-vous (ou soyez sur le même réseau local).',
      'L’hôte lance le serveur du jeu : double-clic sur « jouer-en-lan.bat » (ou « node tools/lan-server.mjs »). Il affiche une adresse en 100.x.x.x.',
      'L’ami ouvre cette adresse dans son navigateur (ex. http://100.64.12.34:8765), puis clique « Se connecter » ici.',
    ]) help.appendChild(el('li', '', line));
    body.appendChild(help);
    const addr = el('input', 'mp-input') as HTMLInputElement;
    addr.placeholder = defaultRelayUrl() ? 'adresse de cette page (par défaut)' : 'adresse de l’hôte, ex. 100.64.12.34:8765';
    addr.value = s.savedAddress();
    body.appendChild(el('label', 'mp-label', 'Adresse de l’hôte (laisser vide si tu as ouvert sa page)'));
    body.appendChild(addr);
    body.appendChild(el('label', 'mp-label', 'Règles (si tu es le premier connecté, c’est toi qui décides)'));
    const modes = el('div', 'ph-list');
    let mode: MultiMode = s.wantedMode;
    for (const m of MULTI_MODES) {
      const card = el('div', `ph-card mp-mode${m.id === mode ? ' active' : ''}`);
      card.appendChild(el('div', 'ph-card-title', m.label));
      card.appendChild(el('p', 'ph-note', m.pitch));
      card.addEventListener('click', () => {
        mode = m.id;
        for (const c of modes.children) c.classList.remove('active');
        card.classList.add('active');
      });
      modes.appendChild(card);
    }
    body.appendChild(modes);
    if (s.detail) body.appendChild(el('p', 'ph-note', `📡 ${s.detail}`));
    // Application de bureau : héberger d'un clic (serveur intégré, plus besoin du .bat).
    const appApi = (window as unknown as { neurapolisApp?: { host(): Promise<{ ok: boolean; port?: number; addresses?: { name: string; address: string; meshnet: boolean }[]; error?: string }> } }).neurapolisApp;
    if (appApi) {
      const hostNote = el('p', 'ph-note', '');
      body.appendChild(button('🏠 Héberger une partie sur cet ordinateur', () => {
        void appApi.host().then((r) => {
          if (!r.ok) { ctx.toast(r.error ?? 'Impossible d’héberger.', false); return; }
          const list = (r.addresses ?? []).map((a) => `${a.address}${a.meshnet ? ' (Meshnet)' : ''}`).join(' · ');
          hostNote.textContent = `Adresse à donner à ton ami : ${list || 'aucune carte réseau trouvée'} — il la tape dans « Adresse de l’hôte ».`;
          s.connect(`127.0.0.1:${r.port ?? 8765}`, mode);
          ctx.toast(`Partie hébergée. Ton ami se connecte à : ${list}`, true);
          setTimeout(rerender, 700);
        });
      }, 'ph-btn primary'));
      body.appendChild(hostNote);
    }
    body.appendChild(button(s.status === 'connexion' ? 'Connexion…' : '📡 Se connecter', () => { s.connect(addr.value, mode); ctx.toast('Connexion au salon…', true); setTimeout(rerender, 600); }, 'ph-btn primary'));
    ctx.showModal('📡 Multijoueur', 'En LAN, via NordVPN Meshnet', body, true);
    return;
  }

  const m = ensureMultiplayer(w);
  const modeDef = MULTI_MODES.find((x) => x.id === s.mode);
  body.appendChild(el('p', 'panel-desc', `${s.isHost ? 'Tu es l’hôte : le temps suit ton horloge.' : 'Le temps suit l’horloge de l’hôte.'} Règles : ${modeDef?.label ?? s.mode} — ${modeDef?.pitch ?? ''}`));

  // Propositions reçues.
  if (m.offers.length) {
    body.appendChild(el('h3', 'ph-h', '📨 Propositions reçues'));
    for (const o of m.offers) {
      const def = MULTI_MECHANICS.find((x) => x.id === o.mechanic)!;
      const card = el('div', 'ph-card');
      card.appendChild(el('div', 'ph-card-title', `${def.icon} ${o.fromName} : ${def.label.toLowerCase()}`));
      const detail = o.mechanic === 'pret' ? `${eur(o.amount)} à rembourser ${eur(o.amount * (1 + o.rate))} dans ${o.days} jours.` : def.pitch.split('{autre}').join(o.fromName);
      card.appendChild(el('p', 'ph-note', detail));
      card.appendChild(el('p', 'ph-note', `${def.ghostFor.ghost} : « ${def.ghostFor.text} »`));
      card.appendChild(el('p', 'ph-note', `${def.ghostAgainst.ghost} : « ${def.ghostAgainst.text} »`));
      const row = el('div', 'ph-actions');
      row.appendChild(button('Accepter', () => { const r = respondToOffer(w, o.id, true); ctx.toast(r.message, r.ok); rerender(); }, 'ph-btn primary'));
      row.appendChild(button('Refuser', () => { const r = respondToOffer(w, o.id, false); ctx.toast(r.message, r.ok); rerender(); }, 'ph-btn danger'));
      card.appendChild(row);
      body.appendChild(card);
    }
  }

  // Joueurs et actions.
  body.appendChild(el('h3', 'ph-h', `👥 Dans la partie (${s.playerCount})`));
  if (!s.remotes.size) body.appendChild(el('p', 'ph-note', 'Personne d’autre pour l’instant. Donne ton adresse Meshnet à ton ami.'));
  for (const r of s.remotes.values()) {
    const peer = m.peers[r.id];
    const card = el('div', 'ph-card mp-peer');
    const trust = peer?.trust ?? 0;
    card.appendChild(el('div', 'ph-card-title', `${r.name} · palier ${peer?.tier ?? 1} · réputation ${peer?.reputation ?? '?'} · ${peer?.shops.length ?? 0} commerce(s)`));
    card.appendChild(el('p', 'ph-note', `Relation : ${trust > 30 ? '🤝 alliance' : trust < -30 ? '⚔️ hostilité' : '😐 neutre'} (${Math.round(trust)})`));
    // Paramètres du prêt et de la formation.
    const amount = el('input', 'mp-input small') as HTMLInputElement;
    amount.type = 'number';
    amount.min = '10';
    amount.value = String(Math.max(10, Math.round(Math.min(200, w.player.money / 2))));
    const rate = el('select', 'mp-input small') as HTMLSelectElement;
    for (const [v, l] of [['0', 'sans intérêts'], ['0.05', '5 %'], ['0.1', '10 %']] as const) {
      const o = el('option', '', l) as HTMLOptionElement;
      o.value = v;
      rate.appendChild(o);
    }
    const concept = el('select', 'mp-input small') as HTMLSelectElement;
    for (const id of Object.keys(w.ascension?.concepts ?? {})) {
      const o = el('option', '', CONCEPT_BY_ID[id]?.name ?? id) as HTMLOptionElement;
      o.value = id;
      concept.appendChild(o);
    }
    for (const kind of ['coop', 'zone_grise', 'sabotage'] as const) {
      if (!mechanicAllowed(s.mode, kind)) continue;
      const row = el('div', `mp-actions mp-${kind}`);
      row.appendChild(el('div', 'mp-kind', kind === 'coop' ? '🤝 Coopérer' : kind === 'zone_grise' ? '🤫 Zone grise' : '🗡️ Saboter'));
      for (const def of MULTI_MECHANICS.filter((x) => x.kind === kind && x.id !== 'bail_coupe')) {
        const params = () => ({ amount: Number(amount.value), rate: Number(rate.value), concept: concept.value || undefined });
        const block = actBlocker(w, s.mode, def.id as MultiMechanicId, r.id, params());
        const b = button(`${def.icon} ${def.label}${def.cost ? ` (${def.cost} €)` : ''}`, () => {
          if (def.kind === 'sabotage' && !window.confirm(`${def.label} contre ${r.name} ?\n\n${def.pitch.split('{autre}').join(r.name)}`)) return;
          const res = actOn(w, s.mode, def.id, r.id, params());
          ctx.toast(res.message, res.ok);
          if (res.ok) ctx.notify(res.notifications);
          rerender();
        }, `ph-btn mp-btn${def.kind === 'sabotage' ? ' danger' : ''}`);
        b.title = block ?? def.pitch.split('{autre}').join(r.name);
        b.disabled = !!block && !(def.id === 'pret' || def.id === 'formation');
        row.appendChild(b);
        if (def.id === 'pret') { row.appendChild(amount); row.appendChild(rate); }
        if (def.id === 'formation' && concept.options.length) row.appendChild(concept);
      }
      card.appendChild(row);
    }
    body.appendChild(card);
  }

  // Dettes et effets en cours.
  const d = Math.floor(w.time.tick / 144);
  if (m.debts.length || m.effects.length) {
    body.appendChild(el('h3', 'ph-h', '📜 En cours'));
    const ul = el('ul', 'asc-checks');
    for (const debt of m.debts) ul.appendChild(el('li', '', `${debt.side === 'owe' ? '💸 Tu dois' : '💶 On te doit'} ${eur(debt.amount)} (${m.peers[debt.peer]?.name ?? '?'}) — échéance dans ${Math.max(0, debt.dueDay - d)} j`));
    for (const e of m.effects) {
      const def = MULTI_MECHANICS.find((x) => x.id === e.mechanic);
      ul.appendChild(el('li', '', `${def?.icon ?? '•'} ${def?.label ?? e.mechanic} (${m.peers[e.fromPeer]?.name ?? '?'}) — encore ${Math.max(0, e.untilDay - d)} j`));
    }
    body.appendChild(ul);
  }

  // Journal et discussion.
  if (m.log.length) {
    body.appendChild(el('h3', 'ph-h', '🗒️ Journal'));
    const ul = el('ul', 'skip-highlights');
    for (const l of m.log.slice(0, 8)) ul.appendChild(el('li', `mp-log ${l.tone}`, l.text));
    body.appendChild(ul);
  }
  body.appendChild(el('h3', 'ph-h', '💬 Discussion'));
  const chatBox = el('div', 'mp-chat');
  for (const c of s.chat.slice(-8)) chatBox.appendChild(el('div', `mp-line${c.mine ? ' mine' : ''}`, `${c.name} : ${c.text}`));
  body.appendChild(chatBox);
  const say = el('input', 'mp-input') as HTMLInputElement;
  say.placeholder = 'Écrire à tout le monde…';
  say.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { s.say(say.value); rerender(); }
  });
  body.appendChild(say);
  body.appendChild(button('Se déconnecter', () => { s.disconnect(); ctx.closeModal(); }, 'ph-btn danger'));
  ctx.showModal('📡 Multijoueur', `${s.isHost ? 'Hôte' : 'Invité·e'} · ${s.playerCount} joueur(s)`, body, true);
}
