/**
 * Multijoueur en réseau local : le panneau (héberger, rejoindre, jouer ensemble).
 *
 * La session réseau elle-même vit dans `src/net/session.ts` (sans DOM) ; ce module ne fait que
 * l'afficher et transmettre les choix du joueur. Tout texte venu d'un autre joueur est affiché
 * comme du texte (`textContent`), jamais comme du HTML.
 */
import type { Notification, WorldState } from '../core/types';
import type { MultiMechanicId, MultiMode } from '../core/multiplayer_types';
import { TICKS_PER_DAY } from '../core/types';
import { CONCEPT_BY_ID } from '../data/ascension/concepts';
import { MULTI_MECHANICS, MULTI_MODES, mechanicAllowed } from '../data/multi_mechanics';
import { actBlocker, actOn, ensureMultiplayer, respondToOffer } from '../simulation/multiplayer';
import { defaultRelayUrl } from '../net/protocol';
import { MultiplayerSession } from '../net/session';
import { el } from './ui';

export { MultiplayerSession };
export type { RemotePlayer, SessionHooks } from '../net/session';

// ---------- Panneau ----------

export interface MultiPanelCtx {
  session: MultiplayerSession;
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
  toast(text: string, ok: boolean): void;
  notify(list: Notification[]): void;
}

type HostApi = { host(): Promise<{ ok: boolean; port?: number; addresses?: { name: string; address: string; meshnet: boolean }[]; error?: string }> };

const eur = (v: number): string => `${Math.round(v).toLocaleString('fr-FR')} €`;

function button(label: string, onClick: () => void, cls = 'ph-btn'): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

/** Ligne d'état de la connexion, en clair. */
function statusLine(s: MultiplayerSession): string {
  if (s.connected) {
    const role = s.isHost ? 'Tu es l’hôte' : 'Connecté·e à l’hôte';
    return `🟢 ${role} · ${s.playerCount} joueur${s.playerCount > 1 ? 's' : ''} sur ${s.maxPlayers} au plus`;
  }
  if (s.status === 'connexion') return `🟡 ${s.detail || 'Connexion…'}`;
  return s.detail ? `🔴 ${s.detail}` : '⚪ Pas connecté·e';
}

/** Durée lisible d'un écart d'horloge (ticks de 10 minutes). */
function lag(ticks: number): string {
  const days = Math.floor(ticks / TICKS_PER_DAY);
  const hours = Math.round(((ticks % TICKS_PER_DAY) * 10) / 60);
  return days ? `${days} j ${hours} h` : `${hours} h`;
}

export function openMultiplayerPanel(ctx: MultiPanelCtx): void {
  const { session: s, world: w } = ctx;
  const body = el('div', 'panel-body mp-panel');
  const rerender = (): void => openMultiplayerPanel(ctx);

  // État de la connexion, mis à jour en direct ; le panneau se redessine si l'on se connecte ou se déconnecte.
  const status = el('p', 'ph-note mp-status', statusLine(s));
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.style.fontWeight = '700';
  body.appendChild(status);
  const wasConnected = s.connected;
  const live = setInterval(() => {
    if (!body.isConnected) { clearInterval(live); return; }
    status.textContent = statusLine(s);
    if (s.connected !== wasConnected && !body.contains(document.activeElement)) { clearInterval(live); rerender(); }
  }, 400);

  if (!s.connected) {
    renderLobby(ctx, body, rerender);
    ctx.showModal('📡 Multijoueur', 'En réseau local : 2 à 4 joueurs dans la même ville', body, true);
    return;
  }

  const m = ensureMultiplayer(w);
  const modeDef = MULTI_MODES.find((x) => x.id === s.mode);
  body.appendChild(el('p', 'panel-desc', `${s.isHost ? 'Tu es l’hôte : le temps suit ton horloge.' : 'Le temps suit l’horloge de l’hôte.'} Règles : ${modeDef?.label ?? s.mode} — ${modeDef?.pitch ?? ''}`));
  if (s.shareAddresses.length) {
    body.appendChild(el('p', 'ph-note', `🔗 Adresse à donner à tes amis : ${s.shareAddresses.join('  ou  ')}`));
  }
  if (s.aheadOfHost > 6) {
    body.appendChild(el('p', 'ph-note', `⏳ Ta partie est en avance de ${lag(s.aheadOfHost)} sur celle de l’hôte : ton temps attend que son horloge te rejoigne (l’hôte peut « passer le temps » pour aller plus vite).`));
  }
  const away = s.offlinePeers();
  if (away.length) body.appendChild(el('p', 'ph-note', `💤 Hors ligne : ${away.join(', ')}. Ce qui leur est destiné partira à leur retour.`));

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


  // Tes propositions qui attendent une réponse.
  const waiting = (m.sent ?? []).filter((x) => x.phase !== 'act');
  if (waiting.length) {
    body.appendChild(el('h3', 'ph-h', '⏳ En attente'));
    const ul = el('ul', 'asc-checks');
    for (const x of waiting) {
      const def = MULTI_MECHANICS.find((y) => y.id === x.mechanic);
      const who = m.peers[x.peer]?.name ?? '?';
      const what = `${def?.icon ?? '•'} ${def?.label.toLowerCase() ?? x.mechanic}${x.mechanic === 'pret' ? ` (${eur(x.amount)})` : ''}`;
      ul.appendChild(el('li', '', x.phase === 'offer' ? `${what} : proposé à ${who}, en attente de sa réponse` : `${what} : accepté, en attente de la confirmation de ${who}`));
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
  say.placeholder = 'Écrire à tout le monde… (Entrée pour envoyer)';
  say.maxLength = 200;
  say.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      if (!s.say(say.value)) ctx.toast('Message non envoyé : la connexion est coupée.', false);
      rerender();
    }
  });
  body.appendChild(say);
  body.appendChild(button('Quitter la partie à plusieurs', () => { s.disconnect(); ctx.closeModal(); ctx.toast('Tu as quitté la partie à plusieurs. Ta sauvegarde garde vos accords et vos dettes.', true); }, 'ph-btn danger'));
  ctx.showModal('📡 Multijoueur', `${s.isHost ? 'Hôte' : 'Invité·e'} · ${s.playerCount} joueur(s)`, body, true);
}

/** Écran d'accueil : héberger ou rejoindre, choisir les règles, comprendre ce qui se passe. */
function renderLobby(ctx: MultiPanelCtx, body: HTMLElement, rerender: () => void): void {
  const { session: s, world: w } = ctx;
  const appApi = (window as unknown as { neurapolisApp?: HostApi }).neurapolisApp;
  const servedByServer = !!defaultRelayUrl();
  let mode: MultiMode = s.wantedMode;
  const go = (address: string, label: string): void => {
    s.connect(address, mode);
    ctx.toast(label, true);
    setTimeout(rerender, 700);
  };

  body.appendChild(el('p', 'panel-desc', 'Jouez à 2, 3 ou 4 dans la même ville de Val-Ferrand : chacun garde sa vie et ses affaires, vous vous croisez dans les rues et vous pouvez vous associer… ou vous saboter. Il suffit d’être sur le même réseau (même box, même Wi-Fi).'));

  // Reprise d'une partie sauvegardée.
  const peers = Object.values(w.multiplayer?.peers ?? {}).map((p) => p.name);
  if (peers.length) {
    const card = el('div', 'ph-card');
    card.appendChild(el('div', 'ph-card-title', `🔁 Reprendre la partie avec ${peers.join(', ')}`));
    card.appendChild(el('p', 'ph-note', `Ta sauvegarde garde vos prêts, vos dettes et vos alliances. Reconnecte-toi au même hôte${s.savedAddress() ? ` (${s.savedAddress()})` : ''} pour continuer ensemble.`));
    card.appendChild(button('Reprendre', () => go(s.savedAddress(), 'Reconnexion à la partie…'), 'ph-btn primary'));
    body.appendChild(card);
  }

  // Règles.
  body.appendChild(el('label', 'mp-label', 'Règles de la partie (c’est l’hôte qui décide)'));
  const modes = el('div', 'ph-list');
  for (const md of MULTI_MODES) {
    const card = el('div', `ph-card mp-mode${md.id === mode ? ' active' : ''}`);
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.appendChild(el('div', 'ph-card-title', md.label));
    card.appendChild(el('p', 'ph-note', md.pitch));
    const pick = (): void => {
      mode = md.id;
      for (const c of modes.children) c.classList.remove('active');
      card.classList.add('active');
    };
    card.addEventListener('click', pick);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    modes.appendChild(card);
  }
  body.appendChild(modes);

  // Héberger.
  const hostCard = el('div', 'ph-card');
  hostCard.appendChild(el('div', 'ph-card-title', '🏠 Héberger une partie'));
  if (appApi) {
    const hostNote = el('p', 'ph-note', 'Ton ordinateur devient le serveur de la partie. Garde l’application ouverte pendant que vous jouez.');
    hostCard.appendChild(hostNote);
    hostCard.appendChild(button('Héberger sur cet ordinateur', () => {
      void appApi.host().then((r) => {
        if (!r.ok) { ctx.toast(r.error ?? 'Impossible d’héberger.', false); hostNote.textContent = `⚠️ ${r.error ?? 'Impossible d’héberger.'}`; return; }
        const list = (r.addresses ?? []).map((a) => `${a.address}:${r.port ?? 8765}`).join('  ou  ');
        go(`127.0.0.1:${r.port ?? 8765}`, list ? `Partie hébergée. Tes amis tapent : ${list}` : 'Partie hébergée (aucune carte réseau trouvée : branche-toi au Wi-Fi).');
      });
    }, 'ph-btn primary'));
  } else if (servedByServer) {
    hostCard.appendChild(el('p', 'ph-note', `Le jeu vient du serveur ${location.host}. Le premier qui ouvre la partie sur ce serveur en devient l’hôte ; les suivants la rejoignent.`));
    hostCard.appendChild(button('Ouvrir la partie sur ce serveur', () => go('', 'Connexion au serveur…'), 'ph-btn primary'));
  } else {
    hostCard.appendChild(el('p', 'ph-note', 'Pour héberger : lance « jouer-en-lan.bat » (dossier du jeu) ou l’application NEURAPOLIS, puis ouvre l’adresse qu’ils affichent.'));
  }
  body.appendChild(hostCard);

  // Rejoindre.
  const joinCard = el('div', 'ph-card');
  joinCard.appendChild(el('div', 'ph-card-title', '🔗 Rejoindre une partie'));
  joinCard.appendChild(el('label', 'mp-label', servedByServer ? 'Adresse de l’hôte (laisse vide pour ce serveur)' : 'Adresse de l’hôte'));
  const addr = el('input', 'mp-input') as HTMLInputElement;
  addr.placeholder = servedByServer ? `${location.host} (ce serveur)` : 'par exemple 192.168.1.20:8765';
  addr.value = s.savedAddress();
  addr.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') go(addr.value, 'Connexion à l’hôte…');
  });
  joinCard.appendChild(addr);
  joinCard.appendChild(button(s.status === 'connexion' ? 'Connexion…' : 'Rejoindre', () => go(addr.value, 'Connexion à l’hôte…'), 'ph-btn primary'));
  if (s.status !== 'deconnecte') joinCard.appendChild(button('Annuler', () => { s.disconnect(); rerender(); }, 'ph-btn'));
  body.appendChild(joinCard);

  const help = el('ul', 'mp-help');
  for (const line of [
    'L’adresse de l’hôte ressemble à 192.168.1.20:8765 : elle s’affiche dans sa fenêtre (jouer-en-lan.bat) ou dans ce panneau une fois connecté.',
    'Deux fenêtres sur le même ordinateur ? Ouvre la deuxième sur 127.0.0.1 au lieu de localhost (ou dans une fenêtre privée) : chaque fenêtre garde ainsi sa propre sauvegarde.',
    'Ça ne passe pas ? Vérifie que vous êtes sur le même réseau et que Windows a autorisé Node.js (ou NEURAPOLIS) sur les réseaux privés.',
  ]) help.appendChild(el('li', '', line));
  body.appendChild(help);
}
