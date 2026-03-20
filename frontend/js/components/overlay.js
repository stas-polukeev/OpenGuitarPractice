// Data-driven overlay renderer for future use (octave shapes, scale patterns, etc.)
export function renderOverlay(fretboard, positions, cssClass = 'overlay-note') {
    for (const pos of positions) {
        fretboard.highlightFret(pos.string, pos.fret, cssClass);
    }
}
