// Reorganises word_list.txt so every group of 5 (= one day) follows:
//   [easy, easy, medium, medium, hard]
// Difficulty is based on total character count (no spaces); see constants below.
//
// Words before the "#### fixed #####" separator line are left untouched —
// they are already assigned to published dates and must never be reordered.
// Only words after the separator are scrambled and difficulty-sorted.
//
// If no separator line is found, all words are scrambled (backward-compatible).
//
// Run: node scramble.js
// Overwrites word_list.txt in place.

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "word_list.txt");
const SEPARATOR = "#### fixed #####";

const EASY_MAX_CHARS = 11;
const MEDIUM_MAX_CHARS = 16;
const EASY_PER_DAY = 2;
const MEDIUM_PER_DAY = 2;
const HARD_PER_DAY = 1;

const allLines = fs.readFileSync(FILE, "utf8").split("\n").map((l) => l.trim());

const sepIndex = allLines.findIndex((l) => l === SEPARATOR);

let fixedLines; // kept verbatim
let candidateLines; // will be scrambled

if (sepIndex === -1) {
    console.log("No separator found — scrambling all words.");
    fixedLines = [];
    candidateLines = allLines;
} else {
    fixedLines = allLines.slice(0, sepIndex);
    candidateLines = allLines.slice(sepIndex + 1);
}

// Build dedup set seeded with fixed words so new section can't duplicate them
const seen = new Set(
    fixedLines.filter((l) => l && !l.startsWith("#")).map((l) => l.toLowerCase()),
);

const words = [];
for (const line of candidateLines) {
    const w = line.trim().toLowerCase().replace(/[,.]/g, "");
    if (!w || w.startsWith("#")) continue;
    if (seen.has(w)) {
        console.warn(`Duplicate removed: "${w}"`);
    } else {
        seen.add(w);
        words.push(w);
    }
}

// Categorise by character count (no spaces)
const easy = []; // ≤ EASY_MAX_CHARS
const medium = []; // EASY_MAX_CHARS+1 – MEDIUM_MAX_CHARS
const hard = []; // > MEDIUM_MAX_CHARS

for (const w of words) {
    const len = w.replace(/ /g, "").length;
    if (len <= EASY_MAX_CHARS) easy.push(w);
    else if (len <= MEDIUM_MAX_CHARS) medium.push(w);
    else hard.push(w);
}

console.log(
    `New words — easy(≤${EASY_MAX_CHARS}): ${easy.length}, medium(${EASY_MAX_CHARS + 1}-${MEDIUM_MAX_CHARS}): ${medium.length}, hard(≥${MEDIUM_MAX_CHARS + 1}): ${hard.length}`,
);

// Fisher-Yates shuffle
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

shuffle(easy);
shuffle(medium);
shuffle(hard);

// Compute maximum balanced days
const maxDays = Math.min(
    Math.floor(easy.length / EASY_PER_DAY),
    Math.floor(medium.length / MEDIUM_PER_DAY),
    Math.floor(hard.length / HARD_PER_DAY),
);

console.log(`Balanced days from new words: ${maxDays}`);

// Build day groups: [easy×EASY_PER_DAY, medium×MEDIUM_PER_DAY, hard×HARD_PER_DAY]
const output = [];
for (let i = 0; i < maxDays; i++) {
    for (let e = 0; e < EASY_PER_DAY; e++) output.push(easy[i * EASY_PER_DAY + e]);
    for (let m = 0; m < MEDIUM_PER_DAY; m++) output.push(medium[i * MEDIUM_PER_DAY + m]);
    for (let h = 0; h < HARD_PER_DAY; h++) output.push(hard[i * HARD_PER_DAY + h]);
}

// Append leftovers
const leftoverEasy = easy.slice(maxDays * EASY_PER_DAY);
const leftoverMedium = medium.slice(maxDays * MEDIUM_PER_DAY);
const leftoverHard = hard.slice(maxDays * HARD_PER_DAY);
const leftovers = [...leftoverEasy, ...leftoverMedium, ...leftoverHard];
if (leftovers.length > 0) {
    console.log(`Leftover words appended (${leftovers.length}):`);
    if (leftoverEasy.length)
        console.log(`  easy   (≤${EASY_MAX_CHARS} chr): ${leftoverEasy.length}   — ${leftoverEasy.join(", ")}`);
    if (leftoverMedium.length)
        console.log(
            `  medium (${EASY_MAX_CHARS + 1}-${MEDIUM_MAX_CHARS}):   ${leftoverMedium.length} — ${leftoverMedium.join(", ")}`,
        );
    if (leftoverHard.length)
        console.log(`  hard   (≥${MEDIUM_MAX_CHARS + 1} chr): ${leftoverHard.length}   — ${leftoverHard.join(", ")}`);

    // How many more balanced days could these leftovers form?
    const possibleDays = Math.min(
        Math.floor(leftoverEasy.length / EASY_PER_DAY),
        Math.floor(leftoverMedium.length / MEDIUM_PER_DAY),
        Math.floor(leftoverHard.length / HARD_PER_DAY),
    );
    if (possibleDays > 0) {
        console.log(`  → ${possibleDays} more balanced day(s) possible — no extra words needed`);
    } else {
        const needs = [];
        const pairsByEasy = Math.floor(leftoverEasy.length / EASY_PER_DAY);
        const pairsByMedium = Math.floor(leftoverMedium.length / MEDIUM_PER_DAY);
        const need = Math.max(pairsByEasy, pairsByMedium, leftoverHard.length);
        if (need > 0) {
            const needEasy = need * EASY_PER_DAY - leftoverEasy.length;
            const needMedium = need * MEDIUM_PER_DAY - leftoverMedium.length;
            const needHard = need * HARD_PER_DAY - leftoverHard.length;
            if (needEasy > 0) needs.push(`${needEasy} easy (≤${EASY_MAX_CHARS} chr)`);
            if (needMedium > 0) needs.push(`${needMedium} medium (${EASY_MAX_CHARS + 1}-${MEDIUM_MAX_CHARS} chr)`);
            if (needHard > 0) needs.push(`${needHard} hard (≥${MEDIUM_MAX_CHARS + 1} chr)`);
            console.log(`  → to add ${need} more balanced day(s): add ${needs.join(" + ")} to word_list.txt`);
        }
    }
    output.push(...leftovers);
}

// Compose final file: fixed section + separator + scrambled new section
const parts = [];
if (fixedLines.length > 0) {
    parts.push(...fixedLines);
    parts.push(SEPARATOR);
}
parts.push(...output);

fs.writeFileSync(FILE, parts.join("\n") + "\n", "utf8");

const fixedCount = fixedLines.filter((l) => l && !l.startsWith("#")).length;
console.log(
    `Written to word_list.txt: ${fixedCount} fixed + ${output.length} new (${maxDays} balanced days + ${leftovers.length} leftover)`,
);
