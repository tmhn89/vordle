# CLAUDE.md

## Project overview

A game for Vietnamese word guesser. A key compound word / phrase consist of 2-7 words is hidden. Player receive all the letters and tones used in the keyword. Guessing the keyword by typing each syllable in the input boxes.

## Rules

1. Generate a keyword from a source (suggest me) - make sure it has meaning.
2. Provide the player with how many syllables, and all the letters & tones.
3. Generate the number of input boxes corresponding with number of syllables
4. After user submission, highlight the background of the result box by the rules similar to Wordle
   a. Green: syllable is in the keyword and in correct place
   b. Yellow: syllable is in the keyword but is in incorrect place
   c. Red: syllable is not in the keyword.

## Tech stack

Vanilla HTML, CSS, JS
Run the UI in gh-pages

## Project management

- Discuss and clarify the requirements. Split the project to phases with checkboxes in @PROJECT.md
- After each feature request:
    - Add bullet points & tick the checkbox in @PROJECT.md
    - Log the decisions to @LOG.md, chronologically. Only add, no delete.
    - Modify @README.md if extra step needed to setup the project, both in local and in production
