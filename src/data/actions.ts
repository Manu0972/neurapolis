/**
 * Actions débloquées par compétences — les seuils exacts du contrat (M3 §3) :
 * négociation ≥1 « proposer un partage », ≥2 « arbitrer un conflit » ;
 * comptabilité ≥1 livre de comptes détaillé, ≥2 prévision de demande ;
 * communication ≥2 convaincre un PNJ de rejoindre le projet ;
 * organisation ≥1 deux activités simultanées ; technique ≥1 réparer/deviser ;
 * recherche ≥2 autodidacte. Niveaux 0-3, XP par pratique.
 * Données pures : le moteur (src/simulation/actions.ts) interprète les seuils.
 */
import type { EventType, SkillId } from '../core/types';

export interface GatedActionDef {
  id: string;
  label: string;
  description: string;
  skill: SkillId;
  minLevel: 0 | 1 | 2 | 3;
  xp: number;           // XP gagnés à chaque pratique réussie
  eventType: EventType;
  text: string;         // récit de la pratique (journal des causes)
}

export const GATED_ACTIONS: GatedActionDef[] = [
  {
    id: 'partager',
    label: 'Proposer un partage',
    description: 'Proposer une règle de partage qui convient à tout le monde.',
    skill: 'negociation',
    minLevel: 1,
    xp: 2,
    eventType: 'vie',
    text: 'Tu proposes un partage. On discute, on ajuste, et finalement tout le monde accepte. La confiance monte d’un cran.',
  },
  {
    id: 'arbitrer',
    label: 'Arbitrer un conflit',
    description: 'Écouter deux avis opposés et trancher, sans prendre parti.',
    skill: 'negociation',
    minLevel: 2,
    xp: 3,
    eventType: 'conflit',
    text: 'Deux avis s’affrontent. Tu écoutes chacun, tu poses les questions, puis tu tranches. Tout le monde repart moins fâché.',
  },
  {
    id: 'comptes',
    label: 'Tenir un livre de comptes détaillé',
    description: 'Noter chaque entrée et chaque sortie, sans exception.',
    skill: 'comptabilite',
    minLevel: 1,
    xp: 2,
    eventType: 'consequence',
    text: 'Tu notes tout : ce qui entre, ce qui sort, ce qui reste. Les chiffres commencent à raconter une histoire.',
  },
  {
    id: 'prevision',
    label: 'Prévoir la demande',
    description: 'Estimer combien les gens voudront acheter — et à quel prix.',
    skill: 'comptabilite',
    minLevel: 2,
    xp: 3,
    eventType: 'consequence',
    text: 'À partir de tes notes, tu estimes ce qui se vendra. Une prévision, c’est un pari qu’on peut corriger.',
  },
  {
    id: 'recruter',
    label: 'Convaincre de rejoindre le projet',
    description: 'Donner envie à quelqu’un de travailler avec toi.',
    skill: 'communication',
    minLevel: 2,
    xp: 3,
    eventType: 'vie',
    text: 'Tu exposes ton idée, tu écoutes les doutes, tu réponds. À la fin, on te dit oui — et on te respecte un peu plus.',
  },
  {
    id: 'multitache',
    label: 'Mener 2 activités en parallèle',
    description: 'Tenir deux choses à la fois sans rien laisser tomber.',
    skill: 'organisation',
    minLevel: 1,
    xp: 2,
    eventType: 'vie',
    text: 'Deux tâches, un seul toi. Tu t’organises, et les deux avancent.',
  },
  {
    id: 'reparer',
    label: 'Réparer / faire un devis',
    description: 'Évaluer le coût d’une réparation, puis mettre les mains dedans.',
    skill: 'technique',
    minLevel: 1,
    xp: 2,
    eventType: 'vie',
    text: 'Tu examines, tu estimes le prix des pièces, puis tu répares. Les mains se souviennent.',
  },
  {
    id: 'autodidacte',
    label: 'Apprendre en autodidacte',
    description: 'Chercher par toi-même, comprendre par toi-même.',
    skill: 'recherche',
    minLevel: 2,
    xp: 3,
    eventType: 'decouverte',
    text: 'Pas de cours aujourd’hui : tu cherches, tu lis, tu essaies. Et ça marche.',
  },
];

export const GATED_ACTION_BY_ID: Record<string, GatedActionDef> =
  Object.fromEntries(GATED_ACTIONS.map((a) => [a.id, a]));

export const SKILLS_LABELS: Record<SkillId, string> = {
  negociation: 'Négociation',
  comptabilite: 'Comptabilité',
  communication: 'Communication',
  organisation: 'Organisation',
  technique: 'Technique',
  recherche: 'Recherche',
};

/** XP cumulés requis pour chaque niveau : niveau 1 → 3, niveau 2 → 9, niveau 3 → 18. */
export const SKILL_XP_TABLE = [3, 6, 9];
