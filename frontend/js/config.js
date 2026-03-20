export const API_BASE = '/api';

export const DEFAULT_SETTINGS = {
    global: {
        notation: 'english',
        tuning: 'standard',
        showSharps: false,
        showFlats: false,
        orientation: 'vertical',
        stringLabels: 'notes',
        showFretNumbers: true,
        soundEnabled: true,
        tone: 'mellow', // 'mellow' or 'bright'
        zoom: 100, // percent
    },
    'find-the-note': {
        minFret: 0,
        maxFret: 12,
        notesPerGame: 10,
        timerEnabled: false,
        timerSeconds: 5,
    },
    'guitar-practice': {
        minFret: 0,
        maxFret: 12,
        noteTime: 5,
        notesPerSession: 20,
        practiceMode: 'random',
        scaleKey: 'minor-pentatonic',
        scaleRoot: 9,
        scaleStep: 1,
    },
    'scale-practice': {
        scaleKey: 'minor-pentatonic',
        scaleRoot: 9,
        position: 1,
    },
    'interval-training': {
        minFret: 0,
        maxFret: 12,
        maxSemitones: 12,
        notesPerGame: 10,
    },
};

export const FRETBOARD = {
    stringSpacing: 48,
    nutSize: 6,
    fretLength: 600,
    labelPad: 40,
    fretNumPad: 25,
    endPad: 15,
    sidePad: 20,
    dotRadius: 5,
    noteRadius: 16,
};

export const STORAGE_KEYS = {
    global: 'guitar_trainer_global',
    modePrefix: 'guitar_trainer_mode_',
};
