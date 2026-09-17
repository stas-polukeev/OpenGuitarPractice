const STORAGE_KEY = 'guitar_trainer_progress_v2';

const EMPTY = Object.freeze({
    xp: 0,
    streak: 0,
    lastPracticeDate: null,
    totalMinutes: 0,
    sessions: 0,
    skills: {},
    recent: [],
});

function storage() {
    return typeof localStorage === 'undefined' ? null : localStorage;
}

function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function dayDistance(a, b) {
    if (!a || !b) return Infinity;
    const start = new Date(`${a}T12:00:00`);
    const end = new Date(`${b}T12:00:00`);
    return Math.round((end - start) / 86400000);
}

function load() {
    try {
        const raw = storage()?.getItem(STORAGE_KEY);
        if (!raw) return structuredClone(EMPTY);
        return { ...structuredClone(EMPTY), ...JSON.parse(raw) };
    } catch {
        return structuredClone(EMPTY);
    }
}

function save(state) {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function levelForXp(xp) {
    return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1);
}

export function getProfile() {
    const state = load();
    const level = levelForXp(state.xp);
    const levelFloor = Math.pow(level - 1, 2) * 120;
    const levelCeiling = Math.pow(level, 2) * 120;
    return {
        ...state,
        level,
        levelProgress: (state.xp - levelFloor) / (levelCeiling - levelFloor),
    };
}

export function recordSession({
    skillId,
    title = skillId,
    correct = 0,
    total = 0,
    minutes = 1,
    mastery = null,
    completed = true,
} = {}) {
    if (!skillId) return getProfile();
    const state = load();
    const today = localDate();
    const distance = dayDistance(state.lastPracticeDate, today);
    if (distance === 1) state.streak += 1;
    else if (distance > 1) state.streak = 1;
    else if (!state.streak) state.streak = 1;
    state.lastPracticeDate = today;

    const safeMinutes = Math.max(0, Number(minutes) || 0);
    const accuracy = total > 0 ? correct / total : null;
    const effortXp = Math.max(5, Math.round(safeMinutes * 8));
    const masteryXp = accuracy === null ? 0 : Math.round(accuracy * 20);
    state.xp += effortXp + masteryXp;
    state.totalMinutes += safeMinutes;
    state.sessions += completed ? 1 : 0;

    const previous = state.skills[skillId] || {
        title,
        attempts: 0,
        correct: 0,
        sessions: 0,
        mastery: 0,
        lastPracticed: null,
    };
    previous.title = title;
    previous.attempts += total;
    previous.correct += correct;
    previous.sessions += completed ? 1 : 0;
    previous.lastPracticed = new Date().toISOString();
    if (mastery !== null) previous.mastery = Math.max(previous.mastery, Math.min(1, mastery));
    else if (accuracy !== null) previous.mastery = Math.max(previous.mastery, accuracy * Math.min(1, previous.attempts / 30));
    state.skills[skillId] = previous;

    state.recent.unshift({ skillId, title, accuracy, minutes: safeMinutes, at: previous.lastPracticed });
    state.recent = state.recent.slice(0, 12);
    save(state);
    return getProfile();
}

export function getRecommendedSkill(catalog = []) {
    const profile = getProfile();
    if (!catalog.length) return null;
    const scored = catalog.map((item, index) => {
        const skill = profile.skills[item.slug];
        const mastery = skill?.mastery ?? 0;
        const last = skill?.lastPracticed ? new Date(skill.lastPracticed).getTime() : 0;
        const unseenBoost = skill ? 0 : 2;
        const reviewBoost = last && Date.now() - last > 86400000 ? 1 : 0;
        return { item, score: unseenBoost + reviewBoost + (1 - mastery) - index * 0.01 };
    });
    return scored.sort((a, b) => b.score - a.score)[0].item;
}

export function clearProgress() {
    storage()?.removeItem(STORAGE_KEY);
}
