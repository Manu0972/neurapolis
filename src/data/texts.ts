/**
 * Libellés d'interface (fr) — tout texte affiché par les écrans vit ici
 * (règle UI : pas de libellé en dur dans la présentation).
 */
import type { CharacteristicsId, DoctrineKey, EventType, NotionStage, RepartitionMode } from '../core/types';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  vie: 'Vie',
  opportunite: 'Opportunité',
  conflit: 'Conflit',
  decouverte: 'Découverte',
  consequence: 'Conséquence',
  conseil: 'Conseil',
  fusion: 'Fusion',
  antagonisme: 'Antagonisme',
  quartier: 'Quartier',
  systeme: 'Système',
};

export const CHARACTERISTICS_LABELS: Record<CharacteristicsId, string> = {
  comprehension: 'Compréhension',
  creativite: 'Créativité',
  influence: 'Influence',
  discipline: 'Discipline',
  adaptabilite: 'Adaptabilité',
  confiance: 'Confiance',
};

export const NOTION_STAGE_LABELS: Record<NotionStage, string> = {
  1: 'Découverte',
  2: 'Expliquée',
  3: 'En application',
  4: 'Maîtrisée',
};

export const DOCTRINE_LABELS: Record<DoctrineKey, string> = {
  marche: 'le marché',
  communs: 'les communs',
  autorite: 'l’autorité',
  solidarite: 'la solidarité',
};

export const REPARTITION_MODE_LABELS: Record<RepartitionMode, string> = {
  egalite: 'Égalité',
  equite: 'Équité',
  incitation: 'Incitation',
};

/** Indicateur discret de l'auto-sauvegarde de fin de journée (contrat M0). */
export const SAVE_LABEL = '💾 Sauvegardé';
