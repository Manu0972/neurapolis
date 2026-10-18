/** Accueil du téléphone (vague 6) : quelles icônes selon l'état, quelles pastilles. */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { BUSINESS_SUBAPPS, businessesVisible, homeIcons, homeOf, messagesBadge, moneyBadge } from '../src/presentation/phone-home';

const ids = (w: ReturnType<typeof createWorld>): string[] => homeIcons(w, null).map((i) => i.id);

describe('accueil du téléphone', () => {
  it('au début : seulement Mission (rien de verrouillé n’apparaît)', () => {
    const w = createWorld({ seed: 7 });
    expect(ids(w)).toEqual(['mission']);
  });

  it('les icônes suivent le dévoilement du HUD', () => {
    const w = createWorld({ seed: 7 });
    w.seen['hud:argent'] = true;
    w.seen['hud:plan'] = true;
    w.seen['hud:conseil'] = true;
    expect(ids(w)).toEqual(['mission', 'messages', 'plan', 'argent']);
  });

  it('Ascension apparaît après le chapitre 1 ; jamais plus de 6 icônes', () => {
    const w = createWorld({ seed: 7 });
    for (const p of ['argent', 'plan', 'conseil']) w.seen[`hud:${p}`] = true;
    w.campaign.currentChapter = 2;
    w.economy = { ...(w.economy as object), businesses: { b1: {} }, leases: {} } as never;
    const list = ids(w);
    expect(list).toContain('ascension');
    expect(list).toContain('affaires');
    expect(list.length).toBeLessThanOrEqual(6);
  });

  it('pastilles : dîner qui attend, argent négatif', () => {
    const w = createWorld({ seed: 7 });
    expect(messagesBadge(w)).toBe(0);
    expect(moneyBadge(w)).toBe(0);
    w.player.money = -3;
    expect(moneyBadge(w)).toBe(1);
  });

  it('les anciennes applications sont rangées dans l’icône la plus logique', () => {
    for (const a of BUSINESS_SUBAPPS) expect(homeOf(a)).toBe('affaires');
    expect(homeOf('infos')).toBe('messages');
    expect(homeOf('depenses')).toBe('argent');
    expect(homeOf('ascension')).toBe('ascension');
    expect(businessesVisible(createWorld({ seed: 7 }))).toBe(false);
  });
});
