import { API_BASE } from '../config.js';
import { noteAt } from '../theory/fretboard.js';
import { chromaticToName, NATURAL_NOTE_INDICES } from '../theory/notes.js';
import { getTuning } from '../theory/tunings.js';
import { weightedPick } from './stats.js';

async function request(path, options = {}) {
    const url = API_BASE + path;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || res.statusText);
    }
    return res.json();
}

// Generate a challenge entirely client-side
function generateChallengeLocal(data) {
    const tuning = getTuning(data.tuning || 'standard');
    const notation = data.notation || 'english';
    const preferSharps = data.prefer_sharps ?? true;
    const minFret = data.min_fret ?? 0;
    const maxFret = data.max_fret ?? 12;
    const allowed = new Set(data.allowed_notes ?? NATURAL_NOTE_INDICES);
    const strings = data.strings; // optional string filter array

    // Build valid (string, note) pairs reachable in fret range
    const pairs = [];
    for (let s = 0; s < tuning.strings.length; s++) {
        if (strings && strings.length > 0 && !strings.includes(s)) continue;
        const reachable = new Set();
        for (let f = minFret; f <= maxFret; f++) {
            const n = noteAt(s, f, tuning);
            if (allowed.has(n) && !reachable.has(n)) {
                reachable.add(n);
                pairs.push({ s, n });
            }
        }
    }

    if (pairs.length === 0) throw new Error('No valid notes for settings');

    // Weighted pick: favor harder combinations (negative mining)
    const pick = weightedPick(pairs);
    const id = Math.random().toString(36).slice(2, 14);

    return {
        challenge_id: id,
        string_index: pick.s,
        string_name: tuning.stringNames[pick.s],
        note_name: chromaticToName(pick.n, notation, preferSharps),
        chromatic_index: pick.n,
    };
}

export function getModes() {
    return request('/modes').catch(() => [
        { slug: 'find-the-note', name: 'Find the Note' },
    ]);
}

export function getFretboard(tuning = 'standard', fretCount = 12) {
    return request(`/theory/fretboard?tuning=${tuning}&fret_count=${fretCount}`);
}

export function getNotes(notation = 'english', preferSharps = true) {
    return request(`/theory/notes?notation=${notation}&prefer_sharps=${preferSharps}`);
}

export function getTunings() {
    return request('/settings/tunings');
}

export function getNotations() {
    return request('/settings/notations');
}

export async function createChallenge(data) {
    try {
        return await request('/modes/find-the-note/challenge', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    } catch {
        // Offline or server error — generate locally
        return generateChallengeLocal(data);
    }
}

export function submitAnswer(data) {
    return request('/modes/find-the-note/answer', {
        method: 'POST',
        body: JSON.stringify(data),
    }).catch(() => null); // answer validation is already done client-side
}
