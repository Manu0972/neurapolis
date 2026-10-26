import { describe, expect, it } from 'vitest';
import { escapeHtml, showGhostAdvicePopup, updateHud, buildUi } from '../src/presentation/ui';
import { createWorld } from '../src/core/store';
import { ghostAvatar, duoAvatar, ghostSvgMarkup } from '../src/presentation/ghost-avatar';

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

  it('safely builds E2E panel DOM elements', () => {
    const steps = [
      { name: 'Étape 1 <script>alert(1)</script>', ok: true, detail: 'OK' },
      { name: 'Étape 2', ok: false, detail: '<img src=x onerror=alert(2)>' },
    ];
    const ok = steps.every((s) => s.ok);

    const createdElements: Array<{ tag: string; textContent?: string }> = [];
    const mockDocument = {
      createElement: (tag: string) => {
        const el: any = {
          tag,
          className: '',
          style: {},
          children: [] as any[],
          appendChild(child: any) {
            this.children.push(child);
            return child;
          },
        };
        createdElements.push(el);
        return el;
      },
      createTextNode: (text: string) => {
        const node = { text };
        createdElements.push({ tag: '#text', textContent: text });
        return node;
      },
      body: {
        appendChild: () => {},
      },
    };

    const panel = mockDocument.createElement('div');
    panel.className = 'e2e-report';
    const statusB = mockDocument.createElement('b');
    statusB.textContent = ok ? '✅ E2E réussi' : '❌ E2E en échec';
    panel.appendChild(statusB);
    panel.appendChild(mockDocument.createTextNode(` — ${steps.filter((s) => s.ok).length}/${steps.length} étapes`));

    expect(statusB.textContent).toBe('❌ E2E en échec');
    expect(createdElements.some((e) => e.textContent?.includes(' — 1/2 étapes'))).toBe(true);
  });

  it('safely builds ghost SVG avatars without raw innerHTML vulnerability', () => {
    const maliciousId = 'custom_<script>alert(1)</script>';
    const svgMarkup = ghostSvgMarkup(maliciousId, 'calme', 64);
    expect(svgMarkup).not.toContain('<script>');
    expect(svgMarkup).toContain('aria-label="custom_&lt;script&gt;alert(1)&lt;/script&gt;"');
    expect(svgMarkup).toContain('data-ghost="custom_&lt;script&gt;alert(1)&lt;/script&gt;"');

    const svgEl = ghostAvatar(maliciousId, 'calme', 64);
    expect(svgEl).toBeDefined();
  });

  it('safely builds duo SVG avatars with escaped aria-labels', () => {
    const idA = 'thinker_<a href="javascript:alert(1)">a</a>';
    const idB = 'thinker_b';
    const svgMarkup = ghostSvgMarkup(idA, 'calme', 64);
    expect(svgMarkup).not.toContain('<a href="javascript:alert(1)">');
    expect(svgMarkup).toContain('&lt;a href=&quot;javascript:alert(1)&quot;&gt;');

    const duoEl = duoAvatar(idA, idB, 'calme', 96);
    expect(duoEl).toBeDefined();
  });
});
