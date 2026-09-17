/**
 * Canonical, UI-independent curriculum data and generators.
 * String indices follow the rest of the app: 0 = low E, 5 = high E.
 */

export const STANDARD_TUNING = Object.freeze({
    pitchClasses: Object.freeze([4, 9, 2, 7, 11, 4]),
    midi: Object.freeze([40, 45, 50, 55, 59, 64]),
    names: Object.freeze(['E', 'A', 'D', 'G', 'B', 'e']),
});

export const SHARP_NAMES = Object.freeze(['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']);
export const FLAT_NAMES = Object.freeze(['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']);

const mode = (id, name, degreeOffsets, degreeLabels, parentMajorDegree, family,
    characteristicDegree, triadQualities, comparison) => Object.freeze({
    id, name,
    degreeOffsets: Object.freeze(degreeOffsets),
    degreeLabels: Object.freeze(degreeLabels),
    parentMajorDegree,
    family,
    characteristicDegree,
    triadQualities: Object.freeze(triadQualities),
    comparison,
});

export const MODES = Object.freeze({
    ionian: mode('ionian', 'Ionian', [0, 2, 4, 5, 7, 9, 11], ['1', '2', '3', '4', '5', '6', '7'], 1, 'major', '7',
        ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'], 'The major scale.'),
    dorian: mode('dorian', 'Dorian', [0, 2, 3, 5, 7, 9, 10], ['1', '2', '♭3', '4', '5', '6', '♭7'], 2, 'minor', '6',
        ['minor', 'minor', 'major', 'major', 'minor', 'diminished', 'major'], 'Natural minor with a raised 6.'),
    phrygian: mode('phrygian', 'Phrygian', [0, 1, 3, 5, 7, 8, 10], ['1', '♭2', '♭3', '4', '5', '♭6', '♭7'], 3, 'minor', '♭2',
        ['minor', 'major', 'major', 'minor', 'diminished', 'major', 'minor'], 'Natural minor with a lowered 2.'),
    lydian: mode('lydian', 'Lydian', [0, 2, 4, 6, 7, 9, 11], ['1', '2', '3', '♯4', '5', '6', '7'], 4, 'major', '♯4',
        ['major', 'major', 'minor', 'diminished', 'major', 'minor', 'minor'], 'Major with a raised 4.'),
    mixolydian: mode('mixolydian', 'Mixolydian', [0, 2, 4, 5, 7, 9, 10], ['1', '2', '3', '4', '5', '6', '♭7'], 5, 'major', '♭7',
        ['major', 'minor', 'diminished', 'major', 'minor', 'minor', 'major'], 'Major with a lowered 7.'),
    aeolian: mode('aeolian', 'Aeolian', [0, 2, 3, 5, 7, 8, 10], ['1', '2', '♭3', '4', '5', '♭6', '♭7'], 6, 'minor', '♭6',
        ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'], 'The natural minor scale.'),
    locrian: mode('locrian', 'Locrian', [0, 1, 3, 5, 6, 8, 10], ['1', '♭2', '♭3', '4', '♭5', '♭6', '♭7'], 7, 'diminished', '♭5',
        ['diminished', 'major', 'minor', 'minor', 'major', 'major', 'minor'], 'Natural minor with lowered 2 and 5.'),
});

export const MODE_ORDER = Object.freeze(['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian']);

export const CHORD_QUALITIES = Object.freeze({
    major: Object.freeze({ id: 'major', name: 'Major', symbol: '', intervals: Object.freeze([0, 4, 7]), formula: '1 3 5' }),
    minor: Object.freeze({ id: 'minor', name: 'Minor', symbol: 'm', intervals: Object.freeze([0, 3, 7]), formula: '1 ♭3 5' }),
    diminished: Object.freeze({ id: 'diminished', name: 'Diminished', symbol: 'dim', intervals: Object.freeze([0, 3, 6]), formula: '1 ♭3 ♭5' }),
});

export const ROMAN_NUMERALS = Object.freeze({
    major: Object.freeze(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']),
    minor: Object.freeze(['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii']),
    diminished: Object.freeze(['i°', 'ii°', 'iii°', 'iv°', 'v°', 'vi°', 'vii°']),
});

export const CHORD_SHAPES = Object.freeze([
    { id: 'c-open', chord: 'C', quality: 'major', name: 'C open', frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, 0, 1, 0], tags: ['open', 'CAGED'] },
    { id: 'a-open', chord: 'A', quality: 'major', name: 'A open', frets: [null, 0, 2, 2, 2, 0], fingers: [null, 0, 1, 2, 3, 0], tags: ['open', 'CAGED'] },
    { id: 'g-open', chord: 'G', quality: 'major', name: 'G open', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], tags: ['open', 'CAGED'] },
    { id: 'e-open', chord: 'E', quality: 'major', name: 'E open', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], tags: ['open', 'CAGED'] },
    { id: 'd-open', chord: 'D', quality: 'major', name: 'D open', frets: [null, null, 0, 2, 3, 2], fingers: [null, null, 0, 1, 3, 2], tags: ['open', 'CAGED'] },
    { id: 'am-open', chord: 'Am', quality: 'minor', name: 'A minor open', frets: [null, 0, 2, 2, 1, 0], fingers: [null, 0, 2, 3, 1, 0], tags: ['open'] },
    { id: 'dm-open', chord: 'Dm', quality: 'minor', name: 'D minor open', frets: [null, null, 0, 2, 3, 1], fingers: [null, null, 0, 2, 3, 1], tags: ['open'] },
    { id: 'em-open', chord: 'Em', quality: 'minor', name: 'E minor open', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], tags: ['open'] },
    { id: 'f-e-barre', chord: 'F', quality: 'major', name: 'F, E-form barre', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], tags: ['barre', 'CAGED'] },
    { id: 'fm-e-barre', chord: 'Fm', quality: 'minor', name: 'F minor, E-form barre', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], tags: ['barre'] },
    { id: 'b-a-barre', chord: 'B', quality: 'major', name: 'B, A-form barre', frets: [null, 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1], tags: ['barre', 'CAGED'] },
    { id: 'bm-a-barre', chord: 'Bm', quality: 'minor', name: 'B minor, A-form barre', frets: [null, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], tags: ['barre'] },
    { id: 'cdim', chord: 'Cdim', quality: 'diminished', name: 'C diminished', frets: [null, 3, 4, 5, 4, null], fingers: [null, 1, 2, 4, 3, null], tags: ['movable', 'diminished'] },
]);

export const THEORY_CARDS = Object.freeze([
    { id: 'triads', title: 'How triads are built', body: 'Stack alternate scale tones: root, third, and fifth. Major is 1 3 5; minor is 1 ♭3 5; diminished is 1 ♭3 ♭5.' },
    { id: 'major-harmony', title: 'Major-key harmony', body: 'The diatonic triads are I, ii, iii, IV, V, vi, vii°: major, minor, minor, major, major, minor, diminished.' },
    { id: 'minor-harmony', title: 'Natural-minor harmony', body: 'Aeolian gives i, ii°, III, iv, v, VI, VII. Functional minor often raises scale degree 7, changing v to V; that is an alteration, not the strict natural-minor sequence.' },
    { id: 'relative-parallel', title: 'Relative and parallel modes', body: 'Relative modes share notes but change tonic. Parallel modes keep the same tonic and change degrees. A pattern only sounds modal when the tonic and characteristic degree are clear.' },
    { id: 'shapes', title: 'Shapes are voicings', body: 'A chord shape is one playable arrangement of chord tones. Open, barre, CAGED, and triad-inversion shapes can represent the same underlying chord.' },
]);

export const DEGREE_PRESETS = Object.freeze([
    { id: 'roots', name: '1. Roots', modes: ['ionian', 'aeolian'], degrees: [1], tonics: [0, 2, 4, 5, 7, 9, 11], minFret: 0, maxFret: 7 },
    { id: 'chord-tones', name: '2. Root, third, fifth', modes: ['ionian', 'aeolian'], degrees: [1, 3, 5], tonics: [0, 2, 4, 5, 7, 9, 11], minFret: 0, maxFret: 12 },
    { id: 'all-major-minor', name: '3. All degrees: major/minor', modes: ['ionian', 'aeolian'], degrees: [1, 2, 3, 4, 5, 6, 7], tonics: [0, 2, 4, 5, 7, 9, 11], minFret: 0, maxFret: 12 },
    { id: 'bright-modes', name: '4. Dorian and Mixolydian', modes: ['dorian', 'mixolydian'], degrees: [1, 3, 5, 6, 7], tonics: [0, 2, 4, 5, 7, 9, 11], minFret: 0, maxFret: 12 },
    { id: 'color-tones', name: '5. Modal color degrees', modes: MODE_ORDER, degrees: [2, 4, 5, 6, 7], tonics: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], minFret: 0, maxFret: 12, characteristicOnly: true },
    { id: 'full-neck', name: '6. Mixed full neck', modes: MODE_ORDER, degrees: [1, 2, 3, 4, 5, 6, 7], tonics: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], minFret: 0, maxFret: 24 },
]);

export function normalizePitchClass(value) {
    return ((Number(value) % 12) + 12) % 12;
}
export function pitchName(pitchClass, preferFlats = false) {
    return (preferFlats ? FLAT_NAMES : SHARP_NAMES)[normalizePitchClass(pitchClass)];
}

export function getModeDefinition(modeId) {
    const definition = MODES[modeId];
    if (!definition) throw new RangeError(`Unknown mode: ${modeId}`);
    return definition;
}

export function scalePitchClasses(tonic, modeId) {
    return getModeDefinition(modeId).degreeOffsets.map(offset => normalizePitchClass(tonic + offset));
}

export function romanNumeralFor(quality, degree) {
    const values = ROMAN_NUMERALS[quality];
    if (!values || degree < 1 || degree > 7) throw new RangeError('Invalid chord quality or scale degree');
    return values[degree - 1];
}

export function chordAtDegree(tonic, modeId, degree) {
    if (degree < 1 || degree > 7) throw new RangeError('Scale degree must be 1 through 7');
    const definition = getModeDefinition(modeId);
    const quality = definition.triadQualities[degree - 1];
    const root = normalizePitchClass(tonic + definition.degreeOffsets[degree - 1]);
    return {
        degree,
        degreeLabel: definition.degreeLabels[degree - 1],
        root,
        quality,
        formula: CHORD_QUALITIES[quality].formula,
        symbol: `${pitchName(root)}${CHORD_QUALITIES[quality].symbol}`,
        romanNumeral: romanNumeralFor(quality, degree),
        pitchClasses: CHORD_QUALITIES[quality].intervals.map(interval => normalizePitchClass(root + interval)),
    };
}

export function diatonicChords(tonic, modeId) {
    return Array.from({ length: 7 }, (_, index) => chordAtDegree(tonic, modeId, index + 1));
}

function tuningParts(tuning) {
    const pitchClasses = tuning.pitchClasses || tuning.strings;
    const midi = tuning.midi || tuning.basePitch;
    if (!pitchClasses || !midi || pitchClasses.length !== midi.length) {
        throw new TypeError('Tuning must provide pitchClasses/strings and midi/basePitch arrays');
    }
    return { pitchClasses, midi };
}

export function lowERootFrets(tonic, tuning = STANDARD_TUNING, maxFret = 24) {
    const { pitchClasses } = tuningParts(tuning);
    const result = [];
    for (let fret = 0; fret <= maxFret; fret++) {
        if (normalizePitchClass(pitchClasses[0] + fret) === normalizePitchClass(tonic)) result.push(fret);
    }
    return result;
}

/** Generate one ascending 18-note 3NPS pattern, rooted on the low E string. */
export function generateThreeNpsPattern({ tonic, modeId, rootFret, tuning = STANDARD_TUNING, maxFret = 24 }) {
    const definition = getModeDefinition(modeId);
    const { pitchClasses, midi } = tuningParts(tuning);
    tonic = normalizePitchClass(tonic);
    if (!Number.isInteger(rootFret) || rootFret < 0 || rootFret > maxFret) throw new RangeError('Invalid root fret');
    if (normalizePitchClass(pitchClasses[0] + rootFret) !== tonic) {
        throw new RangeError('rootFret must place the selected tonic on the low E string');
    }

    const notes = [];
    let previousMidi = -Infinity;
    for (let sequenceIndex = 0; sequenceIndex < pitchClasses.length * 3; sequenceIndex++) {
        const string = Math.floor(sequenceIndex / 3);
        const degreeIndex = sequenceIndex % 7;
        const target = normalizePitchClass(tonic + definition.degreeOffsets[degreeIndex]);
        let fret = null;

        if (sequenceIndex === 0) {
            fret = rootFret;
        } else {
            for (let candidate = 0; candidate <= maxFret; candidate++) {
                if (normalizePitchClass(pitchClasses[string] + candidate) === target &&
                    midi[string] + candidate > previousMidi) {
                    fret = candidate;
                    break;
                }
            }
        }
        if (fret === null) throw new RangeError(`3NPS pattern exceeds fret ${maxFret}`);

        const absolutePitch = midi[string] + fret;
        notes.push({
            sequenceIndex,
            string,
            fret,
            pitchClass: target,
            absolutePitch,
            degree: degreeIndex + 1,
            degreeLabel: definition.degreeLabels[degreeIndex],
            isRoot: degreeIndex === 0,
        });
        previousMidi = absolutePitch;
    }
    return notes;
}

function upwardIndices(length, traversal) {
    if (!Number.isInteger(length) || length < 1) return [];
    if (!traversal || traversal.kind === 'scalar') return Array.from({ length }, (_, index) => index);
    if (traversal.kind === 'brokenInterval') {
        const distance = Number(traversal.distance);
        if (!Number.isInteger(distance) || distance < 2 || distance > 7) throw new RangeError('Interval distance must be 2 through 7');
        const delta = distance - 1;
        const result = [];
        for (let index = 0; index + delta < length; index++) result.push(index, index + delta);
        return result;
    }
    if (traversal.kind === 'cell') {
        const size = Number(traversal.size);
        if (!Number.isInteger(size) || size < 2 || size > length) throw new RangeError('Invalid cell size');
        const result = [];
        for (let start = 0; start + size <= length; start++) {
            for (let offset = 0; offset < size; offset++) result.push(start + offset);
        }
        return result;
    }
    throw new RangeError(`Unknown traversal: ${traversal.kind}`);
}

/** Apply scalar, broken-interval, or cell traversal without mutating the source notes. */
export function buildScaleTraversal(notes, traversal = { kind: 'scalar' }, direction = 'up') {
    const up = upwardIndices(notes.length, traversal);
    const down = [...up].reverse();
    let indices;
    if (direction === 'up') indices = up;
    else if (direction === 'down') indices = down;
    else if (direction === 'upDown') indices = [...up, ...down.slice(1)];
    else throw new RangeError(`Unknown direction: ${direction}`);
    return indices.map((sourceIndex, playbackIndex) => ({ ...notes[sourceIndex], sourceIndex, playbackIndex }));
}

export function generateOneStringScale({ tonic, modeId, string = 0, minFret = 0, maxFret = 12, tuning = STANDARD_TUNING, rootToRoot = false }) {
    const definition = getModeDefinition(modeId);
    const { pitchClasses, midi } = tuningParts(tuning);
    if (!Number.isInteger(string) || string < 0 || string >= pitchClasses.length) throw new RangeError('Invalid string');
    if (minFret < 0 || maxFret < minFret) throw new RangeError('Invalid fret range');
    tonic = normalizePitchClass(tonic);
    const scale = scalePitchClasses(tonic, modeId);
    let result = [];
    for (let fret = minFret; fret <= maxFret; fret++) {
        const pitchClass = normalizePitchClass(pitchClasses[string] + fret);
        const degreeIndex = scale.indexOf(pitchClass);
        if (degreeIndex !== -1) {
            result.push({
                string, fret, pitchClass,
                absolutePitch: midi[string] + fret,
                degree: degreeIndex + 1,
                degreeLabel: definition.degreeLabels[degreeIndex],
                isRoot: degreeIndex === 0,
            });
        }
    }
    if (rootToRoot) {
        const firstRoot = result.findIndex(note => note.isRoot);
        if (firstRoot !== -1) {
            const secondRootOffset = result.slice(firstRoot + 1).findIndex(note => note.isRoot);
            const end = secondRootOffset === -1 ? result.length : firstRoot + secondRootOffset + 2;
            result = result.slice(firstRoot, end);
        }
    }
    return result.map((note, sequenceIndex) => ({ ...note, sequenceIndex }));
}

export function findScaleDegreePositions({ tonic, modeId, degree, tuning = STANDARD_TUNING, minFret = 0, maxFret = 12, strings = null }) {
    const definition = getModeDefinition(modeId);
    const { pitchClasses } = tuningParts(tuning);
    if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new RangeError('Scale degree must be 1 through 7');
    const targetPitchClass = normalizePitchClass(tonic + definition.degreeOffsets[degree - 1]);
    const allowedStrings = strings || Array.from({ length: pitchClasses.length }, (_, index) => index);
    const result = [];
    for (const string of allowedStrings) {
        if (!Number.isInteger(string) || string < 0 || string >= pitchClasses.length) continue;
        for (let fret = minFret; fret <= maxFret; fret++) {
            if (normalizePitchClass(pitchClasses[string] + fret) === targetPitchClass) {
                result.push({ string, fret, pitchClass: targetPitchClass, degree, degreeLabel: definition.degreeLabels[degree - 1] });
            }
        }
    }
    return result;
}
