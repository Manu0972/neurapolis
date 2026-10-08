import { describe, expect, it } from 'vitest';
import { escapeHtml, showGhostAdvicePopup, type UiRefs } from '../src/presentation/ui';

describe('Security - XSS Prevention and HTML Sanitization', () => {
  it('escapeHtml correctly escapes special HTML characters', () => {
    const maliciousInput = '<script>alert("XSS")</script> & "quotes" \'single\'';
    const escaped = escapeHtml(maliciousInput);

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&quot;quotes&quot;');
    expect(escaped).toContain('&#039;single&#039;');
  });

  it('showGhostAdvicePopup escapes speaker, text, and emoticon before innerHTML assignment', () => {
    const mockAdviceEl = {
      innerHTML: '',
      classList: {
        remove: () => {},
        add: () => {},
      },
    } as unknown as HTMLElement;

    const mockUi = {
      ghostAdviceBubbleEl: mockAdviceEl,
    } as UiRefs;

    const speaker = '<img src=x onerror=alert(1)>';
    const text = 'Conseil : <script>alert("evil")</script>';
    const emoticon = '<b class="bad">💡</b>';

    showGhostAdvicePopup(mockUi, speaker, text, emoticon);

    expect(mockAdviceEl.innerHTML).not.toContain('<img src=x onerror=alert(1)>');
    expect(mockAdviceEl.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(mockAdviceEl.innerHTML).not.toContain('<script>');
    expect(mockAdviceEl.innerHTML).toContain('&lt;script&gt;alert(&quot;evil&quot;)&lt;/script&gt;');
    expect(mockAdviceEl.innerHTML).not.toContain('<b class="bad">');
    expect(mockAdviceEl.innerHTML).toContain('&lt;b class=&quot;bad&quot;&gt;');
  });
});
