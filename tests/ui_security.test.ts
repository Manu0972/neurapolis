import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/presentation/ui';

describe('ui_security escapeHtml', () => {
  it('escapes HTML special characters to prevent XSS injection', () => {
    const maliciousInput = '<script>alert("XSS & Injection \' test")</script>';
    const sanitized = escapeHtml(maliciousInput);
    expect(sanitized).toBe(
      '&lt;script&gt;alert(&quot;XSS &amp; Injection &#39; test&quot;)&lt;/script&gt;'
    );
  });

  it('leaves safe strings untouched', () => {
    const safeInput = 'Conseiller Adam Smith - Humeur curieuse 100%';
    expect(escapeHtml(safeInput)).toBe(safeInput);
  });
});
