---
name: demo2-hotzones
description: Maintains and edits Demo2.0 hotzones for NightBedroom, DeskNow, and MemoryBedroom. Use when user mentions hotzone/hitbox/interactive area, D debug adjustment, S export, hotzones.json, or MemoryBedroom reset modal behavior.
---

# Demo2 Hotzones

Use this skill for any Demo2.0 request related to interactive zones, clickable regions, debug adjustment, or hotzone persistence.

## Quick Start

Read files in this order:

1. `Lele/README_DEMO2_CURRENT.md`
2. `Lele/hotzones.json`
3. Target scene file:
   - `Lele/src/scenes/NightBedroomScene.js`
   - `Lele/src/scenes/DeskNowScene.js`
   - `Lele/src/scenes/MemoryBedroomScene.js`

## Current Rules To Preserve

- Keep key behavior stable:
  - `D`: toggle debug mode (from `DebugManager`)
  - arrow keys + `PageUp/PageDown`: move/scale selected editable object
  - `S` (without Ctrl/Meta): export scene hotzones and persist to `localStorage.hotzones`
- Do not replace this with another persistence mechanism unless user explicitly asks.
- Keep `hotzones` schema compatible with existing sections:
  - `nightBedroom`
  - `deskNow`
  - `memoryBedroom`

## Hotzone Change Workflow

When adding or editing a hotzone:

1. In scene `create()`:
   - create rectangle/zone
   - set `name`
   - set interactive handlers
2. Register editable object:
   - `this._debugManager.registerEditableObject(...)`
3. Apply persisted config:
   - update `applyHotzonesConfig(...)`
4. Export persisted config:
   - update `exportHotzonesConfigToDownloadAndStorage(...)`
5. Add default config:
   - update `Lele/hotzones.json`

## Scene-Specific Notes

- `NightBedroomScene`
  - Uses `playArea` as edit rect.
  - `deskHotzone` and `computerHotzone` both enter `DeskNow`.
- `DeskNowScene`
  - Has `computerHotzone`, `textHotzone1`, `textHotzone2`.
  - Text hotzones open `text_1/text_2` overlays.
- `MemoryBedroomScene`
  - `deskHotzone` opens in-scene reset modal.
  - Reset is button-driven (not Enter-triggered).

## Cross-Session Checklist

- [ ] Hotzone has `name` and is registered as editable.
- [ ] Click behavior is blocked during debug mode to avoid accidental scene jumps.
- [ ] `applyHotzonesConfig` and export both include the hotzone.
- [ ] `Lele/hotzones.json` has a default entry for the hotzone.
- [ ] `S` export writes `localStorage.hotzones` and triggers `hotzones.json` download.

## Related Files

- `Lele/src/utils/DebugManager.js`
- `Lele/hotzones.json`
- `Lele/README_DEMO2_CURRENT.md`
