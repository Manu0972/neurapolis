/**
 * Tests exhaustifs pour le moteur de synthèse audio procédurale Web Audio,
 * le moteur de rendu 3D Three.js avec caméra rotative et les scènes d'intérieur détaillées.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createWorld } from '../src/core/store';
import { audio } from '../src/presentation/audio';
import { INTERIOR_PLACES } from '../src/data/interiors';
import { openDetailedInteriorModal } from '../src/presentation/interiors';
import { WorldRenderer3D, getCameraRelativeInput } from '../src/presentation/renderer3d';
import { createInteriorDiorama } from '../src/presentation/interiors3d';

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
        dispatchEvent: (event: { type: string; preventDefault?: () => void }) => {
          if (!event.preventDefault) {
            event.preventDefault = () => {};
          }
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

  it('calcule la transformation directionnelle de caméra getCameraRelativeInput pour les 4 quarts de tour', () => {
    // 0° (isométrique standard) : identité (dx, dy) -> (dx, dy)
    expect(getCameraRelativeInput(0, -1, 0)).toEqual({ x: 0, y: -1 }); // Haut -> Haut
    expect(getCameraRelativeInput(1, 0, 0)).toEqual({ x: 1, y: 0 });   // Droite -> Droite
    expect(getCameraRelativeInput(0, 1, 0)).toEqual({ x: 0, y: 1 });   // Bas -> Bas
    expect(getCameraRelativeInput(-1, 0, 0)).toEqual({ x: -1, y: 0 }); // Gauche -> Gauche

    // 90° (sens horaire) : (dx, dy) -> (-dy, dx)
    // Haut (0, -1) sur écran correspond à Droite (1, 0) dans le monde
    expect(getCameraRelativeInput(0, -1, 1)).toEqual({ x: 1, y: 0 });
    // Droite (1, 0) correspond à Bas (0, 1)
    expect(getCameraRelativeInput(1, 0, 1)).toEqual({ x: 0, y: 1 });
    // Bas (0, 1) correspond à Gauche (-1, 0)
    expect(getCameraRelativeInput(0, 1, 1)).toEqual({ x: -1, y: 0 });
    // Gauche (-1, 0) correspond à Haut (0, -1)
    expect(getCameraRelativeInput(-1, 0, 1)).toEqual({ x: 0, y: -1 });

    // 180° : (dx, dy) -> (-dx, -dy)
    expect(getCameraRelativeInput(0, -1, 2)).toEqual({ x: 0, y: 1 });   // Haut -> Bas
    expect(getCameraRelativeInput(1, 0, 2)).toEqual({ x: -1, y: 0 });   // Droite -> Gauche
    expect(getCameraRelativeInput(0, 1, 2)).toEqual({ x: 0, y: -1 });   // Bas -> Haut
    expect(getCameraRelativeInput(-1, 0, 2)).toEqual({ x: 1, y: 0 });   // Gauche -> Droite

    // 270° : (dx, dy) -> (dy, -dx)
    expect(getCameraRelativeInput(0, -1, 3)).toEqual({ x: -1, y: 0 });  // Haut -> Gauche
    expect(getCameraRelativeInput(1, 0, 3)).toEqual({ x: 0, y: -1 });   // Droite -> Haut
    expect(getCameraRelativeInput(0, 1, 3)).toEqual({ x: 1, y: 0 });    // Bas -> Droite
    expect(getCameraRelativeInput(-1, 0, 3)).toEqual({ x: 0, y: 1 });    // Gauche -> Bas

    // Arithmétique modulaire (tours complets et angles négatifs)
    expect(getCameraRelativeInput(0, -1, 4)).toEqual({ x: 0, y: -1 });  // 4 == 0
    expect(getCameraRelativeInput(0, -1, -1)).toEqual({ x: -1, y: 0 }); // -1 == 3
    expect(getCameraRelativeInput(0, -1, 5)).toEqual({ x: 1, y: 0 });   // 5 == 1
    expect(getCameraRelativeInput(0, -1, -2)).toEqual({ x: 0, y: 1 });  // -2 == 2
  });

  it('configure le brouillard atmosphérique Hygge FogExp2 et initialise la géométrie en mode headless', () => {
    const canvas = document.createElement('canvas');
    const renderer3d = new WorldRenderer3D(canvas);

    renderer3d.initHeadless();
    const scene = renderer3d.getScene();
    expect(scene).toBeDefined();
    expect(scene?.fog).toBeInstanceOf(THREE.FogExp2);

    const fog = scene?.fog as THREE.FogExp2;
    expect(fog.color.getHex()).toBe(0x2a1a14);
    expect(fog.density).toBeCloseTo(0.018, 4);

    renderer3d.dispose();
  });

  it('gère l’activation, le changement de pièce et le nettoyage des scènes d’intérieur 3D', () => {
    const canvas = document.createElement('canvas');
    const renderer3d = new WorldRenderer3D(canvas);

    expect(renderer3d.isInteriorActive()).toBe(false);
    expect(renderer3d.getCurrentInterior()).toBeNull();

    // 1. Activation d'une scène d'intérieur (Maison - Chambre)
    renderer3d.setInteriorScene('maison', 'chambre');
    expect(renderer3d.isInteriorActive()).toBe(true);
    expect(renderer3d.getCurrentInterior()).toEqual({ placeId: 'maison', roomId: 'chambre' });
    expect(renderer3d.getCurrentDiorama()).toBeDefined();
    expect(renderer3d.getMapGroup()?.visible).toBe(false);

    // 2. Bascule vers une autre pièce (Maison - Salon)
    renderer3d.setInteriorScene('maison', 'salon');
    expect(renderer3d.isInteriorActive()).toBe(true);
    expect(renderer3d.getCurrentInterior()).toEqual({ placeId: 'maison', roomId: 'salon' });
    expect(renderer3d.getCurrentDiorama()?.furnitureMeshes.has('frigo')).toBe(true);

    // 3. Nettoyage de la scène intérieure et retour à la vue extérieure
    renderer3d.clearInteriorScene();
    expect(renderer3d.isInteriorActive()).toBe(false);
    expect(renderer3d.getCurrentInterior()).toBeNull();
    expect(renderer3d.getCurrentDiorama()).toBeNull();
    expect(renderer3d.getMapGroup()?.visible).toBe(true);

    renderer3d.dispose();
  });

  it('réagit à la perte de contexte WebGL et déclenche le fallback', () => {
    const canvas = document.createElement('canvas');
    const renderer3d = new WorldRenderer3D(canvas);

    let fallbackSignaled = false;
    renderer3d.onContextLost = () => {
      fallbackSignaled = true;
    };

    // Simulation de l'événement natif webglcontextlost
    canvas.dispatchEvent({ type: 'webglcontextlost' } as unknown as Event);

    expect(renderer3d.isWebGLAvailable).toBe(false);
    expect(fallbackSignaled).toBe(true);

    renderer3d.dispose();
  });
});

describe('Scènes 3D d’Intérieur Détaillées (createInteriorDiorama)', () => {
  it('construit un diorama riche avec mobilier pour Maison (Chambre & Salon)', () => {
    // Chambre de Camille
    const dioramaChambre = createInteriorDiorama('maison', 'chambre');
    expect(dioramaChambre.roomGroup).toBeInstanceOf(THREE.Group);
    expect(dioramaChambre.ambientLight.color.getHex()).toBe(0xffd98a);
    expect(dioramaChambre.warmAccentLights.length).toBeGreaterThan(0);
    expect(dioramaChambre.furnitureMeshes.has('lit')).toBe(true);
    expect(dioramaChambre.furnitureMeshes.has('bureau')).toBe(true);
    expect(dioramaChambre.furnitureMeshes.has('bibliotheque')).toBe(true);
    expect(dioramaChambre.furnitureMeshes.has('fenetre')).toBe(true);
    expect(() => dioramaChambre.dispose()).not.toThrow();

    // Salon & Cuisine
    const dioramaSalon = createInteriorDiorama('maison', 'salon');
    expect(dioramaSalon.furnitureMeshes.has('frigo')).toBe(true);
    expect(dioramaSalon.furnitureMeshes.has('canape')).toBe(true);
    expect(dioramaSalon.furnitureMeshes.has('table')).toBe(true);
    expect(dioramaSalon.furnitureMeshes.has('radio')).toBe(true);
    expect(() => dioramaSalon.dispose()).not.toThrow();
  });

  it('construit un diorama riche pour Collège (Classe & Cour)', () => {
    const dioramaClasse = createInteriorDiorama('college', 'classe');
    expect(dioramaClasse.furnitureMeshes.has('pupitre')).toBe(true);
    expect(dioramaClasse.furnitureMeshes.has('tableau')).toBe(true);
    expect(dioramaClasse.furnitureMeshes.has('bureau_prof')).toBe(true);
    dioramaClasse.dispose();

    const dioramaCour = createInteriorDiorama('college', 'cour');
    expect(dioramaCour.furnitureMeshes.has('banc_cour')).toBe(true);
    expect(dioramaCour.furnitureMeshes.has('marelle')).toBe(true);
    expect(dioramaCour.furnitureMeshes.has('preau')).toBe(true);
    dioramaCour.dispose();
  });

  it('construit un diorama riche pour Épicerie (Magasin & Réserve)', () => {
    const dioramaMagasin = createInteriorDiorama('epicerie', 'magasin');
    expect(dioramaMagasin.furnitureMeshes.has('caisse')).toBe(true);
    expect(dioramaMagasin.furnitureMeshes.has('rayonnage_frais')).toBe(true);
    expect(dioramaMagasin.furnitureMeshes.has('bocal_vrac')).toBe(true);
    dioramaMagasin.dispose();

    const dioramaReserve = createInteriorDiorama('epicerie', 'reserve');
    expect(dioramaReserve.furnitureMeshes.has('palette_stock')).toBe(true);
    expect(dioramaReserve.furnitureMeshes.has('registre_fournisseurs')).toBe(true);
    dioramaReserve.dispose();
  });

  it('construit un diorama riche pour Friche (Atelier & Hangar Récup)', () => {
    const dioramaAtelier = createInteriorDiorama('friche', 'atelier_principal');
    expect(dioramaAtelier.furnitureMeshes.has('etabli')).toBe(true);
    expect(dioramaAtelier.furnitureMeshes.has('tour_mecanique')).toBe(true);
    expect(dioramaAtelier.furnitureMeshes.has('panneau_outils')).toBe(true);
    dioramaAtelier.dispose();

    const dioramaHangar = createInteriorDiorama('friche', 'hangar_recup');
    expect(dioramaHangar.furnitureMeshes.has('tas_ferraille')).toBe(true);
    expect(dioramaHangar.furnitureMeshes.has('banc_diagnostic')).toBe(true);
    dioramaHangar.dispose();
  });

  it('construit un diorama avec éléments pour Parc et Place du Marché', () => {
    const dioramaParc = createInteriorDiorama('parc', 'allees');
    expect(dioramaParc.furnitureMeshes.has('banc_anciens')).toBe(true);
    expect(dioramaParc.furnitureMeshes.has('fontaine_parc')).toBe(true);
    dioramaParc.dispose();

    const dioramaPlace = createInteriorDiorama('place', 'halle');
    expect(dioramaPlace.furnitureMeshes.has('etal_marche')).toBe(true);
    expect(dioramaPlace.furnitureMeshes.has('panneau_annonces')).toBe(true);
    dioramaPlace.dispose();
  });

  it('synchronise l’ouverture de la modale d’intérieur et le changement d’onglet avec le moteur 3D', () => {
    const canvas = document.createElement('canvas');
    const renderer3d = new WorldRenderer3D(canvas);
    const world = createWorld();

    let modalClosed = false;
    let modalBody: HTMLElement | null = null;

    openDetailedInteriorModal('epicerie', world, {
      showModal: (_t, _s, body) => {
        modalBody = body;
      },
      closeModal: () => {
        modalClosed = true;
      },
      openNpcDialogue: () => {},
      renderer3d,
    });

    // 1. À l'ouverture de l'épicerie, la pièce par défaut (magasin) est activée en 3D
    expect(renderer3d.isInteriorActive()).toBe(true);
    expect(renderer3d.getCurrentInterior()).toEqual({ placeId: 'epicerie', roomId: 'magasin' });

    // 2. Clic sur l'onglet "Réserve" -> mise à jour du rendu 3D
    const tabButtons = (modalBody as any).querySelectorAll('.room-tab-btn');
    expect(tabButtons.length).toBe(2);
    tabButtons[1].dispatchEvent({ type: 'click' }); // Onglet Réserve

    expect(renderer3d.getCurrentInterior()).toEqual({ placeId: 'epicerie', roomId: 'reserve' });

    renderer3d.dispose();
  });
});

