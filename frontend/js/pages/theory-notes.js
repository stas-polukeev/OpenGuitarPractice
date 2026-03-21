import { chromaticToName, NOTATION_SYSTEMS, NATURAL_NOTE_INDICES } from '../theory/notes.js';
import { getTuning } from '../theory/tunings.js';
import { noteAt } from '../theory/fretboard.js';
import { settings } from '../services/settings.js';
import { eventBus } from '../services/events.js';

export default class NotesTheory {
    constructor() {
        this.container = null;
        this.fretboard = null;
        this.onExercise = null;
        this.selectedNote = -1; // -1 = show all natural notes
        this._tapHandler = null;
    }

    activate(container, fretboard, onExercise) {
        this.container = container;
        this.fretboard = fretboard;
        this.onExercise = onExercise;
        this._tapHandler = ({ stringIndex, fret }) => this._onTap(stringIndex, fret);
        eventBus.on('fretboard:tap', this._tapHandler);
        this._render();
        this._show();
    }

    deactivate() {
        if (this._tapHandler) { eventBus.off('fretboard:tap', this._tapHandler); this._tapHandler = null; }
        if (this.fretboard) this.fretboard.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _render() {
        const g = settings.global;
        const notation = g.notation || 'english';
        const noteNames = NATURAL_NOTE_INDICES.map(i => chromaticToName(i, notation, true));

        this.container.innerHTML = `
        <div class="theory-content">
            <h2>Notes on Fretboard</h2>
            <details class="theory-details">
                <summary>About fretboard notes</summary>
                <div class="theory-text">
                    <p>The guitar fretboard has 7 <strong>natural notes</strong>: ${noteNames.join(', ')}. These repeat across all strings and octaves.</p>
                    <p>Learning where each note lives on the fretboard is the single most important skill for understanding the instrument. Every scale, chord, and arpeggio is built from these positions.</p>
                    <p><strong>Octave shapes:</strong> The same note appears in multiple positions across the fretboard. These form consistent geometric shapes called <em>octave shapes</em>. For example, any note on the 6th string can be found:</p>
                    <ul>
                        <li>2 strings up, 2 frets forward (6th → 4th string)</li>
                        <li>2 frets back on the same string + 12 frets (octave)</li>
                        <li>Same fret on the 1st string (for E strings)</li>
                    </ul>
                    <p><strong>Tap any note</strong> on the fretboard below to highlight all instances of that note. This helps you visualize the octave shapes.</p>
                </div>
            </details>

            <div class="theory-controls">
                <button class="pos-btn ${this.selectedNote === -1 ? 'active' : ''}" data-note="-1">All</button>
                ${noteNames.map((name, i) =>
                    `<button class="pos-btn ${this.selectedNote === NATURAL_NOTE_INDICES[i] ? 'active' : ''}" data-note="${NATURAL_NOTE_INDICES[i]}">${name}</button>`
                ).join('')}
            </div>
            <button class="practice-link" id="tn-practice">Practice: Find the Note</button>
        </div>`;

        this.container.querySelectorAll('.pos-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedNote = +btn.dataset.note;
                this.container.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._show();
            });
        });
        this._bind('#tn-practice', 'click', () => { if (this.onExercise) this.onExercise('find-the-note'); });
    }

    _bind(sel, evt, fn) {
        const el = this.container.querySelector(sel);
        if (el) el.addEventListener(evt, fn);
    }

    _onTap(stringIndex, fret) {
        const tuning = getTuning(settings.global.tuning);
        const note = noteAt(stringIndex, fret, tuning);
        if (NATURAL_NOTE_INDICES.includes(note)) {
            this.selectedNote = note;
            this.container.querySelectorAll('.pos-btn').forEach(b => {
                b.classList.toggle('active', +b.dataset.note === note);
            });
            this._show();
        }
    }

    _show() {
        this.fretboard.clearHighlights();
        const g = settings.global;
        const tuning = getTuning(g.tuning);
        const notation = g.notation || 'english';

        for (let s = 0; s < tuning.strings.length; s++) {
            for (let f = 0; f <= 12; f++) {
                const note = noteAt(s, f, tuning);
                if (!NATURAL_NOTE_INDICES.includes(note)) continue;

                if (this.selectedNote === -1) {
                    // Show all natural notes
                    const name = chromaticToName(note, notation, true);
                    this.fretboard.highlightFret(s, f, 'highlight-expected', name);
                } else if (note === this.selectedNote) {
                    // Highlight only the selected note
                    const name = chromaticToName(note, notation, true);
                    this.fretboard.highlightFret(s, f, 'highlight-correct', name);
                }
            }
        }
    }
}
