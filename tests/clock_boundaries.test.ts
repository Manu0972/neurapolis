/**
 * Tests des frontières du temps (M0 / horloge).
 * Verrouille les calculs de ticks, dates, vacances scolaires, jours d'école et phases de journée.
 */
import { describe, expect, it } from 'vitest';
import {
  dateOf,
  dayIndexOf,
  hhmmOfTick,
  isSchoolDay,
  isVacances,
  minutesOfDay,
  phaseOfDay,
  tickOfDay,
} from '../src/core/clock';

const dayOfIso = (iso: string): number =>
  Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse('2020-09-01T00:00:00Z')) / 86_400_000);

describe('clock_boundaries — ticks et minutes du jour', () => {
  it('calcule correctement dayIndexOf, tickOfDay, minutesOfDay et hhmmOfTick aux ticks 0, 143, 144, 145', () => {
    // Tick 0 : début du jour 0 (00:00)
    expect(dayIndexOf(0)).toBe(0);
    expect(tickOfDay(0)).toBe(0);
    expect(minutesOfDay(0)).toBe(0);
    expect(hhmmOfTick(0)).toBe('00:00');

    // Tick 143 : dernier tick du jour 0 (23:50)
    expect(dayIndexOf(143)).toBe(0);
    expect(tickOfDay(143)).toBe(143);
    expect(minutesOfDay(143)).toBe(1430);
    expect(hhmmOfTick(143)).toBe('23:50');

    // Tick 144 : premier tick du jour 1 (00:00)
    expect(dayIndexOf(144)).toBe(1);
    expect(tickOfDay(144)).toBe(0);
    expect(minutesOfDay(144)).toBe(0);
    expect(hhmmOfTick(144)).toBe('00:00');

    // Tick 145 : deuxième tick du jour 1 (00:10)
    expect(dayIndexOf(145)).toBe(1);
    expect(tickOfDay(145)).toBe(1);
    expect(minutesOfDay(145)).toBe(10);
    expect(hhmmOfTick(145)).toBe('00:10');
  });

  it('gère le passage du dernier tick d’un jour quelconque (23:50) au premier tick du lendemain (00:00)', () => {
    const day7 = 7;
    const lastTickDay7 = day7 * 144 + 143; // 1151
    const firstTickDay8 = (day7 + 1) * 144; // 1152

    expect(dayIndexOf(lastTickDay7)).toBe(7);
    expect(tickOfDay(lastTickDay7)).toBe(143);
    expect(minutesOfDay(lastTickDay7)).toBe(1430);
    expect(hhmmOfTick(lastTickDay7)).toBe('23:50');

    expect(dayIndexOf(firstTickDay8)).toBe(8);
    expect(tickOfDay(firstTickDay8)).toBe(0);
    expect(minutesOfDay(firstTickDay8)).toBe(0);
    expect(hhmmOfTick(firstTickDay8)).toBe('00:00');
  });
});

describe('clock_boundaries — conversion dateOf et bascules de calendrier', () => {
  it('jour 0 = mardi 1er septembre 2020', () => {
    const d0 = dateOf(0);
    expect(d0.y).toBe(2020);
    expect(d0.m).toBe(9);
    expect(d0.d).toBe(1);
    expect(d0.weekday).toBe(2); // Mardi
    expect(d0.iso).toBe('2020-09-01');
    expect(d0.label).toBe('mardi 1 septembre 2020');
  });

  it('passage au 1er octobre 2020', () => {
    const day = dayOfIso('2020-10-01'); // 30
    const d = dateOf(day);
    expect(d.y).toBe(2020);
    expect(d.m).toBe(10);
    expect(d.d).toBe(1);
    expect(d.weekday).toBe(4); // Jeudi
    expect(d.iso).toBe('2020-10-01');
  });

  it('passage du 31 décembre 2020 au 1er janvier 2021 (année et jour de semaine)', () => {
    const day31Dec = dayOfIso('2020-12-31'); // 121
    const d31Dec = dateOf(day31Dec);
    expect(d31Dec.y).toBe(2020);
    expect(d31Dec.m).toBe(12);
    expect(d31Dec.d).toBe(31);
    expect(d31Dec.weekday).toBe(4); // Jeudi
    expect(d31Dec.iso).toBe('2020-12-31');

    const day1Jan = dayOfIso('2021-01-01'); // 122
    const d1Jan = dateOf(day1Jan);
    expect(d1Jan.y).toBe(2021);
    expect(d1Jan.m).toBe(1);
    expect(d1Jan.d).toBe(1);
    expect(d1Jan.weekday).toBe(5); // Vendredi
    expect(d1Jan.iso).toBe('2021-01-01');
  });
});

describe('clock_boundaries — isVacances', () => {
  it('bornes incluses des vacances de Toussaint (2020-10-17 à 2020-11-02) et jours limitrophes', () => {
    const dayAvant = dayOfIso('2020-10-16');
    const dayDebut = dayOfIso('2020-10-17');
    const dayFin = dayOfIso('2020-11-02');
    const dayApres = dayOfIso('2020-11-03');

    expect(isVacances(dayAvant)).toBe(false);
    expect(isVacances(dayDebut)).toBe(true);
    expect(isVacances(dayFin)).toBe(true);
    expect(isVacances(dayApres)).toBe(false);
  });

  it('bornes incluses des vacances de Noël (2020-12-19 à 2021-01-04) et jours limitrophes', () => {
    const dayAvant = dayOfIso('2020-12-18');
    const dayDebut = dayOfIso('2020-12-19');
    const dayFin = dayOfIso('2021-01-04');
    const dayApres = dayOfIso('2021-01-05');

    expect(isVacances(dayAvant)).toBe(false);
    expect(isVacances(dayDebut)).toBe(true);
    expect(isVacances(dayFin)).toBe(true);
    expect(isVacances(dayApres)).toBe(false);
  });
});

describe('clock_boundaries — isSchoolDay', () => {
  it('samedi et dimanche sont toujours faux', () => {
    const samediRegular = dayOfIso('2020-09-05');
    const dimancheRegular = dayOfIso('2020-09-06');
    expect(isSchoolDay(samediRegular)).toBe(false);
    expect(isSchoolDay(dimancheRegular)).toBe(false);
  });

  it('le dernier jour de vacances est faux', () => {
    const finToussaint = dayOfIso('2020-11-02'); // Lundi 2 nov 2020
    const finNoel = dayOfIso('2021-01-04'); // Lundi 4 janv 2021
    expect(isSchoolDay(finToussaint)).toBe(false);
    expect(isSchoolDay(finNoel)).toBe(false);
  });

  it('le lundi d’école après les vacances est vrai', () => {
    const lundiApresToussaint = dayOfIso('2020-11-09');
    const lundiApresNoel = dayOfIso('2021-01-11');
    expect(isSchoolDay(lundiApresToussaint)).toBe(true);
    expect(isSchoolDay(lundiApresNoel)).toBe(true);
  });

  it('les jours ouvrés après vacances (ex. mardi 3 nov 2020, mardi 5 janv 2021) sont vrais', () => {
    const mardiApresToussaint = dayOfIso('2020-11-03');
    const mardiApresNoel = dayOfIso('2021-01-05');
    expect(isSchoolDay(mardiApresToussaint)).toBe(true);
    expect(isSchoolDay(mardiApresNoel)).toBe(true);
  });
});

describe('clock_boundaries — phaseOfDay aux heures de bascule', () => {
  it('jour scolaire ordinaire (mardi)', () => {
    const schoolDay = true;
    const wednesday = false;

    // Fin de nuit / début matin : 07:00 (420 min)
    expect(phaseOfDay(419, schoolDay, wednesday)).toBe('nuit');
    expect(phaseOfDay(420, schoolDay, wednesday)).toBe('matin');

    // Début des cours : 08:30 (510 min)
    expect(phaseOfDay(509, schoolDay, wednesday)).toBe('matin');
    expect(phaseOfDay(510, schoolDay, wednesday)).toBe('coursMatin');

    // Cantine : 12:00 (720 min)
    expect(phaseOfDay(719, schoolDay, wednesday)).toBe('coursMatin');
    expect(phaseOfDay(720, schoolDay, wednesday)).toBe('cantine');

    // Cours après-midi : 13:30 (810 min)
    expect(phaseOfDay(809, schoolDay, wednesday)).toBe('cantine');
    expect(phaseOfDay(810, schoolDay, wednesday)).toBe('coursApresMidi');

    // Devoirs / après école : 16:30 (990 min)
    expect(phaseOfDay(989, schoolDay, wednesday)).toBe('coursApresMidi');
    expect(phaseOfDay(990, schoolDay, wednesday)).toBe('devoirs');

    // Soir : 18:00 (1080 min)
    expect(phaseOfDay(1079, schoolDay, wednesday)).toBe('devoirs');
    expect(phaseOfDay(1080, schoolDay, wednesday)).toBe('soir');

    // Nuit : 22:00 (1320 min)
    expect(phaseOfDay(1319, schoolDay, wednesday)).toBe('soir');
    expect(phaseOfDay(1320, schoolDay, wednesday)).toBe('nuit');
  });

  it('mercredi après-midi libre (schoolDay = true, wednesday = true)', () => {
    const schoolDay = true;
    const wednesday = true;

    // Matin et cantine identiques
    expect(phaseOfDay(510, schoolDay, wednesday)).toBe('coursMatin');
    expect(phaseOfDay(720, schoolDay, wednesday)).toBe('cantine');

    // À 13:30 (810 min) le mercredi, pas de coursApresMidi -> devoirs/libre
    expect(phaseOfDay(810, schoolDay, wednesday)).toBe('devoirs');
    expect(phaseOfDay(989, schoolDay, wednesday)).toBe('devoirs');
    expect(phaseOfDay(1080, schoolDay, wednesday)).toBe('soir');
  });

  it('jour non scolaire (week-end / vacances)', () => {
    const schoolDay = false;
    const wednesday = false;

    expect(phaseOfDay(419, schoolDay, wednesday)).toBe('nuit');
    expect(phaseOfDay(420, schoolDay, wednesday)).toBe('matin');
    expect(phaseOfDay(659, schoolDay, wednesday)).toBe('matin');
    expect(phaseOfDay(660, schoolDay, wednesday)).toBe('coursApresMidi'); // 11:00 - milieu journée
    expect(phaseOfDay(840, schoolDay, wednesday)).toBe('apresEcole'); // 14:00
    expect(phaseOfDay(1020, schoolDay, wednesday)).toBe('soir'); // 17:00
    expect(phaseOfDay(1320, schoolDay, wednesday)).toBe('nuit'); // 22:00
  });
});
