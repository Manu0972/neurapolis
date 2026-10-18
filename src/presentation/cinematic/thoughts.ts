/**
 * Pensées du personnage (vague 7) : au début du chapitre 1, quelques bulles de pensée, une à la
 * fois, au-dessus de sa tête (« Purée, j'ai même pas d'argent… »). Puis la première voix répond
 * dans sa tête : un petit fantôme kawaii qui parle (bouche au rythme du texte).
 */
import { ghostAvatar, speak, thinkerMeta } from '../ghost-avatar';

export interface ThoughtsScript {
  thoughts: string[];
  voice: { ghost: string; text: string };
}

const CSS = `
.thoughts { position: absolute; inset: 0; z-index: 60; display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: auto; cursor: pointer; background: radial-gradient(ellipse at 50% 55%, rgba(42, 26, 20, 0) 30%, rgba(42, 26, 20, 0.45) 100%); }
.thought { position: relative; margin-bottom: 18vh; max-width: min(520px, calc(100vw - 48px)); background: #fbf3e2; color: #2a1a14;
  border: 3px solid #2a1a14; border-radius: 40px; padding: 16px 22px; font-size: clamp(16px, 2vw, 20px); line-height: 1.45;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25); font-style: italic; opacity: 0; transform: translateY(8px) scale(0.96); transition: opacity 0.35s, transform 0.35s; }
.thought.in { opacity: 1; transform: none; }
.thought::before, .thought::after { content: ''; position: absolute; background: #fbf3e2; border: 3px solid #2a1a14; border-radius: 50%; }
.thought::before { width: 22px; height: 22px; left: 46%; bottom: -30px; }
.thought::after { width: 12px; height: 12px; left: 49%; bottom: -50px; }
.thought-who { display: block; font-size: 12px; font-style: normal; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #8a5a3a; margin-bottom: 4px; }
.voice { display: flex; align-items: center; gap: 12px; margin-bottom: 14vh; width: min(600px, calc(100vw - 32px)); opacity: 0; transition: opacity 0.4s; }
.voice.in { opacity: 1; }
.voice .gk { flex: none; width: clamp(96px, 13vw, 128px); height: auto; filter: drop-shadow(0 0 12px rgba(255, 217, 138, 0.55)); }
.voice-bubble { flex: 1; background: #e8d6b0; color: #2a1a14; border: 3px solid var(--gc, #ffd98a); border-radius: 18px 18px 18px 6px; padding: 12px 14px;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25); }
.voice-name { font-weight: 800; font-size: 13px; color: #6b4a2f; }
.voice-head { font-size: 12px; opacity: 0.75; margin-left: 6px; }
.voice-text { margin: 4px 0 8px; font-size: 16px; line-height: 1.45; min-height: 3em; }
.voice-actions { display: flex; justify-content: flex-end; }
.thoughts-hint { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); font-size: 12px; color: #f9ecd0; opacity: 0.7; text-shadow: 0 1px 2px #000; }
@media (prefers-reduced-motion: reduce) { .thought, .voice { transition: none; } }
`;
let cssDone = false;
function ensureCss(): void {
  if (cssDone) return;
  cssDone = true;
  const st = document.createElement('style');
  st.dataset.owner = 'thoughts';
  st.textContent = CSS;
  document.head.appendChild(st);
}

/** Durée de lecture d'une pensée (ms) : assez pour lire, pas trop pour ne pas lasser. */
export function thoughtMs(text: string): number {
  return Math.round(Math.min(7000, 1600 + text.length * 50));
}

/** Joue les pensées puis la voix ; `done` une seule fois à la fin (ou si on passe). */
export function playThoughts(host: HTMLElement, script: ThoughtsScript, done: () => void): void {
  ensureCss();
  const root = document.createElement('div');
  root.className = 'thoughts';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Pensées');
  const hint = document.createElement('div');
  hint.className = 'thoughts-hint';
  hint.textContent = 'Clic ou Espace : suite';
  root.appendChild(hint);
  host.appendChild(root);
  let i = -1;
  let timer: number | undefined;
  let finished = false;
  let stopTalk: (() => void) | null = null;
  let talking = false;

  const finish = (): void => {
    if (finished) return;
    finished = true;
    if (timer !== undefined) window.clearTimeout(timer);
    window.removeEventListener('keydown', onKey, true);
    root.remove();
    done();
  };

  const showVoice = (): void => {
    root.replaceChildren(hint);
    const m = thinkerMeta(script.voice.ghost);
    const box = document.createElement('div');
    box.className = 'voice';
    box.style.setProperty('--gc', m.color);
    const face = ghostAvatar(script.voice.ghost, 'joie', 128);
    box.appendChild(face);
    const bubble = document.createElement('div');
    bubble.className = 'voice-bubble';
    const name = document.createElement('div');
    name.className = 'voice-name';
    name.textContent = m.name;
    const head = document.createElement('span');
    head.className = 'voice-head';
    head.textContent = '· une voix dans ta tête';
    name.appendChild(head);
    const text = document.createElement('p');
    text.className = 'voice-text';
    const row = document.createElement('div');
    row.className = 'voice-actions';
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'ph-btn primary';
    ok.textContent = 'D’accord !';
    ok.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
    row.appendChild(ok);
    bubble.append(name, text, row);
    box.appendChild(bubble);
    root.appendChild(box);
    requestAnimationFrame(() => box.classList.add('in'));
    talking = true;
    stopTalk = speak(face, text, script.voice.text, { onDone: () => { talking = false; } });
  };

  const next = (): void => {
    if (timer !== undefined) window.clearTimeout(timer);
    if (i >= script.thoughts.length) {
      // Pendant la voix : un premier clic termine la phrase, le suivant ferme.
      if (talking) { stopTalk?.(); return; }
      finish();
      return;
    }
    i += 1;
    if (i >= script.thoughts.length) { showVoice(); return; }
    root.replaceChildren(hint);
    const b = document.createElement('div');
    b.className = 'thought';
    const who = document.createElement('span');
    who.className = 'thought-who';
    who.textContent = '💭 dans ta tête';
    b.append(who, document.createTextNode(script.thoughts[i]!));
    root.appendChild(b);
    requestAnimationFrame(() => b.classList.add('in'));
    timer = window.setTimeout(next, thoughtMs(script.thoughts[i]!));
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); next(); }
    else if (e.code === 'Escape' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); }
  };
  window.addEventListener('keydown', onKey, true);
  root.addEventListener('click', next);
  next();
}
