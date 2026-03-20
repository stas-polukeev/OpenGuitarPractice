export const INTERVALS = [
    { semitones: 0, name: 'Perfect Unison', short: 'P1' },
    { semitones: 1, name: 'Minor 2nd', short: 'm2' },
    { semitones: 2, name: 'Major 2nd', short: 'M2' },
    { semitones: 3, name: 'Minor 3rd', short: 'm3' },
    { semitones: 4, name: 'Major 3rd', short: 'M3' },
    { semitones: 5, name: 'Perfect 4th', short: 'P4' },
    { semitones: 6, name: 'Tritone', short: 'TT' },
    { semitones: 7, name: 'Perfect 5th', short: 'P5' },
    { semitones: 8, name: 'Minor 6th', short: 'm6' },
    { semitones: 9, name: 'Major 6th', short: 'M6' },
    { semitones: 10, name: 'Minor 7th', short: 'm7' },
    { semitones: 11, name: 'Major 7th', short: 'M7' },
    { semitones: 12, name: 'Octave', short: 'P8' },
    { semitones: 13, name: 'Minor 9th', short: 'm9' },
    { semitones: 14, name: 'Major 9th', short: 'M9' },
    { semitones: 15, name: 'Minor 10th', short: 'm10' },
    { semitones: 16, name: 'Major 10th', short: 'M10' },
    { semitones: 17, name: 'Perfect 11th', short: 'P11' },
    { semitones: 19, name: 'Perfect 12th', short: 'P12' },
];

export function findInterval(rootString, rootFret, semitones, tuning, maxFret = 24) {
    const positions = [];
    const rootPitch = tuning.basePitch[rootString] + rootFret;
    const targetPitch = rootPitch + semitones;

    for (let s = 0; s < tuning.strings.length; s++) {
        for (let f = 0; f <= maxFret; f++) {
            if (tuning.basePitch[s] + f === targetPitch) {
                positions.push({ string: s, fret: f });
            }
        }
    }
    return positions;
}

export function findAllIntervalPositions(rootString, rootFret, semitones, tuning, maxFret = 24) {
    // Find all positions that match the interval (across octaves if semitones <= 12)
    const positions = [];
    const rootNote = (tuning.strings[rootString] + rootFret) % 12;
    const targetNote = (rootNote + semitones) % 12;

    for (let s = 0; s < tuning.strings.length; s++) {
        for (let f = 0; f <= maxFret; f++) {
            if ((tuning.strings[s] + f) % 12 === targetNote) {
                positions.push({ string: s, fret: f });
            }
        }
    }
    return positions;
}
