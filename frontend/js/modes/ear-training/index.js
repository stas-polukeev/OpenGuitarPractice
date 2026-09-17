import { ModeBase } from '../mode-base.js';
import { settings } from '../../services/settings.js';
import { eventBus } from '../../services/events.js';
import {
    EAR_LEVELS,
    buildResolutionSequence,
    degreeInfo,
    degreeToMidi,
    generateEarTrial,
    getLevelSummary,
    isLevelUnlocked,
    loadAuralProgress,
    recordAuralAttempt,
    saveAuralProgress,
} from '../../theory/ear-curriculum.js';
import {
    ensureAudio,
    getAudioContext,
    playPitch,
    playSequence,
    stopAll,
} from '../../services/audio.js';

const DEFAULTS = Object.freeze({
    levelId: EAR_LEVELS[0].id,
    sessionLength: 20,
    humPrompt: true,
    labels: 'degrees-solfege',
    freePractice: false,
    cleanReference: undefined,
});

export default class EarTrainingMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.progress = loadAuralProgress();
        this.trial = null;
        this.levelId = DEFAULTS.levelId;
        this.score = 0;
        this.total = 0;
        this.replays = 0;
        this.answered = false;
        this.answerReady = false;
        this.answerStartedAt = 0;
        this._lastDegree = null;
        this._timers = new Set();
    }

    async activate(container, fretboard) {
        super.activate(container, fretboard);
        this.container = container;
        this.progress = loadAuralProgress();
        const configured = this._ms().levelId;
        this.levelId = EAR_LEVELS.some((level) => level.id === configured) ? configured : DEFAULTS.levelId;
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
        return timer;
    }

    _clearTimers() {
        for (const timer of this._timers) clearTimeout(timer);
        this._timers.clear();
    }

    _showStart() {
        this._clearTimers();
        stopAll();
        const modeSettings = this._ms();
        const options = EAR_LEVELS.map((level, index) => {
            const summary = getLevelSummary(this.progress, level.id);
            const unlocked = modeSettings.freePractice || isLevelUnlocked(this.progress, level.id, EAR_LEVELS);
            const marker = summary.stable ? '✓' : summary.mastered ? '★' : `${Math.round(summary.accuracy * 100)}%`;
            return `<option value="${level.id}" ${level.id === this.levelId ? 'selected' : ''} ${unlocked ? '' : 'disabled'}>${index + 1}. ${level.title} — ${marker}${unlocked ? '' : ' 🔒'}</option>`;
        }).join('');

        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt">
                    <span class="challenge-text">Functional Ear Training</span>
                    <div class="theory-desc" style="margin-top:8px">Hear each note as a scale degree relative to home. The key changes, but its function does not.</div>
                </div>
                <div class="settings-group" style="margin:16px 0">
                    <label for="ear-level">Learning step</label>
                    <select id="ear-level">${options}</select>
                    <label style="display:flex;gap:8px;align-items:center;margin-top:10px">
                        <input type="checkbox" id="ear-free" ${modeSettings.freePractice ? 'checked' : ''}>
                        Free practice — choose any level
                    </label>
                </div>
                <button class="restart-btn" id="ear-start">Start listening</button>
            </div>`;

        this.container.querySelector('#ear-level').addEventListener('change', (event) => {
            this.levelId = event.target.value;
            settings.setMode(this.slug, 'levelId', this.levelId);
        });
        this.container.querySelector('#ear-free').addEventListener('change', (event) => {
            settings.setMode(this.slug, 'freePractice', event.target.checked);
            this._showStart();
        });
        this.container.querySelector('#ear-start').addEventListener('click', async () => {
            await ensureAudio();
            this.score = 0;
            this.total = 0;
            this._nextTrial();
        });
    }

    _label(degree) {
        const info = typeof degree === 'string' ? degreeInfo(degree) : degree;
        const style = this._ms().labels;
        if (style === 'solfege') return info.solfege;
        if (style === 'degrees') return info.display;
        return `${info.display} · ${info.solfege}`;
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
        this.answered = false;
        this.answerReady = false;
        this.replays = 0;
        this.trial = generateEarTrial({
            levelId: this.levelId,
            progress: this.progress,
            excludeDegree: this._lastDegree,
        });
        this._lastDegree = this.trial.targetDegree;
        this._renderTrial();
        this._playTrial();
    }

    _renderTrial() {
        const ms = this._ms();
        const answerButtons = this.trial.candidates.map((degree) => `
            <button class="restart-btn ear-answer" data-degree="${degree.id}" aria-label="${degree.name}, ${degree.solfege}" disabled
                style="min-width:72px;margin:4px">${this._label(degree)}</button>`).join('');
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="challenge-prompt" id="ear-prompt">
                    <span class="challenge-text">Which scale degree?</span>
                    <div class="theory-desc" id="ear-status" aria-live="polite">Establishing the key…</div>
                    ${ms.humPrompt ? '<div class="theory-desc">Hum the answer before you tap it.</div>' : ''}
                </div>
                <div style="display:flex;flex-wrap:wrap;justify-content:center;margin:12px 0" id="ear-answers">${answerButtons}</div>
                <div class="score-display">
                    <span class="score">${this.score}/${this.total}</span>
                    <span class="progress">${this.total + 1}/${Math.max(5, Number(ms.sessionLength) || DEFAULTS.sessionLength)}</span>
                </div>
                <button class="seq-skip" id="ear-replay" aria-label="Replay the same context and target">Replay</button>
                <button class="seq-skip" id="ear-exit">Levels</button>
            </div>`;
        this.container.querySelectorAll('.ear-answer').forEach((button) => {
            button.addEventListener('click', () => this._answer(button.dataset.degree));
        });
        this.container.querySelector('#ear-replay').addEventListener('click', () => {
            if (this.answered) return;
            this.replays++;
            this._playTrial();
        });
        this.container.querySelector('#ear-exit').addEventListener('click', () => this._showStart());
    }

    _playTrial() {
        this._clearTimers();
        stopAll();
        this.answerReady = false;
        const ac = getAudioContext();
        const start = ac.currentTime + 0.06;
        const ms = this._ms();
        const clean = typeof ms.cleanReference === 'boolean' ? ms.cleanReference : this.trial.clean;
        const contextTimbre = this.trial.context.style === 'scale' ? 'piano' : 'pad';
        playSequence(this.trial.context.events, { when: start, timbre: contextTimbre, clean, velocity: 0.32 });
        playPitch(this.trial.targetMidi, {
            when: start + this.trial.context.targetOffset,
            duration: 0.85,
            velocity: 0.38,
            timbre: this.trial.timbre,
            clean,
        });
        const readyDelay = Math.ceil((this.trial.context.targetOffset + 0.2) * 1000);
        const status = this.container.querySelector('#ear-status');
        if (status) status.textContent = 'Listen for the target…';
        this._setTimer(() => {
            if (!this.active || this.answered) return;
            this.answerReady = true;
            this.answerStartedAt = performance.now();
            this.container.querySelectorAll('.ear-answer').forEach((button) => { button.disabled = false; });
            const liveStatus = this.container.querySelector('#ear-status');
            if (liveStatus) liveStatus.textContent = 'Choose its function in the key.';
        }, readyDelay);
    }

    _answer(chosenDegree) {
        if (!this.answerReady || this.answered) return;
        this.answered = true;
        this.answerReady = false;
        const correct = chosenDegree === this.trial.targetDegree;
        const responseMs = Math.max(0, Math.round(performance.now() - this.answerStartedAt));
        this.total++;
        if (correct) this.score++;
        this.progress = recordAuralAttempt(this.progress, {
            levelId: this.levelId,
            targetDegree: this.trial.targetDegree,
            chosenDegree,
            correct,
            responseMs,
            replays: this.replays,
        });
        saveAuralProgress(this.progress);
        this.container.querySelectorAll('.ear-answer').forEach((button) => { button.disabled = true; });

        const expected = degreeInfo(this.trial.targetDegree);
        const chosen = degreeInfo(chosenDegree);
        const prompt = this.container.querySelector('#ear-prompt');
        if (prompt) prompt.classList.add(correct ? 'result-correct' : 'result-wrong');
        const status = this.container.querySelector('#ear-status');
        if (status) {
            status.innerHTML = correct
                ? `<strong>Correct: ${this._label(expected)}</strong> — ${expected.name}. Listen to where it wants to resolve.`
                : `You chose <strong>${this._label(chosen)}</strong>. The target was <strong>${this._label(expected)}</strong> — ${expected.name}.`;
        }

        this._playDiagnostic(chosenDegree, correct);
        const replay = this.container.querySelector('#ear-replay');
        if (replay) {
            replay.textContent = 'Next';
            replay.disabled = false;
            replay.onclick = () => this._nextTrial();
        }
        this._setTimer(() => this._nextTrial(), correct ? 2200 : 3200);
    }

    _playDiagnostic(chosenDegree, correct) {
        stopAll();
        const ac = getAudioContext();
        const start = ac.currentTime + 0.16;
        const resolution = buildResolutionSequence(this.trial);
        const events = [];
        if (!correct) events.push({ midi: degreeToMidi(this.trial.tonicMidi, chosenDegree), duration: 0.48 });
        events.push({ midi: this.trial.targetMidi, duration: 0.56 });
        if (resolution[1] !== resolution[0]) events.push({ midi: resolution[1], duration: 0.75 });
        playSequence(events, { when: start, step: 0.64, timbre: 'piano', clean: true, velocity: 0.34 });
    }

    _showComplete() {
        this._clearTimers();
        stopAll();
        const percentage = this.total ? Math.round(this.score / this.total * 100) : 0;
        eventBus.emit('practice:complete', {
            skillId: this.slug,
            title: 'Hear scale degrees',
            correct: this.score,
            total: this.total,
            minutes: 6,
            mastery: this.score / Math.max(1, this.total),
        });
        const summary = getLevelSummary(this.progress, this.levelId);
        const next = EAR_LEVELS[EAR_LEVELS.findIndex((level) => level.id === this.levelId) + 1];
        const nextUnlocked = next && isLevelUnlocked(this.progress, next.id, EAR_LEVELS);
        this.container.innerHTML = `
            <div class="find-note-ui">
                <div class="game-over">
                    <h2>${summary.mastered ? 'Level mastered' : 'Session complete'}</h2>
                    <div class="game-over-score">${this.score} / ${this.total} (${percentage}%)</div>
                    <div class="theory-desc">Lifetime level accuracy: ${Math.round(summary.accuracy * 100)}%${summary.stable ? ' · stable across days' : ''}</div>
                    ${nextUnlocked ? `<div class="theory-desc"><strong>${next.title}</strong> is now available.</div>` : ''}
                    <button class="restart-btn" id="ear-again">Practice again</button>
                    <button class="restart-btn" id="ear-levels" style="margin-top:8px">Choose level</button>
                </div>
            </div>`;
        this.container.querySelector('#ear-again').addEventListener('click', () => {
            this.score = 0;
            this.total = 0;
            this._nextTrial();
        });
        this.container.querySelector('#ear-levels').addEventListener('click', () => this._showStart());
    }

    onSettingsChanged() {
        if (this.active) this._showStart();
    }
}
