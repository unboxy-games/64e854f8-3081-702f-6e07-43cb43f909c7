# Super Jumper — Mario-style Platformer

## Game overview
A Mario-inspired side-scrolling platformer. The player runs and jumps across a wide level
(3840 × 720), lands on enemies to stomp them, and collects coins for score. 3 lives, fall = lose a life.

## Genre / core mechanic
- Side-scrolling platformer
- Jump on enemies (Goombas) from above to stomp them
- Collect gold coins for points
- Camera follows player across the level

## Controls
- Arrow Left / A — move left
- Arrow Right / D — move right
- Arrow Up / W / Space — jump (variable-height: release early for shorter jump)

## Implemented features
- Scrolling level (3840 px wide), camera follows player
- Player: code-rendered Mario-like character (32 × 48), horizontal flip via setScale
- Platforms: 13 floating platforms (code-rendered brick style) + full-width grass ground
- Enemies: 12 Goombas (8 ground, 4 platform), walk + reverse on wall hit
- Coins: ~50 coins above platforms and on the ground path, gravity disabled
- Stomp mechanic: falling player + Y-position check = stomp → squish tween + dust particles
- Hurt mechanic: side/top collision with enemy → invincibility blink + knockback
- Fall death: player falls below world → lose a life, respawn at start
- Score system: +100 per coin, +200 per enemy, floating text popup
- Lives system: 3 lives, hearts displayed in HUD
- Game Over screen with retry (press Space)
- Dust burst particles on stomp + coin collect
- Sky gradient + cloud decorations (scrolling)

## Architecture (scene-as-data)
- `public/scenes/world/main.json` — player + ground + all 13 platform entities
- `public/scenes/manifest.json` — prefabs: `enemy_goomba`, `coin`
- `public/rules.json` — tunable values: speed, jump, gravity, lives, scores, invincibility
- `src/visuals/player.ts` — player render script
- `src/visuals/enemy-goomba.ts` — Goomba render script
- `src/visuals/coin.ts` — Coin render script
- `src/visuals/platform.ts` — Platform render script (grass ground + brick floating)
- `src/scenes/GameScene.ts` — all gameplay logic
- `src/scenes/UIScene.ts` — HUD: score + lives hearts

## Key constants / layout
- World size: 3840 × 720
- Ground top: y = 696 (ground center 708, height 24)
- Player spawn: (150, 672)
- Physics gravity: 1000 (set in GameScene.create)
- Player physics: full 32×48 body, no world bounds collide (fall allowed)

## What changed this turn
- Created the entire game from scratch — all render scripts, data files, and game logic
