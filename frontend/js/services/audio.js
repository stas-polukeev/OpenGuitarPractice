// Open string frequencies in Hz (standard tuning: E2 A2 D3 G3 B3 E4)
const OPEN_FREQ = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

let ctx = null;
let unlocked = false;

function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
}

// iOS Safari requires AudioContext to be resumed inside a direct user gesture.
// Call this once on first touch/click to unlock audio.
function unlock() {
    if (unlocked) return;
    const ac = getCtx();
    if (ac.state === 'suspended') {
        ac.resume();
    }
    // iOS needs a silent buffer played to fully unlock
    const buf = ac.createBuffer(1, 1, ac.sampleRate);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    src.start(0);
    unlocked = true;
}

// Attach unlock to first user interaction
if (typeof document !== 'undefined') {
    const events = ['touchstart', 'touchend', 'click', 'pointerdown'];
    const handler = () => {
        unlock();
        events.forEach(e => document.removeEventListener(e, handler, true));
    };
    events.forEach(e => document.addEventListener(e, handler, true));
}

// Mellow: sine + filtered noise, body resonance, longer decay
function playMellow(freq, stringIndex) {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const now = ac.currentTime;
    const sr = ac.sampleRate;
    const period = Math.round(sr / freq);
    const duration = 2.5;
    const samples = Math.round(sr * duration);

    const buf = ac.createBuffer(1, samples, sr);
    const data = buf.getChannelData(0);

    for (let i = 0; i < period; i++) {
        const t = i / sr;
        const sine = Math.sin(2 * Math.PI * freq * t) * 0.4;
        const noise = (Math.random() * 2 - 1) * 0.3;
        data[i] = sine + noise;
    }
    for (let pass = 0; pass < 4; pass++) {
        for (let i = 1; i < period; i++) {
            data[i] = 0.6 * data[i] + 0.4 * data[i - 1];
        }
    }

    const damping = 0.997 + stringIndex * 0.0004;
    for (let i = period; i < samples; i++) {
        data[i] = damping * 0.5 * (data[i - period] + data[i - period + 1]);
    }

    const source = ac.createBufferSource();
    source.buffer = buf;

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(freq * 4, 4000), now);
    lp.Q.setValueAtTime(0.7, now);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(lp);
    lp.connect(gain);
    gain.connect(ac.destination);
    source.start();
}

// Bright: raw noise, less damping, no body filter
function playBright(freq, stringIndex) {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const now = ac.currentTime;
    const sr = ac.sampleRate;
    const period = Math.round(sr / freq);
    const duration = 2.0;
    const samples = Math.round(sr * duration);

    const buf = ac.createBuffer(1, samples, sr);
    const data = buf.getChannelData(0);

    for (let i = 0; i < period; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const damping = 0.994 + stringIndex * 0.001;
    for (let i = period; i < samples; i++) {
        data[i] = damping * 0.5 * (data[i - period] + data[i - period + 1]);
    }

    const source = ac.createBufferSource();
    source.buffer = buf;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(gain);
    gain.connect(ac.destination);
    source.start();
}

let currentTone = 'mellow';

export function setTone(tone) { currentTone = tone; }
export function getTone() { return currentTone; }

export function playNote(stringIndex, fret) {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const freq = OPEN_FREQ[stringIndex] * Math.pow(2, fret / 12);
    if (currentTone === 'bright') {
        playBright(freq, stringIndex);
    } else {
        playMellow(freq, stringIndex);
    }
}
