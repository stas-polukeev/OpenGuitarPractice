import { settings } from '../services/settings.js';
import { getTuning } from '../theory/tunings.js';
import {
    MODES, MODE_ORDER, CHORD_SHAPES, THEORY_CARDS,
    diatonicChords, pitchName, scalePitchClasses,
} from '../theory/curriculum.js';

function chordLabel(chord, preferFlats) {
    const suffix = chord.quality === 'major' ? '' : chord.quality === 'minor' ? 'm' : 'dim';
    return `${pitchName(chord.root, preferFlats)}${suffix}`;
}
/** Render a chord shape from data rather than a copied diagram asset. */
export function chordShapeDiagram(shape) {
    const fretted = shape.frets.filter(fret => Number.isInteger(fret) && fret > 0);
    const minimum = fretted.length ? Math.min(...fretted) : 1;
    const maximum = fretted.length ? Math.max(...fretted) : 4;
    const baseFret = maximum <= 4 ? 1 : minimum;
    const width = 132;
    const height = 154;
    const left = 18;
    const top = 30;
    const stringGap = 19;
    const fretGap = 21;
    const lines = [];

    for (let string = 0; string < 6; string++) {
        const x = left + string * stringGap;
        lines.push(`<line x1="${x}" y1="${top}" x2="${x}" y2="${top + 5 * fretGap}" stroke="currentColor" stroke-width="1" opacity=".65"/>`);
    }
    for (let fret = 0; fret <= 5; fret++) {
        const y = top + fret * fretGap;
        lines.push(`<line x1="${left}" y1="${y}" x2="${left + 5 * stringGap}" y2="${y}" stroke="currentColor" stroke-width="${fret === 0 && baseFret === 1 ? 4 : 1}" opacity=".65"/>`);
    }

    const marks = shape.frets.map((fret, string) => {
        const x = left + string * stringGap;
        if (fret === null) return `<text x="${x}" y="18" text-anchor="middle" font-size="13">×</text>`;
        if (fret === 0) return `<text x="${x}" y="18" text-anchor="middle" font-size="13">○</text>`;
        const row = fret - baseFret;
        const y = top + (row + 0.5) * fretGap;
        const finger = shape.fingers?.[string] || '';
        return `<circle cx="${x}" cy="${y}" r="7" fill="currentColor"/><text x="${x}" y="${y + 3.5}" text-anchor="middle" font-size="9" fill="var(--bg, #111)">${finger}</text>`;
    }).join('');

    const baseLabel = baseFret > 1 ? `<text x="2" y="${top + 14}" font-size="10">${baseFret}</text>` : '';
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${shape.name} chord diagram" style="width:132px;max-width:100%;color:var(--text,#eee)">${lines.join('')}${marks}${baseLabel}<text x="66" y="149" text-anchor="middle" font-size="12">${shape.chord}</text></svg>`;
}

export default class TheoryCurriculumPage {
    constructor() {
        this.container = null;
        this.fretboard = null;
        this.onExercise = null;
        this.tonic = 0;
        this.modeId = 'ionian';
    }

    activate(container, fretboard, onExercise) {
        this.container = container;
        this.fretboard = fretboard;
        this.onExercise = onExercise;
        this._render();
        this._showScale();
    }

    deactivate() {
        this.fretboard?.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _preferFlats() {
        const global = settings.global;
        return Boolean(global.showFlats && !global.showSharps);
    }

    _render() {
        const definition = MODES[this.modeId];
        const preferFlats = this._preferFlats();
        const chords = diatonicChords(this.tonic, this.modeId);
        const rootOptions = Array.from({ length: 12 }, (_, pitchClass) =>
            `<option value="${pitchClass}" ${pitchClass === this.tonic ? 'selected' : ''}>${pitchName(pitchClass, preferFlats)}</option>`).join('');
        const modeOptions = MODE_ORDER.map(id =>
            `<option value="${id}" ${id === this.modeId ? 'selected' : ''}>${MODES[id].name}</option>`).join('');

        this.container.innerHTML = `
            <div class="theory-content">
                <h2>Modes, chords &amp; guitar forms</h2>
                <div class="theory-controls">
                    <label>Tonic <select id="curriculum-tonic">${rootOptions}</select></label>
                    <label>Mode <select id="curriculum-mode">${modeOptions}</select></label>
                </div>
                <h3>${pitchName(this.tonic, preferFlats)} ${definition.name}</h3>
                <p class="theory-desc"><strong>${definition.degreeLabels.join(' — ')}</strong>. ${definition.comparison} Characteristic degree: <strong>${definition.characteristicDegree}</strong>.</p>
                <table class="interval-table chord-table">
                    <tr><th>Degree</th><th>Chord</th><th>Quality</th><th>Formula</th></tr>
                    ${chords.map(chord => `<tr data-degree="${chord.degree}"><td>${chord.degreeLabel}</td><td>${chord.romanNumeral} · ${chordLabel(chord, preferFlats)}</td><td>${chord.quality}</td><td>${chord.formula}</td></tr>`).join('')}
                </table>
                <div class="theory-controls">
                    <button class="practice-link" id="curriculum-chords">Practice chords</button>
                    <button class="practice-link" id="curriculum-scales">Practice scale sequences</button>
                    <button class="practice-link" id="curriculum-degrees">Find scale degrees</button>
                </div>
                <h3>Short theory</h3>
                ${THEORY_CARDS.map(card => `<details class="theory-details"><summary>${card.title}</summary><div class="theory-text"><p>${card.body}</p></div></details>`).join('')}
                <h3>Common guitar forms</h3>
                <p class="theory-desc">C/A/G/E/D open forms, their movable barre relatives, and a diminished grip. Numbers are fretting fingers; ○ is open and × is muted.</p>
                <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start">
                    ${CHORD_SHAPES.map(shape => `<figure style="margin:0;text-align:center"><figcaption>${shape.name}</figcaption>${chordShapeDiagram(shape)}</figure>`).join('')}
                </div>
            </div>`;

        this.container.querySelector('#curriculum-tonic')?.addEventListener('change', event => {
            this.tonic = Number(event.target.value);
            this._render();
            this._showScale();
        });
        this.container.querySelector('#curriculum-mode')?.addEventListener('change', event => {
            this.modeId = event.target.value;
            this._render();
            this._showScale();
        });
        this.container.querySelectorAll('tr[data-degree]').forEach(row => row.addEventListener('click', () => this._showChord(Number(row.dataset.degree))));
        this.container.querySelector('#curriculum-chords')?.addEventListener('click', () => this.onExercise?.('chord-practice'));
        this.container.querySelector('#curriculum-scales')?.addEventListener('click', () => this.onExercise?.('scale-sequence'));
        this.container.querySelector('#curriculum-degrees')?.addEventListener('click', () => this.onExercise?.('degree-finder'));
    }

    _showScale() {
        if (!this.fretboard) return;
        this.fretboard.updateSettings({ displayStartFret: 0, displayEndFret: 12 });
        this.fretboard.clearHighlights();
        const tuning = getTuning(settings.global.tuning);
        const scale = scalePitchClasses(this.tonic, this.modeId);
        const labels = MODES[this.modeId].degreeLabels;
        for (let string = 0; string < tuning.strings.length; string++) {
            for (let fret = 0; fret <= 12; fret++) {
                const pitchClass = (tuning.strings[string] + fret) % 12;
                const degreeIndex = scale.indexOf(pitchClass);
                if (degreeIndex !== -1) {
                    this.fretboard.highlightFret(string, fret, degreeIndex === 0 ? 'highlight-correct' : 'highlight-expected', labels[degreeIndex]);
                }
            }
        }
    }

    _showChord(degree) {
        if (!this.fretboard) return;
        this.fretboard.clearHighlights();
        const tuning = getTuning(settings.global.tuning);
        const chord = diatonicChords(this.tonic, this.modeId)[degree - 1];
        for (let string = 0; string < tuning.strings.length; string++) {
            for (let fret = 0; fret <= 12; fret++) {
                const pitchClass = (tuning.strings[string] + fret) % 12;
                const chordTone = chord.pitchClasses.indexOf(pitchClass);
                if (chordTone !== -1) {
                    const labels = ['R', chord.quality === 'major' ? '3' : '♭3', chord.quality === 'diminished' ? '♭5' : '5'];
                    this.fretboard.highlightFret(string, fret, chordTone === 0 ? 'highlight-correct' : 'highlight-expected', labels[chordTone]);
                }
            }
        }
    }
}
