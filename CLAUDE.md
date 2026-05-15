# Space Shooter

**Genre:** Vertical space shooter (Space Invaders / Galaga style)
**Orientation:** Landscape (1280 × 720)

## Game Overview
The player pilots a blue fighter ship at the bottom of the screen, blasting waves of alien enemies that descend from the top in classic Space Invaders formation style.

## Controls
- **Arrow Left / Right** — move player ship
- **Spacebar** — fire bullet
- **R** — restart after Game Over

## Features Implemented
- **Player ship** — rendered with Graphics API (blue fighter with cyan wing tips, orange engine glow, cannon)
- **Enemy ships** — 4 visual types (red, orange, purple, green) corresponding to formation rows; all drawn with Graphics API
- **Bullet system** — Phaser Arcade Physics group, pooled up to 15 shots; muzzle flash tween on each shot
- **Enemy formation movement** — classic Space Invaders pattern: formation moves sideways, drops down and reverses when hitting screen edge; speed increases on each bounce and each wave
- **Collision detection** — Phaser overlap callbacks: bullet-vs-enemy, player-vs-enemy, enemy-bullet-vs-player
- **Scoring** — top-row enemies worth 40 pts, bottom rows 30/20/10; score pop-up on kill; score persists across waves
- **Lives system** — 3 lives; player flashes invincible for ~1 second after being hit; at 0 lives → Game Over
- **Wave progression** — each wave adds more columns/rows and faster formation speed; wave number banner shown on spawn
- **Game Over screen** — red overlay with final score, wave reached, and blinking "R to restart" hint
- **HUD (UIScene)** — score (top-left) with scale-pop on change; mini ship icons for lives (top-right)
- **Enemy shooting** — enemies fire red/orange bolts downward; only the bottom-most enemy per column fires (classic SI rule); rate starts at 1.8 s and decreases by 120 ms per wave (floor 500 ms); hit drains a life + invincibility flash + orange hit-flash on player
- **Visual polish** — scrolling star field (100 stars, varied speed/alpha), ambient nebula bands, explosion particles (14 sparks, random fire tints), score pop-up text floats up and fades

## Architecture
- `GameScene.ts` — all gameplay logic (textures built with generateTexture, physics, waves, collisions, effects, game over)
- `UIScene.ts` — HUD overlay launched from GameScene; listens to `updateScore` and `updateLives` events
- `BootScene.ts` — unchanged scaffold (loads manifest, starts GameScene)
- All textures generated programmatically via `this.add.graphics()` + `generateTexture()`
- Enemy formation movement: velocity-based with boundary detection + cooldown flip guard

## This Session
- Built the entire game from scratch (fresh workspace)
- Fixed tsconfig.json to include `"types": ["vite/client"]` to resolve pre-existing `import.meta.glob` TypeScript error
- Added enemy shooting: red/orange bolts, column-bottom-shooter selection, escalating rate per wave, hit-flash feedback, restart cleanup
