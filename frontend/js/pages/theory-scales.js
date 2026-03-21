import { SCALES, getScaleNotes, getScalePositions, get3NPS } from '../theory/scales.js';
import { chromaticToName, NOTATION_SYSTEMS } from '../theory/notes.js';
import { getTuning } from '../theory/tunings.js';
import { settings } from '../services/settings.js';

export default class ScalesTheory {
    constructor(scaleKey) {
        this.scaleKey = scaleKey;
        this.root = SCALES[scaleKey]?.defaultRoot ?? 9;
        this.selectedPosition = 0; // 0 = all
        this.viewMode = 'positions'; // 'positions' or '3nps'
        this.labelMode = 'degrees'; // 'degrees' or 'notes'
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
        const scale = SCALES[this.scaleKey];
        const tuning = getTuning(g.tuning);
        const positions = getScalePositions(this.root, this.scaleKey, tuning, 24);
        const has3NPS = scale.intervals.length >= 7;

        this.container.innerHTML = `
        <div class="theory-content">
            <h2>${scale.name}</h2>
            <details class="theory-details">
                <summary>About this scale</summary>
                <div class="theory-text">${scale.description}</div>
            </details>
            <p class="theory-desc"><strong>Degrees:</strong> ${scale.degrees.join(' — ')}</p>

            <div class="theory-controls">
                <label>Root:
                    <select id="ts-root">
                        ${notes.map((n, i) => `<option value="${i}" ${i === this.root ? 'selected' : ''}>${n}</option>`).join('')}
                    </select>
                </label>
                <label>Labels:
                    <select id="ts-labels">
                        <option value="degrees" ${this.labelMode === 'degrees' ? 'selected' : ''}>Degrees (1-7)</option>
                        <option value="notes" ${this.labelMode === 'notes' ? 'selected' : ''}>Note names</option>
                    </select>
                </label>
                ${has3NPS ? `
                <label>View:
                    <select id="ts-view">
                        <option value="positions" ${this.viewMode === 'positions' ? 'selected' : ''}>Positions</option>
                        <option value="3nps" ${this.viewMode === '3nps' ? 'selected' : ''}>3 Notes/String</option>
                    </select>
                </label>` : ''}
            </div>

            <div class="theory-controls" id="ts-positions">
                <button class="pos-btn ${this.selectedPosition === 0 ? 'active' : ''}" data-pos="0">All</button>
                ${positions.map(p =>
                    `<button class="pos-btn ${this.selectedPosition === p.index ? 'active' : ''}" data-pos="${p.index}">Pos ${p.index} <small>(${p.minFret}-${p.maxFret})</small></button>`
                ).join('')}
            </div>

            <button class="practice-link" id="ts-practice">Practice this scale</button>
        </div>`;

        this._bind('#ts-labels', 'change', e => {
            this.labelMode = e.target.value;
            this._show();
        });
        this._bind('#ts-root', 'change', e => {
            this.root = +e.target.value;
            this.selectedPosition = 0;
            this._render(); this._show();
        });
        if (has3NPS) {
            this._bind('#ts-view', 'change', e => {
                this.viewMode = e.target.value;
                this.selectedPosition = 0;
                this._render(); this._show();
            });
        }
        this.container.querySelectorAll('.pos-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedPosition = +btn.dataset.pos;
                this.container.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._show();
            });
        });
        this._bind('#ts-practice', 'click', () => {
            if (this.onExercise) this.onExercise(scale.exerciseSlug || 'guitar-practice');
        });
    }

    _bind(sel, evt, fn) {
        const el = this.container.querySelector(sel);
        if (el) el.addEventListener(evt, fn);
    }

    _label(n) {
        if (this.labelMode === 'notes') {
            const g = settings.global;
            return chromaticToName(n.note, g.notation || 'english', g.showSharps || !g.showFlats);
        }
        return n.degree;
    }

    _show() {
        this.fretboard.clearHighlights();
        const tuning = getTuning(settings.global.tuning);

        if (this.viewMode === '3nps') {
            this._show3NPS(tuning);
            return;
        }

        if (this.selectedPosition === 0) {
            const maxFret = this._neededMaxFret(tuning);
            this._ensureFretRange(maxFret);
            const allNotes = getScaleNotes(this.root, this.scaleKey, tuning, maxFret);
            for (const n of allNotes) {
                this.fretboard.highlightFret(n.string, n.fret,
                    n.isRoot ? 'highlight-correct' : 'highlight-expected', this._label(n));
            }
        } else {
            const positions = getScalePositions(this.root, this.scaleKey, tuning, 24);
            const pos = positions.find(p => p.index === this.selectedPosition);
            if (pos) {
                this._ensureFretRange(pos.maxFret);
                for (const n of pos.notes) {
                    this.fretboard.highlightFret(n.string, n.fret,
                        n.isRoot ? 'highlight-correct' : 'highlight-expected', this._label(n));
                }
            }
        }
    }

    _show3NPS(tuning) {
        const degreeIdx = this.selectedPosition > 0 ? this.selectedPosition - 1 : 0;
        const notes = get3NPS(this.root, this.scaleKey, tuning, degreeIdx, 24);
        if (notes.length === 0) return;
        const maxF = Math.max(...notes.map(n => n.fret));
        this._ensureFretRange(maxF);
        for (const n of notes) {
            this.fretboard.highlightFret(n.string, n.fret,
                n.isRoot ? 'highlight-correct' : 'highlight-expected', this._label(n));
        }
    }

    _neededMaxFret(tuning) {
        const positions = getScalePositions(this.root, this.scaleKey, tuning, 24);
        let max = 12;
        for (const p of positions) { if (p.maxFret > max) max = p.maxFret; }
        return max;
    }

    _ensureFretRange(maxFret) {
        const needed = maxFret > 12 ? 24 : 12;
        if (this.fretboard.displayEndFret < needed) {
            this.fretboard.updateSettings({ displayEndFret: needed });
        } else if (needed <= 12 && this.fretboard.displayEndFret > 12) {
            this.fretboard.updateSettings({ displayEndFret: 12 });
        }
    }
}
