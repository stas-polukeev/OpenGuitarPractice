# Open Guitar Practice

A mobile-first Progressive Web App for self-teaching music theory on guitar. Works offline as a PWA — install it on your phone's home screen and practice anywhere.

## What's Inside

### Practice Modes
- **Find the Note** — a note and string are shown, find it on the fretboard. Tracks score, streak, and supports a configurable timer.
- **Guitar Practice** — auto-advancing flashcards. Notes appear on a timer; the answer is revealed and played after the countdown. Supports random notes or scale traversal.
- **Interval Training** — a root note is highlighted on the fretboard, find the requested interval. Plays both notes together on correct answer.
- **Scale Practice** — walk through a scale position note by note, ascending then descending.

### Theory Reference
Interactive fretboard visualizations with collapsible educational descriptions:
- **Intervals** — chromatic interval map showing all intervals from a root, or focus on a single interval. Supports compound intervals (>octave).
- **Minor Scale** — natural minor positions (CAGED) and 3-notes-per-string patterns.
- **Major Scale** — natural major with the same position/3NPS views.
- **Minor Pentatonic** — all 5 standard positions with correct guitar-specific patterns.
- **Major Pentatonic** — relative major pentatonic positions.

Each theory page links directly to a related practice exercise.

### Features
- SVG fretboard with real guitar fret spacing ratio
- Vertical and horizontal orientation
- Karplus-Strong synthesized guitar sound (mellow/bright)
- 3 notation systems: English (A B C), Russian (До Ре Ми), Latin (Do Re Mi)
- Toggleable sharps/flats, string numbering (notes or 1-6), fret numbers
- Zoom slider for fitting any screen size
- All settings saved to localStorage
- PWA with offline support — all exercises work without a server
- Dark theme, mobile-first design

## Installation

### Docker (recommended)

```bash
git clone https://github.com/stas-polukeev/OpenGuitarPractice.git
cd OpenGuitarPractice
docker compose up -d
```

Open [http://localhost:8000](http://localhost:8000)

> **Note:** If Docker can't reach PyPI (common behind VPNs/tunnels), add to `/etc/docker/daemon.json`:
> ```json
> {"mtu": 1400, "dns": ["8.8.8.8"]}
> ```
> Then `sudo systemctl restart docker` and retry.

### Without Docker

```bash
git clone https://github.com/stas-polukeev/OpenGuitarPractice.git
cd OpenGuitarPractice
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Install as PWA (phone)

1. Open the app URL in **Safari** (iOS) or **Chrome** (Android)
2. Tap Share > **"Add to Home Screen"**
3. The app installs with an icon and works offline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.13) |
| Frontend | Vanilla JS, ES modules, no build step |
| Fretboard | SVG with real guitar fret ratio |
| Audio | Web Audio API (Karplus-Strong synthesis) |
| Deployment | Docker Compose |
| Storage | localStorage (no database) |

## Project Structure

```
backend/
  theory/          Music theory (notes, fretboard, tunings, intervals)
  modes/           Practice mode plugins (auto-discovered)
  routers/         API endpoints
frontend/
  js/theory/       JS mirrors of backend theory
  js/modes/        Exercise mode implementations
  js/pages/        Theory page renderers
  js/components/   Fretboard SVG, settings panel, feedback
  js/services/     API client, audio, settings, event bus
  sw.js            Service worker for offline PWA
tests/             pytest backend tests
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — design decisions and data model
- [Adding Modes](docs/ADDING_MODES.md) — how to create new practice modes
- [API Reference](docs/API.md) — backend endpoint documentation

## License

MIT
