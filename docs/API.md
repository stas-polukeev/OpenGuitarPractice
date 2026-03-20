# API Reference

Base URL: `/api`

## Modes

### `GET /api/modes`
List available practice modes.

**Response:**
```json
[
    {
        "slug": "find-the-note",
        "name": "Find the Note",
        "description": "Find the requested note on the fretboard"
    }
]
```

## Theory

### `GET /api/theory/fretboard`
Get full fretboard note map.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| tuning | string | standard | Tuning slug |
| fret_count | int | 12 | Number of frets (1-24) |

**Response:**
```json
{
    "tuning_slug": "standard",
    "string_names": ["E", "A", "D", "G", "B", "e"],
    "fret_count": 12,
    "notes": [[4, 5, 6, ...], ...],
    "dots": [{"fret": 3, "double": false}, ...]
}
```

### `GET /api/theory/notes`
Get note names for a notation system.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| notation | string | english | Notation system |
| prefer_sharps | bool | true | Use sharps vs flats |

## Settings

### `GET /api/settings/tunings`
List available tunings.

### `GET /api/settings/notations`
List available notation systems.

## Find the Note

### `POST /api/modes/find-the-note/challenge`
Generate a new challenge.

**Request body:**
```json
{
    "tuning": "standard",
    "notation": "english",
    "prefer_sharps": true,
    "min_fret": 0,
    "max_fret": 12,
    "allowed_notes": null
}
```

**Response:**
```json
{
    "challenge_id": "abc123def456",
    "string_index": 2,
    "string_name": "D",
    "note_name": "A",
    "chromatic_index": 9
}
```

### `POST /api/modes/find-the-note/answer`
Validate a fret tap.

**Request body:**
```json
{
    "challenge_id": "abc123def456",
    "fret": 7
}
```

**Response:**
```json
{
    "correct": true,
    "expected_frets": [7],
    "tapped_fret": 7
}
```
