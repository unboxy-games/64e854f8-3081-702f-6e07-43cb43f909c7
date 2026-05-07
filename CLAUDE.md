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

## Scene data files
- `public/scenes/manifest.json` — asset table + scene list
- `public/scenes/world/main.json` — player entity at (640, 360), depth 2

## Key implementation details
- **BootScene**: calls `preloadManifest(this)` in `preload()`, reads `getManifest(this)` in `create()`, passes `{ sceneId: manifest.initialScene }` to GameScene
- **GameScene**: async `create()` calls `loadWorldScene(this, this.sceneId)`, retrieves player via `registry.byRole('player')[0]`, adds Arcade physics, movement inlined in `update()`
- **Player entity**: id `"player"`, role `"player"`, sprite `playerlife1_blue`, at (640, 360), depth 2
- **Player.ts**: still exists in `src/objects/` but is no longer used — movement is inlined in GameScene
- Controls: arrow keys

## Changes this turn
- Migrated to scene-as-data architecture
- Created `public/scenes/manifest.json` with asset record for `playerlife1_blue`
- Created `public/scenes/world/main.json` with player entity declaration
- Rewrote BootScene to use `preloadManifest` / `getManifest` (SDK 0.2.17)
- Rewrote GameScene to use `loadWorldScene` / `getEntityRegistry`; movement logic inlined
- Removed direct `new Player(...)` construction; physics attached to registry-spawned sprite
