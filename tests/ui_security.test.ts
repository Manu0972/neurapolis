import { describe, expect, it } from 'vitest';
import { escapeHtml, showGhostAdvicePopup, updateHud, buildUi } from '../src/presentation/ui';
import { createWorld } from '../src/core/store';

describe('UI Security & XSS Prevention (escapeHtml)', () => {
  it('correctly escapes special HTML characters', () => {
    const input = '<script>alert("XSS & hack\'d")</script>';
    const escaped = escapeHtml(input);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS &amp; hack&#039;d&quot;)&lt;/script&gt;');
  });

  it('handles strings with no special HTML characters without modification', () => {
    const input = 'Normal Text 123 !';
    expect(escapeHtml(input)).toBe(input);
  });

  it('sanitizes user input in showGhostAdvicePopup', () => {
    const mockAdviceEl = { innerHTML: '', classList: { remove: () => {}, add: () => {} } } as any;
    const ui = { ghostAdviceBubbleEl: mockAdviceEl } as any;

    showGhostAdvicePopup(
      ui,
      '<img src=x onerror=alert(1)>',
      'Advice with <script>alert(2)</script>',
      '👻<svg onload=alert(3)>'
    );

    const bubbleHtml = mockAdviceEl.innerHTML;
    expect(bubbleHtml).not.toContain('<img src=x onerror=alert(1)>');
    expect(bubbleHtml).not.toContain('<script>alert(2)</script>');
    expect(bubbleHtml).not.toContain('<svg onload=alert(3)>');
    expect(bubbleHtml).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(bubbleHtml).toContain('Advice with &lt;script&gt;alert(2)&lt;/script&gt;');
  });

  it('sanitizes ghost companion mood and name in updateHud', () => {
    const mockWidgetEl = { innerHTML: '', title: '' } as any;
    const ui = {
      ghostCompanionWidgetEl: mockWidgetEl,
      clockEl: { textContent: '' },
      dateEl: { textContent: '' },
      moneyEl: { textContent: '' },
      weatherEl: { textContent: '' },
      bizEl: { textContent: '', classList: { toggle: () => {} } },
      newsTickerEl: { textContent: '' },
      campaignChapterEl: { textContent: '' },
      campaignObjectiveEl: { textContent: '' },
      campaignPromptEl: { textContent: '' },
      barEls: {},
      promptEl: { textContent: '', classList: { toggle: () => {} } },
      saveEl: { classList: { remove: () => {} } },
      lastIso: '',
    } as any;

    const world = createWorld();
    world.ghostCompanion = {
      activeGhostId: 'mamy_blue',
      mood: '<iframe src="javascript:alert(1)">' as any,
      speechBubble: 'Test',
      lastAdviceTick: 0,
      unlockedThinkers: ['mamy_blue'],
    };

    updateHud(ui, world, '');

    const widgetHtml = mockWidgetEl.innerHTML;
    expect(widgetHtml).not.toContain('<iframe src="javascript:alert(1)">');
    expect(widgetHtml).toContain('&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;');
  });
});
