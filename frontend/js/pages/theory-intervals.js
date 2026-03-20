import { INTERVALS } from '../theory/intervals-data.js';
import { chromaticToName, NOTATION_SYSTEMS } from '../theory/notes.js';
import { getTuning } from '../theory/tunings.js';
import { settings } from '../services/settings.js';

export default class IntervalsTheory {
    constructor() {
        this.rootNote = 9; // A
        this.showCompound = false;
        this.viewMode = 'map';
        this.selectedInterval = 7;
        this.container = null;
        this.fretboard = null;
        this.onExercise = null;
    }

    activate(container, fretboard, onExercise) {
        this.container = container;
        this.fretboard = fretboard;
        this.onExercise = onExercise;
        this._render();
        this._show();
    }

    deactivate() {
        if (this.fretboard) this.fretboard.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _render() {
        const g = settings.global;
        const notes = NOTATION_SYSTEMS[g.notation || 'english'].sharps;
        const ivs = INTERVALS.filter(i => this.showCompound || i.semitones <= 12);

        this.container.innerHTML = `
        <div class="theory-content">
            <h2>Intervals</h2>
            <details class="theory-details">
                <summary>What are intervals?</summary>
                <div class="theory-text">
                    <p>An <strong>interval</strong> is the distance between two notes, measured in semitones (half steps). Each interval has a quality and a number:</p>
                    <table class="interval-table">
                        <tr><th>Semi</th><th>Name</th><th>Short</th><th>From A</th></tr>
                        ${INTERVALS.filter(i => i.semitones <= 12).map(iv => {
                            const ex = chromaticToName((9 + iv.semitones) % 12, g.notation || 'english', true);
                            return `<tr><td>${iv.semitones}</td><td>${iv.name}</td><td>${iv.short}</td><td>${ex}</td></tr>`;
                        }).join('')}
                    </table>
                    <p><strong>Compound intervals</strong> extend beyond one octave. A minor 9th (13 semitones) = octave + minor 2nd. These appear in extended chords and jazz harmony.</p>
                    <p><strong>On guitar:</strong> Intervals form consistent geometric shapes. A perfect 5th is always the same shape regardless of starting note (except across G-B strings). Learning these shapes lets you find any note relative to another.</p>
                    <p><strong>Interval Map</strong> shows all 12 intervals radiating from a root position. This is the fundamental pattern to internalize on guitar.</p>
                </div>
            </details>

            <div class="theory-controls">
                <label>Root:
                    <select id="t-root">
                        ${notes.map((n, i) => `<option value="${i}" ${i === this.rootNote ? 'selected' : ''}>${n}</option>`).join('')}
                    </select>
                </label>
                <label>View:
                    <select id="t-view">
                        <option value="map" ${this.viewMode === 'map' ? 'selected' : ''}>Interval Map</option>
                        <option value="single" ${this.viewMode === 'single' ? 'selected' : ''}>Single Interval</option>
                    </select>
                </label>
                <span id="t-iv-wrap" style="${this.viewMode === 'single' ? '' : 'display:none'}">
                    <select id="t-interval">
                        ${ivs.map(iv => `<option value="${iv.semitones}" ${iv.semitones === this.selectedInterval ? 'selected' : ''}>${iv.short} — ${iv.name}</option>`).join('')}
                    </select>
                </span>
                <label><input type="checkbox" id="t-compound" ${this.showCompound ? 'checked' : ''}> Compound (&gt;8ve)</label>
            </div>
            <button class="practice-link" id="t-practice">Practice Intervals</button>
        </div>`;

        this._bind('#t-root', 'change', e => { this.rootNote = +e.target.value; this._show(); });
        this._bind('#t-view', 'change', e => {
            this.viewMode = e.target.value;
            this.container.querySelector('#t-iv-wrap').style.display = this.viewMode === 'single' ? '' : 'none';
            this._show();
        });
        this._bind('#t-interval', 'change', e => { this.selectedInterval = +e.target.value; this._show(); });
        this._bind('#t-compound', 'change', e => {
            this.showCompound = e.target.checked;
            this._render(); this._show();
        });
        this._bind('#t-practice', 'click', () => { if (this.onExercise) this.onExercise('interval-training'); });
    }

    _bind(sel, evt, fn) {
        const el = this.container.querySelector(sel);
        if (el) el.addEventListener(evt, fn);
    }

    _getRootFret(tuning) {
        for (let f = 0; f <= 12; f++) {
            if ((tuning.strings[0] + f) % 12 === this.rootNote) return f;
        }
        return 5;
    }

    _show() {
        this.fretboard.clearHighlights();
        const tuning = getTuning(settings.global.tuning);
        const endFret = this.showCompound ? 24 : 12;
        if (this.fretboard.displayEndFret !== endFret) {
            this.fretboard.updateSettings({ displayEndFret: endFret });
        }

        if (this.viewMode === 'map') {
            this._showMap(tuning);
        } else {
            this._showSingle(tuning);
        }
    }

    _showMap(tuning) {
        // Focused interval map: show intervals within ~2 octaves of root position
        const rootFret = this._getRootFret(tuning);
        const minF = Math.max(0, rootFret - 3);
        const maxF = this.showCompound ? Math.min(24, rootFret + 15) : Math.min(12, rootFret + 9);

        const ivLookup = {};
        for (const iv of INTERVALS) {
            if (!this.showCompound && iv.semitones > 12) continue;
            ivLookup[iv.semitones] = iv.short;
        }

        for (let s = 0; s < tuning.strings.length; s++) {
            for (let f = minF; f <= maxF; f++) {
                const note = (tuning.strings[s] + f) % 12;
                const semi = ((note - this.rootNote) % 12 + 12) % 12;
                const label = ivLookup[semi];
                if (!label) continue;
                this.fretboard.highlightFret(s, f,
                    semi === 0 ? 'highlight-correct' : 'highlight-expected',
                    label);
            }
        }
    }

    _showSingle(tuning) {
        const maxF = this.showCompound ? 24 : 12;
        const targetNote = (this.rootNote + this.selectedInterval) % 12;
        for (let s = 0; s < tuning.strings.length; s++) {
            for (let f = 0; f <= maxF; f++) {
                const note = (tuning.strings[s] + f) % 12;
                if (note === this.rootNote % 12) {
                    this.fretboard.highlightFret(s, f, 'highlight-correct', 'R');
                } else if (note === targetNote) {
                    const iv = INTERVALS.find(i => i.semitones === this.selectedInterval);
                    this.fretboard.highlightFret(s, f, 'highlight-expected', iv?.short || '');
                }
            }
        }
    }
}
