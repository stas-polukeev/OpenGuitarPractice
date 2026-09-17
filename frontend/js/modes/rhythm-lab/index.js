import { ModeBase } from '../mode-base.js';
import { eventBus } from '../../services/events.js';
import { getAudioContext, ensureAudio, playDrum, stopAll } from '../../services/audio.js';
import {
    RHYTHM_LANES,
    RHYTHM_PATTERNS,
    RHYTHM_STAGES,
    STEPS_PER_BAR,
    getRhythmPattern,
    patternToGrid,
    scoreBuiltPattern,
    scoreRhythmAttempt,
} from '../../theory/rhythm-patterns.js';
import {
    getNextRecommendedPattern,
    getPatternProgress,
    getRhythmPreferences,
    getUnlockedPatternIds,
    markPatternHeard,
    recordBuildResult,
    recordRhythmAttempt,
    setRhythmPreference,
} from '../../services/rhythm-progress.js';

const PHASES = Object.freeze([
    { id: 'hear', label: 'Hear', help: 'Listen for the kick-snare shape before touching the pads.' },
    { id: 'deconstruct', label: 'Layers', help: 'Solo one instrument, then hear how it fits the pulse.' },
    { id: 'copy', label: 'Copy', help: 'Recreate the groove with live timing feedback.' },
    { id: 'recall', label: 'Recall', help: 'Play from memory with the target cells hidden.' },
    { id: 'build', label: 'Build', help: 'Place the groove on the step grid, then check your answer.' },
    { id: 'free', label: 'Free Play', help: 'All patterns remain available. Explore without scoring.' },
]);

const LANE_META = Object.freeze({
    hat: { short: 'HH', label: 'Hi-hat' },
    snare: { short: 'SN', label: 'Snare' },
    kick: { short: 'K', label: 'Kick' },
});

const COUNT_LABELS = ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'];
const SCHEDULE_AHEAD_SECONDS = 0.12;
const LOOK_AHEAD_MS = 25;
const START_DELAY_SECONDS = 0.10;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function emptyGrid() {
    return Object.fromEntries(RHYTHM_LANES.map(lane => [lane, Array(STEPS_PER_BAR).fill(false)]));
}

function formatOffset(value) {
    if (!value) return 'centered';
    return `${Math.abs(value)} ms ${value < 0 ? 'early' : 'late'}`;
}

function phaseActionLabel(phase) {
    return {
        hear: 'Hear pattern',
        deconstruct: 'Hear layer',
        copy: 'Start copy',
        recall: 'Start recall',
        build: 'Preview build',
        free: 'Start metronome',
    }[phase];
}

function triggerDrum(lane, when = undefined, velocity = 0.55) {
    const kind = lane === 'hat' || lane === 'click' ? 'hihat' : lane;
    playDrum(kind, { when, velocity, clean: true });
}

export default class RhythmLabMode extends ModeBase {
    constructor(slug = 'rhythm-lab') {
        super(slug);
        const preferences = getRhythmPreferences();
        this.container = null;
        this.pattern = getNextRecommendedPattern();
        this.phase = 'hear';
        this.layer = 'kick';
        this.bpm = preferences.bpm || 80;
        this.scaffold = preferences.scaffold || 'full';
        this.leftHanded = Boolean(preferences.leftHanded);
        this.loop = Boolean(preferences.loop);
        this.latencyOffsetMs = preferences.latencyOffsetMs || 0;
        this.buildGrid = emptyGrid();
        this.hits = [];
        this.lastResult = null;
        this.isRunning = false;
        this.currentStep = -1;
        this._scheduleTimer = null;
        this._finishTimer = null;
        this._restartTimer = null;
        this._visualTimers = [];
        this._runToken = 0;
        this._boundClick = event => this._onClick(event);
        this._boundChange = event => this._onChange(event);
        this._boundInput = event => this._onInput(event);
        this._boundPointerDown = event => this._onPointerDown(event);
    }

    async activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.pattern = this.pattern || RHYTHM_PATTERNS[0];
        this.bpm = clamp(this.bpm, this.pattern.bpmRange[0], this.pattern.bpmRange[1]);
        container.addEventListener('click', this._boundClick);
        container.addEventListener('change', this._boundChange);
        container.addEventListener('input', this._boundInput);
        container.addEventListener('pointerdown', this._boundPointerDown);
        this._render();
    }

    deactivate() {
        super.deactivate();
        this._stopRun();
        if (this.container) {
            this.container.removeEventListener('click', this._boundClick);
            this.container.removeEventListener('change', this._boundChange);
            this.container.removeEventListener('input', this._boundInput);
            this.container.removeEventListener('pointerdown', this._boundPointerDown);
            this.container.innerHTML = '';
        }
        this.container = null;
    }

    onSettingsChanged() {
        // Rhythm Lab owns its time-critical settings locally to avoid interrupting a run.
    }

    _render() {
        if (!this.container) return;
        const unlocked = new Set(getUnlockedPatternIds());
        const progress = getPatternProgress(this.pattern.id);
        const phase = PHASES.find(item => item.id === this.phase);
        const grid = this.phase === 'build' ? this.buildGrid : patternToGrid(this.pattern);
        const hideTarget = this.phase === 'recall' || this.scaffold === 'none';

        this.container.innerHTML = `
            <section class="rhythm-lab" aria-labelledby="rhythm-title">
                <header class="rhythm-lab__header">
                    <div>
                        <p class="rhythm-lab__eyebrow">Rhythm Lab · ${this.pattern.stage}</p>
                        <h2 class="rhythm-lab__title" id="rhythm-title">${this.pattern.title}</h2>
                        <p class="rhythm-lab__description">${this.pattern.description}</p>
                    </div>
                    <div class="rhythm-lab__mastery" aria-label="Mastery: ${progress.mastery}">
                        <span class="rhythm-lab__mastery-label">${progress.mastery}</span>
                        <span class="rhythm-lab__best">Best ${progress.bestScore}% · ${progress.bestBpm || '—'} BPM</span>
                    </div>
                </header>

                <div class="rhythm-lab__selectors">
                    <label class="rhythm-control rhythm-control--pattern">
                        <span>Pattern</span>
                        <select data-rhythm-control="pattern">
                            ${this._patternOptions(unlocked)}
                        </select>
                    </label>
                    <label class="rhythm-control rhythm-control--bpm">
                        <span>BPM <output data-rhythm-output="bpm">${this.bpm}</output></span>
                        <input data-rhythm-control="bpm" type="range" min="45" max="160" step="1" value="${this.bpm}">
                    </label>
                    <label class="rhythm-control rhythm-control--scaffold">
                        <span>Guidance</span>
                        <select data-rhythm-control="scaffold">
                            <option value="full" ${this.scaffold === 'full' ? 'selected' : ''}>Hear + see</option>
                            <option value="pulse" ${this.scaffold === 'pulse' ? 'selected' : ''}>Pulse + see</option>
                            <option value="none" ${this.scaffold === 'none' ? 'selected' : ''}>Memory</option>
                        </select>
                    </label>
                </div>

                <nav class="rhythm-phases" aria-label="Practice phase">
                    ${PHASES.map(item => `
                        <button class="rhythm-phases__item ${item.id === this.phase ? 'is-active' : ''}"
                                type="button" data-rhythm-phase="${item.id}"
                                aria-current="${item.id === this.phase ? 'step' : 'false'}">${item.label}</button>
                    `).join('')}
                </nav>

                <div class="rhythm-lab__coach">
                    <p>${phase.help}</p>
                    ${this.phase === 'deconstruct' ? this._layerSelector() : ''}
                </div>

                ${this._gridMarkup(grid, hideTarget)}

                <div class="rhythm-lab__transport">
                    <button class="rhythm-transport__primary" type="button" data-rhythm-action="toggle-run">
                        ${this.isRunning ? 'Stop' : phaseActionLabel(this.phase)}
                    </button>
                    ${this.phase === 'build' ? '<button class="rhythm-transport__secondary" type="button" data-rhythm-action="check-build">Check build</button><button class="rhythm-transport__secondary" type="button" data-rhythm-action="clear-build">Clear</button>' : ''}
                    <label class="rhythm-toggle">
                        <input type="checkbox" data-rhythm-control="loop" ${this.loop ? 'checked' : ''}>
                        <span>Loop</span>
                    </label>
                    <label class="rhythm-toggle">
                        <input type="checkbox" data-rhythm-control="left-handed" ${this.leftHanded ? 'checked' : ''}>
                        <span>Left-handed pads</span>
                    </label>
                </div>

                ${this._padsMarkup()}
                <div class="rhythm-lab__status" data-rhythm-status role="status" aria-live="polite">
                    ${this._resultMarkup()}
                </div>
            </section>`;
    }

    _patternOptions(unlocked) {
        return RHYTHM_STAGES.map(stage => {
            const options = RHYTHM_PATTERNS.filter(item => item.stage === stage.id).map(item => {
                const guidedLock = !unlocked.has(item.id);
                const label = `${guidedLock ? '◇ ' : '✓ '}${item.title}`;
                return `<option value="${item.id}" ${item.id === this.pattern.id ? 'selected' : ''}>${label}</option>`;
            }).join('');
            return `<optgroup label="${stage.title}">${options}</optgroup>`;
        }).join('');
    }

    _layerSelector() {
        return `<div class="rhythm-layers" role="group" aria-label="Solo layer">
            ${RHYTHM_LANES.map(lane => `
                <button type="button" class="rhythm-layers__item ${lane === this.layer ? 'is-active' : ''}"
                        data-rhythm-layer="${lane}" aria-pressed="${lane === this.layer}">${LANE_META[lane].label}</button>
            `).join('')}
        </div>`;
    }

    _gridMarkup(grid, hideTarget) {
        return `<div class="rhythm-grid-wrap">
            <div class="rhythm-count" aria-hidden="true">
                <span class="rhythm-count__label"></span>
                ${COUNT_LABELS.map((label, step) => `<span class="rhythm-count__step ${step % 4 === 0 ? 'is-beat' : ''}">${label}</span>`).join('')}
            </div>
            <div class="rhythm-grid" role="grid" aria-label="One bar, sixteenth-note grid">
                ${RHYTHM_LANES.map(lane => `
                    <div class="rhythm-grid__row" role="row" data-rhythm-row="${lane}">
                        <span class="rhythm-grid__label" role="rowheader">${LANE_META[lane].short}</span>
                        ${grid[lane].map((active, step) => {
                            const visible = active && !hideTarget;
                            const classes = [
                                'rhythm-grid__cell',
                                step % 4 === 0 ? 'is-beat' : '',
                                visible ? 'is-active' : '',
                                active && hideTarget ? 'is-concealed' : '',
                                this.currentStep === step ? 'is-current' : '',
                            ].filter(Boolean).join(' ');
                            const editable = this.phase === 'build';
                            return `<button type="button" role="gridcell" class="${classes}"
                                data-rhythm-cell data-lane="${lane}" data-step="${step}"
                                aria-label="${LANE_META[lane].label}, ${COUNT_LABELS[step]}${active ? ', active' : ''}"
                                aria-pressed="${active}" ${editable ? '' : 'tabindex="-1"'}></button>`;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    _padsMarkup() {
        const order = this.leftHanded ? ['kick', 'snare', 'hat'] : ['hat', 'snare', 'kick'];
        return `<div class="rhythm-pads ${this.leftHanded ? 'is-left-handed' : ''}" role="group" aria-label="Drum pads">
            ${order.map(lane => `
                <button type="button" class="rhythm-pad rhythm-pad--${lane}" data-rhythm-pad="${lane}"
                        aria-label="Play ${LANE_META[lane].label}">
                    <span class="rhythm-pad__short">${LANE_META[lane].short}</span>
                    <span class="rhythm-pad__label">${LANE_META[lane].label}</span>
                </button>
            `).join('')}
        </div>`;
    }

    _resultMarkup() {
        if (!this.lastResult) return 'Choose a phase, then start when ready.';
        if (this.lastResult.kind === 'build') {
            return `<div class="rhythm-result ${this.lastResult.score >= 90 ? 'is-success' : 'is-try-again'}">
                <strong>${this.lastResult.score}% matched</strong>
                <span>${this.lastResult.score >= 90 ? 'Pattern built correctly.' : 'Review the grid and try again.'}</span>
            </div>`;
        }
        return `<div class="rhythm-result ${this.lastResult.score >= 88 ? 'is-success' : 'is-try-again'}">
            <strong>${this.lastResult.score}%</strong>
            <span>${this.lastResult.misses} missed · ${this.lastResult.extras} extra · ${formatOffset(this.lastResult.earlyLateBiasMs)} · spread ${this.lastResult.spreadMs} ms</span>
        </div>`;
    }

    _onClick(event) {
        const phaseButton = event.target.closest('[data-rhythm-phase]');
        if (phaseButton) {
            this._stopRun();
            this.phase = phaseButton.dataset.rhythmPhase;
            this.lastResult = null;
            this.currentStep = -1;
            this._render();
            return;
        }

        const layerButton = event.target.closest('[data-rhythm-layer]');
        if (layerButton) {
            this.layer = layerButton.dataset.rhythmLayer;
            this._render();
            return;
        }

        const action = event.target.closest('[data-rhythm-action]')?.dataset.rhythmAction;
        if (action === 'toggle-run') {
            if (this.isRunning) this._stopRun(true);
            else this._startRun();
        } else if (action === 'check-build') {
            this._checkBuild();
        } else if (action === 'clear-build') {
            this.buildGrid = emptyGrid();
            this.lastResult = null;
            this._render();
        }
    }

    _onChange(event) {
        const control = event.target.dataset.rhythmControl;
        if (control === 'pattern') {
            this._stopRun();
            this.pattern = getRhythmPattern(event.target.value) || RHYTHM_PATTERNS[0];
            this.bpm = clamp(this.bpm, this.pattern.bpmRange[0], this.pattern.bpmRange[1]);
            this.buildGrid = emptyGrid();
            this.lastResult = null;
            setRhythmPreference('bpm', this.bpm);
            this._render();
        } else if (control === 'scaffold') {
            this.scaffold = event.target.value;
            setRhythmPreference('scaffold', this.scaffold);
            this._render();
        } else if (control === 'loop') {
            this.loop = event.target.checked;
            setRhythmPreference('loop', this.loop);
        } else if (control === 'left-handed') {
            this.leftHanded = event.target.checked;
            setRhythmPreference('leftHanded', this.leftHanded);
            this._render();
        }
    }

    _onInput(event) {
        if (event.target.dataset.rhythmControl !== 'bpm') return;
        this.bpm = Number(event.target.value);
        setRhythmPreference('bpm', this.bpm);
        const output = this.container?.querySelector('[data-rhythm-output="bpm"]');
        if (output) output.textContent = this.bpm;
    }

    _onPointerDown(event) {
        const pad = event.target.closest('[data-rhythm-pad]');
        if (pad) {
            event.preventDefault();
            const now = performance.now();
            const eventTime = Number.isFinite(event.timeStamp) && Math.abs(event.timeStamp - now) < 60000
                ? event.timeStamp
                : now;
            this._hitPad(pad.dataset.rhythmPad, pad, eventTime);
            return;
        }

        const cell = event.target.closest('[data-rhythm-cell]');
        if (cell && this.phase === 'build') {
            event.preventDefault();
            const lane = cell.dataset.lane;
            const step = Number(cell.dataset.step);
            this.buildGrid[lane][step] = !this.buildGrid[lane][step];
            this.lastResult = null;
            this._render();
        }
    }

    async _hitPad(lane, element, hitTimeMs) {
        if (this.isRunning && ['copy', 'recall'].includes(this.phase)
            && hitTimeMs >= this._performanceStartMs - 120
            && hitTimeMs <= this._performanceEndMs + 120) {
            this.hits.push({ lane, timeMs: hitTimeMs });
        }

        try {
            await ensureAudio();
            triggerDrum(lane);
        } catch {
            this._setStatus('Audio could not start. Tap Start and try again.');
        }

        element.classList.add('is-pressed');
        window.setTimeout(() => element.classList.remove('is-pressed'), 90);

    }

    async _startRun() {
        if (this.isRunning) return;
        try {
            await ensureAudio();
        } catch {
            this._setStatus('Audio could not start. Check the device volume and try again.');
            return;
        }
        if (!this.active) return;

        this._stopRun(false);
        const token = this._runToken;
        const audio = getAudioContext();
        const stepSeconds = 60 / this.bpm / 4;
        const firstAudioTime = audio.currentTime + START_DELAY_SECONDS;
        this._clockOffsetMs = performance.now() - audio.currentTime * 1000;
        this._performanceStartAudio = firstAudioTime + STEPS_PER_BAR * stepSeconds;
        this._performanceStartMs = this._performanceStartAudio * 1000 + this._clockOffsetMs;
        this._performanceEndMs = this._performanceStartMs + STEPS_PER_BAR * stepSeconds * 1000;
        this._nextTimelineStep = 0;
        this._nextAudioTime = firstAudioTime;
        this._stepSeconds = stepSeconds;
        this.hits = [];
        this.lastResult = null;
        this.isRunning = true;
        this.currentStep = -1;
        this._setRunningUI(true);
        this._setStatus('Count in: 1, 2, 3, 4…');

        this._schedule(token);
        this._scheduleTimer = window.setInterval(() => this._schedule(token), LOOK_AHEAD_MS);
    }

    _schedule(token) {
        if (!this.isRunning || token !== this._runToken) return;
        const audio = getAudioContext();
        const totalTimelineSteps = STEPS_PER_BAR * 2;

        while (this._nextTimelineStep < totalTimelineSteps
            && this._nextAudioTime < audio.currentTime + SCHEDULE_AHEAD_SECONDS) {
            this._scheduleTimelineStep(this._nextTimelineStep, this._nextAudioTime, token);
            this._nextTimelineStep += 1;
            this._nextAudioTime += this._stepSeconds;
        }

        if (this._nextTimelineStep >= totalTimelineSteps && !this._finishTimer) {
            window.clearInterval(this._scheduleTimer);
            this._scheduleTimer = null;
            const finishDelay = Math.max(0, (this._nextAudioTime - audio.currentTime) * 1000 + 125);
            this._finishTimer = window.setTimeout(() => this._finishRun(token), finishDelay);
        }
    }

    _scheduleTimelineStep(timelineStep, audioTime, token) {
        if (timelineStep < STEPS_PER_BAR) {
            if (timelineStep % 4 === 0) triggerDrum('click', audioTime, 0.42);
            return;
        }

        const step = timelineStep - STEPS_PER_BAR;
        if (this._shouldPlayPulse() && step % 4 === 0) triggerDrum('click', audioTime, 0.28);
        if (this._shouldPlayPattern()) {
            const lanes = this.phase === 'deconstruct' ? [this.layer] : RHYTHM_LANES;
            for (const lane of lanes) {
                if (this._sourceGrid()[lane][step]) {
                    triggerDrum(lane, audioTime, this.phase === 'copy' ? 0.38 : 0.82);
                }
            }
        }

        const delay = Math.max(0, audioTime * 1000 + this._clockOffsetMs - performance.now());
        const timer = window.setTimeout(() => {
            if (token === this._runToken) this._setPlayhead(step);
        }, delay);
        this._visualTimers.push(timer);
    }

    _sourceGrid() {
        return this.phase === 'build' ? this.buildGrid : patternToGrid(this.pattern);
    }

    _shouldPlayPattern() {
        if (['hear', 'deconstruct', 'build'].includes(this.phase)) return true;
        return this.phase === 'copy' && this.scaffold === 'full';
    }

    _shouldPlayPulse() {
        if (this.phase === 'free' || this.phase === 'recall') return true;
        if (this.phase === 'deconstruct') return this.layer !== 'hat';
        return this.phase === 'copy' && this.scaffold !== 'full';
    }

    _finishRun(token) {
        if (token !== this._runToken) return;
        this._finishTimer = null;
        const shouldRestart = this.loop && this.active;
        this.isRunning = false;
        this.currentStep = -1;
        this._setPlayhead(-1);
        this._setRunningUI(false);

        if (this.phase === 'hear') {
            markPatternHeard(this.pattern.id);
            this._setStatus('Pattern heard. Next, isolate its layers or copy it.');
        } else if (['copy', 'recall'].includes(this.phase)) {
            this.lastResult = scoreRhythmAttempt({
                pattern: this.pattern,
                hits: this.hits,
                bpm: this.bpm,
                startTimeMs: this._performanceStartMs,
                latencyOffsetMs: this.latencyOffsetMs,
                level: this.pattern.difficulty >= 6 ? 'advanced' : this.pattern.difficulty >= 4 ? 'intermediate' : 'beginner',
            });
            recordRhythmAttempt(this.pattern.id, this.lastResult, {
                phase: this.phase,
                scaffold: this.scaffold,
            });
            if (this.lastResult.score >= 70) {
                eventBus.emit('practice:complete', {
                    skillId: this.slug,
                    title: 'Rhythm lab',
                    correct: this.lastResult.score,
                    total: 100,
                    minutes: 1,
                    mastery: this.lastResult.score / 100,
                });
            }
            this._setStatus(this._resultMarkup());
        } else if (this.phase === 'deconstruct') {
            this._setStatus(`${LANE_META[this.layer].label} layer complete. Try another layer or copy the groove.`);
        } else if (this.phase === 'build') {
            this._setStatus('Build preview complete. Check it when the pattern sounds right.');
        } else {
            this._setStatus('Free-play bar complete. Change the tempo or keep exploring.');
        }

        if (shouldRestart) {
            this._restartTimer = window.setTimeout(() => this._startRun(), 350);
        }
    }

    _checkBuild() {
        this.lastResult = { kind: 'build', ...scoreBuiltPattern(this.pattern, this.buildGrid) };
        recordBuildResult(this.pattern.id, this.lastResult);
        if (this.lastResult.score >= 90) {
            eventBus.emit('practice:complete', { skillId: this.slug, title: 'Rhythm lab', correct: this.lastResult.score, total: 100, minutes: 1, mastery: this.lastResult.score / 100 });
        }
        this._setStatus(this._resultMarkup());
    }

    _stopRun(updateUI = false) {
        this._runToken += 1;
        this.isRunning = false;
        window.clearInterval(this._scheduleTimer);
        window.clearTimeout(this._finishTimer);
        window.clearTimeout(this._restartTimer);
        this._visualTimers.forEach(timer => window.clearTimeout(timer));
        this._scheduleTimer = null;
        this._finishTimer = null;
        this._restartTimer = null;
        this._visualTimers = [];
        this.currentStep = -1;
        try { stopAll(); } catch { /* no active audio graph */ }
        if (updateUI) {
            this._setPlayhead(-1);
            this._setRunningUI(false);
            this._setStatus('Stopped. Start again when ready.');
        }
    }

    _setPlayhead(step) {
        this.currentStep = step;
        if (!this.container) return;
        this.container.querySelectorAll('[data-rhythm-cell]').forEach(cell => {
            cell.classList.toggle('is-current', Number(cell.dataset.step) === step);
        });
    }

    _setRunningUI(running) {
        if (!this.container) return;
        const button = this.container.querySelector('[data-rhythm-action="toggle-run"]');
        if (button) button.textContent = running ? 'Stop' : phaseActionLabel(this.phase);
        this.container.querySelectorAll('[data-rhythm-control="pattern"], [data-rhythm-control="bpm"], [data-rhythm-control="scaffold"], [data-rhythm-control="left-handed"], [data-rhythm-phase], [data-rhythm-layer]')
            .forEach(control => { control.disabled = running; });
    }

    _setStatus(content) {
        const status = this.container?.querySelector('[data-rhythm-status]');
        if (status) status.innerHTML = content;
    }
}
