/**
 * Tests M7 — finalisation (contrat §3 M7) :
 *  - chemin rapide d'équilibrage : Smith apparaît (1er échange), puis 1re
 *    vente du stand, puis 1re répartition — ≈ 30 min de jeu simulé ;
 *  - avatars SVG procéduraux par seed : déterminisme, validité, unicité ;
 *  - sauvegarde aller-retour : l'état du Conseil survit à une fusion et à un
 *    antagonisme actifs (statuts fusionne/hostile, jauge des ombres, contrat) ;
 *  - auto-sauvegarde de fin de journée (cadence figée, contrat M0).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';
import { TICKS_PER_DAY } from '../src/core/types';
import { councilArrivalChoose, councilKeyDecision, councilPendingArrivals } from '../src/simulation/council';
import { fusionConfirm } from '../src/simulation/fusions';
import { replyDialogue } from '../src/simulation/dialogue';
import { skillLevel } from '../src/simulation/skills';
import { applyPlaceAction } from '../src/simulation/places';
import {
  adoptSharedRules, buyStock, createProject, recruitMember, repartition,
  runCourse, runSalesSession,
} from '../src/simulation/project';
import { contractChoose, maybeProposeContract } from '../src/simulation/security';
import { recordTaylorRefusal } from '../src/simulation/antagonists';
import { exportSave, importSave } from '../src/saves/persist';
import { avatarSvg } from '../src/presentation/avatar';
import { NPCS } from '../src/data/npcs';

const DAY = TICKS_PER_DAY;

/** À vitesse 1, un tick de simulation = 1 s de jeu réel : 30 min de jeu = 1800 ticks. */
const TRENTE_MINUTES_DE_JEU = 30 * 60;

// ---------- Chemin rapide (équilibrage) ----------

describe('M7 — chemin rapide : Smith apparaît, puis 1re vente, puis 1re répartition', () => {
  it('tout tient dans la première journée — et largement dans les 30 minutes de jeu simulé', () => {
    const w = createWorld();
    const t0 = w.time.tick;

    // Jour 1, avant le collège : le stand se crée, une course rapporte 2 €,
    // un goûter à l'épicerie coûte 1 € — et compte comme premier échange.
    expect(createProject(w).ok).toBe(true);
    expect(runCourse(w).ok).toBe(true);
    expect(applyPlaceAction(w, 'epicerie', 'gouter').ok).toBe(true);
    runTicks(w, 1);
    expect(councilPendingArrivals(w)).toContain('smith'); // Smith apparaît
    expect(councilArrivalChoose(w, 'smith', 'ecouter').ok).toBe(true);

    // Stock (15 €) puis 1re vente à la récré.
    expect(buyStock(w).ok).toBe(true);
    const vente = runSalesSession(w, 'college');
    expect(vente.ok).toBe(true);
    expect(vente.sold).toBeGreaterThan(0);
    expect(w.project?.sessionsDone).toBe(1); // c'est bien la toute première vente

    // Communication niveau 2 par la pratique (dialogues chaleureux, XP 2 chacun)
    // → recruter Noah pour la première répartition.
    for (let i = 0; i < 5; i++) replyDialogue(w, 'noah', 'chaleureux');
    expect(skillLevel(w, 'communication')).toBe(2);
    expect(recruitMember(w, 'noah').ok).toBe(true);

    // Deux sessions de plus : la semaine passe au vert, la 1re répartition a lieu.
    expect(runSalesSession(w, 'college').ok).toBe(true);
    expect(runSalesSession(w, 'college').ok).toBe(true);
    const rep = repartition(w, 'egalite');
    expect(rep.ok).toBe(true);
    expect(w.project?.week.distributed).toBe(true);
    expect(w.flags['dilemmesJustice']).toBe(1);

    // Smith a traversé une répartition « égalité » (solidarité, sa doctrine
    // opposée : −10) sans tomber hostile — l'équilibrage tient.
    expect(w.council.ghosts['smith']?.status).toBe('actif');
    expect(w.council.ghosts['smith']?.loyalty ?? 0).toBeGreaterThanOrEqual(20);

    // Temps simulé du chemin : largement dans les 30 minutes de jeu,
    // et même entièrement dans la première journée.
    const elapsed = w.time.tick - t0;
    expect(elapsed).toBeLessThanOrEqual(TRENTE_MINUTES_DE_JEU);
    expect(elapsed).toBeLessThanOrEqual(DAY);
  });
});

// ---------- Avatars SVG procéduraux par seed ----------

describe('M7 — avatars SVG procéduraux par seed', () => {
  it('déterministe : même clé et même couleur ⇒ même SVG exact', () => {
    expect(avatarSvg('pnj:noah', '#4ea1ff')).toBe(avatarSvg('pnj:noah', '#4ea1ff'));
    expect(avatarSvg('joueur:Camille', '#ffc94a')).toBe(avatarSvg('joueur:Camille', '#ffc94a'));
  });

  it('les huit PNJ ont chacun un avatar distinct (couleur de la data respectée)', () => {
    const avatars = NPCS.map((n) => avatarSvg(`pnj:${n.id}`, n.color));
    expect(new Set(avatars).size).toBe(avatars.length);
  });

  it('le SVG est bien formé, teinté par la couleur du personnage, sans valeur dégénérée', () => {
    const svg = avatarSvg('pnj:lina', '#5cd6e8');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('#5cd6e8');
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('undefined');
  });
});

// ---------- Sauvegarde : l'état du Conseil survit ----------

describe('M7 — sauvegarde aller-retour après une fusion et un antagonisme actifs', () => {
  it('statuts fusionne/hostile, jauge des ombres et contrat actif survivent à export/import', () => {
    const w = createWorld({ seed: 7 });

    // Smith par le jeu réel : premier échange.
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    expect(councilArrivalChoose(w, 'smith', 'ecouter').ok).toBe(true);
    // Ostrom par le jeu réel : stand collectif (2 membres + règles partagées).
    w.player.skills.communication.level = 2;
    expect(createProject(w).ok).toBe(true);
    expect(recruitMember(w, 'noah').ok).toBe(true);
    expect(recruitMember(w, 'lina').ok).toBe(true);
    expect(adoptSharedRules(w).ok).toBe(true);
    runTicks(w, 1);
    expect(councilArrivalChoose(w, 'ostrom', 'ecouter').ok).toBe(true);

    // Fusion : 3 décisions « marché » + 3 « communs » avec les deux voix, affinité 6.
    councilKeyDecision(w, 'marche');
    councilKeyDecision(w, 'marche');
    councilKeyDecision(w, 'marche');
    councilKeyDecision(w, 'communs');
    councilKeyDecision(w, 'communs');
    councilKeyDecision(w, 'communs');
    runTicks(w, 1);
    expect(w.council.pendingFusion).toBe('marche_des_communs');
    expect(fusionConfirm(w).ok).toBe(true);
    expect(w.council.ghosts['smith']?.status).toBe('fusionne');

    // Antagonisme actif : Taylor bascule hostile (loyauté < 20), les refus
    // nourrissent la jauge des ombres, le Contrat de Sécurité est signé.
    w.council.ghosts['taylor']!.status = 'actif';
    w.council.ghosts['taylor']!.loyalty = 15;
    runTicks(w, 1);
    expect(w.council.ghosts['taylor']?.status).toBe('hostile');
    recordTaylorRefusal(w);
    recordTaylorRefusal(w);
    expect(w.council.allianceDesOmbres).toBe(2);
    w.flags['incidents'] = 1;
    w.council.ghosts['hobbes']!.status = 'actif';
    maybeProposeContract(w, []);
    expect(contractChoose(w, true).ok).toBe(true);
    expect(w.council.contratSecurite?.active).toBe(true);

    // Aller-retour : l'état du Conseil est intégralement conservé.
    const w2 = importSave(exportSave(w));
    expect(w2).toEqual(w);
    expect(w2.council.ghosts['smith']?.status).toBe('fusionne');
    expect(w2.council.ghosts['ostrom']?.status).toBe('fusionne');
    expect(w2.council.ghosts['marche_des_communs']?.status).toBe('actif');
    expect(w2.council.fusionsDone).toContain('marche_des_communs');
    expect(w2.council.ghosts['taylor']?.status).toBe('hostile');
    expect(w2.council.allianceDesOmbres).toBe(2);
    expect(w2.council.contratSecurite?.active).toBe(true);
    // Ré-export stable, clé pour clé.
    expect(exportSave(importSave(exportSave(w)))).toBe(exportSave(w));
  });
});

// ---------- Auto-sauvegarde de fin de journée (cadence figée M0) ----------

describe('M7 — auto-sauvegarde de fin de journée', () => {
  it('le slot « auto » est écrit au passage de minuit', () => {
    const w = createWorld();
    const store = new Map<string, string>();
    (globalThis as unknown as { localStorage?: Storage }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() { return store.size; },
    };
    runTicks(w, DAY); // franchit la fin de journée → auto-sauvegarde
    expect(store.has('neurapolis.save.auto')).toBe(true);
    expect((JSON.parse(store.get('neurapolis.save.auto') ?? '{}') as { version: number }).version).toBe(3);
    delete (globalThis as unknown as { localStorage?: Storage }).localStorage;
  });
});
