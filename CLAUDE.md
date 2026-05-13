# Space Invaders — Classic Vertical Shooter

## What this game is
**Genre**: Arcade shoot-em-up (Space Invaders clone)  
**Orientation**: Portrait (720×1280)  
**Core mechanic**: Player ship at the bottom moves left/right and shoots upward. Three waves of enemies must be cleared.

## Currently implemented

### Player
- Cyan fighter ship spawned from `world/main.json` at (360, 1150)
- Move: ←/→ arrows or A/D
- Shoot: Space or ↑ arrow (cooldown: 270ms)
- 3 lives; 2.2s invincibility on hit with flash; explosion on death

### Enemies (3 wave types)
| Wave | Formation | Enemy | HP | Points |
|------|-----------|-------|----|--------|
| 1 | 3×4 grid | Grunt (lime green crab) | 1 | 100 |
| 2 | V-formation | Bomber (orange diamond) | 2 | 300 |
| 3 | Single boss | Boss (red hexagonal battleship) | 15 | 2000 |

- Enemies move side-to-side, drop 32px per edge bounce
- Accelerate as numbers thin
- Fire downward; boss fires 3-way spread shot at 560ms intervals
- Reaching y > 1060 triggers game over

### HUD
- Score (top-left), Wave (top-center), Lives ♥ (top-right)
- Wave banner on each wave start
- GAME OVER overlay + final score + Space to retry
- VICTORY overlay + final score + Space to replay
- **Pause button** — bottom-right corner; drawn with shapes (rounded rect + two bars / play triangle). Hover state brightens icon. Click, P, or Esc to toggle. Physics world pauses; overlay fades in with resume hint. Icon swaps to ▶ while paused.

### Visual polish
- Deep space gradient background with 180 seeded stars + nebula wisps
- Particle explosions on every kill (larger for boss)
- Score pop tween on kills
- Player zone divider line

## Key implementation details

### Architecture
- **Player**: authored entity in `public/scenes/world/main.json`, role=`player`. Physics added manually in GameScene.
- **Enemies & bullets**: defined as prefabs in `public/scenes/manifest.json`; spawned via `spawnPrefab(this, prefabId, x, y)`.
- **HP tracking**: `spawnPrefab` stamps `entityProperties` on the GO; GameScene copies `.hp` into a mutable `getData('hp')` slot.
- **Movement**: direct `e.x += dx` per frame (global gravity = 0, bodies sync automatically).
- **Groups**: `playerBullets`, `enemyBullets`, `enemies` — Phaser groups for overlap colliders.

### Files
- `src/scenes/GameScene.ts` — full game logic
- `src/scenes/BootScene.ts` — manifest preload (template)
- `src/visuals/player-ship.ts` — cyan fighter
- `src/visuals/enemy-grunt.ts` — lime crab alien
- `src/visuals/enemy-bomber.ts` — orange diamond ship
- `src/visuals/enemy-boss.ts` — red hexagonal battleship
- `src/visuals/player-bullet.ts` — cyan plasma bolt
- `src/visuals/enemy-bullet.ts` — red/orange bolt
- `public/scenes/manifest.json` — 5 prefabs: enemy_grunt, enemy_bomber, enemy_boss, player_bullet, enemy_bullet
- `public/scenes/world/main.json` — player entity

## What changed this turn
Added pause button: bottom-right drawn shape (rounded rect + ❚❚ / ▶ icon), hover highlight, click/P/Esc toggle, physics world pause, fade-in overlay with resume hint, icon swaps to play triangle while paused.
