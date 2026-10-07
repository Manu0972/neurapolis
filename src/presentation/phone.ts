/**
 * Le téléphone du joueur (façon Big Ambitions) : applications Immobilier, Commerces, Commandes,
 * Emploi et Banque. Lit l'état du monde et n'agit qu'à travers les fonctions de
 * src/simulation/economy.ts (qui valident tout).
 */
import type { WorldState } from '../core/types';
import type { BusinessState } from '../core/economy_types';
import {
  BUSINESS_TYPES, BUSINESS_TYPE_BY_ID, FURNITURE, FURNITURE_BY_ID, PRODUCT_BY_ID, WHOLESALERS, WHOLESALER_BY_ID,
} from '../data/economy';
import {
  MARKETING_CHANNELS, UNIT_BY_ID, appeal, buyFurniture, businessTypeAllowed, carriedUnits, endLease, ensureEconomy,
  equipmentCapacity, fire, freeSpaceFor, hire, leaseEligibility, listUnits, loanOffer, openBusiness, orderStock,
  priceIndex, priceOf, readiness, refreshJobMarket, repayLoan, runMarketing, sellFurniture, setHours, setOpen,
  setPrice, setWage, signLease, stockUnits, storageCapacity, takeLoan, transferCash, usedFloor, FLOOR_USE, nearbyCompetitors,
  buyProperty, propertyPrice, rentOutProperty, sellProperty,
  type EconomyResult,
} from '../simulation/economy';
import { el } from './ui';
import { BIKE, buyBike, ownsBike } from '../simulation/vehicles';

export type PhoneApp = 'immobilier' | 'commerces' | 'commandes' | 'emploi' | 'banque';

export interface PhoneContext {
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
  toast(text: string, ok: boolean): void;
  onChange(): void;
}

const APPS: { id: PhoneApp; icon: string; label: string }[] = [
  { id: 'immobilier', icon: '🏢', label: 'Immobilier' },
  { id: 'commerces', icon: '🏪', label: 'Commerces' },
  { id: 'commandes', icon: '📦', label: 'Commandes' },
  { id: 'emploi', icon: '👥', label: 'Emploi' },
  { id: 'banque', icon: '🏦', label: 'Banque' },
];

const eur = (v: number): string => `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function button(label: string, onClick: () => void, cls = 'ph-btn'): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

function stat(label: string, value: string, tone: '' | 'good' | 'bad' = ''): HTMLElement {
  const box = el('div', `ph-stat ${tone}`);
  box.appendChild(el('span', 'ph-stat-label', label));
  box.appendChild(el('b', 'ph-stat-value', value));
  return box;
}

export function openPhone(ctx: PhoneContext, app: PhoneApp = 'commerces', focus?: { businessId?: string; unitId?: string }): void {
  const w = ctx.world;
  ensureEconomy(w);
  let current: PhoneApp = app;
  let selectedBiz = focus?.businessId ?? Object.keys(w.economy!.businesses)[0];
  let unitFilter: 'tous' | 'etals' | 'locaux' = focus?.unitId && UNIT_BY_ID[focus.unitId]?.buildingId.startsWith('etal_') ? 'etals' : 'tous';
  let highlightUnit = focus?.unitId;

  const root = el('div', 'phone');
  const tabs = el('nav', 'ph-tabs');
  const screen = el('div', 'ph-screen');
  root.appendChild(tabs);
  root.appendChild(screen);

  const act = (r: EconomyResult): void => {
    ctx.toast(r.message, r.ok);
    ctx.onChange();
    render();
  };

  function render(): void {
    tabs.replaceChildren();
    for (const a of APPS) {
      const tb = el('button', `ph-tab${a.id === current ? ' active' : ''}`, `${a.icon} ${a.label}`);
      tb.type = 'button';
      tb.addEventListener('click', () => { current = a.id; render(); });
      tabs.appendChild(tb);
    }
    screen.replaceChildren();
    const head = el('div', 'ph-wallet');
    head.appendChild(stat('Argent sur toi', eur(w.player.money), w.player.money < 0 ? 'bad' : ''));
    const e = w.economy!;
    head.appendChild(stat('Caisses', eur(Object.values(e.businesses).reduce((s, b) => s + b.cash, 0))));
    head.appendChild(stat('Dettes', eur(e.loans.reduce((s, l) => s + l.remaining, 0)), e.loans.length ? 'bad' : ''));
    head.appendChild(stat('Dans tes bras', `${carriedUnits(e)} / ${e.carryCapacity}`));
    screen.appendChild(head);
    if (current === 'immobilier') renderImmobilier();
    if (current === 'commerces') renderCommerces();
    if (current === 'commandes') renderCommandes();
    if (current === 'emploi') renderEmploi();
    if (current === 'banque') renderBanque();
  }

  // ----- Immobilier -----
  function renderImmobilier(): void {
    const bar = el('div', 'ph-filters');
    for (const [id, label] of [['tous', 'Tout'], ['etals', 'Étals du marché'], ['locaux', 'Locaux']] as const) {
      bar.appendChild(button(label, () => { unitFilter = id; render(); }, `ph-chip${unitFilter === id ? ' active' : ''}`));
    }
    screen.appendChild(bar);
    const list = el('div', 'ph-list');
    const units = listUnits(w)
      .filter((l) => unitFilter === 'tous' || (unitFilter === 'etals') === l.unit.buildingId.startsWith('etal_'))
      .sort((a, b) => (a.status === b.status ? b.unit.footTraffic - a.unit.footTraffic : a.status === 'loue_joueur' ? -1 : 1));
    for (const l of units) {
      const card = el('article', `ph-card${l.unit.id === highlightUnit ? ' focus' : ''}`);
      const title = el('div', 'ph-card-title', `${l.unit.buildingId.startsWith('etal_') ? '🧺' : '🏬'} ${l.unit.address}`);
      card.appendChild(title);
      card.appendChild(el('div', 'ph-card-sub', `${l.unit.sizeM2} m² · ${l.unit.footTraffic} passants/h aux heures de pointe · quartier ${l.unit.district}`));
      const row = el('div', 'ph-row');
      row.appendChild(stat('Loyer', `${eur(l.rentPerDay)}/jour`));
      row.appendChild(stat('Dépôt', eur(l.deposit)));
      card.appendChild(row);
      const actions = el('div', 'ph-actions');
      if (l.status === 'occupe') {
        card.appendChild(el('p', 'ph-note', `🔒 Occupé : ${l.competitor ?? 'un autre commerce'}.`));
      } else if (l.status === 'libre') {
        const elig = leaseEligibility(w, l.unit.id);
        const btn = button('Signer le bail', () => act(signLease(w, l.unit.id)), 'ph-btn primary');
        btn.disabled = !elig.allowed;
        actions.appendChild(btn);
        card.appendChild(el('p', 'ph-note', elig.reason));
      } else if (l.businessId) {
        actions.appendChild(button(`Gérer ${e().businesses[l.businessId]?.name ?? ''}`, () => { selectedBiz = l.businessId; current = 'commerces'; render(); }, 'ph-btn primary'));
      } else {
        for (const node of createBusinessForm(l.unit.id)) actions.appendChild(node);
      }
      // Propriété des murs (adulte ou bac à sable).
      const owned = w.economy?.owned?.[l.unit.id];
      const isStall = l.unit.buildingId.startsWith('etal_');
      if (owned) {
        card.appendChild(el('p', 'ph-note', `🏛️ Tu possèdes ces murs (achetés ${owned.price.toLocaleString('fr-FR')} €)${owned.tenant ? ` · loué à ${owned.tenant.name} : ${owned.tenant.rentPerDay.toFixed(2)} €/jour` : ''}.`));
        if (!owned.tenant && l.status !== 'loue_joueur') actions.appendChild(button('Mettre en location', () => act(rentOutProperty(w, l.unit.id))));
        if (l.status !== 'loue_joueur') {
          actions.appendChild(button('Vendre les murs', () => {
            if (window.confirm('Vendre ces murs ? 7 % de frais de vente.')) act(sellProperty(w, l.unit.id));
          }, 'ph-btn danger'));
        }
      } else if (!isStall && l.status !== 'occupe') {
        const adult = w.economy?.sandbox || w.player.age >= 18;
        const buy = button(`Acheter les murs (${propertyPrice(w, l.unit).toLocaleString('fr-FR')} €)`, () => {
          if (window.confirm('Acheter les murs de ce local ?')) act(buyProperty(w, l.unit.id));
        });
        buy.disabled = !adult;
        buy.title = adult ? '' : 'Réservé aux 18 ans et plus (ou au mode bac à sable).';
        actions.appendChild(buy);
      }
      if (l.status === 'loue_joueur') {
        actions.appendChild(button('Rendre le local', () => {
          if (window.confirm('Rendre ce local ? Le stock est perdu et le mobilier revendu à 30 %.')) act(endLease(w, l.unit.id));
        }, 'ph-btn danger'));
      }
      card.appendChild(actions);
      list.appendChild(card);
    }
    screen.appendChild(list);
    highlightUnit = undefined;
  }
  const e = (): NonNullable<WorldState['economy']> => w.economy!;

  function createBusinessForm(unitId: string): HTMLElement[] {
    const form = el('div', 'ph-form');
    const select = el('select', 'ph-input');
    for (const t of BUSINESS_TYPES) {
      const allowed = businessTypeAllowed(w, t.id, unitId);
      if (!allowed.ok && /étal/.test(allowed.message)) continue;
      const o = el('option', '', `${t.icon} ${t.name}${allowed.ok ? '' : ' (verrouillé)'}`);
      o.value = t.id;
      o.disabled = !allowed.ok;
      select.appendChild(o);
    }
    const name = el('input', 'ph-input');
    name.placeholder = 'Nom de ton commerce';
    name.maxLength = 32;
    name.value = `Chez ${w.player.firstName}`;
    form.appendChild(select);
    form.appendChild(name);
    form.appendChild(button('Créer le commerce', () => {
      const r = openBusiness(w, unitId, select.value, name.value);
      if (r.ok) {
        selectedBiz = Object.values(e().businesses).find((b) => b.unitId === unitId)?.id;
        current = 'commerces';
      }
      act(r);
    }, 'ph-btn primary'));
    return [form];
  }

  // ----- Commerces -----
  function renderCommerces(): void {
    const all = Object.values(e().businesses);
    if (all.length === 0) {
      screen.appendChild(el('p', 'ph-empty', 'Tu n’as pas encore de commerce. Ouvre l’application Immobilier pour louer un étal du marché (dès 12 ans, avec l’accord de tes parents).'));
      screen.appendChild(button('🏢 Voir les locaux', () => { current = 'immobilier'; render(); }, 'ph-btn primary'));
      return;
    }
    const picker = el('div', 'ph-filters');
    for (const b of all) picker.appendChild(button(`${BUSINESS_TYPE_BY_ID[b.typeId]?.icon ?? '🏪'} ${b.name}`, () => { selectedBiz = b.id; render(); }, `ph-chip${b.id === selectedBiz ? ' active' : ''}`));
    screen.appendChild(picker);
    const b = all.find((x) => x.id === selectedBiz) ?? all[0]!;
    selectedBiz = b.id;
    const t = BUSINESS_TYPE_BY_ID[b.typeId]!;
    const u = UNIT_BY_ID[b.unitId]!;
    const stall = u.buildingId.startsWith('etal_');

    const top = el('div', 'ph-card');
    top.appendChild(el('div', 'ph-card-title', `${t.icon} ${b.name} — ${u.address}`));
    const ready = readiness(b);
    const status = el('div', 'ph-row');
    status.appendChild(stat('État', b.open ? 'Ouvert' : 'Fermé', b.open ? 'good' : 'bad'));
    status.appendChild(stat('Horaires', `${b.hours[0]} h – ${b.hours[1]} h`));
    status.appendChild(stat('Réputation', `${Math.round(b.reputation)}/100`, b.reputation >= 55 ? 'good' : b.reputation < 40 ? 'bad' : ''));
    status.appendChild(stat('Habitués', `${Math.floor(b.regulars ?? 0)}`, (b.regulars ?? 0) >= 25 ? 'good' : ''));
    status.appendChild(stat('Attractivité', `×${appeal(b).toFixed(2)}`));
    top.appendChild(status);
    const actions = el('div', 'ph-actions');
    actions.appendChild(button(b.open ? 'Fermer' : 'Ouvrir', () => act(setOpen(w, b.id, !b.open)), `ph-btn ${b.open ? '' : 'primary'}`));
    actions.appendChild(button('− 1 h ouverture', () => act(setHours(w, b.id, b.hours[0] - 1, b.hours[1]))));
    actions.appendChild(button('+ 1 h fermeture', () => act(setHours(w, b.id, b.hours[0], b.hours[1] + 1))));
    actions.appendChild(button('− 1 h fermeture', () => act(setHours(w, b.id, b.hours[0], b.hours[1] - 1))));
    top.appendChild(actions);
    if (!ready.ready) top.appendChild(el('p', 'ph-warn', `Pour ouvrir, il manque : ${ready.missing.join(', ')}.`));
    const rivals = nearbyCompetitors(b);
    if (rivals.length) top.appendChild(el('p', 'ph-note', `⚔️ Concurrence à proximité : ${rivals.join(', ')}. Des prix sous le marché atténuent leur attrait.`));
    if (stall) top.appendChild(el('p', 'ph-note', 'Sur un étal, tu vends toi-même : reste derrière l’étal pendant les heures d’ouverture (ou embauche quelqu’un).'));
    else if (b.employeeIds.length === 0) top.appendChild(el('p', 'ph-note', 'Sans employé, la boutique ne vend que quand tu es sur place.'));
    screen.appendChild(top);

    // Finances.
    const fin = el('div', 'ph-card');
    fin.appendChild(el('div', 'ph-card-title', '💶 Caisse et résultats'));
    const frow = el('div', 'ph-row');
    frow.appendChild(stat('Caisse', eur(b.cash), b.cash < 0 ? 'bad' : ''));
    frow.appendChild(stat('CA aujourd’hui', eur(b.today.revenue)));
    frow.appendChild(stat('Clients', `${b.today.customers} (perdus : ${b.today.lost})`));
    frow.appendChild(stat('Indice de prix', priceIndex(b).toFixed(2), priceIndex(b) > 1.3 ? 'bad' : priceIndex(b) < 0.9 ? 'good' : ''));
    fin.appendChild(frow);
    const cashRow = el('div', 'ph-actions');
    for (const v of [20, 100, 500]) cashRow.appendChild(button(`Verser ${v} €`, () => act(transferCash(w, b.id, v))));
    cashRow.appendChild(button('Tout retirer', () => act(transferCash(w, b.id, -Math.max(0, Math.floor(b.cash * 100) / 100)))));
    fin.appendChild(cashRow);
    if (b.history.length > 0) fin.appendChild(historyChart(b));
    screen.appendChild(fin);

    // Stock et prix.
    const st = el('div', 'ph-card');
    const cap = storageCapacity(b);
    st.appendChild(el('div', 'ph-card-title', `🧾 Rayons et prix (${stockUnits(b)} unités · ambiant ${cap.ambiant} · froid ${cap.froid})`));
    const ids = Object.keys(b.stock).filter((id) => stockUnits(b, id) > 0 || b.prices[id] !== undefined);
    if (ids.length === 0) st.appendChild(el('p', 'ph-note', 'Rien en rayon. Passe une commande dans l’application Commandes.'));
    const table = el('div', 'ph-table');
    for (const id of ids) {
      const p = PRODUCT_BY_ID[id];
      if (!p) continue;
      const row = el('div', 'ph-trow');
      row.appendChild(el('span', 'ph-tname', p.name));
      row.appendChild(el('span', 'ph-tqty', `${stockUnits(b, id)} en stock`));
      const price = priceOf(b, id);
      const ratio = price / p.retailRef;
      row.appendChild(el('span', `ph-tprice ${ratio > 1.3 ? 'bad' : ratio < 0.9 ? 'good' : ''}`, `${eur(price)} (réf. ${eur(p.retailRef)})`));
      row.appendChild(button('−10 %', () => act(setPrice(w, b.id, id, price * 0.9)), 'ph-mini'));
      row.appendChild(button('+10 %', () => act(setPrice(w, b.id, id, price * 1.1)), 'ph-mini'));
      table.appendChild(row);
    }
    st.appendChild(table);
    screen.appendChild(st);

    // Mobilier.
    if (!stall) {
      const fu = el('div', 'ph-card');
      fu.appendChild(el('div', 'ph-card-title', `🪑 Aménagement (${usedFloor(b).toFixed(1)} / ${(u.sizeM2 * FLOOR_USE).toFixed(1)} m² utilisables · ${equipmentCapacity(b)} clients/h)`));
      const installed = el('div', 'ph-chips');
      b.furniture.forEach((fid, i) => {
        const f = FURNITURE_BY_ID[fid];
        installed.appendChild(button(`${f?.name ?? fid} ✕`, () => act(sellFurniture(w, b.id, i)), 'ph-chip'));
      });
      fu.appendChild(installed);
      const shop = el('div', 'ph-table');
      for (const f of FURNITURE) {
        const useful = !f.productCategories || f.productCategories.some((c) => t.productCategories.includes(c)) || t.requiredFurniture.includes(f.category);
        if (!useful) continue;
        const row = el('div', 'ph-trow');
        const req = t.requiredFurniture.includes(f.category) ? ' ★' : '';
        row.appendChild(el('span', 'ph-tname', `${f.name}${req}`));
        const bits = [
          f.capacityUnits ? `${f.capacityUnits} u. ${f.storage ?? ''}` : '',
          f.servicePerHour ? `${f.servicePerHour} clients/h` : '',
          f.seats ? `${f.seats} places` : '',
          f.appeal ? `attrait +${f.appeal}` : '',
          `${f.footprintM2} m²`,
        ].filter(Boolean).join(' · ');
        row.appendChild(el('span', 'ph-tqty', bits));
        row.appendChild(button(`Acheter ${eur(f.cost)}`, () => act(buyFurniture(w, b.id, f.id)), 'ph-mini'));
        shop.appendChild(row);
      }
      fu.appendChild(shop);
      fu.appendChild(el('p', 'ph-note', '★ meuble obligatoire pour ouvrir ce type de commerce.'));
      screen.appendChild(fu);
    }

    // Marketing.
    const mk = el('div', 'ph-card');
    mk.appendChild(el('div', 'ph-card-title', '📣 Publicité'));
    const mrow = el('div', 'ph-actions');
    for (const [id, c] of Object.entries(MARKETING_CHANNELS)) {
      const active = b.marketing[id] ? ` (encore ${b.marketing[id]} j)` : '';
      mrow.appendChild(button(`${c.name} — ${eur(c.costPerDay)}/j × ${c.minDays} j${active}`, () => act(runMarketing(w, b.id, id, c.minDays))));
    }
    mk.appendChild(mrow);
    screen.appendChild(mk);
  }

  function historyChart(b: BusinessState): HTMLElement {
    const wrap = el('div', 'ph-chart');
    const days = b.history.slice(-14);
    const max = Math.max(1, ...days.map((d) => d.revenue));
    for (const d of days) {
      const profit = d.revenue - d.costOfGoods - d.wages - d.rent - d.other;
      const col = el('div', 'ph-bar');
      col.title = `Jour ${d.day} : CA ${eur(d.revenue)}, résultat ${eur(profit)}`;
      const fill = el('div', `ph-bar-fill ${profit >= 0 ? 'good' : 'bad'}`);
      fill.style.height = `${Math.max(4, (d.revenue / max) * 100)}%`;
      col.appendChild(fill);
      wrap.appendChild(col);
    }
    return wrap;
  }

  // ----- Commandes -----
  function renderCommandes(): void {
    const all = Object.values(e().businesses);
    if (all.length === 0) {
      screen.appendChild(el('p', 'ph-empty', 'Crée d’abord un commerce pour passer commande.'));
      return;
    }
    const b = all.find((x) => x.id === selectedBiz) ?? all[0]!;
    selectedBiz = b.id;
    const picker = el('div', 'ph-filters');
    for (const x of all) picker.appendChild(button(x.name, () => { selectedBiz = x.id; render(); }, `ph-chip${x.id === b.id ? ' active' : ''}`));
    screen.appendChild(picker);

    // Commandes en cours.
    const pending = e().orders.filter((o) => o.status !== 'livree');
    if (pending.length > 0 || e().carried.length > 0) {
      const box = el('div', 'ph-card');
      box.appendChild(el('div', 'ph-card-title', '🚚 En cours'));
      for (const o of pending) {
        const g = WHOLESALER_BY_ID[o.wholesalerId];
        const units = o.lines.reduce((s, l) => s + l.qty, 0);
        const text = o.status === 'a_retirer'
          ? `📍 ${units} unités à retirer chez ${g?.name} (${g?.address}) pour ${e().businesses[o.businessId]?.name}`
          : `🚚 ${units} unités de ${g?.name} — livraison prévue le jour ${o.arrivalDay}`;
        box.appendChild(el('p', 'ph-note', text));
      }
      if (e().carried.length > 0) {
        const byBiz = new Map<string, number>();
        for (const c of e().carried) byBiz.set(c.businessId, (byBiz.get(c.businessId) ?? 0) + c.qty);
        for (const [id, q] of byBiz) box.appendChild(el('p', 'ph-note', `🤲 Tu portes ${q} unités pour ${e().businesses[id]?.name} : va devant la boutique et appuie sur E.`));
      }
      screen.appendChild(box);
    }

    const t = BUSINESS_TYPE_BY_ID[b.typeId]!;
    for (const g of WHOLESALERS) {
      const products = g.productIds.map((id) => PRODUCT_BY_ID[id]).filter((p) => p && t.productCategories.includes(p.category));
      if (products.length === 0) continue;
      const card = el('div', 'ph-card');
      const locked = w.player.age < g.minAge && !e().sandbox;
      card.appendChild(el('div', 'ph-card-title', `${g.name}${locked ? ` 🔒 ${g.minAge} ans` : ''}`));
      card.appendChild(el('div', 'ph-card-sub', `${g.address} · prix ×${g.priceMult} · minimum ${eur(g.minOrder)} · ${g.deliveryDays === 0 ? 'retrait sur place (tu portes les cartons)' : `livraison en ${g.deliveryDays} j (${eur(g.deliveryFee)})`}`));
      const qty: Record<string, number> = {};
      const table = el('div', 'ph-table');
      const totalEl = el('b', 'ph-total', '');
      const refresh = (): void => {
        const goods = Object.entries(qty).reduce((s, [id, q]) => s + q * (PRODUCT_BY_ID[id]!.wholesaleBase * g.priceMult), 0);
        totalEl.textContent = `Total : ${eur(goods + (goods > 0 ? g.deliveryFee : 0))}${goods > 0 && goods < g.minOrder ? ` — sous le minimum de ${eur(g.minOrder)}` : ''}`;
      };
      for (const p of products) {
        if (!p) continue;
        const row = el('div', 'ph-trow');
        row.appendChild(el('span', 'ph-tname', p.name));
        row.appendChild(el('span', 'ph-tqty', `${eur(p.wholesaleBase * g.priceMult)} · place : ${freeSpaceFor(b, p.id)}`));
        const input = el('input', 'ph-qty');
        input.type = 'number';
        input.min = '0';
        input.step = '5';
        input.value = '0';
        input.addEventListener('input', () => { qty[p.id] = Math.max(0, Math.floor(Number(input.value) || 0)); refresh(); });
        row.appendChild(input);
        table.appendChild(row);
      }
      card.appendChild(table);
      refresh();
      const actions = el('div', 'ph-actions');
      actions.appendChild(totalEl);
      const btn = button('Commander', () => act(orderStock(w, b.id, g.id, Object.entries(qty).map(([productId, q]) => ({ productId, qty: q })))), 'ph-btn primary');
      btn.disabled = locked;
      actions.appendChild(btn);
      card.appendChild(actions);
      screen.appendChild(card);
    }
  }

  // ----- Emploi -----
  function renderEmploi(): void {
    refreshJobMarket(w);
    const all = Object.values(e().businesses);
    const staffCard = el('div', 'ph-card');
    staffCard.appendChild(el('div', 'ph-card-title', '👥 Ton équipe'));
    const staff = Object.values(e().employees).filter((x) => x.businessId);
    if (staff.length === 0) staffCard.appendChild(el('p', 'ph-note', 'Personne ne travaille encore pour toi.'));
    for (const emp of staff) {
      const row = el('div', 'ph-trow');
      row.appendChild(el('span', 'ph-tname', `${emp.name}, ${emp.age} ans — ${emp.role}`));
      row.appendChild(el('span', `ph-tqty ${emp.satisfaction < 40 ? 'bad' : ''}`, `compétence ${emp.skill} · moral ${Math.round(emp.satisfaction)} · ${e().businesses[emp.businessId!]?.name}`));
      row.appendChild(button(`${eur(emp.wage)}/h +0,50`, () => act(setWage(w, emp.id, emp.wage + 0.5)), 'ph-mini'));
      row.appendChild(button('Licencier', () => act(fire(w, emp.id)), 'ph-mini danger'));
      staffCard.appendChild(row);
    }
    screen.appendChild(staffCard);

    const market = el('div', 'ph-card');
    market.appendChild(el('div', 'ph-card-title', '📋 Candidats de la semaine (renouvelés chaque lundi)'));
    if (all.length === 0) market.appendChild(el('p', 'ph-note', 'Ouvre un commerce pour pouvoir embaucher.'));
    const target = all.find((x) => x.id === selectedBiz) ?? all[0];
    for (const id of e().jobMarket.candidateIds) {
      const c = e().employees[id];
      if (!c) continue;
      const row = el('div', 'ph-trow');
      row.appendChild(el('span', 'ph-tname', `${c.name}, ${c.age} ans — ${c.role}`));
      row.appendChild(el('span', 'ph-tqty', `compétence ${c.skill}/100 · demande ${eur(c.wage)}/h`));
      if (target) row.appendChild(button(`Embaucher pour ${target.name}`, () => act(hire(w, c.id, target.id)), 'ph-mini'));
      market.appendChild(row);
    }
    screen.appendChild(market);
  }

  // ----- Banque -----
  function renderBanque(): void {
    const bikeCard = el('div', 'ph-card');
    bikeCard.appendChild(el('div', 'ph-card-title', '🚲 Cycles du Taret'));
    if (ownsBike(w)) {
      bikeCard.appendChild(el('p', 'ph-note', 'Tu as un vélo : B pour monter ou descendre. Vitesse ×2,5 en ville, 30 unités de plus à transporter.'));
    } else {
      bikeCard.appendChild(el('p', 'ph-note', `${BIKE.name} : ${BIKE.price} €. Vitesse ×${BIKE.speedScale} en ville, +${BIKE.extraCarry} unités transportables.`));
      bikeCard.appendChild(button(`Acheter (${BIKE.price} €)`, () => act(buyBike(w)), 'ph-btn primary'));
    }
    screen.appendChild(bikeCard);
    const offer = loanOffer(w);
    const card = el('div', 'ph-card');
    card.appendChild(el('div', 'ph-card-title', '🏦 Caisse coopérative du Taret'));
    card.appendChild(el('p', 'ph-note', offer.reason));
    const row = el('div', 'ph-row');
    row.appendChild(stat('Prêt possible', eur(offer.max)));
    row.appendChild(stat('Taux annuel', `${offer.ratePct} %`));
    card.appendChild(row);
    const actions = el('div', 'ph-actions');
    for (const v of [100, 500, 2000, 10000]) {
      if (v > offer.max) continue;
      actions.appendChild(button(`Emprunter ${eur(v)} sur 120 j`, () => act(takeLoan(w, v, 120))));
    }
    card.appendChild(actions);
    screen.appendChild(card);
    for (const l of e().loans) {
      const lc = el('div', 'ph-card');
      lc.appendChild(el('div', 'ph-card-title', `Prêt de ${eur(l.principal)} à ${l.ratePct} %`));
      lc.appendChild(el('p', 'ph-note', `Reste ${eur(l.remaining)} · ${eur(l.dailyPayment)} prélevés chaque nuit sur ton argent personnel.`));
      lc.appendChild(button('Rembourser 50 €', () => act(repayLoan(w, l.id, 50))));
      screen.appendChild(lc);
    }
  }

  render();
  ctx.showModal('📱 Téléphone', 'Gère tes affaires, où que tu sois', root, true);
}
