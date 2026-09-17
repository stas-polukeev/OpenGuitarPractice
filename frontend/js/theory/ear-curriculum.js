export const EAR_PROGRESS_KEY = 'guitar_trainer_ear_progress_v1';
export const REVIEW_INTERVALS_MS = [10 * 60_000, 86_400_000, 3 * 86_400_000, 7 * 86_400_000, 14 * 86_400_000, 30 * 86_400_000];

export const DEGREE_LIBRARY = Object.freeze({
    '1': { id: '1', semitones: 0, solfege: 'Do', name: 'tonic' },
    'b2': { id: 'b2', display: '♭2', semitones: 1, solfege: 'Ra', name: 'flat supertonic' },
    '2': { id: '2', semitones: 2, solfege: 'Re', name: 'supertonic' },
    'b3': { id: 'b3', display: '♭3', semitones: 3, solfege: 'Me', name: 'minor mediant' },
    '3': { id: '3', semitones: 4, solfege: 'Mi', name: 'mediant' },
    '4': { id: '4', semitones: 5, solfege: 'Fa', name: 'subdominant' },
    '#4': { id: '#4', display: '♯4', semitones: 6, solfege: 'Fi', name: 'raised fourth' },
    'b5': { id: 'b5', display: '♭5', semitones: 6, solfege: 'Se', name: 'flat fifth' },
    '5': { id: '5', semitones: 7, solfege: 'Sol', name: 'dominant' },
    'b6': { id: 'b6', display: '♭6', semitones: 8, solfege: 'Le', name: 'flat submediant' },
    '6': { id: '6', semitones: 9, solfege: 'La', name: 'submediant' },
    'b7': { id: 'b7', display: '♭7', semitones: 10, solfege: 'Te', name: 'subtonic' },
    '7': { id: '7', semitones: 11, solfege: 'Ti', name: 'leading tone' },
});

export const MODES = Object.freeze({
    ionian: { id: 'ionian', name: 'Ionian (major)', degrees: ['1', '2', '3', '4', '5', '6', '7'], quality: 'major' },
    dorian: { id: 'dorian', name: 'Dorian', degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'], quality: 'minor' },
    phrygian: { id: 'phrygian', name: 'Phrygian', degrees: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], quality: 'minor' },
    lydian: { id: 'lydian', name: 'Lydian', degrees: ['1', '2', '3', '#4', '5', '6', '7'], quality: 'major' },
    mixolydian: { id: 'mixolydian', name: 'Mixolydian', degrees: ['1', '2', '3', '4', '5', '6', 'b7'], quality: 'major' },
    aeolian: { id: 'aeolian', name: 'Aeolian (natural minor)', degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], quality: 'minor' },
    locrian: { id: 'locrian', name: 'Locrian', degrees: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], quality: 'diminished' },
});

const DEFAULT_MASTERY = Object.freeze({ minAttempts: 24, minPerTarget: 4, accuracy: 0.85, retentionAccuracy: 0.8 });

export const EAR_LEVELS = Object.freeze([
    { id: 'ear-home-power', title: 'Home & Power', subtitle: 'Hear tonic and dominant', mode: 'ionian', degrees: ['1', '5'], context: 'cadence', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 16, minPerTarget: 6 } },
    { id: 'ear-tonic-triad', title: 'The Tonic Chord', subtitle: 'Add the color of the third', mode: 'ionian', degrees: ['1', '3', '5'], context: 'cadence', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 20 } },
    { id: 'ear-tendency', title: 'Tension & Release', subtitle: 'Add 4 and the leading tone', mode: 'ionian', degrees: ['1', '3', '4', '5', '7'], context: 'cadence', clean: true, mastery: DEFAULT_MASTERY },
    { id: 'ear-major-complete', title: 'Complete Major', subtitle: 'All seven major degrees', mode: 'ionian', degrees: MODES.ionian.degrees, context: 'cadence', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 32 } },
    { id: 'ear-major-transfer', title: 'Major Transfer', subtitle: 'New registers and timbres', mode: 'ionian', degrees: MODES.ionian.degrees, context: 'scale', clean: false, registers: 2, timbres: ['piano', 'guitar', 'bright'], mastery: { ...DEFAULT_MASTERY, minAttempts: 36 } },
    { id: 'ear-minor-triad', title: 'Minor Home', subtitle: 'Hear 1, ♭3 and 5', mode: 'aeolian', degrees: ['1', 'b3', '5'], context: 'minor-cadence', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 20 } },
    { id: 'ear-minor-complete', title: 'Complete Natural Minor', subtitle: 'All seven Aeolian degrees', mode: 'aeolian', degrees: MODES.aeolian.degrees, context: 'minor-cadence', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 32 } },
    { id: 'ear-dorian', title: 'Dorian Color', subtitle: 'Minor with a natural 6', mode: 'dorian', degrees: MODES.dorian.degrees, context: 'scale', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 32 } },
    { id: 'ear-phrygian', title: 'Phrygian Color', subtitle: 'Minor with a ♭2', mode: 'phrygian', degrees: MODES.phrygian.degrees, context: 'scale', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 32 } },
    { id: 'ear-lydian', title: 'Lydian Color', subtitle: 'Major with a ♯4', mode: 'lydian', degrees: MODES.lydian.degrees, context: 'scale', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 32 } },
    { id: 'ear-mixolydian', title: 'Mixolydian Color', subtitle: 'Major with a ♭7', mode: 'mixolydian', degrees: MODES.mixolydian.degrees, context: 'scale', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 32 } },
    { id: 'ear-locrian', title: 'Locrian Color', subtitle: 'Minor with ♭2 and ♭5', mode: 'locrian', degrees: MODES.locrian.degrees, context: 'scale', clean: true, mastery: { ...DEFAULT_MASTERY, minAttempts: 32 } },
]);

export const MELODY_LEVELS = Object.freeze([
    { id: 'melody-2-stepwise', title: 'Two-note Steps', subtitle: 'Follow a two-note contour', mode: 'ionian', length: 2, stepwise: true, degrees: MODES.ionian.degrees, mastery: { ...DEFAULT_MASTERY, minAttempts: 16, minPerTarget: 0, accuracy: 0.8 } },
    { id: 'melody-2-skips', title: 'Two-note Leaps', subtitle: 'Add skips within major', mode: 'ionian', length: 2, stepwise: false, degrees: MODES.ionian.degrees, mastery: { ...DEFAULT_MASTERY, minAttempts: 18, minPerTarget: 0, accuracy: 0.8 } },
    { id: 'melody-3-major', title: 'Three-note Calls', subtitle: 'Remember a short major phrase', mode: 'ionian', length: 3, stepwise: false, degrees: MODES.ionian.degrees, mastery: { ...DEFAULT_MASTERY, minAttempts: 20, minPerTarget: 0, accuracy: 0.8 } },
    { id: 'melody-4-major', title: 'Four-note Calls', subtitle: 'Hold a complete musical idea', mode: 'ionian', length: 4, stepwise: false, degrees: MODES.ionian.degrees, mastery: { ...DEFAULT_MASTERY, minAttempts: 24, minPerTarget: 0, accuracy: 0.8 } },
    { id: 'melody-3-minor', title: 'Minor Calls', subtitle: 'Transfer memory to Aeolian', mode: 'aeolian', length: 3, stepwise: false, degrees: MODES.aeolian.degrees, mastery: { ...DEFAULT_MASTERY, minAttempts: 24, minPerTarget: 0, accuracy: 0.8 } },
    { id: 'melody-5-modes', title: 'Modal Phrases', subtitle: 'Longer calls in changing modes', modes: ['dorian', 'phrygian', 'lydian', 'mixolydian'], length: 5, stepwise: false, mastery: { ...DEFAULT_MASTERY, minAttempts: 30, minPerTarget: 0, accuracy: 0.78 } },
]);

export const AURAL_LEVELS = Object.freeze([...EAR_LEVELS, ...MELODY_LEVELS]);

const TONICS = [48, 50, 52, 53, 55, 57, 59]; // C3 through B3, guitar-friendly keys.

function clampRandom(random) {
    return Math.max(0, Math.min(0.999999999, Number(random()) || 0));
}

function pick(array, random = Math.random) {
    return array[Math.floor(clampRandom(random) * array.length)];
}

export function degreeInfo(id) {
    const degree = DEGREE_LIBRARY[id];
    if (!degree) throw new Error(`Unknown scale degree: ${id}`);
    return { ...degree, display: degree.display || degree.id };
}

export function degreeToMidi(tonicMidi, degreeId, octave = 0) {
    return tonicMidi + degreeInfo(degreeId).semitones + octave * 12;
}

export function getAuralLevel(levelId) {
    return AURAL_LEVELS.find((level) => level.id === levelId) || null;
}

function weightedPick(items, weightFor, random) {
    const weights = items.map((item) => Math.max(0.01, weightFor(item)));
    const total = weights.reduce((sum, value) => sum + value, 0);
    let cursor = clampRandom(random) * total;
    for (let i = 0; i < items.length; i++) {
        cursor -= weights[i];
        if (cursor <= 0) return items[i];
    }
    return items[items.length - 1];
}

export function chooseAdaptiveDegree(level, progress = createEmptyProgress(), random = Math.random, excludeDegree = null, now = Date.now()) {
    const candidates = level.degrees.filter((degree) => level.degrees.length === 1 || degree !== excludeDegree);
    const itemStats = progress.levels?.[level.id]?.items || {};
    return weightedPick(candidates, (degree) => {
        const item = itemStats[degree];
        if (!item) return 5;
        const accuracy = item.attempts ? item.correct / item.attempts : 0;
        const dueBoost = !item.dueAt || item.dueAt <= now ? 2.5 : 0;
        return 0.75 + (1 - accuracy) * 4 + dueBoost;
    }, random);
}

function cadenceFor(mode, tonicMidi, minor = false) {
    const isMinor = minor || MODES[mode]?.quality !== 'major';
    const tonic = isMinor ? [0, 3, 7] : [0, 4, 7];
    const subdominant = isMinor ? [5, 8, 12] : [5, 9, 12];
    // A major dominant clearly points home even when the target collection is minor.
    const dominant = [7, 11, 14];
    return [tonic, subdominant, dominant, tonic].map((chord, index) => ({
        midis: chord.map((offset) => tonicMidi + offset),
        offset: index * 0.62,
        duration: 0.52,
    }));
}

function scaleContext(mode, tonicMidi) {
    const degrees = MODES[mode].degrees;
    const notes = degrees.map((degree, index) => ({
        midi: degreeToMidi(tonicMidi, degree),
        offset: index * 0.24,
        duration: 0.2,
    }));
    notes.push({ midi: tonicMidi + 12, offset: degrees.length * 0.24, duration: 0.42 });
    return notes;
}

export function buildTonalContext(modeId, tonicMidi, style = 'cadence') {
    if (!MODES[modeId]) throw new Error(`Unknown mode: ${modeId}`);
    if (style === 'scale') return { style, events: scaleContext(modeId, tonicMidi), targetOffset: 2.35 };
    const minor = style === 'minor-cadence';
    return { style, events: cadenceFor(modeId, tonicMidi, minor), targetOffset: 2.85 };
}

export function generateEarTrial({ levelId = EAR_LEVELS[0].id, progress = createEmptyProgress(), random = Math.random, tonicMidi, excludeDegree = null, now = Date.now() } = {}) {
    const level = EAR_LEVELS.find((entry) => entry.id === levelId);
    if (!level) throw new Error(`Unknown ear-training level: ${levelId}`);
    const tonic = Number.isFinite(tonicMidi) ? tonicMidi : pick(TONICS, random);
    const targetDegree = chooseAdaptiveDegree(level, progress, random, excludeDegree, now);
    const octave = (level.registers || 1) > 1 && clampRandom(random) > 0.58 ? 1 : 0;
    const timbre = pick(level.timbres || ['piano'], random);
    const context = buildTonalContext(level.mode, tonic, level.context);
    return {
        kind: 'degree',
        levelId: level.id,
        mode: level.mode,
        tonicMidi: tonic,
        targetDegree,
        targetMidi: degreeToMidi(tonic, targetDegree, octave),
        candidates: level.degrees.map(degreeInfo),
        context,
        timbre,
        clean: level.clean !== false,
    };
}

export function buildResolutionSequence(trial) {
    const target = trial.targetMidi;
    const degree = trial.targetDegree;
    const modeDegrees = MODES[trial.mode]?.degrees || MODES.ionian.degrees;
    const third = modeDegrees.includes('3') ? 4 : 3;
    const moves = {
        'b2': -1, '2': -2, 'b3': -3, '3': -4,
        '4': third - 5, '#4': 1, 'b5': 1, '5': 5,
        'b6': -1, '6': -2, 'b7': 2, '7': 1, '1': 0,
    };
    return [target, target + (moves[degree] ?? 0)];
}

function sequenceDegrees(level, random) {
    const degrees = level.degrees;
    if (!level.stepwise) {
        const result = [];
        while (result.length < level.length) {
            const candidate = pick(degrees, random);
            if (candidate !== result[result.length - 1] || degrees.length === 1) result.push(candidate);
        }
        return result;
    }
    let index = Math.floor(clampRandom(random) * degrees.length);
    let direction = clampRandom(random) < 0.5 ? -1 : 1;
    const result = [degrees[index]];
    while (result.length < level.length) {
        if (index + direction < 0 || index + direction >= degrees.length) direction *= -1;
        index += direction;
        result.push(degrees[index]);
    }
    return result;
}

export function generateMelodyTrial({ levelId = MELODY_LEVELS[0].id, random = Math.random, tonicMidi } = {}) {
    const level = MELODY_LEVELS.find((entry) => entry.id === levelId);
    if (!level) throw new Error(`Unknown melody-memory level: ${levelId}`);
    const mode = level.mode || pick(level.modes, random);
    const degrees = level.degrees || MODES[mode].degrees;
    const effectiveLevel = { ...level, degrees };
    const tonic = Number.isFinite(tonicMidi) ? tonicMidi : pick(TONICS, random);
    const sequence = sequenceDegrees(effectiveLevel, random);
    const midis = sequence.map((degree) => degreeToMidi(tonic, degree));
    return {
        kind: 'melody',
        levelId: level.id,
        mode,
        tonicMidi: tonic,
        sequence,
        midis,
        candidates: degrees.map(degreeInfo),
        context: buildTonalContext(mode, tonic, mode === 'ionian' ? 'cadence' : 'scale'),
        timbre: 'piano',
        clean: true,
    };
}

export function createEmptyProgress() {
    return { version: 1, levels: {} };
}

function normalizedProgress(progress) {
    return progress && typeof progress === 'object'
        ? { version: 1, ...progress, levels: { ...(progress.levels || {}) } }
        : createEmptyProgress();
}

export function recordAuralAttempt(progress, attempt) {
    const next = normalizedProgress(progress);
    const levelId = attempt.levelId;
    if (!levelId) throw new Error('Attempt requires levelId.');
    const now = Number.isFinite(attempt.now) ? attempt.now : Date.now();
    const target = String(attempt.targetDegree ?? attempt.target ?? 'unknown');
    const chosen = String(attempt.chosenDegree ?? attempt.chosen ?? 'unknown');
    const oldLevel = next.levels[levelId] || { attempts: 0, correct: 0, recent: [], daysSeen: [], items: {}, confusions: {} };
    const oldItem = oldLevel.items?.[target] || { attempts: 0, correct: 0, streak: 0, intervalIndex: -1, responseTimes: [] };
    const correct = Boolean(attempt.correct);
    const intervalIndex = correct
        ? Math.min(REVIEW_INTERVALS_MS.length - 1, (oldItem.intervalIndex ?? -1) + 1)
        : 0;
    const responseTimes = Number.isFinite(attempt.responseMs) && attempt.responseMs >= 0
        ? [...(oldItem.responseTimes || []), attempt.responseMs].slice(-12)
        : [...(oldItem.responseTimes || [])];
    const item = {
        ...oldItem,
        attempts: oldItem.attempts + 1,
        correct: oldItem.correct + (correct ? 1 : 0),
        streak: correct ? (oldItem.streak || 0) + 1 : 0,
        intervalIndex,
        lastSeen: now,
        dueAt: now + (correct ? REVIEW_INTERVALS_MS[intervalIndex] : 5 * 60_000),
        responseTimes,
    };
    const day = new Date(now).toISOString().slice(0, 10);
    const confusionKey = `${target}>${chosen}`;
    const level = {
        ...oldLevel,
        attempts: oldLevel.attempts + 1,
        correct: oldLevel.correct + (correct ? 1 : 0),
        recent: [...(oldLevel.recent || []), { correct, target, chosen, at: now, replays: attempt.replays || 0, hints: attempt.hints || 0 }].slice(-40),
        daysSeen: oldLevel.daysSeen?.includes(day) ? [...oldLevel.daysSeen] : [...(oldLevel.daysSeen || []), day].slice(-60),
        items: { ...(oldLevel.items || {}), [target]: item },
        confusions: { ...(oldLevel.confusions || {}), [confusionKey]: (oldLevel.confusions?.[confusionKey] || 0) + 1 },
    };
    next.levels[levelId] = level;
    return next;
}

export function getLevelSummary(progress, levelId) {
    const level = getAuralLevel(levelId);
    if (!level) throw new Error(`Unknown aural level: ${levelId}`);
    const stats = progress?.levels?.[levelId] || { attempts: 0, correct: 0, recent: [], daysSeen: [], items: {} };
    const mastery = level.mastery || DEFAULT_MASTERY;
    const recent = stats.recent || [];
    const scored = recent.slice(-Math.max(mastery.minAttempts, 30));
    const accuracy = scored.length ? scored.filter((item) => item.correct).length / scored.length : 0;
    const requiredTargets = mastery.minPerTarget > 0 ? (level.degrees || []) : [];
    const targetCoverage = requiredTargets.every((target) => (stats.items?.[target]?.attempts || 0) >= mastery.minPerTarget);
    const mastered = stats.attempts >= mastery.minAttempts && accuracy >= mastery.accuracy && targetCoverage;
    const retention = recent.slice(-10);
    const retentionAccuracy = retention.length ? retention.filter((item) => item.correct).length / retention.length : 0;
    const stable = mastered && (stats.daysSeen?.length || 0) >= 2 && retention.length >= 10 && retentionAccuracy >= mastery.retentionAccuracy;
    return {
        attempts: stats.attempts || 0,
        correct: stats.correct || 0,
        accuracy,
        targetCoverage,
        mastered,
        stable,
        daysSeen: stats.daysSeen?.length || 0,
    };
}

export function isLevelUnlocked(progress, levelId, curriculum = AURAL_LEVELS) {
    const index = curriculum.findIndex((level) => level.id === levelId);
    if (index < 0) return false;
    if (index === 0) return true;
    return getLevelSummary(progress, curriculum[index - 1].id).mastered;
}

export function loadAuralProgress(storage = globalThis.localStorage) {
    if (!storage) return createEmptyProgress();
    try {
        const parsed = JSON.parse(storage.getItem(EAR_PROGRESS_KEY));
        return normalizedProgress(parsed);
    } catch {
        return createEmptyProgress();
    }
}

export function saveAuralProgress(progress, storage = globalThis.localStorage) {
    if (storage) storage.setItem(EAR_PROGRESS_KEY, JSON.stringify(normalizedProgress(progress)));
    return progress;
}
