import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { getTuning } from '../../theory/tunings.js';
import { eventBus } from '../../services/events.js';
import {
    MODES, MODE_ORDER, pitchName, lowERootFrets,
    generateThreeNpsPattern, generateOneStringScale, buildScaleTraversal,
} from '../../theory/curriculum.js';

export function traversalFromId(id) {
    if (id === 'seconds') return { kind: 'brokenInterval', distance: 2 };
    if (id === 'thirds') return { kind: 'brokenInterval', distance: 3 };
    if (id === 'fourths') return { kind: 'brokenInterval', distance: 4 };
    if (id === 'cells3') return { kind: 'cell', size: 3 };
    if (id === 'cells4') return { kind: 'cell', size: 4 };
    return { kind: 'scalar' };
}

export default class ScaleSequenceMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.fretboard = null;
        this._tapHandler = null;
        this.sequence = [];
        this.index = 0;
        this.locked = false;
    }

    activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.fretboard = fretboard;
        this._tapHandler = detail => this._onTap(detail);
        eventBus.on('fretboard:tap', this._tapHandler);
        this._showSetup();
    }

    deactivate() {
        super.deactivate();
        if (this._tapHandler) eventBus.off('fretboard:tap', this._tapHandler);
        this._tapHandler = null;
        this.fretboard?.clearHighlights();
        if (this.container) this.container.innerHTML = '';
    }

    _config() {
        return {
            root: 4,
            modeId: 'aeolian',
            layout: 'threeNps',
            string: 0,
            simpleOpenRoot: true,
            traversal: 'scalar',
            direction: 'upDown',
            maxFret: 24,
            ...settings.getMode(this.slug),
        };
    }

    _set(key, value) {
        settings.setMode(this.slug, key, value);
    }

    _showSetup() {
        const config = this._config();
        const tuning = getTuning(settings.global.tuning);
        const enabledModes = settings.global.enabledModes?.length ? settings.global.enabledModes : MODE_ORDER;
        this.fretboard?.clearHighlights();
        this.container.innerHTML = `<div class="find-note-ui">
            <div class="challenge-prompt"><span class="challenge-text">Scale Sequences</span>
                <div class="theory-desc">Play a three-notes-per-string shape from the low-E tonic, or a complete scale on one string.</div></div>
            <div class="theory-controls">
                <label>Layout <select id="ss-layout"><option value="threeNps" ${config.layout === 'threeNps' ? 'selected' : ''}>3 notes per string</option><option value="oneString" ${config.layout === 'oneString' ? 'selected' : ''}>One string</option></select></label>
                <label>Tonic <select id="ss-root">${Array.from({ length: 12 }, (_, pc) => `<option value="${pc}" ${pc === Number(config.root) ? 'selected' : ''}>${pitchName(pc)}</option>`).join('')}</select></label>
                <label>Mode <select id="ss-mode">${enabledModes.map(id => `<option value="${id}" ${id === config.modeId ? 'selected' : ''}>${MODES[id].name}</option>`).join('')}</select></label>
                <label>Pattern <select id="ss-traversal">
                    <option value="scalar" ${config.traversal === 'scalar' ? 'selected' : ''}>Straight scale</option>
                    <option value="seconds" ${config.traversal === 'seconds' ? 'selected' : ''}>Broken seconds</option>
                    <option value="thirds" ${config.traversal === 'thirds' ? 'selected' : ''}>Broken thirds</option>
                    <option value="fourths" ${config.traversal === 'fourths' ? 'selected' : ''}>Broken fourths</option>
                    <option value="cells3" ${config.traversal === 'cells3' ? 'selected' : ''}>3-note cells</option>
                    <option value="cells4" ${config.traversal === 'cells4' ? 'selected' : ''}>4-note cells</option>
                </select></label>
                <label>Direction <select id="ss-direction"><option value="up" ${config.direction === 'up' ? 'selected' : ''}>Up</option><option value="down" ${config.direction === 'down' ? 'selected' : ''}>Down</option><option value="upDown" ${config.direction === 'upDown' ? 'selected' : ''}>Up and back</option></select></label>
                <label>String <select id="ss-string">${tuning.stringNames.map((name, index) => `<option value="${index}" ${index === Number(config.string) ? 'selected' : ''}>${6 - index}: ${name}</option>`).join('')}</select></label>
                <label><input type="checkbox" id="ss-simple" ${config.simpleOpenRoot ? 'checked' : ''}> Simple one-string: open string is tonic</label>
            </div>
            <p class="theory-desc">Simple one-string mode uses the open string as tonic and samples a mode from the pool enabled in Settings. Turn it off to choose both tonic and mode.</p>
            <button class="restart-btn" id="ss-start">Build exercise</button>
        </div>`;

        const bindings = [
            ['#ss-layout', 'layout', String], ['#ss-root', 'root', Number], ['#ss-mode', 'modeId', String],
            ['#ss-traversal', 'traversal', String], ['#ss-direction', 'direction', String], ['#ss-string', 'string', Number],
        ];
        for (const [selector, key, cast] of bindings) {
            this.container.querySelector(selector)?.addEventListener('change', event => this._set(key, cast(event.target.value)));
        }
        this.container.querySelector('#ss-simple')?.addEventListener('change', event => this._set('simpleOpenRoot', event.target.checked));
        this.container.querySelector('#ss-start')?.addEventListener('click', () => this._start());
    }

    _buildSequence() {
        const config = this._config();
        const tuning = getTuning(settings.global.tuning);
        let tonic = Number(config.root);
        let modeId = config.modeId;
        let notes;
        if (config.layout === 'oneString') {
            const string = Number(config.string);
            if (config.simpleOpenRoot) {
                tonic = tuning.strings[string];
                const enabledModes = settings.global.enabledModes?.length ? settings.global.enabledModes : MODE_ORDER;
                modeId = enabledModes[Math.floor(Math.random() * enabledModes.length)];
            }
            notes = generateOneStringScale({
                tonic,
                modeId,
                string,
                minFret: 0,
                maxFret: Number(config.maxFret),
                tuning,
                rootToRoot: true,
            });
        } else {
            const rootFret = lowERootFrets(tonic, tuning, 12)[0];
            notes = generateThreeNpsPattern({ tonic, modeId, rootFret, tuning, maxFret: Number(config.maxFret) });
        }
        return { tonic, modeId, notes: buildScaleTraversal(notes, traversalFromId(config.traversal), config.direction) };
    }

    _start() {
        try {
            const built = this._buildSequence();
            this.tonic = built.tonic;
            this.activeModeId = built.modeId;
            this.sequence = built.notes;
        } catch (error) {
            this.container.innerHTML = `<div class="find-note-ui"><p>${error.message}</p><button class="restart-btn" id="ss-back">Back</button></div>`;
            this.container.querySelector('#ss-back')?.addEventListener('click', () => this._showSetup());
            return;
        }
        if (!this.sequence.length) return;
        this.index = 0;
        this.locked = false;
        const maxFret = Math.max(...this.sequence.map(note => note.fret));
        this.fretboard?.updateSettings({ displayStartFret: 0, displayEndFret: maxFret > 12 ? 24 : 12 });
        this._renderRound();
    }

    _renderRound() {
        this.fretboard?.clearHighlights();
        this.locked = false;
        if (this.index >= this.sequence.length) return this._showDone();
        const note = this.sequence[this.index];
        const config = this._config();
        this.container.innerHTML = `<div class="find-note-ui">
            <div class="challenge-prompt" id="ss-prompt">
                <div class="theory-desc">${pitchName(this.tonic)} ${MODES[this.activeModeId || config.modeId].name} · ${config.layout === 'threeNps' ? '3NPS' : `string ${6 - note.string}`} · ${config.traversal}</div>
                <span class="challenge-text">Play degree <strong>${note.degreeLabel}</strong> (${pitchName(note.pitchClass)})</span>
            </div>
            <div class="score-display"><span class="progress">${this.index + 1} / ${this.sequence.length}</span><button class="seq-skip" id="ss-reveal">Reveal</button><button class="seq-skip" id="ss-setup">Setup</button></div>
        </div>`;
        this.container.querySelector('#ss-reveal')?.addEventListener('click', () => this._reveal());
        this.container.querySelector('#ss-setup')?.addEventListener('click', () => this._showSetup());
    }

    _onTap({ stringIndex, fret }) {
        if (this.locked || !this.sequence.length || this.index >= this.sequence.length) return;
        const expected = this.sequence[this.index];
        if (stringIndex === expected.string && fret === expected.fret) {
            this.locked = true;
            this.fretboard.clearHighlights();
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-correct', expected.degreeLabel);
            this.index++;
            setTimeout(() => { if (this.active) this._renderRound(); }, 350);
        } else {
            this.fretboard.clearHighlights();
            this.fretboard.highlightFret(stringIndex, fret, 'highlight-wrong');
            setTimeout(() => { if (this.active) this.fretboard.clearHighlights(); }, 250);
        }
    }

    _reveal() {
        if (this.index >= this.sequence.length) return;
        const expected = this.sequence[this.index];
        this.fretboard.clearHighlights();
        this.fretboard.highlightFret(expected.string, expected.fret, 'highlight-expected', expected.degreeLabel);
    }

    _showDone() {
        this.fretboard?.clearHighlights();
        eventBus.emit('practice:complete', { skillId: this.slug, title: 'Scale journeys', correct: this.sequence.length, total: this.sequence.length, minutes: 5, mastery: 0.65 });
        this.container.innerHTML = `<div class="find-note-ui"><div class="game-over"><h2>Sequence complete</h2><div class="game-over-score">${this.sequence.length} notes</div><button class="restart-btn" id="ss-again">Again</button><button class="restart-btn" id="ss-configure">Change setup</button></div></div>`;
        this.container.querySelector('#ss-again')?.addEventListener('click', () => this._start());
        this.container.querySelector('#ss-configure')?.addEventListener('click', () => this._showSetup());
    }

    onSettingsChanged() {
        if (this.active) this._showSetup();
    }
}
