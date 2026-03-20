export const TUNINGS = {
    standard: {
        name: 'Standard (EADGBe)',
        slug: 'standard',
        strings: [4, 9, 2, 7, 11, 4],   // E A D G B E
        stringNames: ['E', 'A', 'D', 'G', 'B', 'e'],
        basePitch: [40, 45, 50, 55, 59, 64], // MIDI note numbers
    },
};

export function getTuning(slug = 'standard') {
    return TUNINGS[slug];
}
