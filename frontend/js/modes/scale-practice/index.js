import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { getTuning } from '../../theory/tunings.js';
import { chromaticToName } from '../../theory/notes.js';
import { noteAt } from '../../theory/fretboard.js';
import { SCALES, getScalePositions } from '../../theory/scales.js';
import { eventBus } from '../../services/events.js';
import { playNote } from '../../services/audio.js';

export default class ScalePracticeMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.fretboard = null;
        this._tapHandler = null;
        this._notes = [];
        this._currentIdx = 0;
        this._failed = false;
        this._animating = false;
    }

    async activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.fretboard = fretboard;
        this._tapHandler = (d) => this._onTap(d);
        eventBus.on('fretboard:tap', this._tapHandler);
        this._showStart();
    }

    deactivate() {
        super.deactivate();
        if (this._tapHandler) { eventBus.off('fretboard:tap', this._tapHandler); this._tapHandler = null; }
        if (this.fretboard) this.fretboard.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _ms() { return settings.getMode('scale-practice'); }

    _buildNotes() {
        const ms = this._ms();
        const g = settings.global;
        const tuning = getTuning(g.tuning);
        const scaleKey = ms.scaleKey || 'minor-pentatonic';
        const root = ms.scaleRoot ?? 9;
        const posIndex = ms.position ?? 1;

        const positions = getScalePositions(root, scaleKey, tuning, 24);
        const pos = positions.find(p => p.index === posIndex) || positions[0];
        if (!pos) return [];

        // Sort notes ascending by pitch
        const sorted = [...pos.notes].sort((a, b) =>
            (tuning.basePitch[a.string] + a.fret) - (tuning.basePitch[b.string] + b.fret)
        );
        // Remove duplicate pitches
        const unique = [];
        for (const n of sorted) {
            const p = tuning.basePitch[n.string] + n.fret;
            if (!unique.some(u => tuning.basePitch[u.string] + u.fret === p)) unique.push(n);
        }

        // Ascending then descending
        const desc = [...unique].reverse().slice(1);
        return [...unique, ...desc];
    }

    _showStart() {
        const ms = this._ms();
        const scaleKey = ms.scaleKey || 'minor-pentatonic';
        const scale = SCALES[scaleKey];
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt">
                    <span class="challenge-text">Scale Practice: ${scale?.name || scaleKey}</span>
                    <div class="theory-desc" style="margin-top:8px">Play through the scale position. Notes are shown one at a time — find each on the fretboard.</div>
                </div>
                <button class="restart-btn" id="sp-start">Start</button>
            </div>`;
        this.container.querySelector('#sp-start').addEventListener('click', () => this._startGame());
    }

    _startGame() {
        this._notes = this._buildNotes();
        this._currentIdx = 0;
        this._failed = false;
        if (this._notes.length === 0) {
            this.container.innerHTML = '<div class="find-note-ui"><p>No notes for this position. Check settings.</p></div>';
            return;
        }
        this._showFretboardRange();
        this._showCurrentNote();
    }

    _showFretboardRange() {
        const maxF = Math.max(...this._notes.map(n => n.fret));
        const endFret = maxF > 12 ? 24 : 12;
        if (this.fretboard.displayEndFret !== endFret) {
            this.fretboard.updateSettings({ displayEndFret: endFret });
        }
    }

    _showCurrentNote() {
        this.fretboard.clearHighlights();
        this._animating = false;
        this._failed = false;

        if (this._currentIdx >= this._notes.length) {
            this._showDone();
            return;
        }

        const n = this._notes[this._currentIdx];
        const g = settings.global;
        const tuning = getTuning(g.tuning);
        const noteName = chromaticToName(n.note, g.notation, g.showSharps || !g.showFlats);
        const strLabel = g.stringLabels === 'numbers'
            ? `string ${tuning.strings.length - n.string}`
            : `the ${tuning.stringNames[n.string]} string`;

        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt" id="sp-prompt">
                    <span class="challenge-text">Find <strong>${noteName}</strong> (${n.degree}) on ${strLabel}</span>
                </div>
                <div class="score-display">
                    <span class="progress">${this._currentIdx + 1} / ${this._notes.length}</span>
                </div>
            </div>`;
    }

    _onTap({ stringIndex, fret }) {
        if (this._animating || this._currentIdx >= this._notes.length) return;
        const target = this._notes[this._currentIdx];
        if (stringIndex !== target.string) return;

        const tuning = getTuning(settings.global.tuning);
        const tappedNote = (tuning.strings[stringIndex] + fret) % 12;

        if (tappedNote === target.note && fret === target.fret) {
            this._animating = true;
            this.fretboard.clearHighlights();
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-correct');
            const prompt = this.container.querySelector('#sp-prompt');
            if (prompt) prompt.classList.add('result-correct');

            this._currentIdx++;
            setTimeout(() => {
                if (this.active) this._showCurrentNote();
            }, 600);
        } else {
            this._failed = true;
            this.fretboard.clearHighlights();
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-wrong');
            const prompt = this.container.querySelector('#sp-prompt');
            if (prompt) prompt.classList.add('result-wrong');
            setTimeout(() => {
                this.fretboard.clearHighlights();
                if (prompt) prompt.classList.remove('result-wrong');
            }, 400);
        }
    }

    _showDone() {
        this.fretboard.clearHighlights();
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="game-over">
                    <h2>Scale Complete!</h2>
                    <div class="game-over-score">${this._notes.length} notes</div>
                    <button class="restart-btn" id="sp-again">Again</button>
                </div>
            </div>`;
        this.container.querySelector('#sp-again').addEventListener('click', () => this._startGame());
    }

    onSettingsChanged() {
        if (this.active) this._showStart();
    }
}
