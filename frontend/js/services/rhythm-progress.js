import { RHYTHM_PATTERNS } from '../theory/rhythm-patterns.js';

const STORAGE_KEY = 'ogp.rhythm-progress.v1';
const MASTERY_ORDER = Object.freeze(['new', 'heard', 'built', 'played', 'remembered']);
const MAX_ATTEMPTS_PER_PATTERN = 40;

function blankPatternProgress() {
    return {
        mastery: 'new',
        heardAt: null,
        builtAt: null,
        playedAt: null,
        rememberedAt: null,
        cleanCopyRuns: 0,
        cleanRecallRuns: 0,
        bestScore: 0,
        bestBpm: 0,
        lastPracticedAt: null,
        attempts: [],
    };
}

function blankProgress() {
    return {
        version: 1,
        patterns: {},
        preferences: {
            bpm: 80,
            scaffold: 'full',
            leftHanded: false,
            loop: false,
            latencyOffsetMs: 0,
        },
    };
}

function storage() {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
        return null;
    }
}

function load() {
    const target = storage();
    if (!target) return blankProgress();
    try {
        const saved = JSON.parse(target.getItem(STORAGE_KEY));
        if (!saved || saved.version !== 1) return blankProgress();
        return {
            ...blankProgress(),
            ...saved,
            preferences: { ...blankProgress().preferences, ...(saved.preferences || {}) },
            patterns: saved.patterns || {},
        };
    } catch {
        return blankProgress();
    }
}

function save(progress) {
    try {
        storage()?.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
        // Practice stays usable when storage is blocked or full.
    }
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function masteryAtLeast(mastery, threshold) {
    return MASTERY_ORDER.indexOf(mastery) >= MASTERY_ORDER.indexOf(threshold);
}

function upgrade(record, mastery) {
    if (!masteryAtLeast(record.mastery, mastery)) record.mastery = mastery;
}

function mutatePattern(patternId, callback) {
    const progress = load();
    const record = { ...blankPatternProgress(), ...(progress.patterns[patternId] || {}) };
    callback(record);
    progress.patterns[patternId] = record;
    save(progress);
    return clone(record);
}

export function getRhythmProgress() {
    return clone(load());
}

export function getPatternProgress(patternId) {
    const saved = load().patterns[patternId];
    return clone({ ...blankPatternProgress(), ...(saved || {}) });
}

export function getRhythmPreferences() {
    return clone(load().preferences);
}

export function setRhythmPreference(key, value) {
    const progress = load();
    progress.preferences[key] = value;
    save(progress);
    return clone(progress.preferences);
}

export function markPatternHeard(patternId, timestamp = new Date().toISOString()) {
    return mutatePattern(patternId, record => {
        record.heardAt = record.heardAt || timestamp;
        record.lastPracticedAt = timestamp;
        upgrade(record, 'heard');
    });
}

export function recordBuildResult(patternId, result, timestamp = new Date().toISOString()) {
    return mutatePattern(patternId, record => {
        record.lastPracticedAt = timestamp;
        record.bestScore = Math.max(record.bestScore, result.score || 0);
        if ((result.score || 0) >= 90) {
            record.builtAt = record.builtAt || timestamp;
            upgrade(record, 'built');
        }
    });
}

export function recordRhythmAttempt(
    patternId,
    result,
    { phase = 'copy', scaffold = 'full', timestamp = new Date().toISOString() } = {},
) {
    return mutatePattern(patternId, record => {
        record.lastPracticedAt = timestamp;
        record.bestScore = Math.max(record.bestScore, result.score || 0);
        if ((result.score || 0) >= 88) record.bestBpm = Math.max(record.bestBpm, result.bpm || 0);

        record.attempts = [
            ...(record.attempts || []),
            {
                timestamp,
                phase,
                scaffold,
                score: result.score || 0,
                bpm: result.bpm || 0,
                misses: result.misses || 0,
                extras: result.extras || 0,
                earlyLateBiasMs: result.earlyLateBiasMs || 0,
                spreadMs: result.spreadMs || 0,
            },
        ].slice(-MAX_ATTEMPTS_PER_PATTERN);

        if (phase === 'copy') {
            record.cleanCopyRuns = (result.score || 0) >= 88 ? record.cleanCopyRuns + 1 : 0;
            if (record.cleanCopyRuns >= 2) {
                record.playedAt = record.playedAt || timestamp;
                upgrade(record, 'played');
            }
        }

        if (phase === 'recall') {
            record.cleanRecallRuns = (result.score || 0) >= 84 ? record.cleanRecallRuns + 1 : 0;
            const playedOnEarlierDate = record.playedAt
                && record.playedAt.slice(0, 10) < timestamp.slice(0, 10);
            if (record.cleanRecallRuns >= 2 && playedOnEarlierDate) {
                record.rememberedAt = record.rememberedAt || timestamp;
                upgrade(record, 'remembered');
            }
        }
    });
}

export function getUnlockedPatternIds(progress = load()) {
    const unlocked = new Set();
    RHYTHM_PATTERNS.forEach((item, index) => {
        if (index === 0) {
            unlocked.add(item.id);
            return;
        }
        const previous = RHYTHM_PATTERNS[index - 1];
        const previousRecord = { ...blankPatternProgress(), ...(progress.patterns[previous.id] || {}) };
        if (masteryAtLeast(previousRecord.mastery, 'played')) unlocked.add(item.id);
    });
    return [...unlocked];
}

export function isPatternUnlocked(patternId) {
    return getUnlockedPatternIds().includes(patternId);
}

export function getNextRecommendedPattern() {
    const progress = load();
    const unlocked = new Set(getUnlockedPatternIds(progress));
    const notPlayed = RHYTHM_PATTERNS.find(item => {
        const record = { ...blankPatternProgress(), ...(progress.patterns[item.id] || {}) };
        return unlocked.has(item.id) && !masteryAtLeast(record.mastery, 'played');
    });
    if (notPlayed) return notPlayed;

    const practiced = RHYTHM_PATTERNS
        .map(item => ({ item, record: { ...blankPatternProgress(), ...(progress.patterns[item.id] || {}) } }))
        .filter(entry => masteryAtLeast(entry.record.mastery, 'played'))
        .sort((a, b) => String(a.record.lastPracticedAt).localeCompare(String(b.record.lastPracticedAt)));
    return practiced[0]?.item || RHYTHM_PATTERNS[0];
}

export function resetRhythmProgress() {
    const progress = blankProgress();
    save(progress);
    return clone(progress);
}

export { MASTERY_ORDER };
