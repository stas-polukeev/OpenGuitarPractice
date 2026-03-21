// Negative mining: track errors and response times per (note, string) pair.
// Uses localStorage. Weights sampling toward harder combinations.

const STORAGE_KEY = 'guitar_trainer_stats';

function load() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
}

function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function key(stringIndex, chromaticNote) {
    return `${stringIndex}:${chromaticNote}`;
}

// Record a result for a (string, note) pair.
// correct: boolean, timeMs: response time in milliseconds (0 if not timed)
export function recordResult(stringIndex, chromaticNote, correct, timeMs = 0) {
    const data = load();
    const k = key(stringIndex, chromaticNote);
    if (!data[k]) data[k] = { errors: 0, correct: 0, totalMs: 0, count: 0 };
    const entry = data[k];
    if (correct) {
        entry.correct++;
    } else {
        entry.errors++;
    }
    if (timeMs > 0) {
        entry.totalMs += timeMs;
        entry.count++;
    }
    save(data);
}

// Get a difficulty weight for a (string, note) pair.
// Higher = harder = should appear more often.
// Returns a value >= 1.0. Unknown pairs get weight 2 (medium priority).
export function getWeight(stringIndex, chromaticNote) {
    const data = load();
    const k = key(stringIndex, chromaticNote);
    const entry = data[k];
    if (!entry) return 2; // unseen = medium priority

    const total = entry.errors + entry.correct;
    if (total === 0) return 2;

    // Error rate component (0 to 1)
    const errorRate = entry.errors / total;

    // Slow response component (normalized)
    let slowFactor = 0;
    if (entry.count > 0) {
        const avgMs = entry.totalMs / entry.count;
        slowFactor = Math.min(avgMs / 10000, 1); // 10s = max slow
    }

    // Weight: 1 (easy) to 5 (hard)
    return 1 + errorRate * 2 + slowFactor * 2;
}

// Weighted random pick from an array of {string, note} pairs.
// Favors pairs with higher difficulty weight.
export function weightedPick(pairs) {
    if (pairs.length === 0) return null;
    const weights = pairs.map(p => getWeight(p.s ?? p.string, p.n ?? p.note));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < pairs.length; i++) {
        r -= weights[i];
        if (r <= 0) return pairs[i];
    }
    return pairs[pairs.length - 1];
}

// Get stats summary for display
export function getStatsSummary() {
    const data = load();
    const entries = Object.entries(data);
    if (entries.length === 0) return null;

    let totalErrors = 0, totalCorrect = 0;
    const hardest = [];
    for (const [k, v] of entries) {
        totalErrors += v.errors;
        totalCorrect += v.correct;
        const total = v.errors + v.correct;
        if (total >= 3) {
            hardest.push({ key: k, errorRate: v.errors / total, total });
        }
    }
    hardest.sort((a, b) => b.errorRate - a.errorRate);

    return {
        totalAttempts: totalErrors + totalCorrect,
        accuracy: totalCorrect / (totalErrors + totalCorrect),
        hardest: hardest.slice(0, 5),
    };
}

export function clearStats() {
    localStorage.removeItem(STORAGE_KEY);
}
