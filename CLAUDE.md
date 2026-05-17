# Space Invaders Shooter

## Game overview
- **Genre**: Vertical space shooter (classic arcade style)
- **Core mechanic**: Player ship at the bottom shoots upward; 18 alien enemies in a 6×3 grid march side-to-side and slowly descend. Destroy all enemies to win. Lose all 3 lives to get Game Over.

## Features implemented
- Player ship drawn with Phaser Graphics (cyan triangular ship with cockpit, wings, engine nozzles)
- 18 enemies in 6 columns × 3 rows, each row a distinct colour palette (red / orange / green)
  - Alien faces with eyes, antennae, legs, mouth with teeth
- Enemies march left/right, reverse direction and descend when hitting screen edges
- March speed increases as enemy count drops (classic speedup)
- Random enemy shoots a bullet every ~1.1 s
- Player bullets: shoot upward (SPACE one-shot, or hold UP arrow for auto-fire)
- Player movement: LEFT/RIGHT arrows or A/D keys
- Invincibility flash after being hit (1.25 s, 12-frame blink)
- Score +10 per kill, floating "+10" popup on each hit
- Explosion VFX: expanding ring + 12 spark tweens (no particle API needed)
- Scrolling star field (parallax speed variation)
- Nebula colour hints in background
- HUD (UIScene): SCORE top-left, ♥♥♥ lives top-right — connected via Phaser registry
  - Score text bounces on every update
  - Camera shake on life lost
- Game Over / You Win overlay with score display; SPACE or tap restarts
- Enemies touching the player zone (y > GAME_HEIGHT - 170) also triggers Game Over

## Key implementation details
- `GameScene.ts` — uses `loadWorldScene('main')` + `spawnPrefab`; game logic inline
- `UIScene.ts` — launched once, listens to `this.registry.events.on('changedata')` for score/lives — survives GameScene.restart()
- Registry keys: `score` (number), `lives` (number)
- All visuals drawn with Phaser Graphics API (no external sprites)
- Collision: manual AABB distance checks (no physics engine)
- Enemy march stored in `enemies[]` array; each enemy has `{gfx, x, y, alive, row}`
- Enemy marching moves `gfx.x` / `gfx.y` — no redraw per frame

## Editor-editable entities
- **Player ship** — scene entity in `public/scenes/world/main.json`; params: `bodyColor`, `cockpitColor`, `engineColor`
- **Enemy grunts** — 3 prefab types in `manifest.json`: `enemy_grunt_row0` (red), `enemy_grunt_row1` (orange), `enemy_grunt_row2` (green); render script: `src/visuals/enemy-grunt.ts`; params per row: `bodyColor`, `highlightColor`, `darkColor`, `eyeGlowColor`

## Controls
- Move: ← → (arrows) or A / D
- Shoot: SPACE (single shot) or ↑ (held auto-fire)
- Retry: SPACE or tap after Game Over / You Win

## This turn
- Migrated enemy grunts to 3 prefab entries in `manifest.json` (one per row palette)
- Extracted alien drawing to `src/visuals/enemy-grunt.ts` render script (draws at origin)
- `buildEnemyGrid()` now uses `spawnPrefab(this, 'enemy_grunt_rowN', x, y)`
- `marchEnemies()` now sets `gfx.x = e.x; gfx.y = e.y` instead of redrawing
- Removed the inline `drawEnemy()` private method from GameScene
