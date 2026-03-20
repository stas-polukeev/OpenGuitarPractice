export const NOTATION_SYSTEMS = {
    english: {
        label: 'English (A B C ...)',
        notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        sharps: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        flats: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
    },
    russian: {
        label: 'Russian',
        notes: ['До', 'Ре', 'Ми', 'Фа', 'Соль', 'Ля', 'Си'],
        sharps: ['До', 'До#', 'Ре', 'Ре#', 'Ми', 'Фа', 'Фа#', 'Соль', 'Соль#', 'Ля', 'Ля#', 'Си'],
        flats: ['До', 'Реb', 'Ре', 'Миb', 'Ми', 'Фа', 'Сольb', 'Соль', 'Ляb', 'Ля', 'Сиb', 'Си'],
    },
    latin: {
        label: 'Latin (Do Re Mi ...)',
        notes: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'],
        sharps: ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Ti'],
        flats: ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Tib', 'Ti'],
    },
};

export const NATURAL_NOTE_INDICES = [0, 2, 4, 5, 7, 9, 11];

export function chromaticToName(index, notation = 'english', preferSharps = true) {
    const system = NOTATION_SYSTEMS[notation];
    const names = preferSharps ? system.sharps : system.flats;
    return names[((index % 12) + 12) % 12];
}

export function isNatural(index) {
    return NATURAL_NOTE_INDICES.includes(((index % 12) + 12) % 12);
}

export function getNaturalNotes(notation = 'english') {
    return NOTATION_SYSTEMS[notation].notes;
}
