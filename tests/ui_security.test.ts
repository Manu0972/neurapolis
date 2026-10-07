import { describe, expect, it, beforeEach } from 'vitest';
import { escapeHtml, showGhostAdvicePopup, buildUi, updateHud } from '../src/presentation/ui';
import { createWorld } from '../src/core/store';

function setupDomMock(): { container: HTMLElement } {
  const createMockElement = (tagName: string): any => {
    const children: any[] = [];
    const classListSet = new Set<string>();
    const elemListeners: Record<string, Function[]> = {};
    const styleObj: Record<string, string> = { display: 'block' };

    const elem: any = {
      tagName: tagName.toUpperCase(),
      className: '',
      textContent: '',
      title: '',
      style: styleObj,
      dataset: {},
      clientWidth: 800,
      clientHeight: 600,
      width: 800,
      height: 600,
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
      querySelector: (selector: string) => {
        const matchClass = selector.startsWith('.') ? selector.slice(1) : null;
        let found: any = null;
        const search = (node: any) => {
          if (found) return;
          if (matchClass && (node.className?.includes(matchClass) || node.classList?.contains(matchClass))) {
            found = node;
            return;
          }
          if (node.children) {
            for (const c of node.children) search(c);
          }
        };
        for (const c of children) search(c);
        return found;
      },
      children,
      addEventListener: (event: string, handler: Function) => {
        if (!elemListeners[event]) elemListeners[event] = [];
        elemListeners[event].push(handler);
      },
      removeEventListener: (event: string, handler: Function) => {
        if (!elemListeners[event]) return;
        elemListeners[event] = elemListeners[event].filter((fn: Function) => fn !== handler);
      },
      getContext: (type: string) => {
        if (type === '2d') {
          return {
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            clearRect: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            beginPath: () => {},
            closePath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            arc: () => {},
            ellipse: () => {},
            fill: () => {},
            stroke: () => {},
            fillText: () => {},
            measureText: () => ({ width: 10 }),
            drawImage: () => {},
            createRadialGradient: () => ({ addColorStop: () => {} }),
            createLinearGradient: () => ({ addColorStop: () => {} }),
            setTransform: () => {},
            canvas: elem,
          };
        }
        return null;
      },
    };
    return elem;
  };

  (globalThis as any).document = {
    createElement: (tag: string) => createMockElement(tag),
  };
  (globalThis as any).window = {
    ...globalThis,
    devicePixelRatio: 1,
  };

  const container = createMockElement('div');
  return { container };
}

describe('UI Security & XSS Prevention', () => {
  beforeEach(() => {
    setupDomMock();
  });

  it('escapeHtml correctly escapes HTML special characters', () => {
    const malicious = `<script>alert('XSS "test" & <foo>')</script>`;
    const escaped = escapeHtml(malicious);
    expect(escaped).toBe('&lt;script&gt;alert(&#39;XSS &quot;test&quot; &amp; &lt;foo&gt;&#39;)&lt;/script&gt;');
  });

  it('showGhostAdvicePopup sanitizes dynamic input before innerHTML insertion', () => {
    const { container } = setupDomMock();
    const ui = buildUi(container);

    const xssSpeaker = `<img src=x onerror=alert('speaker')>`;
    const xssText = `<script>alert('text')</script>`;
    const xssEmoticon = `<b onmouseover=alert(1)>👻</b>`;

    showGhostAdvicePopup(ui, xssSpeaker, xssText, xssEmoticon);

    const innerHtml = ui.ghostAdviceBubbleEl.innerHTML;
    expect(innerHtml).not.toContain('<script>');
    expect(innerHtml).not.toContain('<img src=x');
    expect(innerHtml).toContain('&lt;script&gt;alert(&#39;text&#39;)&lt;/script&gt;');
    expect(innerHtml).toContain('&lt;img src=x onerror=alert(&#39;speaker&#39;)&gt;');
    expect(innerHtml).toContain('&lt;b onmouseover=alert(1)&gt;👻&lt;/b&gt;');
  });

  it('updateHud sanitizes ghostCompanion fields before innerHTML insertion', () => {
    const { container } = setupDomMock();
    const ui = buildUi(container);
    const world = createWorld();

    world.ghostCompanion = {
      activeGhostId: 'lucien',
      mood: `<script>alert('mood')</script>` as any,
      speechBubble: 'Bonjour',
      lastAdviceTick: 0,
      unlockedThinkers: ['lucien'],
    };

    updateHud(ui, world, '');

    const innerHtml = ui.ghostCompanionWidgetEl.innerHTML;
    expect(innerHtml).not.toContain('<script>');
    expect(innerHtml).toContain('&lt;script&gt;alert(&#39;mood&#39;)&lt;/script&gt;');
  });
});
