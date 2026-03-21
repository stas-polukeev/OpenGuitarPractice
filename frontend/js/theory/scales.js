export const SCALES = {
    'natural-minor': {
        name: 'Natural Minor',
        intervals: [0, 2, 3, 5, 7, 8, 10],
        degrees: ['1', '2', '3', '4', '5', '6', '7'],
        defaultRoot: 9,
        description: `<p>The <strong>natural minor scale</strong> (Aeolian mode) is one of the most important scales in music. Its interval formula is:</p>
<p><strong>W - H - W - W - H - W - W</strong> (Whole, Half, Whole, Whole, Half, Whole, Whole)</p>
<p>In the key of <strong>A minor</strong>, the notes are: <strong>A B C D E F G</strong> — all natural notes with no sharps or flats. This makes it the easiest minor key to learn and the relative minor of C major.</p>
<p>The minor scale has a melancholic, darker sound compared to major. It is used extensively in rock, metal, classical, and jazz music.</p>
<p>On the guitar, the natural minor is organized into <strong>5 positions</strong> (CAGED system) spanning the neck. Each position covers 4-5 frets and contains all 7 notes. Positions overlap by 1-2 frets, allowing smooth transitions.</p>
<p><strong>Three-notes-per-string (3NPS)</strong> patterns are an alternative layout: each string plays exactly 3 consecutive scale notes. This creates wider stretches (5-6 frets per position) but highly symmetrical patterns favored in shred and neoclassical playing.</p>
<p><strong>Diatonic chords</strong> built on each degree: <strong>i - ii° - III - iv - v - VI - VII</strong> (minor, diminished, Major, minor, minor, Major, Major). In A minor: Am - Bdim - C - Dm - Em - F - G.</p>`,
        exerciseSlug: 'scale-practice',
        chords: ['min', 'dim', 'Maj', 'min', 'min', 'Maj', 'Maj'],
    },
    'natural-major': {
        name: 'Natural Major',
        intervals: [0, 2, 4, 5, 7, 9, 11],
        degrees: ['1', '2', '3', '4', '5', '6', '7'],
        defaultRoot: 0,
        description: `<p>The <strong>major scale</strong> (Ionian mode) is the foundation of Western music theory. Its interval formula is:</p>
<p><strong>W - W - H - W - W - W - H</strong></p>
<p>In <strong>C major</strong>: <strong>C D E F G A B</strong> — all natural notes. Every other major key introduces sharps or flats.</p>
<p>The major scale sounds bright, happy, and resolved. It defines the framework for chords, harmony, and key signatures. The seven modes of Western music are all derived from the major scale starting on different degrees.</p>
<p>On the guitar, major scale positions mirror the minor scale positions (since they share the same notes in relative keys). The 5 CAGED positions and 3NPS patterns both apply.</p>
<p>Knowing major scale positions is essential for understanding chord construction, arpeggios, and improvisation over major key progressions.</p>
<p><strong>Diatonic chords</strong> built on each degree: <strong>I - ii - iii - IV - V - vi - vii°</strong> (Major, minor, minor, Major, Major, minor, diminished). In C major: C - Dm - Em - F - G - Am - Bdim.</p>`,
        exerciseSlug: 'scale-practice',
        chords: ['Maj', 'min', 'min', 'Maj', 'Maj', 'min', 'dim'],
    },
    'minor-pentatonic': {
        name: 'Minor Pentatonic',
        intervals: [0, 3, 5, 7, 10],
        degrees: ['1', '3', '4', '5', '7'],
        defaultRoot: 9,
        description: `<p>The <strong>minor pentatonic</strong> is arguably the most important scale for guitar players. It uses 5 notes from the natural minor scale — the 1st, 3rd, 4th, 5th, and 7th degrees — skipping the 2nd and 6th.</p>
<p>In <strong>A minor pentatonic</strong>: <strong>A C D E G</strong></p>
<p>Because it contains no half-step intervals, every note sounds consonant over minor chords, power chords, and blues progressions. This makes it an ideal starting point for improvisation — you essentially can't hit a "wrong" note.</p>
<p>The <strong>5 positions</strong> of the minor pentatonic are among the first things most guitarists learn:</p>
<ul>
<li><strong>Position 1</strong> (fret 5 for A) — the "root" box, most commonly used</li>
<li><strong>Position 2</strong> (fret 8) — extends up from position 1</li>
<li><strong>Position 3</strong> (fret 10) — centered around the octave</li>
<li><strong>Position 4</strong> (fret 12) — octave of position 1</li>
<li><strong>Position 5</strong> (fret 3/15) — connects back to position 1</li>
</ul>
<p>Each position has exactly <strong>2 notes per string</strong>, making them easy to memorize. The positions connect seamlessly — the top notes of one position are the bottom notes of the next.</p>
<p>Adding the <strong>blues note</strong> (the note between the 4th and 5th, e.g. Eb in A minor) creates the blues scale.</p>`,
        exerciseSlug: 'scale-practice',
    },
    'major-pentatonic': {
        name: 'Major Pentatonic',
        intervals: [0, 2, 4, 7, 9],
        degrees: ['1', '2', '3', '5', '6'],
        defaultRoot: 0,
        description: `<p>The <strong>major pentatonic</strong> removes the 4th and 7th degrees from the major scale, leaving 5 notes with no half steps.</p>
<p>In <strong>C major pentatonic</strong>: <strong>C D E G A</strong></p>
<p>It has a bright, happy, open sound heard in country, folk, pop, and classic rock. Think of riffs by The Allman Brothers, Lynyrd Skynyrd, or The Beatles.</p>
<p>The major pentatonic is the <strong>relative major</strong> of the minor pentatonic — A minor pentatonic and C major pentatonic contain the exact same notes (A C D E G = C D E G A). The difference is which note you treat as "home."</p>
<p>The 5 positions mirror the minor pentatonic positions, just starting from a different root. If you know the minor pentatonic shapes, you already know the major pentatonic — you just shift which note you emphasize as the root.</p>`,
        exerciseSlug: 'scale-practice',
    },
};

// Hardcoded minor pentatonic position offsets (relative to root fret on 6th string)
const MINOR_PENTA_POS = [
    [[0,3],[0,2],[0,2],[0,2],[0,3],[0,3]],
    [[3,5],[2,5],[2,5],[2,4],[3,5],[3,5]],
    [[5,7],[5,7],[5,7],[4,7],[5,8],[5,7]],
    [[7,10],[7,10],[7,9],[7,9],[8,10],[7,10]],
    [[10,12],[10,12],[9,12],[9,12],[10,12],[10,12]],
];

const MAJOR_PENTA_POS = [
    [[0,2],[0,2],[-1,2],[0,2],[0,2],[0,2]],
    [[2,4],[2,4],[2,4],[2,4],[2,5],[2,4]],
    [[4,7],[4,7],[4,7],[4,7],[5,7],[4,7]],
    [[7,9],[7,9],[7,9],[7,9],[7,9],[7,9]],
    [[9,12],[9,12],[9,11],[9,12],[9,12],[9,12]],
];

export function getScaleNotes(root, scaleKey, tuning, maxFret = 24) {
    const scale = SCALES[scaleKey];
    const scaleNotes = scale.intervals.map(i => (root + i) % 12);
    const positions = [];
    for (let s = 0; s < tuning.strings.length; s++) {
        for (let f = 0; f <= maxFret; f++) {
            const note = (tuning.strings[s] + f) % 12;
            const degIdx = scaleNotes.indexOf(note);
            if (degIdx !== -1) {
                positions.push({
                    string: s, fret: f, note,
                    isRoot: note === root % 12,
                    degree: scale.degrees[degIdx],
                });
            }
        }
    }
    return positions;
}

export function getScalePositions(root, scaleKey, tuning, maxFret = 24) {
    let rootFret = null;
    for (let f = 0; f <= 12; f++) {
        if ((tuning.strings[0] + f) % 12 === root % 12) { rootFret = f; break; }
    }
    if (rootFret === null) rootFret = 0;

    let patterns = null;
    if (scaleKey === 'minor-pentatonic') patterns = MINOR_PENTA_POS;
    if (scaleKey === 'major-pentatonic') patterns = MAJOR_PENTA_POS;

    if (patterns) {
        return patterns.map((pat, i) => {
            const notes = [];
            let minF = Infinity, maxF = 0;
            for (let s = 0; s < 6; s++) {
                for (const offset of pat[s]) {
                    const f = rootFret + offset;
                    if (f < 0 || f > maxFret) continue;
                    const note = (tuning.strings[s] + f) % 12;
                    const scaleNotes = SCALES[scaleKey].intervals.map(iv => (root + iv) % 12);
                    const degIdx = scaleNotes.indexOf(note);
                    if (f < minF) minF = f;
                    if (f > maxF) maxF = f;
                    notes.push({
                        string: s, fret: f, note,
                        isRoot: note === root % 12,
                        degree: degIdx !== -1 ? SCALES[scaleKey].degrees[degIdx] : '',
                    });
                }
            }
            return { index: i + 1, minFret: minF, maxFret: maxF, notes };
        });
    }

    return _computePositions(root, scaleKey, tuning, maxFret);
}

function _computePositions(root, scaleKey, tuning, maxFret) {
    const scale = SCALES[scaleKey];
    const scaleNotes = scale.intervals.map(i => (root + i) % 12);
    const anchors = [];
    for (let f = 0; f <= maxFret; f++) {
        const n = (tuning.strings[0] + f) % 12;
        if (scaleNotes.includes(n) && !anchors.some(a => Math.abs(a - f) < 3)) {
            anchors.push(f);
        }
    }
    anchors.sort((a, b) => a - b);

    return anchors.slice(0, 7).map((anchor, i) => {
        const minF = Math.max(0, anchor - 1);
        const maxF = anchor + 4;
        const notes = [];
        for (let s = 0; s < tuning.strings.length; s++) {
            for (let f = minF; f <= Math.min(maxF, maxFret); f++) {
                const note = (tuning.strings[s] + f) % 12;
                const degIdx = scaleNotes.indexOf(note);
                if (degIdx !== -1) {
                    notes.push({ string: s, fret: f, note, isRoot: note === root % 12, degree: scale.degrees[degIdx] });
                }
            }
        }
        return { index: i + 1, minFret: minF, maxFret: maxF, notes };
    });
}

export function get3NPS(root, scaleKey, tuning, startDegree = 0, maxFret = 24) {
    const scale = SCALES[scaleKey];
    if (scale.intervals.length < 7) return [];
    const scaleNotes = scale.intervals.map(i => (root + i) % 12);
    const numDeg = scaleNotes.length;

    const startNote = scaleNotes[startDegree];
    let startFret = 0;
    for (let f = 0; f <= 12; f++) {
        if ((tuning.strings[0] + f) % 12 === startNote) { startFret = f; break; }
    }

    const positions = [];
    let degIdx = startDegree;
    let prevMaxFret = startFret - 1;

    for (let s = 0; s < tuning.strings.length; s++) {
        for (let d = 0; d < 3; d++) {
            const targetNote = scaleNotes[(degIdx + d) % numDeg];
            for (let f = Math.max(0, prevMaxFret); f <= maxFret; f++) {
                if ((tuning.strings[s] + f) % 12 === targetNote) {
                    positions.push({
                        string: s, fret: f, note: targetNote,
                        isRoot: targetNote === root % 12,
                        degree: scale.degrees[(degIdx + d) % numDeg],
                    });
                    prevMaxFret = f;
                    break;
                }
            }
        }
        degIdx = (degIdx + 3) % numDeg;
        prevMaxFret = 0;
    }
    return positions;
}
