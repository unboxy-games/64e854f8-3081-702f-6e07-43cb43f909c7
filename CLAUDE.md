# Game: Starter project

## Genre / Mechanic
Starter project — player sprite placed in the scene, moveable with arrow keys.

## Architecture
Scene-as-data (migrated). Layout lives in `public/scenes/`; behavior lives in `src/`.

## Features implemented
- `playerlife1_blue.png` loaded as the player sprite (uploaded asset)
- Player centred on screen with arrow-key movement (physics body, inlined in GameScene)
- Idle bob tween on the player (kept from original design)
- Gradient background (dark blue theme, code-rendered in GameScene)
- Loading bar in BootScene for asset loading
- Entity `e-mowxj6d4-z3ct` (sprite, scale 2x) continuously spins via a 360° tween (1200ms, Linear, repeat -1)

## Scene data files
- `public/scenes/manifest.json` — asset table + scene list
- `public/scenes/world/main.json` — player entity at (640, 360), depth 2

## Key implementation details
- **BootScene**: calls `preloadManifest(this)` in `preload()`, reads `getManifest(this)` in `create()`, passes `{ sceneId: manifest.initialScene }` to GameScene
- **GameScene**: async `create()` calls `loadWorldScene(this, this.sceneId)`, retrieves player via `registry.byRole('player')[0]`, adds Arcade physics, movement inlined in `update()`; entity `e-mowxj6d4-z3ct` looked up via `registry.byId()` for spin tween
- **Player entity**: id `"player"`, role `"player"`, sprite `playerlife1_blue`, at (640, 360), depth 2
- **Player.ts**: still exists in `src/objects/` but is no longer used — movement is inlined in GameScene
- Controls: arrow keys

## Render scripts
- `src/visuals/coin.ts` — golden coin with bevel ring, mid-gold sheen, and specular shine highlight
  - Params: `radius` (default 32), `color` (default #ffd700), `shine` (default true)
  - Referenced by entity `e-mow64k5o-l1ms` in main.json

## Changes this turn
- Added continuous 360° spin tween (1200ms, Linear, repeat forever) to entity `e-mowxj6d4-z3ct` in GameScene
