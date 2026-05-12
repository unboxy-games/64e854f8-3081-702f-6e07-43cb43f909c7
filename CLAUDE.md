# Space Shooter

## Game overview
Classic vertical space-shooter (Galaga / Space Invaders style) in portrait orientation (720×1280). Player controls a spaceship at the bottom of the screen, shoots upward to destroy waves of alien enemies that march back-and-forth and drop downward.

## Features implemented
- **Player ship** — moves left/right (Arrow keys or A/D), shoots upward (Up arrow or Space)
- **3 enemy types** across 3 rows (6 columns each):
  - Row 0 top: Green insects — 1 HP, 10 pts
  - Row 1 middle: Blue crabs — 1 HP, 20 pts
  - Row 2 bottom: Red armoured — 2 HP, 30 pts
- **Wave system** — enemies speed up and fire faster each wave; new wave spawns after clearing the screen
- **Enemy AI** — formation marches side-to-side, drops down on edge reversal; random shooter fires at the player
- **Collision** — player bullets vs enemies, enemy bullets vs player, enemies vs player
- **Lives system** — 3 lives with invincibility blink on hit
- **Score** — running score with HUD pop tween on increase
- **Explosions** — 14-particle burst + white flash on enemy/player death
- **Muzzle flash** — one-shot scale+fade on player firing
- **Wave banner** — fade-in/out announcement text for each new wave
- **Game over screen** — overlay with score, wave reached, tap-to-restart
- **Starfield background** — seeded starfield + nebula blobs, deterministic

## Architecture
- **Scene-as-data**: player is declared in `public/scenes/world/main.json` as a `code-rendered` entity
- **Render script**: `src/visuals/player-ship.ts` draws the blue triangular spaceship with cockpit, wings, engine glow
- **GameScene.ts**: all gameplay logic — enemy spawning, physics, input, HUD, VFX
- Enemies, bullets, and enemy bullets are runtime-spawned `Phaser.GameObjects.Graphics` with arcade physics bodies (NOT in scene data)
- `src/vite-env.d.ts` added to provide `import.meta.glob` types for the visuals registry

## Key constants (src/scenes/GameScene.ts)
- `PLAYER_SPEED` 340 px/s
- `BULLET_SPEED` 700 px/s upward
- `ENEMY_BULLET_SPEED` 290 px/s downward
- `SHOOT_COOLDOWN` 210 ms
- `BASE_ENEMY_SPEED` 55 px/s (+18 per wave)
- `ENEMY_DROP` 26 px per direction reversal
- 3 rows × 6 columns of enemies

## Controls
- **← / A** — move left
- **→ / D** — move right
- **↑ / Space** — fire
- **Tap** — restart after game over

## This turn
- Created the full game from scratch: player render script, scene JSON, full GameScene with all mechanics
