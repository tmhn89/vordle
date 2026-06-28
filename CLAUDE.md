# CLAUDE.md

## Project overview

A game for Vietnamese word guesser. A key compound word / phrase consist of 2-7 words is hidden. Player receive all the letters and tones used in the keyword. Guessing the keyword by typing each component word in the input boxes.

## Rules

1. Generate a keyword from a source (suggest me) - make sure it has meaning.
2. Provide the player with how many component words, and all the letters & tones.
3. Generate the number of input boxes corresponding with number of component words
4. After user submission, highlight the background of the result box by the rules similar to Wordle
   a. Green: word is in the keyword and in correct place
   b. Yellow: word is in the keyword but is in incorrect place
   c. Red: word is not in the keyword.

## Tech stack

Vanilla HTML, CSS, JS
Run the UI in gh-pages

## Project management

- Discuss and clarify the requirements. Split the project to phases with checkboxes in @PROJECT.md
- Log the decisions to @LOG.md, chronologically. Only add, no delete.
