/**
 * Économie « Big Ambitions » de NEURAPOLIS : immobilier commercial, commerces, approvisionnement
 * physique, clients heure par heure, employés, banque. Voir docs/VISION.md §4.
 *
 * Déterminisme : aucun tirage dans le PRNG partagé du monde. Le hasard économique vient d'un
 * hachage (graine, jour, heure, commerce), donc les autres systèmes ne sont jamais décalés.
 * Toutes les sommes sont arrondies au centime ; chaque mouvement d'argent passe par un livre.
 */
import type { LedgerEntry, Notification, WorldState } from '../core/types';
import type {
  BusinessState, BusinessTypeDef, CarriedGoods, CommercialUnitDef, DayStats, EconomyState, EmployeeRole,
  EmployeeState, FurniturePlacement, LeaseState, LoanState, PendingOrder, ProductDef,
} from '../core/economy_types';
import { dateOf, dayIndexOf, minutesOfDay } from '../core/clock';
import { CITY } from '../data/map';
import {
  BUSINESS_TYPE_BY_ID, FURNITURE_BY_ID, PICKUP_BUILDINGS, PRODUCT_BY_ID, STALL_IMPLICIT, WHOLESALER_BY_ID,
} from '../data/economy';
import { notify, pushEvent } from './events';
import { createEconomyState } from '../core/economy_types';
import { bertinLoyaltyDiscount } from './jobs';
import { timelineDemand } from './world_timeline';
import { laminoirDemand } from './laminoir';
import { sectorDemand, sectorOfBusinessType } from './happenings_effects';
import { travelShelfBonus, travelSupplierDiscount } from './travel';
import { COMPETITORS, COMPETITOR_BY_UNIT } from '../data/city/competitors';
import { areaAt } from '../data/city/layout';
import { areaUnlocked } from './areas';

export interface EconomyResult {
  ok: boolean;
  message: string;
}
const ok = (message: string): EconomyResult => ({ ok: true, message });
const ko = (message: string): EconomyResult => ({ ok: false, message });

const round2 = (v: number): number => Math.round(v * 100) / 100;
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export const UNIT_BY_ID: Readonly<Record<string, CommercialUnitDef>> = Object.fromEntries(CITY.units.map((u) => [u.id, u]));

/** Âge à partir duquel on signe seul un bail ou un prêt. */
export const ADULT_AGE = 18;
/** Dépôt de garantie : nombre de jours de loyer. */
export const DEPOSIT_DAYS = 7;
/** Jours d'impayés consécutifs avant expulsion. */
export const EVICTION_ARREARS = 3;
/** Surface au sol utilisable par le mobilier (le reste : circulation, réserve). */
export const FLOOR_USE = 0.55;
const HISTORY_DAYS = 60;
const LEDGER_CAP = 400;
const JOB_MARKET_SIZE = 6;

// ---------- État ----------

export { createEconomyState };

export function ensureEconomy(w: WorldState): EconomyState {
  if (!w.economy) w.economy = createEconomyState();
  return w.economy;
}

function nextId(e: EconomyState, prefix: string): string {
  const id = `${prefix}_${e.nextId}`;
  e.nextId += 1;
  return id;
}

/** Hasard économique déterministe dans [0, 1). */
export function econRand(w: WorldState, ...keys: (number | string)[]): number {
  let h = (w.seed ^ 0x9e3779b9) >>> 0;
  for (const k of keys) {
    const s = String(k);
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 2654435761) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  }
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function today(w: WorldState): number {
  return dayIndexOf(w.time.tick);
}

function post(b: BusinessState, w: WorldState, label: string, amount: number): void {
  const a = round2(amount);
  const day = today(w);
  const entry: LedgerEntry = { day, date: dateOf(day).iso, label, amount: a };
  b.ledger.push(entry);
  if (b.ledger.length > LEDGER_CAP) b.ledger.splice(0, b.ledger.length - LEDGER_CAP);
  b.cash = round2(b.cash + a);
}

function emptyStats(day: number): DayStats {
  return { day, passersby: 0, visitors: 0, customers: 0, lost: 0, unitsSold: 0, revenue: 0, costOfGoods: 0, wages: 0, rent: 0, other: 0, regularVisits: 0 };
}

// ---------- Immobilier ----------

export type UnitStatus = 'libre' | 'loue_joueur' | 'occupe';

export interface UnitListing {
  unit: CommercialUnitDef;
  status: UnitStatus;
  rentPerDay: number;
  deposit: number;
  businessId?: string;
  /** Commerce concurrent installé dans ce local (non louable). */
  competitor?: string;
}

/** Loyer de marché : le loyer de référence, légèrement plus cher quand le quartier va bien. */
export function marketRent(w: WorldState, u: CommercialUnitDef): number {
  const vitality = w.district.vitaliteEpicerie ?? 50;
  const k = 0.9 + (vitality / 100) * 0.2;
  return round2(u.baseRentPerDay * k);
}

export function listUnits(w: WorldState): UnitListing[] {
  const e = ensureEconomy(w);
  return CITY.units.map((u) => {
    const lease = e.leases[u.id];
    const rent = lease ? lease.rentPerDay : marketRent(w, u);
    const biz = Object.values(e.businesses).find((b) => b.unitId === u.id);
    const comp = COMPETITOR_BY_UNIT[u.id];
    const tenant = e.owned?.[u.id]?.tenant;
    const status: UnitStatus = lease ? 'loue_joueur' : comp || tenant ? 'occupe' : 'libre';
    const competitor = comp ? `${comp.shopName} (${comp.owner})` : tenant ? `${tenant.name} (ton locataire)` : undefined;
    return { unit: u, status, rentPerDay: rent, deposit: round2(rent * DEPOSIT_DAYS), businessId: biz?.id, competitor };
  });
}

export interface Eligibility {
  allowed: boolean;
  coSigner: LeaseState['coSigner'];
  reason: string;
}

/**
 * Peut-on signer un bail pour ce local ? Un majeur signe seul. Un mineur a besoin d'un garant
 * (Vision §4.2) : l'étal du marché se loue dès 12 ans avec l'accord des parents ; un vrai local
 * exige d'avoir fait ses preuves (ventes réalisées, réputation) pour que les parents co-signent.
 */
export function leaseEligibility(w: WorldState, unitId: string): Eligibility {
  const e = ensureEconomy(w);
  const u = UNIT_BY_ID[unitId];
  if (!u) return { allowed: false, coSigner: null, reason: 'Local inconnu.' };
  if (e.leases[unitId]) return { allowed: false, coSigner: null, reason: 'Tu loues déjà ce local.' };
  const area = areaAt(u.door.x, u.door.y);
  if (!areaUnlocked(w, area)) return { allowed: false, coSigner: null, reason: `${area.name} n’est pas encore ouvert : ${area.lock} (palier ${area.tier} de l’Ascension).` };
  const comp = COMPETITOR_BY_UNIT[unitId];
  if (comp) return { allowed: false, coSigner: null, reason: `Ce local est occupé par ${comp.shopName}, tenu par ${comp.owner}.` };
  const tenant = e.owned?.[unitId]?.tenant;
  if (tenant) return { allowed: false, coSigner: null, reason: `Ton locataire ${tenant.name} occupe ces murs.` };
  if (e.sandbox || w.player.age >= ADULT_AGE) return { allowed: true, coSigner: null, reason: 'Tu peux signer seul.' };
  // Sans leur confiance, Nora et Thierry ne signent plus rien (src/simulation/family.ts, seuil 35).
  const fam = w.family?.parents;
  const trust = fam ? (fam.nora.trust + fam.thierry.trust) / 2 : 100;
  if (trust < 35) return { allowed: false, coSigner: null, reason: `Tes parents refusent de se porter garants : leur confiance est trop basse (${Math.round(trust)}/100). Regagne-la : cours, vérité, dîners.` };
  const stall = u.buildingId.startsWith('etal_');
  if (stall) return { allowed: true, coSigner: 'parent', reason: 'Tes parents acceptent de signer pour un étal du marché.' };
  const sales = (w.flags['ventes'] ?? 0) + (w.flags['ventesEtal'] ?? 0);
  const rep = w.player.reputation;
  const ownsStall = Object.values(e.businesses).some((b) => UNIT_BY_ID[b.unitId]?.buildingId.startsWith('etal_') && b.history.length >= 5);
  if (w.player.age >= 16 || (ownsStall && rep >= 55 && sales >= 40)) {
    return { allowed: true, coSigner: 'parent', reason: 'Tes parents se portent garants : tu as fait tes preuves.' };
  }
  return {
    allowed: false,
    coSigner: null,
    reason: `Personne ne signera pour un vrai local tant que tu n'as pas fait tes preuves : tiens un étal au moins 5 jours, vends 40 articles (tu en es à ${sales}) et atteins une réputation de 55 (tu es à ${rep}).`,
  };
}

export function signLease(w: WorldState, unitId: string): EconomyResult {
  const e = ensureEconomy(w);
  const u = UNIT_BY_ID[unitId];
  if (!u) return ko('Local inconnu.');
  const el = leaseEligibility(w, unitId);
  if (!el.allowed) return ko(el.reason);
  // Murs possédés : pas de loyer ni de dépôt pour son propre commerce.
  const own = !!e.owned?.[unitId];
  const rent = own ? 0 : marketRent(w, u);
  const deposit = round2(rent * DEPOSIT_DAYS);
  if (w.player.money < deposit) return ko(`Il faut ${deposit.toFixed(2)} € de dépôt de garantie (${DEPOSIT_DAYS} jours de loyer). Tu as ${w.player.money.toFixed(2)} €.`);
  w.player.money = round2(w.player.money - deposit);
  e.leases[unitId] = { unitId, startDay: today(w), rentPerDay: rent, deposit, coSigner: el.coSigner, arrears: 0 };
  pushEvent(w, {
    type: 'opportunite',
    title: `Bail signé : ${u.address}`,
    text: `${u.sizeM2} m², ${rent.toFixed(2)} € par jour. Dépôt de garantie versé : ${deposit.toFixed(2)} €.${el.coSigner ? ' Tes parents ont co-signé.' : ''}`,
    causes: [
      { facteur: 'trafic devant la vitrine', seuil: `${u.footTraffic} passants/h`, poids: 2 },
      { facteur: 'loyer de marché', seuil: `${rent.toFixed(2)} €/jour`, poids: 2 },
    ],
  });
  return ok(`Bail signé pour ${u.address}. Dépôt de ${deposit.toFixed(2)} € versé.`);
}

/** Rend un local : le stock est perdu, le mobilier revendu à 30 %, le dépôt rendu s'il n'y a pas d'impayé. */
export function endLease(w: WorldState, unitId: string, reason: 'volontaire' | 'expulsion' = 'volontaire'): EconomyResult {
  const e = ensureEconomy(w);
  const lease = e.leases[unitId];
  if (!lease) return ko('Tu ne loues pas ce local.');
  const biz = Object.values(e.businesses).find((b) => b.unitId === unitId);
  let refund = reason === 'volontaire' && lease.arrears === 0 ? lease.deposit : 0;
  if (biz) {
    const resale = round2(biz.furniture.reduce((s, f) => s + (FURNITURE_BY_ID[f]?.cost ?? 0) * 0.3, 0));
    refund = round2(refund + Math.max(0, biz.cash) + resale);
    for (const emp of biz.employeeIds) {
      const st = e.employees[emp];
      if (st) { st.businessId = null; st.hiredDay = null; }
    }
    delete e.businesses[biz.id];
    e.orders = e.orders.filter((o) => o.businessId !== biz.id);
    e.carried = e.carried.filter((c) => c.businessId !== biz.id);
  }
  delete e.leases[unitId];
  w.player.money = round2(w.player.money + refund);
  return ok(reason === 'expulsion'
    ? `Expulsion : loyers impayés. Le local ${UNIT_BY_ID[unitId]?.address ?? ''} est repris.`
    : `Local rendu. Tu récupères ${refund.toFixed(2)} €.`);
}

// ---------- Propriété des murs ----------

/** Rendement locatif brut d'un local commercial (environ 8 % par an). */
export const PROPERTY_YIELD = 0.08;

/** Prix des murs : loyer annuel de marché capitalisé au rendement. */
export function propertyPrice(w: WorldState, u: CommercialUnitDef): number {
  return Math.round((marketRent(w, u) * 365) / PROPERTY_YIELD / 100) * 100;
}

export function ownsUnit(w: WorldState, unitId: string): boolean {
  return !!w.economy?.owned?.[unitId];
}

export function buyProperty(w: WorldState, unitId: string): EconomyResult {
  const e = ensureEconomy(w);
  const u = UNIT_BY_ID[unitId];
  if (!u) return ko('Local inconnu.');
  if (u.buildingId.startsWith('etal_')) return ko('Les étals appartiennent à la commune.');
  if (!e.sandbox && w.player.age < ADULT_AGE) return ko(`Acheter des murs demande d’avoir ${ADULT_AGE} ans (ou le mode bac à sable).`);
  if (COMPETITOR_BY_UNIT[unitId]) return ko('Ce local appartient à son commerçant et n’est pas à vendre.');
  if (e.owned?.[unitId]) return ko('Tu possèdes déjà ces murs.');
  const price = propertyPrice(w, u);
  if (w.player.money < price) return ko(`Il faut ${price.toLocaleString('fr-FR')} € (tu as ${w.player.money.toFixed(2)} €). La banque peut t’aider.`);
  w.player.money = round2(w.player.money - price);
  e.owned = { ...(e.owned ?? {}), [unitId]: { unitId, price, boughtDay: today(w), tenant: null } };
  // Plus de loyer à payer pour son propre commerce : le bail est soldé et le dépôt rendu.
  const lease = e.leases[unitId];
  if (lease) {
    w.player.money = round2(w.player.money + lease.deposit);
    lease.rentPerDay = 0;
    lease.deposit = 0;
  }
  pushEvent(w, {
    type: 'opportunite',
    title: `Propriétaire : ${u.address}`,
    text: `Tu achètes les murs pour ${price.toLocaleString('fr-FR')} €. ${lease ? 'Ton commerce ne paie plus de loyer.' : 'Tu peux y ouvrir un commerce ou le louer.'}`,
    causes: [
      { facteur: 'loyer annuel de marché capitalisé', seuil: `${(PROPERTY_YIELD * 100).toFixed(0)} % de rendement`, poids: 2 },
      { facteur: 'trafic devant la vitrine', seuil: `${u.footTraffic} passants/h`, poids: 1 },
    ],
  });
  return ok(`Murs achetés : ${u.address} (${price.toLocaleString('fr-FR')} €).`);
}

/** Loue des murs vides à un commerçant : un loyer est perçu chaque nuit. */
export function rentOutProperty(w: WorldState, unitId: string): EconomyResult {
  const e = ensureEconomy(w);
  const p = e.owned?.[unitId];
  const u = UNIT_BY_ID[unitId];
  if (!p || !u) return ko('Tu ne possèdes pas ces murs.');
  if (e.leases[unitId]) return ko('Ton propre commerce occupe ce local.');
  if (p.tenant) return ko(`Déjà loué à ${p.tenant.name}.`);
  const names = ['Atelier Lumière', 'Le Comptoir du Taret', 'Mode & Retouches', 'Pizzeria du Canal', 'Cycles Express', 'La Bonne Graine'];
  const name = names[Math.floor(econRand(w, 'locataire', unitId, today(w)) * names.length)]!;
  p.tenant = { name, rentPerDay: round2(marketRent(w, u) * 0.95) };
  return ok(`${name} s’installe : ${p.tenant.rentPerDay.toFixed(2)} € de loyer par jour.`);
}

export function sellProperty(w: WorldState, unitId: string): EconomyResult {
  const e = ensureEconomy(w);
  const p = e.owned?.[unitId];
  const u = UNIT_BY_ID[unitId];
  if (!p || !u) return ko('Tu ne possèdes pas ces murs.');
  if (e.leases[unitId]) return ko('Rends d’abord le local de ton commerce.');
  // Frais de vente (notaire, agence) : 7 %.
  const value = Math.round(propertyPrice(w, u) * 0.93);
  w.player.money = round2(w.player.money + value);
  const next = { ...(e.owned ?? {}) };
  delete next[unitId];
  e.owned = next;
  return ok(`Murs vendus ${value.toLocaleString('fr-FR')} € (frais de vente de 7 % déduits).`);
}

// ---------- Commerces ----------

export function businessTypeAllowed(w: WorldState, typeId: string, unitId: string): EconomyResult {
  const e = ensureEconomy(w);
  const t = BUSINESS_TYPE_BY_ID[typeId];
  const u = UNIT_BY_ID[unitId];
  if (!t || !u) return ko('Type de commerce ou local inconnu.');
  const stall = u.buildingId.startsWith('etal_');
  if (stall !== (typeId === 't_etal_marche')) {
    return ko(stall ? 'Un étal de marché ne peut accueillir qu’un étal.' : 'Un étal de marché n’a pas sa place dans un local fermé.');
  }
  if (!e.sandbox && w.player.age < t.minAge && !e.leases[unitId]?.coSigner) {
    return ko(`Il faut avoir ${t.minAge} ans (ou un garant) pour ouvrir : ${t.name}.`);
  }
  return ok('');
}

export function openBusiness(w: WorldState, unitId: string, typeId: string, name: string): EconomyResult {
  const e = ensureEconomy(w);
  if (!e.leases[unitId]) return ko('Il faut d’abord louer le local.');
  if (Object.values(e.businesses).some((b) => b.unitId === unitId)) return ko('Un commerce occupe déjà ce local.');
  const allowed = businessTypeAllowed(w, typeId, unitId);
  if (!allowed.ok) return allowed;
  const t = BUSINESS_TYPE_BY_ID[typeId]!;
  const clean = name.trim().slice(0, 32) || t.name;
  const id = nextId(e, 'biz');
  const day = today(w);
  e.businesses[id] = {
    id, name: clean, typeId, unitId, openedDay: day, open: false,
    hours: [t.defaultHours[0], t.defaultHours[1]], prices: {}, stock: {}, furniture: [], employeeIds: [],
    cash: 0, ledger: [], today: emptyStats(day), history: [], reputation: 50, marketing: {}, layout: {}, regulars: 0,
  };
  pushEvent(w, {
    type: 'opportunite',
    title: `Nouveau commerce : ${clean}`,
    text: `${t.icon} ${t.name} au ${UNIT_BY_ID[unitId]!.address}. Prochaines étapes : équiper, approvisionner, fixer les prix, ouvrir.`,
    causes: [{ facteur: 'choix du joueur : entreprendre', poids: 3 }],
  });
  return ok(`${clean} est créé. Il reste à l’équiper, l’approvisionner et l’ouvrir.`);
}

export function getBusiness(w: WorldState, id: string): BusinessState | undefined {
  return w.economy?.businesses[id];
}

/** Transfert d'argent personnel → caisse du commerce (ou l'inverse si `amount` < 0). */
export function transferCash(w: WorldState, bizId: string, amount: number): EconomyResult {
  const b = getBusiness(w, bizId);
  if (!b) return ko('Commerce inconnu.');
  const a = round2(amount);
  if (a === 0) return ko('Montant nul.');
  if (a > 0 && w.player.money < a) return ko('Tu n’as pas assez d’argent sur toi.');
  if (a < 0 && b.cash < -a) return ko('La caisse ne contient pas assez.');
  w.player.money = round2(w.player.money - a);
  post(b, w, a > 0 ? 'Apport du propriétaire' : 'Retrait du propriétaire', a);
  return ok(a > 0 ? `${a.toFixed(2)} € versés dans la caisse.` : `${(-a).toFixed(2)} € retirés de la caisse.`);
}

export function usedFloor(b: BusinessState): number {
  return b.furniture.reduce((s, f) => s + (FURNITURE_BY_ID[f]?.footprintM2 ?? 0), 0);
}

export function buyFurniture(w: WorldState, bizId: string, furnitureId: string): EconomyResult {
  const b = getBusiness(w, bizId);
  const f = FURNITURE_BY_ID[furnitureId];
  if (!b || !f) return ko('Commerce ou meuble inconnu.');
  const u = UNIT_BY_ID[b.unitId]!;
  if (u.buildingId.startsWith('etal_')) return ko('L’étal est déjà équipé.');
  if (usedFloor(b) + f.footprintM2 > u.sizeM2 * FLOOR_USE) return ko(`Plus de place au sol (${usedFloor(b).toFixed(1)} / ${(u.sizeM2 * FLOOR_USE).toFixed(1)} m² utilisables).`);
  if (b.cash < f.cost) return ko(`La caisse doit contenir ${f.cost} € (elle a ${b.cash.toFixed(2)} €). Verse de l’argent d’abord.`);
  post(b, w, `Achat : ${f.name}`, -f.cost);
  b.today.other = round2(b.today.other + f.cost);
  b.furniture.push(f.id);
  return ok(`${f.name} installé (${f.cost} €).`);
}

export function sellFurniture(w: WorldState, bizId: string, index: number): EconomyResult {
  const b = getBusiness(w, bizId);
  if (!b || index < 0 || index >= b.furniture.length) return ko('Meuble introuvable.');
  const f = FURNITURE_BY_ID[b.furniture[index]!];
  b.furniture.splice(index, 1);
  // Les indices suivants reculent d'un cran : l'aménagement suit.
  if (b.layout) {
    const next: Record<string, FurniturePlacement> = {};
    for (const [k, v] of Object.entries(b.layout)) {
      const i = Number(k);
      if (i < index) next[k] = v;
      else if (i > index) next[String(i - 1)] = v;
    }
    b.layout = next;
  }
  const back = round2((f?.cost ?? 0) * 0.3);
  post(b, w, `Revente : ${f?.name ?? 'meuble'}`, back);
  clampStockToCapacity(b);
  return ok(`Meuble revendu ${back.toFixed(2)} €.`);
}

// ---------- Aménagement ----------

/** Dimensions intérieures d'un local (mètres), communes à la simulation et au rendu. */
export function shopRoomSize(u: CommercialUnitDef): { w: number; d: number } {
  const w = Math.max(6, Math.min(14, Math.round(Math.sqrt(u.sizeM2 * 1.25))));
  const d = Math.max(6, Math.min(12, Math.round(u.sizeM2 / w)));
  return { w, d };
}

/** Encombrement au sol (largeur × profondeur, rotation nulle) par catégorie de meuble. */
export const FURNITURE_DIMS: Readonly<Record<string, readonly [number, number]>> = {
  rayonnage: [2.0, 0.6], frigo: [0.9, 0.75], caisse: [2.4, 0.8], comptoir: [2.4, 0.8], table: [1.6, 1.0],
  machine: [0.9, 0.6], deco: [0.6, 0.6], stockage: [2.0, 0.6],
};

export function furnitureFootprint(furnitureId: string, rot: number): { w: number; d: number } {
  const [w, d] = FURNITURE_DIMS[FURNITURE_BY_ID[furnitureId]?.category ?? ''] ?? [1, 1];
  const quarter = Math.abs(Math.round(rot / (Math.PI / 2))) % 2 === 1;
  return quarter ? { w: d, d: w } : { w, d };
}

const overlap = (a: { x: number; z: number; w: number; d: number }, b: { x: number; z: number; w: number; d: number }): boolean =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w - 0.02 && Math.abs(a.z - b.z) * 2 < a.d + b.d - 0.02;

/**
 * Place un meuble (indice dans `furniture`). Refusé s'il sort de la pièce, chevauche un autre
 * meuble déjà placé, ou bloque l'allée devant la porte (façade sud, au centre).
 */
export function placeFurniture(w: WorldState, bizId: string, index: number, x: number, z: number, rot: number): EconomyResult {
  const b = getBusiness(w, bizId);
  if (!b || index < 0 || index >= b.furniture.length) return ko('Meuble introuvable.');
  const u = UNIT_BY_ID[b.unitId];
  if (!u || u.buildingId.startsWith('etal_')) return ko('Un étal ne s’aménage pas.');
  const room = shopRoomSize(u);
  const r = Math.round(rot / (Math.PI / 2)) * (Math.PI / 2);
  const fp = { x: Math.round(x * 2) / 2, z: Math.round(z * 2) / 2, ...furnitureFootprint(b.furniture[index]!, r) };
  if (fp.x - fp.w / 2 < 0.1 || fp.x + fp.w / 2 > room.w - 0.1 || fp.z - fp.d / 2 < 0.1 || fp.z + fp.d / 2 > room.d - 0.1) {
    return ko('Ce meuble dépasse des murs.');
  }
  if (overlap(fp, { x: room.w / 2, z: room.d - 0.9, w: 1.8, d: 1.8 })) return ko('Il faut laisser l’entrée dégagée.');
  for (const [k, p] of Object.entries(b.layout ?? {})) {
    const j = Number(k);
    if (j === index || j >= b.furniture.length) continue;
    if (overlap(fp, { x: p.x, z: p.z, ...furnitureFootprint(b.furniture[j]!, p.rot) })) {
      return ko(`Il chevauche : ${FURNITURE_BY_ID[b.furniture[j]!]?.name ?? 'un autre meuble'}.`);
    }
  }
  b.layout = { ...(b.layout ?? {}), [String(index)]: { x: fp.x, z: fp.z, rot: r } };
  return ok(`${FURNITURE_BY_ID[b.furniture[index]!]?.name ?? 'Meuble'} placé.`);
}

export interface Capacity { ambiant: number; froid: number }

/** Capacité de stockage par type de conservation. */
export function storageCapacity(b: BusinessState): Capacity {
  const u = UNIT_BY_ID[b.unitId];
  if (u?.buildingId.startsWith('etal_')) return { ambiant: STALL_IMPLICIT.capacityUnits, froid: 0 };
  const cap: Capacity = { ambiant: 0, froid: 0 };
  for (const id of b.furniture) {
    const f = FURNITURE_BY_ID[id];
    if (!f?.capacityUnits) continue;
    cap[f.storage ?? 'ambiant'] += f.capacityUnits;
  }
  return cap;
}

export function stockUnits(b: BusinessState, productId?: string): number {
  const ids = productId ? [productId] : Object.keys(b.stock);
  return ids.reduce((s, id) => s + (b.stock[id] ?? []).reduce((t, l) => t + l.qty, 0), 0);
}

function stockByStorage(b: BusinessState): Capacity {
  const c: Capacity = { ambiant: 0, froid: 0 };
  for (const [pid, lots] of Object.entries(b.stock)) {
    const st = PRODUCT_BY_ID[pid]?.storage ?? 'ambiant';
    c[st] += lots.reduce((s, l) => s + l.qty, 0);
  }
  return c;
}

/** Place restante pour un produit (un produit froid sans frigo n'a aucune place). */
export function freeSpaceFor(b: BusinessState, productId: string): number {
  const p = PRODUCT_BY_ID[productId];
  if (!p) return 0;
  const cap = storageCapacity(b);
  const used = stockByStorage(b);
  // Sur un étal, le froid est toléré en petite quantité (glacière) : 15 unités.
  const stall = UNIT_BY_ID[b.unitId]?.buildingId.startsWith('etal_');
  if (stall && p.storage === 'froid') return Math.max(0, 15 - used.froid);
  return Math.max(0, cap[p.storage] - used[p.storage]);
}

function clampStockToCapacity(b: BusinessState): void {
  for (const pid of Object.keys(b.stock)) {
    let over = -freeSpaceFor(b, pid);
    const lots = b.stock[pid]!;
    while (over > 0 && lots.length) {
      const l = lots[0]!;
      const take = Math.min(l.qty, over);
      l.qty -= take;
      over -= take;
      if (l.qty <= 0) lots.shift();
    }
  }
}

export function setPrice(w: WorldState, bizId: string, productId: string, price: number): EconomyResult {
  const b = getBusiness(w, bizId);
  const p = PRODUCT_BY_ID[productId];
  if (!b || !p) return ko('Commerce ou produit inconnu.');
  if (!Number.isFinite(price) || price <= 0) return ko('Prix invalide.');
  b.prices[productId] = round2(clamp(price, 0.05, p.retailRef * 10));
  return ok(`${p.name} : ${b.prices[productId]!.toFixed(2)} €.`);
}

export function priceOf(b: BusinessState, productId: string): number {
  return b.prices[productId] ?? PRODUCT_BY_ID[productId]?.retailRef ?? 1;
}

export function setHours(w: WorldState, bizId: string, open: number, close: number): EconomyResult {
  const b = getBusiness(w, bizId);
  if (!b) return ko('Commerce inconnu.');
  const o = clamp(Math.round(open), 5, 23);
  const c = clamp(Math.round(close), o + 1, 24);
  b.hours = [o, c];
  return ok(`Horaires : ${o} h – ${c} h.`);
}

/** Conditions d'ouverture : meubles requis présents, au moins un produit en rayon. */
export function readiness(b: BusinessState): { ready: boolean; missing: string[] } {
  const t = BUSINESS_TYPE_BY_ID[b.typeId];
  const missing: string[] = [];
  if (!t) return { ready: false, missing: ['type inconnu'] };
  for (const cat of t.requiredFurniture) {
    if (!b.furniture.some((f) => FURNITURE_BY_ID[f]?.category === cat)) missing.push(`un meuble « ${cat} »`);
  }
  if (stockUnits(b) === 0) missing.push('de la marchandise');
  return { ready: missing.length === 0, missing };
}

export function setOpen(w: WorldState, bizId: string, open: boolean): EconomyResult {
  const b = getBusiness(w, bizId);
  if (!b) return ko('Commerce inconnu.');
  if (open) {
    const r = readiness(b);
    if (!r.ready) return ko(`Impossible d’ouvrir : il manque ${r.missing.join(', ')}.`);
  }
  b.open = open;
  return ok(open ? `${b.name} est ouvert.` : `${b.name} est fermé.`);
}

// ---------- Approvisionnement (logistique physique) ----------

export function wholesalerAllowed(w: WorldState, wholesalerId: string): EconomyResult {
  const g = WHOLESALER_BY_ID[wholesalerId];
  if (!g) return ko('Fournisseur inconnu.');
  const e = ensureEconomy(w);
  if (!e.sandbox && w.player.age < g.minAge) return ko(`${g.name} ne travaille qu’avec les plus de ${g.minAge} ans.`);
  return ok('');
}

export function orderStock(w: WorldState, bizId: string, wholesalerId: string, lines: { productId: string; qty: number }[]): EconomyResult {
  const e = ensureEconomy(w);
  const b = getBusiness(w, bizId);
  const g = WHOLESALER_BY_ID[wholesalerId];
  if (!b || !g) return ko('Commerce ou fournisseur inconnu.');
  const allowed = wholesalerAllowed(w, wholesalerId);
  if (!allowed.ok) return allowed;
  const t = BUSINESS_TYPE_BY_ID[b.typeId]!;
  const clean = lines
    .filter((l) => l.qty > 0 && g.productIds.includes(l.productId))
    .map((l) => ({ productId: l.productId, qty: Math.floor(l.qty) }));
  if (clean.length === 0) return ko('Commande vide.');
  for (const l of clean) {
    const p = PRODUCT_BY_ID[l.productId]!;
    if (!t.productCategories.includes(p.category)) return ko(`${p.name} ne se vend pas dans un commerce de ce type.`);
  }
  // Mme Bertin consent un prix plus doux au jeune qui l'a aidée à l'épicerie (src/simulation/jobs.ts).
  const mult = (g.id === 'g_bertin_depannage' ? g.priceMult - bertinLoyaltyDiscount(w) : g.priceMult) - travelSupplierDiscount(w);
  const priced = clean.map((l) => ({ ...l, unitCost: round2(PRODUCT_BY_ID[l.productId]!.wholesaleBase * mult) }));
  const goods = round2(priced.reduce((s, l) => s + l.unitCost * l.qty, 0));
  if (goods < g.minOrder) return ko(`Commande minimale chez ${g.name} : ${g.minOrder} € (ta commande : ${goods.toFixed(2)} €).`);
  const total = round2(goods + g.deliveryFee);
  if (b.cash < total) return ko(`La caisse doit contenir ${total.toFixed(2)} € (elle a ${b.cash.toFixed(2)} €).`);
  post(b, w, `Commande ${g.name}`, -total);
  const day = today(w);
  const order: PendingOrder = {
    id: nextId(e, 'cmd'), businessId: bizId, wholesalerId, lines: priced, orderDay: day,
    arrivalDay: day + g.deliveryDays, total, status: g.deliveryDays === 0 ? 'a_retirer' : 'en_livraison',
  };
  e.orders.push(order);
  const units = priced.reduce((s, l) => s + l.qty, 0);
  return ok(order.status === 'a_retirer'
    ? `Commande payée (${total.toFixed(2)} €). ${units} unités t’attendent chez ${g.name} : va les chercher.`
    : `Commande payée (${total.toFixed(2)} €). Livraison prévue dans ${g.deliveryDays} jour(s).`);
}

/** Tuile devant le point de retrait d'un fournisseur. */
export function pickupPoint(wholesalerId: string): { x: number; y: number } | null {
  const bid = PICKUP_BUILDINGS[wholesalerId];
  const bd = bid ? CITY.buildings.find((b) => b.id === bid) : undefined;
  const d = bd?.doors[0];
  if (!d) return null;
  return d.face === 'n' ? { x: d.x, y: d.y - 1 } : d.face === 's' ? { x: d.x, y: d.y + 1 } : d.face === 'w' ? { x: d.x - 1, y: d.y } : { x: d.x + 1, y: d.y };
}

/** Tuile devant la porte d'un commerce (pour décharger). */
export function businessDoor(b: BusinessState): { x: number; y: number } {
  return UNIT_BY_ID[b.unitId]!.door;
}

const near = (w: WorldState, p: { x: number; y: number }, dist = 3): boolean =>
  Math.abs(w.player.pos.x - p.x) <= dist && Math.abs(w.player.pos.y - p.y) <= dist;

export function carriedUnits(e: EconomyState): number {
  return e.carried.reduce((s, c) => s + c.qty, 0);
}

/** Charger les cartons d'une commande « à retirer » : il faut être chez le fournisseur. */
export function pickUpOrder(w: WorldState, orderId: string): EconomyResult {
  const e = ensureEconomy(w);
  const o = e.orders.find((x) => x.id === orderId);
  if (!o || o.status !== 'a_retirer') return ko('Aucune commande à retirer.');
  const pt = pickupPoint(o.wholesalerId);
  if (!pt || !near(w, pt)) return ko(`Va chez ${WHOLESALER_BY_ID[o.wholesalerId]?.name ?? 'le fournisseur'} pour charger les cartons.`);
  let room = e.carryCapacity - carriedUnits(e);
  if (room <= 0) return ko('Tes bras sont pleins : décharge d’abord à la boutique.');
  let taken = 0;
  for (const l of o.lines) {
    const q = Math.min(l.qty, room);
    if (q <= 0) continue;
    l.qty -= q;
    room -= q;
    taken += q;
    const c: CarriedGoods = { orderId: o.id, businessId: o.businessId, productId: l.productId, qty: q, unitCost: l.unitCost };
    e.carried.push(c);
  }
  o.lines = o.lines.filter((l) => l.qty > 0);
  if (o.lines.length === 0) o.status = 'livree';
  const left = o.lines.reduce((s, l) => s + l.qty, 0);
  return ok(left > 0 ? `${taken} unités chargées. Il en reste ${left} : un autre voyage sera nécessaire.` : `${taken} unités chargées. Direction la boutique !`);
}

/** Décharger à la boutique : il faut être devant sa porte. Ce qui ne tient pas reste dans les bras. */
export function unloadAt(w: WorldState, bizId: string): EconomyResult {
  const e = ensureEconomy(w);
  const b = getBusiness(w, bizId);
  if (!b) return ko('Commerce inconnu.');
  if (!near(w, businessDoor(b))) return ko(`Va devant ${b.name} pour décharger.`);
  const mine = e.carried.filter((c) => c.businessId === bizId);
  if (mine.length === 0) return ko('Tu ne portes rien pour ce commerce.');
  let stored = 0;
  for (const c of mine) {
    const q = Math.min(c.qty, freeSpaceFor(b, c.productId));
    if (q <= 0) continue;
    addLot(b, c.productId, q, c.unitCost, today(w));
    c.qty -= q;
    stored += q;
  }
  e.carried = e.carried.filter((c) => c.qty > 0);
  const left = e.carried.filter((c) => c.businessId === bizId).reduce((s, c) => s + c.qty, 0);
  return ok(left > 0 ? `${stored} unités rangées. Plus de place pour ${left} unités : achète du rangement.` : `${stored} unités rangées en rayon.`);
}

function addLot(b: BusinessState, productId: string, qty: number, unitCost: number, day: number): void {
  if (!b.stock[productId]) b.stock[productId] = [];
  b.stock[productId]!.push({ qty, receivedDay: day, unitCost });
  if (b.prices[productId] === undefined) b.prices[productId] = PRODUCT_BY_ID[productId]?.retailRef ?? 1;
}

// ---------- Employés ----------

const FIRST = ['Inès', 'Lucas', 'Sofiane', 'Chloé', 'Mehdi', 'Manon', 'Théo', 'Aïcha', 'Hugo', 'Léa', 'Karima', 'Julien', 'Sarah', 'Nathan', 'Fatou', 'Baptiste', 'Nora', 'Kevin', 'Émilie', 'Rachid'];
const LAST = ['Martin', 'Benali', 'Durand', 'Ndiaye', 'Petit', 'Haddad', 'Moreau', 'Lefèvre', 'Diallo', 'Roux', 'Fontaine', 'Mercier', 'Chevalier', 'Boyer', 'Garnier'];
const ROLES: EmployeeRole[] = ['vendeur', 'caissier', 'barista', 'vendeur', 'gerant'];

/** Le site d'emploi se renouvelle chaque lundi : 6 candidats générés de façon déterministe. */
export function refreshJobMarket(w: WorldState): void {
  const e = ensureEconomy(w);
  const day = today(w);
  const monday = day - ((dateOf(day).weekday + 6) % 7);
  if (e.jobMarket.refreshedDay === monday && e.jobMarket.candidateIds.length > 0) return;
  for (const id of e.jobMarket.candidateIds) {
    if (e.employees[id] && e.employees[id]!.businessId === null) delete e.employees[id];
  }
  e.jobMarket = { refreshedDay: monday, candidateIds: [] };
  for (let i = 0; i < JOB_MARKET_SIZE; i++) {
    const r = (k: string): number => econRand(w, 'job', monday, i, k);
    const skill = Math.round(20 + r('skill') * 70);
    const id = nextId(e, 'emp');
    e.employees[id] = {
      id,
      name: `${FIRST[Math.floor(r('f') * FIRST.length)]} ${LAST[Math.floor(r('l') * LAST.length)]}`,
      age: 17 + Math.floor(r('age') * 40),
      role: ROLES[Math.floor(r('role') * ROLES.length)]!,
      skill,
      wage: round2(10.15 + skill / 12 + r('w') * 1.5), // SMIC horaire brut 2020 : 10,15 €
      satisfaction: 70,
      businessId: null,
      hiredDay: null,
    };
    e.jobMarket.candidateIds.push(id);
  }
}

export function hire(w: WorldState, employeeId: string, bizId: string): EconomyResult {
  const e = ensureEconomy(w);
  const emp = e.employees[employeeId];
  const b = getBusiness(w, bizId);
  if (!emp || !b) return ko('Candidat ou commerce inconnu.');
  if (emp.businessId) return ko(`${emp.name} travaille déjà.`);
  if (UNIT_BY_ID[b.unitId]?.buildingId.startsWith('etal_') && b.employeeIds.length >= 1) return ko('Un étal ne fait travailler qu’une personne en plus de toi.');
  const t = BUSINESS_TYPE_BY_ID[b.typeId]!;
  if (!e.sandbox && w.player.age < 16 && t.id !== 't_etal_marche') return ko('Il faut avoir 16 ans pour embaucher (ou jouer en bac à sable).');
  emp.businessId = bizId;
  emp.hiredDay = today(w);
  b.employeeIds.push(emp.id);
  e.jobMarket.candidateIds = e.jobMarket.candidateIds.filter((id) => id !== emp.id);
  return ok(`${emp.name} rejoint ${b.name} (${emp.wage.toFixed(2)} €/h).`);
}

export function fire(w: WorldState, employeeId: string): EconomyResult {
  const e = ensureEconomy(w);
  const emp = e.employees[employeeId];
  if (!emp?.businessId) return ko('Cette personne ne travaille pas pour toi.');
  const b = getBusiness(w, emp.businessId);
  if (b) b.employeeIds = b.employeeIds.filter((id) => id !== emp.id);
  delete e.employees[employeeId];
  return ok(`${emp.name} a quitté l’entreprise.`);
}

export function setWage(w: WorldState, employeeId: string, wage: number): EconomyResult {
  const emp = w.economy?.employees[employeeId];
  if (!emp) return ko('Employé inconnu.');
  if (wage < 10.15) return ko('Le salaire horaire ne peut pas être sous le SMIC (10,15 €).');
  emp.wage = round2(wage);
  return ok(`${emp.name} : ${emp.wage.toFixed(2)} €/h.`);
}

// ---------- Banque ----------

export function loanOffer(w: WorldState): { max: number; ratePct: number; reason: string } {
  const e = ensureEconomy(w);
  const revenue14 = Object.values(e.businesses).reduce((s, b) => s + b.history.slice(-14).reduce((t, d) => t + d.revenue, 0), 0);
  const outstanding = e.loans.reduce((s, l) => s + l.remaining, 0);
  const adult = e.sandbox || w.player.age >= ADULT_AGE;
  const base = adult ? 2000 : 300;
  const cap = adult ? 60000 : 3000;
  const max = Math.max(0, Math.min(cap, base + revenue14 * 2 + w.player.reputation * 10) - outstanding);
  const ratePct = adult ? 5.9 : 3.5; // prêt familial co-signé pour un mineur
  return {
    max: Math.floor(max),
    ratePct,
    reason: adult ? 'Caisse coopérative du Taret : offre fondée sur ton chiffre d’affaires des 14 derniers jours.' : 'Prêt familial co-signé par tes parents, plafonné.',
  };
}

export function takeLoan(w: WorldState, amount: number, termDays = 120): EconomyResult {
  const e = ensureEconomy(w);
  const offer = loanOffer(w);
  const a = Math.floor(amount);
  if (a <= 0) return ko('Montant invalide.');
  if (a > offer.max) return ko(`La banque te prête au plus ${offer.max} €.`);
  const r = offer.ratePct / 100 / 365;
  const n = clamp(Math.round(termDays), 30, 3650);
  const daily = round2((a * r) / (1 - Math.pow(1 + r, -n)));
  const loan: LoanState = { id: nextId(e, 'pret'), principal: a, remaining: a, ratePct: offer.ratePct, dailyPayment: daily, startDay: today(w), termDays: n };
  e.loans.push(loan);
  w.player.money = round2(w.player.money + a);
  pushEvent(w, {
    type: 'systeme',
    title: `Prêt de ${a} €`,
    text: `${n} jours à ${offer.ratePct} % par an : ${daily.toFixed(2)} € prélevés chaque jour.`,
    causes: [{ facteur: 'emprunt', seuil: `${a} €`, poids: 2 }],
  });
  return ok(`Prêt accordé : ${a} €, remboursement ${daily.toFixed(2)} €/jour.`);
}

export function repayLoan(w: WorldState, loanId: string, amount: number): EconomyResult {
  const e = ensureEconomy(w);
  const l = e.loans.find((x) => x.id === loanId);
  if (!l) return ko('Prêt inconnu.');
  const a = round2(Math.min(amount, l.remaining, w.player.money));
  if (a <= 0) return ko('Rien à rembourser ou pas assez d’argent.');
  w.player.money = round2(w.player.money - a);
  l.remaining = round2(l.remaining - a);
  if (l.remaining <= 0.01) e.loans = e.loans.filter((x) => x !== l);
  return ok(`${a.toFixed(2)} € remboursés.`);
}

// ---------- Marketing ----------

export const MARKETING_CHANNELS: Readonly<Record<string, { name: string; costPerDay: number; boost: number; minDays: number }>> = {
  affiches: { name: 'Affiches dans le quartier', costPerDay: 6, boost: 0.15, minDays: 3 },
  flyers: { name: 'Flyers à la sortie du collège', costPerDay: 9, boost: 0.22, minDays: 2 },
  radio: { name: 'Annonce sur Radio Taret', costPerDay: 35, boost: 0.45, minDays: 5 },
};

export function runMarketing(w: WorldState, bizId: string, channel: string, days: number): EconomyResult {
  const b = getBusiness(w, bizId);
  const c = MARKETING_CHANNELS[channel];
  if (!b || !c) return ko('Commerce ou campagne inconnus.');
  const d = Math.max(c.minDays, Math.round(days));
  const cost = round2(c.costPerDay * d);
  if (b.cash < cost) return ko(`La caisse doit contenir ${cost.toFixed(2)} €.`);
  post(b, w, `Publicité : ${c.name}`, -cost);
  b.today.other = round2(b.today.other + cost);
  b.marketing[channel] = (b.marketing[channel] ?? 0) + d;
  return ok(`${c.name} : ${d} jours (${cost.toFixed(2)} €).`);
}

// ---------- Simulation : heures et jours ----------

/** Fréquentation relative selon l'heure (1 = moyenne). */
export function hourCurve(hour: number, weekend: boolean): number {
  const base = [0, 0, 0, 0, 0, 0, 0.1, 0.35, 0.6, 0.65, 0.75, 0.95, 1.25, 1.05, 0.75, 0.75, 0.95, 1.25, 1.35, 1.05, 0.65, 0.4, 0.2, 0.1];
  const v = base[Math.floor(hour) % 24] ?? 0;
  return weekend && hour >= 10 && hour <= 18 ? v * 1.2 : v;
}

function seasonFactor(p: ProductDef, month: number): number {
  return p.seasonality?.[month - 1] ?? 1;
}

/** Personnel présent : le joueur (s'il est à moins de 4 tuiles de la porte et éveillé) + employés. */
export function staffCapacity(w: WorldState, b: BusinessState): { staff: number; perHour: number; playerPresent: boolean } {
  const e = ensureEconomy(w);
  const door = businessDoor(b);
  const playerPresent = !w.player.asleep && near(w, door, 4);
  let perHour = playerPresent ? 24 : 0;
  let staff = playerPresent ? 1 : 0;
  for (const id of b.employeeIds) {
    const emp = e.employees[id];
    if (!emp) continue;
    staff += 1;
    perHour += 16 + emp.skill / 5;
  }
  return { staff, perHour, playerPresent };
}

/**
 * Clients présents à un instant dans la boutique : moyenne horaire des clients du jour depuis
 * l'ouverture (fermé, hors horaires ou sans personnel : personne).
 */
export function customersInStore(w: WorldState, b: BusinessState): number {
  const hour = Math.floor(minutesOfDay(w.time.tick) / 60);
  if (!b.open || hour < b.hours[0] || hour >= b.hours[1]) return 0;
  if (staffCapacity(w, b).staff === 0) return 0;
  const hoursOpen = Math.max(1, hour - b.hours[0]);
  // Un client reste une dizaine de minutes : environ un sixième des clients d'une heure.
  return Math.max(b.today.customers > 0 ? 1 : 0, Math.min(8, Math.round(b.today.customers / hoursOpen / 2)));
}

/** Clients servis par heure selon l'équipement (caisses, comptoirs, machines). */
export function equipmentCapacity(b: BusinessState): number {
  const u = UNIT_BY_ID[b.unitId];
  if (u?.buildingId.startsWith('etal_')) return STALL_IMPLICIT.servicePerHour;
  return b.furniture.reduce((s, f) => s + (FURNITURE_BY_ID[f]?.servicePerHour ?? 0), 0);
}

export function appeal(b: BusinessState): number {
  const u = UNIT_BY_ID[b.unitId];
  const furnitureAppeal = u?.buildingId.startsWith('etal_')
    ? STALL_IMPLICIT.appeal
    : b.furniture.reduce((s, f) => s + (FURNITURE_BY_ID[f]?.appeal ?? 0), 0);
  const marketing = Object.entries(b.marketing).reduce((s, [ch, d]) => s + (d > 0 ? (MARKETING_CHANNELS[ch]?.boost ?? 0) : 0), 0);
  return clamp(0.6 + Math.min(furnitureAppeal, 12) / 15 + (b.reputation - 50) / 100 + marketing, 0.2, 3);
}

/** Indice de prix moyen (1 = prix « juste ») sur les produits en rayon. */
export function priceIndex(b: BusinessState): number {
  const ids = Object.keys(b.stock).filter((id) => stockUnits(b, id) > 0);
  if (ids.length === 0) return 1;
  return ids.reduce((s, id) => s + priceOf(b, id) / (PRODUCT_BY_ID[id]?.retailRef ?? 1), 0) / ids.length;
}

/**
 * Concurrence de proximité : chaque commerce concurrent à moins de 80 m qui vend au moins une
 * catégorie commune prend une part des clients (selon sa force). Des prix plus bas que le
 * marché (indice < 0,95) atténuent cette pression.
 */
export function competitionFactor(b: BusinessState): number {
  const t = BUSINESS_TYPE_BY_ID[b.typeId];
  const u = UNIT_BY_ID[b.unitId];
  if (!t || !u) return 1;
  let f = 1;
  for (const c of COMPETITORS) {
    const cu = UNIT_BY_ID[c.unitId];
    if (!cu || !c.categories.some((cat) => t.productCategories.includes(cat))) continue;
    if (Math.hypot(cu.door.x - u.door.x, cu.door.y - u.door.y) > 80) continue;
    f *= 1 - 0.12 * c.strength;
  }
  if (priceIndex(b) < 0.95) f = Math.sqrt(f);
  return clamp(f, 0.45, 1);
}

/** Commerces concurrents qui pèsent sur un commerce du joueur (pour l'interface). */
export function nearbyCompetitors(b: BusinessState): string[] {
  const t = BUSINESS_TYPE_BY_ID[b.typeId];
  const u = UNIT_BY_ID[b.unitId];
  if (!t || !u) return [];
  return COMPETITORS.filter((c) => {
    const cu = UNIT_BY_ID[c.unitId];
    return !!cu && c.categories.some((cat) => t.productCategories.includes(cat)) && Math.hypot(cu.door.x - u.door.x, cu.door.y - u.door.y) <= 80;
  }).map((c) => c.shopName);
}

interface HourOutcome { passersby: number; visitors: number; regularVisits: number; customers: number; lost: number; units: number; revenue: number; cogs: number }

/** Part des habitués qui passent dans la journée. */
export const REGULAR_DAILY_VISIT = 0.4;
/** Plafond d'habitués d'un commerce (un quartier n'est pas infini). */
export const REGULARS_CAP = 400;

/**
 * Visites d'habitués pendant une heure d'ouverture : la fidélité ne dépend pas des passants
 * ni de la concurrence, mais des prix pratiqués et un peu de la météo.
 */
export function regularVisitsAt(w: WorldState, b: BusinessState, hour: number): number {
  const regs = b.regulars ?? 0;
  if (regs <= 0) return 0;
  const open = Math.max(1, b.hours[1] - b.hours[0]);
  const pi = priceIndex(b);
  const priceMood = pi <= 1.15 ? 1 : pi <= 1.4 ? 0.7 : 0.4;
  const meteo = w.district.meteo === 'pluie' ? 0.85 : 1;
  const expected = (regs * REGULAR_DAILY_VISIT / open) * priceMood * meteo;
  return Math.floor(expected + econRand(w, 'habitues', today(w), hour, b.id));
}

/**
 * Clôture du jour : les clients bien servis à prix justes deviennent des habitués ;
 * ruptures, prix abusifs et fermetures en font partir.
 */
export function updateRegulars(b: BusinessState, stats: DayStats, pi: number): void {
  const regs = b.regulars ?? 0;
  const fairness = pi <= 1.15 ? 1 : pi <= 1.4 ? 0.4 : 0;
  const gain = stats.customers * 0.03 * fairness * clamp(b.reputation / 60, 0.3, 1.6);
  const lostRatio = stats.lost / Math.max(1, stats.customers + stats.lost);
  const churn = 0.03 + lostRatio * 0.12 + (pi > 1.4 ? 0.05 : 0) + (b.open ? 0 : 0.04);
  b.regulars = round2(clamp(regs + gain - regs * churn, 0, REGULARS_CAP));
}

/** Une heure d'ouverture : passants → visiteurs → clients servis → paniers. */
export function simulateHour(w: WorldState, b: BusinessState, hour: number): HourOutcome {
  const u = UNIT_BY_ID[b.unitId]!;
  const t = BUSINESS_TYPE_BY_ID[b.typeId]!;
  const day = today(w);
  const date = dateOf(day);
  const weekend = date.weekday === 0 || date.weekday === 6;
  const meteo = w.district.meteo === 'pluie' ? 0.6 : w.district.meteo === 'nuages' ? 0.9 : 1.05;
  const noise = 0.85 + econRand(w, 'h', day, hour, b.id) * 0.3;
  const passersby = Math.round(u.footTraffic * hourCurve(hour, weekend) * meteo * noise);
  const inStock = Object.keys(b.stock).filter((id) => stockUnits(b, id) > 0);
  const stall = u.buildingId.startsWith('etal_');
  const variety = Math.sqrt(Math.min(1, inStock.length / (stall ? 3 : 8)));
  const pi = priceIndex(b);
  const priceFactor = clamp(Math.pow(pi, -1.8), 0.1, 2.2);
  // La concurrence du Drive HyperVal pèse sur l'épicerie et les produits de base.
  const rival = w.rivals?.drive_hyper;
  const rivalPressure = rival && (t.productCategories.includes('epicerie') || t.productCategories.includes('boisson'))
    ? clamp(1 - (rival.marketShare - 50) / 200, 0.7, 1.1) : 1;
  // Conjoncture : la chronologie du monde (src/simulation/world_timeline.ts) module la demande.
  const conj = t.productCategories.reduce((s, c) => s + timelineDemand(w, c), 0) / Math.max(1, t.productCategories.length);
  const regularVisits = regularVisitsAt(w, b, hour);
  const visitors = Math.round(passersby * t.baseConversion * appeal(b) * priceFactor * variety * rivalPressure * competitionFactor(b) * conj * laminoirDemand(w, b.unitId) * sectorDemand(w, sectorOfBusinessType(t), b.id)) + regularVisits;
  const staff = staffCapacity(w, b);
  const capacity = Math.floor(Math.min(staff.perHour, equipmentCapacity(b)));
  const served = Math.min(visitors, capacity);
  let lost = visitors - served;
  let units = 0;
  let revenue = 0;
  let cogs = 0;
  let customers = 0;
  for (let c = 0; c < served; c++) {
    const want = Math.max(1, Math.round(t.basketSize * (0.6 + econRand(w, 'b', day, hour, b.id, c) * 0.8)));
    let bought = 0;
    for (let k = 0; k < want; k++) {
      const avail = Object.keys(b.stock).filter((id) => stockUnits(b, id) > 0);
      if (avail.length === 0) break;
      // Choix pondéré : demande saisonnière × attractivité du prix.
      const weights = avail.map((id) => {
        const p = PRODUCT_BY_ID[id]!;
        return seasonFactor(p, date.m) * clamp(Math.pow(priceOf(b, id) / p.retailRef, -2), 0.05, 3);
      });
      const total = weights.reduce((s, x) => s + x, 0);
      let r = econRand(w, 'p', day, hour, b.id, c, k) * total;
      let pick = avail[0]!;
      for (let i = 0; i < avail.length; i++) { r -= weights[i]!; if (r <= 0) { pick = avail[i]!; break; } }
      const lots = b.stock[pick]!;
      const lot = lots[0]!;
      lot.qty -= 1;
      cogs += lot.unitCost;
      if (lot.qty <= 0) lots.shift();
      revenue += priceOf(b, pick);
      units += 1;
      bought += 1;
    }
    if (bought > 0) customers += 1; else lost += 1;
  }
  return { passersby, visitors, regularVisits, customers, lost, units, revenue: round2(revenue), cogs: round2(cogs) };
}

function isOpenAt(b: BusinessState, hour: number): boolean {
  return b.open && hour >= b.hours[0] && hour < b.hours[1];
}

/** Appelé à chaque tick : traite l'heure écoulée et, à minuit, la clôture du jour. */
export function economyTick(w: WorldState, prevTick: number): Notification[] {
  const e = w.economy;
  if (!e) return [];
  const out: Notification[] = [];
  const prevMin = minutesOfDay(prevTick);
  const min = minutesOfDay(w.time.tick);
  const hourChanged = Math.floor(prevMin / 60) !== Math.floor(min / 60) || dayIndexOf(prevTick) !== dayIndexOf(w.time.tick);
  if (hourChanged) {
    const hour = Math.floor(prevMin / 60); // l'heure qui vient de s'écouler
    for (const b of Object.values(e.businesses)) {
      if (!isOpenAt(b, hour)) continue;
      const r = simulateHour(w, b, hour);
      b.today.passersby += r.passersby;
      b.today.visitors += r.visitors;
      b.today.regularVisits = (b.today.regularVisits ?? 0) + r.regularVisits;
      b.today.customers += r.customers;
      b.today.lost += r.lost;
      b.today.unitsSold += r.units;
      b.today.revenue = round2(b.today.revenue + r.revenue);
      b.today.costOfGoods = round2(b.today.costOfGoods + r.cogs);
      if (r.revenue > 0) post(b, w, `Ventes ${hour} h`, r.revenue);
      if (r.units > 0) {
        const stall = UNIT_BY_ID[b.unitId]?.buildingId.startsWith('etal_');
        w.flags[stall ? 'ventesEtal' : 'ventesCommerce'] = (w.flags[stall ? 'ventesEtal' : 'ventesCommerce'] ?? 0) + r.units;
      }
      // Salaires de l'heure.
      for (const id of b.employeeIds) {
        const emp = e.employees[id];
        if (!emp) continue;
        if (b.cash >= emp.wage) {
          post(b, w, `Salaire ${emp.name}`, -emp.wage);
          b.today.wages = round2(b.today.wages + emp.wage);
        } else {
          emp.satisfaction = clamp(emp.satisfaction - 8, 0, 100);
        }
      }
      // Réputation : prix justes et rayons pleins satisfont ; files d'attente et ruptures déçoivent.
      const pi = priceIndex(b);
      const served = r.customers;
      const disappointed = r.lost;
      const fairness = pi <= 1.15 ? 1 : pi <= 1.4 ? 0 : -1;
      b.reputation = clamp(b.reputation + (served > 0 ? 0.15 * fairness + 0.05 : 0) - Math.min(1.2, disappointed * 0.04), 0, 100);
    }
  }
  if (dayIndexOf(prevTick) !== dayIndexOf(w.time.tick)) out.push(...economyDay(w, dayIndexOf(prevTick)));
  return out;
}

/** Clôture quotidienne : loyers, prêts, péremptions, livraisons, moral des employés, historique. */
export function economyDay(w: WorldState, closedDay: number): Notification[] {
  const e = ensureEconomy(w);
  const out: Notification[] = [];
  const newDay = closedDay + 1;
  // Livraisons du jour (avec retards selon la fiabilité du fournisseur).
  for (const o of e.orders) {
    if (o.status !== 'en_livraison' || o.arrivalDay > newDay) continue;
    const g = WHOLESALER_BY_ID[o.wholesalerId];
    if (g && econRand(w, 'livraison', o.id, newDay) > g.reliability && newDay - o.arrivalDay < 2) {
      out.push(notify('alerte', `${g.name} : livraison retardée d’un jour.`));
      continue;
    }
    const b = e.businesses[o.businessId];
    if (b) {
      let refused = 0;
      for (const l of o.lines) {
        const q = Math.min(l.qty, freeSpaceFor(b, l.productId));
        if (q > 0) addLot(b, l.productId, q, l.unitCost, newDay);
        refused += l.qty - q;
      }
      out.push(notify('info', `${b.name} : livraison reçue${refused > 0 ? ` (${refused} unités refusées faute de place)` : ''}.`));
    }
    o.status = 'livree';
  }
  e.orders = e.orders.filter((o) => o.status !== 'livree');

  for (const b of Object.values(e.businesses)) {
    const lease = e.leases[b.unitId];
    // Loyer.
    if (lease) {
      if (b.cash >= lease.rentPerDay) {
        post(b, w, 'Loyer', -lease.rentPerDay);
        b.today.rent = round2(b.today.rent + lease.rentPerDay);
        lease.arrears = 0;
      } else if (w.player.money >= lease.rentPerDay) {
        // Le propriétaire paie de sa poche si la caisse est vide.
        w.player.money = round2(w.player.money - lease.rentPerDay);
        b.today.rent = round2(b.today.rent + lease.rentPerDay);
        lease.arrears = 0;
        out.push(notify('alerte', `${b.name} : caisse vide, loyer payé de ta poche.`));
      } else {
        lease.arrears += 1;
        out.push(notify('alerte', `${b.name} : loyer impayé (${lease.arrears}/${EVICTION_ARREARS}).`));
      }
    }
    // Péremption.
    let spoiled = 0;
    for (const [pid, lots] of Object.entries(b.stock)) {
      const base = PRODUCT_BY_ID[pid]?.shelfLifeDays;
      if (base === null || base === undefined) continue;
      const life = base + travelShelfBonus(w);
      const keep = lots.filter((l) => newDay - l.receivedDay < life);
      spoiled += lots.filter((l) => newDay - l.receivedDay >= life).reduce((s, l) => s + l.qty, 0);
      b.stock[pid] = keep;
    }
    if (spoiled > 0) out.push(notify('alerte', `${b.name} : ${spoiled} articles périmés jetés.`));
    // Moral des employés : salaire par rapport au marché.
    for (const id of [...b.employeeIds]) {
      const emp = e.employees[id];
      if (!emp) continue;
      const market = 10.15 + emp.skill / 12;
      emp.satisfaction = clamp(emp.satisfaction + (emp.wage >= market ? 1 : -2), 0, 100);
      if (emp.satisfaction < 25 && econRand(w, 'demission', id, newDay) < 0.35) {
        out.push(notify('alerte', `${emp.name} démissionne de ${b.name} (moral au plus bas).`));
        fire(w, id);
      }
    }
    // Marketing.
    for (const ch of Object.keys(b.marketing)) {
      b.marketing[ch] = Math.max(0, (b.marketing[ch] ?? 0) - 1);
      if (b.marketing[ch] === 0) delete b.marketing[ch];
    }
    // Habitués : ils se gagnent un client satisfait à la fois.
    const regsBefore = Math.floor(b.regulars ?? 0);
    updateRegulars(b, b.today, priceIndex(b));
    const regsAfter = Math.floor(b.regulars);
    for (const step of [25, 50, 100, 200]) {
      if (regsBefore < step && regsAfter >= step) {
        out.push(notify('journal', `🤝 ${b.name} compte ${step} habitués.`));
        pushEvent(w, {
          type: 'consequence',
          title: `${b.name} : ${step} habitués`,
          text: `Des gens du quartier reviennent chez toi sans y penser. Ils viennent même les jours de pluie, même quand un concurrent ouvre à côté.`,
          causes: [
            { facteur: 'réputation de la boutique', seuil: `${Math.round(b.reputation)}/100`, poids: 3 },
            { facteur: 'indice de prix', seuil: priceIndex(b).toFixed(2), poids: 2 },
          ],
          once: `habitues:${b.id}:${step}`,
        });
      }
    }
    // Réputation qui revient lentement vers 50.
    b.reputation = round2(b.reputation + (50 - b.reputation) * 0.02);
    // Historique.
    if (b.today.revenue > 0 || b.open) {
      b.history.push({ ...b.today, day: closedDay });
      if (b.history.length > HISTORY_DAYS) b.history.splice(0, b.history.length - HISTORY_DAYS);
      const margin = round2(b.today.revenue - b.today.costOfGoods - b.today.wages - b.today.rent - b.today.other);
      if (b.today.customers > 0) {
        pushEvent(w, {
          type: 'consequence',
          title: `Bilan du jour — ${b.name}`,
          text: `${b.today.customers} clients, ${b.today.unitsSold} articles, CA ${b.today.revenue.toFixed(2)} €, résultat ${margin >= 0 ? '+' : ''}${margin.toFixed(2)} €.`,
          causes: [
            { facteur: 'passants devant la vitrine', seuil: `${b.today.passersby}`, poids: 2 },
            { facteur: 'clients perdus (attente, rupture, prix)', seuil: `${b.today.lost}`, poids: b.today.lost > b.today.customers ? 3 : 1 },
            { facteur: 'indice de prix', seuil: priceIndex(b).toFixed(2), poids: 2 },
          ],
        });
      }
    }
    b.today = emptyStats(newDay);
  }
  // Expulsions.
  for (const lease of Object.values(e.leases)) {
    if (lease.arrears >= EVICTION_ARREARS) out.push(notify('alerte', endLease(w, lease.unitId, 'expulsion').message));
  }
  // Prêts.
  for (const l of [...e.loans]) {
    const pay = Math.min(l.dailyPayment, round2(l.remaining * (1 + l.ratePct / 100 / 365)));
    const interest = round2(l.remaining * (l.ratePct / 100 / 365));
    if (w.player.money >= pay) {
      w.player.money = round2(w.player.money - pay);
      l.remaining = round2(Math.max(0, l.remaining + interest - pay));
    } else {
      l.remaining = round2(l.remaining + interest + 2); // frais de retard
      w.player.reputation = clamp(w.player.reputation - 1, 0, 100);
      out.push(notify('alerte', `Échéance de prêt impayée : ${pay.toFixed(2)} € manquants (frais de 2 €).`));
    }
    if (l.remaining <= 0.01) {
      e.loans = e.loans.filter((x) => x !== l);
      out.push(notify('info', 'Prêt entièrement remboursé.'));
    }
  }
  // Loyers perçus des locataires.
  for (const p of Object.values(e.owned ?? {})) {
    if (!p.tenant) continue;
    w.player.money = round2(w.player.money + p.tenant.rentPerDay);
    w.flags['loyersPercus'] = round2((w.flags['loyersPercus'] ?? 0) + p.tenant.rentPerDay);
  }
  refreshJobMarket(w);
  return out;
}

/** Résumé utile à l'interface : valeur nette, nombre de commerces, CA des 7 derniers jours. */
export function economySummary(w: WorldState): { businesses: number; cash: number; debt: number; revenue7: number; profit7: number } {
  const e = w.economy;
  if (!e) return { businesses: 0, cash: 0, debt: 0, revenue7: 0, profit7: 0 };
  const bs = Object.values(e.businesses);
  const last7 = bs.flatMap((b) => b.history.slice(-7));
  return {
    businesses: bs.length,
    cash: round2(bs.reduce((s, b) => s + b.cash, 0)),
    debt: round2(e.loans.reduce((s, l) => s + l.remaining, 0)),
    revenue7: round2(last7.reduce((s, d) => s + d.revenue, 0)),
    profit7: round2(last7.reduce((s, d) => s + d.revenue - d.costOfGoods - d.wages - d.rent - d.other, 0)),
  };
}
