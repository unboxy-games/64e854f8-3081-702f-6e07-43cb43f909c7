# Airplane Shooter

**Genre:** Horizontal side-scrolling shoot-'em-up  
**Theme:** Retro pixel-ish, bold colors, dark space/sky  
**Style:** Player on left shoots right; enemies come from the right

## Features implemented

- **Player plane** — drawn with Phaser Graphics (cyan/blue fuselage, wings, cockpit, engine exhaust). Moves up/down with W/S or arrow keys. Shoots with SPACE.
- **Enemy planes** — drawn with Phaser Graphics (red/orange mirror of player). Spawn from the right edge, track the player vertically, and shoot back periodically.
- **Bullet system** — Arcade physics groups for player bullets (yellow) and enemy bullets (orange). Off-screen bullets cleaned up each frame.
- **Collision** — Arcade Physics overlaps: player bullet → enemy (2-hit kill with damage flash), enemy bullet → player, enemy → player (ramming).
- **Explosion particles** — 14-particle burst with central flash on enemy death; uses tweens.
- **Lives system** — 3 lives; 2.2s invincibility after each hit (alpha-flash tween). Game over when lives reach 0.
- **Score** — 100 pts per kill; displayed in UIScene with a scale bounce.
- **Difficulty scaling** — Enemy speed increases with kill count; spawn interval shrinks with score.
- **Scrolling background** — Dark gradient sky, static star field, two-layer scrolling cloud graphics.
- **HUD (UIScene)** — Score (top-left, cyan monospace), Lives (top-right, ♥ symbols in pink), controls hint (bottom-left), score popup floaters.
- **Game Over** — Dark overlay, GAME OVER title (tween in), final score, restart with SPACE.

## Key implementation details

- `GameScene.ts` — all gameplay. Generates textures in `create()` via `this.make.graphics({}, false)` + `generateTexture()`. Uses Arcade Physics groups for bullets/enemies. `update()` runs player input, cloud scroll, enemy AI, spawn timer, bullet cleanup.
- `UIScene.ts` — HUD scene running in parallel. Listens to `hudScore`, `hudLives`, `scorePopup`, `hudReset`, `gameOver` events emitted by GameScene.
- Textures: `planeTex_player`, `planeTex_enemy`, `bulletTex_player`, `bulletTex_enemy` — all 72×48 or 18×6 px, generated at scene create.
- No external assets — fully programmatic visuals.

## Controls
- **W / ↑** — Move up
- **S / ↓** — Move down
- **SPACE** — Shoot / Restart after game over

## Changed this turn
- Created full game from scratch: GameScene (shooter logic) + UIScene (HUD)
