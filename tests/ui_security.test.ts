import { describe, it, expect } from 'vitest';
import { escapeHtml, showGhostAdvicePopup, updateHud, type UiRefs } from '../src/presentation/ui';
import { createWorld } from '../src/core/store';

// Helper pour simuler un élément HTML minimaliste sans dépendre d'un environnement DOM lourd
function makeMockElement(tagName = 'div'): HTMLElement {
  const children: HTMLElement[] = [];
  const element: Partial<HTMLElement> = {
    tagName: tagName.toUpperCase(),
    className: '',
    style: {} as CSSStyleDeclaration,
    innerHTML: '',
    textContent: '',
    classList: {
      add: (cls: string) => {
        if (!element.className?.includes(cls)) {
          element.className = (element.className + ' ' + cls).trim();
        }
      },
      remove: (cls: string) => {
        element.className = element.className?.replace(cls, '').trim() || '';
      },
      toggle: (cls: string, force?: boolean) => {
        const has = element.className?.includes(cls);
        const shouldHave = force !== undefined ? force : !has;
        if (shouldHave && !has) element.classList?.add(cls);
        if (!shouldHave && has) element.classList?.remove(cls);
        return !!element.className?.includes(cls);
      },
      contains: (cls: string) => !!element.className?.includes(cls),
    } as any,
    dataset: {},
    appendChild: <T extends Node>(child: T): T => {
      children.push(child as any);
      return child;
    },
    querySelector: <E extends Element = Element>(selector: string): E | null => {
      const cls = selector.replace('.', '');
      return (children.find((c) => c.className.includes(cls)) as any) || null;
    },
    setAttribute: () => {},
    addEventListener: () => {},
  };
  return element as HTMLElement;
}

// Global window & document mock
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    clearTimeout: () => {},
    setTimeout: (() => 100) as any,
  };
}

if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        const c = makeMockElement('canvas') as any;
        c.getContext = () => ({
          setTransform: () => {},
        });
        return c;
      }
      return makeMockElement(tag);
    },
  };
}

describe('UI Security & HTML Sanitization', () => {
  it('correctly escapes special HTML characters', () => {
    const unsafe = `<script>alert("xss")</script> & ' quote "`;
    const safe = escapeHtml(unsafe);
    expect(safe).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39; quote &quot;');
  });

  describe('DOM-based XSS Prevention', () => {
    it('sanitizes speaker and text parameters in showGhostAdvicePopup', () => {
      const ghostAdviceBubbleEl = makeMockElement('div');
      const ui = { ghostAdviceBubbleEl } as unknown as UiRefs;

      const maliciousSpeaker = '<img src=x onerror=alert(1)>';
      const maliciousText = '<script>alert("xss")</script>';

      showGhostAdvicePopup(ui, maliciousSpeaker, maliciousText);

      expect(ui.ghostAdviceBubbleEl.innerHTML).not.toContain('<img src=x');
      expect(ui.ghostAdviceBubbleEl.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(ui.ghostAdviceBubbleEl.innerHTML).not.toContain('<script>');
      expect(ui.ghostAdviceBubbleEl.innerHTML).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('sanitizes ghostCompanion mood and name in updateHud', () => {
      const ghostCompanionWidgetEl = makeMockElement('div');
      const clockEl = makeMockElement('div');
      const dateEl = makeMockElement('div');
      const moneyEl = makeMockElement('div');
      const newsTickerEl = makeMockElement('div');
      const campaignChapterEl = makeMockElement('div');
      const campaignObjectiveEl = makeMockElement('div');
      const campaignPromptEl = makeMockElement('div');
      const promptEl = makeMockElement('div');
      const saveEl = makeMockElement('div');
      const barEls = {
        fatigue: makeMockElement('div'),
        faim: makeMockElement('div'),
        stress: makeMockElement('div'),
        moral: makeMockElement('div'),
      };

      const ui = {
        ghostCompanionWidgetEl,
        clockEl,
        dateEl,
        moneyEl,
        newsTickerEl,
        campaignChapterEl,
        campaignObjectiveEl,
        campaignPromptEl,
        promptEl,
        saveEl,
        barEls,
        lastIso: '',
      } as unknown as UiRefs;

      const world = createWorld();
      world.ghostCompanion = {
        activeGhostId: 'smith',
        mood: '<svg/onload=alert(1)>' as any,
        speechBubble: 'Test',
        lastAdviceTick: 0,
        unlockedThinkers: ['smith'],
      };

      updateHud(ui, world, '');

      expect(ui.ghostCompanionWidgetEl.innerHTML).not.toContain('<svg');
      expect(ui.ghostCompanionWidgetEl.innerHTML).toContain('&lt;svg/onload=alert(1)&gt;');
    });
  });
});
