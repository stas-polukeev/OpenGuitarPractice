import test from 'node:test';
import assert from 'node:assert/strict';

import {
    MODES,
    MODE_ORDER,
    chordAtDegree,
    diatonicChords,
    generateThreeNpsPattern,
    buildScaleTraversal,
    generateOneStringScale,
    findScaleDegreePositions,
} from '../../frontend/js/theory/curriculum.js';

test('all seven modes expose canonical formulas, characteristic degrees, and triad qualities', () => {
    assert.equal(MODE_ORDER.length, 7);
    assert.deepEqual(MODES.phrygian.degreeOffsets, [0, 1, 3, 5, 7, 8, 10]);
    assert.equal(MODES.phrygian.characteristicDegree, '♭2');
    assert.equal(MODES.lydian.characteristicDegree, '♯4');
    assert.equal(MODES.mixolydian.characteristicDegree, '♭7');
    const expectedTriads = {
        ionian: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
        dorian: ['minor', 'minor', 'major', 'major', 'minor', 'diminished', 'major'],
        phrygian: ['minor', 'major', 'major', 'minor', 'diminished', 'major', 'minor'],
        lydian: ['major', 'major', 'minor', 'diminished', 'major', 'minor', 'minor'],
        mixolydian: ['major', 'minor', 'diminished', 'major', 'minor', 'minor', 'major'],
        aeolian: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'],
        locrian: ['diminished', 'major', 'minor', 'minor', 'major', 'major', 'minor'],
    };
    for (const modeId of MODE_ORDER) assert.deepEqual(MODES[modeId].triadQualities, expectedTriads[modeId]);
});

test('diatonic chords are generated from tonic, mode, and degree', () => {
    const cMajor = diatonicChords(0, 'ionian');
    assert.deepEqual(cMajor.map(chord => chord.symbol), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
    assert.deepEqual(cMajor.map(chord => chord.romanNumeral), ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    const gSharpAeolianTwo = chordAtDegree(8, 'aeolian', 2);
    assert.equal(gSharpAeolianTwo.root, 10);
    assert.equal(gSharpAeolianTwo.quality, 'diminished');
});

test('3NPS begins on selected low-E tonic and yields three notes per string in ascending pitch', () => {
    const notes = generateThreeNpsPattern({ tonic: 7, modeId: 'ionian', rootFret: 3, maxFret: 24 });
    assert.equal(notes.length, 18);
    assert.deepEqual(notes.slice(0, 6).map(note => [note.string, note.fret]),
        [[0, 3], [0, 5], [0, 7], [1, 3], [1, 5], [1, 7]]);
    for (let string = 0; string < 6; string++) {
        assert.equal(notes.filter(note => note.string === string).length, 3);
    }
    for (let index = 1; index < notes.length; index++) {
        assert.ok(notes[index].absolutePitch > notes[index - 1].absolutePitch);
    }
});

test('3NPS rejects a start fret that is not the selected tonic', () => {
    assert.throws(() => generateThreeNpsPattern({ tonic: 7, modeId: 'ionian', rootFret: 2 }), /selected tonic/);
});

test('scale traversal generates scalar, broken thirds/fourths, cells, and reverse direction', () => {
    const notes = Array.from({ length: 6 }, (_, id) => ({ id }));
    assert.deepEqual(buildScaleTraversal(notes, { kind: 'scalar' }, 'down').map(n => n.id), [5, 4, 3, 2, 1, 0]);
    assert.deepEqual(buildScaleTraversal(notes, { kind: 'brokenInterval', distance: 3 }, 'up').map(n => n.id), [0, 2, 1, 3, 2, 4, 3, 5]);
    assert.deepEqual(buildScaleTraversal(notes, { kind: 'brokenInterval', distance: 4 }, 'up').map(n => n.id), [0, 3, 1, 4, 2, 5]);
    assert.deepEqual(buildScaleTraversal(notes, { kind: 'cell', size: 3 }, 'up').map(n => n.id), [0, 1, 2, 1, 2, 3, 2, 3, 4, 3, 4, 5]);
});

test('one-string scale can return a root-to-root octave', () => {
    const notes = generateOneStringScale({ tonic: 4, modeId: 'phrygian', string: 0, minFret: 0, maxFret: 12, rootToRoot: true });
    assert.equal(notes.length, 8);
    assert.equal(notes[0].fret, 0);
    assert.equal(notes.at(-1).fret, 12);
    assert.deepEqual(notes.map(note => note.fret), [0, 1, 3, 5, 7, 8, 10, 12]);
});

test('degree finder returns every and only occurrence inside the requested visible range', () => {
    const positions = findScaleDegreePositions({ tonic: 8, modeId: 'aeolian', degree: 2, minFret: 0, maxFret: 12 });
    assert.ok(positions.length > 0);
    assert.ok(positions.every(position => position.fret >= 0 && position.fret <= 12));
    assert.ok(positions.every(position => position.pitchClass === 10)); // A#/Bb
    assert.deepEqual(positions.filter(p => p.string === 0).map(p => p.fret), [6]);
});
