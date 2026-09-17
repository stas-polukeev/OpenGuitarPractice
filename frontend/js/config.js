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
        distortionEnabled: false,
        distortionAmount: 35,
        masterVolume: 80,
        enabledModes: ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'],
        zoom: 100, // percent
    },
    'find-the-note': {
        minFret: 0,
        maxFret: 12,
        notesPerGame: 10,
        timerEnabled: false,
        timerSeconds: 5,
        strings: [],
        flashMode: 'octaves', // 'octaves' or 'all-natural'
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
        strings: [],
    },
    'scale-practice': {
        scaleKey: 'minor-pentatonic',
        scaleRoot: 9,
        position: 1,
    },
    'string-practice': {
        minFret: 0,
        maxFret: 12,
        notesPerRound: 7,
        noteTime: 5,
        strings: [],
    },
    'string-practice-auto': {
        minFret: 0,
        maxFret: 12,
        notesPerRound: 7,
        noteTime: 5,
        strings: [],
    },
    'find-all-notes': {
        minFret: 0,
        maxFret: 12,
        rounds: 5,
        timerEnabled: false,
        timerSeconds: 15,
    },
    'interval-training': {
        minFret: 0,
        maxFret: 12,
        maxSemitones: 12,
        notesPerGame: 10,
        strings: [],
    },
    'chord-practice': {
        practiceType: 'diatonic',
        modeId: 'ionian',
        root: 0,
        rounds: 10,
    },
    'scale-sequence': {
        root: 4,
        modeId: 'aeolian',
        layout: 'threeNps',
        string: 0,
        simpleOpenRoot: true,
        traversal: 'scalar',
        direction: 'upDown',
        maxFret: 24,
    },
    'degree-finder': {
        presetId: 'roots',
        rounds: 6,
    },
    'ear-training': {
        levelId: 'ear-home-power',
        sessionLength: 20,
        humPrompt: true,
        labels: 'degrees-solfege',
        freePractice: false,
    },
    'melody-memory': {
        levelId: 'melody-2-stepwise',
        sessionLength: 10,
        humPrompt: true,
        labels: 'degrees-solfege',
        freePractice: false,
        cleanReference: true,
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
