# Vordle — Domain Glossary

## Core Concepts

**Từ khóa** (Keyword)
The hidden Vietnamese compound phrase that the player is trying to guess. A từ khóa consists of 2–7 âm tiết. One từ khóa is active per session, determined by the ngày (date) or hạt giống (seed).

**Âm tiết** (Syllable)
The atomic unit of play. Each âm tiết occupies exactly one ô nhập. A từ khóa is always described in terms of its âm tiết count, never by "word" count.

**Ô nhập** (Input Box)
A single text field corresponding to one âm tiết position in the từ khóa. The number of ô nhập equals the number of âm tiết in the từ khóa.

**Lần đoán** (Guess)
One full submission: the player fills all ô nhập and submits. A lần đoán produces one hàng kết quả. There is no limit on the number of lần đoán.

**Hàng kết quả** (Result Row)
The colored feedback row produced after each lần đoán. Each cell is one of three trạng thái (states): xanh, vàng, or đỏ.

**Trạng thái ô** (Cell State)
The color result for a single âm tiết in a hàng kết quả:
- **Xanh** (Green) — correct âm tiết in correct position
- **Vàng** (Yellow) — âm tiết exists in từ khóa but in wrong position
- **Đỏ** (Red) — âm tiết does not exist in từ khóa

Duplicate âm tiết are handled using Wordle-style consumption: greens are resolved first, then yellows consume remaining unmatched occurrences.

## Hints

**Gợi ý** (Hint)
The full set of components revealed to the player at the start of a session. Consists of three groups: phụ âm, nguyên âm, thanh. Each component appears as many times as it occurs across all âm tiết in the từ khóa (repeated, not deduplicated). Groups are displayed as three labeled rows.

**Phụ âm** (Consonant)
The consonant components extracted from the từ khóa, sorted alphabetically and listed with repetition.

**Nguyên âm** (Vowel)
The vowel components extracted from the từ khóa, sorted alphabetically and listed with repetition.

**Thanh** (Tone)
The tone diacritics extracted from the từ khóa, sorted and listed with repetition. The ngang tone (no diacritic) is omitted from the hint — only the 5 marked tones are shown.

## Session

**Từ trong ngày** (Daily Word)
The từ khóa assigned to a calendar date, derived deterministically from the date and the danh sách từ. Shown when no hạt giống is present in the URL.

**Hạt giống** (Seed)
A URL parameter (`?seed=`) identifying which từ khóa to play. Allows players to replay a specific từ khóa or share it with others. The từ trong ngày also has a corresponding hạt giống.

**Danh sách từ** (Word List)
The curated static list of từ khóa bundled with the game. The source of all từ trong ngày and seeded games.

## End State

**Chiến thắng** (Win)
Reached when all ô nhập in a lần đoán are xanh. Triggers a celebration animation and reveals the chia sẻ (share) panel.

**Chia sẻ** (Share)
The end-of-game panel containing an emoji grid of the player's lần đoán history and the hạt giống URL for the current từ khóa.
