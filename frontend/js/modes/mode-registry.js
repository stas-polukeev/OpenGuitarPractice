const MODE_MODULES = {
    'find-the-note': () => import('./find-the-note/index.js'),
    'guitar-practice': () => import('./guitar-practice/index.js'),
    'interval-training': () => import('./interval-training/index.js'),
    'scale-practice': () => import('./scale-practice/index.js'),
    'string-practice': () => import('./string-practice/index.js'),
    'string-practice-auto': () => import('./string-practice/index.js'),
    'find-all-notes': () => import('./find-all-notes/index.js'),
    'chord-practice': () => import('./chord-practice/index.js'),
    'scale-sequence': () => import('./scale-sequence/index.js'),
    'degree-finder': () => import('./degree-finder/index.js'),
    'ear-training': () => import('./ear-training/index.js'),
    'melody-memory': () => import('./melody-memory/index.js'),
    'rhythm-lab': () => import('./rhythm-lab/index.js'),
    'piano': () => import('./piano/index.js'),
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
    { slug: 'find-the-note', name: 'Find the Note' },
    { slug: 'interval-training', name: 'Intervals' },
    { slug: 'scale-practice', name: 'Scales' },
    { slug: 'guitar-practice', name: 'Random Notes' },
    { slug: 'string-practice', name: 'String Practice' },
    { slug: 'chord-practice', name: 'Chord Builder' },
    { slug: 'scale-sequence', name: 'Scale Journeys' },
    { slug: 'degree-finder', name: 'Scale Degrees' },
    { slug: 'ear-training', name: 'Ear Training' },
    { slug: 'melody-memory', name: 'Melody Memory' },
    { slug: 'rhythm-lab', name: 'Rhythm Lab' },
    { slug: 'piano', name: 'Free Piano' },
];
