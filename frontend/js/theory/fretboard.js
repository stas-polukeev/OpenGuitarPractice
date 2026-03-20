import { getTuning } from './tunings.js';

export const SINGLE_DOTS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
export const DOUBLE_DOTS = new Set([12, 24]);

export function noteAt(stringIndex, fret, tuning = null) {
    if (!tuning) tuning = getTuning();
    const openNote = tuning.strings[stringIndex];
    return (openNote + fret) % 12;
}

export function buildFretboardMap(tuning = null, fretCount = 12) {
    if (!tuning) tuning = getTuning();
    const result = [];
    for (let s = 0; s < tuning.strings.length; s++) {
        const stringNotes = [];
        for (let f = 0; f <= fretCount; f++) {
            stringNotes.push(noteAt(s, f, tuning));
        }
        result.push(stringNotes);
    }
    return result;
}

export function getDotPositions(fretCount = 12) {
    const dots = [];
    for (let f = 1; f <= fretCount; f++) {
        if (SINGLE_DOTS.has(f)) dots.push({ fret: f, double: false });
        else if (DOUBLE_DOTS.has(f)) dots.push({ fret: f, double: true });
    }
    return dots;
}
