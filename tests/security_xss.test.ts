import { describe, expect, it } from 'vitest';
import { escapeHtml, NEED_IDS, showGhostAdvicePopup, updateHud, type UiRefs } from '../src/presentation/ui';
import { createWorld } from '../src/core/store';

if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    clearTimeout: (id: any) => clearTimeout(id),
    setTimeout: (fn: any, ms: any) => setTimeout(fn, ms),
  };
}

function createMockElement() {
  let html = '';
  return {
    get innerHTML() {
      return html;
    },
    set innerHTML(val: string) {
      html = val;
    },
    classList: {
      remove() {},
      add() {},
      toggle() {},
    },
    dataset: {},
    style: {},
    title: '',
    textContent: '',
    querySelector() {
      return createMockElement();
    },
  };
}

describe('Security - XSS Prevention', () => {
  it('escapes HTML special characters correctly', () => {
    const malicious = '<script>alert("xss")</script> & "quotes" \'single\'';
    const safe = escapeHtml(malicious);
    expect(safe).not.toContain('<script>');
    expect(safe).not.toContain('</script>');
    expect(safe).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &quot;quotes&quot; &#39;single&#39;');
  });

  it('sanitizes input in showGhostAdvicePopup', () => {
    const ghostAdviceBubbleEl = createMockElement();
    const dummyUi = {
      ghostAdviceBubbleEl,
      ghostAdviceTimer: undefined,
    } as unknown as UiRefs;

    const xssSpeaker = '<img src=x onerror=alert(1)>';
    const xssText = '<svg onload=alert(2)></svg>';
    const xssEmoticon = '"><script>alert(3)</script>';

    showGhostAdvicePopup(dummyUi, xssSpeaker, xssText, xssEmoticon);

    const html = ghostAdviceBubbleEl.innerHTML;
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<svg onload=alert(2)></svg>');
    expect(html).not.toContain('<script>alert(3)</script>');

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;svg onload=alert(2)&gt;&lt;/svg&gt;');
  });

  it('sanitizes ghost companion mood and name in updateHud', () => {
    const ghostCompanionWidgetEl = createMockElement();
    const clockEl = createMockElement();
    const dateEl = createMockElement();
    const moneyEl = createMockElement();
    const newsTickerEl = createMockElement();
    const campaignChapterEl = createMockElement();
    const campaignObjectiveEl = createMockElement();
    const campaignPromptEl = createMockElement();
    const promptEl = createMockElement();
    const saveEl = createMockElement();

    const barEls = {} as any;
    for (const id of NEED_IDS) {
      barEls[id] = createMockElement();
    }

    const dummyUi = {
      clockEl,
      dateEl,
      moneyEl,
      newsTickerEl,
      ghostCompanionWidgetEl,
      campaignChapterEl,
      campaignObjectiveEl,
      campaignPromptEl,
      barEls,
      promptEl,
      saveEl,
      lastIso: '',
    } as unknown as UiRefs;

    const w = createWorld();
    w.ghostCompanion = {
      activeGhostId: 'smith',
      mood: '"><iframe src="javascript:alert(1)">' as any,
      speechBubble: 'Hello',
      lastAdviceTick: 0,
      unlockedThinkers: ['smith'],
    };

    updateHud(dummyUi, w, '');

    const html = ghostCompanionWidgetEl.innerHTML;
    expect(html).not.toContain('<iframe');
    expect(html).toContain('&quot;&gt;&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;');
  });
});
