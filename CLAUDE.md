# Space Invaders — Classic Vertical Shooter

## What this game is
Genre: Arcade shoot-em-up (Space Invaders)
Orientation: Portrait (720×1280)
Core mechanic: Player ship at bottom moves left/right (← → or A/D), shoots upward (Space or ↑). Three waves of enemies descend and must be cleared.

## Currently implemented
- **Player ship**: blue-white triangular fighter, spawns at (360, 1170), physics-enabled, collideWorldBounds
- **Wave 1**: 12 grunts in 3×4 grid — HP 1, 100 pts, lime-green crab aliens
- **Wave 2**: 6 bombers in V-formation — HP 2, 300 pts, orange diamond ships
- **Wave 3**: 1 boss — HP 15, 2000 pts, massive red armoured battlecruiser (3-cannon spread fire)
- **Enemy movement**: whole formation marches left/right, drops 32px and reverses when any enemy hits the edge; speeds up as enemies are killed
- **Enemy fire**: random grunt/bomber fires every 1600ms; boss fires 3-way spread every 680ms
- **Player fire**: cyan plasma bolts, 380ms cooldown (Space or ↑)
- **HUD**: SCORE (top-left, cyan, dynamic), WAVE N (top-center, yellow, dynamic), ♥ N (top-right, red, dynamic) — driven by game registry bindings
- **Lives**: 3 lives, 2200ms invincibility frames on hit with alpha flicker, camera shake + red flash
- **Particle explosions**: ADD-blend particle bursts on enemy death (bigger for boss)
- **Wave banners**: scale-in + hold + fade-out text overlay between waves; "⚠ BOSS WAVE ⚠" for wave 3
- **Starfield background**: 200 stars + 20 tinted stars + 4 nebula wisps, seeded XOR-shift RNG, player zone separator line
- **Game Over / Victory overlays**: dark panel + title + score + blinking "SPACE to play again"
- **High-score persistence**: not yet added
- **Rules file**: public/rules.json with all tunable constants (player speed, fire cooldown, enemy speeds, boss HP, etc.)

## Key implementation details
- **Player entity**: defined in `public/scenes/world/main.json` as `code-rendered`, visual script `src/visuals/player-ship.ts`. Physics body added manually in GameScene (`setSize(52, 44).setOffset(-26, -22)`).
- **Enemy prefabs**: declared in `public/scenes/manifest.json`. Spawned via `spawnPrefab(this, prefabId, x, y)`. SDK applies physics body from manifest; manual `body.reset(x, y)` drives formation movement.
- **Render scripts**: `src/visuals/player-ship.ts`, `enemy-grunt.ts`, `enemy-bomber.ts`, `enemy-boss.ts`, `player-bullet.ts`, `enemy-bullet.ts` — pure draw functions, no state.
- **Particle texture**: 4×4 white square generated in `BootScene.create()` as key `'particle'`.
- **Rules**: `preloadRules(this)` in BootScene.preload(); `getRule(this, path, fallback)` in GameScene.create().
- **Formation movement**: `enemyDir` (±1) × `enemySpeed` (px/s) via `body.reset(newX, y)` per frame; `enemyDropPending` flag triggers 32px drop + direction flip + speed ramp.
- **Boss movement**: independent side-sweep (150↔570px) via body.reset(); 3-way spread fired every 680ms with `body.setVelocity(sin×520, cos×520)`.
- **Wave transitions**: `waveSpawnDone` flag + `enemies.getChildren().filter(active).length === 0` detection; `inBannerDelay` flag pauses update() during banners.
- **tsconfig**: added `"types": ["vite/client"]` to suppress `import.meta.glob` TS error in `src/visuals/index.ts`.

## What changed this turn
- Built entire game from scratch: 6 visual render scripts, complete GameScene with all wave logic, world/main.json (player entity), manifest.json (5 prefabs), HUD JSON (3 dynamic bindings), rules.json, BootScene updated for particle texture + preloadRules.
