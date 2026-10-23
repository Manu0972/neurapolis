/**
 * Tests de sécurité pour le rendu de la couche de présentation (XSS / Sanitization).
 */
import { describe, expect, it } from 'vitest';
import { ghostSvgMarkup } from '../src/presentation/ghost-avatar';

describe('Présentation — Sécurité & Échappement HTML dans les SVG', () => {
  it('échappe correctement les caractères spéciaux dans aria-label et data-ghost pour ghostSvgMarkup', () => {
    // thinkerMeta fallback pour un ID non enregistré utilise l'ID comme nom.
    const unsafeId = 'test"<script>alert(1)</script>&foo\'bar';
    const svg = ghostSvgMarkup(unsafeId);

    expect(svg).not.toContain('data-ghost="test"<script>');
    expect(svg).toContain('aria-label="test&quot;&lt;script&gt;alert(1)&lt;/script&gt;&amp;foo&#039;bar"');
  });
});
