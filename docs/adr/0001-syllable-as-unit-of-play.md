# ADR 0001 — Âm tiết as the unit of play

**Status:** Accepted

## Context

Vietnamese text can be segmented by syllable (each orthographic unit with its own tone mark) or by lexical word (multi-syllable compounds like "học sinh"). The game needed one canonical unit per input box.

## Decision

Use âm tiết (syllable) as the atomic unit. Each ô nhập accepts exactly one âm tiết.

## Rationale

Vietnamese tones and diacritics are scoped to the syllable, not the lexical word. Green/yellow/red feedback is only unambiguous when comparing at the syllable level. Lexical words would require defining word boundaries, which adds complexity and is inconsistent across dialects.

## Consequences

The danh sách từ must list từ khóa as sequences of âm tiết. The hint system extracts phụ âm, nguyên âm, and thanh per âm tiết.
