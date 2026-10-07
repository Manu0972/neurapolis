/** Écran d’accueil : reprise fiable de l’auto-sauvegarde ou nouvelle partie. */
import { createWorld } from '../core/store';
import { createCustomWorld } from '../core/player_customization';
import type { WorldState } from '../core/types';
import { inspectAutoSave, saveToSlot, loadFromSlot, PENDING_LOAD_KEY } from '../saves/persist';
import { startGame } from './game';
import { mountCharacterCreation } from './character-creator';
import { TitleFlyover } from './city3d/TitleFlyover';

/** Survol 3D de la ville derrière le menu ; un seul à la fois, libéré avant de jouer. */
let flyover: TitleFlyover | null = null;
function stopFlyover(): void {
  flyover?.dispose();
  flyover = null;
}

function button(label: string, primary = false): HTMLButtonElement {
  const element = document.createElement('button');
  element.className = primary ? 'start-button primary' : 'start-button';
  element.type = 'button';
  element.textContent = label;
  return element;
}

export function mountStartScreen(root: HTMLElement): void {
  root.replaceChildren();

  const panel = document.createElement('main');
  panel.className = 'start-screen';
  panel.setAttribute('aria-labelledby', 'start-title');
  const card = document.createElement('section');
  card.className = 'start-card';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'start-eyebrow';
  eyebrow.textContent = 'UNE VILLE, DES CHOIX, DES CONSÉQUENCES';
  const title = document.createElement('h1');
  title.id = 'start-title';
  title.textContent = 'NEURAPOLIS';
  const subtitle = document.createElement('p');
  subtitle.className = 'start-subtitle';
  subtitle.textContent = 'Grandis dans un quartier qui change avec toi.';
  card.append(eyebrow, title, subtitle);

  const status = document.createElement('p');
  status.className = 'start-status';
  status.setAttribute('role', 'status');
  card.appendChild(status);

  // Chargement demandé depuis le menu Sauvegardes : on reprend directement l'emplacement choisi.
  let pending: string | null = null;
  try {
    pending = sessionStorage.getItem(PENDING_LOAD_KEY);
    sessionStorage.removeItem(PENDING_LOAD_KEY);
  } catch { /* stockage de session indisponible */ }
  if (pending) {
    try {
      const loaded = loadFromSlot(pending);
      saveToSlot('auto', loaded);
      stopFlyover();
      startGame(root, loaded);
      return;
    } catch (err) {
      status.textContent = `Chargement impossible : ${err instanceof Error ? err.message : String(err)}`;
      status.classList.add('error');
    }
  }

  const titleCanvas = document.createElement('canvas');
  titleCanvas.className = 'title-canvas';
  root.prepend(titleCanvas);
  stopFlyover();
  try {
    flyover = new TitleFlyover(titleCanvas);
    if (!flyover.available) { stopFlyover(); titleCanvas.remove(); }
  } catch {
    stopFlyover();
    titleCanvas.remove();
  }

  const autoSave = inspectAutoSave();
  const savedWorld: WorldState | undefined = autoSave.kind === 'ready' ? autoSave.world : undefined;
  const hasAutoSave = autoSave.kind === 'ready' || autoSave.kind === 'invalid';
  if (autoSave.kind === 'invalid') {
    status.textContent = `La sauvegarde n’a pas pu être chargée : ${autoSave.message}`;
    status.classList.add('error');
  } else if (autoSave.kind === 'unavailable') {
    status.textContent = 'Le stockage local est indisponible : la reprise automatique ne sera pas possible.';
    status.classList.add('error');
  }

  if (savedWorld) {
    const resume = button('Reprendre la partie', true);
    resume.addEventListener('click', () => {
      try {
        saveToSlot('auto', savedWorld as WorldState); // persiste aussi la migration éventuelle
      } catch {
        status.textContent = 'Sauvegarde locale indisponible : la partie reprendra sans mise à jour du fichier.';
        status.classList.add('error');
      }
      stopFlyover();
      startGame(root, savedWorld);
    });
    card.appendChild(resume);
  }

  const fresh = button(savedWorld ? 'Nouvelle partie' : 'Commencer');
  fresh.addEventListener('click', () => {
    if (hasAutoSave && !window.confirm('La nouvelle partie remplacera la sauvegarde automatique existante. Continuer ?')) return;
    stopFlyover();
    mountCharacterCreation(
      root,
      (customization) => {
        const world: WorldState = createCustomWorld({ customization });
        try {
          saveToSlot('auto', world);
        } catch {
          status.textContent = 'La sauvegarde locale est indisponible. Tu peux jouer, mais la reprise automatique ne sera pas possible.';
          status.classList.add('error');
        }
        startGame(root, world);
      },
      () => {
        mountStartScreen(root);
      }
    );
  });
  card.appendChild(fresh);

  if (autoSave.kind === 'invalid') {
    const note = document.createElement('p');
    note.className = 'start-note';
    note.textContent = 'Commencer une nouvelle partie remplacera cette sauvegarde invalide.';
    card.appendChild(note);
  } else if (autoSave.kind === 'missing') {
    const note = document.createElement('p');
    note.className = 'start-note';
    note.textContent = 'La progression est enregistrée automatiquement en fin de journée.';
    card.appendChild(note);
  }

  panel.appendChild(card);
  root.appendChild(panel);
}
