import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { getTuning } from '../../theory/tunings.js';
import { chromaticToName, NATURAL_NOTE_INDICES } from '../../theory/notes.js';
import { noteAt } from '../../theory/fretboard.js';
import { playNote } from '../../services/audio.js';
import { SCALES, getScaleNotes } from '../../theory/scales.js';

export default class GuitarPracticeMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.fretboard = null;
        this._timeout = null;
        this._noteIndex = 0;
        this._notes = [];
        this._running = false;
    }

    async activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.fretboard = fretboard;
        this._running = false;
        this._showStartScreen();
    }

    deactivate() {
        super.deactivate();
        this._stop();
        if (this.container) this.container.innerHTML = '';
        if (this.fretboard) this.fretboard.clearHighlights();
    }

    _ms() { return settings.getMode('guitar-practice'); }

    _generateNotes() {
        const g = settings.global;
        const tuning = getTuning(g.tuning);
        const ms = this._ms();
        const mode = ms.practiceMode || 'random';
        const minFret = ms.minFret ?? 0;
        const maxFret = ms.maxFret ?? 12;
        const count = ms.notesPerSession ?? 20;

        if (mode === 'scale' && ms.scaleKey) {
            return this._generateScaleNotes(tuning, ms, count);
        }

        // Random notes
        let allowed = [...NATURAL_NOTE_INDICES];
        if (g.showSharps || g.showFlats) allowed.push(1, 3, 6, 8, 10);

        const notes = [];
        for (let i = 0; i < count; i++) {
            const si = Math.floor(Math.random() * tuning.strings.length);
            const reachable = [];
            for (let f = minFret; f <= maxFret; f++) {
                const n = noteAt(si, f, tuning);
                if (allowed.includes(n) && !reachable.some(r => r.note === n)) {
                    reachable.push({ fret: f, note: n });
                }
            }
            if (reachable.length === 0) continue;
            const pick = reachable[Math.floor(Math.random() * reachable.length)];
            notes.push({
                string: si,
                stringName: tuning.stringNames[si],
                fret: pick.fret,
                note: pick.note,
                noteName: chromaticToName(pick.note, g.notation, g.showSharps || !g.showFlats),
            });
        }
        return notes;
    }

    _generateScaleNotes(tuning, ms, count) {
        const g = settings.global;
        const scaleKey = ms.scaleKey || 'minor-pentatonic';
        const root = ms.scaleRoot ?? 9;
        const maxFret = ms.maxFret ?? 12;

        // Get all scale notes on fretboard, sorted ascending by pitch
        const allNotes = getScaleNotes(root, scaleKey, tuning, maxFret);
        allNotes.sort((a, b) => {
            const pa = tuning.basePitch[a.string] + a.fret;
            const pb = tuning.basePitch[b.string] + b.fret;
            return pa - pb;
        });
        // Remove duplicate pitches
        const unique = [];
        for (const n of allNotes) {
            const p = tuning.basePitch[n.string] + n.fret;
            if (!unique.some(u => tuning.basePitch[u.string] + u.fret === p)) unique.push(n);
        }

        const notes = [];
        const step = ms.scaleStep ?? 1; // interval: 1=sequential, 2=skip one, etc.
        let idx = 0;
        let ascending = true;
        for (let i = 0; i < count && unique.length > 0; i++) {
            const n = unique[idx];
            notes.push({
                string: n.string,
                stringName: tuning.stringNames[n.string],
                fret: n.fret,
                note: n.note,
                noteName: chromaticToName(n.note, g.notation, g.showSharps || !g.showFlats),
            });
            idx += ascending ? step : -step;
            if (idx >= unique.length) { idx = unique.length - 1 - step; ascending = false; }
            if (idx < 0) { idx = step; ascending = true; }
        }
        return notes;
    }

    _showStartScreen() {
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt">
                    <span class="challenge-text">Guitar Practice</span>
                    <div class="theory-desc" style="margin-top:8px">Notes auto-advance on a timer. Play along on your guitar.</div>
                </div>
                <button class="restart-btn" id="gp-start">Start</button>
            </div>`;
        this.container.querySelector('#gp-start').addEventListener('click', () => this._startSession());
    }

    _startSession() {
        this._notes = this._generateNotes();
        this._noteIndex = 0;
        this._running = true;
        this._showNote();
    }

    _stop() {
        this._running = false;
        if (this._timeout) { clearTimeout(this._timeout); this._timeout = null; }
    }

    _showNote() {
        if (!this.active || !this._running) return;
        if (this._noteIndex >= this._notes.length) { this._showDone(); return; }

        this.fretboard.clearHighlights();
        const note = this._notes[this._noteIndex];
        const g = settings.global;
        const ms = this._ms();
        const strLabel = g.stringLabels === 'numbers'
            ? `string ${getTuning(g.tuning).strings.length - note.string}`
            : `the ${note.stringName} string`;

        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt" id="gp-prompt">
                    <span class="challenge-text">Play <strong>${note.noteName}</strong> on ${strLabel}</span>
                </div>
                <div class="score-display">
                    <span class="progress">${this._noteIndex + 1} / ${this._notes.length}</span>
                </div>
            </div>`;

        // After noteTime seconds: reveal + play sound + advance
        this._timeout = setTimeout(() => {
            if (!this.active || !this._running) return;
            this.fretboard.highlightFret(note.string, note.fret, 'highlight-correct');
            if (g.soundEnabled) playNote(note.string, note.fret);
            const prompt = this.container.querySelector('#gp-prompt');
            if (prompt) prompt.classList.add('result-correct');

            this._noteIndex++;
            this._timeout = setTimeout(() => this._showNote(), 1200);
        }, (ms.noteTime ?? 5) * 1000);
    }

    _showDone() {
        this.fretboard.clearHighlights();
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="game-over">
                    <h2>Session Complete</h2>
                    <div class="game-over-score">${this._notes.length} notes practiced</div>
                    <button class="restart-btn" id="gp-restart">New Session</button>
                </div>
            </div>`;
        this.container.querySelector('#gp-restart').addEventListener('click', () => this._startSession());
    }

    onSettingsChanged() {
        if (this.active) { this._stop(); this._showStartScreen(); }
    }
}
