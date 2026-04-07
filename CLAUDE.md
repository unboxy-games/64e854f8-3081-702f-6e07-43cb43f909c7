# Star Defender — Classic Retro Arcade Space Shooter

## Game Overview
- **Title**: Star Defender
- **Genre**: Arcade space shooter (omni-directional)
- **Core mechanic**: Control a spaceship freely in 4 directions; auto-shoot the nearest enemy; survive as long as possible before HP runs out.
- **Visual style**: Classic retro arcade (monospace HUD, glowing shapes, pixel-style palette)

## Features Implemented
- **Player ship**: Procedurally drawn cyan/white retro triangle with cockpit dome and engine glow. Moves in 4 directions (WASD / arrow keys). Constrained to screen bounds.
- **Auto-shooting**: Player fires toward the nearest enemy automatically on cooldown (280 ms default).
- **Two enemy types**:
  - *Small (red)*: Fast (158 base speed), 1 HP, 10 pts — 75% of spawns
  - *Big (orange)*: Slow (72 base speed), 4 HP, 30 pts — 25% of spawns
- **Enemies** spawn from all four screen edges and steer toward the player each frame. They rotate to face movement direction.
- **Collision**: Enemy touching player deals 1 (small) or 2 (big) damage; player gets 1.4s invincibility after hit (flicker effect). Camera shake on hit.
- **HP system**: 5 hearts, displayed as ♥♥♥♥♥ in top-right HUD. Game over when HP = 0.
- **Power-ups** (drop on enemy death — 14% small / 45% big):
  - 🛡 **Shield** (cyan): 4s full invincibility with animated shield ring
  - ⚡ **Rapid Fire** (orange): 5s, cooldown 130 ms
  - 🔱 **Spread Shot** (green): 5s, 3 bullets in a cone
  - Power-ups float, spin, and expire after 9s if not picked up
- **Difficulty scaling**: Every 20 seconds, wave counter +1, enemy speed ×1.14, spawn interval −180 ms (min 550 ms). Wave banner notification shown on screen.
- **Scrolling starfield**: 200 parallax stars drifting downward at depth 0.
- **Particles**: Explosion bursts on enemy death (8 particles small / 16 large, with tinted colors).
- **Score**: Displayed top-left; bounces on each point gain.

## Controls
| Key | Action |
|-----|--------|
| WASD or Arrow keys | Move spaceship |
| (auto) | Shoot toward nearest enemy |
| R | Restart after game over |

## Key Implementation Details
- `src/scenes/BootScene.ts` — starts GameScene, launches UIScene in parallel
- `src/scenes/GameScene.ts` — all gameplay: texture generation, physics, spawning, collision, difficulty
- `src/scenes/UIScene.ts` — HUD overlay: HP, score, wave, power-up badge, game over screen
- `src/config.ts` — `GAME_WIDTH = 1280`, `GAME_HEIGHT = 720`
- Cross-scene communication via `this.game.events` (global emitter) so events survive GameScene restarts
- All textures generated procedurally via `Graphics.generateTexture()` in `create()`
- Phaser arcade physics for player, enemies, bullets, power-ups
- Particle explosions use Phaser 3.60+ `this.add.particles(x, y, key, config)` API

## Last Change
Initial full implementation: retro arcade space shooter with two enemy types, three power-ups, difficulty scaling, and polished HUD.
