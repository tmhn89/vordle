# ADR 0003 — No validation of guessed âm tiết

**Status:** Accepted

## Context

We could validate that each submitted âm tiết is a real Vietnamese syllable or exists in a dictionary before accepting the lần đoán.

## Decision

Accept any input in ô nhập without validation.

## Rationale

A comprehensive Vietnamese syllable/word list is complex to source, bundle, and maintain. The game's feedback loop (xanh/vàng/đỏ) is sufficient to guide players without gating submission. Validation can be added later without breaking the domain model.

## Consequences

Players can submit nonsense; the result will be all đỏ. The game remains functional and frustration-free for edge inputs.
