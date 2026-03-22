import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { getTuning } from '../../theory/tunings.js';
import { chromaticToName, NATURAL_NOTE_INDICES } from '../../theory/notes.js';
import { noteAt } from '../../theory/fretboard.js';
import { playNote } from '../../services/audio.js';
import { eventBus } from '../../services/events.js';
import { recordResult } from '../../services/stats.js';

export default class StringPracticeMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.fretboard = null;
        this._tapHandler = null;
        this._notes = [];
        this._currentIdx = 0;
        this._currentString = 0;
        this._failed = false;
        this._animating = false;
        this._startTime = 0;
        this._isGuitarMode = slug === 'string-practice-auto';
        this._timeout = null;
    }

    async activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.fretboard = fretboard;
        this._isGuitarMode = this.slug === 'string-practice-auto';
        this._tapHandler = (d) => this._onTap(d);
        eventBus.on('fretboard:tap', this._tapHandler);
        this._showStart();
    }

    deactivate() {
        super.deactivate();
        if (this._timeout) { clearTimeout(this._timeout); this._timeout = null; }
        if (this._tapHandler) { eventBus.off('fretboard:tap', this._tapHandler); this._tapHandler = null; }
        if (this.fretboard) this.fretboard.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _ms() { return settings.getMode(this.slug); }

    _allowedStrings() {
        const ms = this._ms();
        const tuning = getTuning(settings.global.tuning);
        if (ms.strings && ms.strings.length > 0) return ms.strings;
        return Array.from({ length: tuning.strings.length }, (_, i) => i);
    }

    _pickString() {
        const strings = this._allowedStrings();
        return strings[Math.floor(Math.random() * strings.length)];
    }

    _generateNotes() {
        const g = settings.global;
        const ms = this._ms();
        const tuning = getTuning(g.tuning);
        const minFret = ms.minFret ?? 0;
        const maxFret = ms.maxFret ?? 12;
        const count = ms.notesPerRound ?? 7;

        let allowed = [...NATURAL_NOTE_INDICES];
        if (g.showSharps || g.showFlats) allowed.push(1, 3, 6, 8, 10);

        const reachable = [];
        for (let f = minFret; f <= maxFret; f++) {
            const n = noteAt(this._currentString, f, tuning);
            if (allowed.includes(n) && !reachable.some(r => r.note === n)) {
                reachable.push({ fret: f, note: n });
            }
        }

        if (reachable.length === 0) return [];

        // Fisher-Yates permutation, no repeats
        const shuffled = [...reachable];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const notes = [];
        while (notes.length < count) {
            const batch = [...shuffled];
            for (let i = batch.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [batch[i], batch[j]] = [batch[j], batch[i]];
            }
            if (notes.length > 0 && batch[0].note === notes[notes.length - 1].note && batch.length > 1) {
                [batch[0], batch[1]] = [batch[1], batch[0]];
            }
            for (const pick of batch) {
                if (notes.length >= count) break;
                notes.push({
                    string: this._currentString,
                    fret: pick.fret,
                    note: pick.note,
                    noteName: chromaticToName(pick.note, g.notation, g.showSharps || !g.showFlats),
                });
            }
        }
        return notes;
    }

    _showStart() {
        const g = settings.global;
        const tuning = getTuning(g.tuning);
        const strings = this._allowedStrings();
        const strNames = strings.map(s =>
            g.stringLabels === 'numbers' ? (tuning.strings.length - s) : tuning.stringNames[s]
        ).join(', ');

        const modeLabel = this._isGuitarMode
            ? 'Guitar mode — notes auto-advance on a timer.'
            : 'Tap each note on the fretboard to advance.';
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt">
                    <span class="challenge-text">String Practice</span>
                    <div class="theory-desc" style="margin-top:8px">A string is assigned. Find each note in the sequence on that string.</div>
                    <div class="theory-desc">${modeLabel}</div>
                    <div class="theory-desc">Strings in rotation: <strong>${strNames}</strong></div>
                </div>
                <button class="restart-btn" id="strp-start">Start</button>
            </div>`;
        this.container.querySelector('#strp-start').addEventListener('click', () => this._startRound());
    }

    _startRound() {
        this._currentString = this._pickString();
        this._notes = this._generateNotes();
        this._currentIdx = 0;
        this._failed = false;
        if (this._notes.length === 0) {
            this.container.innerHTML = '<div class="find-note-ui"><p>No notes available. Check fret range and settings.</p></div>';
            return;
        }
        this._showSequence();
    }

    _getStringLabel() {
        const g = settings.global;
        const tuning = getTuning(g.tuning);
        return g.stringLabels === 'numbers'
            ? `string ${tuning.strings.length - this._currentString}`
            : `the ${tuning.stringNames[this._currentString]} string`;
    }

    _showSequence() {
        this.fretboard.clearHighlights();
        this._animating = false;
        if (this._timeout) { clearTimeout(this._timeout); this._timeout = null; }

        if (this._currentIdx >= this._notes.length) {
            this._showDone();
            return;
        }

        // Render the full note sequence with current highlighted
        const seqHTML = this._notes.map((n, i) => {
            let cls = 'seq-note';
            if (i < this._currentIdx) cls += ' seq-done';
            if (i === this._currentIdx) cls += ' seq-current';
            return `<span class="${cls}">${n.noteName}</span>`;
        }).join(' ');

        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt" id="strp-prompt">
                    <div class="theory-desc" style="margin-bottom:4px">On ${this._getStringLabel()}</div>
                    <div class="seq-line">${seqHTML}</div>
                </div>
                <div class="score-display">
                    <span class="progress">${this._currentIdx + 1} / ${this._notes.length}</span>
                    <button class="seq-skip" id="strp-skip">Next round</button>
                </div>
            </div>`;

        this.container.querySelector('#strp-skip').addEventListener('click', () => {
            if (this._timeout) { clearTimeout(this._timeout); this._timeout = null; }
            this._startRound();
        });

        this._startTime = Date.now();

        if (this._isGuitarMode) {
            const ms = this._ms();
            const noteTime = (ms.noteTime ?? 5) * 1000;
            this._timeout = setTimeout(() => this._revealCurrent(), noteTime);
        }
    }

    _revealCurrent() {
        if (!this.active || this._currentIdx >= this._notes.length) return;
        const n = this._notes[this._currentIdx];
        const g = settings.global;

        this.fretboard.clearHighlights();
        this.fretboard.highlightFret(n.string, n.fret, 'highlight-correct');
        if (g.soundEnabled) playNote(n.string, n.fret);

        // Mark current as done in the sequence display
        const currentEl = this.container.querySelector('.seq-current');
        if (currentEl) { currentEl.classList.remove('seq-current'); currentEl.classList.add('seq-done'); }

        this._currentIdx++;
        this._timeout = setTimeout(() => {
            if (this.active) this._showSequence();
        }, 1200);
    }

    _onTap({ stringIndex, fret }) {
        if (this._isGuitarMode || this._animating || this._currentIdx >= this._notes.length) return;
        const target = this._notes[this._currentIdx];
        if (stringIndex !== target.string) return;

        const tuning = getTuning(settings.global.tuning);
        const tappedNote = (tuning.strings[stringIndex] + fret) % 12;

        if (tappedNote === target.note) {
            this._animating = true;
            const responseMs = Date.now() - this._startTime;
            recordResult(stringIndex, target.note, !this._failed, responseMs);
            this.fretboard.clearHighlights();
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-correct');

            this._currentIdx++;
            this._failed = false;
            setTimeout(() => {
                if (this.active) this._showSequence();
            }, 400);
        } else {
            this._failed = true;
            this.fretboard.clearHighlights();
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-wrong');
            setTimeout(() => {
                this.fretboard.clearHighlights();
            }, 400);
        }
    }

    _showDone() {
        this.fretboard.clearHighlights();
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="game-over">
                    <h2>Round Complete!</h2>
                    <div class="game-over-score">${this._notes.length} notes</div>
                    <button class="restart-btn" id="strp-again">Next Round</button>
                    <button class="restart-btn" id="strp-menu" style="background:var(--bg-card);margin-top:8px">Back</button>
                </div>
            </div>`;
        this.container.querySelector('#strp-again').addEventListener('click', () => this._startRound());
        this.container.querySelector('#strp-menu').addEventListener('click', () => this._showStart());
    }

    onSettingsChanged() {
        if (this.active) this._showStart();
    }
}
