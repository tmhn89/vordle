// Run: node test/schedule-shape.js (from repo root)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// schedule.js uses `const`; replace with `var` so vm context captures them
const js = fs.readFileSync(path.join(__dirname, "..", "schedule.js"), "utf8").replace(/^const /gm, "var ");
const ctx = {};
vm.runInNewContext(js, ctx);
const { TODAY_DATE, TODAY_HASH, SCHEDULE, HASH_TIMELINE } = ctx;

console.log("TODAY_DATE  :", TODAY_DATE);
console.log("TODAY_HASH  :", TODAY_HASH);
console.log("HASH_TIMELINE length:", HASH_TIMELINE.length, "(expected 4: 3 days back + today)");
console.log("HASH_TIMELINE:", HASH_TIMELINE);
console.log("Days in SCHEDULE:", Object.keys(SCHEDULE).length);

const todayEntry = SCHEDULE[TODAY_HASH];
if (!Array.isArray(todayEntry) || todayEntry.length !== 5) {
    console.error("FAIL: today's entry is not an array of 5", todayEntry);
    process.exit(1);
}
console.log("Today (quiz 1–5):");
todayEntry.forEach((w, i) => console.log(`  ${i + 1}: ${w.join(" ")}`));

// Spot-check all entries are arrays of 5 syllable arrays
let allOk = true;
for (const [hash, words] of Object.entries(SCHEDULE)) {
    if (!Array.isArray(words) || words.length !== 5) {
        console.error("FAIL: entry for hash", hash, "has wrong shape:", words);
        allOk = false;
    }
    for (const w of words) {
        if (!Array.isArray(w) || w.length === 0) {
            console.error("FAIL: word entry is not a syllable array:", w);
            allOk = false;
        }
    }
}
if (allOk) console.log("All SCHEDULE entries are valid arrays of 5 words.");
