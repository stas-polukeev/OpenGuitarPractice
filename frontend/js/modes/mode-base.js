export class ModeBase {
    constructor(slug) {
        this.slug = slug;
        this.active = false;
    }

    activate(container, fretboard, settingsManager) {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    onSettingsChanged(globalSettings, modeSettings) {
        // Override in subclasses
    }
}
