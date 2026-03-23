# Phaser Memory Rewrite Workflow

## Asset authoring conventions

### Background (bg)
- Export at **1280 x 960**.
- In code/layout, treat the background placement as relative to a **1280 x 960 stage** and then adapt to the real viewport with the scene layout rules.

### Small art (editable sprites/images)
- Export at **360 x 340** (current art may be close to this size).
- Default scale for small art: **0.40** (so `scaleX = 0.40` and `scaleY = 0.40`).
- If you introduce a different size, tell me first and we will sync the workflow before adding presets.

## Scene editable object rules

1. Any visual object that should be editable in the debug workflow must be assigned a stable key:
   - `obj.name = '<key>'`
2. The key must match the structure inside `Lele/ui_config.json` for that scene.

## Debug editing workflow (recommended)

1. Start the game and press `D` to toggle debug mode.
2. Click an editable object (small-art sprites/images use **pixel-perfect** hit testing for selection).
3. Use keys:
   - Arrow keys (`↑ ↓ ← →`) to move the object by 1 pixel.
   - `PageUp / PageDown` to change scale.
   - `Ctrl + S` to save current positions/scales into `localStorage` (`ui_config`).
4. For persistent “shipping” presets, update `Lele/ui_config.json`.

## Pixel-perfect click rule (opaque pixels only)

For small art that must only be clickable on visible (non-transparent) pixels:
- Use Phaser interactive **pixel-perfect**:
  - `obj.setInteractive({ pixelPerfect: true, alphaTolerance: 1, useHandCursor: ... })`

## Placement coordinate system

Percent-based placement (`xPercent/yPercent`) is relative to each scene’s “edit rect”:
- `NightBedroom`: relative to `playArea` (the viewport area excluding the right sidebar), so `xPercent=50` means “center of play area”.
- Other scenes default to the full canvas rect.

