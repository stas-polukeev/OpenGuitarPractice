// Shared Web Audio engine. Existing guitar APIs are preserved at the bottom.
const OPEN_FREQ = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

let ctx = null;
let graph = null;
let unlocked = false;
let currentTone = 'mellow';
let distortionDrive = 0;
let masterVolume = 0.82;
const activeSources = new Set();

function audioConstructor() {
    return globalThis.AudioContext || globalThis.webkitAudioContext;
}

function makeDistortionCurve(amount = 0) {
    const samples = 2048;
    const curve = new Float32Array(samples);
    const k = Math.max(0, amount) * 500;
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / (samples - 1) - 1;
        curve[i] = k === 0
            ? x
            : ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function buildGraph(ac) {
    const effectInput = ac.createGain();
    const cleanInput = ac.createGain();
    const dry = ac.createGain();
    const wet = ac.createGain();
    const shaper = ac.createWaveShaper();
    const tone = ac.createBiquadFilter();
    const sum = ac.createGain();
    const limiter = ac.createDynamicsCompressor();
    const master = ac.createGain();

    tone.type = 'lowpass';
    tone.frequency.value = 5200;
    tone.Q.value = 0.55;
    shaper.oversample = '4x';
    limiter.threshold.value = -8;
    limiter.knee.value = 8;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    master.gain.value = masterVolume;

    effectInput.connect(dry);
    effectInput.connect(shaper);
    shaper.connect(tone);
    tone.connect(wet);
    dry.connect(sum);
    wet.connect(sum);
    cleanInput.connect(sum);
    sum.connect(limiter);
    limiter.connect(master);
    master.connect(ac.destination);

    graph = { effectInput, cleanInput, dry, wet, shaper, tone, sum, limiter, master };
    updateDriveGraph(ac.currentTime);
    return graph;
}

function updateDriveGraph(when = 0) {
    if (!graph) return;
    const drive = Math.max(0, Math.min(1, distortionDrive));
    graph.shaper.curve = makeDistortionCurve(drive);
    graph.dry.gain.setValueAtTime(Math.cos(drive * Math.PI / 2), when);
    // Reduced wet gain plus the final limiter keep output normalized.
    graph.wet.gain.setValueAtTime(Math.sin(drive * Math.PI / 2) * 0.72, when);
    graph.tone.frequency.setValueAtTime(6200 - drive * 3000, when);
}

function getCtx() {
    if (ctx) return ctx;
    const AudioContextClass = audioConstructor();
    if (!AudioContextClass) throw new Error('Web Audio is not available in this browser.');
    ctx = new AudioContextClass();
    buildGraph(ctx);
    return ctx;
}

function outputFor(clean = false) {
    const ac = getCtx();
    if (!graph) buildGraph(ac);
    return clean ? graph.cleanInput : graph.effectInput;
}

function trackSource(source) {
    activeSources.add(source);
    const previous = source.onended;
    source.onended = (event) => {
        activeSources.delete(source);
        if (typeof previous === 'function') previous.call(source, event);
    };
    return source;
}

export function getAudioContext() {
    return getCtx();
}

// Must be called from a click/touch on iOS. Resolves once the context is running.
export async function ensureAudio() {
    const ac = getCtx();
    if (ac.state === 'suspended') await ac.resume();
    if (!unlocked) {
        const buffer = ac.createBuffer(1, 1, ac.sampleRate);
        const source = ac.createBufferSource();
        source.buffer = buffer;
        source.connect(graph.cleanInput);
        source.start();
        unlocked = true;
    }
    return ac;
}

export function midiToHz(midi) {
    if (!Number.isFinite(midi)) throw new TypeError('MIDI note must be a finite number.');
    return 440 * Math.pow(2, (midi - 69) / 12);
}

export function setMasterVolume(value) {
    const numeric = Number(value) || 0;
    masterVolume = Math.max(0, Math.min(1, numeric > 1 ? numeric / 100 : numeric));
    if (graph && ctx) graph.master.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.015);
}

export function getMasterVolume() {
    return masterVolume;
}

export function setDistortionDrive(value) {
    distortionDrive = Math.max(0, Math.min(1, Number(value) || 0));
    updateDriveGraph(ctx?.currentTime || 0);
}

export function getDistortionDrive() {
    return distortionDrive;
}

// UI-friendly compatibility API: amount may be either 0..1 or a percentage.
export function setDrive(enabled, amount = 0.35) {
    const numeric = Number(amount) || 0;
    setDistortionDrive(enabled ? (numeric > 1 ? numeric / 100 : numeric) : 0);
}

function envelope(gain, when, duration, velocity, timbre) {
    const attack = Math.min(timbre === 'pad' ? 0.08 : 0.008, duration * 0.25);
    const release = Math.min(0.35, duration * 0.35);
    const peak = Math.max(0.001, Math.min(1, velocity));
    gain.gain.cancelScheduledValues(when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + attack);
    gain.gain.setValueAtTime(peak * 0.78, Math.max(when + attack, when + duration - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
}

function timbrePartials(timbre) {
    switch (timbre) {
        case 'sine': return [{ ratio: 1, gain: 1, type: 'sine' }];
        case 'pad': return [
            { ratio: 1, gain: 0.72, type: 'sine' },
            { ratio: 2, gain: 0.2, type: 'sine' },
            { ratio: 3, gain: 0.08, type: 'sine' },
        ];
        case 'bright': return [
            { ratio: 1, gain: 0.7, type: 'sawtooth' },
            { ratio: 2, gain: 0.2, type: 'triangle' },
        ];
        case 'guitar': return [
            { ratio: 1, gain: 0.72, type: 'triangle' },
            { ratio: 2, gain: 0.2, type: 'sine' },
            { ratio: 3, gain: 0.08, type: 'sine' },
        ];
        case 'piano':
        default: return [
            { ratio: 1, gain: 0.7, type: 'triangle' },
            { ratio: 2, gain: 0.22, type: 'sine' },
            { ratio: 4, gain: 0.08, type: 'sine' },
        ];
    }
}

// `when` is an absolute AudioContext time. Set `clean: true` to bypass global drive.
export function playPitch(midi, options = {}) {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const when = Math.max(ac.currentTime, options.when ?? ac.currentTime);
    const duration = Math.max(0.06, options.duration ?? 0.7);
    const velocity = Math.max(0.01, Math.min(1, options.velocity ?? 0.28));
    const timbre = options.timbre || 'piano';
    const frequency = midiToHz(midi);
    const voice = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(options.cutoff ?? Math.min(8500, frequency * 14), when);
    filter.Q.setValueAtTime(0.6, when);
    envelope(voice, when, duration, velocity, timbre);
    voice.connect(filter);
    filter.connect(outputFor(options.clean === true));

    const sources = timbrePartials(timbre).map((partial) => {
        const oscillator = trackSource(ac.createOscillator());
        const partialGain = ac.createGain();
        oscillator.type = partial.type;
        oscillator.frequency.setValueAtTime(frequency * partial.ratio, when);
        partialGain.gain.setValueAtTime(partial.gain, when);
        oscillator.connect(partialGain);
        partialGain.connect(voice);
        oscillator.start(when);
        oscillator.stop(when + duration + 0.03);
        return oscillator;
    });

    return {
        startTime: when,
        endTime: when + duration,
        stop: () => sources.forEach((source) => { try { source.stop(); } catch { /* ended */ } }),
    };
}

export function playChord(midis, options = {}) {
    const notes = Array.isArray(midis) ? midis : [midis];
    const velocity = (options.velocity ?? 0.32) / Math.sqrt(Math.max(1, notes.length));
    const handles = notes.map((midi) => playPitch(midi, { ...options, velocity }));
    return {
        startTime: handles.length ? Math.min(...handles.map((handle) => handle.startTime)) : 0,
        endTime: handles.length ? Math.max(...handles.map((handle) => handle.endTime)) : 0,
        stop: () => handles.forEach((handle) => handle.stop()),
    };
}

// Events may be MIDI numbers or { midi | midis, offset, duration, velocity } objects.
export function playSequence(events, options = {}) {
    const ac = getCtx();
    const startTime = Math.max(ac.currentTime, options.when ?? ac.currentTime);
    const step = Math.max(0.05, options.step ?? 0.5);
    const defaultDuration = options.duration ?? Math.min(0.65, step * 0.9);
    const handles = [];
    let cursor = 0;

    for (const rawEvent of events || []) {
        const event = typeof rawEvent === 'number' ? { midi: rawEvent } : rawEvent;
        const offset = event.offset ?? cursor;
        const eventOptions = {
            ...options,
            ...event,
            when: startTime + offset,
            duration: event.duration ?? defaultDuration,
        };
        if (Array.isArray(event.midis)) handles.push(playChord(event.midis, eventOptions));
        else if (Number.isFinite(event.midi)) handles.push(playPitch(event.midi, eventOptions));
        cursor = Math.max(cursor + step, offset + (event.step ?? step));
    }

    return {
        startTime,
        endTime: handles.length ? Math.max(...handles.map((handle) => handle.endTime)) : startTime,
        stop: () => handles.forEach((handle) => handle.stop()),
    };
}

function noiseBuffer(ac, duration) {
    const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
}

export function playDrum(kind, options = {}) {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const when = Math.max(ac.currentTime, options.when ?? ac.currentTime);
    const velocity = Math.max(0.01, Math.min(1, options.velocity ?? 0.55));
    const destination = outputFor(options.clean === true);

    if (kind === 'kick') {
        const oscillator = trackSource(ac.createOscillator());
        const gain = ac.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(145, when);
        oscillator.frequency.exponentialRampToValueAtTime(48, when + 0.16);
        gain.gain.setValueAtTime(velocity * 0.8, when);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
        oscillator.connect(gain);
        gain.connect(destination);
        oscillator.start(when);
        oscillator.stop(when + 0.3);
        return { startTime: when, endTime: when + 0.3, stop: () => { try { oscillator.stop(); } catch { /* ended */ } } };
    }

    const duration = kind === 'hihat' ? 0.09 : 0.2;
    const source = trackSource(ac.createBufferSource());
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    source.buffer = noiseBuffer(ac, duration);
    filter.type = kind === 'hihat' ? 'highpass' : 'bandpass';
    filter.frequency.value = kind === 'hihat' ? 6500 : 1800;
    filter.Q.value = kind === 'hihat' ? 0.7 : 0.9;
    gain.gain.setValueAtTime(velocity * (kind === 'hihat' ? 0.32 : 0.48), when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(when);
    source.stop(when + duration);
    return { startTime: when, endTime: when + duration, stop: () => { try { source.stop(); } catch { /* ended */ } } };
}

export function stopAll() {
    for (const source of [...activeSources]) {
        try { source.stop(); } catch { /* already ended */ }
    }
    activeSources.clear();
}

// Mellow: Karplus-Strong string with a filtered, softer attack.
function playMellow(freq, stringIndex) {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const now = ac.currentTime;
    const sampleRate = ac.sampleRate;
    const period = Math.max(2, Math.round(sampleRate / freq));
    const duration = 2.5;
    const samples = Math.round(sampleRate * duration);
    const buffer = ac.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < period; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * freq * t) * 0.4 + (Math.random() * 2 - 1) * 0.3;
    }
    for (let pass = 0; pass < 4; pass++) {
        for (let i = 1; i < period; i++) data[i] = 0.6 * data[i] + 0.4 * data[i - 1];
    }
    const damping = 0.997 + stringIndex * 0.0004;
    for (let i = period; i < samples; i++) data[i] = damping * 0.5 * (data[i - period] + data[i - period + 1]);

    const source = trackSource(ac.createBufferSource());
    const lowpass = ac.createBiquadFilter();
    const gain = ac.createGain();
    source.buffer = buffer;
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(Math.min(freq * 4, 4000), now);
    lowpass.Q.setValueAtTime(0.7, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(outputFor(false));
    source.start();
    return source;
}

// Bright: raw Karplus-Strong string with less damping.
function playBright(freq, stringIndex) {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const now = ac.currentTime;
    const sampleRate = ac.sampleRate;
    const period = Math.max(2, Math.round(sampleRate / freq));
    const duration = 2;
    const samples = Math.round(sampleRate * duration);
    const buffer = ac.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < period; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const damping = 0.994 + stringIndex * 0.001;
    for (let i = period; i < samples; i++) data[i] = damping * 0.5 * (data[i - period] + data[i - period + 1]);

    const source = trackSource(ac.createBufferSource());
    const gain = ac.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(gain);
    gain.connect(outputFor(false));
    source.start();
    return source;
}

export function setTone(tone) { currentTone = tone; }
export function getTone() { return currentTone; }

export function playNote(stringIndex, fret) {
    const frequency = OPEN_FREQ[stringIndex] * Math.pow(2, fret / 12);
    return currentTone === 'bright'
        ? playBright(frequency, stringIndex)
        : playMellow(frequency, stringIndex);
}

if (typeof document !== 'undefined') {
    const events = ['touchstart', 'touchend', 'click', 'pointerdown'];
    const handler = () => {
        ensureAudio().catch(() => { /* a later user gesture can retry */ });
        events.forEach((event) => document.removeEventListener(event, handler, true));
    };
    events.forEach((event) => document.addEventListener(event, handler, true));
}
