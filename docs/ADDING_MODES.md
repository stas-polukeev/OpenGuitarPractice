# Adding New Practice Modes

## Backend

1. Create a directory under `backend/modes/your_mode_name/`
2. Add these files:

### `__init__.py`
Empty file.

### `router.py`
```python
from fastapi import APIRouter

MODE_META = {
    "slug": "your-mode-name",
    "name": "Your Mode Name",
    "description": "What this mode does",
}

router = APIRouter()

@router.post("/challenge")
def create_challenge():
    ...

@router.post("/answer")
def submit_answer():
    ...
```

### `logic.py`
Game logic for challenge generation and answer validation.

### `models.py`
Pydantic request/response schemas.

## Frontend

1. Create a directory under `frontend/js/modes/your-mode-name/`
2. Add `index.js`:

```javascript
import { ModeBase } from '../mode-base.js';

export default class YourMode extends ModeBase {
    async activate(container, fretboard) {
        super.activate(container, fretboard);
        // Set up UI and start game loop
    }

    deactivate() {
        super.deactivate();
        // Clean up
    }
}
```

3. Register in `frontend/js/modes/mode-registry.js`:

```javascript
const MODE_MODULES = {
    'find-the-note': () => import('./find-the-note/index.js'),
    'your-mode-name': () => import('./your-mode-name/index.js'),  // Add this
};
```

4. Optionally add CSS at `frontend/css/modes/your-mode-name.css` and link it in `index.html`.

## Checklist

- [ ] `MODE_META` in `router.py` has unique `slug`
- [ ] Backend router has `challenge` and/or `answer` endpoints
- [ ] Frontend mode extends `ModeBase`
- [ ] Mode registered in `mode-registry.js`
- [ ] Tests added under `tests/backend/modes/`
