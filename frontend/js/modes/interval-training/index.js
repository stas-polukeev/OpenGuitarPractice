import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { getTuning } from '../../theory/tunings.js';
import { chromaticToName, NATURAL_NOTE_INDICES } from '../../theory/notes.js';
import { noteAt } from '../../theory/fretboard.js';
import { INTERVALS } from '../../theory/intervals-data.js';
import { playNote } from '../../services/audio.js';
import { eventBus } from '../../services/events.js';

export default class IntervalTrainingMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.fretboard = null;
        this._tapHandler = null;
        this._challenge = null;
        this.score = 0;
        this.total = 0;
        this.failed = false;
    }

    async activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.fretboard = fretboard;
        this.score = 0;
        this.total = 0;
        this._tapHandler = (d) => this._onTap(d);
        eventBus.on('fretboard:tap', this._tapHandler);
        this._nextChallenge();
    }

    deactivate() {
        super.deactivate();
        if (this._tapHandler) { eventBus.off('fretboard:tap', this._tapHandler); this._tapHandler = null; }
        if (this.fretboard) this.fretboard.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _getMaxSemitones() {
        const ms = settings.getMode('interval-training');
        return ms.maxSemitones ?? 12;
    }

    _nextChallenge() {
        this.fretboard.clearHighlights();
        this.failed = false;
        const g = settings.global;
        const tuning = getTuning(g.tuning);
        const maxSemi = this._getMaxSemitones();
        const ms = settings.getMode('interval-training');
        const minFret = ms.minFret ?? 0;
        const maxFret = ms.maxFret ?? 12;

        // Pick random root string + fret
        const rootString = Math.floor(Math.random() * tuning.strings.length);
        const rootFret = minFret + Math.floor(Math.random() * (maxFret - minFret + 1));
        const rootNote = noteAt(rootString, rootFret, tuning);

        // Pick random interval (1..maxSemitones, skip 0)
        const available = INTERVALS.filter(i => i.semitones > 0 && i.semitones <= maxSemi);
        const interval = available[Math.floor(Math.random() * available.length)];

        // Find target note
        const targetNote = (rootNote + interval.semitones) % 12;

        // Find valid target positions on the fretboard
        const validPositions = [];
        for (let s = 0; s < tuning.strings.length; s++) {
            for (let f = minFret; f <= maxFret; f++) {
                if ((tuning.strings[s] + f) % 12 === targetNote) {
                    validPositions.push({ string: s, fret: f });
                }
            }
        }

        if (validPositions.length === 0) {
            this._nextChallenge(); // retry
            return;
        }

        this._challenge = {
            rootString, rootFret, rootNote,
            interval, targetNote, validPositions,
        };

        // Highlight root
        this.fretboard.highlightFret(rootString, rootFret, 'highlight-correct');

        const rootName = chromaticToName(rootNote, g.notation, g.showSharps || !g.showFlats);
        const npg = settings.getMode('interval-training').notesPerGame ?? 10;
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt" id="iv-prompt">
                    <span class="challenge-text">Find the <strong>${interval.short}</strong> (${interval.name}) from <strong>${rootName}</strong></span>
                </div>
                <div class="score-display">
                    <span class="score">${this.score}/${this.total}</span>
                    <span class="progress">${this.total}/${npg}</span>
                </div>
            </div>`;
    }

    _onTap({ stringIndex, fret }) {
        if (!this._challenge || this._animating) return;
        const ch = this._challenge;
        const tuning = getTuning(settings.global.tuning);
        const tappedNote = (tuning.strings[stringIndex] + fret) % 12;
        const correct = tappedNote === ch.targetNote;

        this.fretboard.clearHighlights();
        // Re-show root
        this.fretboard.highlightFret(ch.rootString, ch.rootFret, 'highlight-correct');

        if (correct) {
            this._animating = true;
            this.total++;
            if (!this.failed) this.score++;
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-expected');

            // Play both notes together
            if (settings.global.soundEnabled) {
                playNote(ch.rootString, ch.rootFret);
                setTimeout(() => playNote(stringIndex, fret), 100);
            }

            const prompt = this.container.querySelector('#iv-prompt');
            if (prompt) prompt.classList.add('result-correct');

            const npg = settings.getMode('interval-training').notesPerGame ?? 10;
            setTimeout(() => {
                this._animating = false;
                if (this.total >= npg) {
                    this._showGameOver();
                } else if (this.active) {
                    this._nextChallenge();
                }
            }, 1200);
        } else {
            this.failed = true;
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-wrong');
            const prompt = this.container.querySelector('#iv-prompt');
            if (prompt) prompt.classList.add('result-wrong');

            setTimeout(() => {
                this.fretboard.clearHighlights();
                this.fretboard.highlightFret(ch.rootString, ch.rootFret, 'highlight-correct');
                if (prompt) prompt.classList.remove('result-wrong');
            }, 400);
        }
    }

    _showGameOver() {
        this.fretboard.clearHighlights();
        const pct = this.total > 0 ? Math.round(this.score / this.total * 100) : 0;
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="game-over">
                    <h2>Game Over</h2>
                    <div class="game-over-score">${this.score} / ${this.total} correct (${pct}%)</div>
                    <button class="restart-btn" id="iv-restart">New Game</button>
                </div>
            </div>`;
        this.container.querySelector('#iv-restart').addEventListener('click', () => {
            this.score = 0; this.total = 0;
            this._nextChallenge();
        });
    }

    onSettingsChanged() {
        if (this.active) {
            this.score = 0; this.total = 0;
            this._nextChallenge();
        }
    }
}
