# Platformer Quest

## Game
Side-scrolling platformer. Player uses arrow keys to move left/right, Space (or Up arrow) to jump. Reach the glowing exit door on the right to win.

## Features Implemented
- **Player**: code-rendered blue humanoid with hair, eyes, belt; arrow key movement + Space/Up jump; horizontal flip on direction change
- **Platforms**: ground + 3 floating platforms at increasing heights (left/low, center/mid, right/high); stone-colored with a lighter top edge
- **Exit door**: green glowing door on the right side of the highest platform; reach it to win (+500 score)
- **2 patrol enemies**: red horned blobs that reverse direction at platform edges; stomp from above to kill (+200); touch from side to lose a life
- **3 coins**: golden coins scattered above platforms; collect for +100 score each
- **HUD**: Score (top-left, gold) and Lives (top-right, red) via dynamic registry bindings in game-hud.json
- **Lives**: 3 lives; respawn at left after hit; game-over screen if all lost
- **Win screen**: shown on exit door reached
- **R key**: restart from any end screen
- **Background**: night sky with crescent moon, stars, and silhouette hills

## Key Implementation Details
- **Scene**: `public/scenes/world/main.json` — player, ground, 3 platforms + decoration strips, exit door, 3 coins
- **Prefab**: `enemy_patroller` in `manifest.json` — spawned via `spawnPrefab` in GameScene for both enemies
- **HUD**: `public/scenes/hud/game-hud.json` — score binding `"score"`, lives binding `"lives"` 
- **Render scripts**: `src/visuals/player.ts`, `src/visuals/coin.ts`, `src/visuals/exit-door.ts`, `src/visuals/enemy-patroller.ts`
- **Physics**: gravity 800 set both in world JSON and GameScene (`this.physics.world.gravity.y = 800`)
- **Platforms**: static bodies via `physics.add.existing(go, true)`; individual `physics.add.collider` per platform
- **Stomp**: detected by `playerBody.velocity.y > 50 && player.y < enemy.y - 8`
- **Patrol flip**: `go.setScale(-1, 1)` for left-facing direction

## Level Layout (1280×720)
- Ground: y=700, full width
- Platform 1 (left, low): x=280, y=540, w=280 → top at y=529
- Platform 2 (center, mid): x=650, y=400, w=260 → top at y=389
- Platform 3 (right, high): x=1060, y=260, w=280 → top at y=249
- Exit door: x=1155, y=221 (on platform 3)
- Coins: x=220/y=490 (above P1), x=650/y=350 (above P2), x=970/y=205 (above P3)
- Player spawn: x=80, y=620

## What Changed This Turn
- Built entire game from scratch (new project): all render scripts, scene data, HUD, GameScene behavior, UIScene simplified
