# Super Jump Bros — Session Notes

## What game this is
**Title**: Super Jump Bros  
**Genre**: Mario-style 2D platformer  
**Core mechanic**: Run and jump across a side-scrolling world, stomp Goombas to defeat them, collect coins for score, reach the flag to win.

## Features currently implemented
- **Player**: WASD / Arrow Keys to move, W / Up / Space to jump. Player faces direction of movement (scale flip). Jump produces dust particles.
- **Platforms**: 17 floating platforms at varied heights + full-width ground. Static physics bodies.
- **Goombas**: 20 enemies (14 ground, 6 on platforms). Walk back and forth, reverse when blocked. Squash + destroy on stomp. Side-touch hurts player.
- **Coins**: 57 collectible coins floating above platforms and ground. Collected by proximity. Particle burst on pickup.
- **Score**: Shown in HUD (top-right). Coins = +50 pts, stomping Goomba = +100 pts.
- **Lives**: 3 lives shown as hearts (top-left). Lose life on goomba side-hit or falling off world. Game Over at 0 lives.
- **Win**: Reach the flag near x=4990 to win.
- **Scrolling camera**: Follows player across 5120×720 world with 0.1 lerp smoothing.
- **Background**: Sky gradient + parallax clouds + hill silhouettes.
- **Game Over / Win screens**: Overlay with score and R-to-restart.

## Key implementation details
- **Scene architecture**: scene-as-data (`public/scenes/world/main.json` has player, ground, platforms, flag as entities)
- **Prefabs**: `goomba` and `coin` in `manifest.json prefabs[]`, spawned via `spawnPrefab()`
- **Render scripts**: `src/visuals/player.ts`, `goomba.ts`, `coin.ts`, `platform.ts`, `flag.ts`
- **Physics**: Global gravity 700 in manifest globals. Platforms added as static bodies in GameScene. Goombas have dynamic bodies with `collideWorldBounds: true`.
- **Cross-scene events**: `this.game.events.emit('score'|'lives'|'gameOver'|'win')` → UIScene listens.
- **Controls**: Arrow keys or WASD, Space/W/Up for jump
- **World size**: 5120 × 720. Camera follows player with bounds set.

## What was changed this turn
- Built the entire game from scratch:
  - 5 render scripts (player, goomba, coin, platform, flag)
  - World scene with 20 entities (player + ground + 17 platforms + flag)
  - Manifest updated with gravity globals + goomba/coin prefabs
  - Full GameScene with platformer physics, stomp mechanic, lives, win condition
  - UIScene with heart-icon lives display, score, game-over/win overlays
  - tsconfig updated with vite/client types
