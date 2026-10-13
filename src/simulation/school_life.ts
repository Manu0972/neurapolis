/**
 * NEURAPOLIS — Moteur d'École, Études & Dynamique Familiale des Parents.
 */
import type { Notification, SchoolLifeState, WorldState } from '../core/types';
import { dayIndexOf, isSchoolDay } from '../core/clock';
import { notify } from './events';

/** Fatigue d'une demi-journée de cours (8 rendait le joueur assidu irritable en permanence). */
export const CLASS_FATIGUE = 5;

/**
 * Classe selon l'âge : la rentrée tombe le 1er septembre, jour de l'anniversaire du joueur.
 * 12 ans : 5e, 13 : 4e, 14 : 3e (brevet), 15 : 2de au lycée de la cité scolaire, 16 : 1re.
 */
export const CLASSES: Readonly<Record<number, string>> = { 11: '6e', 12: '5e', 13: '4e', 14: '3e', 15: '2de', 16: '1re', 17: 'terminale' };

export function classeScolaire(age: number): string {
  return CLASSES[Math.max(11, Math.min(17, age))]!;
}

/** Collège jusqu'en 3e, lycée ensuite (même cité scolaire Jean-Moulin). */
export function etablissementScolaire(age: number): string {
  return age >= 15 ? 'lycée Jean-Moulin' : 'collège Jean-Moulin';
}

/** Les contrôles se corsent d'une année sur l'autre (points retirés à la note du vendredi). */
export function difficulteClasse(age: number): number {
  return Math.max(0, Math.min(2, (age - 12) * 0.5));
}

export function ensureSchoolLifeState(w: WorldState): SchoolLifeState {
  if (!w.schoolLife) {
    w.schoolLife = {
      attendanceRate: 92,
      consecutiveClassesAttended: 3,
      skippedClassesCount: 0,
      academicAverage: 14.5,
      parentSentiment: 'satisfait',
      parentCongratulatedCount: 1,
      teacherWarningActive: false,
      negotiatedExemption: false,
      lastParentInteractionDay: 0,
      lastParentMessage: 'Tes parents sont contents de tes débuts au collège : « Travaille bien et ne te disperse pas trop avec tes projets ! »',
    };
  }
  return w.schoolLife;
}

export function attendSchoolClass(w: WorldState): { ok: boolean; message: string } {
  const sl = ensureSchoolLifeState(w);
  sl.consecutiveClassesAttended += 1;
  sl.attendanceRate = Math.min(100, sl.attendanceRate + 2);
  // La moyenne ne bouge plus à chaque séance (elle atteignait 20/20 en trois mois) : ce sont
  // les notes du vendredi qui la font (family.ts), et la présence y pèse lourd.
  w.player.characteristics.comprehension = Math.min(100, w.player.characteristics.comprehension + 1);
  w.player.characteristics.discipline = Math.min(100, w.player.characteristics.discipline + 1);
  w.player.needs.fatigue = Math.min(100, w.player.needs.fatigue + CLASS_FATIGUE);
  w.player.needs.stress = Math.max(0, w.player.needs.stress - 3);

  updateParentSentiment(w);

  return {
    ok: true,
    message: `Cours suivi avec attention. Moyenne scolaire : ${sl.academicAverage}/20 (Discipline +1, Compréhension +1).`,
  };
}

export function skipSchoolForBusiness(
  w: WorldState,
  reason = 'Livraison et négociation urgente',
): { ok: boolean; message: string } {
  const sl = ensureSchoolLifeState(w);
  sl.skippedClassesCount += 1;
  sl.consecutiveClassesAttended = 0;
  sl.attendanceRate = Math.max(20, sl.attendanceRate - 8);
  sl.academicAverage = Math.max(5, Math.round((sl.academicAverage - 0.6) * 10) / 10);

  w.player.characteristics.adaptabilite = Math.min(100, w.player.characteristics.adaptabilite + 2);
  w.player.characteristics.influence = Math.min(100, w.player.characteristics.influence + 1);
  w.player.needs.stress = Math.min(100, w.player.needs.stress + 10);

  if (sl.skippedClassesCount >= 3 && !sl.negotiatedExemption) {
    sl.teacherWarningActive = true;
  }

  updateParentSentiment(w);

  return {
    ok: true,
    message: `Cours séché pour « ${reason} ». Tu as pu faire avancer le business, mais ta moyenne descend à ${sl.academicAverage}/20 et tes parents s'inquiètent.`,
  };
}

export function studyEveningHomework(w: WorldState): { ok: boolean; message: string } {
  const sl = ensureSchoolLifeState(w);
  sl.academicAverage = Math.min(20, Math.round((sl.academicAverage + 0.5) * 10) / 10);
  w.player.characteristics.comprehension = Math.min(100, w.player.characteristics.comprehension + 2);
  w.player.needs.fatigue = Math.min(100, w.player.needs.fatigue + 12);
  w.player.needs.moral = Math.min(100, w.player.needs.moral + 5);

  updateParentSentiment(w);

  return {
    ok: true,
    message: `Devoirs et révisions terminés au calme. Moyenne consolidée à ${sl.academicAverage}/20. Tes parents apprécient ta rigueur.`,
  };
}

export function negotiateWithTeacher(w: WorldState): { ok: boolean; message: string } {
  const sl = ensureSchoolLifeState(w);
  if (w.player.characteristics.influence < 40 && w.player.skills.negociation.level < 1) {
    return {
      ok: false,
      message: 'M. Moreau reste sceptique : développe ton Influence (≥40) ou ta Négociation (niv. 1) pour plaider ta cause.',
    };
  }

  sl.negotiatedExemption = true;
  sl.teacherWarningActive = false;
  w.player.reputation = Math.min(100, w.player.reputation + 6);

  return {
    ok: true,
    message: 'M. Moreau accepte un aménagement d’horaires : ton projet citoyen et d’entreprise est reconnu comme démarche pédagogique !',
  };
}

export function talkWithParents(w: WorldState): { ok: boolean; message: string; sentiment: string } {
  const sl = ensureSchoolLifeState(w);
  const day = dayIndexOf(w.time.tick);
  sl.lastParentInteractionDay = day;

  const pName = w.player.firstName || w.player.name || 'mon grand';
  let msg = '';
  if (sl.parentSentiment === 'tres_fier' || sl.parentSentiment === 'satisfait') {
    msg = `« ${pName}, on est tellement fiers de toi ! Tu gères tes cours avec brio tout en montant de belles choses dans le quartier. Continue comme ça ! »`;
    w.player.needs.moral = Math.min(100, w.player.needs.moral + 15);
    w.player.characteristics.confiance = Math.min(100, w.player.characteristics.confiance + 3);
  } else if (sl.parentSentiment === 'neutre') {
    msg = '« On voit que tu travailles dur, mais fais attention à ne pas te surmener. Prends le temps de te reposer et mange un bon goûter. »';
    w.player.needs.moral = Math.min(100, w.player.needs.moral + 5);
  } else {
    msg = `« ${pName}, on s’inquiète beaucoup… Tes professeurs nous ont signalé des absences et tes notes baissent. Promets-nous de réviser ce soir. »`;
    w.player.needs.stress = Math.max(0, w.player.needs.stress - 5);
  }

  sl.lastParentMessage = msg;
  return { ok: true, message: msg, sentiment: sl.parentSentiment };
}

export function updateParentSentiment(w: WorldState): void {
  const sl = ensureSchoolLifeState(w);
  if (sl.teacherWarningActive || sl.skippedClassesCount >= 3) {
    sl.parentSentiment = sl.academicAverage < 10 ? 'tres_inquiet' : 'inquiet';
  } else if (sl.academicAverage >= 16 && sl.attendanceRate >= 90) {
    sl.parentSentiment = 'tres_fier';
  } else if (sl.academicAverage >= 13 && sl.attendanceRate >= 80) {
    sl.parentSentiment = 'satisfait';
  } else if (sl.academicAverage >= 10 && sl.attendanceRate >= 65) {
    sl.parentSentiment = 'neutre';
  } else if (sl.academicAverage >= 8) {
    sl.parentSentiment = 'inquiet';
  } else {
    sl.parentSentiment = 'tres_inquiet';
  }
}

export function schoolDayTick(w: WorldState): Notification[] {
  const sl = ensureSchoolLifeState(w);
  const notifs: Notification[] = [];
  const day = dayIndexOf(w.time.tick);

  if (isSchoolDay(day)) {
    // Si l'assiduité est maintenue, félicitations des parents
    if (sl.academicAverage >= 15 && sl.parentSentiment === 'tres_fier' && sl.parentCongratulatedCount === 0) {
      sl.parentCongratulatedCount += 1;
      const t = 'Félicitations de la famille : tes parents ont préparé ton dessert préféré pour fêter tes excellents résultats scolaires ! (Moral +10)';
      notifs.push(notify('bien', t));
      w.player.needs.moral = Math.min(100, w.player.needs.moral + 10);
    }
  }

  return notifs;
}
