import { chromaticToName, NOTATION_SYSTEMS } from '../theory/notes.js';
import { getTuning } from '../theory/tunings.js';
import { settings } from '../services/settings.js';

// Circle of fifths order (clockwise from C)
const CIRCLE = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
const SHARPS_COUNT = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
const KEY_SHARPS = [0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1]; // positive=sharps, negative=flats

const RELATIVE_MINOR_OFFSET = 9; // minor key is 3 semitones below major (or 9 above)

export default class CircleTheory {
    constructor() {
        this.selectedKey = 0;
        this.container = null;
        this.fretboard = null;
        this.onExercise = null;
    }

    activate(container, fretboard, onExercise) {
        this.container = container;
        this.fretboard = fretboard;
        this.onExercise = onExercise;
        this._render();
    }

    deactivate() {
        if (this.fretboard) this.fretboard.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _render() {
        const g = settings.global;
        const notation = g.notation || 'english';

        const rows = CIRCLE.map((note, i) => {
            const majorName = chromaticToName(note, notation, true);
            const minorRoot = (note + RELATIVE_MINOR_OFFSET) % 12;
            const minorName = chromaticToName(minorRoot, notation, true);
            const sf = KEY_SHARPS[i];
            const sfText = sf === 0 ? '—' : sf > 0 ? `${sf}#` : `${Math.abs(sf)}b`;
            const sel = note === this.selectedKey ? 'chord-selected' : '';
            return `<tr class="${sel}" data-note="${note}" style="cursor:pointer">
                <td>${majorName}</td><td>${minorName}m</td><td>${sfText}</td>
            </tr>`;
        }).join('');

        this.container.innerHTML = `
        <div class="theory-content">
            <h2>Circle of Fifths</h2>
            <details class="theory-details">
                <summary>What is the circle of fifths?</summary>
                <div class="theory-text">
                    <p>The <strong>circle of fifths</strong> is a visual map of all 12 musical keys arranged by the interval of a perfect fifth (7 semitones). Moving clockwise, each key adds one sharp. Moving counterclockwise, each key adds one flat.</p>
                    <p><strong>How to use it:</strong></p>
                    <ul>
                        <li><strong>Find key signatures:</strong> C major has 0 sharps/flats. G major has 1 sharp (F#). D major has 2 sharps (F#, C#). Each step clockwise adds one sharp.</li>
                        <li><strong>Find relative minor:</strong> Each major key has a relative minor that shares the same notes. It's always 3 positions counterclockwise (or the inner ring below). C major = A minor. G major = E minor.</li>
                        <li><strong>Chord relationships:</strong> Adjacent keys on the circle share 6 of 7 notes, making modulation between them smooth. The most common chord progressions (I-IV-V) use keys that are neighbors on the circle.</li>
                        <li><strong>Transposing:</strong> To transpose a song, find the original key on the circle, count steps to the target key, and shift all chords by the same number of steps.</li>
                    </ul>
                    <p><strong>The pattern of sharps:</strong> F# C# G# D# A# E# B# (each new sharp is a fifth above the previous)</p>
                    <p><strong>The pattern of flats:</strong> Bb Eb Ab Db Gb Cb Fb (each new flat is a fifth below the previous — reverse order of sharps)</p>
                    <p><strong>For guitar players:</strong> Understanding the circle helps you transpose songs between keys, understand why certain chords "go together," and navigate the fretboard by fifths (which is how the guitar's strings are tuned — each string is a fourth/fifth from the next).</p>
                </div>
            </details>

            <p class="theory-desc">Tap a key to see its notes on the fretboard.</p>

            <table class="interval-table">
                <tr><th>Major</th><th>Relative Minor</th><th>Sharps/Flats</th></tr>
                ${rows}
            </table>
        </div>`;

        this.container.querySelectorAll('tr[data-note]').forEach(row => {
            row.addEventListener('click', () => {
                this.selectedKey = +row.dataset.note;
                this._render();
                this._showOnFretboard();
            });
        });

        if (this.selectedKey !== null) this._showOnFretboard();
    }

    _showOnFretboard() {
        this.fretboard.clearHighlights();
        const tuning = getTuning(settings.global.tuning);
        // Show major scale notes for selected key
        const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
        const scaleNotes = majorIntervals.map(i => (this.selectedKey + i) % 12);

        for (let s = 0; s < tuning.strings.length; s++) {
            for (let f = 0; f <= 12; f++) {
                const note = (tuning.strings[s] + f) % 12;
                const idx = scaleNotes.indexOf(note);
                if (idx !== -1) {
                    this.fretboard.highlightFret(s, f,
                        idx === 0 ? 'highlight-correct' : 'highlight-expected',
                        String(idx + 1));
                }
            }
        }
    }
}
