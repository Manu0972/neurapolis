## 2025-02-18 - XSS via innerHTML Injection in Presentation Layer
**Vulnerability:** Unsanitized dynamic variables (ghost advisor name, mood emoticons/strings, node territory names) were interpolated directly into `innerHTML` strings in `src/presentation/ui.ts` and `src/presentation/game.ts`.
**Learning:** Even in single-player or local LAN simulation games, dynamic text coming from game state (or multiplayer sync payloads) inserted via `innerHTML` can trigger DOM XSS if not properly escaped.
**Prevention:** Always use `escapeHtml` when embedding dynamic variables into HTML string templates in presentation components, or assign text safely via `textContent` when HTML markup is not required.

## 2025-02-18 - SVG Attribute Injection in Procedural Avatars
**Vulnerability:** Dynamic color parameters in `avatarSvg()` (`src/presentation/avatar.ts`) were interpolated directly into SVG element attributes (`fill="${color}"`), allowing SVG attribute injection and DOM XSS when rendered via `innerHTML`.
**Learning:** Procedural SVG generator helper functions in presentation modules that accept dynamic strings (like custom outfit colors or player/NPC properties) and return raw SVG strings inserted via `innerHTML` must escape attribute values.
**Prevention:** Sanitize string inputs using `escapeHtml()` before interpolating them into SVG or HTML string template attributes.
