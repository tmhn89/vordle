// Vietnamese vowels (base forms with shape-modifiers, without tone marks)
const VOWEL_SET = new Set(["a", "ă", "â", "e", "ê", "i", "o", "ô", "ơ", "u", "ư", "y"]);
// ă=ă â=â ê=ê ô=ô ơ=ơ ư=ư

// Derive NFD combining characters from known Vietnamese characters
// Each precomposed char decomposes to [base, ...combiners] in NFD
const GRAVE = "à".normalize("NFD")[1]; // à → a + U+0300 (huyền)
const ACUTE = "á".normalize("NFD")[1]; // á → a + U+0301 (sắc)
const HOOK = "ả".normalize("NFD")[1]; // ả → a + U+0309 (hỏi)
const TILDE = "ã".normalize("NFD")[1]; // ã → a + U+0303 (ngã)
const DOT = "ạ".normalize("NFD")[1]; // ạ → a + U+0323 (nặng)
const CIRCUMFLEX = "â".normalize("NFD")[1]; // â → a + U+0302
const BREVE = "ă".normalize("NFD")[1]; // ă → a + U+0306
const HORN = "ơ".normalize("NFD")[1]; // ơ → o + U+031B

// Map: NFD tone combiner → display symbol
const TONE_MAP = new Map([
    [GRAVE, "`"], // huyền → `
    [ACUTE, "'"], // sắc   → '
    [HOOK, "?"], // hỏi   → ?
    [TILDE, "~"], // ngã   → ~
    [DOT, "."], // nặng  → .
]);

// NFD combining characters that modify vowel shape (not tone)
const VOWEL_MODIFIER = new Set([CIRCUMFLEX, BREVE, HORN]);

// Display order: huyền, ngã, hỏi, sắc, nặng
const TONE_ORDER = ["`", "~", "?", "'", "."];

const WORDS_PER_DAY = 5;
const WIN_DELAY_MS = 400;
const COPY_FEEDBACK_MS = 2000;

let seed = "";
let keyword = [];
let guesses = [];
let quizIndex = 0; // 0-based; URL param ?quiz= is 1-based
let displayDate = "";

function saveProgress(hash, qi, guessArr) {
    try {
        const store = JSON.parse(localStorage.getItem("vordle") || "{}");
        if (!store[hash]) store[hash] = {};
        store[hash][qi] = { guesses: guessArr, ts: Date.now() };
        localStorage.setItem("vordle", JSON.stringify(store));
    } catch (_) {}
}

function loadProgress(hash, qi) {
    try {
        const store = JSON.parse(localStorage.getItem("vordle") || "{}");
        return store[hash]?.[qi] || null;
    } catch (_) {
        return null;
    }
}

function isDayDone(hash) {
    return Array.from({ length: WORDS_PER_DAY }, (_, i) => i).every((i) => loadProgress(hash, i) !== null);
}

// Extract phụ âm, nguyên âm, thanh from an array of syllables.
//
// NFD canonical ordering puts dot-below (U+0323, nặng, CCC=220) BEFORE
// circumflex (U+0302, CCC=230) and breve (U+0306, CCC=230), so e.g. 'ộ'
// decomposes to o + U+0323 + U+0302 — the tone mark comes before the shape
// modifier. To handle this correctly we run two separate passes: one for
// tones (scan every char), one for base letters (inner loop skips tone marks
// while still hunting for shape modifiers).
function extractHint(syllables) {
    const consonants = [];
    const vowels = [];
    const tones = [];

    for (const syllable of syllables) {
        const nfd = syllable.normalize("NFD").toLowerCase();

        // Pass 1: collect tone marks (order-independent scan)
        for (const ch of nfd) {
            if (TONE_MAP.has(ch)) tones.push(TONE_MAP.get(ch));
        }

        // Pass 2: collect base letters with their vowel-shape modifiers
        let i = 0;
        while (i < nfd.length) {
            const ch = nfd[i];

            if (TONE_MAP.has(ch) || VOWEL_MODIFIER.has(ch) || ch === " ") {
                i++;
                continue;
            }

            // Base letter found. Collect following vowel-shape modifiers, skipping
            // any tone marks that appear between base and modifier due to CCC reorder.
            let combined = ch;
            let j = i + 1;
            while (j < nfd.length) {
                const c = nfd[j];
                if (VOWEL_MODIFIER.has(c)) {
                    combined += c;
                    j++;
                } else if (TONE_MAP.has(c)) {
                    j++; // tone already collected in pass 1; skip it here
                } else {
                    break;
                }
            }

            const letter = combined.normalize("NFC");

            if (VOWEL_SET.has(letter)) {
                vowels.push(letter);
            } else if (/^[a-zđ]$/.test(letter)) {
                consonants.push(letter);
            }

            i = j;
        }
    }

    consonants.sort((a, b) => a.localeCompare(b, "vi"));
    vowels.sort((a, b) => a.localeCompare(b, "vi"));
    tones.sort((a, b) => TONE_ORDER.indexOf(a) - TONE_ORDER.indexOf(b));

    return { consonants, vowels, tones };
}

function renderHint() {
    const { consonants, vowels, tones } = extractHint(keyword);
    document.getElementById("hint-consonants").textContent = consonants.join("  ");
    document.getElementById("hint-vowels").textContent = vowels.join("  ");
    document.getElementById("hint-tones").textContent = tones.join("  ");
}

function renderInputRow() {
    const row = document.getElementById("input-row");
    row.innerHTML = "";

    keyword.forEach((_, i) => {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "syllable-input";
        input.setAttribute("aria-label", `Âm tiết ${i + 1}`);
        input.autocomplete = "off";
        input.autocorrect = "off";
        input.autocapitalize = "off";
        input.spellcheck = false;
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\s+/g, "");
        });
        row.appendChild(input);
    });

    row.firstElementChild.focus();
}

function getCurrentGuess() {
    return Array.from(document.querySelectorAll(".syllable-input"), (inp) =>
        inp.value.trim().toLowerCase().normalize("NFC"),
    );
}

// Wordle-style evaluation: resolve greens first, then yellows consuming remaining pool
function evaluateGuess(guess, answer) {
    const result = new Array(answer.length).fill("red");
    const pool = [...answer];

    guess.forEach((s, i) => {
        if (s === answer[i]) {
            result[i] = "green";
            pool[i] = null;
        }
    });

    guess.forEach((s, i) => {
        if (result[i] === "green") return;
        const idx = pool.indexOf(s);
        if (idx !== -1) {
            result[i] = "yellow";
            pool[idx] = null;
        }
    });

    return result;
}

function renderResultRow(guess, result) {
    const row = document.createElement("div");
    row.className = "result-row";

    guess.forEach((syllable, i) => {
        const cell = document.createElement("div");
        cell.className = `result-cell ${result[i]}`;
        cell.textContent = syllable; // textContent — never innerHTML — for user input
        row.appendChild(cell);
    });

    document.getElementById("results").appendChild(row);
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function buildEmojiGrid() {
    const rows = guesses.map((g) => {
        const result = evaluateGuess(g, keyword);
        return result.map((r) => ({ green: "🟩", yellow: "🟨", red: "🟥" })[r]).join("");
    });
    return [`Tiếng Việt eazy? ${displayDate} (${quizIndex + 1}/${WORDS_PER_DAY})`, ...rows].join("\n");
}

function showWin() {
    saveProgress(seed, quizIndex, guesses);

    document.getElementById("input-row").classList.add("hidden");
    document.getElementById("submit-btn").classList.add("hidden");

    document.getElementById("win-answer").textContent = keyword.join(" ");
    document.getElementById("share-grid").textContent = buildEmojiGrid();

    const shareUrl = `${location.origin}${location.pathname}?seed=${seed}&quiz=${quizIndex + 1}`;
    const linkEl = document.getElementById("share-url");
    linkEl.textContent = shareUrl;
    linkEl.href = shareUrl;

    if (quizIndex < WORDS_PER_DAY - 1) {
        const nextQuizBtn = document.getElementById("next-quiz-btn");
        nextQuizBtn.classList.remove("hidden");
        nextQuizBtn.addEventListener("click", () => {
            location.href = `${location.pathname}?seed=${seed}&quiz=${quizIndex + 2}`;
        });
    }

    document.getElementById("win-panel").classList.remove("hidden");
}

function handleSubmit() {
    const guess = getCurrentGuess();

    if (guess.some((s) => s === "")) {
        document.querySelectorAll(".syllable-input").forEach((inp) => {
            if (inp.value.trim() !== "") return;
            inp.classList.remove("shake");
            void inp.offsetWidth; // reflow to restart CSS animation
            inp.classList.add("shake");
            inp.addEventListener("animationend", () => inp.classList.remove("shake"), { once: true });
        });
        return;
    }

    const result = evaluateGuess(guess, keyword);
    guesses.push(guess);
    renderResultRow(guess, result);

    if (result.every((r) => r === "green")) {
        setTimeout(showWin, WIN_DELAY_MS);
        return;
    }

    document.querySelectorAll(".syllable-input").forEach((inp) => {
        inp.value = "";
    });
    document.querySelector(".syllable-input").focus();
}

function handleCopy() {
    const text =
        document.getElementById("share-grid").textContent + "\n" + document.getElementById("share-url").textContent;

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("copy-btn");
        const orig = btn.textContent;
        btn.textContent = "Đã sao chép!";
        setTimeout(() => {
            btn.textContent = orig;
        }, COPY_FEEDBACK_MS);
    });
}

function init() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("seed");
    seed = raw && SCHEDULE[raw] ? raw : TODAY_HASH;

    const quizParam = parseInt(params.get("quiz") || "1", 10);
    quizIndex = Math.max(0, Math.min(WORDS_PER_DAY - 1, quizParam - 1));

    keyword = SCHEDULE[seed][quizIndex];

    const infoEl = document.getElementById("keyword-info");
    const strong = document.createElement("strong");
    strong.textContent = keyword.length;
    infoEl.textContent = "Từ khóa gồm ";
    infoEl.appendChild(strong);
    infoEl.appendChild(document.createTextNode(" âm tiết"));

    renderHint();
    renderInputRow();

    // Day navigation
    const dayIndex = HASH_TIMELINE.indexOf(seed);
    const todayIndex = HASH_TIMELINE.length - 1;

    const dateOffset = dayIndex === -1 ? null : dayIndex - todayIndex;
    if (dateOffset !== null) {
        const [y, m, d] = TODAY_DATE.split("-").map(Number);
        const utc = new Date(Date.UTC(y, m - 1, d + dateOffset));
        displayDate = utc.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
    }

    const currentDateEl = document.getElementById("current-date");
    currentDateEl.textContent = displayDate;

    const prevBtn = document.getElementById("prev-day");
    const nextBtn = document.getElementById("next-day");

    if (dayIndex <= 0) prevBtn.setAttribute("disabled", "");
    if (dayIndex === -1 || dayIndex >= todayIndex) nextBtn.setAttribute("disabled", "");

    prevBtn.addEventListener("click", () => {
        if (dayIndex > 0) location.href = `${location.pathname}?seed=${HASH_TIMELINE[dayIndex - 1]}`;
    });
    nextBtn.addEventListener("click", () => {
        if (dayIndex !== -1 && dayIndex < todayIndex)
            location.href = `${location.pathname}?seed=${HASH_TIMELINE[dayIndex + 1]}`;
    });

    // Quiz navigator
    document.querySelectorAll(".quiz-btn").forEach((btn) => {
        const qi = parseInt(btn.dataset.quiz, 10) - 1;
        if (qi === quizIndex) btn.classList.add("active");
        if (loadProgress(seed, qi)) btn.classList.add("done");
        btn.addEventListener("click", () => {
            location.href = `${location.pathname}?seed=${seed}&quiz=${qi + 1}`;
        });
    });

    // Mark days already completed in the nav
    if (isDayDone(seed)) currentDateEl.classList.add("done");
    if (dayIndex > 0 && isDayDone(HASH_TIMELINE[dayIndex - 1])) prevBtn.classList.add("done");
    if (dayIndex !== -1 && dayIndex < todayIndex && isDayDone(HASH_TIMELINE[dayIndex + 1]))
        nextBtn.classList.add("done");

    document.getElementById("copy-btn").addEventListener("click", handleCopy);
    document.getElementById("clear-btn").addEventListener("click", () => {
        localStorage.removeItem("vordle");
        location.reload();
    });

    // Already-played flow: replay stored guesses and show win panel immediately
    const stored = loadProgress(seed, quizIndex);
    if (stored) {
        guesses = stored.guesses;
        guesses.forEach((g) => renderResultRow(g, evaluateGuess(g, keyword)));
        showWin();
        return;
    }

    document.getElementById("submit-btn").addEventListener("click", handleSubmit);

    document.getElementById("input-row").addEventListener("keydown", (e) => {
        if (e.key !== " ") return;
        e.preventDefault();
        const inputs = [...document.querySelectorAll(".syllable-input")];
        const idx = inputs.indexOf(document.activeElement);
        if (idx !== -1 && idx < inputs.length - 1) inputs[idx + 1].focus();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && document.getElementById("win-panel").classList.contains("hidden")) {
            handleSubmit();
        }
    });
}

document.addEventListener("DOMContentLoaded", init);
