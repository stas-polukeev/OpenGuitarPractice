import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { eventBus } from '../../services/events.js';
import { getTuning } from '../../theory/tunings.js';
import {
    MODES, MODE_ORDER, CHORD_QUALITIES,
    chordAtDegree, diatonicChords, pitchName,
} from '../../theory/curriculum.js';

function shuffled(values, random = Math.random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
        const swap = Math.floor(random() * (index + 1));
        [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
}

export function createChordQuestion({ type = 'diatonic', tonic = 0, modeId = 'ionian', degree = 1, random = Math.random } = {}) {
    if (type === 'quality') {
        const qualities = Object.values(CHORD_QUALITIES);
        const answer = qualities[Math.floor(random() * qualities.length)];
        return {
            type,
            prompt: `Which chord quality has the formula ${answer.formula}?`,
            answer: answer.id,
            choices: shuffled(qualities.map(quality => ({ value: quality.id, label: quality.name })), random),
        };
    }
    const answer = chordAtDegree(tonic, modeId, degree);
    const all = diatonicChords(tonic, modeId);
    const distractors = shuffled(all.filter(chord => chord.degree !== degree), random).slice(0, 3);
    return {
        type,
        prompt: `In ${pitchName(tonic)} ${MODES[modeId].name}, what triad is built on degree ${degree}?`,
        answer: answer.symbol,
        chord: answer,
        choices: shuffled([answer, ...distractors].map(chord => ({ value: chord.symbol, label: `${chord.romanNumeral} · ${chord.symbol} (${chord.quality})` })), random),
    };
}

export default class ChordPracticeMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.fretboard = null;
        this.question = null;
        this.score = 0;
        this.round = 0;
    }

    activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.fretboard = fretboard;
        this._showStart();
    }

    deactivate() {
        super.deactivate();
        this.fretboard?.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _config() {
        return { practiceType: 'diatonic', modeId: 'ionian', root: 0, rounds: 10, ...settings.getMode(this.slug) };
    }

    _showStart() {
        const config = this._config();
        this.container.innerHTML = `<div class="find-note-ui">
            <div class="challenge-prompt"><span class="challenge-text">Chord Builder</span>
                <div class="theory-desc">Learn triad formulas, then derive the chord on any degree of any mode.</div></div>
            <div class="theory-controls">
                <label>Practice <select id="cp-type"><option value="diatonic" ${config.practiceType === 'diatonic' ? 'selected' : ''}>Diatonic chords</option><option value="quality" ${config.practiceType === 'quality' ? 'selected' : ''}>Chord qualities</option></select></label>
                <label>Mode <select id="cp-mode">${MODE_ORDER.map(id => `<option value="${id}" ${id === config.modeId ? 'selected' : ''}>${MODES[id].name}</option>`).join('')}</select></label>
                <label>Tonic <select id="cp-root">${Array.from({ length: 12 }, (_, pc) => `<option value="${pc}" ${pc === Number(config.root) ? 'selected' : ''}>${pitchName(pc)}</option>`).join('')}</select></label>
            </div>
            <button class="restart-btn" id="cp-start">Start</button>
        </div>`;
        for (const [selector, key] of [['#cp-type', 'practiceType'], ['#cp-mode', 'modeId'], ['#cp-root', 'root']]) {
            this.container.querySelector(selector)?.addEventListener('change', event => settings.setMode(this.slug, key, key === 'root' ? Number(event.target.value) : event.target.value));
        }
        this.container.querySelector('#cp-start')?.addEventListener('click', () => {
            this.score = 0;
            this.round = 0;
            this._nextQuestion();
        });
    }

    _nextQuestion() {
        const config = this._config();
        if (this.round >= Number(config.rounds)) return this._showDone();
        this.round++;
        const degree = 1 + Math.floor(Math.random() * 7);
        this.question = createChordQuestion({ type: config.practiceType, tonic: Number(config.root), modeId: config.modeId, degree });
        this.fretboard?.clearHighlights();
        this.container.innerHTML = `<div class="find-note-ui">
            <div class="challenge-prompt" id="cp-prompt"><span class="challenge-text">${this.question.prompt}</span></div>
            <div class="theory-controls">${this.question.choices.map(choice => `<button class="pos-btn" data-answer="${choice.value}">${choice.label}</button>`).join('')}</div>
            <div class="score-display"><span class="score">${this.score} correct</span><span class="progress">${this.round} / ${config.rounds}</span></div>
        </div>`;
        this.container.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => this._answer(button)));
    }

    _answer(button) {
        const correct = button.dataset.answer === this.question.answer;
        this.container.querySelectorAll('[data-answer]').forEach(candidate => {
            candidate.disabled = true;
            if (candidate.dataset.answer === this.question.answer) candidate.classList.add('result-correct');
        });
        button.classList.add(correct ? 'result-correct' : 'result-wrong');
        if (correct) this.score++;
        if (this.question.chord) this._highlightChord(this.question.chord);
        setTimeout(() => { if (this.active) this._nextQuestion(); }, 900);
    }

    _highlightChord(chord) {
        if (!this.fretboard) return;
        const tuning = getTuning(settings.global.tuning);
        for (let string = 0; string < tuning.strings.length; string++) {
            for (let fret = this.fretboard.displayStartFret; fret <= this.fretboard.displayEndFret; fret++) {
                const pitchClass = (tuning.strings[string] + fret) % 12;
                const chordTone = chord.pitchClasses.indexOf(pitchClass);
                if (chordTone !== -1) this.fretboard.highlightFret(string, fret, chordTone === 0 ? 'highlight-correct' : 'highlight-expected', ['R', '3', '5'][chordTone]);
            }
        }
    }

    _showDone() {
        const config = this._config();
        this.fretboard?.clearHighlights();
        eventBus.emit('practice:complete', {
            skillId: this.slug,
            title: 'Build chords',
            correct: this.score,
            total: Number(config.rounds),
            minutes: 5,
            mastery: this.score / Math.max(1, Number(config.rounds)),
        });
        this.container.innerHTML = `<div class="find-note-ui"><div class="game-over"><h2>Chord set complete</h2><div class="game-over-score">${this.score} / ${config.rounds}</div><button class="restart-btn" id="cp-again">Again</button></div></div>`;
        this.container.querySelector('#cp-again')?.addEventListener('click', () => this._showStart());
    }

    onSettingsChanged() {
        if (this.active) this._showStart();
    }
}
