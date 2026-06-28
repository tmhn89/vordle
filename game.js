// Vietnamese vowels (base forms with shape-modifiers, without tone marks)
const VOWEL_SET = new Set(['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y']);
// ă=ă â=â ê=ê ô=ô ơ=ơ ư=ư

// Derive NFD combining characters from known Vietnamese characters
// Each precomposed char decomposes to [base, ...combiners] in NFD
const GRAVE      = 'à'.normalize('NFD')[1]; // à → a + U+0300 (huyền)
const ACUTE      = 'á'.normalize('NFD')[1]; // á → a + U+0301 (sắc)
const HOOK       = 'ả'.normalize('NFD')[1]; // ả → a + U+0309 (hỏi)
const TILDE      = 'ã'.normalize('NFD')[1]; // ã → a + U+0303 (ngã)
const DOT        = 'ạ'.normalize('NFD')[1]; // ạ → a + U+0323 (nặng)
const CIRCUMFLEX = 'â'.normalize('NFD')[1]; // â → a + U+0302
const BREVE      = 'ă'.normalize('NFD')[1]; // ă → a + U+0306
const HORN       = 'ơ'.normalize('NFD')[1]; // ơ → o + U+031B

// Map: NFD tone combiner → display symbol
const TONE_MAP = new Map([
  [GRAVE, '`'],   // huyền → `
  [ACUTE, "'"],   // sắc   → '
  [HOOK,  '?'],   // hỏi   → ?
  [TILDE, '~'],   // ngã   → ~
  [DOT,   '.'],   // nặng  → .
]);

// NFD combining characters that modify vowel shape (not tone)
const VOWEL_MODIFIER = new Set([CIRCUMFLEX, BREVE, HORN]);

// Display order: huyền, ngã, hỏi, sắc, nặng
const TONE_ORDER = ['`', '~', '?', "'", '.'];

let seed = 0;
let keyword = [];
let guesses = [];

function getDailySeed() {
  return Math.floor(Date.now() / 86400000) % WORDS.length;
}

// Extract phụ âm, nguyên âm, thanh from an array of syllables.
// NFD decomposition separates tone marks from vowel-shape modifiers cleanly.
function extractHint(syllables) {
  const consonants = [];
  const vowels = [];
  const tones = [];

  for (const syllable of syllables) {
    const nfd = syllable.normalize('NFD').toLowerCase();
    let i = 0;

    while (i < nfd.length) {
      const ch = nfd[i];

      if (TONE_MAP.has(ch)) {
        tones.push(TONE_MAP.get(ch));
        i++;
        continue;
      }

      if (VOWEL_MODIFIER.has(ch) || ch === ' ') {
        i++;
        continue;
      }

      // Base letter: collect immediately following vowel-shape modifiers
      let combined = ch;
      let j = i + 1;
      while (j < nfd.length && VOWEL_MODIFIER.has(nfd[j])) {
        combined += nfd[j];
        j++;
      }

      const letter = combined.normalize('NFC');

      if (VOWEL_SET.has(letter)) {
        vowels.push(letter);
      } else if (/^[a-zđ]$/.test(letter)) {
        // đ = đ
        consonants.push(letter);
      }

      i = j;
    }
  }

  consonants.sort((a, b) => a.localeCompare(b, 'vi'));
  vowels.sort((a, b) => a.localeCompare(b, 'vi'));
  tones.sort((a, b) => TONE_ORDER.indexOf(a) - TONE_ORDER.indexOf(b));

  return { consonants, vowels, tones };
}

function renderHint() {
  const { consonants, vowels, tones } = extractHint(keyword);
  document.getElementById('hint-consonants').textContent = consonants.join('  ');
  document.getElementById('hint-vowels').textContent = vowels.join('  ');
  document.getElementById('hint-tones').textContent = tones.length ? tones.join('  ') : '—';
}

function renderInputRow() {
  const row = document.getElementById('input-row');
  row.innerHTML = '';

  keyword.forEach((_, i) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'syllable-input';
    input.setAttribute('aria-label', `Âm tiết ${i + 1}`);
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\s+/g, '');
    });
    row.appendChild(input);
  });

  row.firstElementChild.focus();
}

function getCurrentGuess() {
  return Array.from(
    document.querySelectorAll('.syllable-input'),
    inp => inp.value.trim().toLowerCase().normalize('NFC')
  );
}

// Wordle-style evaluation: resolve greens first, then yellows consuming remaining pool
function evaluateGuess(guess, answer) {
  const result = new Array(answer.length).fill('red');
  const pool = [...answer];

  guess.forEach((s, i) => {
    if (s === answer[i]) {
      result[i] = 'green';
      pool[i] = null;
    }
  });

  guess.forEach((s, i) => {
    if (result[i] === 'green') return;
    const idx = pool.indexOf(s);
    if (idx !== -1) {
      result[i] = 'yellow';
      pool[idx] = null;
    }
  });

  return result;
}

function renderResultRow(guess, result) {
  const row = document.createElement('div');
  row.className = 'result-row';

  guess.forEach((syllable, i) => {
    const cell = document.createElement('div');
    cell.className = `result-cell ${result[i]}`;
    cell.textContent = syllable; // textContent — never innerHTML — for user input
    row.appendChild(cell);
  });

  document.getElementById('results').appendChild(row);
  row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function buildEmojiGrid() {
  const rows = guesses.map(g => {
    const result = evaluateGuess(g, keyword);
    return result.map(r => ({ green: '🟩', yellow: '🟨', red: '🟥' }[r])).join('');
  });
  return [`Vordle #${seed + 1}`, ...rows].join('\n');
}

function showWin() {
  document.getElementById('input-row').classList.add('hidden');
  document.getElementById('submit-btn').classList.add('hidden');

  document.getElementById('win-answer').textContent = keyword.join(' ');
  document.getElementById('share-grid').textContent = buildEmojiGrid();

  // Security: share URL built only from numeric seed — never raw URL param
  const shareUrl = `${location.origin}${location.pathname}?seed=${seed}`;
  const linkEl = document.getElementById('share-url');
  linkEl.textContent = shareUrl;
  linkEl.href = shareUrl;

  document.getElementById('win-panel').classList.remove('hidden');
}

function handleSubmit() {
  const guess = getCurrentGuess();

  if (guess.some(s => s === '')) {
    document.querySelectorAll('.syllable-input').forEach(inp => {
      if (inp.value.trim() !== '') return;
      inp.classList.remove('shake');
      void inp.offsetWidth; // reflow to restart CSS animation
      inp.classList.add('shake');
      inp.addEventListener('animationend', () => inp.classList.remove('shake'), { once: true });
    });
    return;
  }

  const result = evaluateGuess(guess, keyword);
  guesses.push(guess);
  renderResultRow(guess, result);

  if (result.every(r => r === 'green')) {
    setTimeout(showWin, 400);
    return;
  }

  document.querySelectorAll('.syllable-input').forEach(inp => { inp.value = ''; });
  document.querySelector('.syllable-input').focus();
}

function handleCopy() {
  const text = document.getElementById('share-grid').textContent
    + '\n'
    + document.getElementById('share-url').textContent;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    const orig = btn.textContent;
    btn.textContent = 'Đã sao chép!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
}

function init() {
  // Security: parse seed as integer immediately; discard invalid values
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('seed');
  if (raw !== null) {
    const parsed = parseInt(raw, 10);
    seed = (!isNaN(parsed) && parsed >= 0 && parsed < WORDS.length)
      ? parsed
      : getDailySeed();
  } else {
    seed = getDailySeed();
  }

  keyword = WORDS[seed];
  console.log(`[Vordle] seed=${seed} keyword="${keyword.join(' ')}"`);

  const infoEl = document.getElementById('keyword-info');
  const strong = document.createElement('strong');
  strong.textContent = keyword.length;
  infoEl.textContent = 'Từ khóa gồm ';
  infoEl.appendChild(strong);
  infoEl.appendChild(document.createTextNode(' âm tiết'));

  renderHint();
  renderInputRow();

  document.getElementById('submit-btn').addEventListener('click', handleSubmit);
  document.getElementById('copy-btn').addEventListener('click', handleCopy);

  document.getElementById('input-row').addEventListener('keydown', e => {
    if (e.key !== ' ') return;
    e.preventDefault();
    const inputs = [...document.querySelectorAll('.syllable-input')];
    const idx = inputs.indexOf(document.activeElement);
    if (idx !== -1 && idx < inputs.length - 1) inputs[idx + 1].focus();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('win-panel').classList.contains('hidden')) {
      handleSubmit();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
