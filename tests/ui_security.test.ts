import { describe, expect, it } from 'vitest';
import { escapeHtml, showGhostAdvicePopup } from '../src/presentation/ui';

describe('UI Security - XSS Prevention', () => {
  it('escapeHtml correctly escapes special HTML characters', () => {
    const maliciousInput = '<script>alert("XSS & \'attack\'")</script>';
    const sanitized = escapeHtml(maliciousInput);
    expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS &amp; &#039;attack&#039;&quot;)&lt;/script&gt;');
  });

  it('showGhostAdvicePopup sanitizes speaker, text, and emoticon against XSS', () => {
    (globalThis as any).window = globalThis;
    const mockBubble = {
      innerHTML: '',
      classList: {
        remove: () => {},
        add: () => {},
      },
    };
    const mockUi = {
      ghostAdviceBubbleEl: mockBubble,
      ghostAdviceTimer: undefined,
    } as any;

    showGhostAdvicePopup(
      mockUi,
      '<b onmouseover=alert(1)>Ghost</b>',
      '<img src=x onerror=alert(2) />',
      '<svg/onload=alert(3)>',
    );

    expect(mockBubble.innerHTML).toContain('&lt;b onmouseover=alert(1)&gt;Ghost&lt;/b&gt;');
    expect(mockBubble.innerHTML).toContain('&lt;img src=x onerror=alert(2) /&gt;');
    expect(mockBubble.innerHTML).toContain('&lt;svg/onload=alert(3)&gt;');
    expect(mockBubble.innerHTML).not.toContain('<script>');
    expect(mockBubble.innerHTML).not.toContain('<img src=x');
  });
});
