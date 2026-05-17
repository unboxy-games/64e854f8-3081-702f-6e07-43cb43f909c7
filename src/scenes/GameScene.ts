import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

interface Bullet {
  gfx: Phaser.GameObjects.Graphics;
  vy: number;
}

interface Enemy {
  gfx: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  alive: boolean;
  row: number;
}

export class GameScene extends Phaser.Scene {
  // Player
  private playerGfx!: Phaser.GameObjects.Graphics;
  private playerX = GAME_WIDTH / 2;
  private readonly playerY = GAME_HEIGHT - 120;
  private readonly playerSpeed = 320;
  private flashAlpha = 1;

  // Player bullets
  private playerBullets: Bullet[] = [];
  private lastShot = 0;
  private readonly shootCooldown = 340;

  // Enemy grid (6 × 3 = 18)
  private enemies: Enemy[] = [];
  private gridDir = 1;
  private readonly gridMoveX = 34;
  private readonly gridDescendY = 22;
  private gridMoveTimer = 0;
  private readonly gridMoveIntervalBase = 820;

  // Enemy bullets
  private enemyBullets: Bullet[] = [];
  private enemyShootTimer = 0;
  private readonly enemyShootInterval = 1100;

  // State
  private lives = 3;
  private score = 0;
  private invincible = false;
  private gameActive = true;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // Stars
  private stars: Star[] = [];
  private starGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(_data?: unknown): void {
    this.playerX = GAME_WIDTH / 2;
    this.flashAlpha = 1;
    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.gridDir = 1;
    this.gridMoveTimer = 0;
    this.enemyShootTimer = 0;
    this.lives = 3;
    this.score = 0;
    this.invincible = false;
    this.gameActive = true;
    this.stars = [];
  }

  create(): void {
    // Sync registry so HUD picks up reset values
    this.registry.set('score', 0);
    this.registry.set('lives', 3);

    // ── Background ──────────────────────────────────────────────
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x000012, 0x000012, 0x001028, 0x001028, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // ── Stars ────────────────────────────────────────────────────
    this.starGfx = this.add.graphics().setDepth(1);
    for (let i = 0; i < 110; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, GAME_WIDTH),
        y: Phaser.Math.Between(0, GAME_HEIGHT),
        size: Math.random() < 0.22 ? 2 : 1,
        speed: Phaser.Math.FloatBetween(0.18, 1.1),
        alpha: Phaser.Math.FloatBetween(0.3, 1.0),
      });
    }

    // ── Nebula hint ──────────────────────────────────────────────
    const nebula = this.add.graphics().setDepth(0);
    nebula.fillStyle(0x1a006a, 0.18);
    nebula.fillEllipse(GAME_WIDTH * 0.2, GAME_HEIGHT * 0.35, 280, 200);
    nebula.fillStyle(0x006633, 0.12);
    nebula.fillEllipse(GAME_WIDTH * 0.8, GAME_HEIGHT * 0.65, 220, 160);

    // ── Player ship ──────────────────────────────────────────────
    this.playerGfx = this.add.graphics().setDepth(3);
    this.redrawPlayer();

    // ── Enemy grid 6 × 3 ────────────────────────────────────────
    this.buildEnemyGrid();

    // ── Input ────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── Launch HUD scene ─────────────────────────────────────────
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  Enemy grid builder
  // ────────────────────────────────────────────────────────────────
  private buildEnemyGrid(): void {
    const COLS = 6;
    const ROWS = 3;
    const SPACE_X = 86;
    const SPACE_Y = 74;
    const START_X = (GAME_WIDTH - (COLS - 1) * SPACE_X) / 2;
    const START_Y = 185;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = START_X + col * SPACE_X;
        const y = START_Y + row * SPACE_Y;
        const gfx = this.add.graphics().setDepth(2);
        this.drawEnemy(gfx, x, y, row);
        this.enemies.push({ gfx, x, y, alive: true, row });
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  Enemy drawing
  // ────────────────────────────────────────────────────────────────
  private drawEnemy(gfx: Phaser.GameObjects.Graphics, x: number, y: number, row: number): void {
    gfx.clear();

    // Three row colour palettes
    const palettes = [
      { body: 0xff2244, highlight: 0xff88aa, dark: 0xaa0022, eyeGlow: 0xff99bb },
      { body: 0xff8800, highlight: 0xffcc55, dark: 0xaa5500, eyeGlow: 0xffdd88 },
      { body: 0x22cc55, highlight: 0x88ffaa, dark: 0x118833, eyeGlow: 0xaaffcc },
    ];
    const p = palettes[row % palettes.length];

    // Drop shadow
    gfx.fillStyle(0x000000, 0.25);
    gfx.fillEllipse(x, y + 20, 40, 10);

    // Main body
    gfx.fillStyle(p.body, 1);
    gfx.fillRoundedRect(x - 20, y - 16, 40, 32, 9);

    // Body sheen
    gfx.fillStyle(p.highlight, 0.28);
    gfx.fillRoundedRect(x - 15, y - 14, 18, 11, 4);

    // Eyes
    gfx.fillStyle(0x110000, 1);
    gfx.fillEllipse(x - 8, y - 4, 12, 11);
    gfx.fillEllipse(x + 8, y - 4, 12, 11);
    gfx.fillStyle(p.eyeGlow, 1);
    gfx.fillEllipse(x - 8, y - 5, 7, 7);
    gfx.fillEllipse(x + 8, y - 5, 7, 7);
    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillCircle(x - 5, y - 7, 2);
    gfx.fillCircle(x + 11, y - 7, 2);

    // Mouth slot
    gfx.fillStyle(p.dark, 1);
    gfx.fillRect(x - 10, y + 7, 20, 5);
    // Teeth
    gfx.fillStyle(0xffffff, 1);
    for (let t = 0; t < 3; t++) {
      gfx.fillRect(x - 9 + t * 7, y + 7, 5, 5);
    }

    // Antennae
    gfx.lineStyle(2, p.body, 1);
    gfx.strokeLineShape(new Phaser.Geom.Line(x - 9, y - 16, x - 13, y - 28));
    gfx.strokeLineShape(new Phaser.Geom.Line(x + 9, y - 16, x + 13, y - 28));
    gfx.fillStyle(p.highlight, 1);
    gfx.fillCircle(x - 13, y - 28, 4);
    gfx.fillCircle(x + 13, y - 28, 4);

    // Legs / tentacles
    gfx.lineStyle(3, p.dark, 1);
    gfx.strokeLineShape(new Phaser.Geom.Line(x - 14, y + 16, x - 20, y + 30));
    gfx.strokeLineShape(new Phaser.Geom.Line(x - 5,  y + 16, x - 5,  y + 30));
    gfx.strokeLineShape(new Phaser.Geom.Line(x + 5,  y + 16, x + 5,  y + 30));
    gfx.strokeLineShape(new Phaser.Geom.Line(x + 14, y + 16, x + 20, y + 30));
  }

  // ────────────────────────────────────────────────────────────────
  //  Player drawing
  // ────────────────────────────────────────────────────────────────
  private redrawPlayer(): void {
    const g = this.playerGfx;
    const x = this.playerX;
    const y = this.playerY;
    g.clear();
    g.setAlpha(this.flashAlpha);

    // Engine exhaust glow
    g.fillStyle(0x0044ff, 0.22);
    g.fillEllipse(x, y + 32, 26, 16);

    // Wings
    g.fillStyle(0x005577, 1);
    g.fillTriangle(x - 18, y + 20, x - 40, y + 32, x - 10, y + 4);
    g.fillTriangle(x + 18, y + 20, x + 40, y + 32, x + 10, y + 4);

    // Wing accent
    g.fillStyle(0x0099bb, 0.55);
    g.fillTriangle(x - 18, y + 20, x - 30, y + 28, x - 12, y + 8);
    g.fillTriangle(x + 18, y + 20, x + 30, y + 28, x + 12, y + 8);

    // Body
    g.fillStyle(0x00ddff, 1);
    g.fillTriangle(x, y - 36, x - 20, y + 22, x + 20, y + 22);

    // Body centre stripe
    g.fillStyle(0x007799, 1);
    g.fillTriangle(x, y - 22, x - 10, y + 16, x + 10, y + 16);

    // Cockpit
    g.fillStyle(0xaaffff, 0.95);
    g.fillEllipse(x, y - 14, 14, 20);
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(x - 2, y - 19, 6, 9);

    // Engine nozzles
    g.fillStyle(0xff8800, 0.95);
    g.fillRect(x - 11, y + 22, 8, 13);
    g.fillRect(x + 3,  y + 22, 8, 13);
    g.fillStyle(0xffee00, 0.7);
    g.fillRect(x - 10, y + 27, 6, 6);
    g.fillRect(x + 4,  y + 27, 6, 6);

    // Wing-tip cannons
    g.fillStyle(0x00bbdd, 1);
    g.fillRect(x - 40, y + 24, 5, 12);
    g.fillRect(x + 35, y + 24, 5, 12);
  }

  // ────────────────────────────────────────────────────────────────
  //  Main update loop
  // ────────────────────────────────────────────────────────────────
  update(time: number, delta: number): void {
    if (!this.gameActive) return;

    // Scrolling stars
    this.starGfx.clear();
    for (const s of this.stars) {
      s.y += s.speed * (delta / 16);
      if (s.y > GAME_HEIGHT) { s.y = 0; s.x = Phaser.Math.Between(0, GAME_WIDTH); }
      this.starGfx.fillStyle(0xffffff, s.alpha);
      this.starGfx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Player movement
    if ((this.cursors.left.isDown || this.keyA.isDown) && this.playerX > 42) {
      this.playerX -= this.playerSpeed * delta / 1000;
    } else if ((this.cursors.right.isDown || this.keyD.isDown) && this.playerX < GAME_WIDTH - 42) {
      this.playerX += this.playerSpeed * delta / 1000;
    }
    this.redrawPlayer();

    // Shooting — space (one-shot) or up-arrow (held, rate-limited)
    const wantsShoot =
      Phaser.Input.Keyboard.JustDown(this.keySpace) ||
      this.cursors.up.isDown;
    if (wantsShoot && time - this.lastShot > this.shootCooldown) {
      this.firePlayerBullet(time);
    }

    // Move player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.gfx.y -= b.vy * delta / 1000;
      if (b.gfx.y < -20) {
        b.gfx.destroy();
        this.playerBullets.splice(i, 1);
      }
    }

    // Move enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.gfx.y += b.vy * delta / 1000;
      if (b.gfx.y > GAME_HEIGHT + 20) {
        b.gfx.destroy();
        this.enemyBullets.splice(i, 1);
      }
    }

    // Enemy march — speeds up as enemies die
    this.gridMoveTimer += delta;
    const aliveCount = this.enemies.filter(e => e.alive).length;
    const interval = Math.max(140, this.gridMoveIntervalBase * (aliveCount / 18));
    if (this.gridMoveTimer >= interval) {
      this.gridMoveTimer = 0;
      this.marchEnemies();
    }

    // Enemy shooting
    this.enemyShootTimer += delta;
    if (this.enemyShootTimer >= this.enemyShootInterval) {
      this.enemyShootTimer = 0;
      this.fireEnemyBullet();
    }

    // Collisions
    this.doCollisions();

    // Win / lose conditions
    if (aliveCount === 0) { this.showOutcome(true); return; }
    for (const e of this.enemies) {
      if (e.alive && e.y > GAME_HEIGHT - 170) { this.showOutcome(false); return; }
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  Shooting
  // ────────────────────────────────────────────────────────────────
  private firePlayerBullet(time: number): void {
    this.lastShot = time;
    const g = this.add.graphics().setDepth(3);
    // Thin core
    g.fillStyle(0x00ffee, 1);
    g.fillRect(-2, -16, 4, 16);
    // Glow halo
    g.fillStyle(0x00ffee, 0.22);
    g.fillRect(-5, -19, 10, 22);
    g.x = this.playerX;
    g.y = this.playerY - 38;
    this.playerBullets.push({ gfx: g, vy: 700 });
  }

  private fireEnemyBullet(): void {
    const alive = this.enemies.filter(e => e.alive);
    if (!alive.length) return;
    const shooter = alive[Phaser.Math.Between(0, alive.length - 1)];

    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xff3300, 1);
    g.fillRect(-3, 0, 6, 20);
    g.fillStyle(0xff9900, 0.38);
    g.fillRect(-5, -2, 10, 24);
    g.x = shooter.x;
    g.y = shooter.y + 24;
    this.enemyBullets.push({ gfx: g, vy: 380 });
  }

  // ────────────────────────────────────────────────────────────────
  //  Enemy march
  // ────────────────────────────────────────────────────────────────
  private marchEnemies(): void {
    const alive = this.enemies.filter(e => e.alive);
    if (!alive.length) return;

    let minX = Infinity, maxX = -Infinity;
    for (const e of alive) {
      if (e.x < minX) minX = e.x;
      if (e.x > maxX) maxX = e.x;
    }

    const margin = 34;
    let descend = false;
    if (this.gridDir === 1 && maxX + this.gridMoveX > GAME_WIDTH - margin) {
      this.gridDir = -1;
      descend = true;
    } else if (this.gridDir === -1 && minX - this.gridMoveX < margin) {
      this.gridDir = 1;
      descend = true;
    }

    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += this.gridMoveX * this.gridDir;
      if (descend) e.y += this.gridDescendY;
      this.drawEnemy(e.gfx, e.x, e.y, e.row);
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  Collision detection
  // ────────────────────────────────────────────────────────────────
  private doCollisions(): void {
    // Player bullets vs enemies
    outer: for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const b = this.playerBullets[bi];
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.abs(b.gfx.x - e.x) < 26 && Math.abs(b.gfx.y - e.y) < 26) {
          b.gfx.destroy();
          this.playerBullets.splice(bi, 1);
          this.killEnemy(e);
          continue outer;
        }
      }
    }

    // Enemy bullets vs player (skip during invincibility)
    if (!this.invincible) {
      for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
        const b = this.enemyBullets[bi];
        if (Math.abs(b.gfx.x - this.playerX) < 22 && Math.abs(b.gfx.y - this.playerY) < 32) {
          b.gfx.destroy();
          this.enemyBullets.splice(bi, 1);
          this.damagePlayer();
          break;
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  Kill enemy
  // ────────────────────────────────────────────────────────────────
  private killEnemy(e: Enemy): void {
    e.alive = false;
    e.gfx.setVisible(false);

    this.score += 10;
    this.registry.set('score', this.score);

    this.explode(e.x, e.y);

    // +10 float
    const pop = this.add
      .text(e.x, e.y - 8, '+10', {
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffff44',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({
      targets: pop,
      y: e.y - 55,
      alpha: 0,
      duration: 680,
      onComplete: () => pop.destroy(),
    });
  }

  // ────────────────────────────────────────────────────────────────
  //  Damage player
  // ────────────────────────────────────────────────────────────────
  private damagePlayer(): void {
    this.lives = Math.max(0, this.lives - 1);
    this.registry.set('lives', this.lives);

    this.explode(this.playerX, this.playerY);

    if (this.lives <= 0) {
      this.time.delayedCall(400, () => this.showOutcome(false));
      return;
    }

    // Brief invincibility + flash
    this.invincible = true;
    let tick = 0;
    this.time.addEvent({
      delay: 100,
      repeat: 11,
      callback: () => {
        tick++;
        this.flashAlpha = tick % 2 === 0 ? 1 : 0.12;
      },
    });
    this.time.delayedCall(1250, () => {
      this.invincible = false;
      this.flashAlpha = 1;
    });
  }

  // ────────────────────────────────────────────────────────────────
  //  Explosion VFX (no particles API — pure tweens)
  // ────────────────────────────────────────────────────────────────
  private explode(x: number, y: number): void {
    // Expanding ring
    const ring = this.add.graphics().setDepth(5);
    ring.lineStyle(3, 0xffffff, 1);
    ring.strokeCircle(0, 0, 8);
    ring.x = x;
    ring.y = y;
    this.tweens.add({
      targets: ring,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 380,
      onComplete: () => ring.destroy(),
    });

    // Sparks
    const cols = [0xff8800, 0xffff00, 0xff3300, 0xffffff, 0xff0066];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = Phaser.Math.FloatBetween(60, 190);
      const spark = this.add.graphics().setDepth(5);
      const color = cols[Math.floor(Math.random() * cols.length)];
      spark.fillStyle(color, 1);
      spark.fillCircle(0, 0, Phaser.Math.FloatBetween(2, 5));
      spark.x = x;
      spark.y = y;
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: Phaser.Math.Between(280, 550),
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  Win / Game-Over overlay
  // ────────────────────────────────────────────────────────────────
  private showOutcome(won: boolean): void {
    if (!this.gameActive) return;
    this.gameActive = false;

    const overlay = this.add.graphics().setDepth(1000);
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 500 });

    const titleStr   = won ? 'YOU WIN!' : 'GAME OVER';
    const titleColor = won ? '#44ff88'  : '#ff4444';

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, titleStr, {
        fontSize: '56px',
        color: titleColor,
        fontStyle: 'bold',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setAlpha(0);

    const scoreLine = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `SCORE  ${this.score}`, {
        fontSize: '36px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setAlpha(0);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, 'SPACE  or  tap  to  retry', {
        fontSize: '22px',
        color: '#777777',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setAlpha(0);

    this.tweens.add({
      targets: [title, scoreLine, hint],
      alpha: 1,
      duration: 480,
      delay: 360,
    });

    // Entry animation on the title
    this.tweens.add({
      targets: title,
      scaleX: { from: 0.6, to: 1 },
      scaleY: { from: 0.6, to: 1 },
      duration: 400,
      delay: 360,
      ease: 'Back.Out',
    });

    this.time.delayedCall(950, () => {
      this.input.keyboard!.once('keydown-SPACE', () => this.scene.restart());
      this.input.once('pointerdown', () => this.scene.restart());
    });
  }
}
