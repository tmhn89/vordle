# PROJECT.md

## Phase 1 — Core Game (MVP)

- [x] Create `words.js` — curated danh sách từ of tục ngữ / thành ngữ (30–50 entries), each entry listing âm tiết as an array
- [x] Seed + daily word logic — derive từ trong ngày from date; read `?seed=` from URL; fall back to daily
  - **Security:** parse seed with `parseInt(seed, 10)` immediately; discard if `NaN` or out of bounds; never render raw seed string to DOM
- [x] Hint display — extract and display phụ âm, nguyên âm, thanh in three labeled rows (repeated, sorted alphabetically; ngang omitted)
- [x] Input boxes — render N ô nhập based on âm tiết count of active từ khóa
- [x] Submit logic — on submission, evaluate each âm tiết with Wordle-style duplicate handling (green first, then yellow, then red)
- [x] Result row — render hàng kết quả with xanh/vàng/đỏ background colors below the ô nhập
  - **Security:** always use `el.textContent` (never `innerHTML`) when rendering player input; build cells with `createElement`
- [x] Win detection — detect all-xanh row; trigger chiến thắng state
- [x] Add `<meta http-equiv="Content-Security-Policy">` tag in `index.html` restricting scripts to `'self'`

## Phase 2 — Polish & Share

- [ ] Celebration animation — vendor `canvas-confetti` into repo (do not load from CDN)
- [x] Chia sẻ panel — emoji grid of all lần đoán + hạt giống URL; copy-to-clipboard button
  - **Security:** build share URL as `origin + pathname + '?seed=' + numericIndex` only; never concatenate raw user input or `location.href`
- [ ] Mobile layout — single-column, touch-friendly, Vietnamese UI labels throughout
- [ ] gh-pages deployment — configure GitHub Actions to deploy on push to main

## Phase 3 — Virtual Keyboard (Future)

- [ ] Virtual keyboard — tap-to-compose âm tiết from phụ âm, nguyên âm, thanh tiles displayed in gợi ý
