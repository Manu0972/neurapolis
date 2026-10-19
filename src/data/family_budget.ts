/**
 * Budget mensuel du foyer (Nora et Thierry, rentrée 2020), montré quand le joueur « fait le point
 * sur le budget familial » à la table de la cuisine. Ordres de grandeur réalistes pour une famille
 * modeste de la vallée : deux salaires proches du SMIC, un loyer HLM, une voiture indispensable.
 */
export interface BudgetLine { label: string; amount: number }

export const FAMILY_INCOME: readonly BudgetLine[] = [
  { label: 'Salaire de Nora (aide-soignante de nuit, temps partiel)', amount: 1350 },
  { label: 'Salaire de Thierry (cariste au Drive)', amount: 1290 },
];

export const FAMILY_EXPENSES: readonly BudgetLine[] = [
  { label: 'Loyer (Cité des Roses)', amount: 590 },
  { label: 'Courses', amount: 560 },
  { label: 'Voiture (crédit, essence)', amount: 340 },
  { label: 'Électricité et chauffage', amount: 150 },
  { label: 'Assurances et mutuelle', amount: 140 },
  { label: 'Crédit du frigo et de la machine à laver', amount: 110 },
  { label: 'Vêtements', amount: 90 },
  { label: 'Cantine et fournitures', amount: 80 },
  { label: 'Téléphone et internet', amount: 60 },
  { label: 'Impôts locaux', amount: 60 },
  { label: 'Eau', amount: 40 },
];

export const sumBudget = (lines: readonly BudgetLine[]): number => lines.reduce((s, l) => s + l.amount, 0);

/** Ce qu'il reste chaque mois une fois tout payé (imprévus, loisirs, épargne). */
export const FAMILY_MONTHLY_MARGIN = sumBudget(FAMILY_INCOME) - sumBudget(FAMILY_EXPENSES);

export const FAMILY_BUDGET_LESSON =
  'Il reste à peine de quoi faire face à un imprévu : une panne de voiture, et le mois est dans le rouge. Voilà pourquoi tu préfères gagner tes propres sous.';
