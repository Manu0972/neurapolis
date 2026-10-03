## 2025-05-18 - XSS Prevention in DOM innerHTML Templates
**Vulnerability:** Dynamic string interpolation (speaker labels, ghost advice, node names, mood texts) directly into DOM `innerHTML` string templates.
**Learning:** Even in client-side simulation applications without a backend database, unescaped user-controlled or dynamically generated strings rendered via `innerHTML` expose potential DOM-based XSS vectors.
**Prevention:** Always sanitize dynamic strings inserted into HTML template literals using a central `escapeHtml` utility function or use DOM text nodes (`textContent`).
