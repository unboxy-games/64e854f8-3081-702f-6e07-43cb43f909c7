# Flappy Bird

**Genre:** Arcade / endless side-scroller  
**Core mechanic:** Tap or press SPACE to flap; navigate the bird through gaps between scrolling pipe pairs without hitting them, the ground, or enemies.

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
- **Pause button** — circular button (top-right corner, depth 15); icon toggles between ‖ (pause) and ▶ (play). Also toggled with **P** key. Clicking anywhere while paused resumes the game.
- **Three enemy types** spawning from the right every 2.8 s, with distinct hand-drawn textures, movements, and wing animations:
  - 🔴 **Enemy Bird** — red bird with angry eyebrow, gentle sine bob (A=28px), wing-flap tween, faces left via flipX
  - 🐝 **Bee** — yellow/black striped bee with light-blue wings & antennae, fast zigzag (A=55px), rapid wing-beat tween
  - 🦇 **Bat** — purple bat with spread wings, fangs & red glowing eyes, homes toward player's Y each frame, scaleX wing-fold tween

---

## Key implementation details

| File | Role |
|------|------|
| `src/scenes/GameScene.ts` | All game logic — bird, pipes, enemies, score, death, restart |
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
- Enemies use a separate `this.physics.add.group()`, `setAllowGravity(false)`, overlap with bird → `_die()`.

**Enemy system**  
`EnemyType = 'bird' | 'bee' | 'bat'`  
`EnemyEntry = { sprite, type, baseY, phase, wingTween? }`

Enemy velocities: bird = PIPE_SPEED, bee = PIPE_SPEED × 0.72, bat = PIPE_SPEED × 1.15  
Vertical movement (in `update()` using `time` ms → seconds):
- **bird**: `velocityY = 70 · cos(2.5t + phase)`
- **bee**: `velocityY = 220 · cos(4t + phase)`
- **bat**: `velocityY = clamp((bird.y − enemy.y) × 2.8, −220, 220)`; angle tilts toward bird

Hit-boxes shrunk for fairness: bird (34×26), bee (28×18), bat (26×22).  
Enemy timer: 2800ms interval, starts in `_startGame()`, paused/resumed with game pause.  
Enemies cleaned up when `x < −70`.

**Pipe scoring**  
`pipeData[]` tracks each top-pipe reference + a `scored` flag. In `update()`, when `topPipe.x < bird.x`, the flag is set and score increments.

**Pipe cleanup**  
In `update()`, pipes with `x < -PIPE_W - 20` are removed via `pipes.remove(p, true, true)`.

---

**Pause system**  
- `isPaused` boolean guards `_togglePause()`.  
- Pause: `this.physics.pause()` + pipeTimer.paused + enemyTimer.paused + per-enemy wingTween.pause() + fade-in overlay.  
- Resume: inverse of above + overlay fade-out.  
- `update()` early-returns when `isPaused` is true (alongside `!gameStarted` / `isDead`).
- Pause button built in `_buildPauseButton()` — circle bg + Graphics icon redrawn via `_updatePauseBtnIcon(paused)`.  
- **P** key → `_onPKey()` (only when game started and not dead).

---

## Changed this turn
- Increased starting lives from **3 to 4** — updated both the field initializer and `create()` reset, and changed `_buildLivesDisplay()` to render 4 heart icons.
