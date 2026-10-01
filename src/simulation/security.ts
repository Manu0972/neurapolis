/**
 * Contrat de Sécurité (Hobbes — contrat M6 §3). Proposé après un incident
 * (flags.incidents ≥ 1) par Hobbes actif ou hostile. Accepter : rendement
 * +20 % et amitié du groupe −2/semaine ; sortie uniquement si vote unanime
 * (chaque membre vote selon l'amitié) ET amitié ≥ 60. Données : SECURITY_CONFIG
 * (src/data/project.ts).
 */
import type { Notification, WorldState } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { SECURITY_CONFIG } from '../data/project';
import { NPC_BY_ID } from '../data/npcs';
import { applyRelation } from './relations';
import { notify, pushEvent } from './events';

export interface ContractResult { ok: boolean; message: string }

/** Rendement du stand : +20 % tant que le contrat est actif. */
export const securityYieldFactor = (w: WorldState): number =>
  w.council.contratSecurite?.active ? 1 + SECURITY_CONFIG.yieldBonus : 1;

/** Une proposition de contrat attend la réponse du joueur. */
export const securityPending = (w: WorldState): boolean => {
  const c = w.council.contratSecurite;
  return !!c && !c.active && c.proposedDay !== undefined;
};

/**
 * Boucle quotidienne (councilDay) : après un incident, Hobbes propose le
 * contrat — une fois par incident nouveau (un refus n'empêche pas le suivant).
 */
export function maybeProposeContract(w: WorldState, out: Notification[]): void {
  const st = w.council.ghosts['hobbes'];
  if (!st || (st.status !== 'actif' && st.status !== 'hostile')) return;
  if (w.council.contratSecurite) return;
  const incidents = w.flags['incidents'] ?? 0;
  if (incidents < 1) return;
  if ((w.flags['__contratRefusedAtIncidents'] ?? 0) >= incidents) return;
  w.council.contratSecurite = { active: false, proposedDay: dayIndexOf(w.time.tick) };
  pushEvent(w, {
    type: 'conseil',
    title: 'Hobbes propose le Contrat de Sécurité',
    text: '« Retiens ceci : sans autorité commune, un nouvel incident finira par arriver. Signe le contrat — une règle claire, une sanction tenue, et le stand rend plus. En échange, tes amis te regarderont autrement. »',
    causes: [
      { facteur: 'incidents au stand', seuil: '1', poids: 3 },
      { facteur: 'Hobbes, voix écoutée', poids: 1 },
    ],
  });
  out.push(notify('fantome', 'Hobbes te tend le Contrat de Sécurité.', 'hobbes'));
}

/** Choix du joueur sur la proposition en attente. */
export function contractChoose(w: WorldState, accept: boolean): ContractResult {
  const c = w.council.contratSecurite;
  if (!c || c.active || c.proposedDay === undefined) {
    return { ok: false, message: 'Aucune proposition de contrat en attente.' };
  }
  if (accept) {
    w.council.contratSecurite = { active: true, sinceDay: dayIndexOf(w.time.tick) };
    pushEvent(w, {
      type: 'consequence',
      title: 'Contrat de Sécurité signé',
      text: `Rendement du stand +20 %. En contrepartie, l’amitié du groupe baisse de ${SECURITY_CONFIG.weeklyAmitieCost} par semaine. Sortie : uniquement par vote unanime et amitié ≥ ${SECURITY_CONFIG.exitAmitieMin}.`,
      causes: [
        { facteur: 'incidents au stand', seuil: '1', poids: 2 },
        { facteur: 'choix : accepter le contrat de Hobbes', poids: 3 },
      ],
    });
    return { ok: true, message: 'Contrat signé : rendement +20 %, amitié du groupe −2/semaine.' };
  }
  w.council.contratSecurite = null;
  w.flags['__contratRefusedAtIncidents'] = w.flags['incidents'] ?? 0;
  pushEvent(w, {
    type: 'conseil',
    title: 'Contrat de Sécurité refusé',
    text: 'Tu refuses. Hobbes range son parchemin sans un mot — il le ressortira au prochain incident.',
    causes: [{ facteur: 'choix : refuser le contrat', poids: 2 }],
  });
  return { ok: true, message: 'Contrat refusé. Hobbes attendra le prochain incident.' };
}

/** Sortie du contrat : vote unanime (chaque membre vote selon l'amitié) et amitié ≥ 60 partout. */
export function exitSecurityContract(w: WorldState): ContractResult {
  const c = w.council.contratSecurite;
  if (!c?.active) return { ok: false, message: 'Aucun contrat actif.' };
  const members = w.project?.members ?? [];
  for (const m of members) {
    const amitie = w.player.relations[m]?.amitie ?? 0;
    if (amitie < SECURITY_CONFIG.exitAmitieMin) {
      const name = NPC_BY_ID[m]?.name ?? m;
      return {
        ok: false,
        message: `Le vote n’est pas unanime : ${name} s’y oppose (amitié ${amitie}/${SECURITY_CONFIG.exitAmitieMin}).`,
      };
    }
  }
  w.council.contratSecurite = null;
  for (const m of members) applyRelation(w, m, { confiance: 3 });
  pushEvent(w, {
    type: 'consequence',
    title: 'Fin du Contrat de Sécurité',
    text: 'Le vote est unanime : le contrat tombe. L’équipe respire — la confiance monte (+3 partout).',
    causes: [
      { facteur: 'vote unanime de l’équipe', poids: 2 },
      { facteur: 'amitié du groupe', seuil: String(SECURITY_CONFIG.exitAmitieMin), poids: 3 },
    ],
  });
  return { ok: true, message: 'Contrat levé d’un vote unanime. Confiance +3 pour l’équipe.' };
}

/** Coût hebdomadaire : amitié du groupe −2 tant que le contrat tient (fin de semaine). */
export function weeklySecurityCost(w: WorldState, out: Notification[]): void {
  const c = w.council.contratSecurite;
  if (!c?.active) return;
  const p = w.project;
  if (!p?.active || p.members.length === 0) return;
  for (const m of p.members) applyRelation(w, m, { amitie: -SECURITY_CONFIG.weeklyAmitieCost });
  pushEvent(w, {
    type: 'consequence',
    title: 'Le Contrat de Sécurité pèse sur l’amitié',
    text: `La règle tient, la sanction veille — et les amis s’éloignent (amitié −${SECURITY_CONFIG.weeklyAmitieCost}).`,
    causes: [
      { facteur: 'Contrat de Sécurité actif', poids: 3 },
      { facteur: 'fin de semaine', poids: 1 },
    ],
  });
  out.push(notify('journal', `Contrat de Sécurité : amitié du groupe −${SECURITY_CONFIG.weeklyAmitieCost}.`));
}
