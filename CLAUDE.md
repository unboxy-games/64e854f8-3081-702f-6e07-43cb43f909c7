# Mushroom Kingdom — Mario-like Platformer

## What the game is
Side-scrolling 2D platformer in the style of Super Mario Bros.
- Genre: Platformer
- Core mechanics: Run, jump, stomp enemies to kill them, reach the flagpole

## Features currently implemented
- Wide scrolling world (4096 × 720) with parallax background (sky gradient, distant mountains, rolling hills, clouds)
- Player character drawn with Graphics API (red hat, overalls, mustache — Mario-inspired)
- 18 platform definitions (ground + 17 floating platforms with grass/dirt tile visuals)
- 14 enemies (Goomba-like): patrol between defined left/right bounds on ground and platforms
- **Stomp mechanic**: land on top of an enemy while falling → enemy squishes, particle burst, player bounces, +100 score
- **Hurt mechanic**: touch enemy from side/below → lose a life, knockback, 2.4s invincibility flash, red screen flash
- Coyote time (165ms grace window after walking off a ledge for more forgiving jumps)
- Flagpole goal at x=3816: reach it to win with +1000 bonus score
- 3 lives system; fall into a pit loses a life and respawns at start
- HUD (UIScene): score panel with 000000 formatting, heart lives display
- Game Over / You Win overlay with scale-in tween animation
- Press SPACE/R/ENTER on overlay to restart

## Controls
- ← → / A D — move left/right
- ↑ / W / Space — jump (with coyote time)

## Key implementation details

### GameScene.ts
- All textures generated via `this.make.graphics()` + `generateTexture()` at create time
- Platforms: tileSprite visual (plat32 32×32 tile) + invisible staticGroup physics body
- Physics: arcade gravity 900, player setCollideWorldBounds(true)
- Enemies: dynamic physics sprites in `enemyGroup`, patrol via velocity in update loop
- Stomp detection: `physics.add.overlap` + velocity.y > 40 && player.bottom < enemy.center.y+18
- Win detection: distance check to FLAG_X (3816) in update()

### UIScene.ts
- Runs in parallel over GameScene
- Listens to `hud-update`, `game-over`, `level-complete` events from GameScene
- Hearts drawn with Graphics (two circles + triangle)
- Overlay uses Back.Out ease for satisfying pop-in

### World JSON (public/scenes/world/main.json)
- World size: 4096 × 720
- No entities (all spawned in code)

## Changed this session
- Created the entire game from scratch (new session, no prior state)
- Built Mario-like platformer with player, enemies, platforms, scrolling camera, parallax BG, HUD
- Fixed TypeScript errors: removed `{ add: false }` from `make.graphics()` calls, added proper body casts
- Added `"types": ["vite/client"]` to tsconfig.json to fix pre-existing visuals/index.ts errors
