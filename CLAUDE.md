# Space Invaders — Classic Vertical Shooter

## What this game is
Genre: Arcade shoot-em-up (Space Invaders)
Orientation: Portrait (720×1280)
Core mechanic: Player ship at the bottom moves left/right (arrows / A-D), shoots upward (Space / Up). Three waves of enemies must be cleared.

## Currently implemented
- **Player**: cyan triangle ship at bottom-center; moves left/right; shoots plasma bolts upward; 3 lives with ♥ display; 2.2s invincibility frames on hit
- **HUD**: Score (top-left), Wave (top-center), Lives (top-right) — all in-scene at depth 10
- **Wave 1**: 12 grunts in 3×4 grid — lime-green crab aliens, HP 1, 100 pts each
- **Wave 2**: 6 bombers in V-formation — orange diamond ships, HP 2, 300 pts each
- **Wave 3**: 1 boss — large red hex-body multi-cannon, HP 15, 2000 pts; fires 3-way spread
- **Enemy AI**: All enemies move side-to-side, drop 26px when hitting screen edges; accelerate as numbers thin; boss fires faster (720ms) than grunts/bombers (1350ms)
- **Particle explosions** on every kill (bigger for boss); shockwave ring effect
- **Wave banner** shown on wave start (fade in/hold/fade out)
- **Game Over overlay**: score shown, Space to retry
- **Victory overlay**: final score shown, Space to replay
- Starfield background (seeded RNG, deterministic), nebula wisps, player zone line
- High-score persistence not yet added

## Key implementation details
- **Player entity**: defined in `public/scenes/world/main.json`, loaded via `loadWorldScene`; physics body centered with `setOffset(-22, -19)`
- **Enemy/bullet visuals**: pure Graphics render scripts in `src/visuals/`, resolved via `resolveRenderScript`
- **Enemy movement**: direct `e.x += dx` per frame; direction flip + y-drop when edges at x=55 / x=665 are crossed
- **Wave management**: manual `time.delayedCall` stagger; `waveSpawnComplete` flag + active-children count check in `update()`
- **Render scripts**: `player-ship.ts`, `enemy-grunt.ts`, `enemy-bomber.ts`, `enemy-boss.ts`, `player-bullet.ts`, `enemy-bullet.ts`
- **tsconfig**: Added `"types": ["vite/client"]` for `import.meta.glob` in `src/visuals/index.ts`

## What changed this turn
- Built entire game from scratch: 6 visual scripts, full GameScene with 3-wave logic, updated world scene + manifest, tsconfig Vite types fix
