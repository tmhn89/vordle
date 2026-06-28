# LOG.md

## 2026-06-28 — Mobile layout + gh-pages deployment

Mobile CSS polish applied to `style.css`:
- Added `:active` pseudo-class alongside `:hover` on all buttons and the share URL link — iOS Safari never fires `:hover` before tap release, so without `:active` there is no visual tap feedback.
- Fixed `#share-grid` overflow: changed `white-space: pre` → `pre-wrap` + `word-break: break-all` so long emoji rows wrap on narrow screens instead of scrolling horizontally.
- Added `display: inline-block; padding: 8px 0` to `.share-url` to make the small-text link tappable on touch screens.
- Added `@media (max-width: 400px)` breakpoint reducing body padding, h1 font size, and input minimum width/height for iPhone SE (375px).

Deployment: created `.github/workflows/deploy.yml` — GitHub Actions workflow that deploys the repo root as a static site to gh-pages on every push to main. No build step. To activate: enable Pages in repo Settings → Pages → Source: GitHub Actions.

Canvas-confetti celebration animation deferred indefinitely (decoration only).

## 2026-06-28 — Security review (pre-implementation)

- XSS via `?seed=`: always `parseInt()` seed on read, never render raw param to DOM.
- XSS via player input: always `el.textContent` (never `innerHTML`) for result cells; use `createElement`.
- Confetti library: vendor into repo, do not load from CDN (supply chain risk).
- Share URL: construct from `origin + pathname + '?seed=' + numericIndex` only.
- CSP: add `<meta http-equiv="Content-Security-Policy">` in `index.html`.

## 2026-06-28 — Bug fix: vowel hint showing 'o' instead of 'ô' (and 'a' instead of 'ă')

Root cause: Unicode NFD canonical ordering. The dot-below combining char (U+0323, nặng tone, CCC=220) has a lower Canonical Combining Class than circumflex (U+0302, CCC=230) and breve (U+0306, CCC=230). NFD sorts combining chars by CCC ascending, so 'ộ' decomposes to `o + U+0323 + U+0302` — tone mark before shape modifier. The original single-pass scanner collected `o` then hit the tone mark and stopped, never seeing the circumflex, and reported `o` instead of `ô`. Same bug affected `ặ` (ă + nặng).

Fix: split `extractHint` into two passes. Pass 1 collects all tone marks by iterating every char (order-independent). Pass 2 collects base letters with shape modifiers, with an inner loop that explicitly skips tone marks while still hunting for modifiers after them.

Vowels using the horn modifier (ư, ơ family) were unaffected: U+031B has CCC=216 < 220, so it always appears before dot-below in NFD and the old code handled it correctly.

Discovered via seed=60 ("bánh bột lọc") showing `a o o` instead of `a o ô`.

## 2026-06-28 — Word list repopulated

Replaced ad-hoc test words with a curated list of 120 entries: 30 each at 2, 3, 4, and 5 syllables. 6- and 7-syllable entries removed. Format changed from array literals to plain strings with `.map(phrase => phrase.split(' '))` for readability. Food and dish names added to each length category (e.g. phở bò, chả lá lốt, trà sữa trân châu, cơm tấm sườn bì chả). Constraint enforced: no word formed by attaching an adjective to a shorter word already in the list.

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
