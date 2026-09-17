export const RHYTHM_LANES = Object.freeze(['hat', 'snare', 'kick']);
export const STEPS_PER_BAR = 16;

export const RHYTHM_STAGES = Object.freeze([
    { id: 'pulse', title: 'Feel the Pulse', description: 'Quarter notes and a steady internal clock.' },
    { id: 'backbeat', title: 'Build the Backbeat', description: 'Kick, snare, and eighth-note hi-hat layers.' },
    { id: 'rock', title: 'Rock Vocabulary', description: 'Common kick variations and two-feel contrasts.' },
    { id: 'metal', title: 'Metal Vocabulary', description: 'Driving subdivisions, gallops, and thrash energy.' },
    { id: 'form', title: 'Groove Memory', description: 'Fills, transitions, and longer musical thought.' },
]);

function pattern(id, title, stage, difficulty, bpmRange, lanes, concepts, description) {
    return Object.freeze({
        id,
        title,
        stage,
        difficulty,
        bpmRange: Object.freeze(bpmRange),
        bars: 1,
        subdivision: 16,
        lanes: Object.freeze({
            hat: Object.freeze(lanes.hat || []),
            snare: Object.freeze(lanes.snare || []),
            kick: Object.freeze(lanes.kick || []),
        }),
        concepts: Object.freeze(concepts),
        description,
    });
}

const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14];
const SIXTEENTHS = Array.from({ length: STEPS_PER_BAR }, (_, index) => index);

export const RHYTHM_PATTERNS = Object.freeze([
    pattern(
        'quarter-pulse', 'Quarter-note pulse', 'pulse', 1, [55, 90],
        { hat: [0, 4, 8, 12] },
        ['quarter notes', 'steady pulse'],
        'Anchor one tap on each numbered beat.',
    ),
    pattern(
        'downbeat-kick', 'Downbeat kick', 'pulse', 1, [55, 95],
        { kick: [0, 4, 8, 12] },
        ['quarter notes', 'kick drum'],
        'Move the same steady pulse to the kick.',
    ),
    pattern(
        'backbeat-skeleton', 'Backbeat skeleton', 'backbeat', 2, [55, 95],
        { snare: [4, 12], kick: [0, 8] },
        ['backbeat', 'beats 2 and 4'],
        'Kick on 1 and 3; snare on 2 and 4.',
    ),
    pattern(
        'basic-rock', 'Basic eighth-note rock', 'backbeat', 2, [60, 110],
        { hat: EIGHTHS, snare: [4, 12], kick: [0, 8] },
        ['eighth notes', 'backbeat', 'layering'],
        'The foundational rock groove: steady hats around a kick-snare backbeat.',
    ),
    pattern(
        'four-on-floor', 'Four on the floor', 'rock', 3, [70, 125],
        { hat: EIGHTHS, snare: [4, 12], kick: [0, 4, 8, 12] },
        ['four on the floor', 'simultaneous hits'],
        'A kick on every numbered beat creates continuous forward motion.',
    ),
    pattern(
        'rock-push', 'Rock push', 'rock', 3, [65, 120],
        { hat: EIGHTHS, snare: [4, 12], kick: [0, 6, 8] },
        ['offbeat kick', 'syncopation'],
        'The kick on the “and” of 2 pushes into beat 3.',
    ),
    pattern(
        'hard-rock-drive', 'Hard-rock drive', 'rock', 4, [70, 130],
        { hat: EIGHTHS, snare: [4, 12], kick: [0, 3, 6, 8, 11] },
        ['sixteenth-note kick', 'syncopation'],
        'Extra kicks around the backbeat add weight without moving the snare.',
    ),
    pattern(
        'half-time', 'Half-time weight', 'rock', 4, [65, 120],
        { hat: EIGHTHS, snare: [8], kick: [0, 6, 12] },
        ['half-time feel', 'snare on 3'],
        'The snare moves to beat 3, making the same tempo feel broader and heavier.',
    ),
    pattern(
        'double-time', 'Double-time lift', 'rock', 5, [55, 100],
        { hat: SIXTEENTHS, snare: [2, 6, 10, 14], kick: [0, 8] },
        ['double-time feel', 'sixteenth notes'],
        'Faster hats and backbeats make the pulse feel doubled without changing BPM.',
    ),
    pattern(
        'metal-eighth-drive', 'Metal eighth-note drive', 'metal', 5, [65, 115],
        { hat: EIGHTHS, snare: [4, 12], kick: [0, 2, 6, 8, 10, 14] },
        ['driving kick', 'eighth notes'],
        'The kick shadows selected eighth-note hats for a tight metal foundation.',
    ),
    pattern(
        'metal-gallop', 'Metal gallop', 'metal', 6, [55, 105],
        { hat: EIGHTHS, snare: [4, 12], kick: [0, 2, 3, 8, 10, 11] },
        ['gallop', 'sixteenth notes'],
        'An eighth followed by two sixteenths creates the classic galloping motion.',
    ),
    pattern(
        'reverse-gallop', 'Reverse gallop', 'metal', 6, [55, 105],
        { hat: EIGHTHS, snare: [4, 12], kick: [0, 1, 2, 8, 9, 10] },
        ['reverse gallop', 'sixteenth notes'],
        'Two sixteenths lead into an eighth for the reverse-gallop shape.',
    ),
    pattern(
        'thrash-engine', 'Thrash engine', 'metal', 7, [70, 125],
        { hat: EIGHTHS, snare: [2, 6, 10, 14], kick: [0, 3, 4, 7, 8, 11, 12, 15] },
        ['thrash', 'double-time', 'sixteenth-note kick'],
        'Alternating kick clusters and a double-time backbeat create controlled urgency.',
    ),
    pattern(
        'rock-fill-entry', 'Rock fill entry', 'form', 7, [60, 110],
        { hat: [0, 2, 4, 6, 8, 10], snare: [4, 12, 13, 14, 15], kick: [0, 8] },
        ['one-beat fill', 'transition'],
        'Keep the groove for three beats, then use four snare sixteenths as a transition.',
    ),
]);

const PATTERN_BY_ID = new Map(RHYTHM_PATTERNS.map(item => [item.id, item]));

export function getRhythmPattern(id) {
    return PATTERN_BY_ID.get(id) || null;
}

export function getPatternsForStage(stageId) {
    return RHYTHM_PATTERNS.filter(item => item.stage === stageId);
}

export function patternToGrid(source) {
    const target = typeof source === 'string' ? getRhythmPattern(source) : source;
    if (!target) return null;
    return Object.fromEntries(RHYTHM_LANES.map(lane => {
        const active = new Set(target.lanes[lane]);
        return [lane, Array.from({ length: STEPS_PER_BAR }, (_, step) => active.has(step))];
    }));
}

export function getExpectedEvents(source, { startTimeMs = 0, bpm = 80, lane = null } = {}) {
    const target = typeof source === 'string' ? getRhythmPattern(source) : source;
    if (!target) return [];
    const stepMs = 60000 / bpm / 4;
    const lanes = lane ? [lane] : RHYTHM_LANES;
    return lanes.flatMap(laneName => (target.lanes[laneName] || []).map(step => ({
        lane: laneName,
        step,
        timeMs: startTimeMs + step * stepMs,
    }))).sort((a, b) => a.timeMs - b.timeMs || RHYTHM_LANES.indexOf(a.lane) - RHYTHM_LANES.indexOf(b.lane));
}

export function getTimingWindows(bpm, level = 'beginner') {
    const stepMs = 60000 / bpm / 4;
    const presets = {
        beginner: { goodRatio: 0.38, perfectRatio: 0.17, goodFloor: 42, perfectFloor: 20, goodCap: 100, perfectCap: 45 },
        intermediate: { goodRatio: 0.30, perfectRatio: 0.14, goodFloor: 34, perfectFloor: 17, goodCap: 75, perfectCap: 36 },
        advanced: { goodRatio: 0.23, perfectRatio: 0.11, goodFloor: 28, perfectFloor: 15, goodCap: 58, perfectCap: 30 },
    };
    const preset = presets[level] || presets.beginner;
    return {
        goodMs: Math.max(preset.goodFloor, Math.min(preset.goodCap, stepMs * preset.goodRatio)),
        perfectMs: Math.max(preset.perfectFloor, Math.min(preset.perfectCap, stepMs * preset.perfectRatio)),
    };
}

function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function standardDeviation(values) {
    if (values.length < 2) return 0;
    const average = mean(values);
    return Math.sqrt(mean(values.map(value => (value - average) ** 2)));
}

function scoreLane(expected, actual, goodMs, perfectMs) {
    const matched = [];
    const misses = [];
    const extras = [];
    let expectedIndex = 0;
    let actualIndex = 0;

    while (expectedIndex < expected.length && actualIndex < actual.length) {
        const expectedEvent = expected[expectedIndex];
        const actualEvent = actual[actualIndex];
        const offsetMs = actualEvent.timeMs - expectedEvent.timeMs;

        if (offsetMs < -goodMs) {
            extras.push(actualEvent);
            actualIndex += 1;
        } else if (offsetMs > goodMs) {
            misses.push(expectedEvent);
            expectedIndex += 1;
        } else {
            matched.push({
                lane: expectedEvent.lane,
                step: expectedEvent.step,
                expectedTimeMs: expectedEvent.timeMs,
                actualTimeMs: actualEvent.timeMs,
                offsetMs,
                grade: Math.abs(offsetMs) <= perfectMs ? 'perfect' : 'good',
            });
            expectedIndex += 1;
            actualIndex += 1;
        }
    }

    misses.push(...expected.slice(expectedIndex));
    extras.push(...actual.slice(actualIndex));
    const offsets = matched.map(item => item.offsetMs);
    const completeness = expected.length ? matched.length / expected.length : (actual.length ? 0 : 1);
    const timing = matched.length
        ? mean(offsets.map(offset => Math.max(0, 1 - Math.abs(offset) / goodMs)))
        : 0;
    const spreadMs = standardDeviation(offsets);
    const consistency = matched.length ? Math.max(0, 1 - spreadMs / goodMs) : 0;

    return {
        expected: expected.length,
        matched,
        misses,
        extras,
        completeness,
        timing,
        earlyLateBiasMs: mean(offsets),
        spreadMs,
        consistency,
    };
}

export function scoreRhythmAttempt({
    pattern: source,
    hits = [],
    bpm = 80,
    startTimeMs = 0,
    latencyOffsetMs = 0,
    level = 'beginner',
    toleranceMs = null,
} = {}) {
    const target = typeof source === 'string' ? getRhythmPattern(source) : source;
    if (!target) throw new Error('A valid rhythm pattern is required.');
    const timingWindows = getTimingWindows(bpm, level);
    const goodMs = toleranceMs ?? timingWindows.goodMs;
    const perfectMs = Math.min(timingWindows.perfectMs, goodMs * 0.6);
    const expected = getExpectedEvents(target, { startTimeMs, bpm });
    const normalizedHits = hits
        .filter(hit => RHYTHM_LANES.includes(hit.lane) && Number.isFinite(hit.timeMs))
        .map(hit => ({ ...hit, timeMs: hit.timeMs - latencyOffsetMs }))
        .sort((a, b) => a.timeMs - b.timeMs);

    const byLane = {};
    for (const lane of RHYTHM_LANES) {
        byLane[lane] = scoreLane(
            expected.filter(event => event.lane === lane),
            normalizedHits.filter(event => event.lane === lane),
            goodMs,
            perfectMs,
        );
    }

    const matched = RHYTHM_LANES.flatMap(lane => byLane[lane].matched);
    const misses = RHYTHM_LANES.flatMap(lane => byLane[lane].misses);
    const extras = RHYTHM_LANES.flatMap(lane => byLane[lane].extras);
    const offsets = matched.map(item => item.offsetMs);
    const expectedCount = expected.length;
    const completeness = expectedCount ? matched.length / expectedCount : 0;
    const timing = matched.length
        ? mean(offsets.map(offset => Math.max(0, 1 - Math.abs(offset) / goodMs)))
        : 0;
    const spreadMs = standardDeviation(offsets);
    const consistency = matched.length ? Math.max(0, 1 - spreadMs / goodMs) : 0;
    const extraPenalty = expectedCount ? Math.min(0.2, extras.length / expectedCount * 0.2) : 0;
    const rawScore = (timing * 0.45 + completeness * 0.40 + consistency * 0.15 - extraPenalty) * 100;

    return {
        score: Math.max(0, Math.min(100, Math.round(rawScore))),
        bpm,
        goodMs,
        perfectMs,
        expected: expectedCount,
        matched: matched.length,
        misses: misses.length,
        extras: extras.length,
        earlyLateBiasMs: Math.round(mean(offsets)),
        spreadMs: Math.round(spreadMs),
        byLane,
        events: matched.sort((a, b) => a.expectedTimeMs - b.expectedTimeMs),
    };
}

export function scoreBuiltPattern(source, grid) {
    const target = typeof source === 'string' ? getRhythmPattern(source) : source;
    if (!target) throw new Error('A valid rhythm pattern is required.');
    let correct = 0;
    let misses = 0;
    let extras = 0;
    let expectedTotal = 0;
    const byLane = {};

    for (const lane of RHYTHM_LANES) {
        const expected = new Set(target.lanes[lane]);
        const actual = new Set((grid?.[lane] || [])
            .map((active, step) => active ? step : -1)
            .filter(step => step >= 0));
        let laneCorrect = 0;
        let laneMisses = 0;
        let laneExtras = 0;
        for (let step = 0; step < STEPS_PER_BAR; step += 1) {
            if (expected.has(step) && actual.has(step)) {
                correct += 1;
                laneCorrect += 1;
            } else if (expected.has(step)) {
                misses += 1;
                laneMisses += 1;
            } else if (actual.has(step)) {
                extras += 1;
                laneExtras += 1;
            }
        }
        expectedTotal += expected.size;
        const denominator = 2 * laneCorrect + laneMisses + laneExtras;
        byLane[lane] = denominator ? Math.round(2 * laneCorrect / denominator * 100) : 100;
    }

    const denominator = 2 * correct + misses + extras;
    return {
        score: denominator ? Math.round(2 * correct / denominator * 100) : 100,
        correct,
        total: expectedTotal,
        misses,
        extras,
        byLane,
    };
}

export function validateRhythmPattern(source) {
    const errors = [];
    if (!source?.id) errors.push('missing id');
    if (!RHYTHM_STAGES.some(stage => stage.id === source?.stage)) errors.push('unknown stage');
    for (const lane of RHYTHM_LANES) {
        const steps = source?.lanes?.[lane];
        if (!Array.isArray(steps)) {
            errors.push(`missing ${lane} lane`);
            continue;
        }
        if (new Set(steps).size !== steps.length) errors.push(`duplicate ${lane} step`);
        if (steps.some(step => !Number.isInteger(step) || step < 0 || step >= STEPS_PER_BAR)) {
            errors.push(`invalid ${lane} step`);
        }
        if (steps.some((step, index) => index > 0 && step <= steps[index - 1])) {
            errors.push(`unsorted ${lane} lane`);
        }
    }
    return errors;
}
