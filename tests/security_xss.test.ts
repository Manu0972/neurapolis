import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/presentation/ui';

describe('Security: HTML Sanitization (XSS Prevention)', () => {
  it('escapes standard HTML special characters', () => {
    const dangerousInput = '<script>alert("XSS")</script>&\'"';
    const escaped = escapeHtml(dangerousInput);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&amp;&#39;&quot;');
  });

  it('handles harmless text without modification', () => {
    const input = 'Adam Smith - Conseiller';
    expect(escapeHtml(input)).toBe('Adam Smith - Conseiller');
  });

  it('converts non-string inputs safely to string and escapes them', () => {
    expect(escapeHtml(123 as unknown as string)).toBe('123');
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });
});
