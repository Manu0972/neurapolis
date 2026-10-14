import { describe, expect, it } from 'vitest';
import { avatarSvg } from '../src/presentation/avatar';

describe('avatarSvg security', () => {
  it('escapes special HTML/XML characters in the color parameter to prevent SVG attribute breakout', () => {
    const maliciousColor = '#ffffff" onload="alert(1)" <script>alert("xss")</script>';
    const svg = avatarSvg('test-seed', maliciousColor, 48);

    // Verify double quotes, less-than, and greater-than signs are escaped
    expect(svg).not.toContain('onload="alert(1)"');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&quot; onload=&quot;alert(1)&quot;');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('renders normal hex colors correctly', () => {
    const validColor = '#f2c9a5';
    const svg = avatarSvg('pnj:noah', validColor, 48);
    expect(svg).toContain('fill="#f2c9a5"');
  });
});
