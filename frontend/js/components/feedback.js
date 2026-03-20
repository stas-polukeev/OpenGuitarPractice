export function showFeedback(fretboard, stringIndex, fret, correct) {
    fretboard.highlightFret(stringIndex, fret, correct ? 'highlight-correct' : 'highlight-wrong');
}

export function clearFeedback(fretboard) {
    fretboard.clearHighlights();
}
