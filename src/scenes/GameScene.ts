import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry, spawnPrefab } from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// ─── Types ────────────────────────────────────────────────────────────────────

type EnemyGO = Phaser.GameObjects.Graphics & { body: Phaser.Physics.Arcade.Body };

// ─── Scene ────────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  // Player
  private player!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Body;

  // Bullet / enemy groups (regular groups — bodies added by spawnPrefab)
  private playerBullets!: Phaser.GameObjects.Group;
  private enemyBullets!:  Phaser.GameObjects.Group;
  private enemies!:       Phaser.GameObjects.Group;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!:  Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;

  // Game state
  private score             = 0;
  private lives             = 3;
  private currentWave       = 0;
  private waveSpawnDone     = false;
  private waveTransitioning = false;
  private gameOverFlag      = false;
  private gameActive        = false;

  // Enemy formation movement
  private enemyDirX    = 1;   // +1 = right, -1 = left
  private enemySpeed   = 55;  // px / s
  private baseSpeed    = 55;
  private readonly DROP_Y  = 32;
  private readonly BOUND_L = 55;
  private readonly BOUND_R = GAME_WIDTH - 55;

  // Timing
  private lastPlayerShot   = 0;
  private lastEnemyFire    = 0;

  // Controls
  private cursors!:  Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!:     Phaser.Input.Keyboard.Key;
  private keyD!:     Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // Invincibility after taking a hit
  private invincible = false;

  // Tunable constants
  private readonly PLAYER_SPEED      = 350;
  private readonly SHOOT_COOLDOWN    = 270;
  private readonly ENEMY_FIRE_MS     = 1500;
  private readonly BOSS_FIRE_MS      = 700;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId          = data.sceneId;
    this.score            = 0;
    this.lives            = 3;
    this.currentWave      = 0;
    this.waveSpawnDone    = false;
    this.waveTransitioning= false;
    this.gameOverFlag     = false;
    this.gameActive       = false;
    this.enemyDirX        = 1;
    this.enemySpeed       = 55;
    this.baseSpeed        = 55;
    this.lastPlayerShot   = 0;
    this.lastEnemyFire    = 0;
    this.invincible       = false;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(): Promise<void> {
    await loadWorldScene(this, this.sceneId);

    this.drawBackground();
    this.setupPlayer();
    this.setupGroups();
    this.setupInput();
    this.setupColliders();
    this.createHUD();

    this.time.delayedCall(500, () => this.startWave(1));
    this.gameActive = true;
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground(): void {
    // Deep space gradient
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x000008, 0x000008, 0x04011a, 0x04011a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Star field (seeded, deterministic)
    const rng = new Phaser.Math.RandomDataGenerator(['space42']);
    for (let i = 0; i < 180; i++) {
      const x = rng.integerInRange(0, GAME_WIDTH);
      const y = rng.integerInRange(0, GAME_HEIGHT);
      const r = rng.realInRange(0.5, 2.2);
      bg.fillStyle(0xffffff, rng.realInRange(0.15, 0.85));
      bg.fillCircle(x, y, r);
    }

    // Nebula wisps
    const nb = this.add.graphics().setDepth(0);
    nb.fillStyle(0x1a0055, 0.10);
    nb.fillEllipse(500, 300, 420, 160);
    nb.fillStyle(0x001a44, 0.08);
    nb.fillEllipse(180, 800, 320, 130);
    nb.fillStyle(0x330011, 0.07);
    nb.fillEllipse(600, 950, 280, 100);

    // Player zone separator
    const line = this.add.graphics().setDepth(1);
    line.lineStyle(1, 0x1a3a5a, 0.45);
    line.lineBetween(0, GAME_HEIGHT - 140, GAME_WIDTH, GAME_HEIGHT - 140);
  }

  // ── Player ────────────────────────────────────────────────────────────────

  private setupPlayer(): void {
    const registry = getEntityRegistry(this)!;
    this.player = registry.byRole('player')[0] as Phaser.GameObjects.Graphics;
    this.player.setDepth(3);

    // SDK applies physics body (bodyW/bodyH) at spawn from world scene data;
    // we just grab the already-created body and enable world-bounds clamping.
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
  }

  // ── Groups ────────────────────────────────────────────────────────────────

  private setupGroups(): void {
    this.playerBullets = this.add.group();
    this.enemyBullets  = this.add.group();
    this.enemies       = this.add.group();
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private setupInput(): void {
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.keyA     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  // ── Colliders ─────────────────────────────────────────────────────────────

  private setupColliders(): void {
    this.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.enemyBullets,
      this.player,
      this.onEnemyBulletHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.enemies,
      this.player,
      this.onEnemyTouchPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  private createHUD(): void {
    const style = {
      fontFamily: '"Courier New", monospace',
      fontSize:   '22px',
      color:      '#00ddff',
      stroke:     '#000011',
      strokeThickness: 3,
    };

    this.scoreText = this.add
      .text(18, 18, 'SCORE  0', style)
      .setDepth(10);

    this.waveText = this.add
      .text(GAME_WIDTH / 2, 18, 'WAVE 1', { ...style, color: '#ffee55' })
      .setOrigin(0.5, 0)
      .setDepth(10);

    this.livesText = this.add
      .text(GAME_WIDTH - 18, 18, '♥ ♥ ♥', { ...style, color: '#ff6677' })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  private refreshHUD(): void {
    this.scoreText.setText(`SCORE  ${this.score}`);
    const count = Math.max(0, this.lives);
    this.livesText.setText(count > 0 ? Array(count + 1).join('♥ ').trim() : '---');
  }

  // ── Wave management ───────────────────────────────────────────────────────

  private startWave(wave: number): void {
    if (this.gameOverFlag) return;
    this.currentWave   = wave;
    this.waveSpawnDone = false;
    this.waveTransitioning = false;
    this.baseSpeed    = 55 * (1 + (wave - 1) * 0.28);
    this.enemySpeed   = this.baseSpeed;
    this.enemyDirX    = 1;

    this.waveText.setText(`WAVE ${wave}`);
    this.showWaveBanner(`WAVE ${wave}`);

    if (wave === 1)      this.spawnGrunts();
    else if (wave === 2) this.spawnBombers();
    else if (wave === 3) this.spawnBoss();
  }

  /** Wave 1 — 3×4 grid of grunts */
  private spawnGrunts(): void {
    const cols = 4, rows = 3;
    const spacingX = 140, spacingY = 105;
    const startX = GAME_WIDTH / 2 - ((cols - 1) / 2) * spacingX; // 150
    const startY = 200;

    let delay = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX;
        const y = startY + r * spacingY;
        this.time.delayedCall(delay, () => {
          if (this.gameOverFlag) return;
          const e = spawnPrefab(this, 'enemy_grunt', x, y) as EnemyGO;
          e.setDepth(2);
          e.setData('spawnX', x);
          e.setData('spawnY', y);
          e.setData('currentHp', e.getData('entityProperties').hp);
          this.enemies.add(e);
        });
        delay += 70;
      }
    }
    this.time.delayedCall(delay + 120, () => { this.waveSpawnDone = true; });
  }

  /** Wave 2 — 6 bombers in V-formation pointing toward player */
  private spawnBombers(): void {
    const count = 6;
    const center = (count - 1) / 2;   // 2.5
    const spacingX = 108;
    const spacingY = 88;
    const startX = GAME_WIDTH / 2 - center * spacingX;  // ~90
    const startY = 200;

    let delay = 0;
    for (let i = 0; i < count; i++) {
      const x = startX + i * spacingX;
      // V pointing DOWN: inner bombers closer to player (higher y)
      const y = startY + (center - Math.abs(i - center)) * spacingY;
      this.time.delayedCall(delay, () => {
        if (this.gameOverFlag) return;
        const e = spawnPrefab(this, 'enemy_bomber', x, y) as EnemyGO;
        e.setDepth(2);
        e.setData('spawnX', x);
        e.setData('spawnY', y);
        e.setData('currentHp', e.getData('entityProperties').hp);
        this.enemies.add(e);
      });
      delay += 140;
    }
    this.time.delayedCall(delay + 120, () => { this.waveSpawnDone = true; });
  }

  /** Wave 3 — single boss */
  private spawnBoss(): void {
    this.time.delayedCall(350, () => {
      if (this.gameOverFlag) return;
      const x = GAME_WIDTH / 2;
      const y = 230;
      const e = spawnPrefab(this, 'enemy_boss', x, y) as EnemyGO;
      e.setDepth(2);
      e.setData('spawnX', x);
      e.setData('spawnY', y);
      e.setData('currentHp', e.getData('entityProperties').hp);
      this.enemies.add(e);
      this.waveSpawnDone = true;
    });
  }

  private onWaveCleared(): void {
    if (this.currentWave >= 3) {
      this.time.delayedCall(1600, () => this.showVictory());
    } else {
      this.time.delayedCall(1400, () => this.startWave(this.currentWave + 1));
    }
  }

  // ── Enemy movement ────────────────────────────────────────────────────────

  private updateEnemyMovement(delta: number): void {
    const alive = this.enemies.getChildren().filter(e => e.active) as EnemyGO[];
    if (alive.length === 0) return;

    const dx = this.enemySpeed * this.enemyDirX * (delta / 1000);

    // Move all enemies via body.reset to keep physics body in sync
    alive.forEach(e => {
      const body = e.body as Phaser.Physics.Arcade.Body;
      body.reset(e.x + dx, e.y);
    });

    // Check formation bounds
    let minX = Infinity, maxX = -Infinity;
    alive.forEach(e => {
      if (e.x < minX) minX = e.x;
      if (e.x > maxX) maxX = e.x;
    });

    const hitRight = maxX > this.BOUND_R && this.enemyDirX > 0;
    const hitLeft  = minX < this.BOUND_L && this.enemyDirX < 0;

    if (hitRight || hitLeft) {
      this.enemyDirX *= -1;
      alive.forEach(e => {
        const body = e.body as Phaser.Physics.Arcade.Body;
        body.reset(e.x, e.y + this.DROP_Y);
      });
      this.checkEnemiesBottom(alive);
    }
  }

  private checkEnemiesBottom(alive: EnemyGO[]): void {
    if (this.gameOverFlag) return;
    if (alive.some(e => e.y > GAME_HEIGHT - 120)) {
      this.lives = 0;
      this.refreshHUD();
      this.triggerGameOver();
    }
  }

  // ── Collision handlers ────────────────────────────────────────────────────

  private onBulletHitEnemy(
    bullet: Phaser.GameObjects.GameObject,
    enemy:  Phaser.GameObjects.GameObject,
  ): void {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();

    const props = enemy.getData('entityProperties') as { hp: number; scoreValue: number };
    let hp = (enemy.getData('currentHp') as number) - 1;
    enemy.setData('currentHp', hp);

    if (hp > 0) {
      // Hit flash
      this.tweens.add({
        targets: enemy, alpha: { from: 0.15, to: 1 },
        duration: 60, yoyo: true, repeat: 1,
      });
    } else {
      // Kill
      this.score += props.scoreValue;
      this.scoreText.setText(`SCORE  ${this.score}`);
      this.tweens.add({ targets: this.scoreText, scaleX: 1.18, scaleY: 1.18, duration: 65, yoyo: true });

      const isBig = enemy.getData('entityPrefabId') === 'enemy_boss';
      this.spawnExplosion((enemy as EnemyGO).x, (enemy as EnemyGO).y, isBig);
      enemy.destroy();

      // Speed up remaining enemies as their numbers fall
      const remaining = this.enemies.getChildren().filter(e => e.active).length;
      if (remaining > 0) {
        const killFraction = 1 - remaining / Math.max(remaining + 1, 1);
        this.enemySpeed = this.baseSpeed * (1 + killFraction * 1.6) * Math.sign(this.enemyDirX || 1) * Math.sign(1);
        // Preserve direction sign
        this.enemySpeed = this.baseSpeed * (1 + killFraction * 1.6);
      }
    }
  }

  private onEnemyBulletHitPlayer(
    bullet: Phaser.GameObjects.GameObject,
    _player: Phaser.GameObjects.GameObject,
  ): void {
    if (this.invincible || this.gameOverFlag) return;
    if (bullet.active) bullet.destroy();
    this.damagePlayer();
  }

  private onEnemyTouchPlayer(
    enemy:   Phaser.GameObjects.GameObject,
    _player: Phaser.GameObjects.GameObject,
  ): void {
    if (this.invincible || this.gameOverFlag) return;
    if (enemy.active) enemy.destroy();
    this.damagePlayer();
  }

  private damagePlayer(): void {
    this.lives--;
    this.refreshHUD();

    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      this.invincible = true;
      this.time.delayedCall(2200, () => { this.invincible = false; });
      this.tweens.add({
        targets: this.player, alpha: { from: 0.1, to: 1 },
        duration: 110, yoyo: true, repeat: 9,
      });
    }
  }

  // ── Enemy firing ──────────────────────────────────────────────────────────

  private fireEnemyBullet(): void {
    const alive = this.enemies.getChildren().filter(e => e.active) as EnemyGO[];
    if (alive.length === 0) return;

    const isBoss = this.currentWave === 3;
    const shooter = alive[Math.floor(Math.random() * alive.length)];
    const count   = isBoss ? 3 : 1;

    for (let i = 0; i < count; i++) {
      const spread = isBoss ? (i - 1) * (Math.PI / 9) : 0;
      const vx = Math.sin(spread) * 320;
      const vy = Math.cos(spread) * 320;

      const b = spawnPrefab(this, 'enemy_bullet', shooter.x, shooter.y + 28, {
        physics: { velocityX: vx, velocityY: vy },
      }) as Phaser.GameObjects.Graphics;
      b.setDepth(4);
      this.enemyBullets.add(b);
    }
  }

  // ── Player firing ─────────────────────────────────────────────────────────

  private firePlayerBullet(): void {
    const b = spawnPrefab(this, 'player_bullet', this.player.x, this.player.y - 38) as Phaser.GameObjects.Graphics;
    b.setDepth(4);
    this.playerBullets.add(b);
  }

  // ── Explosion ─────────────────────────────────────────────────────────────

  private spawnExplosion(x: number, y: number, big = false): void {
    const count   = big ? 18 : 10;
    const palette = big
      ? [0xff2244, 0xff8800, 0xffcc00, 0xff4488, 0xffffff]
      : [0xffaa22, 0xff6600, 0xffee44, 0xffffff];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = Phaser.Math.Between(big ? 90 : 55, big ? 240 : 150);
      const col   = palette[i % palette.length];
      const r     = Phaser.Math.Between(2, big ? 8 : 5);

      const p = this.add.graphics().setDepth(5);
      p.fillStyle(col, 1);
      p.fillCircle(0, 0, r);
      p.setPosition(x, y);

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed * 0.55,
        y: y + Math.sin(angle) * speed * 0.55,
        alpha: 0,
        duration: big ? 580 : 380,
        ease: 'Power2Out',
        onComplete: () => p.destroy(),
      });
    }

    // Shockwave ring
    const ring = this.add.graphics().setDepth(5).setPosition(x, y);
    ring.lineStyle(big ? 4 : 2.5, big ? 0xff2244 : 0xffdd44, 1);
    ring.strokeCircle(0, 0, big ? 12 : 7);
    this.tweens.add({
      targets: ring,
      scaleX: big ? 7 : 4.5,
      scaleY: big ? 7 : 4.5,
      alpha: 0,
      duration: big ? 520 : 310,
      ease: 'Power2Out',
      onComplete: () => ring.destroy(),
    });
  }

  // ── Overlays ──────────────────────────────────────────────────────────────

  private showWaveBanner(text: string): void {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, text, {
        fontFamily: '"Courier New", monospace',
        fontSize:   '72px',
        color:      '#ffee55',
        stroke:     '#000000',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0);
    this.tweens.add({
      targets: t, alpha: 1, duration: 300, hold: 900, yoyo: true,
      onComplete: () => t.destroy(),
    });
  }

  private triggerGameOver(): void {
    if (this.gameOverFlag) return;
    this.gameOverFlag = true;
    this.gameActive   = false;

    this.spawnExplosion(this.player.x, this.player.y, true);
    this.player.setVisible(false);

    this.time.delayedCall(900, () => {
      const bg = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
        .setDepth(999);
      this.tweens.add({ targets: bg, alpha: 0.65, duration: 450 });

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'GAME OVER', {
        fontFamily: '"Courier New", monospace', fontSize: '66px',
        color: '#ff3344', stroke: '#000', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(1000);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, `SCORE  ${this.score}`, {
        fontFamily: '"Courier New", monospace', fontSize: '34px', color: '#ffee55',
      }).setOrigin(0.5).setDepth(1000);

      const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 65, 'PRESS SPACE TO TRY AGAIN', {
        fontFamily: '"Courier New", monospace', fontSize: '22px', color: '#aaaacc',
      }).setOrigin(0.5).setDepth(1000);
      this.tweens.add({ targets: prompt, alpha: { from: 0.3, to: 1 }, duration: 580, yoyo: true, repeat: -1 });

      this.input.keyboard!.once('keydown-SPACE', () => this.scene.restart());
    });
  }

  private showVictory(): void {
    if (this.gameOverFlag) return;
    this.gameActive = false;

    const bg = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000020, 0)
      .setDepth(999);
    this.tweens.add({ targets: bg, alpha: 0.65, duration: 500 });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'VICTORY!', {
      fontFamily: '"Courier New", monospace', fontSize: '78px',
      color: '#44ff88', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(1000);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 5, `FINAL SCORE  ${this.score}`, {
      fontFamily: '"Courier New", monospace', fontSize: '32px', color: '#ffee55',
    }).setOrigin(0.5).setDepth(1000);

    const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 65, 'PRESS SPACE TO PLAY AGAIN', {
      fontFamily: '"Courier New", monospace', fontSize: '22px', color: '#aaffcc',
    }).setOrigin(0.5).setDepth(1000);
    this.tweens.add({ targets: prompt, alpha: { from: 0.3, to: 1 }, duration: 580, yoyo: true, repeat: -1 });

    this.input.keyboard!.once('keydown-SPACE', () => this.scene.restart());
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    if (!this.gameActive || this.gameOverFlag) return;

    // ── Player movement
    const leftDown  = this.cursors.left.isDown  || this.keyA.isDown;
    const rightDown = this.cursors.right.isDown || this.keyD.isDown;
    if (leftDown)       this.playerBody.setVelocityX(-this.PLAYER_SPEED);
    else if (rightDown) this.playerBody.setVelocityX(this.PLAYER_SPEED);
    else                this.playerBody.setVelocityX(0);

    // ── Player shooting
    const fireKey = this.cursors.up.isDown || this.keySpace.isDown;
    if (fireKey && time - this.lastPlayerShot > this.SHOOT_COOLDOWN) {
      this.lastPlayerShot = time;
      this.firePlayerBullet();
    }

    // ── Enemy movement
    this.updateEnemyMovement(delta);

    // ── Enemy auto-fire
    const fireInterval = this.currentWave === 3 ? this.BOSS_FIRE_MS : this.ENEMY_FIRE_MS;
    if (time - this.lastEnemyFire > fireInterval) {
      this.lastEnemyFire = time;
      this.fireEnemyBullet();
    }

    // ── Cull off-screen bullets
    this.playerBullets.getChildren().forEach(b => {
      if ((b as Phaser.GameObjects.Graphics).y < -30) b.destroy();
    });
    this.enemyBullets.getChildren().forEach(b => {
      if ((b as Phaser.GameObjects.Graphics).y > GAME_HEIGHT + 30) b.destroy();
    });

    // ── Wave-clear detection
    if (
      this.waveSpawnDone &&
      !this.waveTransitioning &&
      this.enemies.getChildren().filter(e => e.active).length === 0
    ) {
      this.waveTransitioning = true;
      this.onWaveCleared();
    }
  }
}
