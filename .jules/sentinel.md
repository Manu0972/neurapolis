## 2025-02-18 - XSS via innerHTML Injection in Presentation Layer
**Vulnerability:** Unsanitized dynamic variables (ghost advisor name, mood emoticons/strings, node territory names) were interpolated directly into `innerHTML` strings in `src/presentation/ui.ts` and `src/presentation/game.ts`.
**Learning:** Even in single-player or local LAN simulation games, dynamic text coming from game state (or multiplayer sync payloads) inserted via `innerHTML` can trigger DOM XSS if not properly escaped.
**Prevention:** Always use `escapeHtml` when embedding dynamic variables into HTML string templates in presentation components, or assign text safely via `textContent` when HTML markup is not required.

## 2026-03-31 - Unsanitized Save Slot Key and Object Validation in Storage Layer
**Vulnerability:** Save slot persistence functions allowed unvalidated `slot` strings in `localStorage` operations (`saveToSlot`, `loadFromSlot`, `deleteSlot`, `slotSummary`), enabling arbitrary key access or prototype property collision (`__proto__`, key traversal). Additionally, `migrateSave` accepted JSON arrays `[]` as valid objects due to `typeof [] === 'object'`.
**Learning:** `typeof` in JS returns `'object'` for arrays, allowing array payloads to bypass object type checks during save migrations; unconstrained slot names can pollute storage namespace.
**Prevention:** Enforce strict regex validation (`/^[a-zA-Z0-9_-]{1,32}$/`) for slot keys before accessing storage, and explicitly check `!Array.isArray(raw)` when validating JSON object parameters.

## 2026-03-30 - Trailing Separator Misconfiguration in Static Path Traversal Checks
**Vulnerability:** Path boundary checks constructed via `ROOT + sep` fail when `ROOT` already includes a trailing separator (e.g. `dist/`), evaluating `file.startsWith('dist//')` to `false` for valid requests and resulting in false-positive 403 Forbidden errors or unintended bypasses.
**Learning:** `path.resolve()` strips trailing separators on paths except for root directories, but user arguments or computed directory strings might retain them.
**Prevention:** Normalize root prefix paths with `const rootWithSep = ROOT.endsWith(sep) ? ROOT : ROOT + sep;` before performing `startsWith` containment validation.
