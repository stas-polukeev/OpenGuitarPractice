import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../config.js';
import { eventBus } from './events.js';

function load(key, defaults) {
    try {
        const raw = localStorage.getItem(key);
        if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...defaults };
}

function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

class SettingsManager {
    constructor() {
        this._global = load(STORAGE_KEYS.global, DEFAULT_SETTINGS.global);
        this._mode = {};
    }

    get global() {
        return { ...this._global };
    }

    setGlobal(key, value) {
        this._global[key] = value;
        save(STORAGE_KEYS.global, this._global);
        eventBus.emit('settings:global', { key, value, settings: this.global });
    }

    getMode(slug) {
        if (!this._mode[slug]) {
            const defaults = DEFAULT_SETTINGS[slug] || {};
            this._mode[slug] = load(STORAGE_KEYS.modePrefix + slug, defaults);
        }
        return { ...this._mode[slug] };
    }

    setMode(slug, key, value) {
        if (!this._mode[slug]) this.getMode(slug);
        this._mode[slug][key] = value;
        save(STORAGE_KEYS.modePrefix + slug, this._mode[slug]);
        eventBus.emit('settings:mode', { slug, key, value, settings: this.getMode(slug) });
    }
}

export const settings = new SettingsManager();
