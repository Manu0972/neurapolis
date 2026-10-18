/**
 * Récit lisible de la vie d'un PNJ (dérivé de #22) pour relire la congruence du lore sans lire de code.
 * Fonction pure et déterministe (sans hasard, sans Math.random() ni Date.now()).
 */
import { NPC_BY_ID, NPCS } from '../data/npcs';
import { EXPANDED_NPC_BY_ID, NPCS_EXPANDED } from '../data/npcs_expanded';
import { NPC_EVENT_REACTIONS } from '../data/npc-events';
import type { NpcDef, RoutineSlot } from '../core/types';
import type { ExpandedNpcDef } from '../data/npcs_expanded';

/**
 * Traduction lisible des identifiants de lieux.
 */
const LIEUX_LABELS: Record<string, string> = {
  maison: 'son domicile',
  college: 'collège Jean-Moulin',
  parc: 'parc du quartier',
  epicerie: 'épicerie de quartier',
  place: 'place du marché',
  friche: 'friche Taret',
};

/**
 * Traduction lisible des quartiers.
 */
const QUARTIERS_LABELS: Record<string, string> = {
  roses: 'Cité des Roses',
  bassin: 'Bassin Taret / Friche',
  hauts: 'Les Hauts / Belvédères',
  caves: 'Les Caves / Souterrains',
  docks: 'Les Docks Fluviaux',
  tramway: 'Ligne de Tramway / Gare',
};

function formatRoutineSlot(slot: RoutineSlot): string {
  const lieu = LIEUX_LABELS[slot.place] ?? slot.place;
  const weekendNotice = slot.weekends ? ' (y compris week-end)' : '';
  return `- De ${slot.from} à ${slot.to} : ${slot.activity} (${lieu})${weekendNotice}`;
}

export function racontePnj(id: string): string {
  // Alias / résolution de l'ID entre npcs.ts ('monique') et npcs_expanded.ts ('monique_p')
  const baseDef: NpcDef | undefined = NPC_BY_ID[id] ?? (id === 'monique_p' ? NPC_BY_ID['monique'] : undefined);
  const expandedDef: ExpandedNpcDef | undefined =
    EXPANDED_NPC_BY_ID[id] ?? (id === 'monique' ? EXPANDED_NPC_BY_ID['monique_p'] : undefined);

  if (!baseDef && !expandedDef) {
    return `# Récit de vie : PNJ inconnu\n\nAucune donnée trouvée pour le PNJ "${id}".`;
  }

  const name = expandedDef?.name ?? baseDef?.name ?? id;
  const age = expandedDef?.age ?? baseDef?.age ?? 0;
  const role = expandedDef?.role ?? baseDef?.role ?? 'Habitant';
  const traits = expandedDef?.traits ?? baseDef?.traits ?? [];
  const routine = expandedDef?.routine ?? baseDef?.routine ?? [];
  const districtKey = expandedDef?.district ?? '';
  const districtLabel = QUARTIERS_LABELS[districtKey] ?? (districtKey || 'Val-Ferrand');

  const lines: string[] = [];

  lines.push(`# Récit de vie : ${name}`);
  lines.push('');
  lines.push(`## Identité et Rôle`);
  lines.push(`- **Nom** : ${name}`);
  lines.push(`- **Âge** : ${age} ans${age < 18 ? ' (enfant / mineur)' : ''}`);
  lines.push(`- **Rôle** : ${role}`);
  lines.push(`- **Secteur / Quartier** : ${districtLabel}`);
  if (traits.length > 0) {
    lines.push(`- **Traits de caractère** : ${traits.join(', ')}`);
  }
  lines.push('');

  lines.push(`## Biographie et Lore`);
  if (age < 18) {
    lines.push(
      `${name} est un enfant âgé de ${age} ans qui grandit à Val-Ferrand (${districtLabel}). Son rôle dans la communauté est "${role}".`
    );
  } else {
    lines.push(
      `${name} est un habitant de Val-Ferrand âgé de ${age} ans. Il s'investit au quotidien dans le quartier en tant que "${role}".`
    );
  }

  if (expandedDef?.intimateSecret) {
    lines.push('');
    lines.push(`### Secret intime`);
    lines.push(expandedDef.intimateSecret);
  }

  if (expandedDef?.humorAndTics) {
    lines.push('');
    lines.push(`### Humour et tics de langage`);
    lines.push(expandedDef.humorAndTics);
  }

  if (expandedDef?.systemicHook) {
    lines.push('');
    lines.push(`### Ancrage dans la vie de quartier`);
    lines.push(expandedDef.systemicHook);
  }

  if (expandedDef?.specialAbility) {
    lines.push('');
    lines.push(`### Capacité spéciale : ${expandedDef.specialAbility.label}`);
    lines.push(`${expandedDef.specialAbility.description}`);
    lines.push(`*Effet dans la simulation :* ${expandedDef.specialAbility.effectDescription}`);
  }

  if (routine.length > 0) {
    lines.push('');
    lines.push(`## Emploi du temps quotidien`);
    for (const slot of routine) {
      lines.push(formatRoutineSlot(slot));
    }
  }

  // Dialogues phares (Topic dialogues ou dialoguePharesi)
  const pharesi = expandedDef?.dialoguePharesi;
  const baseTopics = baseDef?.topics;

  if (pharesi || baseTopics) {
    lines.push('');
    lines.push(`## Exemples d'échanges et répliques`);

    if (pharesi?.accueil && pharesi.accueil.length > 0) {
      lines.push(`### Accueil habituel`);
      for (const line of pharesi.accueil) {
        lines.push(`> « ${line} »`);
      }
    } else if (baseTopics?.accueil && baseTopics.accueil.length > 0) {
      lines.push(`### Accueil habituel`);
      for (const line of baseTopics.accueil) {
        lines.push(`> « ${line} »`);
      }
    }

    if (pharesi?.secretRevele && pharesi.secretRevele.length > 0) {
      lines.push(`### Confidences`);
      for (const line of pharesi.secretRevele) {
        lines.push(`> « ${line} »`);
      }
    }

    if (pharesi?.conflit && pharesi.conflit.length > 0) {
      lines.push(`### Moment de tension`);
      for (const line of pharesi.conflit) {
        lines.push(`> « ${line} »`);
      }
    }

    if (pharesi?.victoire && pharesi.victoire.length > 0) {
      lines.push(`### Réussite collective`);
      for (const line of pharesi.victoire) {
        lines.push(`> « ${line} »`);
      }
    }
  }

  // Événements de quartier auxquels le PNJ réagit
  const targetIds = new Set([id, id === 'monique' ? 'monique_p' : '', id === 'monique_p' ? 'monique' : ''].filter(Boolean));
  const reactions = NPC_EVENT_REACTIONS.filter((r) => targetIds.has(r.npcId));

  if (reactions.length > 0) {
    lines.push('');
    lines.push(`## Réactions aux événements du quartier`);
    for (const r of reactions) {
      lines.push(`- **Lors de l'événement "${r.eventTitlePrefix}..."** (Sujet : *${r.topic}*) :`);
      lines.push(`  > « ${r.line} »`);
    }
  }

  return lines.join('\n');
}
