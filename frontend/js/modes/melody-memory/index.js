import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { eventBus } from '../../services/events.js';
import {
    MELODY_LEVELS,
    degreeInfo,
    generateMelodyTrial,
    getLevelSummary,
    isLevelUnlocked,
    loadAuralProgress,
    recordAuralAttempt,
    saveAuralProgress,
} from '../../theory/ear-curriculum.js';
import {
    ensureAudio,
    getAudioContext,
    playSequence,
    stopAll,
} from '../../services/audio.js';

const DEFAULTS = Object.freeze({
    levelId: MELODY_LEVELS[0].id,
    sessionLength: 10,
    humPrompt: true,
    labels: 'degrees-solfege',
    freePractice: false,
    cleanReference: true,
});

export default class MelodyMemoryMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.progress = loadAuralProgress();
        this.levelId = DEFAULTS.levelId;
        this.trial = null;
        this.entered = [];
        this.score = 0;
        this.total = 0;
        this.replays = 0;
        this.ready = false;
        this.answered = false;
        this.answerStartedAt = 0;
        this._timers = new Set();
    }

    async activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.progress = loadAuralProgress();
        const configured = this._ms().levelId;
        this.levelId = MELODY_LEVELS.some((level) => level.id === configured) ? configured : DEFAULTS.levelId;
        this._showStart();
    }

    deactivate() {
        super.deactivate();
        this._clearTimers();
        stopAll();
        if (this.container) this.container.innerHTML = '';
    }

    _ms() {
        return { ...DEFAULTS, ...settings.getMode(this.slug) };
    }

    _setTimer(callback, delay) {
        const timer = setTimeout(() => {
            this._timers.delete(timer);
            callback();
        }, delay);
        this._timers.add(timer);
    }

    _clearTimers() {
        for (const timer of this._timers) clearTimeout(timer);
        this._timers.clear();
    }

    _label(degree) {
        const info = typeof degree === 'string' ? degreeInfo(degree) : degree;
        const labelStyle = this._ms().labels;
        if (labelStyle === 'solfege') return info.solfege;
        if (labelStyle === 'degrees') return info.display;
        return `${info.display} · ${info.solfege}`;
    }

    _showStart() {
        this._clearTimers();
        stopAll();
        const modeSettings = this._ms();
        const options = MELODY_LEVELS.map((level, index) => {
            const summary = getLevelSummary(this.progress, level.id);
            const unlocked = modeSettings.freePractice || isLevelUnlocked(this.progress, level.id, MELODY_LEVELS);
            const marker = summary.stable ? '✓' : summary.mastered ? '★' : `${Math.round(summary.accuracy * 100)}%`;
            return `<option value="${level.id}" ${level.id === this.levelId ? 'selected' : ''} ${unlocked ? '' : 'disabled'}>${index + 1}. ${level.title} — ${marker}${unlocked ? '' : ' 🔒'}</option>`;
        }).join('');
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt">
                    <span class="challenge-text">Melody Memory</span>
                    <div class="theory-desc" style="margin-top:8px">Hear a short call, remember its function, then enter the scale degrees in order.</div>
                </div>
                <div class="settings-group" style="margin:16px 0">
                    <label for="melody-level">Learning step</label>
                    <select id="melody-level">${options}</select>
                    <label style="display:flex;gap:8px;align-items:center;margin-top:10px">
                        <input type="checkbox" id="melody-free" ${modeSettings.freePractice ? 'checked' : ''}>
                        Free practice — choose any level
                    </label>
                </div>
                <button class="restart-btn" id="melody-start">Start listening</button>
            </div>`;
        this.container.querySelector('#melody-level').addEventListener('change', (event) => {
            this.levelId = event.target.value;
            settings.setMode(this.slug, 'levelId', this.levelId);
        });
        this.container.querySelector('#melody-free').addEventListener('change', (event) => {
            settings.setMode(this.slug, 'freePractice', event.target.checked);
            this._showStart();
        });
        this.container.querySelector('#melody-start').addEventListener('click', async () => {
            await ensureAudio();
            this.score = 0;
            this.total = 0;
            this._nextTrial();
        });
    }

    _nextTrial() {
        if (!this.active) return;
        const sessionLength = Math.max(5, Number(this._ms().sessionLength) || DEFAULTS.sessionLength);
        if (this.total >= sessionLength) {
            this._showComplete();
            return;
        }
        this._clearTimers();
        stopAll();
        this.trial = generateMelodyTrial({ levelId: this.levelId });
        this.entered = [];
        this.replays = 0;
        this.ready = false;
        this.answered = false;
        this._renderTrial();
        this._playTrial();
    }

    _renderTrial() {
        const ms = this._ms();
        const buttons = this.trial.candidates.map((degree) => `
            <button class="restart-btn melody-degree" data-degree="${degree.id}" disabled
                aria-label="${degree.name}, ${degree.solfege}" style="min-width:72px;margin:4px">${this._label(degree)}</button>`).join('');
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt" id="melody-prompt">
                    <span class="challenge-text">Repeat the ${this.trial.sequence.length}-note call</span>
                    <div class="theory-desc" id="melody-status" aria-live="polite">Establishing the key…</div>
                    ${ms.humPrompt ? '<div class="theory-desc">Hum the call once before entering it.</div>' : ''}
                    <div class="seq-line" id="melody-entry" style="margin-top:10px">${this._entryMarkup()}</div>
                </div>
                <div id="melody-buttons" style="display:flex;flex-wrap:wrap;justify-content:center;margin:12px 0">${buttons}</div>
                <div style="display:flex;justify-content:center;gap:8px;margin-bottom:12px">
                    <button class="seq-skip" id="melody-back" disabled>Undo</button>
                    <button class="seq-skip" id="melody-submit" disabled>Check</button>
                </div>
                <div class="score-display">
                    <span class="score">${this.score}/${this.total}</span>
                    <span class="progress">${this.total + 1}/${Math.max(5, Number(ms.sessionLength) || DEFAULTS.sessionLength)}</span>
                </div>
                <button class="seq-skip" id="melody-replay">Replay</button>
                <button class="seq-skip" id="melody-exit">Levels</button>
            </div>`;
        this.container.querySelectorAll('.melody-degree').forEach((button) => {
            button.addEventListener('click', () => this._appendDegree(button.dataset.degree));
        });
        this.container.querySelector('#melody-back').addEventListener('click', () => {
            if (!this.ready || this.answered) return;
            this.entered.pop();
            this._updateEntry();
        });
        this.container.querySelector('#melody-submit').addEventListener('click', () => this._submit());
        this.container.querySelector('#melody-replay').addEventListener('click', () => {
            if (this.answered) return;
            this.replays++;
            this._playTrial();
        });
        this.container.querySelector('#melody-exit').addEventListener('click', () => this._showStart());
    }

    _entryMarkup() {
        return Array.from({ length: this.trial?.sequence.length || 0 }, (_, index) => {
            const degree = this.entered[index];
            return `<span class="seq-note ${degree ? 'seq-done' : ''}" style="min-width:42px;display:inline-block">${degree ? this._label(degree) : '—'}</span>`;
        }).join(' ');
    }

    _updateEntry() {
        const entry = this.container.querySelector('#melody-entry');
        if (entry) entry.innerHTML = this._entryMarkup();
        const back = this.container.querySelector('#melody-back');
        const submit = this.container.querySelector('#melody-submit');
        if (back) back.disabled = this.entered.length === 0;
        if (submit) submit.disabled = this.entered.length !== this.trial.sequence.length;
    }

    _playTrial() {
        this._clearTimers();
        stopAll();
        this.ready = false;
        this.container.querySelectorAll('.melody-degree').forEach((button) => { button.disabled = true; });
        const ac = getAudioContext();
        const start = ac.currentTime + 0.06;
        const clean = this._ms().cleanReference !== false;
        const contextTimbre = this.trial.context.style === 'scale' ? 'piano' : 'pad';
        playSequence(this.trial.context.events, { when: start, timbre: contextTimbre, clean, velocity: 0.3 });
        const melodyStart = start + this.trial.context.targetOffset;
        playSequence(this.trial.midis, { when: melodyStart, step: 0.52, duration: 0.43, timbre: this.trial.timbre, clean, velocity: 0.36 });
        const readyDelay = Math.ceil((this.trial.context.targetOffset + this.trial.midis.length * 0.52) * 1000);
        const status = this.container.querySelector('#melody-status');
        if (status) status.textContent = 'Listen to the complete call…';
        this._setTimer(() => {
            if (!this.active || this.answered) return;
            this.ready = true;
            this.answerStartedAt = performance.now();
            this.container.querySelectorAll('.melody-degree').forEach((button) => { button.disabled = false; });
            const liveStatus = this.container.querySelector('#melody-status');
            if (liveStatus) liveStatus.textContent = 'Enter the degrees in order.';
        }, readyDelay);
    }

    _appendDegree(degree) {
        if (!this.ready || this.answered || this.entered.length >= this.trial.sequence.length) return;
        this.entered.push(degree);
        this._updateEntry();
    }

    _submit() {
        if (!this.ready || this.answered || this.entered.length !== this.trial.sequence.length) return;
        this.answered = true;
        this.ready = false;
        const correct = this.entered.every((degree, index) => degree === this.trial.sequence[index]);
        const responseMs = Math.max(0, Math.round(performance.now() - this.answerStartedAt));
        this.total++;
        if (correct) this.score++;
        const targetKey = this.trial.sequence.join('-');
        const chosenKey = this.entered.join('-');
        this.progress = recordAuralAttempt(this.progress, {
            levelId: this.levelId,
            target: targetKey,
            chosen: chosenKey,
            correct,
            responseMs,
            replays: this.replays,
        });
        saveAuralProgress(this.progress);
        this.container.querySelectorAll('.melody-degree').forEach((button) => { button.disabled = true; });
        const prompt = this.container.querySelector('#melody-prompt');
        if (prompt) prompt.classList.add(correct ? 'result-correct' : 'result-wrong');
        const expected = this.trial.sequence.map((degree) => this._label(degree)).join(' → ');
        const status = this.container.querySelector('#melody-status');
        if (status) status.innerHTML = correct
            ? `<strong>Correct.</strong> ${expected}`
            : `The call was <strong>${expected}</strong>. Listen once more.`;
        this._playDiagnostic();
        const replay = this.container.querySelector('#melody-replay');
        if (replay) {
            replay.textContent = 'Next';
            replay.onclick = () => this._nextTrial();
        }
        this._setTimer(() => this._nextTrial(), correct ? 2300 : 3600);
    }

    _playDiagnostic() {
        stopAll();
        const ac = getAudioContext();
        playSequence(this.trial.midis, {
            when: ac.currentTime + 0.18,
            step: 0.68,
            duration: 0.58,
            timbre: 'piano',
            clean: true,
            velocity: 0.36,
        });
    }

    _showComplete() {
        this._clearTimers();
        stopAll();
        const percentage = this.total ? Math.round(this.score / this.total * 100) : 0;
        eventBus.emit('practice:complete', {
            skillId: this.slug,
            title: 'Melody memory',
            correct: this.score,
            total: this.total,
            minutes: 6,
            mastery: this.score / Math.max(1, this.total),
        });
        const summary = getLevelSummary(this.progress, this.levelId);
        const next = MELODY_LEVELS[MELODY_LEVELS.findIndex((level) => level.id === this.levelId) + 1];
        const nextUnlocked = next && isLevelUnlocked(this.progress, next.id, MELODY_LEVELS);
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="game-over">
                    <h2>${summary.mastered ? 'Level mastered' : 'Session complete'}</h2>
                    <div class="game-over-score">${this.score} / ${this.total} (${percentage}%)</div>
                    <div class="theory-desc">Lifetime level accuracy: ${Math.round(summary.accuracy * 100)}%${summary.stable ? ' · stable across days' : ''}</div>
                    ${nextUnlocked ? `<div class="theory-desc"><strong>${next.title}</strong> is now available.</div>` : ''}
                    <button class="restart-btn" id="melody-again">Practice again</button>
                    <button class="restart-btn" id="melody-levels" style="margin-top:8px">Choose level</button>
                </div>
            </div>`;
        this.container.querySelector('#melody-again').addEventListener('click', () => {
            this.score = 0;
            this.total = 0;
            this._nextTrial();
        });
        this.container.querySelector('#melody-levels').addEventListener('click', () => this._showStart());
    }

    onSettingsChanged() {
        if (this.active) this._showStart();
    }
}
