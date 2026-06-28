# PROJECT.md

## Phase 1 — Core Game (MVP)

- [ ] Create `words.js` — curated danh sách từ of tục ngữ / thành ngữ (30–50 entries), each entry listing âm tiết as an array
- [ ] Seed + daily word logic — derive từ trong ngày from date; read `?seed=` from URL; fall back to daily
- [ ] Hint display — extract and display phụ âm, nguyên âm, thanh in three labeled rows (repeated, sorted alphabetically; ngang omitted)
- [ ] Input boxes — render N ô nhập based on âm tiết count of active từ khóa
- [ ] Submit logic — on submission, evaluate each âm tiết with Wordle-style duplicate handling (green first, then yellow, then red)
- [ ] Result row — render hàng kết quả with xanh/vàng/đỏ background colors below the ô nhập
- [ ] Win detection — detect all-xanh row; trigger chiến thắng state

## Phase 2 — Polish & Share

- [ ] Celebration animation — confetti or similar on chiến thắng
- [ ] Chia sẻ panel — emoji grid of all lần đoán + hạt giống URL; copy-to-clipboard button
- [ ] Mobile layout — single-column, touch-friendly, Vietnamese UI labels throughout
- [ ] gh-pages deployment — configure GitHub Actions to deploy on push to main

## Phase 3 — Virtual Keyboard (Future)

- [ ] Virtual keyboard — tap-to-compose âm tiết from phụ âm, nguyên âm, thanh tiles displayed in gợi ý
