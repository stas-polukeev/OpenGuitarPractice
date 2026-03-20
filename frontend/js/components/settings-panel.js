import { settings } from '../services/settings.js';
import { NOTATION_SYSTEMS } from '../theory/notes.js';
import { TUNINGS } from '../theory/tunings.js';
import { SCALES, getScalePositions } from '../theory/scales.js';
import { getTuning } from '../theory/tunings.js';

export class SettingsPanel {
    constructor(container) {
        this.container = container;
        this.modeSlug = null;
        this.render();
    }

    render() {
        const g = settings.global;
        this.container.innerHTML = `
            <div class="settings-panel">
                <h3>Settings</h3>

                <div class="settings-group">
                    <label for="s-notation">Notation</label>
                    <select id="s-notation">
                        ${Object.entries(NOTATION_SYSTEMS).map(([k, v]) =>
                            `<option value="${k}" ${k === g.notation ? 'selected' : ''}>${v.label}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="settings-group">
                    <label for="s-tuning">Tuning</label>
                    <select id="s-tuning">
                        ${Object.entries(TUNINGS).map(([k, v]) =>
                            `<option value="${k}" ${k === g.tuning ? 'selected' : ''}>${v.name}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="settings-group">
                    <label><input type="checkbox" id="s-sharps" ${g.showSharps ? 'checked' : ''}> Include sharps (#)</label>
                </div>
                <div class="settings-group">
                    <label><input type="checkbox" id="s-flats" ${g.showFlats ? 'checked' : ''}> Include flats (b)</label>
                </div>

                <div class="settings-group">
                    <label for="s-orientation">Orientation</label>
                    <select id="s-orientation">
                        <option value="vertical" ${g.orientation === 'vertical' ? 'selected' : ''}>Vertical</option>
                        <option value="horizontal" ${g.orientation === 'horizontal' ? 'selected' : ''}>Horizontal</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label for="s-labels">String labels</label>
                    <select id="s-labels">
                        <option value="notes" ${g.stringLabels === 'notes' ? 'selected' : ''}>Note names</option>
                        <option value="numbers" ${g.stringLabels === 'numbers' ? 'selected' : ''}>Numbers (1-6)</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label><input type="checkbox" id="s-fretnums" ${g.showFretNumbers ? 'checked' : ''}> Show fret numbers</label>
                </div>

                <div class="settings-group">
                    <label><input type="checkbox" id="s-sound" ${g.soundEnabled ? 'checked' : ''}> Sound</label>
                </div>

                <div class="settings-group" id="s-tone-group" style="${g.soundEnabled ? '' : 'display:none'}">
                    <label for="s-tone">Tone</label>
                    <select id="s-tone">
                        <option value="mellow" ${(g.tone || 'mellow') === 'mellow' ? 'selected' : ''}>Mellow</option>
                        <option value="bright" ${g.tone === 'bright' ? 'selected' : ''}>Bright</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label for="s-zoom">Zoom: <span id="s-zoom-val">${g.zoom ?? 100}%</span></label>
                    <input type="range" id="s-zoom" min="40" max="150" step="5" value="${g.zoom ?? 100}">
                </div>

                <div id="mode-settings"></div>
            </div>
        `;

        this._bind('s-notation', 'change', (e) => settings.setGlobal('notation', e.target.value));
        this._bind('s-tuning', 'change', (e) => settings.setGlobal('tuning', e.target.value));
        this._bind('s-sharps', 'change', (e) => settings.setGlobal('showSharps', e.target.checked));
        this._bind('s-flats', 'change', (e) => settings.setGlobal('showFlats', e.target.checked));
        this._bind('s-orientation', 'change', (e) => settings.setGlobal('orientation', e.target.value));
        this._bind('s-labels', 'change', (e) => settings.setGlobal('stringLabels', e.target.value));
        this._bind('s-fretnums', 'change', (e) => settings.setGlobal('showFretNumbers', e.target.checked));
        this._bind('s-sound', 'change', (e) => {
            settings.setGlobal('soundEnabled', e.target.checked);
            const toneGroup = this.container.querySelector('#s-tone-group');
            if (toneGroup) toneGroup.style.display = e.target.checked ? '' : 'none';
        });
        this._bind('s-tone', 'change', (e) => settings.setGlobal('tone', e.target.value));
        this._bind('s-zoom', 'input', (e) => {
            const val = parseInt(e.target.value);
            const label = this.container.querySelector('#s-zoom-val');
            if (label) label.textContent = val + '%';
            settings.setGlobal('zoom', val);
        });
    }

    _bind(id, evt, fn) {
        const el = this.container.querySelector('#' + id);
        if (el) el.addEventListener(evt, fn);
    }

    showModeSettings(slug) {
        this.modeSlug = slug;
        const mc = this.container.querySelector('#mode-settings');
        if (!mc) return;

        if (slug === 'find-the-note') {
            const ms = settings.getMode(slug);
            mc.innerHTML = `
                <h4>Find the Note</h4>
                <div class="settings-group">
                    <label for="sm-min">Min fret</label>
                    <input type="number" id="sm-min" min="0" max="24" value="${ms.minFret}">
                </div>
                <div class="settings-group">
                    <label for="sm-max">Max fret</label>
                    <input type="number" id="sm-max" min="0" max="24" value="${ms.maxFret}">
                </div>
                <div class="settings-group">
                    <label for="sm-notes">Notes per game</label>
                    <input type="number" id="sm-notes" min="1" max="100" value="${ms.notesPerGame}">
                </div>
                <div class="settings-group">
                    <label><input type="checkbox" id="sm-timer" ${ms.timerEnabled ? 'checked' : ''}> Timer</label>
                </div>
                <div class="settings-group" id="sm-timer-sec-group" style="${ms.timerEnabled ? '' : 'display:none'}">
                    <label for="sm-timer-sec">Seconds per note</label>
                    <input type="number" id="sm-timer-sec" min="1" max="60" value="${ms.timerSeconds}">
                </div>
            `;

            this._bind('sm-min', 'change', (e) => settings.setMode(slug, 'minFret', parseInt(e.target.value, 10)));
            this._bind('sm-max', 'change', (e) => settings.setMode(slug, 'maxFret', parseInt(e.target.value, 10)));
            this._bind('sm-notes', 'change', (e) => settings.setMode(slug, 'notesPerGame', parseInt(e.target.value, 10)));
            this._bind('sm-timer', 'change', (e) => {
                settings.setMode(slug, 'timerEnabled', e.target.checked);
                const secGroup = mc.querySelector('#sm-timer-sec-group');
                if (secGroup) secGroup.style.display = e.target.checked ? '' : 'none';
            });
            this._bind('sm-timer-sec', 'change', (e) => settings.setMode(slug, 'timerSeconds', parseInt(e.target.value, 10)));
        } else if (slug === 'guitar-practice') {
            const ms = settings.getMode(slug);
            const mode = ms.practiceMode || 'random';
            mc.innerHTML = `
                <h4>Guitar Practice</h4>
                <div class="settings-group">
                    <label for="sm-mode">Mode</label>
                    <select id="sm-mode">
                        <option value="random" ${mode === 'random' ? 'selected' : ''}>Random Notes</option>
                        <option value="scale" ${mode === 'scale' ? 'selected' : ''}>Scale</option>
                    </select>
                </div>
                <div id="sm-scale-opts" style="${mode === 'scale' ? '' : 'display:none'}">
                    <div class="settings-group">
                        <label for="sm-scale">Scale</label>
                        <select id="sm-scale">
                            <option value="minor-pentatonic" ${(ms.scaleKey || 'minor-pentatonic') === 'minor-pentatonic' ? 'selected' : ''}>Minor Pentatonic</option>
                            <option value="major-pentatonic" ${ms.scaleKey === 'major-pentatonic' ? 'selected' : ''}>Major Pentatonic</option>
                            <option value="natural-minor" ${ms.scaleKey === 'natural-minor' ? 'selected' : ''}>Natural Minor</option>
                            <option value="natural-major" ${ms.scaleKey === 'natural-major' ? 'selected' : ''}>Natural Major</option>
                        </select>
                    </div>
                    <div class="settings-group">
                        <label for="sm-step">Interval step (1=sequential)</label>
                        <input type="number" id="sm-step" min="1" max="7" value="${ms.scaleStep ?? 1}">
                    </div>
                </div>
                <div class="settings-group">
                    <label for="sm-min">Min fret</label>
                    <input type="number" id="sm-min" min="0" max="24" value="${ms.minFret ?? 0}">
                </div>
                <div class="settings-group">
                    <label for="sm-max">Max fret</label>
                    <input type="number" id="sm-max" min="0" max="24" value="${ms.maxFret ?? 12}">
                </div>
                <div class="settings-group">
                    <label for="sm-notetime">Seconds per note</label>
                    <input type="number" id="sm-notetime" min="1" max="30" value="${ms.noteTime ?? 5}">
                </div>
                <div class="settings-group">
                    <label for="sm-count">Notes per session</label>
                    <input type="number" id="sm-count" min="1" max="100" value="${ms.notesPerSession ?? 20}">
                </div>`;
            this._bind('sm-mode', 'change', (e) => {
                settings.setMode(slug, 'practiceMode', e.target.value);
                mc.querySelector('#sm-scale-opts').style.display = e.target.value === 'scale' ? '' : 'none';
            });
            this._bind('sm-scale', 'change', (e) => settings.setMode(slug, 'scaleKey', e.target.value));
            this._bind('sm-step', 'change', (e) => settings.setMode(slug, 'scaleStep', parseInt(e.target.value, 10)));
            this._bind('sm-min', 'change', (e) => settings.setMode(slug, 'minFret', parseInt(e.target.value, 10)));
            this._bind('sm-max', 'change', (e) => settings.setMode(slug, 'maxFret', parseInt(e.target.value, 10)));
            this._bind('sm-notetime', 'change', (e) => settings.setMode(slug, 'noteTime', parseInt(e.target.value, 10)));
            this._bind('sm-count', 'change', (e) => settings.setMode(slug, 'notesPerSession', parseInt(e.target.value, 10)));

        } else if (slug === 'scale-practice') {
            const ms = settings.getMode(slug);
            const g = settings.global;
            const notes = NOTATION_SYSTEMS[g.notation || 'english'].sharps;
            const scaleKey = ms.scaleKey || 'minor-pentatonic';
            const root = ms.scaleRoot ?? 9;
            const tuning = getTuning(g.tuning);
            const positions = getScalePositions(root, scaleKey, tuning, 24);

            mc.innerHTML = `
                <h4>Scale Practice</h4>
                <div class="settings-group">
                    <label for="sm-scale">Scale</label>
                    <select id="sm-scale">
                        ${Object.entries(SCALES).map(([k, v]) =>
                            `<option value="${k}" ${k === scaleKey ? 'selected' : ''}>${v.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="settings-group">
                    <label for="sm-root">Root</label>
                    <select id="sm-root">
                        ${notes.map((n, i) => `<option value="${i}" ${i === root ? 'selected' : ''}>${n}</option>`).join('')}
                    </select>
                </div>
                <div class="settings-group">
                    <label for="sm-pos">Position</label>
                    <select id="sm-pos">
                        ${positions.map(p =>
                            `<option value="${p.index}" ${p.index === (ms.position ?? 1) ? 'selected' : ''}>Pos ${p.index} (frets ${p.minFret}-${p.maxFret})</option>`
                        ).join('')}
                    </select>
                </div>`;
            this._bind('sm-scale', 'change', (e) => settings.setMode(slug, 'scaleKey', e.target.value));
            this._bind('sm-root', 'change', (e) => settings.setMode(slug, 'scaleRoot', parseInt(e.target.value, 10)));
            this._bind('sm-pos', 'change', (e) => settings.setMode(slug, 'position', parseInt(e.target.value, 10)));

        } else if (slug === 'interval-training') {
            const ms = settings.getMode(slug);
            mc.innerHTML = `
                <h4>Interval Training</h4>
                <div class="settings-group">
                    <label for="sm-min">Min fret</label>
                    <input type="number" id="sm-min" min="0" max="24" value="${ms.minFret ?? 0}">
                </div>
                <div class="settings-group">
                    <label for="sm-max">Max fret</label>
                    <input type="number" id="sm-max" min="0" max="24" value="${ms.maxFret ?? 12}">
                </div>
                <div class="settings-group">
                    <label for="sm-semi">Max interval (semitones)</label>
                    <input type="number" id="sm-semi" min="1" max="19" value="${ms.maxSemitones ?? 12}">
                </div>
                <div class="settings-group">
                    <label for="sm-notes">Notes per game</label>
                    <input type="number" id="sm-notes" min="1" max="100" value="${ms.notesPerGame ?? 10}">
                </div>`;
            this._bind('sm-min', 'change', (e) => settings.setMode(slug, 'minFret', parseInt(e.target.value, 10)));
            this._bind('sm-max', 'change', (e) => settings.setMode(slug, 'maxFret', parseInt(e.target.value, 10)));
            this._bind('sm-semi', 'change', (e) => settings.setMode(slug, 'maxSemitones', parseInt(e.target.value, 10)));
            this._bind('sm-notes', 'change', (e) => settings.setMode(slug, 'notesPerGame', parseInt(e.target.value, 10)));
        } else {
            mc.innerHTML = '';
        }
    }

    clearModeSettings() {
        this.modeSlug = null;
        const mc = this.container.querySelector('#mode-settings');
        if (mc) mc.innerHTML = '';
    }
}
