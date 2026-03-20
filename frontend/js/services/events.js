class EventBus extends EventTarget {
    constructor() {
        super();
        this._wrappers = new Map();
    }

    emit(name, detail = {}) {
        this.dispatchEvent(new CustomEvent(name, { detail }));
    }

    on(name, callback) {
        const wrapper = (e) => callback(e.detail);
        if (!this._wrappers.has(callback)) this._wrappers.set(callback, []);
        this._wrappers.get(callback).push({ name, wrapper });
        this.addEventListener(name, wrapper);
    }

    off(name, callback) {
        const entries = this._wrappers.get(callback);
        if (!entries) return;
        const idx = entries.findIndex(e => e.name === name);
        if (idx !== -1) {
            this.removeEventListener(name, entries[idx].wrapper);
            entries.splice(idx, 1);
            if (entries.length === 0) this._wrappers.delete(callback);
        }
    }
}

export const eventBus = new EventBus();
