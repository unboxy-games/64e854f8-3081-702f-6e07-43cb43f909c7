# Space Invaders — Classic Vertical Shooter

## What this game is
Genre: Arcade shoot-em-up (Space Invaders)
Orientation: Portrait (720×1280)
Core mechanic: Player ship at bottom moves left/right (←/→ or A/D), shoots upward (↑ or Space). Three waves of enemies must be cleared.

## Currently implemented
- Player ship: cyan delta-wing fighter with cockpit, swept wings, engine glow; spawned from world scene
- 3 Lives — heart display top-right; 2.2s invincibility + flash on hit
- Score (top-left), Wave (top-center), Lives (top-right) HUD
- Wave 1: 12 grunts in 3×4 grid — HP 1, 100 pts each; lime-green crab aliens with antennae + claws
- Wave 2: 6 bombers in V-formation (tip toward player) — HP 2, 300 pts; orange diamond ships with cannons
- Wave 3: 1 boss — HP 15, 2000 pts; red hexagonal behemoth with dual cannon arms + central eye
- Enemies move side-to-side, drop downward on edge hit; speed accelerates per wave and as numbers thin
- Regular enemies fire single shots; boss fires 3-way spread at 700ms intervals
- Particle + shockwave explosion on enemy death (bigger burst for boss)
- Wave banner overlay on each wave start
- GAME OVER + VICTORY overlays with Space-to-restart
- Starfield background with nebula wisps, player zone separator line

## Key implementation details
- **Player**: world scene entity (`public/scenes/world/main.json`), role: `player`; physics body 44×40 centered on 60×70 visual
- **Enemies & bullets**: all prefabs in `manifest.prefabs[]`, spawned via `spawnPrefab(this, prefabId, x, y)`
- **HP tracking**: each spawned enemy stores `currentHp` via `setData`; `entityProperties.hp` is the max from the prefab
- **Enemy movement**: `body.reset(x, y)` each frame to move with delta; direction flipped + `DROP_Y` applied on boundary hit
- **Groups**: `this.add.group()` (not physics group) — spawnPrefab already attaches arcade body
- **Render scripts**: `src/visuals/` — player-ship, enemy-grunt, enemy-bomber, enemy-boss, player-bullet, enemy-bullet
- **Rules**: `public/rules.json` — all tunables annotated with `_meta_` for editor sliders

## What changed this turn
- Built entire game from scratch: 6 visual scripts, full GameScene with 3-wave system, world scene, manifest prefabs, rules.json
