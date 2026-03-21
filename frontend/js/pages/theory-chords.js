import { chromaticToName, NOTATION_SYSTEMS } from '../theory/notes.js';
import { getTuning } from '../theory/tunings.js';
import { settings } from '../services/settings.js';

const MAJOR_CHORDS = ['Maj', 'min', 'min', 'Maj', 'Maj', 'min', 'dim'];
const MINOR_CHORDS = ['min', 'dim', 'Maj', 'min', 'min', 'Maj', 'Maj'];
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];
const MAJOR_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const MINOR_NUMERALS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

export default class ChordsTheory {
    constructor() {
        this.root = 0; // C
        this.mode = 'major';
        this.container = null;
        this.fretboard = null;
        this.onExercise = null;
        this.selectedDegree = -1;
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
        const allNotes = NOTATION_SYSTEMS[notation].sharps;
        const intervals = this.mode === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
        const chordTypes = this.mode === 'major' ? MAJOR_CHORDS : MINOR_CHORDS;
        const numerals = this.mode === 'major' ? MAJOR_NUMERALS : MINOR_NUMERALS;
        const rootName = chromaticToName(this.root, notation, true);

        const chordRows = intervals.map((iv, i) => {
            const note = (this.root + iv) % 12;
            const name = chromaticToName(note, notation, true);
            const suffix = chordTypes[i] === 'Maj' ? '' : chordTypes[i] === 'min' ? 'm' : 'dim';
            return `<tr class="${this.selectedDegree === i ? 'chord-selected' : ''}" data-deg="${i}">
                <td>${i + 1}</td><td>${numerals[i]}</td><td>${name}${suffix}</td><td>${chordTypes[i]}</td>
            </tr>`;
        }).join('');

        this.container.innerHTML = `
        <div class="theory-content">
            <h2>Chords</h2>
            <details class="theory-details">
                <summary>What are diatonic chords?</summary>
                <div class="theory-text">
                    <p><strong>Diatonic chords</strong> are chords built using only the notes of a given scale. Each degree of the scale becomes the root of a chord, and you stack every other note (1-3-5) from the scale on top of it.</p>
                    <p>The resulting chord type (major, minor, or diminished) depends on the intervals that naturally fall within the scale:</p>
                    <p><strong>In a major key</strong> the pattern is always:<br><strong>I - ii - iii - IV - V - vi - vii°</strong><br>(Major, minor, minor, Major, Major, minor, diminished)</p>
                    <p><strong>In a minor key</strong> the pattern is:<br><strong>i - ii° - III - iv - v - VI - VII</strong><br>(minor, diminished, Major, minor, minor, Major, Major)</p>
                    <p>This pattern holds for <em>every</em> major and minor key — only the root notes change. Knowing this lets you instantly name all chords in any key.</p>
                    <p><strong>Why this matters for guitar:</strong> Most songs use only diatonic chords. If a song is "in C major," you know the chords will be C, Dm, Em, F, G, Am, and Bdim. Recognizing these relationships helps you learn songs faster, transpose to other keys, and improvise over chord progressions.</p>
                    <p><strong>Common progressions:</strong></p>
                    <ul>
                        <li>I - V - vi - IV (pop: C - G - Am - F)</li>
                        <li>I - IV - V (blues/rock: C - F - G)</li>
                        <li>ii - V - I (jazz: Dm - G - C)</li>
                        <li>i - VI - III - VII (minor pop: Am - F - C - G)</li>
                    </ul>
                </div>
            </details>

            <div class="theory-controls">
                <label>Root:
                    <select id="tc-root">
                        ${allNotes.map((n, i) => `<option value="${i}" ${i === this.root ? 'selected' : ''}>${n}</option>`).join('')}
                    </select>
                </label>
                <label>Mode:
                    <select id="tc-mode">
                        <option value="major" ${this.mode === 'major' ? 'selected' : ''}>Major</option>
                        <option value="minor" ${this.mode === 'minor' ? 'selected' : ''}>Minor</option>
                    </select>
                </label>
            </div>

            <h3 style="color:var(--accent);margin-bottom:8px">${rootName} ${this.mode}</h3>
            <table class="interval-table chord-table">
                <tr><th>Degree</th><th>Numeral</th><th>Chord</th><th>Type</th></tr>
                ${chordRows}
            </table>
            <p class="theory-desc" style="margin-top:8px">Tap a row to highlight that chord's root on the fretboard.</p>
        </div>`;

        this._bind('#tc-root', 'change', e => { this.root = +e.target.value; this.selectedDegree = -1; this._render(); });
        this._bind('#tc-mode', 'change', e => { this.mode = e.target.value; this.selectedDegree = -1; this._render(); });

        this.container.querySelectorAll('.chord-table tr[data-deg]').forEach(row => {
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                this.selectedDegree = +row.dataset.deg;
                this._render();
                this._showOnFretboard();
            });
        });

        if (this.selectedDegree >= 0) this._showOnFretboard();
    }

    _bind(sel, evt, fn) {
        const el = this.container.querySelector(sel);
        if (el) el.addEventListener(evt, fn);
    }

    _showOnFretboard() {
        this.fretboard.clearHighlights();
        const tuning = getTuning(settings.global.tuning);
        const intervals = this.mode === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
        const chordRoot = (this.root + intervals[this.selectedDegree]) % 12;

        // Highlight all instances of the chord root
        for (let s = 0; s < tuning.strings.length; s++) {
            for (let f = 0; f <= 12; f++) {
                if ((tuning.strings[s] + f) % 12 === chordRoot) {
                    this.fretboard.highlightFret(s, f, 'highlight-correct');
                }
            }
        }
    }
}
