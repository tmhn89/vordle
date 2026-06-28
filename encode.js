const fs = require('fs');
const path = require('path');

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

const output = `const WORDS = JSON.parse(
  new TextDecoder().decode(
    Uint8Array.from(atob(
      "${encoded}"
    ), c => c.charCodeAt(0))
  )
).map(p => p.split(" "));
`;

fs.writeFileSync(path.join(__dirname, 'words.js'), output, 'utf8');
console.log(`Encoded ${words.length} words → words.js`);
