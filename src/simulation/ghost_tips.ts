/**
 * Conseils de situation : chaque penseur lit l'état réel du joueur avec sa grille et dit ce
 * qu'il en pense, chiffres à l'appui. Lecture seule (aucune écriture dans le monde).
 * Sert la barre des fantômes (présentation) : « demander son avis » et les envies de parler.
 */
import type { WorldState } from '../core/types';
import { IDEA_BY_ID } from '../data/ascension/ideas';

export interface GhostTip {
  ghost: string;
  text: string;
  /** 1 = remarque, 2 = conseil utile, 3 = urgence. */
  weight: 1 | 2 | 3;
}

interface Facts {
  money: number;
  stress: number;
  fatigue: number;
  /** Entreprise de l'Ascension la plus en difficulté. */
  worstVenture?: { name: string; profit: number; unsold: number; missed: number; redDays: number; level: number };
  bestVenture?: { name: string; profit: number };
  ventureCount: number;
  /** Commerce physique avec le plus de clients perdus hier. */
  lossShop?: { name: string; lost: number; customers: number };
  shopCount: number;
  employeesUnhappy: number;
  employees: number;
  debt: number;
  absences: number;
  average: number;
  contacts: number;
  concepts: number;
}

const eur = (v: number): string => `${Math.round(v).toLocaleString('fr-FR')} €`;

function facts(w: WorldState): Facts {
  const runs = Object.values(w.ascension?.ventures ?? {}).filter((r) => !r.closed && r.last);
  const named = runs.map((r) => ({ r, name: IDEA_BY_ID[r.ideaId]?.name ?? r.ideaId }));
  const worst = named.slice().sort((a, b) => (a.r.last!.profit - b.r.last!.profit))[0];
  const best = named.slice().sort((a, b) => (b.r.last!.profit - a.r.last!.profit))[0];
  const shops = Object.values(w.economy?.businesses ?? {});
  const lastDays = shops.map((b) => ({ b, h: b.history[b.history.length - 1] })).filter((x) => x.h);
  const loss = lastDays.sort((a, b) => b.h!.lost - a.h!.lost)[0];
  // Seulement les personnes embauchées (le marché de l'emploi garde aussi des candidats).
  const emps = Object.values(w.economy?.employees ?? {}).filter((e) => e.businessId !== null);
  return {
    money: w.player.money,
    stress: w.player.needs.stress,
    fatigue: w.player.needs.fatigue,
    worstVenture: worst ? { name: worst.name, profit: worst.r.last!.profit, unsold: worst.r.last!.unsold, missed: worst.r.last!.missed, redDays: worst.r.redDays, level: worst.r.level } : undefined,
    bestVenture: best ? { name: best.name, profit: best.r.last!.profit } : undefined,
    ventureCount: runs.length,
    lossShop: loss ? { name: loss.b.name, lost: loss.h!.lost, customers: loss.h!.customers } : undefined,
    shopCount: shops.length,
    employeesUnhappy: emps.filter((e) => e.satisfaction < 40).length,
    employees: emps.length,
    debt: (w.economy?.loans ?? []).reduce((s, l) => s + l.remaining, 0) + runs.reduce((s, x) => s + Object.values(x.universes).reduce((t, u) => t + (u?.loan ?? 0), 0), 0),
    absences: w.schoolLife?.skippedClassesCount ?? 0,
    average: w.schoolLife?.academicAverage ?? 14,
    contacts: Object.keys(w.ascension?.contacts ?? {}).length,
    concepts: Object.keys(w.ascension?.concepts ?? {}).length,
  };
}

type Lens = (f: Facts) => GhostTip | null;

const tip = (ghost: string, weight: GhostTip['weight'], text: string): GhostTip => ({ ghost, weight, text });

/** Grille de lecture de chaque penseur. */
const LENSES: Record<string, Lens> = {
  smith: (f) => f.lossShop && f.lossShop.lost > f.lossShop.customers * 0.3
    ? tip('smith', 2, `Mon ami, ${f.lossShop.lost} clients sont repartis de « ${f.lossShop.name} » sans rien acheter hier. Le prix ou le rayon parle trop fort : écoute-le.`)
    : f.ventureCount === 0 && f.shopCount === 0
      ? tip('smith', 2, 'Un échange, un seul, et tu comprendras plus qu’avec cent livres. Ouvre l’application Ascension : la cour du collège est déjà un marché.')
      : tip('smith', 1, 'Le prix de marché danse autour du prix naturel. Observe tes concurrents avant de bouger les tiens.'),
  marx: (f) => f.employeesUnhappy > 0
    ? tip('marx', 3, `Camarade, ${f.employeesUnhappy} de tes ${f.employees} employés sont à bout. La valeur qu’ils produisent, où va-t-elle ?`)
    : f.employees > 0 ? tip('marx', 1, `Tu emploies ${f.employees} personne(s). Regarde la différence entre ce qu’elles produisent et ce que tu leur verses : c’est là que tout se joue.`) : null,
  ohno: (f) => f.worstVenture && f.worstVenture.unsold > 0
    ? tip('ohno', 2, `« ${f.worstVenture.name} » a jeté ${eur(f.worstVenture.unsold)} d’invendus hier. Le stock cache les problèmes : produis au plus juste.`)
    : f.worstVenture && f.worstVenture.missed > 0
      ? tip('ohno', 2, `« ${f.worstVenture.name} » a manqué ${eur(f.worstVenture.missed)} de ventes : le flux tendu exige des fournisseurs proches et rapides.`)
      : null,
  ford: (f) => f.bestVenture && f.bestVenture.profit > 0
    ? tip('ford', 2, `« ${f.bestVenture.name} » gagne ${eur(f.bestVenture.profit)} par jour. Investis, produis plus : chaque unité te coûtera moins cher.`)
    : null,
  keynes: (f) => f.worstVenture && f.worstVenture.profit < 0 && f.money > 0
    ? tip('keynes', 2, `« ${f.worstVenture.name} » perd ${eur(-f.worstVenture.profit)} par jour. Ne coupe pas tout dans la panique : parfois il faut dépenser pour que la demande revienne.`)
    : f.money > 500 ? tip('keynes', 1, `${eur(f.money)} qui dorment sur ton compte ne servent personne, mon cher. L’argent doit circuler.`) : null,
  hayek: (f) => f.debt > 0
    ? tip('hayek', f.debt > f.money * 3 ? 3 : 2, `Vous devez ${eur(f.debt)}. Chaque jour d’intérêts parie sur un avenir que personne ne connaît. Remboursez avant de grandir.`)
    : null,
  taylor: (f) => f.shopCount > 0 ? tip('taylor', 1, 'As-tu chronométré le temps de passage en caisse ? Une seconde gagnée par client, c’est une file d’attente en moins.') : null,
  dejours: (f) => f.stress > 65 || f.fatigue > 75
    ? tip('dejours', 3, `Stress ${Math.round(f.stress)}, fatigue ${Math.round(f.fatigue)}. Le travail réel te coûte plus que tu ne le vois. Repose-toi avant la prochaine décision.`)
    : null,
  ricardo: (f) => f.ventureCount >= 2 ? tip('ricardo', 1, 'Tu fais plusieurs choses à la fois. Dans laquelle es-tu relativement le meilleur ? Spécialise-toi là, échange le reste.') : null,
  raworth: (f) => f.stress > 50 && f.ventureCount + f.shopCount >= 2
    ? tip('raworth', 2, 'Grandir n’est pas un but en soi. Ton plancher, c’est ta santé et celle de ton équipe : tu t’en approches.')
    : null,
  ostrom: (f) => f.contacts < 2
    ? tip('ostrom', 2, `Tu n’as que ${f.contacts} connexion(s). Seul, on porte tout ; à plusieurs, on écrit les règles ensemble. Va voir les gens du quartier.`)
    : null,
  schumpeter: (f) => f.ventureCount > 0 && f.concepts >= 2 ? tip('schumpeter', 1, 'Ton idée d’hier est déjà l’habitude d’aujourd’hui. Qu’est-ce qui la remplacera ? Mieux vaut que ce soit toi.') : null,
  bourdieu: (f) => f.absences >= 2
    ? tip('bourdieu', 2, `${f.absences} cours séchés. Le diplôme est un capital comme un autre, et ceux qui en ont n’aiment pas qu’on s’en passe.`)
    : null,
  rosa: (f) => f.fatigue > 60 ? tip('rosa', 2, 'Tout accélère, et toi avec. Quand as-tu pris le temps de résonner avec quelque chose, pour la dernière fois ?') : null,
  weber: (f) => f.average < 11 ? tip('weber', 2, `Moyenne ${f.average}/20. L’éthique du travail ne se divise pas : ce que tu négliges en classe, tu le négligeras ailleurs.`) : null,
};

/** Ce que ce penseur dirait maintenant (null s'il n'a rien à dire). */
export function adviceFor(w: WorldState, ghost: string): GhostTip | null {
  const lens = LENSES[ghost];
  return lens ? lens(facts(w)) : null;
}

/** Le conseil le plus pressant parmi une liste de penseurs présents. */
export function mostUrgentTip(w: WorldState, ghosts: string[]): GhostTip | null {
  const f = facts(w);
  let best: GhostTip | null = null;
  for (const g of ghosts) {
    const t = LENSES[g]?.(f);
    if (t && (!best || t.weight > best.weight)) best = t;
  }
  return best;
}

export function hasLens(ghost: string): boolean {
  return !!LENSES[ghost];
}
