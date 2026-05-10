# Game: Starter project

## Genre / Mechanic
Starter project — player sprite placed in the scene, moveable with arrow keys.

## Architecture
Scene-as-data (migrated). Layout lives in `public/scenes/`; behavior lives in `src/`.

## Features implemented
- Gradient background (dark blue theme, code-rendered in GameScene)
- Loading bar in BootScene for asset loading
- Entity `e-mowxj6d4-z3ct` (sprite, scale 2x) continuously spins via a 360° tween (1200ms, Linear, repeat -1)
- HUD text widget `e-moxb2ad6-7vwg` shows the current wall-clock time (HH:MM:SS), updated every second via registry binding `currentTime`
- Entity `e-moxp46bt-of5e` — Sprout Lands character (premium_character_spritesheet, scale 2x) is the controllable player:
  - Arrow keys move it around, collides with world bounds
  - Plays walk-down/up/left/right when moving in that direction
  - Plays idle-down/up/left/right when still, based on last held direction
  - Starts in idle-down pose

## Scene data files
- `public/scenes/manifest.json` — asset table + scene list
- `public/scenes/world/main.json` — entities including the player
- `public/scenes/hud/game-hud.json` — HUD widgets including the clock widget

## Key implementation details
- **BootScene**: calls `preloadManifest(this)` in `preload()`, reads `getManifest(this)` in `create()`, passes `{ sceneId: manifest.initialScene }` to GameScene
- **GameScene**: async `create()` calls `loadWorldScene(this, this.sceneId)`, retrieves player via `registry.byRole('player')[0]`, adds Arcade physics, movement + animation inlined in `update()`; `lastDirection` tracks the last pressed direction for idle anim fallback; entity `e-mowxj6d4-z3ct` looked up via `registry.byId()` for spin tween; clock timer sets `currentTime` in game registry every 1000ms
- **Player entity**: id `"e-moxp46bt-of5e"`, role `"player"`, assetId `"premium_character_spritesheet"`, at (408, 539), scale 2, depth 10
- **Spritesheet**: `uploaded/premium_character_spritesheet.png`, 48×48 frames, 8 fps. Animations registered via manifest.json: idle-down (0-7), idle-up (8-15), idle-right (16-23), idle-left (24-31), walk-down (32-39), walk-up (40-47), walk-right (48-55), walk-left (56-63) — note left/right frame ranges are swapped vs. the original sheet labelling for both idle and walk rows
- **Player.ts**: still exists in `src/objects/` but is not used — movement is inlined in GameScene
- Controls: arrow keys

## Render scripts
- `src/visuals/coin.ts` — golden coin with bevel ring, mid-gold sheen, and specular shine highlight
  - Params: `radius` (default 32), `color` (default #ffd700), `shine` (default true)
  - Referenced by entity `e-mow64k5o-l1ms` in main.json

## Assets
- `square_button_19x26` — 19×26 px button sprite, registered in manifest with ninePatch `{ leftWidth:4, rightWidth:4, topHeight:4, bottomHeight:4 }`

## HUD entities (game-hud.json)
- `test-9slice-btn` — icon-button, anchored center, 200×64, label "Click me", backgroundAssetId `square_button_19x26`

## Changes this turn
- Imported `square_button_19x26.png` into `public/uploaded/`
- Added ninePatch metadata to the manifest asset entry for `square_button_19x26`
- Added `test-9slice-btn` icon-button entity (center-anchored, 200×64, nine-slice button background) to the HUD
