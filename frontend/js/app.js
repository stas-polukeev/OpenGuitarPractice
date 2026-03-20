import { FretboardSVG } from './components/fretboard-svg.js';
import { SettingsPanel } from './components/settings-panel.js';
import { settings } from './services/settings.js';
import { eventBus } from './services/events.js';
import { getMode, FRONTEND_MODES } from './modes/mode-registry.js';
import { setTone } from './services/audio.js';

let fretboard = null;
let settingsPanel = null;
let activeMode = null;
let activeTheory = null;

const PRACTICE_ITEMS = FRONTEND_MODES.filter(m => m.slug !== 'guitar-practice');
const THEORY_TOPICS = [
    { slug: 'intervals', name: 'Intervals' },
    { slug: 'minor-scale', name: 'Minor Scale' },
    { slug: 'major-scale', name: 'Major Scale' },
    { slug: 'minor-pentatonic', name: 'Minor Pentatonic' },
    { slug: 'major-pentatonic', name: 'Major Pentatonic' },
];

const THEORY_LOADERS = {
    'intervals': () => import('./pages/theory-intervals.js'),
    'minor-scale': async () => { const m = await import('./pages/theory-scales.js'); return { default: class extends m.default { constructor() { super('natural-minor'); } } }; },
    'major-scale': async () => { const m = await import('./pages/theory-scales.js'); return { default: class extends m.default { constructor() { super('natural-major'); } } }; },
    'minor-pentatonic': async () => { const m = await import('./pages/theory-scales.js'); return { default: class extends m.default { constructor() { super('minor-pentatonic'); } } }; },
    'major-pentatonic': async () => { const m = await import('./pages/theory-scales.js'); return { default: class extends m.default { constructor() { super('major-pentatonic'); } } }; },
};

// --- Layout ---

function computeDisplayFrets(minFret, maxFret) {
    let start = 0, end = 12;
    if (minFret >= 12) start = 12;
    if (maxFret > 12 || minFret >= 12) end = 24;
    return { start, end };
}

function applyOrientation() {
    document.body.dataset.orientation = settings.global.orientation || 'vertical';
}

function applyZoom() {
    const zoom = (settings.global.zoom ?? 100) / 100;
    document.getElementById('fretboard-container').style.setProperty('--fretboard-zoom', zoom);
}

function buildFretboardOptions() {
    const g = settings.global;
    const slug = activeMode?.slug;
    const ms = slug ? settings.getMode(slug) : {};
    const { start, end } = computeDisplayFrets(ms.minFret ?? 0, ms.maxFret ?? 12);
    return {
        tuning: g.tuning, notation: g.notation,
        showSharps: g.showSharps, showFlats: g.showFlats,
        horizontal: g.orientation === 'horizontal',
        stringLabels: g.stringLabels, showFretNumbers: g.showFretNumbers,
        soundEnabled: g.soundEnabled,
        displayStartFret: start, displayEndFret: end,
    };
}

function rebuildFretboard() {
    fretboard = new FretboardSVG(document.getElementById('fretboard-container'), buildFretboardOptions());
    return fretboard;
}

// --- Menu Navigation ---

function showMainMenu() {
    deactivateAll();
    const nav = document.getElementById('main-nav');
    nav.innerHTML = `
        <button class="menu-item" data-cat="practice">Practice</button>
        <button class="menu-item" data-cat="guitar-practice">Guitar Practice</button>
        <button class="menu-item" data-cat="theory">Theory</button>
    `;
    nav.querySelectorAll('.menu-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.cat;
            if (cat === 'guitar-practice') {
                activateExercise('guitar-practice');
                showBreadcrumb('Guitar Practice');
            } else {
                showSubmenu(cat);
            }
        });
    });
    document.getElementById('content-area').innerHTML = '';
    document.getElementById('fretboard-container').innerHTML = '';
}

function showSubmenu(category) {
    const nav = document.getElementById('main-nav');
    const items = category === 'practice' ? PRACTICE_ITEMS : THEORY_TOPICS;
    const label = category === 'practice' ? 'Practice' : 'Theory';

    nav.innerHTML = `
        <button class="menu-back">&larr; Back</button>
        <span class="menu-label">${label}</span>
        ${items.map(item =>
            `<button class="menu-item" data-slug="${item.slug}" data-type="${category}">${item.name}</button>`
        ).join('')}
    `;

    nav.querySelector('.menu-back').addEventListener('click', showMainMenu);
    nav.querySelectorAll('.menu-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const slug = btn.dataset.slug;
            if (btn.dataset.type === 'practice') {
                activateExercise(slug);
            } else {
                activateTheory(slug);
            }
            showBreadcrumb(btn.textContent);
        });
    });
    document.getElementById('content-area').innerHTML = '';
    document.getElementById('fretboard-container').innerHTML = '';
}

function showBreadcrumb(label) {
    const nav = document.getElementById('main-nav');
    nav.innerHTML = `
        <button class="menu-back">&larr; Menu</button>
        <span class="menu-current">${label}</span>
    `;
    nav.querySelector('.menu-back').addEventListener('click', showMainMenu);
}

// --- Activation ---

function deactivateAll() {
    if (activeMode) { activeMode.deactivate(); activeMode = null; }
    if (activeTheory) { activeTheory.deactivate(); activeTheory = null; }
    document.getElementById('content-area').innerHTML = '';
    if (fretboard) fretboard.clearHighlights();
}

async function activateExercise(slug) {
    deactivateAll();
    settingsPanel.showModeSettings(slug);
    fretboard = rebuildFretboard();
    const mode = await getMode(slug);
    activeMode = mode;
    await mode.activate(document.getElementById('content-area'), fretboard);
}

function switchToExercise(slug) {
    activateExercise(slug);
    showBreadcrumb(FRONTEND_MODES.find(m => m.slug === slug)?.name || slug);
}

async function activateTheory(slug) {
    deactivateAll();
    settingsPanel.clearModeSettings();
    fretboard = rebuildFretboard();
    const mod = await THEORY_LOADERS[slug]();
    const page = new mod.default();
    activeTheory = page;
    page.activate(document.getElementById('content-area'), fretboard, switchToExercise);
}

// --- Settings ---

function initSettingsToggle() {
    document.getElementById('settings-toggle').addEventListener('click', () => {
        document.getElementById('settings-drawer').classList.toggle('open');
    });
}

function onGlobalSettingsChanged({ key }) {
    applyOrientation();
    applyZoom();
    if (key === 'tone') setTone(settings.global.tone);
    if (fretboard) fretboard.updateSettings(buildFretboardOptions());
    if (activeMode) activeMode.onSettingsChanged(settings.global, settings.getMode(activeMode.slug));
    if (activeTheory) {
        activeTheory.deactivate();
        activeTheory.activate(document.getElementById('content-area'), fretboard, switchToExercise);
    }
}

function onModeSettingsChanged({ slug }) {
    if (activeMode && activeMode.slug === slug) {
        if (fretboard) fretboard.updateSettings(buildFretboardOptions());
        activeMode.onSettingsChanged(settings.global, settings.getMode(slug));
    }
}

// --- Init ---

async function init() {
    applyOrientation();
    applyZoom();
    setTone(settings.global.tone || 'mellow');
    settingsPanel = new SettingsPanel(document.getElementById('settings-drawer'));
    initSettingsToggle();
    eventBus.on('settings:global', onGlobalSettingsChanged);
    eventBus.on('settings:mode', onModeSettingsChanged);
    showMainMenu();
}

document.addEventListener('DOMContentLoaded', init);
