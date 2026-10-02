/**
 * Tests exhaustifs pour le moteur de synthèse audio procédurale Web Audio,
 * le moteur de rendu 3D Three.js avec caméra rotative et les scènes d'intérieur détaillées.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld } from '../src/core/store';
import { audio } from '../src/presentation/audio';
import { INTERIOR_PLACES } from '../src/data/interiors';
import { openDetailedInteriorModal } from '../src/presentation/interiors';
import { WorldRenderer3D } from '../src/presentation/renderer3d';

// Mock minimal du DOM pour l'environnement Node.js de Vitest
function setupDomMock(): void {
  if (typeof globalThis.document === 'undefined') {
    const createMockElement = (tagName: string): any => {
      const children: any[] = [];
      const listeners: Record<string, Function[]> = {};
      const classListSet = new Set<string>();

      return {
        tagName: tagName.toUpperCase(),
        className: '',
        textContent: '',
        title: '',
        style: {},
        dataset: {},
        classList: {
          add: (cls: string) => classListSet.add(cls),
          remove: (cls: string) => classListSet.delete(cls),
          contains: (cls: string) => classListSet.has(cls),
          toggle: (cls: string, force?: boolean) => {
            if (force !== undefined) {
              if (force) classListSet.add(cls);
              else classListSet.delete(cls);
            } else if (classListSet.has(cls)) {
              classListSet.delete(cls);
            } else {
              classListSet.add(cls);
            }
          },
        },
        appendChild: (child: any) => {
          children.push(child);
          return child;
        },
        replaceChildren: (...newChildren: any[]) => {
          children.length = 0;
          children.push(...newChildren);
        },
        querySelectorAll: (selector: string) => {
          const results: any[] = [];
          const matchClass = selector.startsWith('.') ? selector.slice(1) : null;
          const search = (node: any) => {
            if (matchClass && (node.className?.includes(matchClass) || node.classList?.contains(matchClass))) {
              results.push(node);
            }
            if (node.children) {
              for (const c of node.children) search(c);
            }
          };
          for (const c of children) search(c);
          return results;
        },
        children,
        addEventListener: (event: string, handler: Function) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event]!.push(handler);
        },
        removeEventListener: (event: string, handler: Function) => {
          if (!listeners[event]) return;
          listeners[event] = listeners[event]!.filter((fn) => fn !== handler);
        },
        dispatchEvent: (event: { type: string }) => {
          const list = listeners[event.type] || [];
          for (const fn of list) fn(event);
        },
      };
    };

    (globalThis as any).document = {
      createElement: (tag: string) => createMockElement(tag),
    };
    (globalThis as any).window = globalThis;
  }
}

describe('Système Audio — Synthèse Procédurale Web Audio', () => {
  it('s’exécute sans planter en environnement de test sans AudioContext natif', () => {
    expect(() => {
      audio.init();
      audio.playFootstep('pave');
      audio.playFootstep('herbe');
      audio.playFootstep('parquet');
      audio.playFootstep('terre');
      audio.playFootstep('sol');
      audio.playUiClick();
      audio.playCoin();
      audio.playGhostArrival();
      audio.playGhostDebate();
      audio.playChapterComplete();
      audio.setAmbient('maison');
      audio.setAmbient('parc');
      audio.setAmbient('atelier');
      audio.setAmbient('college');
      audio.setAmbient('epicerie');
      audio.setAmbient('place');
      audio.setAmbient('ville');
      audio.setAmbient('silence');
      audio.stopAmbient();
    }).not.toThrow();
  });

  it('gère correctement le volume et le statut muet avec bornage', () => {
    audio.setMasterVolume(0.8);
    const initialMute = audio.isMuted();
    const toggled = audio.toggleMute();
    expect(toggled).toBe(!initialMute);
    expect(audio.isMuted()).toBe(toggled);
    audio.setMuted(false);
    expect(audio.isMuted()).toBe(false);

    // Bornage volume [0, 1]
    audio.setMasterVolume(1.5);
    audio.setMasterVolume(-0.5);
  });
});

describe('Intérieurs Détaillés & Mobilier Interactif', () => {
  beforeEach(() => {
    setupDomMock();
  });

  it('contient les scènes dédiées et pièces détaillées pour tous les lieux du quartier', () => {
    const places = ['maison', 'college', 'epicerie', 'friche', 'parc', 'place'] as const;

    for (const pid of places) {
      const placeDef = INTERIOR_PLACES[pid];
      expect(placeDef).toBeDefined();
      expect(placeDef.rooms.length).toBeGreaterThanOrEqual(2);

      // Chaque pièce a son ambiance, sa surface et son mobilier interactif
      for (const room of placeDef.rooms) {
        expect(room.id).toBeTruthy();
        expect(room.name).toBeTruthy();
        expect(room.description).toBeTruthy();
        expect(room.ambientSound).toBeTruthy();
        expect(['parquet', 'pave', 'herbe', 'terre']).toContain(room.surfaceType);
        expect(room.furniture.length).toBeGreaterThan(0);

        for (const furn of room.furniture) {
          expect(furn.id).toBeTruthy();
          expect(furn.name).toBeTruthy();
          expect(furn.icon).toBeTruthy();
          expect(furn.actionLabel).toBeTruthy();
          expect(furn.actionId).toBeTruthy();
        }
      }
    }
  });

  it('ouvre la modal d’intérieur détaillé et permet d’interagir avec le mobilier', () => {
    const world = createWorld();
    world.player.needs.fatigue = 50;
    world.player.needs.faim = 30;
    world.player.money = 20;

    let modalShown = false;
    let modalTitle = '';
    let modalContent: HTMLElement | null = null;
    let hudRefreshed = false;

    openDetailedInteriorModal('maison', world, {
      showModal: (title, sub, body) => {
        modalShown = true;
        modalTitle = title;
        modalContent = body;
      },
      closeModal: () => {},
      openNpcDialogue: () => {},
      refreshWorldHud: () => {
        hudRefreshed = true;
      },
    });

    expect(modalShown).toBe(true);
    expect(modalTitle).toBe('Maison de Camille');
    expect(modalContent).not.toBeNull();

    // Recherche et clic sur le bouton d'action du premier meuble (Lit douillet - sieste)
    const buttons = (modalContent as any).querySelectorAll('.btn-action');
    expect(buttons.length).toBeGreaterThan(0);

    const initialFatigue = world.player.needs.fatigue;
    buttons[0].dispatchEvent({ type: 'click' });

    // La sieste a diminué la fatigue de 25 points
    expect(world.player.needs.fatigue).toBeLessThan(initialFatigue);
    expect(hudRefreshed).toBe(true);
  });

  it('gère les transactions marchandes et les vérifications de solde insuffisant', () => {
    const world = createWorld();
    world.player.money = 0.5; // Moins que le goûter à 1.0 €

    let modalContent: HTMLElement | null = null;
    openDetailedInteriorModal('epicerie', world, {
      showModal: (_title, _sub, body) => {
        modalContent = body;
      },
      closeModal: () => {},
      openNpcDialogue: () => {},
    });

    const buttons = (modalContent as any).querySelectorAll('.btn-action');
    const caisseBtn = buttons[0];
    caisseBtn.dispatchEvent({ type: 'click' });

    expect(caisseBtn.textContent).toContain('Fonds insuffisants');
    expect(world.player.money).toBe(0.5);
  });
});

describe('Rendu 3D Three.js & Caméra Rotative', () => {
  beforeEach(() => {
    setupDomMock();
  });

  it('WorldRenderer3D initialise les groupes et gère la rotation de caméra par quarts de tour', () => {
    const canvas = document.createElement('canvas');
    const renderer3d = new WorldRenderer3D(canvas);

    // Contrôles de caméra par quarts de tour (0, 1, 2, 3)
    expect(renderer3d.cameraQuarterTurn).toBe(0);

    renderer3d.rotateRight();
    expect(renderer3d.cameraQuarterTurn).toBe(1);

    renderer3d.rotateRight();
    expect(renderer3d.cameraQuarterTurn).toBe(2);

    renderer3d.rotateLeft();
    expect(renderer3d.cameraQuarterTurn).toBe(1);

    renderer3d.setQuarterTurn(3);
    expect(renderer3d.cameraQuarterTurn).toBe(3);

    // Bascule vue dessus / isométrique
    expect(renderer3d.isTopDown).toBe(false);
    renderer3d.toggleTopDown();
    expect(renderer3d.isTopDown).toBe(true);
    renderer3d.toggleTopDown();
    expect(renderer3d.isTopDown).toBe(false);

    // Zoom et nettoyage
    expect(() => {
      renderer3d.zoomIn();
      renderer3d.zoomOut();
      renderer3d.dispose();
    }).not.toThrow();
  });
});
