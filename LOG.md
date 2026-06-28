# LOG.md

## 2026-06-28 — Security review (pre-implementation)

- XSS via `?seed=`: always `parseInt()` seed on read, never render raw param to DOM.
- XSS via player input: always `el.textContent` (never `innerHTML`) for result cells; use `createElement`.
- Confetti library: vendor into repo, do not load from CDN (supply chain risk).
- Share URL: construct from `origin + pathname + '?seed=' + numericIndex` only.
- CSP: add `<meta http-equiv="Content-Security-Policy">` in `index.html`.

## 2026-06-28 — Phase 1 complete

All Phase 1 items shipped:

- `words.js`: 66-entry curated list — 14 × 2-syllable test words, 14 × 3-syllable test words, 8 × 4-syllable, 6 × 5-syllable, 15 × 6-syllable, 3 × 7-syllable tục ngữ/thành ngữ.
- Seed logic: daily word from `Math.floor(Date.now() / 86400000) % WORDS.length`; `?seed=N` URL param overrides with `parseInt` + bounds-check; keyword logged to console for debugging.
- Hint display: NFD decomposition separates tone combining chars (U+0300/0301/0309/0303/0323) from vowel-shape modifiers (U+0302/0306/031B); tones displayed as ASCII symbols (`` ` `` `'` `?` `~` `.`); ngang omitted.
- Input row: one box per âm tiết; Space advances focus to next box without inserting a space (handled via `keydown` preventDefault + `input` event stripping); Enter submits.
- Evaluation: Wordle-style two-pass (green first, then yellow consuming pool).
- Result rows: built with `createElement` + `textContent`; scroll into view on append.
- Win panel: chiến thắng state hides input/submit, shows keyword, emoji grid, copy button, and seed URL. Chia sẻ panel fully implemented (counted as Phase 2 share item — done alongside Phase 1).
- CSP `<meta>` tag in `index.html`: `default-src 'self'; script-src 'self'; style-src 'self'`.

Remaining Phase 2: confetti animation (vendored), mobile layout verification, gh-pages deploy.

## 2026-06-28 — Initial design decisions (grilling session)

- Unit of play is âm tiết (syllable), not lexical word. One ô nhập per âm tiết.
- Player input via OS Vietnamese IME (Unicode direct); virtual keyboard deferred to Phase 3.
- Hint (gợi ý) shows phụ âm, nguyên âm, thanh in three labeled rows. Components repeated (not deduplicated). Ngang tone omitted from thanh row.
- No limit on lần đoán — only end state is chiến thắng (all-xanh row).
- Duplicate âm tiết handling follows Wordle-style consumption (greens resolved first, then yellows).
- No validation of submitted âm tiết — any input accepted.
- Danh sách từ is a curated static list of tục ngữ / thành ngữ bundled with the game.
- Daily word (từ trong ngày) derived from date % word list length. `?seed=` URL param overrides for replay/share.
- On chiến thắng: celebration animation + chia sẻ panel with emoji grid and hạt giống URL.
- UI is Vietnamese-only. Mobile-first layout.
- Deployed via gh-pages.
