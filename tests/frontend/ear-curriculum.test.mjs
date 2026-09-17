import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourceUrl = new URL('../../frontend/js/theory/ear-curriculum.js', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const curriculum = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const audioSource = await readFile(new URL('../../frontend/js/services/audio.js', import.meta.url), 'utf8');
const audio = await import(`data:text/javascript;base64,${Buffer.from(audioSource).toString('base64')}`);

const {
    DEGREE_LIBRARY,
    EAR_LEVELS,
    MELODY_LEVELS,
    MODES,
    REVIEW_INTERVALS_MS,
    buildResolutionSequence,
    buildTonalContext,
    createEmptyProgress,
    degreeToMidi,
    generateEarTrial,
    generateMelodyTrial,
    getLevelSummary,
    isLevelUnlocked,
    loadAuralProgress,
    recordAuralAttempt,
    saveAuralProgress,
} = curriculum;

function constantRandom(value) {
    return () => value;
}

test('audio utility state accepts both normalized and percentage UI values', () => {
    assert.equal(audio.midiToHz(69), 440);
    assert.ok(Math.abs(audio.midiToHz(60) - 261.6256) < 0.001);
    audio.setMasterVolume(80);
    assert.equal(audio.getMasterVolume(), 0.8);
    audio.setDrive(true, 35);
    assert.equal(audio.getDistortionDrive(), 0.35);
    audio.setDrive(false, 100);
    assert.equal(audio.getDistortionDrive(), 0);
});

test('degree and mode data encode the characteristic modal alterations', () => {
    assert.equal(degreeToMidi(60, 'b3'), 63);
    assert.equal(degreeToMidi(60, '#4'), 66);
    assert.ok(MODES.phrygian.degrees.includes('b2'));
    assert.ok(MODES.lydian.degrees.includes('#4'));
    assert.ok(MODES.mixolydian.degrees.includes('b7'));
    assert.equal(new Set(MODES.ionian.degrees.map((id) => DEGREE_LIBRARY[id].semitones)).size, 7);
});

test('tonal contexts are scheduled data, independent from Web Audio', () => {
    const cadence = buildTonalContext('ionian', 48, 'cadence');
    assert.equal(cadence.events.length, 4);
    assert.deepEqual(cadence.events[0].midis, [48, 52, 55]);
    assert.deepEqual(cadence.events[2].midis, [55, 59, 62]);
    assert.ok(cadence.targetOffset > cadence.events.at(-1).offset);

    const scale = buildTonalContext('dorian', 50, 'scale');
    assert.equal(scale.events.length, 8);
    assert.equal(scale.events[0].midi, 50);
    assert.equal(scale.events.at(-1).midi, 62);
});

test('ear trials are deterministic with injectable randomness and contain diagnostic data', () => {
    const trial = generateEarTrial({
        levelId: 'ear-home-power',
        tonicMidi: 48,
        random: constantRandom(0),
    });
    assert.equal(trial.targetDegree, '1');
    assert.equal(trial.targetMidi, 48);
    assert.deepEqual(trial.candidates.map((item) => item.id), ['1', '5']);
    assert.equal(trial.clean, true);
    assert.deepEqual(buildResolutionSequence(trial), [48, 48]);
});

test('stepwise melody generation moves by adjacent scale degrees', () => {
    const trial = generateMelodyTrial({
        levelId: 'melody-2-stepwise',
        tonicMidi: 48,
        random: constantRandom(0.6),
    });
    assert.equal(trial.sequence.length, 2);
    const indexes = trial.sequence.map((degree) => MODES.ionian.degrees.indexOf(degree));
    assert.equal(Math.abs(indexes[1] - indexes[0]), 1);
    assert.deepEqual(trial.midis, trial.sequence.map((degree) => degreeToMidi(48, degree)));
});

test('progress records per-target diagnostics, mastery, retention, and unlocks', () => {
    let progress = createEmptyProgress();
    const original = progress;
    const day = 1_700_000_000_000;
    for (let index = 0; index < 16; index++) {
        const target = index % 2 === 0 ? '1' : '5';
        progress = recordAuralAttempt(progress, {
            levelId: 'ear-home-power',
            targetDegree: target,
            chosenDegree: target,
            correct: true,
            responseMs: 1200 + index,
            now: day + (index >= 8 ? 86_400_000 : 0),
        });
    }
    assert.notEqual(progress, original);
    assert.equal(original.levels['ear-home-power'], undefined);
    const summary = getLevelSummary(progress, 'ear-home-power');
    assert.equal(summary.mastered, true);
    assert.equal(summary.stable, true);
    assert.equal(isLevelUnlocked(progress, EAR_LEVELS[1].id, EAR_LEVELS), true);
    assert.equal(progress.levels['ear-home-power'].items['1'].attempts, 8);
    assert.equal(progress.levels['ear-home-power'].confusions['1>1'], 8);
});

test('incorrect answers reset the review interval and preserve a confusion pair', () => {
    const now = 1_700_000_000_000;
    const progress = recordAuralAttempt(createEmptyProgress(), {
        levelId: 'ear-home-power',
        targetDegree: '5',
        chosenDegree: '1',
        correct: false,
        now,
    });
    const item = progress.levels['ear-home-power'].items['5'];
    assert.equal(item.streak, 0);
    assert.equal(item.dueAt, now + 5 * 60_000);
    assert.equal(progress.levels['ear-home-power'].confusions['5>1'], 1);
    assert.ok(REVIEW_INTERVALS_MS[0] > 5 * 60_000);
});

test('progress persistence tolerates storage failures and round-trips valid data', () => {
    const memory = new Map();
    const storage = {
        getItem: (key) => memory.get(key) ?? null,
        setItem: (key, value) => memory.set(key, value),
    };
    const progress = recordAuralAttempt(createEmptyProgress(), {
        levelId: MELODY_LEVELS[0].id,
        target: '1-2',
        chosen: '1-2',
        correct: true,
        now: 1,
    });
    saveAuralProgress(progress, storage);
    assert.deepEqual(loadAuralProgress(storage), progress);
    assert.deepEqual(loadAuralProgress({ getItem: () => '{broken' }), createEmptyProgress());
});
