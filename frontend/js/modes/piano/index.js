import { ModeBase } from '../mode-base.js';
import { playPitch, ensureAudio } from '../../services/audio.js';

const WHITE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const BLACKS = [
    { offset: 1, left: 1 }, { offset: 3, left: 2 },
    { offset: 6, left: 4 }, { offset: 8, left: 5 }, { offset: 10, left: 6 },
];
const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

function noteName(midi) {
    return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export default class PianoMode extends ModeBase {
    constructor(slug) {
        super(slug);
        this.container = null;
        this.startMidi = 48;
        this.showLabels = true;
    }

    async activate(container) {
        super.activate(container);
        this.container = container;
        this.render();
    }

    deactivate() {
        super.deactivate();
        if (this.container) this.container.innerHTML = '';
    }

    render() {
        const octave = Math.floor(this.startMidi / 12) - 1;
        const whites = [];
        const blacks = [];
        for (let oct = 0; oct < 2; oct++) {
            WHITE_OFFSETS.forEach(offset => {
                const midi = this.startMidi + oct * 12 + offset;
                whites.push(`<button class="piano-key white" data-midi="${midi}" aria-label="${noteName(midi)}"><span>${this.showLabels ? noteName(midi) : ''}</span></button>`);
            });
            BLACKS.forEach(key => {
                const midi = this.startMidi + oct * 12 + key.offset;
                const position = (oct * 7 + key.left) * (100 / 14);
                blacks.push(`<button class="piano-key black" style="--key-left:${position}%" data-midi="${midi}" aria-label="${noteName(midi)}"><span>${this.showLabels ? noteName(midi) : ''}</span></button>`);
            });
        }

        this.container.innerHTML = `<section class="piano-mode mode-shell">
            <div class="mode-heading"><span class="section-kicker">FREE PLAY</span><h2>Two-octave piano</h2><p>Use it as a reference, test a chord, or hear a scale away from the guitar shape.</p></div>
            <div class="piano-toolbar">
                <button class="secondary-button" id="piano-down" ${this.startMidi <= 36 ? 'disabled' : ''} aria-label="Move keyboard down one octave">− Octave</button>
                <strong>C${octave}–B${octave + 1}</strong>
                <button class="secondary-button" id="piano-up" ${this.startMidi >= 72 ? 'disabled' : ''} aria-label="Move keyboard up one octave">+ Octave</button>
                <label class="toggle-label"><input type="checkbox" id="piano-labels" ${this.showLabels ? 'checked' : ''}> Note labels</label>
            </div>
            <div class="piano-scroll"><div class="piano-keyboard" role="group" aria-label="Two octave piano keyboard"><div class="white-keys">${whites.join('')}</div>${blacks.join('')}</div></div>
            <p class="piano-hint">Slide the keyboard by octaves. Notes use the clean reference tone so pitch stays clear.</p>
        </section>`;

        this.container.querySelector('#piano-down').addEventListener('click', () => { this.startMidi -= 12; this.render(); });
        this.container.querySelector('#piano-up').addEventListener('click', () => { this.startMidi += 12; this.render(); });
        this.container.querySelector('#piano-labels').addEventListener('change', event => { this.showLabels = event.target.checked; this.render(); });
        this.container.querySelectorAll('.piano-key').forEach(key => {
            const play = async event => {
                event.preventDefault();
                await ensureAudio();
                key.classList.add('pressed');
                playPitch(Number(key.dataset.midi), { duration: 1.2, timbre: 'piano', clean: true });
            };
            key.addEventListener('pointerdown', play);
            ['pointerup', 'pointercancel', 'pointerleave'].forEach(name => key.addEventListener(name, () => key.classList.remove('pressed')));
        });
    }
}
