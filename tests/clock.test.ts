/**
 * Tests du socle M0 — horloge du monde.
 * 3 journées complètes (mardi → jeudi), vacances de Toussaint, mercredi après-midi libre.
 */
import { describe, expect, it } from 'vitest';
import {
  dateOf,
  dayIndexOf,
  hhmm,
  hhmmOfTick,
  isSchoolDay,
  isVacances,
  minutesOfDay,
  phaseOfDay,
  tickOfDay,
  weekIndexOf,
} from '../src/core/clock';
import { TICKS_PER_DAY } from '../src/core/types';

/** Jour indexé depuis le mardi 1er septembre 2020 (même référence UTC que core/clock). */
const dayOfIso = (iso: string): number =>
  Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse('2020-09-01T00:00:00Z')) / 86_400_000);

describe('horloge — 3 journées complètes', () => {
  it('le jour 0 est le mardi 1er septembre 2020 (rentrée)', () => {
    const d = dateOf(0);
    expect(d.iso).toBe('2020-09-01');
    expect(d.weekday).toBe(2); // mardi
    expect(d.label).toBe('mardi 1 septembre 2020');
  });

  it('les jours 0-1-2 s\'enchaînent mardi → mercredi → jeudi', () => {
    expect(dateOf(0).iso).toBe('2020-09-01');
    expect(dateOf(1).iso).toBe('2020-09-02');
    expect(dateOf(1).weekday).toBe(3); // mercredi
    expect(dateOf(2).iso).toBe('2020-09-03');
    expect(dateOf(2).weekday).toBe(4); // jeudi
  });

  it('144 ticks par jour ; tick 43 = mardi 07:10 (début de partie)', () => {
    expect(TICKS_PER_DAY).toBe(144);
    expect(dayIndexOf(0)).toBe(0);
    expect(dayIndexOf(TICKS_PER_DAY - 1)).toBe(0);
    expect(dayIndexOf(TICKS_PER_DAY)).toBe(1);
    expect(dayIndexOf(475)).toBe(3);
    expect(tickOfDay(143)).toBe(143);
    expect(tickOfDay(144)).toBe(0);
    expect(minutesOfDay(43)).toBe(430);
    expect(hhmmOfTick(43)).toBe('07:10');
    expect(hhmm(725)).toBe('12:05');
  });

  it('phases d\'une journée d\'école complète (mardi)', () => {
    const mardi = { schoolDay: true, wednesday: false };
    // [minutes, phase attendue]
    const attendu: Array<[number, string]> = [
      [410, 'nuit'], // 06:50
      [420, 'matin'], // 07:00
      [509, 'matin'], // 08:29
      [510, 'coursMatin'], // 08:30
      [719, 'coursMatin'],
      [720, 'cantine'], // 12:00
      [809, 'cantine'],
      [810, 'coursApresMidi'], // 13:30
      [989, 'coursApresMidi'],
      [990, 'devoirs'], // 16:30
      [1079, 'devoirs'],
      [1080, 'soir'], // 18:00
      [1319, 'soir'],
      [1320, 'nuit'], // 22:00
    ];
    for (const [minutes, phase] of attendu) {
      expect(phaseOfDay(minutes, mardi.schoolDay, mardi.wednesday)).toBe(phase);
    }
  });

  it('jour non scolaire : ni cours du matin ni cantine', () => {
    const dimanche = { schoolDay: false, wednesday: false };
    expect(phaseOfDay(600, dimanche.schoolDay, dimanche.wednesday)).toBe('matin'); // 10:00
    // Libellé historique du milieu de journée hors école (comportement figé du socle).
    expect(phaseOfDay(720, dimanche.schoolDay, dimanche.wednesday)).toBe('coursApresMidi'); // 12:00
    expect(phaseOfDay(840, dimanche.schoolDay, dimanche.wednesday)).toBe('apresEcole'); // 14:00
    expect(phaseOfDay(1020, dimanche.schoolDay, dimanche.wednesday)).toBe('soir'); // 17:00
    expect(phaseOfDay(1380, dimanche.schoolDay, dimanche.wednesday)).toBe('nuit'); // 23:00
  });
});

describe('horloge — mercredi après-midi libre', () => {
  it('aucun cours l\'après-midi du mercredi (13:30 → 16:30)', () => {
    for (let minutes = 810; minutes < 990; minutes++) {
      expect(phaseOfDay(minutes, true, true)).not.toBe('coursApresMidi');
    }
    // Le même créneau est en cours un mardi.
    expect(phaseOfDay(840, true, true)).not.toBe('coursApresMidi'); // mercredi 14:00 : libre
    expect(phaseOfDay(840, true, false)).toBe('coursApresMidi'); // mardi 14:00 : en cours
    // Frontières : cantine jusqu'à 13:30, puis après-midi libre.
    expect(phaseOfDay(809, true, true)).toBe('cantine');
    expect(phaseOfDay(810, true, true)).toBe('devoirs');
  });
});

describe('horloge — vacances scolaires 2020-21', () => {
  it('Toussaint du 17 octobre au 2 novembre 2020, bornes incluses', () => {
    const debut = dayOfIso('2020-10-17');
    const fin = dayOfIso('2020-11-02');
    expect(fin - debut).toBe(16); // 17 jours de vacances
    for (let day = debut; day <= fin; day++) expect(isVacances(day)).toBe(true);
    expect(isVacances(debut - 1)).toBe(false); // 16 octobre
    expect(isVacances(fin + 1)).toBe(false); // 3 novembre
    expect(isVacances(0)).toBe(false); // rentrée
  });

  it('isSchoolDay : lundi-vendredi hors vacances seulement', () => {
    expect(isSchoolDay(0)).toBe(true); // mardi 1er septembre
    expect(isSchoolDay(1)).toBe(true); // mercredi (le matin)
    expect(isSchoolDay(dayOfIso('2020-09-06'))).toBe(false); // dimanche
    expect(isSchoolDay(dayOfIso('2020-09-07'))).toBe(true); // lundi
    expect(isSchoolDay(dayOfIso('2020-10-19'))).toBe(false); // lundi de Toussaint
    expect(isSchoolDay(dayOfIso('2020-10-21'))).toBe(false); // mercredi de Toussaint
    expect(isSchoolDay(dayOfIso('2020-11-04'))).toBe(true); // mercredi après les vacances
  });

  it('weekIndexOf découpe la semaine tous les 7 jours', () => {
    expect(weekIndexOf(0)).toBe(0);
    expect(weekIndexOf(6)).toBe(0);
    expect(weekIndexOf(7)).toBe(1);
    expect(weekIndexOf(13)).toBe(1);
    expect(weekIndexOf(14)).toBe(2);
  });
});
