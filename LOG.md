# LOG.md

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
