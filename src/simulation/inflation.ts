/**
 * Inflation simple de la campagne (France, 2022-2023) : un indice des prix déterministe,
 * fonction du seul calendrier. 1,00 jusqu'au 31 décembre 2021, puis il monte jour après jour
 * d'environ 5 % en 2022 et 4 % en 2023 (ordres de grandeur de l'Insee, arrondis vers le bas
 * pour rester modeste), et se stabilise ensuite à 1,09.
 *
 * Ce qui suit l'indice : le prix d'achat du stock chez Mme Bertin, le prix du distributeur et
 * du Drive, et le prix que les clients jugent « normal » (la demande se calcule sur le prix réel,
 * ce qui permet au joueur de relever ses prix sans perdre de clients). Pas de changement de schéma.
 */
import { dateOf, dayOfIso } from '../core/clock';

const DEBUT_2022 = dayOfIso('2022-01-01');
const DEBUT_2023 = dayOfIso('2023-01-01');
const DEBUT_2024 = dayOfIso('2024-01-01');
export const INDICE_FIN_2022 = 1.05;
export const INDICE_FIN_2023 = 1.09;

/** Indice des prix du jour (1 = prix de 2020-2021). */
export function indicePrix(day: number): number {
  if (day < DEBUT_2022) return 1;
  if (day < DEBUT_2023) return 1 + (INDICE_FIN_2022 - 1) * (day - DEBUT_2022) / (DEBUT_2023 - DEBUT_2022);
  if (day < DEBUT_2024) return INDICE_FIN_2022 + (INDICE_FIN_2023 - INDICE_FIN_2022) * (day - DEBUT_2023) / (DEBUT_2024 - DEBUT_2023);
  return INDICE_FIN_2023;
}

/** Prix indexé, arrondi aux 10 centimes (un commerçant n'affiche pas 15,73 €). */
export function prixIndexe(base: number, day: number): number {
  return Math.round(base * indicePrix(day) * 10) / 10;
}

/** Libellé court pour l'interface (« prix +5 % depuis 2021 »), vide avant 2022. */
export function libelleInflation(day: number): string {
  const pct = Math.round((indicePrix(day) - 1) * 100);
  return pct > 0 ? `prix +${pct} % depuis ${dateOf(DEBUT_2022 - 1).y}` : '';
}
