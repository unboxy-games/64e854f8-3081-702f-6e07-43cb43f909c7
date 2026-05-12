# Star Blaster — Classic Vertical Space Shooter

## What the game is
A classic vertical shoot-'em-up (shmup) in portrait orientation (720×1280).
The player pilots a cyan spaceship from the bottom of the screen, shooting
upward through wave after wave of enemy formations. Every 5th wave is a boss.

## Currently implemented features
- **Player ship** — auto-fires continuously; moves with arrow keys, WASD, or
  touch drag; tilts slightly when banking left/right
- **Engine trail** — orange particle trail follows the ship's thrusters
- **3 enemy types** (red arrow, orange diamond, purple interceptor) with
  progressively harder waves; type 2+ ships use sine-wave side movement
- **Boss wave** (every 5th wave) — large dreadnought that settles near the top
  and patrols side to side, with a red aura ring
- **Enemy AI fire** — 1–2 random enemies aim their orange orb bullets at the
  player every ~1 second; speed increases with level
- **Wave spawning** — grid formations grow in rows/cols with each wave;
  next wave triggers 1.6 s after the last enemy is cleared or exits the screen
- **Power-ups** — drop at 12 % chance on kill:
  - ⚡ Rapid Fire (8 s) — triples shot count (spread shot)
  - 🛡 Shield — absorbs one hit, displayed as a blue aura ring around the ship
- **Parallax starfield** — 3 tile-sprite layers scrolling at different speeds
  over a deep-space gradient + soft nebula ellipses
- **Score system** — per-enemy points (+40–1000), floating +pts text
- **Level system** — levels up every 1 500 pts; enemy speed scales with level
- **Lives** — 3 lives with 2.2 s invincibility blink after each hit
- **Hit feedback** — red screen flash on damage, blue flash on shield break,
  white flash on power-up pickup
- **Explosions** — burst particles + optional shockwave ring for boss kills
- **HUD (UIScene)** — score top-left, best top-right, level top-centre,
  cyan ship-icon lives below score, wave/powerup announce text
- **Game-over overlay** — shows score, best, wave reached, tap-to-restart
- **High score persistence** — saved via `unboxy.saves` key `highScore`

## Key implementation details
- `src/scenes/GameScene.ts` — all game logic (no scene-as-data, pure code)
- `src/scenes/UIScene.ts`   — HUD overlay (launched by GameScene.create)
- `src/main.ts`             — exports `unboxyReady` (Unboxy.init promise)
- All textures generated programmatically via Phaser Graphics API at runtime;
  guarded with `this.textures.exists()` so they survive `scene.restart()`
- Physics groups: `pBullets`, `enemies`, `eBullets`, `powerups`
- Controls: arrow keys / WASD for movement; auto-fire always on (rate-limited)

## Changes this turn
- Created the entire game from scratch (GameScene, UIScene, main.ts update)
- All art drawn with Graphics API (player, 3 enemy types, boss, bullets,
  power-ups, shield aura, star layers)
- Implemented full game loop, wave system, boss waves, power-ups, and HUD
