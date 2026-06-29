// Reorganises word_list.txt so every group of 5 (= one day) follows:
//   [easy, easy, medium, medium, hard]
// where easy = 2-3 syllables, medium = 4 syllables, hard = 6+ syllables,
// and 5-syllable words fill whichever bucket (medium or hard) needs topping up.
//
// Run: node scramble.js
// Overwrites word_list.txt in place.

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "word_list.txt");

const raw = fs.readFileSync(FILE, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

// Deduplicate (keep first occurrence)
const seen = new Set();
const words = [];
for (const w of raw) {
    if (seen.has(w)) {
        console.warn(`Duplicate removed: "${w}"`);
    } else {
        seen.add(w);
        words.push(w);
    }
}

// Categorise by syllable count (space-separated tokens = syllables)
const easy = [];        // 2-3 syllables
const mediumOnly = [];  // exactly 4 syllables
const flex = [];        // exactly 5 syllables — fills medium or hard as needed
const hardOnly = [];    // 6+ syllables

for (const w of words) {
    const n = w.split(" ").length;
    if (n <= 3)      easy.push(w);
    else if (n === 4) mediumOnly.push(w);
    else if (n === 5) flex.push(w);
    else             hardOnly.push(w);
}

console.log(`easy(2-3): ${easy.length}, medium(4): ${mediumOnly.length}, flex(5): ${flex.length}, hard(6+): ${hardOnly.length}`);

// Fisher-Yates shuffle
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

shuffle(easy);
shuffle(mediumOnly);
shuffle(flex);
shuffle(hardOnly);

// Compute maximum balanced days:
//   each day needs 2 easy + 2 medium + 1 hard
//   flex can cover medium or hard shortfalls
// Solve: find max X where:
//   2X ≤ easy.length
//   flex_m + flex_h ≤ flex.length
//   flex_m = max(0, 2X - mediumOnly.length)
//   flex_h = max(0, X   - hardOnly.length)
let maxDays = 0;
for (let x = Math.floor(easy.length / 2); x >= 0; x--) {
    const flexNeededMedium = Math.max(0, 2 * x - mediumOnly.length);
    const flexNeededHard   = Math.max(0, x     - hardOnly.length);
    if (flexNeededMedium + flexNeededHard <= flex.length) {
        maxDays = x;
        break;
    }
}

const flexForMedium = Math.max(0, 2 * maxDays - mediumOnly.length);
const flexForHard   = Math.max(0, maxDays     - hardOnly.length);

console.log(`Balanced days: ${maxDays} (flex used: ${flexForMedium} as medium, ${flexForHard} as hard)`);

// Build the medium and hard pools
const mediumPool = [...mediumOnly, ...flex.slice(0, flexForMedium)];
const hardPool   = [...hardOnly,   ...flex.slice(flexForMedium, flexForMedium + flexForHard)];

// Remaining flex words (if any) go to leftovers
const leftoverFlex = flex.slice(flexForMedium + flexForHard);

shuffle(mediumPool);
shuffle(hardPool);

// Build day groups: [easy, easy, medium, medium, hard]
const output = [];
for (let i = 0; i < maxDays; i++) {
    output.push(easy[i * 2]);
    output.push(easy[i * 2 + 1]);
    output.push(mediumPool[i * 2]);
    output.push(mediumPool[i * 2 + 1]);
    output.push(hardPool[i]);
}

// Append leftovers
const leftoverEasy = easy.slice(maxDays * 2);
const leftovers = [...leftoverEasy, ...leftoverFlex];
if (leftovers.length > 0) {
    console.log(`Leftover words appended (${leftovers.length}): ${leftovers.join(", ")}`);
    output.push(...leftovers);
}

fs.writeFileSync(FILE, output.join("\n") + "\n", "utf8");
console.log(`Written ${output.length} words to word_list.txt (${maxDays} balanced days + ${leftovers.length} leftover)`);
