const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// --- Word list ---
let raw;
if (process.env.WORD_LIST) {
    raw = process.env.WORD_LIST;
} else {
    const txtPath = path.join(__dirname, "word_list.txt");
    if (!fs.existsSync(txtPath)) {
        console.error("Error: word_list.txt not found and WORD_LIST env var not set");
        process.exit(1);
    }
    raw = fs.readFileSync(txtPath, "utf8");
}

// Lines starting with # are comments (ignored)
const words = raw
    .split("\n")
    .map((w) => w.trim())
    .filter((w) => w && !w.startsWith("#"));

const encoded = Buffer.from(JSON.stringify(words)).toString("base64");

fs.writeFileSync(
    path.join(__dirname, "words.js"),
    `const WORDS = JSON.parse(
  new TextDecoder().decode(
    Uint8Array.from(atob(
      "${encoded}"
    ), c => c.charCodeAt(0))
  )
).map(p => p.split(" "));
`,
    "utf8",
);
console.log(`Encoded ${words.length} words → words.js`);

// --- Schedule ---
const salt = process.env.SEED_SALT || "dev-salt";
if (!process.env.SEED_SALT) {
    console.warn("Warning: SEED_SALT not set, using dev-salt (do not use in production)");
}

// Day 0: the first word in word_list.txt maps to this date.
// Words appear in file order: words[0] on DAY_ZERO, words[1] the next day, etc.
// To add new words for future dates, append to word_list.txt. Never reorder.
const DAY_ZERO = "2026-06-21";

function hashDate(dateStr) {
    return crypto.createHmac("sha256", salt).update(dateStr).digest("hex").slice(0, 8);
}

function addDays(dateStr, n) {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
    const msPerDay = 86400000;
    return Math.round(
        (new Date(to + "T00:00:00Z") - new Date(from + "T00:00:00Z")) / msPerDay,
    );
}

const today = new Date().toISOString().slice(0, 10);
const todayHash = hashDate(today);

// Build a 60-day window: 3 days back so recent shares still work, 57 days forward
const schedule = {};
for (let i = -3; i <= 57; i++) {
    const date = addDays(today, i);
    const hash = hashDate(date);
    const dayIndex = daysBetween(DAY_ZERO, date);
    const base = dayIndex * 5;
    if (base < 0 || base + 4 >= words.length) continue;
    schedule[hash] = [0, 1, 2, 3, 4].map((j) => words[base + j].split(" "));
}

// Navigation timeline: 3 days back to today
const lookbackDays = 3;
const timeline = [];
for (let i = -1 * lookbackDays; i <= 0; i++) {
    timeline.push(hashDate(addDays(today, i)));
}

fs.writeFileSync(
    path.join(__dirname, "schedule.js"),
    `const TODAY_DATE = "${today}";
const TODAY_HASH = "${todayHash}";
const SCHEDULE = ${JSON.stringify(schedule)};
const HASH_TIMELINE = ${JSON.stringify(timeline)};
`,
    "utf8",
);
console.log(
    `Generated schedule.js (${Object.keys(schedule).length} days, today=${todayHash}, day0=${DAY_ZERO})`,
);
