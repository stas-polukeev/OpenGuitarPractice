# Architecture

## Overview

```
Browser (Vanilla JS)  ──HTTP──>  FastAPI (Python 3.13)
     │                                │
     ├── SVG Fretboard               ├── Music Theory (notes, fretboard, tunings)
     ├── Settings (localStorage)     ├── Practice Modes (auto-discovered plugins)
     └── Mode UI                     └── Static File Serving
```

## Tech Stack Rationale

- **FastAPI**: Simple, fast, great Pydantic validation, serves both API and static files
- **Vanilla JS**: No build step, ES modules work natively, simpler deployment
- **SVG**: Vector graphics scale perfectly on any device, easy tap target creation
- **Docker Compose**: Single command deployment on homeserver

## Music Theory Data Model

**Canonical representation**: chromatic index 0-11

```
C=0  C#=1  D=2  D#=3  E=4  F=5  F#=6  G=7  G#=8  A=9  A#=10  B=11
```

Three parallel notation systems map these indices to display names. The `prefer_sharps` flag controls whether accidentals show as sharps or flats.

Theory logic is duplicated in Python and JS: backend validates answers, frontend renders instantly without round-trips.

## Plugin Architecture

### Backend
Each mode is a subdirectory under `backend/modes/` containing:
- `router.py` with a `MODE_META` dict and a FastAPI `router`
- `logic.py` with game logic
- `models.py` with Pydantic schemas

The registry (`backend/modes/registry.py`) auto-discovers modes at startup using `importlib` and mounts their routers under `/api/modes/{slug}/`.

### Frontend
`frontend/js/modes/mode-registry.js` maps slugs to dynamic imports. Each mode exports a class extending `ModeBase` with `activate()` and `deactivate()` methods.

## SVG Fretboard

- Vertical orientation (nut at top) for mobile portrait
- Layered SVG groups: neck, frets, dots, strings, labels, tap targets, highlights
- Logarithmic fret spacing mimics real guitar proportions
- Invisible tap target rectangles ensure minimum 44x44px touch areas
- String thickness varies (thicker for bass strings)

## Settings Flow

```
localStorage ──> SettingsManager ──> EventBus ──> Fretboard + Active Mode
                      │
                 Two layers:
                 - Global (notation, tuning) — shared across modes
                 - Per-mode (fret range, etc.) — independent per mode
```

Every API call sends settings as request parameters (backend is stateless).

## Project Structure

```
backend/
  main.py              # FastAPI app, static serving, router mounting
  config.py            # Paths and constants
  theory/              # Music theory (notes, fretboard, tunings)
  modes/               # Practice mode plugins (auto-discovered)
    find_the_note/     # First mode: find notes on fretboard
  routers/             # Theory and settings API endpoints
  schemas/             # Shared Pydantic models

frontend/
  index.html           # SPA shell
  css/                 # Styles (main, fretboard, per-mode)
  js/
    app.js             # Bootstrap and initialization
    config.js          # Constants and defaults
    theory/            # JS mirrors of backend theory
    components/        # Fretboard SVG, feedback, settings panel
    services/          # API client, settings manager, event bus
    modes/             # Mode plugins (lazy-loaded)
```
