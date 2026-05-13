import Phaser from 'phaser';
import {
  loadWorldScene,
  getEntityRegistry,
  spawnPrefab,
  getRule,
} from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// Helper type for code-rendered GameObjects that have data + physics body
type PhysicsGO = Phaser.GameObjects.Graphics & {
  body: Phaser.Physics.Arcade.Body;
};

export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  // Player
  private player!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;

  // Physics groups
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;

  // Game state (reset in init)
  private score = 0;
  private lives = 3;
  private wave = 1;
  private gameOver = false;
  private gameWon = false;

  // Player cooldowns
  private fireCooldownMs = 0;
  private playerInvincible = false;
  private playerInvincibleMs = 0;

  // Enemy formation movement
  private enemyDir = 1;           // 1 = right, -1 = left
  private enemySpeed = 80;        // px/s, ramps up as enemies die
  private enemyDropPending = false;

  // Wave flags
  private waveSpawnDone = false;
  private inBannerDelay = false;

  // Boss
  private bossGO: Phaser.GameObjects.Graphics | null = null;
  private bossDir = 1;
  private bossFireTimer = 0;
  private enemyFireTimer = 0;

  // Tunable constants (read from rules.json)
  private PLAYER_SPEED = 340;
  private FIRE_COOLDOWN = 380;
  private STARTING_LIVES = 3;
  private INVINCIBLE_MS = 2200;
  private ENEMY_FIRE_INTERVAL = 1600;
  private BOSS_FIRE_INTERVAL = 680;
  private BOSS_MOVE_SPEED = 130;

  // Wave banner text
  private waveBanner!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
    // Reset all mutable state on every (re)start
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.fireCooldownMs = 0;
    this.playerInvincible = false;
    this.playerInvincibleMs = 0;
    this.enemyDir = 1;
    this.enemySpeed = 80;
    this.enemyDropPending = false;
    this.waveSpawnDone = false;
    this.inBannerDelay = false;
    this.bossGO = null;
    this.bossDir = 1;
    this.bossFireTimer = 680;
    this.enemyFireTimer = 1600;
  }

  async create(): Promise<void> {
    await loadWorldScene(this, this.sceneId);

    // Read tunable rules
    this.PLAYER_SPEED = getRule(this, 'balance.playerSpeed', 340);
    this.FIRE_COOLDOWN = getRule(this, 'balance.fireCooldownMs', 380);
    this.STARTING_LIVES = getRule(this, 'balance.startingLives', 3);
    this.INVINCIBLE_MS = getRule(this, 'balance.invincibleMs', 2200);
    this.ENEMY_FIRE_INTERVAL = getRule(this, 'enemies.fireIntervalMs', 1600);
    this.BOSS_FIRE_INTERVAL = getRule(this, 'enemies.bossFireIntervalMs', 680);
    this.BOSS_MOVE_SPEED = getRule(this, 'enemies.bossMoveSpeed', 130);
    this.lives = this.STARTING_LIVES;

    // Draw the starfield background
    this.drawBackground();

    // Get the player entity from the world scene registry
    const registry = getEntityRegistry(this)!;
    this.player = registry.byRole('player')[0] as unknown as Phaser.GameObjects.Graphics;

    // Wire physics onto the player Graphics object
    this.physics.add.existing(this.player);
    this.playerBody = (this.player as unknown as PhysicsGO).body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setSize(52, 44).setOffset(-26, -22);
    this.player.setDepth(3);

    // Keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.aKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Arcade physics groups for bullets and enemies
    this.playerBullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

    // Expose live values to the HUD via the global registry
    this.registry.set('score', 0);
    this.registry.set('lives', this.lives);
    this.registry.set('wave', 1);

    // Wave transition / boss announcement banner
    this.waveBanner = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '', {
        fontSize: '52px',
        color: '#ffdd00',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0);

    // Collision: player bullets ↔ enemies
    this.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      (bullet, enemy) => {
        this.onBulletHitEnemy(
          bullet as Phaser.GameObjects.GameObject,
          enemy as Phaser.GameObjects.GameObject,
        );
      },
    );

    // Collision: enemy bullets ↔ player
    this.physics.add.overlap(
      this.enemyBullets,
      this.player as unknown as Phaser.GameObjects.GameObject,
      (bullet) => {
        this.onEnemyBulletHitPlayer(bullet as Phaser.GameObjects.GameObject);
      },
    );

    // Collision: enemies reach player row
    this.physics.add.overlap(
      this.enemies,
      this.player as unknown as Phaser.GameObjects.GameObject,
      () => { this.triggerGameOver(); },
    );

    // Kick off wave 1
    this.startWave(1);
  }

  // ─── UPDATE LOOP ─────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.gameOver || this.gameWon || this.inBannerDelay) return;

    this.updatePlayer(delta);
    this.updateEnemyFormation(delta);
    this.cullOffScreenBullets();
    this.tickTimers(delta);
    this.checkWaveComplete();
  }

  // ─── PLAYER ──────────────────────────────────────────────────────────────

  private updatePlayer(delta: number): void {
    this.playerBody.setVelocityX(0);

    if (this.cursors.left.isDown || this.aKey.isDown) {
      this.playerBody.setVelocityX(-this.PLAYER_SPEED);
    } else if (this.cursors.right.isDown || this.dKey.isDown) {
      this.playerBody.setVelocityX(this.PLAYER_SPEED);
    }

    // Fire
    this.fireCooldownMs -= delta;
    if ((this.fireKey.isDown || this.cursors.up.isDown) && this.fireCooldownMs <= 0) {
      this.shootPlayerBullet();
      this.fireCooldownMs = this.FIRE_COOLDOWN;
    }

    // Invincibility countdown
    if (this.playerInvincible) {
      this.playerInvincibleMs -= delta;
      if (this.playerInvincibleMs <= 0) {
        this.playerInvincible = false;
        this.tweens.killTweensOf(this.player);
        this.player.setAlpha(1);
      }
    }
  }

  private shootPlayerBullet(): void {
    const bullet = spawnPrefab(this, 'player_bullet', this.player.x, this.player.y - 34);
    (bullet as Phaser.GameObjects.Graphics).setDepth(4);
    this.playerBullets.add(bullet);
  }

  // ─── ENEMY MOVEMENT ──────────────────────────────────────────────────────

  private updateEnemyFormation(delta: number): void {
    const active = this.enemies.getChildren().filter(e => e.active) as Phaser.GameObjects.Graphics[];
    if (active.length === 0) return;

    // Boss — independent side-to-side sweep
    if (this.wave === 3 && this.bossGO?.active) {
      const newX = this.bossGO.x + this.BOSS_MOVE_SPEED * this.bossDir * (delta / 1000);
      if (newX > 570) this.bossDir = -1;
      else if (newX < 150) this.bossDir = 1;
      const cx = Phaser.Math.Clamp(newX, 150, 570);
      (this.bossGO as unknown as PhysicsGO).body.reset(cx, this.bossGO.y);
      return;
    }

    // Waves 1 & 2 — classic Space Invaders formation march
    if (this.enemyDropPending) {
      // All enemies drop and reverse direction
      active.forEach(e => {
        (e as unknown as PhysicsGO).body.reset(e.x, e.y + 32);
      });
      this.enemyDir *= -1;
      this.enemyDropPending = false;
      // Speed ramps with each drop
      this.enemySpeed = Math.min(this.enemySpeed * 1.08, 280);
    } else {
      const dx = this.enemySpeed * this.enemyDir * (delta / 1000);
      let hitLeft = false;
      let hitRight = false;
      active.forEach(e => {
        const nx = e.x + dx;
        if (nx < 48) hitLeft = true;
        if (nx > 672) hitRight = true;
      });

      if ((hitLeft && this.enemyDir < 0) || (hitRight && this.enemyDir > 0)) {
        this.enemyDropPending = true;
      } else {
        active.forEach(e => {
          (e as unknown as PhysicsGO).body.reset(e.x + dx, e.y);
        });
      }
    }

    // Game over if any enemy reaches the player's row
    active.forEach(e => {
      if (e.y > GAME_HEIGHT - 170) this.triggerGameOver();
    });
  }

  // ─── BULLETS ─────────────────────────────────────────────────────────────

  private cullOffScreenBullets(): void {
    this.playerBullets.getChildren().forEach(b => {
      if ((b as Phaser.GameObjects.Graphics).y < -40) b.destroy();
    });
    this.enemyBullets.getChildren().forEach(b => {
      if ((b as Phaser.GameObjects.Graphics).y > GAME_HEIGHT + 40) b.destroy();
    });
  }

  private tickTimers(delta: number): void {
    // Random enemy fire (waves 1 & 2 only — boss has its own fire logic)
    if (this.wave < 3) {
      this.enemyFireTimer -= delta;
      if (this.enemyFireTimer <= 0) {
        this.enemyFireTimer = this.ENEMY_FIRE_INTERVAL;
        this.fireRandomEnemy();
      }
    }

    // Boss spread fire
    if (this.wave === 3 && this.bossGO?.active) {
      this.bossFireTimer -= delta;
      if (this.bossFireTimer <= 0) {
        this.bossFireTimer = this.BOSS_FIRE_INTERVAL;
        this.fireBossSpread();
      }
    }
  }

  private fireRandomEnemy(): void {
    const active = this.enemies.getChildren().filter(e => e.active) as Phaser.GameObjects.Graphics[];
    if (active.length === 0) return;
    const shooter = active[Math.floor(Math.random() * active.length)];
    const bullet = spawnPrefab(this, 'enemy_bullet', shooter.x, shooter.y + 24);
    (bullet as Phaser.GameObjects.Graphics).setDepth(4);
    this.enemyBullets.add(bullet);
  }

  private fireBossSpread(): void {
    if (!this.bossGO?.active) return;
    const bx = this.bossGO.x;
    const by = this.bossGO.y + 54;
    // 3-way spread: left, centre, right
    [-22, 0, 22].forEach(angleDeg => {
      const bullet = spawnPrefab(this, 'enemy_bullet', bx, by) as Phaser.GameObjects.Graphics;
      bullet.setDepth(4);
      const body = (bullet as unknown as PhysicsGO).body;
      const rad = Phaser.Math.DegToRad(angleDeg);
      // "down" is +Y; rotate around the downward axis
      body.setVelocity(Math.sin(rad) * 520, Math.cos(rad) * 520);
      this.enemyBullets.add(bullet);
    });
  }

  // ─── COLLISIONS ──────────────────────────────────────────────────────────

  private onBulletHitEnemy(
    bullet: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject,
  ): void {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();

    const go = enemy as unknown as { getData: (k: string) => number; setData: (k: string, v: number) => void };
    const newHp = go.getData('hp') - 1;
    go.setData('hp', newHp);

    if (newHp <= 0) {
      const scoreVal = go.getData('scoreValue') ?? 100;
      const isBoss = enemy === (this.bossGO as unknown as Phaser.GameObjects.GameObject);

      this.addScore(scoreVal);
      this.spawnExplosion((enemy as Phaser.GameObjects.Graphics).x, (enemy as Phaser.GameObjects.Graphics).y, isBoss);

      if (isBoss) this.bossGO = null;
      enemy.destroy();

      // Enemies speed up as their numbers thin (classic Space Invaders feel)
      if (this.wave < 3) {
        const remaining = this.enemies.getChildren().filter(e => e.active).length;
        const rampSpeed = 80 + (12 - Math.max(remaining, 0)) * 10;
        this.enemySpeed = Math.min(Math.max(this.enemySpeed, rampSpeed), 300);
      }
    } else {
      // Hit flash — brief alpha pulse
      this.tweens.add({ targets: enemy, alpha: 0.15, duration: 55, yoyo: true });
    }
  }

  private onEnemyBulletHitPlayer(bullet: Phaser.GameObjects.GameObject): void {
    if (this.playerInvincible) return;
    bullet.destroy();
    this.damagePlayer();
  }

  private damagePlayer(): void {
    this.lives = Math.max(0, this.lives - 1);
    this.registry.set('lives', this.lives);
    this.cameras.main.shake(180, 0.013);
    this.cameras.main.flash(200, 200, 0, 0);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    this.playerInvincible = true;
    this.playerInvincibleMs = this.INVINCIBLE_MS;

    // Rapid alpha flicker during invincibility window
    this.tweens.add({
      targets: this.player,
      alpha: 0.12,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(this.INVINCIBLE_MS / 200),
    });
  }

  // ─── SCORE & EFFECTS ─────────────────────────────────────────────────────

  private addScore(val: number): void {
    this.score += val;
    this.registry.set('score', this.score);

    // Floating "+100" popup that drifts upward and fades
    const t = this.add
      .text(this.player.x + Phaser.Math.Between(-30, 30), this.player.y - 50, `+${val}`, {
        fontSize: '22px',
        color: '#ffff44',
        fontFamily: 'monospace',
        stroke: '#000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(1001);
    this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  private spawnExplosion(x: number, y: number, isBoss: boolean): void {
    const count = isBoss ? 30 : 14;
    const emitter = this.add.particles(x, y, 'particle', {
      speed: { min: isBoss ? 70 : 35, max: isBoss ? 230 : 140 },
      scale: { start: isBoss ? 1.8 : 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: isBoss ? 850 : 550,
      quantity: count,
      tint: isBoss ? [0xff4400, 0xff8800, 0xffdd00, 0xffffff] : [0xff6600, 0xffaa22, 0xffffff],
      blendMode: 'ADD',
      emitting: false,
    });
    emitter.setDepth(6);
    emitter.explode(count, x, y);
    this.time.delayedCall(isBoss ? 950 : 650, () => emitter.destroy());

    if (isBoss) {
      this.cameras.main.shake(500, 0.02);
      this.cameras.main.flash(300, 255, 110, 0);
    }
  }

  // ─── WAVE MANAGEMENT ─────────────────────────────────────────────────────

  private checkWaveComplete(): void {
    if (!this.waveSpawnDone) return;
    const remaining = this.enemies.getChildren().filter(e => e.active).length;
    if (remaining > 0) return;

    this.waveSpawnDone = false;

    if (this.wave >= 3) {
      this.triggerVictory();
    } else {
      this.inBannerDelay = true;
      this.time.delayedCall(1400, () => {
        this.inBannerDelay = false;
        this.startWave(this.wave + 1);
      });
    }
  }

  private startWave(waveNum: number): void {
    this.wave = waveNum;
    this.waveSpawnDone = false;
    this.enemyDir = 1;
    this.enemySpeed = getRule(this, 'enemies.baseSpeed', 80);
    this.enemyDropPending = false;
    this.bossGO = null;
    this.bossDir = 1;
    this.bossFireTimer = this.BOSS_FIRE_INTERVAL;
    this.enemyFireTimer = this.ENEMY_FIRE_INTERVAL;

    this.registry.set('wave', waveNum);

    // Clear leftover entities
    this.enemies.clear(true, true);
    this.playerBullets.clear(true, true);
    this.enemyBullets.clear(true, true);

    const label = waveNum === 3 ? '⚠ BOSS WAVE ⚠' : `WAVE ${waveNum}`;
    this.showBanner(label, () => {
      if (waveNum === 1) this.spawnWave1();
      else if (waveNum === 2) this.spawnWave2();
      else this.spawnWave3();
    });
  }

  private showBanner(text: string, onDone: () => void): void {
    this.inBannerDelay = true;
    this.waveBanner.setText(text).setAlpha(0).setScale(1);
    this.tweens.add({
      targets: this.waveBanner,
      alpha: 1,
      scaleX: { from: 0.7, to: 1 },
      scaleY: { from: 0.7, to: 1 },
      duration: 320,
      hold: 1100,
      yoyo: true,
      ease: 'Back.Out',
      onComplete: () => {
        this.inBannerDelay = false;
        onDone();
      },
    });
  }

  // ─── WAVE SPAWNERS ───────────────────────────────────────────────────────

  private spawnWave1(): void {
    // 12 grunts — 3 rows × 4 cols
    const cols = 4;
    const rows = 3;
    const spacingX = 120;
    const spacingY = 100;
    const startX = GAME_WIDTH / 2 - ((cols - 1) * spacingX) / 2;
    const startY = 160;
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;
        this.time.delayedCall(idx * 65, () => {
          this.spawnEnemy('enemy_grunt', x, y, 1, 100);
        });
        idx++;
      }
    }
    this.time.delayedCall(idx * 65 + 250, () => { this.waveSpawnDone = true; });
  }

  private spawnWave2(): void {
    // 6 bombers — V-formation (widest at top, converges at bottom)
    const cx = GAME_WIDTH / 2;
    const topY = 170;
    const positions: [number, number][] = [
      [cx - 185, topY],
      [cx + 185, topY],
      [cx - 115, topY + 95],
      [cx + 115, topY + 95],
      [cx - 45, topY + 190],
      [cx + 45, topY + 190],
    ];
    positions.forEach(([x, y], i) => {
      this.time.delayedCall(i * 110, () => {
        this.spawnEnemy('enemy_bomber', x, y, 2, 300);
      });
    });
    this.time.delayedCall(positions.length * 110 + 250, () => { this.waveSpawnDone = true; });
  }

  private spawnWave3(): void {
    // Single boss — dramatic entrance
    this.time.delayedCall(300, () => {
      const boss = this.spawnEnemy('enemy_boss', GAME_WIDTH / 2, 210, 15, 2000);
      this.bossGO = boss as unknown as Phaser.GameObjects.Graphics;
      this.waveSpawnDone = true;
    });
  }

  private spawnEnemy(
    prefabId: string,
    x: number,
    y: number,
    hp: number,
    scoreValue: number,
  ): Phaser.GameObjects.GameObject {
    const e = spawnPrefab(this, prefabId, x, y);
    const go = e as unknown as { setData: (k: string, v: unknown) => void; setDepth: (d: number) => void; setAlpha: (a: number) => void; setScale: (s: number) => void };
    go.setData('hp', hp);
    go.setData('scoreValue', scoreValue);
    go.setDepth(2);
    go.setAlpha(0);

    // Entry pop-in animation
    const isBoss = prefabId === 'enemy_boss';
    if (isBoss) {
      go.setScale(0.3);
      this.tweens.add({ targets: e, alpha: 1, scaleX: 1, scaleY: 1, duration: 550, ease: 'Back.Out' });
    } else {
      this.tweens.add({ targets: e, alpha: 1, duration: 180 });
    }

    this.enemies.add(e);
    return e;
  }

  // ─── OVERLAYS ────────────────────────────────────────────────────────────

  private triggerGameOver(): void {
    if (this.gameOver || this.gameWon) return;
    this.gameOver = true;
    this.cameras.main.shake(350, 0.018);
    this.time.delayedCall(550, () => this.showEndOverlay('GAME OVER', `Score: ${this.score}`, 0x5a0012));
  }

  private triggerVictory(): void {
    if (this.gameOver || this.gameWon) return;
    this.gameWon = true;
    this.time.delayedCall(700, () => this.showEndOverlay('VICTORY!', `Final Score: ${this.score}`, 0x003318));
  }

  private showEndOverlay(title: string, subtitle: string, bgColor: number): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const panel = this.add.rectangle(cx, cy, 580, 360, bgColor, 0.92).setDepth(1100);
    panel.setStrokeStyle(3, 0xffffff, 0.9);

    this.add
      .text(cx, cy - 100, title, {
        fontSize: '66px',
        color: '#ffffff',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(1101);

    this.add
      .text(cx, cy - 10, subtitle, {
        fontSize: '28px',
        color: '#ffdd44',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(1101);

    const retryLabel = this.add
      .text(cx, cy + 80, 'SPACE  to play again', {
        fontSize: '20px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(1101);

    // Blink the retry prompt
    this.tweens.add({ targets: retryLabel, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    // Listen for Space to restart
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.restart({ sceneId: this.sceneId });
    });
  }

  // ─── BACKGROUND ──────────────────────────────────────────────────────────

  private drawBackground(): void {
    const bg = this.add.graphics().setDepth(0);

    // Deep space fill
    bg.fillStyle(0x00000f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars — XOR-shift seeded RNG for determinism
    let seed = 0xdeadbeef;
    const rand = (): number => {
      seed ^= seed << 13;
      seed ^= seed >> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) / 0xffffffff);
    };

    for (let i = 0; i < 200; i++) {
      const sx = rand() * GAME_WIDTH;
      const sy = rand() * GAME_HEIGHT;
      const brightness = rand();
      const alpha = 0.25 + brightness * 0.75;
      const size = brightness > 0.88 ? 2 : 1;
      bg.fillStyle(0xffffff, alpha);
      bg.fillRect(sx, sy, size, size);
    }

    // A handful of tinted stars (blue-white and warm-yellow)
    for (let i = 0; i < 20; i++) {
      const sx = rand() * GAME_WIDTH;
      const sy = rand() * GAME_HEIGHT;
      const warm = rand() > 0.5;
      bg.fillStyle(warm ? 0xffeeaa : 0xaaccff, 0.55 + rand() * 0.4);
      bg.fillRect(sx, sy, 2, 2);
    }

    // Soft nebula wisps
    for (let i = 0; i < 4; i++) {
      const nx = rand() * GAME_WIDTH;
      const ny = rand() * GAME_HEIGHT;
      bg.fillStyle(0x1a0050, 0.18 + rand() * 0.12);
      bg.fillEllipse(nx, ny, 160 + rand() * 140, 60 + rand() * 50);
    }

    // Player zone separator line
    bg.lineStyle(1, 0x22334d, 0.55);
    bg.lineBetween(0, GAME_HEIGHT - 155, GAME_WIDTH, GAME_HEIGHT - 155);
  }
}
