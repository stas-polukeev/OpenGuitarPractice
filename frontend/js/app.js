import { FretboardSVG } from './components/fretboard-svg.js';
import { SettingsPanel } from './components/settings-panel.js';
import { settings } from './services/settings.js';
import { eventBus } from './services/events.js';
import { getMode } from './modes/mode-registry.js';
import { setTone } from './services/audio.js';
import { getProfile, getRecommendedSkill, recordSession } from './services/progress.js';

let fretboard = null;
let settingsPanel = null;
let activeMode = null;
let activeTheory = null;
let activeTab = 'today';
let previousTab = 'today';

export const PRACTICE_CATALOG = [
    { slug: 'find-the-note', title: 'Find the note', eyebrow: 'Fretboard', description: 'Locate a prompted note on the selected strings.', icon: '◎', path: 'fretboard', surface: 'fretboard', level: 'Start here' },
    { slug: 'string-practice', title: 'One-string notes', eyebrow: 'Fretboard', description: 'Build a reliable map of one string at a time.', icon: '━', path: 'fretboard', surface: 'fretboard', level: 'Foundation' },
    { slug: 'find-all-notes', title: 'Find every note', eyebrow: 'Fretboard', description: 'Mark every occurrence inside the visible neck range.', icon: '⌖', path: 'fretboard', surface: 'fretboard', level: 'Recall' },
    { slug: 'interval-training', title: 'Intervals', eyebrow: 'Fretboard', description: 'Find interval shapes from a moving root.', icon: '↗', path: 'fretboard', surface: 'fretboard', level: 'Connect' },
    { slug: 'degree-finder', title: 'Scale degrees', eyebrow: 'Fretboard', description: 'Find roots, chord tones and color degrees in any mode.', icon: '②', path: 'fretboard', surface: 'fretboard', level: 'Apply' },
    { slug: 'scale-sequence', title: 'Scale journeys', eyebrow: 'Scales', description: 'Practice 3NPS and one-string modes in sequences and intervals.', icon: '≋', path: 'scales', surface: 'fretboard', level: 'Guided' },
    { slug: 'scale-practice', title: 'Position recall', eyebrow: 'Scales', description: 'Walk an existing scale position note by note.', icon: '◇', path: 'scales', surface: 'fretboard', level: 'Review' },
    { slug: 'chord-practice', title: 'Build chords', eyebrow: 'Harmony', description: 'Learn formulas, diatonic function and guitar shapes.', icon: '△', path: 'chords', surface: 'standalone', level: 'Theory + play' },
    { slug: 'ear-training', title: 'Hear scale degrees', eyebrow: 'Ear', description: 'Anchor the tonic, then learn each note by function.', icon: '◉', path: 'ear', surface: 'standalone', level: 'Priority' },
    { slug: 'melody-memory', title: 'Melody memory', eyebrow: 'Ear', description: 'Recognize contours, two-note calls and short phrases.', icon: '⌁', path: 'ear', surface: 'standalone', level: 'Progressive' },
    { slug: 'rhythm-lab', title: 'Rhythm lab', eyebrow: 'Rhythm', description: 'Hear, build and replay rock and metal drum patterns.', icon: '▦', path: 'rhythm', surface: 'standalone', level: 'Hands-on' },
    { slug: 'piano', title: 'Free piano', eyebrow: 'Explore', description: 'A movable two-octave keyboard for checking notes and ideas.', icon: '▥', path: 'tools', surface: 'standalone', level: 'Free play' },
];

const PATHS = [
    { id: 'fretboard', title: 'Know the neck', copy: 'Notes, intervals and scale degrees', icon: '⌖', accent: 'mint' },
    { id: 'scales', title: 'Understand scales', copy: 'Modes, 3NPS and musical sequences', icon: '≋', accent: 'violet' },
    { id: 'chords', title: 'Build harmony', copy: 'Shapes, qualities and diatonic function', icon: '△', accent: 'amber' },
    { id: 'ear', title: 'Train your ear', copy: 'Degrees, tendencies and melody memory', icon: '◉', accent: 'rose' },
    { id: 'rhythm', title: 'Own the groove', copy: 'Rock and metal beats from the ground up', icon: '▦', accent: 'blue' },
];

const THEORY_CATALOG = [
    { slug: 'theory-curriculum', title: 'Modes & chords', description: 'Seven modes, degree alterations, diatonic chords and guitar forms.', icon: '◫' },
    { slug: 'notes-on-fretboard', title: 'Notes on the neck', description: 'See how pitch repeats across strings and octaves.', icon: '⌖' },
    { slug: 'intervals', title: 'Intervals', description: 'Names, sounds and fretboard geometry.', icon: '↗' },
    { slug: 'chords', title: 'Diatonic harmony', description: 'Build the chords of major and natural minor.', icon: '△' },
    { slug: 'circle-of-fifths', title: 'Circle of fifths', description: 'Keys, relatives and neighboring tonal centers.', icon: '○' },
    { slug: 'major-scale', title: 'Major scale', description: 'Positions, formula and applications.', icon: '☀' },
    { slug: 'minor-scale', title: 'Natural minor', description: 'Aeolian positions, formula and harmony.', icon: '☾' },
    { slug: 'minor-pentatonic', title: 'Minor pentatonic', description: 'Five connected guitar positions.', icon: '⬟' },
    { slug: 'major-pentatonic', title: 'Major pentatonic', description: 'Relative major shapes and sound.', icon: '⬠' },
];

const THEORY_LOADERS = {
    'theory-curriculum': () => import('./pages/theory-curriculum.js'),
    'notes-on-fretboard': () => import('./pages/theory-notes.js'),
    intervals: () => import('./pages/theory-intervals.js'),
    chords: () => import('./pages/theory-chords.js'),
    'circle-of-fifths': () => import('./pages/theory-circle.js'),
    'minor-scale': async () => { const m = await import('./pages/theory-scales.js'); return { default: class extends m.default { constructor() { super('natural-minor'); } } }; },
    'major-scale': async () => { const m = await import('./pages/theory-scales.js'); return { default: class extends m.default { constructor() { super('natural-major'); } } }; },
    'minor-pentatonic': async () => { const m = await import('./pages/theory-scales.js'); return { default: class extends m.default { constructor() { super('minor-pentatonic'); } } }; },
    'major-pentatonic': async () => { const m = await import('./pages/theory-scales.js'); return { default: class extends m.default { constructor() { super('major-pentatonic'); } } }; },
};

function computeDisplayFrets(minFret, maxFret) {
    if (minFret >= 12) return { start: 12, end: 24 };
    return { start: 0, end: maxFret > 12 ? 24 : 12 };
}

function applyOrientation() {
    document.body.dataset.orientation = settings.global.orientation || 'vertical';
}

function applyZoom() {
    const zoom = (settings.global.zoom ?? 100) / 100;
    document.getElementById('fretboard-container').style.setProperty('--fretboard-zoom', zoom);
}

function buildFretboardOptions() {
    const global = settings.global;
    const slug = activeMode?.slug;
    const mode = slug ? settings.getMode(slug) : {};
    const { start, end } = computeDisplayFrets(mode.minFret ?? 0, mode.maxFret ?? 12);
    return {
        tuning: global.tuning,
        notation: global.notation,
        showSharps: global.showSharps,
        showFlats: global.showFlats,
        horizontal: global.orientation === 'horizontal',
        stringLabels: global.stringLabels,
        showFretNumbers: global.showFretNumbers,
        soundEnabled: global.soundEnabled,
        displayStartFret: start,
        displayEndFret: end,
    };
}

function rebuildFretboard() {
    const container = document.getElementById('fretboard-container');
    container.hidden = false;
    fretboard = new FretboardSVG(container, buildFretboardOptions());
    return fretboard;
}

function clearSurface() {
    document.getElementById('content-area').innerHTML = '';
    const board = document.getElementById('fretboard-container');
    board.innerHTML = '';
    board.hidden = true;
}

function deactivateAll() {
    if (activeMode) { activeMode.deactivate(); activeMode = null; }
    if (activeTheory) { activeTheory.deactivate(); activeTheory = null; }
    clearSurface();
}

function setBottomTab(tab) {
    document.querySelectorAll('.tab-button').forEach(button => {
        const active = button.dataset.tab === tab;
        button.classList.toggle('active', active);
        button.setAttribute('aria-current', active ? 'page' : 'false');
    });
}

function bindCards(container = document) {
    container.querySelectorAll('[data-practice]').forEach(button => button.addEventListener('click', () => activateExercise(button.dataset.practice)));
    container.querySelectorAll('[data-theory]').forEach(button => button.addEventListener('click', () => activateTheory(button.dataset.theory)));
    container.querySelectorAll('[data-path]').forEach(button => button.addEventListener('click', () => renderPractice(button.dataset.path)));
}

function cardMarkup(item, compact = false) {
    const mastery = getProfile().skills[item.slug]?.mastery ?? 0;
    return `<button class="practice-card ${compact ? 'compact' : ''}" data-practice="${item.slug}">
        <span class="card-icon" aria-hidden="true">${item.icon}</span>
        <span class="card-copy"><span class="card-eyebrow">${item.eyebrow} · ${item.level}</span><strong>${item.title}</strong><span>${item.description}</span>${mastery > 0 ? `<span class="mastery-track" aria-label="${Math.round(mastery * 100)} percent mastery"><i style="width:${Math.round(mastery * 100)}%"></i></span>` : ''}</span>
        <span class="card-arrow" aria-hidden="true">›</span>
    </button>`;
}

function showTab(tab) {
    previousTab = tab;
    activeTab = tab;
    deactivateAll();
    document.getElementById('main-nav').innerHTML = '';
    setBottomTab(tab);
    if (tab === 'practice') renderPractice();
    else if (tab === 'learn') renderLearn();
    else if (tab === 'progress') renderProgress();
    else renderToday();
}

function renderToday() {
    const profile = getProfile();
    const recommended = getRecommendedSkill(PRACTICE_CATALOG.filter(item => item.slug !== 'piano')) || PRACTICE_CATALOG[0];
    const content = document.getElementById('content-area');
    content.innerHTML = `<section class="dashboard" aria-labelledby="today-heading">
        <div class="hero-card"><div><span class="hero-kicker">TODAY'S SESSION</span><h2 id="today-heading">Small steps. Real musicianship.</h2><p>Train your ear, map the neck, then connect both through scales and rhythm.</p></div><div class="hero-stats" aria-label="Practice summary"><span><strong>${profile.streak}</strong> day streak</span><span><strong>${profile.xp}</strong> XP</span><span><strong>Lv ${profile.level}</strong></span></div></div>
        <section class="section-block"><div class="section-heading"><div><span class="section-kicker">RECOMMENDED</span><h3>Continue learning</h3></div><span class="time-pill">≈ 5 min</span></div>${cardMarkup(recommended)}</section>
        <section class="section-block"><div class="section-heading"><div><span class="section-kicker">YOUR PATHS</span><h3>Choose what to improve</h3></div></div><div class="path-grid">${PATHS.map(path => `<button class="path-card ${path.accent}" data-path="${path.id}"><span class="path-icon" aria-hidden="true">${path.icon}</span><strong>${path.title}</strong><span>${path.copy}</span></button>`).join('')}</div></section>
        <section class="section-block"><div class="section-heading"><div><span class="section-kicker">QUICK PLAY</span><h3>Explore without a lesson</h3></div></div>${cardMarkup(PRACTICE_CATALOG.find(item => item.slug === 'piano'), true)}</section>
    </section>`;
    bindCards(content);
}

function renderPractice(path = null) {
    activeTab = 'practice';
    setBottomTab('practice');
    deactivateAll();
    const content = document.getElementById('content-area');
    const groups = path ? PATHS.filter(item => item.id === path) : PATHS;
    content.innerHTML = `<section class="catalog-page"><div class="page-title"><span class="section-kicker">PRACTICE LIBRARY</span><h2>${path ? groups[0]?.title : 'Choose your practice'}</h2><p>Every exercise stays available. The suggested path only helps decide what to do next.</p></div>${groups.map(group => { const items = PRACTICE_CATALOG.filter(item => item.path === group.id); return items.length ? `<section class="catalog-group"><h3><span>${group.icon}</span>${group.title}</h3><div class="card-list">${items.map(item => cardMarkup(item)).join('')}</div></section>` : ''; }).join('')}${path ? '<button class="text-button" id="show-all-practice">Show all practice</button>' : `<section class="catalog-group"><h3><span>▥</span>Tools</h3><div class="card-list">${PRACTICE_CATALOG.filter(item => item.path === 'tools').map(item => cardMarkup(item)).join('')}</div></section>`}</section>`;
    bindCards(content);
    content.querySelector('#show-all-practice')?.addEventListener('click', () => renderPractice());
}

function renderLearn() {
    activeTab = 'learn';
    setBottomTab('learn');
    deactivateAll();
    const content = document.getElementById('content-area');
    content.innerHTML = `<section class="catalog-page"><div class="page-title"><span class="section-kicker">LEARN</span><h2>Understand what you play</h2><p>Short references, generated guitar diagrams and direct links into practice.</p></div><div class="theory-grid">${THEORY_CATALOG.map(item => `<button class="theory-card" data-theory="${item.slug}"><span aria-hidden="true">${item.icon}</span><strong>${item.title}</strong><small>${item.description}</small></button>`).join('')}</div></section>`;
    bindCards(content);
}

function renderProgress() {
    activeTab = 'progress';
    setBottomTab('progress');
    deactivateAll();
    const profile = getProfile();
    const skills = Object.entries(profile.skills).sort((a, b) => (b[1].lastPracticed || '').localeCompare(a[1].lastPracticed || ''));
    const content = document.getElementById('content-area');
    content.innerHTML = `<section class="catalog-page progress-page"><div class="page-title"><span class="section-kicker">PROGRESS</span><h2>Level ${profile.level}</h2><p>XP reflects deliberate practice. Mastery reflects accurate, retained skill.</p></div><div class="progress-hero"><div><strong>${profile.xp}</strong><span>total XP</span></div><div><strong>${profile.streak}</strong><span>day streak</span></div><div><strong>${Math.round(profile.totalMinutes)}</strong><span>minutes</span></div></div><div class="level-track"><i style="width:${Math.round(profile.levelProgress * 100)}%"></i></div><section class="section-block"><div class="section-heading"><div><span class="section-kicker">SKILLS</span><h3>Your mastery map</h3></div></div><div class="mastery-list">${skills.length ? skills.map(([id, skill]) => `<div class="mastery-row"><div><strong>${skill.title || id}</strong><span>${skill.sessions} sessions · ${skill.attempts} attempts</span></div><div class="mastery-percent">${Math.round((skill.mastery || 0) * 100)}%</div><span class="mastery-track"><i style="width:${Math.round((skill.mastery || 0) * 100)}%"></i></span></div>`).join('') : '<div class="empty-state">Finish an exercise and your mastery map will grow here.</div>'}</div></section></section>`;
}

function showBreadcrumb(label) {
    const nav = document.getElementById('main-nav');
    nav.innerHTML = `<button class="menu-back" aria-label="Back">‹</button><span class="menu-current">${label}</span>`;
    nav.querySelector('.menu-back').addEventListener('click', () => showTab(previousTab));
}

async function activateExercise(slug) {
    const item = PRACTICE_CATALOG.find(entry => entry.slug === slug);
    if (!item) return;
    previousTab = activeTab === 'learn' || activeTab === 'progress' ? 'practice' : activeTab;
    deactivateAll();
    settingsPanel.showModeSettings(slug);
    const board = item.surface === 'fretboard' ? rebuildFretboard() : null;
    const mode = await getMode(slug);
    activeMode = mode;
    await mode.activate(document.getElementById('content-area'), board);
    showBreadcrumb(item.title);
}

function switchToExercise(slug) {
    activeTab = 'practice';
    activateExercise(slug);
}

async function activateTheory(slug) {
    const item = THEORY_CATALOG.find(entry => entry.slug === slug);
    if (!item) return;
    previousTab = 'learn';
    deactivateAll();
    settingsPanel.clearModeSettings();
    const board = rebuildFretboard();
    const mod = await THEORY_LOADERS[slug]();
    activeTheory = new mod.default();
    activeTheory.activate(document.getElementById('content-area'), board, switchToExercise);
    showBreadcrumb(item.title);
}

function initNavigation() {
    document.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
}

function initSettingsToggle() {
    const drawer = document.getElementById('settings-drawer');
    const toggle = document.getElementById('settings-toggle');
    const backdrop = document.getElementById('settings-backdrop');
    const close = () => { drawer.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => { const open = drawer.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
}

function onGlobalSettingsChanged({ key }) {
    applyOrientation();
    applyZoom();
    if (key === 'tone') setTone(settings.global.tone);
    if (key === 'distortionEnabled' || key === 'distortionAmount' || key === 'masterVolume') {
        import('./services/audio.js').then(audio => {
            audio.setDrive?.(settings.global.distortionEnabled, settings.global.distortionAmount);
            audio.setMasterVolume?.(settings.global.masterVolume ?? 0.8);
        });
    }
    if (fretboard) fretboard.updateSettings(buildFretboardOptions());
    activeMode?.onSettingsChanged(settings.global, settings.getMode(activeMode.slug));
    if (activeTheory) {
        activeTheory.deactivate();
        activeTheory.activate(document.getElementById('content-area'), fretboard, switchToExercise);
    }
}

function onModeSettingsChanged({ slug }) {
    if (activeMode?.slug === slug) {
        fretboard?.updateSettings(buildFretboardOptions());
        activeMode.onSettingsChanged(settings.global, settings.getMode(slug));
    }
}

async function init() {
    applyOrientation();
    applyZoom();
    setTone(settings.global.tone || 'mellow');
    const audio = await import('./services/audio.js');
    audio.setDrive(settings.global.distortionEnabled, settings.global.distortionAmount ?? 35);
    audio.setMasterVolume(settings.global.masterVolume ?? 80);
    settingsPanel = new SettingsPanel(document.getElementById('settings-drawer'));
    initSettingsToggle();
    initNavigation();
    eventBus.on('settings:global', onGlobalSettingsChanged);
    eventBus.on('settings:mode', onModeSettingsChanged);
    eventBus.on('practice:complete', detail => { recordSession(detail); if (activeTab === 'progress') renderProgress(); });
    showTab('today');
}

document.addEventListener('DOMContentLoaded', init);
