const MODE_MODULES = {
    'find-the-note': () => import('./find-the-note/index.js'),
    'guitar-practice': () => import('./guitar-practice/index.js'),
    'interval-training': () => import('./interval-training/index.js'),
    'scale-practice': () => import('./scale-practice/index.js'),
};

const instances = {};

export async function getMode(slug) {
    if (instances[slug]) return instances[slug];
    const loader = MODE_MODULES[slug];
    if (!loader) throw new Error(`Unknown mode: ${slug}`);
    const mod = await loader();
    instances[slug] = new mod.default(slug);
    return instances[slug];
}

export const FRONTEND_MODES = [
    { slug: 'find-the-note', name: 'Find the Note', description: 'Find notes on the fretboard' },
    { slug: 'guitar-practice', name: 'Guitar Practice', description: 'Practice with your guitar' },
    { slug: 'interval-training', name: 'Intervals', description: 'Learn intervals on the fretboard' },
    { slug: 'scale-practice', name: 'Scales', description: 'Practice scales on the fretboard' },
];
