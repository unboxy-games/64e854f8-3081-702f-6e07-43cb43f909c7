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
- **Player** — entity `e-moxp46bt-of5e`, role `"player"`, assetId `basic_character_spritesheet`, scale 2, at (408, 539). No explicit depth — controlled by ySort.
  - Arrow keys move the player; collides with world bounds
  - Plays walk-down/up/left/right when moving; freezes on last frame when idle
  - Narrow foot hitbox (50% width, 30% height, offset to bottom of sprite)
- **Water well** — entity `e-water-well-001`, role `"well"`, assetId `water_well`, scale 3, at (640, 350). Static physics body. No explicit depth — controlled by ySort.
  - Player cannot walk through it (Arcade collider)
  - Y-sorted with the player: player walks behind well when above, in front when below
- `ySort: true` enabled on main.json — SDK auto-sets `sprite.depth = sprite.y` each frame for entities with no explicit depth

## Scene data files
- `public/scenes/manifest.json` — asset table + scene list
- `public/scenes/world/main.json` — entities including player and well; `ySort: true`
- `public/scenes/hud/game-hud.json` — HUD widgets including the clock widget

## Key implementation details
- **BootScene**: calls `preloadManifest(this)` in `preload()`, reads `getManifest(this)` in `create()`, passes `{ sceneId: manifest.initialScene }` to GameScene
- **GameScene**: async `create()` calls `loadWorldScene(this, this.sceneId)`, retrieves player via `registry.byRole('player')[0]`, adds Arcade physics, movement + animation inlined in `update()`; retrieves well via `registry.byRole('well')[0]`, adds static Arcade physics body; collider added between player and well
- **basic_character_spritesheet**: 48×48 frames, 8 fps, 4 walk anims only (no idle). Registered in manifest with `spriteSheetConfig: { frameWidth: 48, frameHeight: 48 }`. Animations: walk-down (0-3), walk-up (4-7), walk-left (8-11), walk-right (12-15)
- **water_well**: plain image asset. Static hitbox: 50% of displayWidth, 30% of displayHeight, shifted down 12% into the base
- **Player.ts**: still exists in `src/objects/` but is not used — movement is inlined in GameScene
- Controls: arrow keys

## Render scripts
- `src/visuals/coin.ts` — golden coin with bevel ring, mid-gold sheen, and specular shine highlight
  - Params: `radius` (default 32), `color` (default #ffd700), `shine` (default true)
  - Referenced by entity `e-mow64k5o-l1ms` in main.json

## Assets
- `square_button_19x26` — 19×26 px button sprite, registered in manifest with ninePatch `{ leftWidth:4, rightWidth:4, topHeight:4, bottomHeight:4 }`
- `basic_character_spritesheet` — 48×48 character spritesheet with 4 walk directions
- `water_well` — single-frame well image

## HUD entities (game-hud.json)
- `test-9slice-btn` — icon-button, anchored center, 200×64, label "Click me", backgroundAssetId `square_button_19x26`

## Changes this turn
- Imported `basic_character_spritesheet.png` and `water_well.png` into `public/uploaded/`
- Added both assets to manifest.json (spritesheet with 4 walk animations + image)
- Replaced player entity's assetId from `premium_character_spritesheet` to `basic_character_spritesheet`, scale 2, removed explicit depth
- Added water well entity (`e-water-well-001`, role `"well"`) at (640, 350), scale 3, no explicit depth
- Enabled `ySort: true` on main.json for automatic depth-by-Y on player and well
- Updated GameScene: narrow foot hitbox on player, static physics body on well, player↔well collider, idle now freezes on last walked frame (no idle anims in basic sheet)
