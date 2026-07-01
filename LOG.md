# LOG.md

## 2026-07-01 — Epoch boundary in scramble.js

`scramble.js` now recognises a `#### fixed #####` divider line in `word_list.txt`. Words before the divider are left byte-for-byte untouched (they are already assigned to published dates — reordering would corrupt localStorage progress). Words after the divider are scrambled and difficulty-sorted into balanced `[easy, easy, medium, medium, hard]` day groups as before.

Deduplication checks against the union of both sections, so a word already in the fixed section cannot accidentally reappear in the new section.

If no divider line is found, all words are scrambled — backward-compatible with the pre-divider state.

**To use:** add `#### fixed #####` at the end of the current word list, then append new words below it. Run `node scramble.js` → `node encode.js` as usual.

## 2026-06-30 — "Hướng dẫn sử dụng" how-to-play modal

Added a button to open a how-to-play dialog explaining the rules (syllable count, hint letters/tones, green/yellow/red feedback, win condition).

**Placement:** `#howto-btn` added to `.hint-toggle-row` (same row as the existing `#highlight-toggle` "Hỗ trợ" button) — row changed from `text-align: right` to `display: flex; justify-content: space-between` so the new button sits left-aligned while "Hỗ trợ" stays right-aligned.

**Implementation:** follows the existing `.hidden`-class show/hide pattern used by `#win-panel` rather than introducing a new modal library. `#howto-overlay` (fixed, full-screen, dark backdrop) wraps a `.modal` content box; `initHowToModal()` in `game.js` wires open (`#howto-btn` click), and three close paths: `#howto-close-btn` click, clicking the overlay backdrop itself, and Escape. The existing global Enter-to-submit keydown handler was also guarded to skip while the modal is open (mirrors the existing `win-panel` hidden-check) so pressing Enter to close intent doesn't accidentally submit a guess.

## 2026-06-30 — Social sharing meta tags for Instagram/social link previews

Bug: sharing the Vordle link via Instagram showed a broken/garbled logo and no description in the preview card.

**Root cause:** `index.html` had no `og:*`/`twitter:*` meta tags at all — only a `<meta name="description">` (search engines only, not social crawlers) and an SVG favicon. Most social crawlers (Instagram included) don't render SVG for preview images and fall back to mangling whatever icon they can find; without `og:image` there's also nothing for them to grab a description from.

**Fix:**
- Added `og-image.svg` (1200×630, reuses the 3×3 tile grid art from `logo.svg`, no baked-in text), rasterized to `og-image.png` plus `apple-touch-icon.png` (180×180) and `favicon-32.png` (32×32) via a one-off local `sharp` invocation (not added as a repo dependency — no `package.json`/`node_modules` committed, consistent with the project's no-build, no-CDN-dependency approach).
- Added `og:type`, `og:title`, `og:description`, `og:url`, `og:image` (+ width/height) and `twitter:card`/`twitter:title`/`twitter:description`/`twitter:image` to `index.html`. `og:image`/`og:url` use the absolute `https://tmhn89.github.io/vordle/` URL since the site is hosted at a GitHub Pages project subpath, not root.
- Added PNG favicon/apple-touch-icon links alongside the existing SVG favicon (kept for browsers that support it).
- No CSP change needed — `default-src 'self'` already covers the new same-origin image assets.

## 2026-06-30 — Fix double-submit on Enter during IME composition

When the player pressed Enter to finalize a composed syllable (blue underline on Mac), the submit fired twice. Root cause: Mac IME generates two `keydown` events for the composition-ending Enter — one with `isComposing: true` (ends the IME session) and one with `isComposing: false` (the actual Enter action). Both were hitting the document keydown handler and calling `handleSubmit` twice.

**Fix:** added `!e.isComposing` guard to the Enter keydown handler. The first keydown (isComposing=true) is skipped; `compositionend` fires and commits the text; the second keydown (isComposing=false) calls `handleSubmit()` directly — by that point the input value is already finalized so no `setTimeout` deferral is needed. Also added `e.preventDefault()` to stop Chrome from additionally firing a native click on `#submit-btn`.

No regression when Enter is pressed outside composition (isComposing is always false in that path).

## 2026-06-30 — Fix Vietnamese IME race on Space/Enter

Bug: on desktop with a Vietnamese IME (Unikey, EVKey, etc.) running, pressing Space mid-composition would jump focus to the next box before the IME committed its composed syllable, so the finalized word landed in the wrong (already-focused) box. Same race on Enter: submission read/cleared/refocused inputs before composition finished, so the IME's commit landed in the first box of the next guess.

**Root cause:** both handlers acted on `keydown`, which fires before the browser/IME finishes committing composed text (`compositionend` + `input`).

**Fix:**
- Space handling moved from a `keydown` listener (with `preventDefault`) to the existing `input` listener in `renderInputRow()` — now reacts to the committed value (`/\s/.test(input.value)`), strips the space, and advances focus to the next `.syllable-input` only after the IME has committed.
- Enter handling deferred with `setTimeout(handleSubmit, 0)` in the document-level `keydown` listener, giving any in-flight composition one tick to commit before `handleSubmit()` reads input values and clears/refocuses for the next guess.

## 2026-06-30 — Highlight support mode

Added an opt-in "Hỗ trợ" toggle button inside the hint section (default off, persisted in `localStorage["vordle_highlight"]`).

**Behaviour:** when enabled, characters in the phụ âm / nguyên âm / thanh rows that match what the player has typed across all current input boxes are highlighted green in real time. Highlights clear automatically after each submission. Toggling off removes all highlights immediately.

**Implementation:**
- `index.html`: toggle button (`#highlight-toggle` / `#highlight-toggle-label`) added as `.hint-toggle-row` inside `<section class="hint">`.
- `game.js`:
  - `renderHint()` refactored into `renderHintItems(id, items)` — each character is now a `<span class="hint-char" data-char="…">` (built with `createElement`/`textContent`, no `innerHTML`).
  - `updateHintHighlight()` — runs `extractHint()` on all non-empty input values, builds Sets of used consonants/vowels/tones, toggles `.highlighted` class on matching spans.
  - `clearHintHighlight()` — removes `.highlighted` from all `.hint-char` spans; called on submit and on toggle-off.
  - `initHighlightToggle()` — reads localStorage state, wires click handler; called in `init()` before the already-played early return so the toggle works on revisit too.
- `style.css`:
  - `.hint-toggle-btn[aria-pressed="true"]` — button border and text turn green when active.
  - `.hint-char.highlighted` — highlighted characters rendered in `var(--color-green)` bold.

## 2026-06-30 — Difficulty metric: character count + named constants in scramble.js

Replaced syllable-count bucketing with total character count (no spaces) as the difficulty metric. Rationale: syllable count ignores syllable complexity — a 3-syllable word with short syllables is easier than a 3-syllable word with long compound vowels and consonant clusters.

Thresholds (set after calibrating against the current word list):
- easy   ≤ 11 chars  (e.g. "sầu riêng" = 8, "chim cánh cụt" = 11)
- medium 12–16 chars (e.g. "bánh tráng trộn" = 13, "mẹ chồng nàng dâu" = 16)
- hard   ≥ 17 chars  (e.g. "có công mài sắt có ngày nên kim" = 24)

Result with 168 words: easy 71 / medium 69 / hard 35 → **34 balanced days** + 5 leftover (3 easy, 1 medium, 1 hard). Previously 6 balanced days under syllable-count system.

All magic numbers in `scramble.js` extracted to named constants at top of file:
```js
const EASY_MAX_CHARS   = 11;
const MEDIUM_MAX_CHARS = 16;
const EASY_PER_DAY     = 2;
const MEDIUM_PER_DAY   = 2;
const HARD_PER_DAY     = 1;
```

## 2026-06-29 — localStorage reset on word list change (word fingerprint)

`encode.js` now computes `SHA-256(words.join("\n")).slice(0, 8)` and writes it as `const WORD_FINGERPRINT = "…"` in `schedule.js` (line 3, after `TODAY_HASH`).

`game.js` checks at the top of `init()`:
```js
if (localStorage.getItem("vordle_fp") !== WORD_FINGERPRINT) {
    localStorage.removeItem("vordle");
    localStorage.setItem("vordle_fp", WORD_FINGERPRINT);
}
```

If the fingerprint stored in localStorage differs from the deployed one (e.g. after running `scramble.js` + `encode.js`), all stored progress is cleared before the game starts. The fingerprint is then saved so subsequent loads are unaffected.

Trigger: any change to word count or word order in `word_list.txt` will produce a new fingerprint at the next `node encode.js` run. A daily CI rebuild with an unchanged word list produces the same fingerprint — no spurious resets.

## 2026-06-29 — Refactors, UX polish, and word list rebalancing

### CSS design tokens
All inline hex colors, font sizes, spacing values, and layout dimensions extracted to `:root` CSS custom properties in `style.css`. Named variables: `--color-*`, `--font`, `--fs-*`, `--space-*`, `--max-width`, `--btn-size`, `--logo-size`, `--input-height`, `--input-width`, `--input-min-width`, `--submit-height`, `--radius-sm`, `--radius-md`. A handful of one-off sizes remain inline (not worth extracting: 0.75rem share-url, 0.82rem date, 1.1rem win-answer, 1.2rem nav arrows).

### Named constants
Magic numbers extracted to named constants:

`encode.js` (top of file, after `DAY_ZERO`):
```js
const WORDS_PER_DAY = 5;
const LOOKBACK_DAYS = 1;   // how many past days remain accessible via day-nav
const FORWARD_DAYS  = 57;  // pre-baked buffer in case the daily CI cron job fails
const HASH_LENGTH   = 8;
const MS_PER_DAY    = 86400000;
```

`game.js` (top of file):
```js
const WORDS_PER_DAY     = 5;
const WIN_DELAY_MS      = 400;
const COPY_FEEDBACK_MS  = 2000;
```

### Share header format
Changed from `Vordle <hash> (N/5)` to `Tiếng Việt eazy? <date> (N/5)`. Date is the same vi-VN-locale string shown in the day-nav (e.g. `29/06/2026`). Required promoting `displayDate` from a local `const` inside `init()` to a module-level `let` so `buildEmojiGrid()` could read it.

### "Từ tiếp theo →" button
Added to win panel (`index.html`). Hidden by default; `showWin()` removes the `hidden` class when `quizIndex < WORDS_PER_DAY - 1`. Click navigates to `?seed=<hash>&quiz=<quizIndex+2>`. Button shares the same green style as `#copy-btn` via the grouped CSS rule `#next-quiz-btn, #copy-btn { … }`.

### Word list rebalancing (`scramble.js`)
New script that reads `word_list.txt`, deduplicates (removed "máy vi tính" and "tôn ngộ không"), categorises by syllable count, shuffles, and rebuilds the file so every group of 5 is `[easy, easy, medium, medium, hard]`:
- easy = 2–3 syllables; medium = 4; hard = 6+; flex = 5 (fills medium or hard as needed)
- Algorithm: find max balanced days `X` where `2X ≤ easy`, flex covers any medium/hard shortfall, total flex needed ≤ flex available → **28 days**
- Result: 145 words (140 in 28 balanced days + 5 leftover easy words appended as-is)
- Run: `node scramble.js` (overwrites `word_list.txt`); then `node encode.js` to rebuild `schedule.js`

**Note:** never reorder existing lines in `word_list.txt`; localStorage progress is keyed by day hash which maps to word position.

---

## 2026-06-29 — 5 words per day + quiz navigation

Each day now contains 5 puzzles instead of 1. Players use numbered buttons (1–5) to move between puzzles within the same day. Day navigation (prev/next) continues to work as before.

**Scheduling**: `word_list.txt` is now consumed in groups of 5 — lines 1–5 = day 0, lines 6–10 = day 1, etc. Days with fewer than 5 lines remaining are skipped. `encode.js` changed: `SCHEDULE[hash]` is now `string[][]` (5 syllable arrays) instead of `string[]`. `DAY_ZERO` and the HMAC hash scheme are unchanged.

**Lookback window** reduced from 7 days to 3 days (`lookbackDays = 3`). HASH_TIMELINE is now 4 entries.

**URL scheme**: `?seed=<day-hash>&quiz=<1-5>`. Missing `?quiz` defaults to 1. `game.js` reads `quizIndex` (0-based internally) from the param.

**Quiz navigator**: 5 numbered buttons added to the header below the day-nav. Active button gets `border-color: #818384; background: #3a3a3c`. Completed button gets `color: #538d4e; border-color: #538d4e`. Clicking navigates to `?seed=…&quiz=N`.

**Progress tracking**: `saveProgress` and `loadProgress` now take a `qi` (0-based quiz index) parameter. `localStorage["vordle"][hash]` is now a nested object keyed by qi: `{ 0: { guesses, ts }, 2: { guesses, ts }, … }`. Old flat-format entries (`{ guesses, ts }` at the hash level) are silently ignored — `store[hash]?.[qi]` returns null for them.

**Day-done logic**: `isDayDone(hash)` returns true only when all 5 quizzes are complete. Day nav completion indicators (green dot on prev/next, ✓ on current date) now use `isDayDone` instead of `loadProgress`.

**Share**: URL includes `&quiz=${quizIndex + 1}`. Emoji grid header shows `Vordle <hash> (N/5)`.

**word_list.txt**: 111 words → 22 complete days (110 words used; 111th orphaned). 17 days fall within the 3-day-back to 57-day-forward schedule window as of 2026-06-29.

**New file**: `test/schedule-shape.js` — validates that generated schedule.js has correct shape (4-entry timeline, each SCHEDULE entry is array of 5 syllable arrays).

## 2026-06-29 — Numeric index word scheduling + localStorage progress + UTC date fix

### Numeric index word scheduling
Replaced `HMAC(salt, date) % poolSize` word selection with position-based scheduling: `words[daysBetween(DAY_ZERO, date)]`. `DAY_ZERO = "2026-06-21"` is a permanent anchor — line 1 of `word_list.txt` maps to that date, line 2 the next day, etc.

Rationale: game maker (sole operator) wanted explicit control over which word appears on which date. File order is the schedule. Rule: never reorder existing lines; only append to add future words.

`encode.js` changes:
- `DAY_ZERO` constant added.
- `daysBetween(from, to)` utility: `Math.round((new Date(to+"T00:00:00Z") - new Date(from+"T00:00:00Z")) / 86400000)`.
- Word selection: `const dayIndex = daysBetween(DAY_ZERO, date); schedule[hash] = words[dayIndex].split(" ");`.
- Skips dates where `dayIndex < 0` or `dayIndex >= words.length` (no word assigned yet).
- `HASH_TIMELINE` window extended: 7 days back to today.
- URL `?seed=` param remains the opaque 8-char HMAC hash — no player-visible integers.

Consequence: if `word_list.txt` lines are ever reordered, stored localStorage progress (keyed by hash) will be re-evaluated against the wrong keyword and display incorrectly. Never reorder.

### localStorage progress tracking
Players' completed days are persisted in `localStorage` under key `"vordle"`: `{ [hash]: { guesses: string[][], ts: number } }`.

- `saveProgress(hash, guesses)` called first thing in `showWin()`.
- `loadProgress(hash)` called in `init()`.
- Already-played flow: if stored entry found, replay all guess rows via `renderResultRow()` then call `showWin()` immediately and return (no submit listener added).
- Copy and clear listeners attached before the early return so they work on revisit.

UI indicators:
- `#current-date` gets class `done` → appends ` ✓` in green via CSS `::after`.
- Prev/next nav buttons get class `done` if adjacent day is completed → 5px green dot at bottom-center via `::after`.

Clear button: `#clear-btn` text button at bottom of `<main>`. Calls `localStorage.removeItem("vordle")` then `location.reload()`.

### UTC date display fix
Bug: `game.js` used `new Date()` (local clock) for date display while `encode.js` generates `schedule.js` using UTC (`new Date().toISOString().slice(0,10)`). In UTC+7 between midnight local and 07:00 local, the browser reported the next day but schedule still reflected the UTC previous day — displayed date and word were misaligned.

Fix: `encode.js` now writes `const TODAY_DATE = "${today}";` as the first line of `schedule.js`. `game.js` date display was rewritten to use `TODAY_DATE` with `timeZone: "UTC"` in `toLocaleDateString`:
```js
const [y, m, d] = TODAY_DATE.split("-").map(Number);
const utc = new Date(Date.UTC(y, m - 1, d + dateOffset));
return utc.toLocaleDateString("vi-VN", { ..., timeZone: "UTC" });
```
Day boundary is now consistently UTC midnight (= 07:00 Vietnam time). Display and word always agree.

## 2026-06-28 — Day navigation + tone hint fix

Added prev/next day navigation to the header:
- `encode.js` now generates `HASH_TIMELINE` — a 6-entry array of hashes from 5 days ago to today (index 5 = today), written into `schedule.js`.
- `game.js` uses `HASH_TIMELINE.indexOf(seed)` to determine current day position; renders date via offset from `new Date()`; disables prev at index 0, disables next at index 5 (today). Clicking navigates via `?seed=<hash>`.
- `index.html`: added `.day-nav` bar with `‹` / `›` buttons and `#current-date` span inside the header.
- `style.css`: added `.day-nav` layout (flexbox, gap), button sizing/hover/disabled states, `#current-date` min-width.
- Tone hint: when keyword has no tone marks, `#hint-tones` now shows empty string instead of `—`.

## 2026-06-28 — Anti-cheat: salted hash seed system

Replaced plain numeric `?seed=N` with opaque HMAC-SHA256 hashes so players cannot reverse-engineer the date or predict future words.

- `encode.js` (rewritten): reads word list from `WORD_LIST` env var or `word_list.txt`; reads salt from `SEED_SALT` env var (falls back to `'dev-salt'` locally with a warning). Generates `words.js` (base64-encoded word list) and `schedule.js` (61-day hash→syllables map + `TODAY_HASH` + `HASH_TIMELINE`).
- Hash function: `HMAC-SHA256(salt, dateStr).slice(0, 8)` → 8-char hex. Word index: same HMAC parsed as hex integer, modulo word count.
- Schedule window: −7 days (so recently shared links still resolve) to +53 days forward.
- `game.js`: `seed` is now a string (8-char hex). Init reads `?seed=` param; validates against `SCHEDULE`; falls back to `TODAY_HASH`. Share URL unchanged in structure (`?seed=<hash>`).
- `index.html`: loads `schedule.js` between `words.js` and `game.js`.
- `.gitignore`: added `schedule.js` (generated at build time, never committed).
- `deploy.yml`: passes `vars.WORD_LIST` and `secrets.SEED_SALT` as env vars to `node encode.js`.
- Daily cron added (`0 0 * * *`) so schedule regenerates each day even without a push.
- `word_list.txt` shuffled (Fisher-Yates) to decouple word position from seed predictability.

Decision: `WORD_LIST` stored as a repo **variable** (readable, not secret — user's choice). `SEED_SALT` stored as a repo **secret** (never exposed client-side).

## 2026-06-28 — Anti-cheat: base64 word list obfuscation

`encode.js` (Node script) encodes the word list as a UTF-8-safe base64 blob and writes `words.js`:
```js
const WORDS = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob("…"), c => c.charCodeAt(0)))).map(p => p.split(" "));
```
`words.js` and `word_list.txt` are gitignored — never committed. CI generates `words.js` from the `WORD_LIST` repo variable at deploy time. Local dev: run `node encode.js` after editing `word_list.txt`.

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
