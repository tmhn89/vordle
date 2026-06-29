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
const WORDS_PER_DAY = 5;
const LOOKBACK_DAYS = 3;  // how many past days remain accessible via day-nav
const FORWARD_DAYS = 57;  // pre-baked buffer in case the daily CI cron job fails
const HASH_LENGTH = 8;
const MS_PER_DAY = 86400000;

function hashDate(dateStr) {
    return crypto.createHmac("sha256", salt).update(dateStr).digest("hex").slice(0, HASH_LENGTH);
}

function addDays(dateStr, n) {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
    return Math.round((new Date(to + "T00:00:00Z") - new Date(from + "T00:00:00Z")) / MS_PER_DAY);
}

const today = new Date().toISOString().slice(0, 10);
const todayHash = hashDate(today);

const schedule = {};
for (let i = -LOOKBACK_DAYS; i <= FORWARD_DAYS; i++) {
    const date = addDays(today, i);
    const hash = hashDate(date);
    const dayIndex = daysBetween(DAY_ZERO, date);
    const base = dayIndex * WORDS_PER_DAY;
    if (base < 0 || base + WORDS_PER_DAY - 1 >= words.length) continue;
    schedule[hash] = Array.from({ length: WORDS_PER_DAY }, (_, j) => words[base + j].split(" "));
}

// Navigation timeline: LOOKBACK_DAYS back to today
const timeline = [];
for (let i = -LOOKBACK_DAYS; i <= 0; i++) {
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
console.log(`Generated schedule.js (${Object.keys(schedule).length} days, today=${todayHash}, day0=${DAY_ZERO})`);
