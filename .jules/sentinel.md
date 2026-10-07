## 2025-05-18 - [DOM XSS Prevention in Presentation UI]
**Vulnerability:** Dynamic string interpolation (`speaker`, `text`, `emoticon`, `ghostName`, `mood`) into `innerHTML` inside `src/presentation/ui.ts` without sanitization exposed the application to potential DOM-based Cross-Site Scripting (XSS).
**Learning:** Dynamic text generated from event content or character states in UI popups/widgets rendered with `innerHTML` must be escaped even if sourced from game state.
**Prevention:** Use `escapeHtml` on all dynamic variables inserted into string templates assigned to `innerHTML`.
