# Guitar Training

A mobile-first web app for self-teaching music theory on guitar. Practice identifying notes on the fretboard with interactive exercises.

## Features

- **Find the Note** - Locate notes on a virtual fretboard
- **3 notation systems** - English (A B C), Russian, Latin (Do Re Mi)
- **Mobile-first** - Designed for phone use in portrait orientation
- **SVG fretboard** - Scales to any screen, accurate logarithmic fret spacing
- **Modular modes** - Plugin architecture for adding new practice modes
- **No account needed** - Settings stored locally in your browser

## Quick Start

### Docker (recommended)

```bash
git clone <repo-url> && cd guitar_training
docker compose up
```

Open http://localhost:8000

### Local development

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| Port | 8000 | Set in `docker-compose.yml` |

In-app settings (notation, tuning, fret range) are stored in localStorage.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Design decisions and project structure
- [Adding Modes](docs/ADDING_MODES.md) - How to create new practice modes
- [API Reference](docs/API.md) - Backend endpoint documentation

## License

MIT
