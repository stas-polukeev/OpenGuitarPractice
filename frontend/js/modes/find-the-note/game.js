import { createChallenge } from '../../services/api.js';
import { settings } from '../../services/settings.js';
import { noteAt } from '../../theory/fretboard.js';
import { getTuning } from '../../theory/tunings.js';
import { NATURAL_NOTE_INDICES } from '../../theory/notes.js';

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentChallenge = null;
        this.score = 0;
        this.streak = 0;
        this.total = 0;
        this.failedCurrent = false;
        this.gameOver = false;
    }

    get notesPerGame() {
        return settings.getMode('find-the-note').notesPerGame || 10;
    }

    async newChallenge() {
        if (this.total >= this.notesPerGame) {
            this.gameOver = true;
            return null;
        }

        const glob = settings.global;
        const mode = settings.getMode('find-the-note');

        let allowedNotes = [...NATURAL_NOTE_INDICES];
        if (glob.showSharps || glob.showFlats) {
            allowedNotes.push(1, 3, 6, 8, 10);
        }

        this.currentChallenge = await createChallenge({
            tuning: glob.tuning,
            notation: glob.notation,
            prefer_sharps: glob.showSharps || !glob.showFlats,
            min_fret: mode.minFret,
            max_fret: mode.maxFret,
            allowed_notes: allowedNotes,
        });
        this.failedCurrent = false;
        return this.currentChallenge;
    }

    checkAnswer(fret) {
        if (!this.currentChallenge) return null;

        const glob = settings.global;
        const tuning = getTuning(glob.tuning);
        const actual = noteAt(this.currentChallenge.string_index, fret, tuning);
        const correct = actual === this.currentChallenge.chromatic_index;

        if (correct) {
            this.total++;
            if (!this.failedCurrent) {
                this.score++;
                this.streak++;
            } else {
                this.streak = 0;
            }
            this.currentChallenge = null;
            if (this.total >= this.notesPerGame) {
                this.gameOver = true;
            }
            return { correct: true, fret };
        } else {
            if (!this.failedCurrent) {
                this.failedCurrent = true;
            }
            return { correct: false, fret };
        }
    }

    markTimedOut() {
        if (!this.failedCurrent) {
            this.failedCurrent = true;
        }
    }
}
