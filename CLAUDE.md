# Platformer Adventure

## What this game is
A side-scrolling platformer. The player jumps across three floating stone platforms to reach an exit door, collects coins along the way, and avoids two patrolling enemies.

## Genre / core mechanic
- Side-scrolling platformer — jump (Space), move (arrow keys)
- Collect 3 coins for score, reach the exit door to win
- Two enemies patrol their platforms back-and-forth
- Start with 3 lives; hitting an enemy respawns you and costs a life
- Lives reach 0 → Game Over; reach the door → Win screen

## Features implemented
- **Player**: code-rendered character (blue shirt, cap), 32×56 visual, 22×46 physics body, gravity + collide-world-bounds
- **Three platforms** at different heights: low (y=540), mid (y=400), high (y=260), drawn with grass-on-top stone style via `platform-tile.ts` render script
- **Ground**: full-width primitive rectangle at y=702
- **Exit door**: right side of platform 3 (x=1160, y=222), green glow, drawn with `door-exit.ts`
- **Three coins**: one per platform, floating tween, gold coin drawn with `coin-item.ts`. Score pop-up on collect, registry `coins` binding in HUD
- **Two enemies**: `enemy` prefab (red goblin, 32×32), patrol platform 1 (x=140–370) and platform 2 (x=510–760), reverse direction at patrol bounds
- **HUD**: score (top-left), lives (top-right, red), coins collected (top-center, gold) — all dynamic-bound via Phaser registry
- **Physics**: arcade physics, global gravity y=900 in main.ts
- **Win/Game-Over screen**: overlay + animated title, score + coins display, SPACE to restart
- **Invincibility**: 2s after hit, flicker tween
- **Background**: drawn in GameScene.create() — dark sky gradient, stars, moon (crescent), silhouetted hills

## Key implementation details
- `src/visuals/player-char.ts` — player render script (pure)
- `src/visuals/enemy-char.ts` — enemy render script (pure)
- `src/visuals/coin-item.ts` — coin render script (pure)
- `src/visuals/door-exit.ts` — door render script (pure)
- `src/visuals/platform-tile.ts` — platform render script (pure), takes `width`/`height` params
- `public/scenes/manifest.json` — enemy prefab (`id: "enemy"`, `role: "enemy"`, physics block with bodyW=26 bodyH=26 offset=3)
- `public/scenes/world/main.json` — all world entities (player, ground, 3 platforms, 3 coins, door)
- `public/scenes/hud/game-hud.json` — score/lives/coins via dynamic bindings
- `public/rules.json` — tunable balance values (lives, playerSpeed, jumpVelocity, enemySpeed, scorePerCoin)
- `src/scenes/GameScene.ts` — all behavior: physics setup, colliders, overlap handlers, enemy patrol in update()
- `src/main.ts` — gravity `{ x: 0, y: 900 }` added to createUnboxyGame physics config

## Changes in last turn
- Created the entire game from scratch (new workspace)
- Built all 5 render scripts, scene JSON, manifest (with enemy prefab), HUD JSON, rules.json, GameScene.ts
- Fixed TypeScript tsconfig to include `"types": ["vite/client"]` for import.meta.glob
