import test from 'node:test';
import assert from 'node:assert/strict';

import {
    RHYTHM_LANES,
    RHYTHM_PATTERNS,
    STEPS_PER_BAR,
    getExpectedEvents,
    getRhythmPattern,
    patternToGrid,
    scoreBuiltPattern,
    scoreRhythmAttempt,
    validateRhythmPattern,
} from '../../frontend/js/theory/rhythm-patterns.js';

test('the curriculum has unique, structurally valid one-bar patterns', () => {
    assert.ok(RHYTHM_PATTERNS.length >= 12);
    assert.equal(new Set(RHYTHM_PATTERNS.map(pattern => pattern.id)).size, RHYTHM_PATTERNS.length);
    for (const pattern of RHYTHM_PATTERNS) {
        assert.deepEqual(validateRhythmPattern(pattern), [], pattern.id);
        assert.equal(pattern.subdivision, STEPS_PER_BAR);
        assert.deepEqual(Object.keys(pattern.lanes), RHYTHM_LANES);
    }
});

test('basic rock combines eighth-note hats with a 2-and-4 backbeat', () => {
    const pattern = getRhythmPattern('basic-rock');
    assert.deepEqual(pattern.lanes.hat, [0, 2, 4, 6, 8, 10, 12, 14]);
    assert.deepEqual(pattern.lanes.snare, [4, 12]);
    assert.deepEqual(pattern.lanes.kick, [0, 8]);
    const grid = patternToGrid(pattern);
    assert.equal(grid.hat.filter(Boolean).length, 8);
    assert.equal(grid.snare[4], true);
    assert.equal(grid.kick[4], false);
});

test('expected events use a sixteenth-note clock and retain simultaneous lanes', () => {
    const events = getExpectedEvents('basic-rock', { bpm: 120, startTimeMs: 1000 });
    const atBeatOne = events.filter(event => event.timeMs === 1000);
    assert.deepEqual(atBeatOne.map(event => event.lane).sort(), ['hat', 'kick']);
    assert.equal(events.find(event => event.lane === 'snare' && event.step === 4).timeMs, 1500);
});

test('a perfect performance earns 100 with no misses or extras', () => {
    const pattern = getRhythmPattern('basic-rock');
    const hits = getExpectedEvents(pattern, { bpm: 80, startTimeMs: 2000 });
    const result = scoreRhythmAttempt({ pattern, hits, bpm: 80, startTimeMs: 2000 });
    assert.equal(result.score, 100);
    assert.equal(result.matched, hits.length);
    assert.equal(result.misses, 0);
    assert.equal(result.extras, 0);
    assert.equal(result.earlyLateBiasMs, 0);
    assert.equal(result.spreadMs, 0);
});

test('scoring reports early bias, misses, extras, and per-lane errors', () => {
    const pattern = getRhythmPattern('basic-rock');
    const perfect = getExpectedEvents(pattern, { bpm: 80, startTimeMs: 2000 });
    const early = perfect.map(hit => ({ ...hit, timeMs: hit.timeMs - 30 }));
    const earlyResult = scoreRhythmAttempt({ pattern, hits: early, bpm: 80, startTimeMs: 2000 });
    assert.equal(earlyResult.earlyLateBiasMs, -30);
    assert.ok(earlyResult.score < 100);

    const withoutFirstHat = perfect.filter(hit => !(hit.lane === 'hat' && hit.step === 0));
    withoutFirstHat.push({ lane: 'hat', timeMs: 2000 + 60000 / 80 / 4 });
    const errorResult = scoreRhythmAttempt({ pattern, hits: withoutFirstHat, bpm: 80, startTimeMs: 2000 });
    assert.equal(errorResult.misses, 1);
    assert.equal(errorResult.extras, 1);
    assert.equal(errorResult.byLane.hat.misses.length, 1);
    assert.equal(errorResult.byLane.hat.extras.length, 1);
});

test('build scoring rewards active hits rather than empty cells', () => {
    const pattern = getRhythmPattern('basic-rock');
    const empty = Object.fromEntries(RHYTHM_LANES.map(lane => [lane, Array(STEPS_PER_BAR).fill(false)]));
    assert.equal(scoreBuiltPattern(pattern, empty).score, 0);

    const exact = patternToGrid(pattern);
    assert.deepEqual(scoreBuiltPattern(pattern, exact), {
        score: 100,
        correct: 12,
        total: 12,
        misses: 0,
        extras: 0,
        byLane: { hat: 100, snare: 100, kick: 100 },
    });

    exact.kick[1] = true;
    assert.ok(scoreBuiltPattern(pattern, exact).score < 100);
});
