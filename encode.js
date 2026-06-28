const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Word list ---
let raw;
if (process.env.WORD_LIST) {
  raw = process.env.WORD_LIST;
} else {
  const txtPath = path.join(__dirname, 'word_list.txt');
  if (!fs.existsSync(txtPath)) {
    console.error('Error: word_list.txt not found and WORD_LIST env var not set');
    process.exit(1);
  }
  raw = fs.readFileSync(txtPath, 'utf8');
}

const words = raw.split('\n').map(w => w.trim()).filter(Boolean);
const encoded = Buffer.from(JSON.stringify(words)).toString('base64');

fs.writeFileSync(path.join(__dirname, 'words.js'), `const WORDS = JSON.parse(
  new TextDecoder().decode(
    Uint8Array.from(atob(
      "${encoded}"
    ), c => c.charCodeAt(0))
  )
).map(p => p.split(" "));
`, 'utf8');
console.log(`Encoded ${words.length} words → words.js`);

// --- Schedule ---
const salt = process.env.SEED_SALT || 'dev-salt';
if (!process.env.SEED_SALT) {
  console.warn('Warning: SEED_SALT not set, using dev-salt (do not use in production)');
}

function hashDate(dateStr) {
  return crypto.createHmac('sha256', salt).update(dateStr).digest('hex').slice(0, 8);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const today = new Date().toISOString().slice(0, 10);
const todayHash = hashDate(today);

// Build a 60-day window: 7 days back so recent shares still work, 53 days forward
const schedule = {};
for (let i = -7; i <= 53; i++) {
  const date = addDays(today, i);
  const hash = hashDate(date);
  const idx = parseInt(crypto.createHmac('sha256', salt).update(date).digest('hex').slice(0, 8), 16) % words.length;
  schedule[hash] = words[idx].split(' ');
}

// Navigation timeline: 5 days back to today (6 entries, index 5 = today)
const timeline = [];
for (let i = -5; i <= 0; i++) {
  timeline.push(hashDate(addDays(today, i)));
}

fs.writeFileSync(path.join(__dirname, 'schedule.js'), `const TODAY_HASH = "${todayHash}";
const SCHEDULE = ${JSON.stringify(schedule)};
const HASH_TIMELINE = ${JSON.stringify(timeline)};
`, 'utf8');
console.log(`Generated schedule.js (${Object.keys(schedule).length} days, today=${todayHash})`);
