/**
 * Interface 2D de la Carte stratégique (Paliers 4 à 6).
 * Affiche la carte interactive de la Vallée, du Pays et du Monde,
 * avec la trame des régions, des liaisons, des lieux et des entreprises en activité.
 */
import type { StrategicLocationDef, StrategicMapTier } from '../data/maps/types';
import { IDEA_BY_ID } from '../data/ascension/ideas';
import {
  getStrategicMap, getLocationStatus, isStrategicMapUnlocked, unlockedMapTiers,
} from '../simulation/strategic_map';
import { el } from './ui';
import type { AscensionCtx } from './ascension-ui';

export function openStrategicMapModal(ctx: AscensionCtx, back: () => void, initialTier?: StrategicMapTier): void {
  const w = ctx.world;
  if (!isStrategicMapUnlocked(w)) {
    ctx.toast('La carte stratégique s’ouvre au palier 4 (La Vallée).', false);
    return;
  }

  const unlockedTiers = unlockedMapTiers(w);
  let currentTier: StrategicMapTier = initialTier && unlockedTiers.includes(initialTier) ? initialTier : (unlockedTiers[0] ?? 4);
  let selectedLocationId: string | undefined = undefined;

  const body = el('div', 'panel-body strat-map-body');

  function render(): void {
    body.replaceChildren();

    const mapDef = getStrategicMap(currentTier);
    if (!mapDef) return;

    // Barre d'onglets de paliers
    const tabs = el('div', 'strat-tabs');
    const tiers: { id: StrategicMapTier; label: string; name: string }[] = [
      { id: 4, label: 'Palier 4', name: 'Vallée' },
      { id: 5, label: 'Palier 5', name: 'Pays' },
      { id: 6, label: 'Palier 6', name: 'Monde' },
    ];

    for (const t of tiers) {
      const open = unlockedTiers.includes(t.id);
      const btn = el('button', `strat-tab${t.id === currentTier ? ' active' : ''}${open ? '' : ' locked'}`, `${open ? '🗺️' : '🔒'} ${t.label} — ${t.name}`);
      btn.type = 'button';
      if (open) {
        btn.addEventListener('click', () => {
          currentTier = t.id;
          selectedLocationId = undefined;
          render();
        });
      } else {
        btn.title = `Déblocable au palier ${t.id} de l’Ascension`;
      }
      tabs.appendChild(btn);
    }
    body.appendChild(tabs);

    // En-tête de la carte
    const header = el('div', 'strat-header');
    header.appendChild(el('h3', 'strat-title', `${mapDef.name} · ${mapDef.scaleLabel}`));
    header.appendChild(el('p', 'strat-subtitle', mapDef.subtitle));
    header.appendChild(el('p', 'strat-lore', mapDef.lore));
    body.appendChild(header);

    // Légende des régions
    const legend = el('div', 'strat-legend');
    for (const reg of mapDef.regions) {
      const item = el('div', 'strat-legend-item');
      const dot = el('span', 'strat-legend-dot');
      dot.style.backgroundColor = reg.color;
      item.appendChild(dot);
      item.appendChild(el('span', 'strat-legend-name', reg.name));
      legend.appendChild(item);
    }
    body.appendChild(legend);

    // Zone de carte 2D
    const mapCanvas = el('div', 'strat-canvas');

    // Fond des régions
    const regionsGrid = el('div', 'strat-regions-bg');
    for (const reg of mapDef.regions) {
      const regBox = el('div', 'strat-region-box');
      regBox.style.borderColor = reg.color;
      regBox.style.backgroundColor = `${reg.color}22`;
      regBox.appendChild(el('span', 'strat-region-tag', reg.name));
      regionsGrid.appendChild(regBox);
    }
    mapCanvas.appendChild(regionsGrid);

    // SVG pour les liaisons
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('class', 'strat-connections-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    const locMap = new Map<string, StrategicLocationDef>(mapDef.locations.map((l) => [l.id, l]));

    for (const conn of mapDef.connections) {
      const fromLoc = locMap.get(conn.from);
      const toLoc = locMap.get(conn.to);
      if (!fromLoc || !toLoc) continue;

      const line = document.createElementNS(svgNs, 'line');
      line.setAttribute('x1', String(fromLoc.x));
      line.setAttribute('y1', String(fromLoc.y));
      line.setAttribute('x2', String(toLoc.x));
      line.setAttribute('y2', String(toLoc.y));
      line.setAttribute('class', `strat-conn strat-conn-${conn.kind}`);
      svg.appendChild(line);
    }
    mapCanvas.appendChild(svg);

    // Sélection par défaut du premier lieu si aucun sélectionné
    if (!selectedLocationId && mapDef.locations.length > 0) {
      selectedLocationId = mapDef.locations[0]!.id;
    }

    // Nœuds des lieux
    for (const loc of mapDef.locations) {
      const st = getLocationStatus(w, loc);
      const nodeClass = `strat-node${st.unlocked ? ' open' : ' locked'}${st.activeVentures.length > 0 ? ' active-venture' : ''}${loc.id === selectedLocationId ? ' selected' : ''}`;

      const node = el('div', nodeClass);
      node.style.left = `${loc.x}%`;
      node.style.top = `${loc.y}%`;

      const iconBox = el('div', 'strat-node-icon', loc.icon);
      node.appendChild(iconBox);

      if (st.activeVentures.length > 0) {
        const badge = el('span', 'strat-node-badge', `🚀 ${st.activeVentures.length}`);
        node.appendChild(badge);
      } else if (!st.unlocked) {
        const badge = el('span', 'strat-node-badge lock', '🔒');
        node.appendChild(badge);
      }

      const label = el('span', 'strat-node-label', loc.name);
      node.appendChild(label);

      node.addEventListener('click', () => {
        selectedLocationId = loc.id;
        render();
      });

      mapCanvas.appendChild(node);
    }

    body.appendChild(mapCanvas);

    // Inspecteur / Fiche de détail du lieu sélectionné
    const selectedLoc = mapDef.locations.find((l) => l.id === selectedLocationId);
    if (selectedLoc) {
      const st = getLocationStatus(w, selectedLoc);
      const reg = mapDef.regions.find((r) => r.id === selectedLoc.region);

      const inspector = el('div', 'strat-inspector ph-card');
      const head = el('div', 'ph-card-title', `${selectedLoc.icon} ${selectedLoc.name}`);
      inspector.appendChild(head);

      const regTag = el('div', 'ph-card-sub', `Région : ${reg?.name ?? selectedLoc.region} · ${st.unlocked ? '✅ Débloqué' : '🔒 Verrouillé'}`);
      inspector.appendChild(regTag);

      inspector.appendChild(el('p', 'ph-note', selectedLoc.description));

      if (!st.unlocked && st.reason) {
        inspector.appendChild(el('p', 'ph-note bad', `🔒 Condition : ${st.reason}`));
      }

      // Idées associées
      if (selectedLoc.ideas && selectedLoc.ideas.length > 0) {
        const ideasBox = el('div', 'strat-ideas-box');
        ideasBox.appendChild(el('b', 'strat-sub-title', '💡 Idées d’affaires associées :'));
        const ul = el('ul', 'strat-ideas-list');
        for (const ideaId of selectedLoc.ideas) {
          const idea = IDEA_BY_ID[ideaId];
          if (!idea) continue;
          const li = el('li', '', `${idea.icon} ${idea.name} (marché : ${Math.round(idea.market).toLocaleString('fr-FR')} €/j)`);
          ul.appendChild(li);
        }
        ideasBox.appendChild(ul);
        inspector.appendChild(ideasBox);
      }

      // Entreprises du joueur actives sur ce lieu
      if (st.activeVentures.length > 0) {
        const vBox = el('div', 'strat-ventures-box');
        vBox.appendChild(el('b', 'strat-sub-title', '🚀 Tes entreprises en activité ici :'));
        for (const run of st.activeVentures) {
          const idea = IDEA_BY_ID[run.ideaId];
          const card = el('div', 'ph-card strat-venture-card');
          card.appendChild(el('div', 'ph-card-title', `${idea?.icon ?? '💼'} ${idea?.name ?? run.ideaId} (Niveau ${run.level})`));
          const l = run.last;
          if (l) {
            card.appendChild(el('p', 'ph-note', `Résultat hier : ${l.profit >= 0 ? '+' : ''}${Math.round(l.profit).toLocaleString('fr-FR')} € · Caisse : ${Math.round(run.cash).toLocaleString('fr-FR')} €`));
          } else {
            card.appendChild(el('p', 'ph-note', `Lancement récent · Caisse : ${Math.round(run.cash).toLocaleString('fr-FR')} €`));
          }
          vBox.appendChild(card);
        }
        inspector.appendChild(vBox);
      }

      body.appendChild(inspector);
    }

    const footer = el('div', 'ph-actions');
    const backBtn = el('button', 'ph-btn', '← Retour à l’Ascension');
    backBtn.type = 'button';
    backBtn.addEventListener('click', back);
    footer.appendChild(backBtn);
    body.appendChild(footer);
  }

  render();
  ctx.showModal('🗺️ Carte stratégique', 'Vision régionale et internationale', body, true);
}
