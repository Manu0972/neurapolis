/**
 * NEURAPOLIS — Présentation des Scènes d'Intérieur Détaillées.
 * Interface riche avec pièces distinctes (Chambre, Salon, Classe, Cour, Rayonnages, Réserve, Atelier, Hangar, etc.),
 * mobilier interactif, audio d'ambiance et retours sensoriels.
 */
import type { PlaceId, WorldState } from '../core/types';
import { INTERIOR_PLACES, type InteriorRoom, type InteractiveFurniture } from '../data/interiors';
import { NPC_BY_ID } from '../data/npcs';
import { npcsAt } from '../simulation/npc';
import { el } from './ui';
import { audio } from './audio';
import { applyPlaceAction } from '../simulation/places';
import { addXp } from '../simulation/skills';
import { WorldRenderer3D } from './renderer3d';

export interface InteriorModalCallbacks {
  showModal: (title: string, sub: string, body: HTMLElement, wide?: boolean) => void;
  closeModal: () => void;
  openNpcDialogue: (npcId: string) => void;
  openWorkshopModal?: () => void;
  openUrbanDebate?: () => void;
  refreshWorldHud?: () => void;
  renderer3d?: WorldRenderer3D | null;
}

export function openDetailedInteriorModal(
  placeId: PlaceId,
  world: WorldState,
  callbacks: InteriorModalCallbacks,
  initialRoomId?: string,
): void {
  const placeDef = INTERIOR_PLACES[placeId];
  if (!placeDef) return;

  let currentRoom: InteriorRoom = (initialRoomId && placeDef.rooms.find((r) => r.id === initialRoomId)) || placeDef.rooms[0]!;

  // Lancer l'ambiance sonore de la pièce
  audio.setAmbient(currentRoom.ambientSound);

  // Déclencher la scène 3D d'intérieur correspondante
  const renderer3D = callbacks.renderer3d ?? WorldRenderer3D.getActiveRenderer();
  if (renderer3D && typeof renderer3D.setInteriorScene === 'function') {
    renderer3D.setInteriorScene(placeId, currentRoom.id);
  }

  // Intercepter la fermeture de la modale pour nettoyer la scène 3D intérieure
  const origCloseModal = callbacks.closeModal;
  callbacks.closeModal = () => {
    if (renderer3D && typeof renderer3D.clearInteriorScene === 'function') {
      renderer3D.clearInteriorScene();
    }
    origCloseModal();
  };

  const container = el('div', 'interior-scene-container');
  container.style.cssText = 'display:flex;flex-direction:column;gap:12px;max-height:75vh;overflow-y:auto;padding:4px;';

  // Sélecteur d'onglets pour les pièces dédiées du lieu
  const roomTabs = el('div', 'interior-room-tabs');
  roomTabs.style.cssText = 'display:flex;gap:6px;border-bottom:2px solid var(--panel2);padding-bottom:6px;';

  function renderRoomContent(): void {
    container.replaceChildren();

    // Onglets de pièces
    roomTabs.replaceChildren();
    for (const room of placeDef.rooms) {
      const isSelected = room.id === currentRoom.id;
      const tabBtn = el('button', 'btn room-tab-btn', `${room.name}`);
      tabBtn.style.cssText = `padding:6px 12px;font-size:12px;font-weight:700;border-radius:6px;border:1px solid ${
        isSelected ? 'var(--or)' : 'var(--line)'
      };background:${isSelected ? 'var(--panel2)' : 'rgba(0,0,0,0.2)'};color:${
        isSelected ? 'var(--or)' : 'var(--ink-muted)'
      };cursor:pointer;`;

      tabBtn.addEventListener('click', () => {
        audio.playUiClick();
        audio.playFootstep(room.surfaceType);
        currentRoom = room;
        audio.setAmbient(room.ambientSound);
        if (renderer3D && typeof renderer3D.setInteriorScene === 'function') {
          renderer3D.setInteriorScene(placeId, room.id);
        }
        renderRoomContent();
      });
      roomTabs.appendChild(tabBtn);
    }
    container.appendChild(roomTabs);

    // En-tête de la pièce
    const roomHeader = el('div', 'room-header');
    roomHeader.style.cssText = 'background:rgba(42,26,20,0.6);padding:10px;border-radius:8px;border:1px solid var(--panel2);';
    const roomTitle = el('h3', 'room-title', currentRoom.name);
    roomTitle.style.cssText = 'margin:0 0 4px 0;color:var(--or);font-size:14px;';
    const roomDesc = el('p', 'room-desc', currentRoom.description);
    roomDesc.style.cssText = 'margin:0;font-size:12px;color:var(--ink-muted);line-height:1.4;';
    roomHeader.appendChild(roomTitle);
    roomHeader.appendChild(roomDesc);
    container.appendChild(roomHeader);

    // PNJs présents dans ce lieu
    const npcsHere = npcsAt(world, placeId);
    if (npcsHere.length > 0) {
      const npcBox = el('div', 'room-npcs-box');
      npcBox.style.cssText = 'background:var(--panel);padding:8px 10px;border-radius:6px;border:1px solid var(--line);';
      const npcTitle = el('div', 'panel-sub', '👥 Présents dans cette pièce');
      npcTitle.style.cssText = 'font-weight:700;font-size:11px;color:var(--ink);margin-bottom:6px;';
      npcBox.appendChild(npcTitle);

      const npcList = el('div', 'npc-button-list');
      npcList.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
      for (const n of npcsHere) {
        const npcDef = NPC_BY_ID[n.id];
        if (!npcDef) continue;
        const btn = el('button', 'btn btn-npc', `🗣️ ${npcDef.name} (${n.activity})`);
        btn.style.cssText = `border-left:4px solid ${npcDef.color};font-size:11px;padding:4px 8px;cursor:pointer;`;
        btn.addEventListener('click', () => {
          audio.playUiClick();
          callbacks.openNpcDialogue(n.id);
        });
        npcList.appendChild(btn);
      }
      npcBox.appendChild(npcList);
      container.appendChild(npcBox);
    }

    // Mobilier Interactif de la pièce
    const furnitureSection = el('div', 'room-furniture-section');
    const furnTitle = el('h4', 'panel-sub', '🛋️ Mobilier & Éléments Interactifs');
    furnTitle.style.cssText = 'margin:4px 0;font-size:12px;color:var(--or);';
    furnitureSection.appendChild(furnTitle);

    const furnGrid = el('div', 'furniture-grid');
    furnGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:8px;';

    for (const furn of currentRoom.furniture) {
      const card = el('div', 'furniture-card');
      card.style.cssText =
        'background:var(--panel2);border:1px solid var(--line);border-radius:6px;padding:8px;display:flex;flex-direction:column;justify-content:space-between;gap:6px;';

      const top = el('div', 'furn-card-top');
      const nameRow = el('div', 'furn-name-row');
      nameRow.style.cssText = 'display:flex;align-items:center;gap:6px;font-weight:700;font-size:12px;color:var(--ink);';
      nameRow.appendChild(el('span', 'furn-icon', furn.icon));
      nameRow.appendChild(el('span', 'furn-name', furn.name));
      top.appendChild(nameRow);

      const desc = el('p', 'furn-desc', furn.description);
      desc.style.cssText = 'margin:4px 0 0 0;font-size:11px;color:var(--ink-muted);line-height:1.3;';
      top.appendChild(desc);
      card.appendChild(top);

      // Conséquences & bouton d'action
      const actionRow = el('div', 'furn-action-row');
      actionRow.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-top:4px;';

      const actionBtn = el('button', 'btn btn-action', furn.actionLabel);
      actionBtn.style.cssText = 'padding:6px 8px;font-size:11px;font-weight:700;width:100%;cursor:pointer;';

      actionBtn.addEventListener('click', () => {
        handleFurnitureAction(furn, actionBtn);
      });

      actionRow.appendChild(actionBtn);
      card.appendChild(actionRow);
      furnGrid.appendChild(card);
    }
    furnitureSection.appendChild(furnGrid);
    container.appendChild(furnitureSection);
  }

  function handleFurnitureAction(furn: InteractiveFurniture, btn: HTMLElement): void {
    // Son d'interaction
    if (furn.sound === 'coin') {
      audio.playCoin();
    } else if (furn.sound === 'ghost') {
      audio.playGhostDebate();
    } else if (furn.sound === 'footstep') {
      audio.playFootstep(furn.surface || currentRoom.surfaceType);
    } else {
      audio.playUiClick();
    }

    // Effets spécifiques
    if (furn.customEffect === 'open_workshop' && callbacks.openWorkshopModal) {
      callbacks.openWorkshopModal();
      return;
    }
    if (furn.customEffect === 'open_debate' && callbacks.openUrbanDebate) {
      callbacks.openUrbanDebate();
      return;
    }

    // Vérification de budget si coût
    if (furn.money !== undefined && furn.money < 0 && world.player.money < Math.abs(furn.money)) {
      btn.textContent = '❌ Fonds insuffisants';
      return;
    }

    // Application de l'argent
    if (furn.money !== undefined) {
      world.player.money = Math.max(0, world.player.money + furn.money);
    }

    // Application des besoins
    if (furn.needs) {
      for (const [k, d] of Object.entries(furn.needs)) {
        if (d !== undefined && k in world.player.needs) {
          const key = k as keyof typeof world.player.needs;
          world.player.needs[key] = Math.max(0, Math.min(100, world.player.needs[key] + d));
        }
      }
    }

    // Application XP compétence
    if (furn.skill && furn.xp) {
      addXp(world, furn.skill, furn.xp);
    }

    // Fallback éventuel sur place action simulation
    applyPlaceAction(world, placeId, furn.actionId);

    btn.textContent = `✓ Fait ! (${furn.actionLabel})`;
    setTimeout(() => {
      btn.textContent = furn.actionLabel;
    }, 1200);

    if (callbacks.refreshWorldHud) {
      callbacks.refreshWorldHud();
    }
  }

  renderRoomContent();
  callbacks.showModal(placeDef.title, 'Scène d’intérieur détaillée', container, true);
}
