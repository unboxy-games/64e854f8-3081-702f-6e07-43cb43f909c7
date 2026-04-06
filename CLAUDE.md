# Flappy Bird

**Genre:** Arcade / endless side-scroller  
**Core mechanic:** Tap or press SPACE to flap; navigate the bird through gaps between scrolling pipe pairs without hitting them or the ground.

---

## Features implemented
- Sky gradient background with static clouds and a ground strip
- Cute yellow bird drawn with Phaser Graphics API (body, belly, wing, eye, beak) — generated as a texture at startup
- Green pipes drawn with Graphics (highlight + shadow + cap band) — generated as a texture at startup; top pipe is flipY'd so the cap faces downward
- Idle bob tween on the bird while waiting to start
- Physics-based flap (upward velocity impulse) with smooth downward tilt when falling and snappy upward tilt on flap
- Random pipe gap positions each spawn
- Score tracking: increments when the bird passes the centre of each top pipe; score text bounces on increment
- Game-over overlay with animated pop-in, showing final score
- Death flash (alpha flicker) + tilt animation on collision or hitting ground/ceiling
- Tap / Space to restart (calls `scene.restart()`)

---

## Key implementation details

| File | Role |
|------|------|
| `src/scenes/GameScene.ts` | All game logic — bird, pipes, score, death, restart |
| `src/scenes/UIScene.ts` | Placeholder (score is handled entirely in GameScene) |
| `src/scenes/BootScene.ts` | Launches GameScene (unchanged) |
| `src/config.ts` | `GAME_WIDTH = 1280`, `GAME_HEIGHT = 720` |

**Constants (top of GameScene.ts)**  
`BIRD_GRAVITY = 1400`, `FLAP_VELOCITY = -460`, `PIPE_SPEED = -230 px/s`,  
`PIPE_GAP = 190`, `PIPE_W = 72`, `PIPE_H = 580`, `PIPE_INTERVAL = 1800 ms`

**Physics setup**  
- World gravity = 0; bird gets `body.setGravityY(BIRD_GRAVITY)`.  
- Bird gravity disabled until first flap starts the game.  
- Pipes use `this.physics.add.group()`, each body is `setImmovable(true)` + `setAllowGravity(false)`.  
- Collision detected via `this.physics.add.overlap(bird, pipes, _die)`.

**Pipe scoring**  
`pipeData[]` tracks each top-pipe reference + a `scored` flag. In `update()`, when `topPipe.x < bird.x`, the flag is set and score increments.

**Pipe cleanup**  
In `update()`, pipes with `x < -PIPE_W - 20` are removed via `pipes.remove(p, true, true)`.

---

## Changed this turn
- Built complete Flappy Bird from scratch (GameScene, UIScene).
