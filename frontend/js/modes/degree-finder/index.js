import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { getTuning } from '../../theory/tunings.js';
import { eventBus } from '../../services/events.js';
import {
    MODES, DEGREE_PRESETS, pitchName, findScaleDegreePositions,
} from '../../theory/curriculum.js';

export function createDegreePrompt(preset, random = Math.random) {
    const modeId = preset.modes[Math.floor(random() * preset.modes.length)];
    const tonic = preset.tonics[Math.floor(random() * preset.tonics.length)];
    const definition = MODES[modeId];
    let degree;
    if (preset.characteristicOnly) {
        degree = definition.degreeLabels.indexOf(definition.characteristicDegree) + 1;
    } else {
        degree = preset.degrees[Math.floor(random() * preset.degrees.length)];
    }
    return { modeId, tonic, degree, degreeLabel: definition.degreeLabels[degree - 1] };
}

export default class DegreeFinderMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.fretboard = null;
        this._tapHandler = null;
        this.prompt = null;
        this.positions = [];
        this.found = new Set();
        this.round = 0;
        this.score = 0;
        this.wrong = 0;
        this.transitioning = false;
    }

    activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.fretboard = fretboard;
        this._tapHandler = detail => this._onTap(detail);
        eventBus.on('fretboard:tap', this._tapHandler);
        this._showStart();
    }

    deactivate() {
        super.deactivate();
        if (this._tapHandler) eventBus.off('fretboard:tap', this._tapHandler);
        this._tapHandler = null;
        this.fretboard?.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _config() {
        return { presetId: 'roots', rounds: 6, ...settings.getMode(this.slug) };
    }

    _preset() {
        return DEGREE_PRESETS.find(preset => preset.id === this._config().presetId) || DEGREE_PRESETS[0];
    }

    _showStart() {
        const config = this._config();
        this.fretboard?.clearHighlights();
        this.container.innerHTML = `<div class="find-note-ui">
            <div class="challenge-prompt"><span class="challenge-text">Find the Scale Degree</span>
                <div class="theory-desc">Find every occurrence of the requested degree inside the visible fret range.</div></div>
            <div class="theory-controls"><label>Level <select id="df-preset">${DEGREE_PRESETS.map(preset => `<option value="${preset.id}" ${preset.id === config.presetId ? 'selected' : ''}>${preset.name}</option>`).join('')}</select></label></div>
            <button class="restart-btn" id="df-start">Start</button>
        </div>`;
        this.container.querySelector('#df-preset')?.addEventListener('change', event => settings.setMode(this.slug, 'presetId', event.target.value));
        this.container.querySelector('#df-start')?.addEventListener('click', () => {
            this.round = 0;
            this.score = 0;
            this.wrong = 0;
            this._next();
        });
    }

    _next() {
        const config = this._config();
        if (this.round >= Number(config.rounds)) return this._showDone();
        this.round++;
        const preset = this._preset();
        this.prompt = createDegreePrompt(preset);
        const tuning = getTuning(settings.global.tuning);
        this.positions = findScaleDegreePositions({
            ...this.prompt,
            tuning,
            minFret: preset.minFret,
            maxFret: preset.maxFret,
        });
        this.found = new Set();
        this.transitioning = false;
        this.fretboard.updateSettings({ displayStartFret: preset.minFret, displayEndFret: preset.maxFret });
        this._renderRound();
    }

    _renderRound() {
        const config = this._config();
        const preferFlats = settings.global.showFlats && !settings.global.showSharps;
        const targetPc = this.positions[0]?.pitchClass;
        this.container.innerHTML = `<div class="find-note-ui">
            <div class="challenge-prompt" id="df-prompt">
                <span class="challenge-text">Find all <strong>${this.prompt.degreeLabel}</strong> in ${pitchName(this.prompt.tonic, preferFlats)} ${MODES[this.prompt.modeId].name}</span>
                <div class="theory-desc">That degree sounds as ${pitchName(targetPc, preferFlats)}. Tap every position shown on this fretboard.</div>
            </div>
            <div class="score-display"><span class="score">${this.found.size} / ${this.positions.length}</span><span class="progress">Round ${this.round} / ${config.rounds}</span><button class="seq-skip" id="df-reveal">Reveal</button></div>
        </div>`;
        this.container.querySelector('#df-reveal')?.addEventListener('click', () => this._reveal());
    }

    _onTap({ stringIndex, fret }) {
        if (this.transitioning || !this.prompt) return;
        const key = `${stringIndex}:${fret}`;
        if (this.found.has(key)) return;
        const correct = this.positions.some(position => position.string === stringIndex && position.fret === fret);
        if (correct) {
            this.found.add(key);
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-correct', this.prompt.degreeLabel);
            const score = this.container.querySelector('.score');
            if (score) score.textContent = `${this.found.size} / ${this.positions.length}`;
            if (this.found.size === this.positions.length) {
                this.transitioning = true;
                this.score++;
                this.container.querySelector('#df-prompt')?.classList.add('result-correct');
                setTimeout(() => { if (this.active) this._next(); }, 700);
            }
        } else {
            this.wrong++;
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-wrong');
            setTimeout(() => this._restoreFound(), 250);
        }
    }

    _restoreFound() {
        if (!this.active) return;
        this.fretboard.clearHighlights();
        for (const key of this.found) {
            const [string, fret] = key.split(':').map(Number);
            this.fretboard.highlightFret(string, fret, 'highlight-correct', this.prompt.degreeLabel);
        }
    }

    _reveal() {
        for (const position of this.positions) {
            const key = `${position.string}:${position.fret}`;
            if (!this.found.has(key)) this.fretboard.highlightFret(position.string, position.fret, 'highlight-expected', this.prompt.degreeLabel);
        }
    }

    _showDone() {
        const config = this._config();
        this.prompt = null;
        this.fretboard?.clearHighlights();
        eventBus.emit('practice:complete', {
            skillId: this.slug,
            title: 'Scale degrees',
            correct: this.score,
            total: Number(config.rounds),
            minutes: 5,
            mastery: this.score / Math.max(1, Number(config.rounds)),
        });
        this.container.innerHTML = `<div class="find-note-ui"><div class="game-over"><h2>Degree set complete</h2><div class="game-over-score">${this.score} / ${config.rounds} perfect rounds</div><div class="theory-desc">${this.wrong} wrong taps</div><button class="restart-btn" id="df-again">Again</button></div></div>`;
        this.container.querySelector('#df-again')?.addEventListener('click', () => this._showStart());
    }

    onSettingsChanged() {
        if (this.active) this._showStart();
    }
}
