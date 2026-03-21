import { ModeBase } from '../mode-base.js';
import { GameState } from './game.js';
import { renderChallengeUI, renderResult, renderTimer, renderTimedOut, renderGameOver } from './ui.js';
import { showFeedback, clearFeedback } from '../../components/feedback.js';
import { eventBus } from '../../services/events.js';
import { settings } from '../../services/settings.js';

export default class FindTheNoteMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.game = new GameState();
        this.container = null;
        this.fretboard = null;
        this._tapHandler = null;
        this._timerInterval = null;
        this._animating = false;
    }

    async activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.fretboard = fretboard;
        this.game.reset();
        this._tapHandler = (detail) => this._onTap(detail);
        eventBus.on('fretboard:tap', this._tapHandler);
        this._showStart();
    }

    deactivate() {
        super.deactivate();
        this._clearTimer();
        if (this._tapHandler) {
            eventBus.off('fretboard:tap', this._tapHandler);
            this._tapHandler = null;
        }
        clearFeedback(this.fretboard);
        const ui = this.container?.querySelector('.find-note-ui');
        if (ui) ui.remove();
    }

    _showStart() {
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt">
                    <span class="challenge-text">Find the Note</span>
                    <div class="theory-desc" style="margin-top:8px">Find the requested note on the correct string.</div>
                </div>
                <button class="restart-btn" id="ftn-start">Start</button>
            </div>`;
        this.container.querySelector('#ftn-start').addEventListener('click', () => {
            this.game.reset();
            this._nextChallenge();
        });
    }

    async _nextChallenge() {
        this._animating = false;
        this._clearTimer();
        clearFeedback(this.fretboard);

        const challenge = await this.game.newChallenge();
        if (this.game.gameOver || !challenge) {
            renderGameOver(this.container, this.game.score, this.game.total, () => {
                this.game.reset();
                this._showStart();
            });
            return;
        }

        renderChallengeUI(this.container, challenge, this.game);

        const mode = settings.getMode('find-the-note');
        if (mode.timerEnabled) {
            this._startTimer(mode.timerSeconds);
        }
    }

    _startTimer(seconds) {
        this._timerRemaining = seconds;
        renderTimer(this.container, this._timerRemaining, seconds);
        const total = seconds;

        this._timerInterval = setInterval(() => {
            this._timerRemaining--;
            renderTimer(this.container, this._timerRemaining, total);
            if (this._timerRemaining <= 0) {
                this._clearTimer();
                this.game.markTimedOut();
                renderTimedOut(this.container);
            }
        }, 1000);
    }

    _clearTimer() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    async _onTap({ stringIndex, fret }) {
        if (this._animating || !this.game.currentChallenge) return;
        if (stringIndex !== this.game.currentChallenge.string_index) return;

        const result = this.game.checkAnswer(fret);
        clearFeedback(this.fretboard);

        if (result.correct) {
            this._animating = true;
            this._clearTimer();
            showFeedback(this.fretboard, stringIndex, fret, true);

            // Flash all octaves of this note on the fretboard
            const tuning = (await import('../../theory/tunings.js')).getTuning(settings.global.tuning);
            const targetNote = this.game._lastCorrectNote;
            if (targetNote !== undefined) {
                for (let s = 0; s < tuning.strings.length; s++) {
                    for (let f = 0; f <= 12; f++) {
                        if ((tuning.strings[s] + f) % 12 === targetNote && !(s === stringIndex && f === fret)) {
                            this.fretboard.highlightFret(s, f, 'highlight-expected');
                        }
                    }
                }
            }

            renderResult(this.container, true);

            setTimeout(() => {
                this._animating = false;
                if (this.active) this._nextChallenge();
            }, 1200);
        } else {
            showFeedback(this.fretboard, stringIndex, fret, false);
            renderResult(this.container, false);

            setTimeout(() => {
                clearFeedback(this.fretboard);
                const prompt = this.container.querySelector('.challenge-prompt');
                if (prompt) prompt.classList.remove('result-wrong');
            }, 400);
        }
    }

    onSettingsChanged() {
        if (this.active) {
            this.game.reset();
            this._showStart();
        }
    }
}
