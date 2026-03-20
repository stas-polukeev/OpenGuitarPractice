import { FRETBOARD } from '../config.js';
import { noteAt } from '../theory/fretboard.js';
import { chromaticToName } from '../theory/notes.js';
import { getTuning } from '../theory/tunings.js';
import { getDotPositions } from '../theory/fretboard.js';
import { eventBus } from '../services/events.js';
import { playNote } from '../services/audio.js';

const NS = 'http://www.w3.org/2000/svg';

function svg(tag, attrs = {}) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
}

export class FretboardSVG {
    constructor(container, options = {}) {
        this.container = container;
        this.tuning = getTuning(options.tuning || 'standard');
        this.notation = options.notation || 'english';
        this.showSharps = options.showSharps ?? false;
        this.showFlats = options.showFlats ?? false;
        this.horizontal = options.horizontal ?? false;
        this.stringLabels = options.stringLabels ?? 'notes';
        this.showFretNumbers = options.showFretNumbers ?? true;
        this.soundEnabled = options.soundEnabled ?? true;
        this.displayStartFret = options.displayStartFret ?? 0;
        this.displayEndFret = options.displayEndFret ?? 12;
        this.onFretTap = options.onFretTap || null;
        this._highlights = [];
        this._computeLayout();
        this.render();
    }

    // --- Layout computation ---

    _computeLayout() {
        const N = this.tuning.strings.length;
        const sf = this.displayStartFret;
        const ef = this.displayEndFret;

        // Real guitar fret position formula: fraction of scale length from nut
        const absPos = (f) => f === 0 ? 0 : 1 - Math.pow(2, -f / 12);
        const pStart = absPos(sf);
        const pEnd = absPos(ef);
        const pRange = pEnd - pStart || 1;

        this._fretFrac = (f) => {
            if (f <= sf) return 0;
            if (f >= ef) return 1;
            return (absPos(f) - pStart) / pRange;
        };

        // Wider string spacing in horizontal mode for better screen fill
        this.sp = this.horizontal ? 80 : FRETBOARD.stringSpacing;
        this.nutSz = FRETBOARD.nutSize;
        this.fretLen = FRETBOARD.fretLength;
        this.lPad = FRETBOARD.labelPad;
        this.fnPad = this.showFretNumbers ? FRETBOARD.fretNumPad : 5;
        this.ePad = FRETBOARD.endPad;
        this.sPad = FRETBOARD.sidePad;

        this.fretAxisLen = this.lPad + this.nutSz + this.fretLen + this.ePad;
        this.strAxisLen = this.sPad + (N - 1) * this.sp + this.sPad;

        if (this.horizontal) {
            this.svgW = this.fretAxisLen;
            this.svgH = this.fnPad + this.strAxisLen;
        } else {
            this.svgW = this.fnPad + this.strAxisLen;
            this.svgH = this.fretAxisLen;
        }
    }

    // --- Position helpers ---

    _fretWireAt(f) {
        return this.lPad + this.nutSz + this._fretFrac(f) * this.fretLen;
    }

    _tapArea(f) {
        const sf = this.displayStartFret;
        if (f === sf) {
            return { start: 5, end: this.lPad + this.nutSz };
        }
        const prev = (f === sf + 1) ? this.lPad + this.nutSz : this._fretWireAt(f - 1);
        return { start: prev, end: this._fretWireAt(f) };
    }

    _fretMid(f) {
        const { start, end } = this._tapArea(f);
        return (start + end) / 2;
    }

    _fretH(f) {
        const { start, end } = this._tapArea(f);
        return end - start;
    }

    _strAt(s) {
        return this.sPad + s * this.sp;
    }

    _toXY(fA, sA) {
        if (this.horizontal) {
            return { x: fA, y: this.fnPad + this.strAxisLen - sA };
        }
        return { x: this.fnPad + sA, y: fA };
    }

    _noteXY(s, f) {
        return this._toXY(this._fretMid(f), this._strAt(s));
    }

    _noteR(f) {
        const h = this._fretH(f);
        return Math.min(FRETBOARD.noteRadius, h * 0.42, this.sp * 0.42);
    }

    // --- Rendering ---

    render() {
        this.container.innerHTML = '';
        const svgAttrs = {
            viewBox: `0 0 ${this.svgW} ${this.svgH}`,
            class: 'fretboard-svg' + (this.horizontal ? ' horizontal' : ''),
        };
        if (this.horizontal) {
            // Constrain by height so strings fill the screen; allow horizontal scroll
            svgAttrs.height = '100%';
            svgAttrs.preserveAspectRatio = 'xMinYMid meet';
        } else {
            svgAttrs.width = '100%';
            svgAttrs.preserveAspectRatio = 'xMidYMin meet';
        }
        this.svg = svg('svg', svgAttrs);

        this._renderNeck();
        this._renderNut();
        this._renderFretWires();
        this._renderDots();
        this._renderStrings();
        this._renderStringLabels();
        if (this.showFretNumbers) this._renderFretNumbers();
        this._renderTapTargets();

        this.hoverCircle = svg('circle', { r: 14, class: 'fretboard-hover' });
        this.hoverCircle.style.display = 'none';
        this.svg.appendChild(this.hoverCircle);

        this.highlightGroup = svg('g', { class: 'highlights' });
        this.svg.appendChild(this.highlightGroup);

        this.container.appendChild(this.svg);
    }

    _renderNeck() {
        const N = this.tuning.strings.length;
        const p1 = this._toXY(this.lPad, this._strAt(0) - 10);
        const p2 = this._toXY(this.lPad + this.nutSz + this.fretLen, this._strAt(N - 1) + 10);
        this.svg.appendChild(svg('rect', {
            x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y),
            width: Math.abs(p2.x - p1.x), height: Math.abs(p2.y - p1.y),
            class: 'fretboard-neck',
        }));
    }

    _renderNut() {
        const N = this.tuning.strings.length;
        const s0 = this._strAt(0) - 10;
        const sN = this._strAt(N - 1) + 10;
        const p1 = this._toXY(this.lPad, s0);
        const p2 = this._toXY(this.lPad + this.nutSz, sN);
        this.svg.appendChild(svg('rect', {
            x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y),
            width: Math.abs(p2.x - p1.x), height: Math.abs(p2.y - p1.y),
            class: 'fretboard-nut',
        }));
    }

    _renderFretWires() {
        const N = this.tuning.strings.length;
        const s0 = this._strAt(0) - 10;
        const sN = this._strAt(N - 1) + 10;

        for (let f = this.displayStartFret + 1; f <= this.displayEndFret; f++) {
            const fA = this._fretWireAt(f);
            const p1 = this._toXY(fA, s0);
            const p2 = this._toXY(fA, sN);
            this.svg.appendChild(svg('line', {
                x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                class: 'fretboard-fret',
            }));
        }
    }

    _renderStrings() {
        const N = this.tuning.strings.length;
        const nutEnd = this.lPad;
        const lastFret = this._fretWireAt(this.displayEndFret);
        for (let s = 0; s < N; s++) {
            const sA = this._strAt(s);
            const p1 = this._toXY(nutEnd, sA);
            const p2 = this._toXY(lastFret, sA);
            const thickness = 1 + (N - 1 - s) * 0.5;
            this.svg.appendChild(svg('line', {
                x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                class: 'fretboard-string', 'stroke-width': thickness,
            }));
        }
    }

    _renderStringLabels() {
        const N = this.tuning.strings.length;
        for (let s = 0; s < N; s++) {
            const sA = this._strAt(s);
            let pos, anchor;
            if (this.horizontal) {
                pos = { x: this.lPad - 8, y: this.fnPad + this.strAxisLen - sA };
                anchor = 'end';
            } else {
                pos = { x: this.fnPad + sA, y: this.lPad - 10 };
                anchor = 'middle';
            }

            let label;
            if (this.stringLabels === 'numbers') {
                label = String(N - s);
            } else {
                label = this.tuning.stringNames[s];
            }

            const t = svg('text', {
                x: pos.x, y: pos.y,
                class: 'fretboard-string-label', 'text-anchor': anchor,
                'dominant-baseline': 'central',
            });
            t.textContent = label;
            this.svg.appendChild(t);
        }
    }

    _renderFretNumbers() {
        for (let f = this.displayStartFret + 1; f <= this.displayEndFret; f++) {
            const fA = this._fretMid(f);
            let pos;
            if (this.horizontal) {
                pos = { x: fA, y: this.fnPad * 0.55 };
            } else {
                pos = { x: this.fnPad * 0.55, y: fA };
            }
            const t = svg('text', {
                x: pos.x, y: pos.y,
                class: 'fretboard-fret-number',
                'text-anchor': 'middle', 'dominant-baseline': 'central',
            });
            t.textContent = f;
            this.svg.appendChild(t);
        }

        // Show start fret number on nut if not 0
        if (this.displayStartFret > 0) {
            const fA = this._fretMid(this.displayStartFret);
            let pos;
            if (this.horizontal) {
                pos = { x: fA, y: this.fnPad * 0.55 };
            } else {
                pos = { x: this.fnPad * 0.55, y: fA };
            }
            const t = svg('text', {
                x: pos.x, y: pos.y,
                class: 'fretboard-fret-number',
                'text-anchor': 'middle', 'dominant-baseline': 'central',
            });
            t.textContent = this.displayStartFret;
            this.svg.appendChild(t);
        }
    }

    _renderDots() {
        const dots = getDotPositions(this.displayEndFret);
        const N = this.tuning.strings.length;
        const midStr = (this._strAt(0) + this._strAt(N - 1)) / 2;

        for (const dot of dots) {
            if (dot.fret <= this.displayStartFret) continue;
            const fA = this._fretMid(dot.fret);
            if (dot.double) {
                const off = this.sp * 0.8;
                const p1 = this._toXY(fA, midStr - off);
                const p2 = this._toXY(fA, midStr + off);
                this.svg.appendChild(svg('circle', {
                    cx: p1.x, cy: p1.y, r: FRETBOARD.dotRadius, class: 'fretboard-dot',
                }));
                this.svg.appendChild(svg('circle', {
                    cx: p2.x, cy: p2.y, r: FRETBOARD.dotRadius, class: 'fretboard-dot',
                }));
            } else {
                const p = this._toXY(fA, midStr);
                this.svg.appendChild(svg('circle', {
                    cx: p.x, cy: p.y, r: FRETBOARD.dotRadius, class: 'fretboard-dot',
                }));
            }
        }
    }

    _renderTapTargets() {
        const N = this.tuning.strings.length;
        const sf = this.displayStartFret;
        const ef = this.displayEndFret;

        for (let s = 0; s < N; s++) {
            for (let f = sf; f <= ef; f++) {
                const { start, end } = this._tapArea(f);
                const sA = this._strAt(s);
                const half = this.sp / 2;

                // Invisible rect for reliable tap detection
                const p1 = this._toXY(start, sA - half);
                const p2 = this._toXY(end, sA + half);
                const rx = Math.min(p1.x, p2.x);
                const ry = Math.min(p1.y, p2.y);
                const rw = Math.abs(p2.x - p1.x);
                const rh = Math.abs(p2.y - p1.y);

                const rect = svg('rect', {
                    x: rx, y: ry, width: rw, height: rh,
                    class: 'fretboard-tap-target',
                    'data-string': s, 'data-fret': f,
                });

                const notePos = this._noteXY(s, f);

                rect.addEventListener('pointerenter', () => {
                    const r = this._noteR(f);
                    this.hoverCircle.setAttribute('cx', notePos.x);
                    this.hoverCircle.setAttribute('cy', notePos.y);
                    this.hoverCircle.setAttribute('r', r);
                    this.hoverCircle.style.display = '';
                });
                rect.addEventListener('pointerleave', () => {
                    this.hoverCircle.style.display = 'none';
                });
                rect.addEventListener('click', () => this._handleTap(s, f));

                this.svg.appendChild(rect);
            }
        }
    }

    _handleTap(stringIndex, fret) {
        if (this.soundEnabled) playNote(stringIndex, fret);
        if (this.onFretTap) this.onFretTap(stringIndex, fret);
        eventBus.emit('fretboard:tap', { stringIndex, fret });
    }

    // --- Highlights ---

    highlightFret(stringIndex, fret, cssClass = 'highlight-correct', label = null) {
        const { x, y } = this._noteXY(stringIndex, fret);
        const r = this._noteR(fret);

        const circle = svg('circle', {
            cx: x, cy: y, r, class: `fretboard-highlight ${cssClass}`,
            'pointer-events': 'none',
        });

        const text = label ?? chromaticToName(
            noteAt(stringIndex, fret, this.tuning),
            this.notation, this.showSharps || !this.showFlats
        );
        const t = svg('text', {
            x, y, class: 'fretboard-highlight-text',
            'text-anchor': 'middle', 'dominant-baseline': 'central',
            'pointer-events': 'none',
        });
        t.textContent = text;

        this.highlightGroup.appendChild(circle);
        this.highlightGroup.appendChild(t);
        this._highlights.push(circle, t);
    }

    clearHighlights() {
        for (const el of this._highlights) el.remove();
        this._highlights = [];
    }

    updateSettings(options) {
        if (options.tuning) this.tuning = getTuning(options.tuning);
        if (options.notation !== undefined) this.notation = options.notation;
        if (options.showSharps !== undefined) this.showSharps = options.showSharps;
        if (options.showFlats !== undefined) this.showFlats = options.showFlats;
        if (options.horizontal !== undefined) this.horizontal = options.horizontal;
        if (options.stringLabels !== undefined) this.stringLabels = options.stringLabels;
        if (options.showFretNumbers !== undefined) this.showFretNumbers = options.showFretNumbers;
        if (options.soundEnabled !== undefined) this.soundEnabled = options.soundEnabled;
        if (options.displayStartFret !== undefined) this.displayStartFret = options.displayStartFret;
        if (options.displayEndFret !== undefined) this.displayEndFret = options.displayEndFret;
        this._computeLayout();
        this.render();
    }
}
