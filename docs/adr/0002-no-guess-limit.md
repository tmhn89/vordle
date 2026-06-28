# ADR 0002 — No limit on lần đoán

**Status:** Accepted

## Context

Wordle and most word games cap guesses (Wordle: 6). Vordle needed a policy.

## Decision

Unlimited lần đoán — the player continues until chiến thắng.

## Rationale

Vietnamese syllable reconstruction from raw components (phụ âm + nguyên âm + thanh) is harder than guessing an English word. A fixed cap would frustrate learners. The game is cooperative (player vs. puzzle) rather than competitive, so there is no score to protect.

## Consequences

No "you lose" state exists. The only end state is chiến thắng. The chia sẻ emoji grid still conveys effort via row count.
