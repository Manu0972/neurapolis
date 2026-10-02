/**
 * NEURAPOLIS — Moteur de Rendu 3D WebGL / Three.js.
 * Décors et personnages low-poly stylisés, préservant la palette et l'ambiance Hygge 1800K.
 * Caméra rotative par quarts de tour (Q/E ou contrôles HUD) avec interpolation fluide.
 * Fallback transparent sur le Canvas 2D en l'absence de WebGL.
 */
import * as THREE from 'three';
import type { GhostId, PlaceId, WorldState } from '../core/types';
import { DECORATIONS, MAP_H, MAP_W, tileAt, type WorldPropId } from '../data/map';
import { minutesOfDay } from '../core/clock';
import { NPC_BY_ID } from '../data/npcs';
import { npcPosition } from '../simulation/npc';
import { TOKENS, HYGGE_1800K } from './tokens';
import { GHOST_DEFS_BY_ID } from '../data/ghosts/registry';
import { createInteriorDiorama, type InteriorDiorama } from './interiors3d';

/**
 * Calcule le vecteur de déplacement relatif à l'orientation de la caméra (par quarts de tour).
 * 0°   -> (dx, dy)
 * 90°  -> (-dy, dx)  (sens horaire)
 * 180° -> (-dx, -dy)
 * 270° -> (dy, -dx)
 */
export function getCameraRelativeInput(
  dx: number,
  dy: number,
  quarterTurn: number,
): { x: number; y: number } {
  const q = ((quarterTurn % 4) + 4) % 4;
  let rx = dx;
  let ry = dy;
  switch (q) {
    case 1:
      rx = -dy;
      ry = dx;
      break;
    case 2:
      rx = -dx;
      ry = -dy;
      break;
    case 3:
      rx = dy;
      ry = -dx;
      break;
    case 0:
    default:
      rx = dx;
      ry = dy;
      break;
  }
  return {
    x: rx === 0 ? 0 : rx,
    y: ry === 0 ? 0 : ry,
  };
}

export interface Renderer3DOptions {
  walkingEntities?: Record<string, boolean>;
  whisperingGhosts?: GhostId[];
  debatingGhosts?: GhostId[];
}

export class WorldRenderer3D {
  public canvas: HTMLCanvasElement;
  public isWebGLAvailable = false;
  public onContextLost?: () => void;

  private static activeInstance: WorldRenderer3D | null = null;

  public static getActiveRenderer(): WorldRenderer3D | null {
    return WorldRenderer3D.activeInstance;
  }

  public static setActiveRenderer(renderer: WorldRenderer3D | null): void {
    WorldRenderer3D.activeInstance = renderer;
  }

  private handleContextLost: (event: Event) => void;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // Éclairage Hygge 1800K
  private ambientLight: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private lampLights: THREE.PointLight[] = [];

  // Groupes d'objets
  private mapGroup: THREE.Group | null = null;
  private propsGroup: THREE.Group | null = null;
  private npcsGroup: THREE.Group | null = null;
  private playerMesh: THREE.Group | null = null;
  private ghostsGroup: THREE.Group | null = null;
  private fontaineWaters: THREE.Mesh[] = [];

  // Scène d'intérieur dédiée (Diorama 3D)
  private currentDiorama: InteriorDiorama | null = null;
  private interiorPlaceId: PlaceId | null = null;
  private interiorRoomId: string | null = null;

  // Cache/Pool de meshes pour éviter toute fuite mémoire GPU et réallocation à 60 FPS
  private npcMeshes: Map<string, THREE.Group> = new Map();
  private ghostMeshes: Map<GhostId, THREE.Group> = new Map();

  // Gestion de la caméra rotative
  public cameraQuarterTurn = 0; // 0: 45°, 1: 135°, 2: 225°, 3: 315°
  private currentCameraAngle = Math.PI / 4;
  private targetCameraAngle = Math.PI / 4;
  private cameraDistance = 18;
  private cameraHeight = 16;
  public isTopDown = false;

  // Suivi de la position fluide et de la résolution
  private camTarget = new THREE.Vector3(24, 0, 16);
  private playerAnimTimer = 0;
  private lastWidth = 0;
  private lastHeight = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    WorldRenderer3D.activeInstance = this;

    this.handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost! Signalement du repli Canvas 2D.');
      this.isWebGLAvailable = false;
      if (this.onContextLost) {
        this.onContextLost();
      }
    };

    if (this.canvas && typeof this.canvas.addEventListener === 'function') {
      this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
    }

    this.initWebGL();
  }

  public initHeadless(): void {
    if (!this.scene) {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(TOKENS.bg);
      this.scene.fog = new THREE.FogExp2(0x2a1a14, 0.018);
      const initialW = (this.canvas && this.canvas.clientWidth) || 800;
      const initialH = (this.canvas && this.canvas.clientHeight) || 600;
      this.lastWidth = initialW;
      this.lastHeight = initialH;
      const aspect = initialW / initialH;
      this.camera = new THREE.PerspectiveCamera(38, aspect, 0.5, 200);
      this.setupLighting();
      this.buildWorldGeometry();
    }
  }

  public initWebGL(): boolean {
    if (typeof window === 'undefined' || !this.canvas || typeof this.canvas.getContext !== 'function') {
      this.isWebGLAvailable = false;
      return false;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      const initialW = this.canvas.clientWidth || 800;
      const initialH = this.canvas.clientHeight || 600;
      this.lastWidth = initialW;
      this.lastHeight = initialH;
      this.renderer.setSize(initialW, initialH, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(TOKENS.bg);
      this.scene.fog = new THREE.FogExp2(0x2a1a14, 0.018);

      // Caméra perspective isométrique stylisée
      const aspect = initialW / initialH;
      this.camera = new THREE.PerspectiveCamera(38, aspect, 0.5, 200);

      this.setupLighting();
      this.buildWorldGeometry();
      this.isWebGLAvailable = true;
      return true;
    } catch (e) {
      console.warn('WebGL non disponible ou erreur d’initialisation Three.js, utilisation du fallback 2D Canvas.', e);
      this.isWebGLAvailable = false;
      return false;
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * ÉCLAIRAGE HYGGE & ATMOSPHÈRE
   * ───────────────────────────────────────────────────────────── */
  private setupLighting(): void {
    if (!this.scene) return;

    // Lumière ambiante chaude Hygge
    this.ambientLight = new THREE.AmbientLight(0xffd98a, 0.65);
    this.scene.add(this.ambientLight);

    // Hémisphère pour équilibre ciel chaleureux / sol boisé
    this.hemiLight = new THREE.HemisphereLight(0xffecd0, 0x5a3e28, 0.45);
    this.scene.add(this.hemiLight);

    // Soleil / Lune directionnel projetant des ombres douces
    this.sunLight = new THREE.DirectionalLight(0xfff0d0, 1.1);
    this.sunLight.position.set(30, 45, 25);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 120;
    this.sunLight.shadow.camera.left = -35;
    this.sunLight.shadow.camera.right = 35;
    this.sunLight.shadow.camera.top = 35;
    this.sunLight.shadow.camera.bottom = -35;
    this.scene.add(this.sunLight);
  }

  /* ─────────────────────────────────────────────────────────────
   * CONSTRUCTION DU MONDE 3D LOW-POLY
   * ───────────────────────────────────────────────────────────── */
  private buildWorldGeometry(): void {
    if (!this.scene) return;

    this.mapGroup = new THREE.Group();
    this.propsGroup = new THREE.Group();
    this.npcsGroup = new THREE.Group();
    this.ghostsGroup = new THREE.Group();

    // Matériaux stylisés low-poly avec palette chaleureuse
    const matPave = new THREE.MeshLambertMaterial({ color: 0xd6c4a8 });
    const matHerbe = new THREE.MeshLambertMaterial({ color: 0x6fb06a });
    const matTerre = new THREE.MeshLambertMaterial({ color: 0x9e724b });
    const matMur = new THREE.MeshLambertMaterial({ color: 0x4a3220 });
    const matToit = new THREE.MeshLambertMaterial({ color: 0xc25a40 });
    const matFenetre = new THREE.MeshBasicMaterial({ color: 0xffd98a });

    const tileGeo = new THREE.BoxGeometry(1, 0.2, 1);
    const wallGeo = new THREE.BoxGeometry(1, 2.2, 1);
    const roofGeo = new THREE.ConeGeometry(0.7, 0.9, 4);
    roofGeo.rotateY(Math.PI / 4);

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const t = tileAt(x, y);
        if (!t) continue;

        let mat = matPave;
        let elev = 0;

        if (t.kind === 'herbe') {
          mat = matHerbe;
          elev = 0.05;
        } else if (t.kind === 'terre') {
          mat = matTerre;
          elev = -0.02;
        }

        // Tuile de sol
        const tileMesh = new THREE.Mesh(tileGeo, mat);
        tileMesh.position.set(x, elev, y);
        tileMesh.receiveShadow = true;
        this.mapGroup.add(tileMesh);

        // Murs & Bâtiments
        if (t.kind === 'mur') {
          const wallMesh = new THREE.Mesh(wallGeo, matMur);
          wallMesh.position.set(x, 1.1 + elev, y);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          this.mapGroup.add(wallMesh);

          // Toiture décorative
          const roofMesh = new THREE.Mesh(roofGeo, matToit);
          roofMesh.position.set(x, 2.5 + elev, y);
          roofMesh.castShadow = true;
          this.mapGroup.add(roofMesh);

          // Fenêtres lumineuses sur certains murs extérieurs
          if ((x + y) % 3 === 0) {
            const winGeo = new THREE.PlaneGeometry(0.35, 0.45);
            const winMesh = new THREE.Mesh(winGeo, matFenetre);
            winMesh.position.set(x, 1.2, y + 0.51);
            this.mapGroup.add(winMesh);
          }
        }
      }
    }

    // Mobilier / Décors 3D Low-Poly
    this.buildProps();

    // Joueur low-poly
    this.playerMesh = this.createCharacterMesh(0x3a6ca8, 0xe8b888, 'Camille');
    this.scene.add(this.playerMesh);

    this.scene.add(this.mapGroup);
    this.scene.add(this.propsGroup);
    this.scene.add(this.npcsGroup);
    this.scene.add(this.ghostsGroup);
  }

  private buildProps(): void {
    if (!this.propsGroup || !this.scene) return;

    this.lampLights = [];
    this.fontaineWaters = [];

    const matTronc = new THREE.MeshLambertMaterial({ color: 0x5a3e28 });
    const matFeuilles = new THREE.MeshLambertMaterial({ color: 0x559e50 });
    const matBancBois = new THREE.MeshLambertMaterial({ color: 0x8a5a3a });
    const matMetal = new THREE.MeshLambertMaterial({ color: 0x2a1a14 });
    const matPierre = new THREE.MeshLambertMaterial({ color: 0x9a8f82 });
    const matEau = new THREE.MeshBasicMaterial({ color: 0x73eff7, transparent: true, opacity: 0.85 });
    const matLanterne = new THREE.MeshBasicMaterial({ color: 0xffd98a });

    for (const prop of DECORATIONS) {
      const g = new THREE.Group();
      g.position.set(prop.x, 0.1, prop.y);

      if (prop.id === 'arbre') {
        // Tronc
        const tronc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.6, 6), matTronc);
        tronc.position.y = 0.8;
        tronc.castShadow = true;
        g.add(tronc);

        // Feuillage polyédrique
        const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 1), matFeuilles);
        f1.position.y = 1.9;
        f1.castShadow = true;
        g.add(f1);

        const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), matFeuilles);
        f2.position.set(0.2, 2.5, -0.1);
        f2.castShadow = true;
        g.add(f2);
      } else if (prop.id === 'lampadaire') {
        // Poteau métal
        const poteau = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 6), matMetal);
        poteau.position.y = 1.2;
        poteau.castShadow = true;
        g.add(poteau);

        // Tête lanterne lumineuse
        const lanterne = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), matLanterne);
        lanterne.position.y = 2.4;
        g.add(lanterne);

        // Point light chaleureux pour la nuit / soir
        const pl = new THREE.PointLight(0xffd070, 0.9, 6.5, 1.5);
        pl.position.set(prop.x, 2.4, prop.y);
        this.scene.add(pl);
        this.lampLights.push(pl);
      } else if (prop.id === 'fontaine') {
        // Bassin pierre
        const bassin = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.5, 8), matPierre);
        bassin.position.y = 0.25;
        bassin.castShadow = true;
        g.add(bassin);

        // Eau scintillante
        const eau = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.05, 8), matEau);
        eau.position.y = 0.45;
        g.add(eau);
        this.fontaineWaters.push(eau);

        // Colonne centrale
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.9, 6), matPierre);
        col.position.y = 0.6;
        g.add(col);
      } else if (prop.id === 'banc') {
        // Pieds métal
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.6), matMetal);
        p1.position.set(-0.35, 0.18, 0);
        const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.6), matMetal);
        p2.position.set(0.35, 0.18, 0);
        g.add(p1, p2);

        // Assise & dossier bois
        const assise = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.5), matBancBois);
        assise.position.set(0, 0.35, 0);
        const dossier = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.06), matBancBois);
        dossier.position.set(0, 0.6, -0.22);
        g.add(assise, dossier);
      } else if (prop.id === 'jardiniere') {
        // Bac bois
        const bac = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.5), matBancBois);
        bac.position.y = 0.2;
        bac.castShadow = true;
        g.add(bac);

        // Fleurs colorées
        const fleurs = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 1), new THREE.MeshLambertMaterial({ color: 0xc25a40 }));
        fleurs.position.y = 0.45;
        g.add(fleurs);
      }

      this.propsGroup.add(g);
    }
  }

  private createCharacterMesh(bodyColor: number, skinColor: number, name: string): THREE.Group {
    const char = new THREE.Group();
    char.name = name;

    const matBody = new THREE.MeshLambertMaterial({ color: bodyColor });
    const matSkin = new THREE.MeshLambertMaterial({ color: skinColor });
    const matHair = new THREE.MeshLambertMaterial({ color: 0x4a3220 });

    // Corps / Buste
    const buste = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.3), matBody);
    buste.position.y = 0.6;
    buste.castShadow = true;
    char.add(buste);

    // Tête
    const tete = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), matSkin);
    tete.position.y = 1.15;
    tete.castShadow = true;
    char.add(tete);

    // Cheveux stylisés
    const cheveux = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.38), matHair);
    cheveux.position.y = 1.32;
    char.add(cheveux);

    // Jambes
    const jambeG = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.2), matBody);
    jambeG.name = 'jambeG';
    jambeG.position.set(-0.12, 0.2, 0);
    const jambeD = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.2), matBody);
    jambeD.name = 'jambeD';
    jambeD.position.set(0.12, 0.2, 0);
    char.add(jambeG, jambeD);

    return char;
  }

  private createGhostMesh(ghostId: GhostId): THREE.Group {
    const g = new THREE.Group();
    g.name = `ghost_${ghostId}`;

    const def = GHOST_DEFS_BY_ID[ghostId];
    const ghostColor = ghostId === 'marx' ? 0xc25a40 : ghostId === 'ostrom' ? 0x6fb06a : 0x7f9bd0;

    const matSpectral = new THREE.MeshLambertMaterial({
      color: ghostColor,
      transparent: true,
      opacity: 0.75,
      emissive: new THREE.Color(0xffd98a),
      emissiveIntensity: 0.35,
    });

    // Silhouette éthérée flottante
    const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 6, 12), matSpectral);
    corps.position.y = 1.3;
    g.add(corps);

    // Aura halo
    const aura = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), new THREE.MeshBasicMaterial({
      color: 0xffd98a,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    }));
    aura.position.y = 1.3;
    g.add(aura);

    return g;
  }

  /* ─────────────────────────────────────────────────────────────
   * GESTION DE LA CAMÉRA & CONTRÔLES
   * ───────────────────────────────────────────────────────────── */
  public rotateLeft(): void {
    this.targetCameraAngle -= Math.PI / 2;
    this.cameraQuarterTurn = (this.cameraQuarterTurn + 3) % 4;
  }

  public rotateRight(): void {
    this.targetCameraAngle += Math.PI / 2;
    this.cameraQuarterTurn = (this.cameraQuarterTurn + 1) % 4;
  }

  public setQuarterTurn(quarter: number): void {
    const q = ((quarter % 4) + 4) % 4;
    const diff = (q - this.cameraQuarterTurn + 4) % 4;
    if (diff === 1) {
      this.rotateRight();
    } else if (diff === 3) {
      this.rotateLeft();
    } else if (diff === 2) {
      this.rotateRight();
      this.rotateRight();
    }
  }

  public toggleTopDown(): void {
    this.isTopDown = !this.isTopDown;
  }

  public zoomIn(): void {
    this.cameraDistance = Math.max(8, this.cameraDistance - 2.5);
    this.cameraHeight = Math.max(7, this.cameraHeight - 2);
  }

  public zoomOut(): void {
    this.cameraDistance = Math.min(32, this.cameraDistance + 2.5);
    this.cameraHeight = Math.min(28, this.cameraHeight + 2);
  }

  /* ─────────────────────────────────────────────────────────────
   * GESTION DES SCÈNES D'INTÉRIEUR (DIORAMAS 3D)
   * ───────────────────────────────────────────────────────────── */
  public setInteriorScene(placeId: PlaceId, roomId: string): void {
    if (!this.scene) {
      this.initHeadless();
    }

    if (this.currentDiorama) {
      if (this.scene) {
        this.scene.remove(this.currentDiorama.roomGroup);
      }
      this.currentDiorama.dispose();
      this.currentDiorama = null;
    }

    this.currentDiorama = createInteriorDiorama(placeId, roomId);
    this.interiorPlaceId = placeId;
    this.interiorRoomId = roomId;

    if (this.scene) {
      this.scene.add(this.currentDiorama.roomGroup);
      if (this.mapGroup) this.mapGroup.visible = false;
      if (this.propsGroup) this.propsGroup.visible = false;
      if (this.npcsGroup) this.npcsGroup.visible = false;
    }
  }

  public clearInteriorScene(): void {
    if (this.currentDiorama) {
      if (this.scene) {
        this.scene.remove(this.currentDiorama.roomGroup);
      }
      this.currentDiorama.dispose();
      this.currentDiorama = null;
    }
    this.interiorPlaceId = null;
    this.interiorRoomId = null;

    if (this.scene) {
      if (this.mapGroup) this.mapGroup.visible = true;
      if (this.propsGroup) this.propsGroup.visible = true;
      if (this.npcsGroup) this.npcsGroup.visible = true;
    }
  }

  public getCurrentDiorama(): InteriorDiorama | null {
    return this.currentDiorama;
  }

  public getCurrentInterior(): { placeId: PlaceId; roomId: string } | null {
    return this.interiorPlaceId && this.interiorRoomId
      ? { placeId: this.interiorPlaceId, roomId: this.interiorRoomId }
      : null;
  }

  public isInteriorActive(): boolean {
    return this.currentDiorama !== null;
  }

  public getScene(): THREE.Scene | null {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera | null {
    return this.camera;
  }

  public getMapGroup(): THREE.Group | null {
    return this.mapGroup;
  }

  /* ─────────────────────────────────────────────────────────────
   * BOUCLE DE RENDU 3D
   * ───────────────────────────────────────────────────────────── */
  public render(world: WorldState, width: number, height: number, timeMs: number, opts: Renderer3DOptions = {}): void {
    if (!this.isWebGLAvailable || !this.renderer || !this.scene || !this.camera) return;

    // Mise à jour de la résolution uniquement si les dimensions logiques changent
    if (this.lastWidth !== width || this.lastHeight !== height) {
      this.lastWidth = width;
      this.lastHeight = height;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    const dt = 0.016;
    this.playerAnimTimer += dt * 6;

    // 1. Ajustement de l'ambiance lumineuse selon l'heure (Hygge 1800K)
    const minutes = minutesOfDay(world.time.tick);
    const isSoir = minutes >= 18 * 60 || minutes < 6 * 60;
    const isNuit = minutes >= 21 * 60 || minutes < 5 * 60;

    if (this.ambientLight && this.sunLight) {
      if (isNuit) {
        this.ambientLight.color.setHex(0x384068);
        this.ambientLight.intensity = 0.45;
        this.sunLight.color.setHex(0x5068a0);
        this.sunLight.intensity = 0.4;
      } else if (isSoir) {
        this.ambientLight.color.setHex(0xffaa60);
        this.ambientLight.intensity = 0.75;
        this.sunLight.color.setHex(0xff7722);
        this.sunLight.intensity = 1.0;
      } else {
        this.ambientLight.color.setHex(0xffd98a);
        this.ambientLight.intensity = 0.8;
        this.sunLight.color.setHex(0xfff5e0);
        this.sunLight.intensity = 1.15;
      }
    }

    // Lampadaires allumés le soir et la nuit
    const lampIntensity = isNuit ? 1.2 : isSoir ? 0.7 : 0.0;
    for (const pl of this.lampLights) {
      pl.intensity = lampIntensity;
    }

    // Eau fontaine oscillante
    const waterOffset = Math.sin(timeMs * 0.003) * 0.02;
    for (const w of this.fontaineWaters) {
      w.position.y = 0.45 + waterOffset;
    }

    // 2. Position et animation du joueur
    const px = world.player.pos.x;
    const py = world.player.pos.y;
    const isMoving = opts.walkingEntities?.player ?? false;

    if (this.playerMesh) {
      if (this.currentDiorama) {
        this.playerMesh.position.set(0, 0, 0);
      } else {
        this.playerMesh.position.x = px;
        this.playerMesh.position.z = py;
      }

      // Animation de marche low-poly
      if (isMoving && !this.currentDiorama) {
        this.playerMesh.position.y = Math.abs(Math.sin(this.playerAnimTimer)) * 0.12;
        const jg = this.playerMesh.getObjectByName('jambeG');
        const jd = this.playerMesh.getObjectByName('jambeD');
        if (jg && jd) {
          jg.rotation.x = Math.sin(this.playerAnimTimer) * 0.6;
          jd.rotation.x = -Math.sin(this.playerAnimTimer) * 0.6;
        }
      } else {
        this.playerMesh.position.y = 0;
        const jg = this.playerMesh.getObjectByName('jambeG');
        const jd = this.playerMesh.getObjectByName('jambeD');
        if (jg && jd) {
          jg.rotation.x = 0;
          jd.rotation.x = 0;
        }
      }
    }

    // 3. Mise à jour des PNJs (réutilisation des meshes en cache)
    if (this.npcsGroup && !this.currentDiorama) {
      for (const [id, npcDef] of Object.entries(NPC_BY_ID)) {
        let npcMesh = this.npcMeshes.get(id);
        if (!npcMesh) {
          const colInt = parseInt(npcDef.color.replace('#', ''), 16) || 0x7f9bd0;
          npcMesh = this.createCharacterMesh(colInt, 0xe8b888, npcDef.name);
          this.npcMeshes.set(id, npcMesh);
          this.npcsGroup.add(npcMesh);
        }
        const pos = npcPosition(world, id);
        npcMesh.position.set(pos.x, Math.sin(timeMs * 0.002 + pos.x) * 0.04, pos.y);
      }
    }

    // 4. Fantômes spectraux (réutilisation des meshes en cache)
    if (this.ghostsGroup && !this.currentDiorama) {
      const activeGhosts = [...(opts.whisperingGhosts || []), ...(opts.debatingGhosts || [])];
      for (const [gid, gm] of this.ghostMeshes.entries()) {
        if (!activeGhosts.includes(gid)) {
          gm.visible = false;
        }
      }
      activeGhosts.forEach((gid, i) => {
        let gm = this.ghostMeshes.get(gid);
        if (!gm) {
          gm = this.createGhostMesh(gid);
          this.ghostMeshes.set(gid, gm);
          this.ghostsGroup!.add(gm);
        }
        gm.visible = true;
        const angle = (i / Math.max(1, activeGhosts.length)) * Math.PI * 2 + timeMs * 0.001;
        const dist = 1.2;
        gm.position.set(px + Math.cos(angle) * dist, Math.sin(timeMs * 0.003 + i) * 0.25, py + Math.sin(angle) * dist);
      });
    }

    // 5. Mise à jour fluide de la caméra
    // Interpolation de l'angle
    this.currentCameraAngle += (this.targetCameraAngle - this.currentCameraAngle) * 0.1;
    if (this.currentDiorama) {
      // Dans la vue intérieure diorama, centrer sur le centre de la pièce (0, 0, 0)
      this.camTarget.x += (0 - this.camTarget.x) * 0.1;
      this.camTarget.z += (0 - this.camTarget.z) * 0.1;
    } else {
      // Suivi fluide du joueur
      this.camTarget.x += (px - this.camTarget.x) * 0.08;
      this.camTarget.z += (py - this.camTarget.z) * 0.08;
    }

    if (this.isTopDown) {
      this.camera.position.set(this.camTarget.x, this.cameraHeight * 1.5, this.camTarget.z);
      this.camera.lookAt(this.camTarget.x, 0, this.camTarget.z);
    } else {
      const cx = this.camTarget.x + Math.cos(this.currentCameraAngle) * this.cameraDistance;
      const cz = this.camTarget.z + Math.sin(this.currentCameraAngle) * this.cameraDistance;
      this.camera.position.set(cx, this.cameraHeight, cz);
      this.camera.lookAt(this.camTarget.x, 1.0, this.camTarget.z);
    }

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (e) {
      console.warn('Erreur durant le rendu Three.js WebGL, repli vers Canvas 2D:', e);
      this.isWebGLAvailable = false;
      if (this.onContextLost) {
        this.onContextLost();
      }
    }
  }

  public dispose(): void {
    if (this.canvas && typeof this.canvas.removeEventListener === 'function') {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    }
    this.clearInteriorScene();
    if (WorldRenderer3D.activeInstance === this) {
      WorldRenderer3D.activeInstance = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.npcMeshes.clear();
    this.ghostMeshes.clear();
    this.isWebGLAvailable = false;
  }
}
