# Space Shooter

**Genre:** Space shooter (top-down, vertical scrolling)  
**Core mechanic:** Player pilots a spaceship through space; enemies and shooting to be added.

## Features implemented
- Deep space background with gradient + three nebula blobs
- Three-layer parallax star field (far/mid/near) scrolling downward
- Player ship using `playerlife1_red.png` (uploaded asset), scaled 3×
- Full movement: Arrow Keys and WASD, constrained to screen bounds
- Slight tilt animation when banking left/right
- Thruster particle emitter (orange/yellow glow) that follows the ship exhaust
- Controls hint in HUD overlay

## Key implementation details
- **BootScene** – loads `uploaded/playerlife1_red.png` as `'playerSprite'` with a progress bar
- **Player** (src/objects/Player.ts) – extends `Phaser.Physics.Arcade.Sprite`; accepts cursors + WASD keys; banks on left/right movement
- **GameScene** – manages star layers (array of Rectangles moved per frame), creates thruster emitter, wires input
- **UIScene** – minimal HUD with controls hint text

## Changed this turn
- Initial game creation: space background, parallax stars, player ship sprite, thruster particles, WASD + arrow movement
