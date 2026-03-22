import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { getTuning } from '../../theory/tunings.js';
import { chromaticToName, NATURAL_NOTE_INDICES } from '../../theory/notes.js';
import { noteAt } from '../../theory/fretboard.js';
import { eventBus } from '../../services/events.js';
import { recordResult } from '../../services/stats.js';

export default class FindAllNotesMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.fretboard = null;
        this._tapHandler = null;
        this._targetNote = -1;
        this._targetName = '';
        this._allPositions = [];
        this._found = new Set();
        this._wrong = 0;
        this._round = 0;
        this._timerInterval = null;
        this._timerRemaining = 0;
        this._roundScores = [];
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
        this._clearTimer();
        if (this._tapHandler) { eventBus.off('fretboard:tap', this._tapHandler); this._tapHandler = null; }
        if (this.fretboard) this.fretboard.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _ms() { return settings.getMode('find-all-notes'); }

    _clearTimer() {
        if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
    }

    _showStart() {
        this._clearTimer();
        this._round = 0;
        this._roundScores = [];
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt">
                    <span class="challenge-text">Find All Notes</span>
                    <div class="theory-desc" style="margin-top:8px">A note is shown. Find every instance of it on the fretboard.</div>
                </div>
                <button class="restart-btn" id="fan-start">Start</button>
            </div>`;
        this.container.querySelector('#fan-start').addEventListener('click', () => this._nextRound());
    }

    _pickNote() {
        const g = settings.global;
        let pool = [...NATURAL_NOTE_INDICES];
        if (g.showSharps || g.showFlats) pool.push(1, 3, 6, 8, 10);
        // Avoid same note twice in a row
        if (pool.length > 1) {
            pool = pool.filter(n => n !== this._targetNote);
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    _nextRound() {
        this._clearTimer();
        this.fretboard.clearHighlights();

        const ms = this._ms();
        const totalRounds = ms.rounds ?? 5;

        if (this._round >= totalRounds) {
            this._showGameOver();
            return;
        }

        this._round++;
        this._targetNote = this._pickNote();
        const g = settings.global;
        this._targetName = chromaticToName(this._targetNote, g.notation, g.showSharps || !g.showFlats);

        // Find all positions of this note on the fretboard
        const tuning = getTuning(g.tuning);
        const minFret = ms.minFret ?? 0;
        const maxFret = ms.maxFret ?? 12;
        this._allPositions = [];
        for (let s = 0; s < tuning.strings.length; s++) {
            for (let f = minFret; f <= maxFret; f++) {
                if (noteAt(s, f, tuning) === this._targetNote) {
                    this._allPositions.push({ string: s, fret: f });
                }
            }
        }

        this._found = new Set();
        this._wrong = 0;
        this._renderUI();

        // Start timer if enabled
        if (ms.timerEnabled) {
            this._timerRemaining = ms.timerSeconds ?? 15;
            this._startTimer();
        }
    }

    _renderUI() {
        const ms = this._ms();
        const totalRounds = ms.rounds ?? 5;
        const total = this._allPositions.length;
        const foundCount = this._found.size;

        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt" id="fan-prompt">
                    <span class="challenge-text">Find all <strong>${this._targetName}</strong></span>
                </div>
                <div class="score-display">
                    <span class="score">${foundCount} / ${total}</span>
                    <span class="progress">Round ${this._round} / ${totalRounds}</span>
                    <span id="fan-timer"></span>
                </div>
            </div>`;
    }

    _startTimer() {
        this._updateTimerDisplay();
        this._timerInterval = setInterval(() => {
            this._timerRemaining--;
            this._updateTimerDisplay();
            if (this._timerRemaining <= 0) {
                this._clearTimer();
                this._endRound();
            }
        }, 1000);
    }

    _updateTimerDisplay() {
        const el = this.container.querySelector('#fan-timer');
        if (el) el.textContent = `${this._timerRemaining}s`;
    }

    _onTap({ stringIndex, fret }) {
        if (!this._allPositions.length) return;

        const tuning = getTuning(settings.global.tuning);
        const tappedNote = noteAt(stringIndex, fret, tuning);
        const key = `${stringIndex}:${fret}`;

        if (this._found.has(key)) return; // already found this one

        if (tappedNote === this._targetNote) {
            this._found.add(key);
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-correct');
            recordResult(stringIndex, tappedNote, true, 0);

            // Update count
            const scoreEl = this.container.querySelector('.score');
            if (scoreEl) scoreEl.textContent = `${this._found.size} / ${this._allPositions.length}`;

            // Check if all found
            if (this._found.size >= this._allPositions.length) {
                this._clearTimer();
                const prompt = this.container.querySelector('#fan-prompt');
                if (prompt) prompt.classList.add('result-correct');
                this._roundScores.push({ found: this._found.size, total: this._allPositions.length, wrong: this._wrong });
                setTimeout(() => {
                    if (this.active) this._nextRound();
                }, 800);
            }
        } else {
            this._wrong++;
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-wrong');
            recordResult(stringIndex, tappedNote, false, 0);
            setTimeout(() => {
                // Remove wrong highlight but keep correct ones
                this.fretboard.clearHighlights();
                for (const k of this._found) {
                    const [s, f] = k.split(':').map(Number);
                    this.fretboard.highlightFret(s, f, 'highlight-correct');
                }
            }, 300);
        }
    }

    _endRound() {
        // Time's up — show missed positions
        this._roundScores.push({ found: this._found.size, total: this._allPositions.length, wrong: this._wrong });

        for (const pos of this._allPositions) {
            const key = `${pos.string}:${pos.fret}`;
            if (!this._found.has(key)) {
                this.fretboard.highlightFret(pos.string, pos.fret, 'highlight-expected');
            }
        }

        const prompt = this.container.querySelector('#fan-prompt');
        if (prompt) {
            prompt.classList.add(this._found.size === this._allPositions.length ? 'result-correct' : 'result-timeout');
        }

        setTimeout(() => {
            if (this.active) this._nextRound();
        }, 1500);
    }

    _showGameOver() {
        this.fretboard.clearHighlights();
        const totalFound = this._roundScores.reduce((a, r) => a + r.found, 0);
        const totalPossible = this._roundScores.reduce((a, r) => a + r.total, 0);
        const totalWrong = this._roundScores.reduce((a, r) => a + r.wrong, 0);
        const pct = totalPossible > 0 ? Math.round(totalFound / totalPossible * 100) : 0;

        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="game-over">
                    <h2>Game Over</h2>
                    <div class="game-over-score">${totalFound} / ${totalPossible} found (${pct}%)</div>
                    <div class="theory-desc">${totalWrong} wrong taps across ${this._roundScores.length} rounds</div>
                    <button class="restart-btn" id="fan-again">New Game</button>
                </div>
            </div>`;
        this.container.querySelector('#fan-again').addEventListener('click', () => this._showStart());
    }

    onSettingsChanged() {
        if (this.active) this._showStart();
    }
}
