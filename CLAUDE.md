# Game: Starter project

## Genre / Mechanic
Starter project — player sprite placed in the scene, moveable with arrow keys.

## Features implemented
- `playerlife1_blue.png` loaded as the player sprite (uploaded asset)
- Player centred on screen with arrow-key movement (Player class, Arcade physics)
- Idle bob tween on the player
- Gradient background (dark blue theme)
- Loading bar in BootScene for asset loading

## Key implementation details
- **Player**: `src/objects/Player.ts` — extends `Phaser.Physics.Arcade.Sprite`, uses texture key `'playerlife1_blue'`, moves via `handleMovement(cursors)`
- **BootScene**: registers `uploaded/playerlife1_blue.png` with a loading progress bar
- **GameScene**: creates Player at centre, launches UIScene in parallel
- Controls: arrow keys

## Changes this turn
- Imported `playerlife1_blue.png` from user uploads → `public/uploaded/playerlife1_blue.png`
- Added loading bar + asset manifest to BootScene
- Updated Player to use `'playerlife1_blue'` texture key
- Updated GameScene to instantiate Player with idle bob tween and gradient background
