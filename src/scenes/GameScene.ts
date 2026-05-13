import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry, resolveRenderScript } from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// ─── Types ─────────────────────────────────────────────────────────────────

type EnemyType = 'grunt' | 'bomber' | 'boss';

interface EnemySpec {
  script: string;
  w: number;
  h: number;
  params: Record<string, unknown>;
  bw: number;
  bh: number;
  hp: number;
  score: number;
}

const ENEMY: Record<EnemyType, EnemySpec> = {
  grunt: {
    script: 'src/visuals/enemy-grunt.ts',
    w: 44, h: 40, params: { color: '#44ee55', eyeColor: '#ffff44' },
    bw: 32, bh: 24, hp: 1, score: 100,
  },
  bomber: {
    script: 'src/visuals/enemy-bomber.ts',
    w: 58, h: 48, params: { color: '#ff8822', glowColor: '#ffcc44' },
    bw: 46, bh: 34, hp: 2, score: 300,
  },
  boss: {
    script: 'src/visuals/enemy-boss.ts',
    w: 140, h: 118, params: { color: '#cc1133', eyeColor: '#ff4488', phase: 1 },
    bw: 100, bh: 80, hp: 15, score: 2000,
  },
};

// ─── Scene ─────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  // Player
  private player!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Body;

  // Groups
  private playerBullets!: Phaser.GameObjects.Group;
  private enemyBullets!: Phaser.GameObjects.Group;
  private enemies!: Phaser.GameObjects.Group;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;

  // State
  private score = 0;
  private lives = 3;
  private currentWave = 0;
  private waveSpawnComplete = false;
  private waveTransitioning = false;
  private gameOverFlag = false;
  private gameActive = false;

  // Enemy movement
  private enemyVelX = 55;
  private baseSpeed = 55;
  private readonly DROP_AMOUNT = 26;

  // Timers
  private lastPlayerShot = 0;
  private lastEnemyFire = 0;
  private invincible = false;

  // Tuning
  private readonly PLAYER_SPEED = 380;
  private readonly SHOOT_COOLDOWN = 240;
  private readonly BULLET_SPEED = 720;
  private readonly ENEMY_BULLET_SPEED = 320;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
    this.score = 0;
    this.lives = 3;
    this.currentWave = 0;
    this.waveSpawnComplete = false;
    this.waveTransitioning = false;
    this.gameOverFlag = false;
    this.gameActive = false;
    this.enemyVelX = 55;
    this.baseSpeed = 55;
    this.lastPlayerShot = 0;
    this.lastEnemyFire = 0;
    this.invincible = false;
  }

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
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x000008, 0x000008, 0x050128, 0x050128, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars (deterministic)
    const rng = new Phaser.Math.RandomDataGenerator(['si-invaders-42']);
    for (let i = 0; i < 180; i++) {
      const x = rng.integerInRange(0, GAME_WIDTH);
      const y = rng.integerInRange(0, GAME_HEIGHT);
      const r = rng.realInRange(0.5, 2.2);
      bg.fillStyle(0xffffff, rng.realInRange(0.15, 0.85));
      bg.fillCircle(x, y, r);
    }

    // Nebula wisps
    const neb = this.add.graphics().setDepth(0);
    neb.fillStyle(0x220066, 0.09);
    neb.fillEllipse(540, 320, 320, 140);
    neb.fillStyle(0x003355, 0.08);
    neb.fillEllipse(120, 760, 260, 100);

    // Player zone divider
    const zone = this.add.graphics().setDepth(1);
    zone.lineStyle(1, 0x1a3a5a, 0.45);
    zone.lineBetween(0, GAME_HEIGHT - 110, GAME_WIDTH, GAME_HEIGHT - 110);
  }

  // ── Player ────────────────────────────────────────────────────────────────

  private setupPlayer(): void {
    const registry = getEntityRegistry(this)!;
    this.player = registry.byRole('player')[0] as Phaser.GameObjects.Graphics;
    this.player.setDepth(3);

    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setSize(44, 38);
    this.playerBody.setOffset(-22, -19);
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setAllowGravity(false);
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
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#00ddff',
      stroke: '#000011',
      strokeThickness: 4,
    };
    this.scoreText = this.add.text(18, 16, 'SCORE  0', style).setDepth(10);
    this.waveText  = this.add
      .text(GAME_WIDTH / 2, 16, 'WAVE 1', { ...style, color: '#ffee55' })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.livesText = this.add
      .text(GAME_WIDTH - 18, 16, '♥ ♥ ♥', { ...style, color: '#ff6677' })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  private refreshLives(): void {
    const n = Math.max(0, this.lives);
    this.livesText.setText(n > 0 ? Array(n + 1).join('♥ ').trim() : '---');
  }

  // ── Enemy spawning ────────────────────────────────────────────────────────

  private spawnEnemy(type: EnemyType, x: number, y: number): Phaser.GameObjects.Graphics {
    const spec = ENEMY[type];
    const g = this.add.graphics();
    g.setPosition(x, y);

    const renderFn = resolveRenderScript(this.game, spec.script);
    if (renderFn) {
      renderFn(g, spec.params);
    } else {
      g.fillStyle(0xff3300, 1);
      g.fillRect(-spec.bw / 2, -spec.bh / 2, spec.bw, spec.bh);
    }

    g.setData('type', type);
    g.setData('hp', spec.hp);
    g.setData('score', spec.score);
    g.setDepth(2);

    this.physics.add.existing(g);
    const body = g.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(spec.bw, spec.bh);
    body.setOffset(-spec.bw / 2, -spec.bh / 2);

    return g;
  }

  // ── Wave management ───────────────────────────────────────────────────────

  private startWave(wave: number): void {
    if (this.gameOverFlag) return;
    this.currentWave = wave;
    this.waveSpawnComplete = false;
    this.waveTransitioning = false;

    // Speed ramp each wave
    this.baseSpeed = 55 * (1 + (wave - 1) * 0.28);
    this.enemyVelX = this.baseSpeed;

    this.waveText.setText(`WAVE ${wave}`);
    this.showWaveBanner(`WAVE ${wave}`);

    if (wave === 1)      this.spawnGrunts();
    else if (wave === 2) this.spawnBombers();
    else if (wave === 3) this.spawnBoss();
  }

  /** Wave 1 — 3 rows × 4 cols = 12 grunts */
  private spawnGrunts(): void {
    const cols = 4;
    const rows = 3;
    const spacingX = 118;
    const spacingY = 78;
    const startX = GAME_WIDTH / 2 - ((cols - 1) / 2) * spacingX; // 360 - 1.5*118 = 183
    const startY = 90;

    let delay = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX;
        const y = startY + r * spacingY;
        this.time.delayedCall(delay, () => {
          if (this.gameOverFlag) return;
          this.enemies.add(this.spawnEnemy('grunt', x, y));
        });
        delay += 70;
      }
    }
    this.time.delayedCall(delay + 80, () => { this.waveSpawnComplete = true; });
  }

  /** Wave 2 — 6 bombers in V-formation */
  private spawnBombers(): void {
    const count = 6;
    const spacingX = 100;
    const spacingY = 52;
    const originX = GAME_WIDTH / 2;
    const originY = 115;
    const center = (count - 1) / 2; // 2.5

    let delay = 0;
    for (let i = 0; i < count; i++) {
      const x = originX + (i - center) * spacingX;
      // V points downward: center ships are lowest
      const y = originY + Math.abs(i - center) * spacingY;
      this.time.delayedCall(delay, () => {
        if (this.gameOverFlag) return;
        this.enemies.add(this.spawnEnemy('bomber', x, y));
      });
      delay += 140;
    }
    this.time.delayedCall(delay + 80, () => { this.waveSpawnComplete = true; });
  }

  /** Wave 3 — single boss */
  private spawnBoss(): void {
    this.time.delayedCall(300, () => {
      if (this.gameOverFlag) return;
      this.enemies.add(this.spawnEnemy('boss', GAME_WIDTH / 2, 160));
      this.waveSpawnComplete = true;
    });
  }

  private onWaveCleared(): void {
    const next = this.currentWave + 1;
    if (next > 3) {
      this.time.delayedCall(1500, () => this.showVictory());
    } else {
      this.time.delayedCall(1500, () => this.startWave(next));
    }
  }

  // ── Collision handlers ────────────────────────────────────────────────────

  private onBulletHitEnemy(
    bullet: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject,
  ): void {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();

    const hp = (enemy.getData('hp') as number) - 1;
    enemy.setData('hp', hp);

    if (hp > 0) {
      // Hit flash
      this.tweens.add({
        targets: enemy, alpha: { from: 0.15, to: 1 }, duration: 50, yoyo: true, repeat: 1,
      });
    } else {
      const pts = enemy.getData('score') as number;
      this.score += pts;
      this.scoreText.setText(`SCORE  ${this.score}`);
      this.tweens.add({ targets: this.scoreText, scaleX: 1.18, scaleY: 1.18, duration: 65, yoyo: true });

      const isBig = (enemy.getData('type') as EnemyType) === 'boss';
      this.spawnExplosion((enemy as Phaser.GameObjects.Graphics).x, (enemy as Phaser.GameObjects.Graphics).y, isBig);
      enemy.destroy();

      // Accelerate survivors
      const aliveAfter = this.enemies.getChildren().filter(e => e.active).length;
      if (aliveAfter > 0) {
        const killRatio = 1 / Math.max(aliveAfter, 1);
        const mult = 1 + killRatio * 1.6;
        this.enemyVelX = Math.sign(this.enemyVelX || 1) * this.baseSpeed * mult;
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
    enemy: Phaser.GameObjects.GameObject,
    _player: Phaser.GameObjects.GameObject,
  ): void {
    if (this.invincible || this.gameOverFlag) return;
    if (enemy.active) enemy.destroy();
    this.damagePlayer();
  }

  private damagePlayer(): void {
    this.lives--;
    this.refreshLives();
    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      this.invincible = true;
      this.time.delayedCall(2200, () => { this.invincible = false; });
      // Invincibility flash
      this.tweens.add({
        targets: this.player,
        alpha: { from: 0.12, to: 1 },
        duration: 110,
        yoyo: true,
        repeat: 9,
      });
    }
  }

  // ── Explosion ─────────────────────────────────────────────────────────────

  private spawnExplosion(x: number, y: number, big = false): void {
    const count = big ? 18 : 9;
    const palette = big
      ? [0xff2244, 0xff8800, 0xffcc00, 0xff4488, 0xffffff]
      : [0xffaa22, 0xff6600, 0xffee44, 0xffffff];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = Phaser.Math.Between(big ? 90 : 55, big ? 240 : 150);
      const col = palette[i % palette.length];
      const r = Phaser.Math.Between(2, big ? 9 : 5);

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
    ring.strokeCircle(0, 0, big ? 12 : 6);
    this.tweens.add({
      targets: ring,
      scaleX: big ? 7 : 5,
      scaleY: big ? 7 : 5,
      alpha: 0,
      duration: big ? 520 : 300,
      ease: 'Power2Out',
      onComplete: () => ring.destroy(),
    });
  }

  // ── Banners / Overlays ────────────────────────────────────────────────────

  private showWaveBanner(text: string): void {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, text, {
        fontFamily: '"Courier New", monospace',
        fontSize: '66px',
        color: '#ffee55',
        stroke: '#000000',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0);
    this.tweens.add({
      targets: t,
      alpha: 1,
      duration: 280,
      hold: 900,
      yoyo: true,
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

      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'GAME OVER', {
          fontFamily: '"Courier New", monospace',
          fontSize: '64px',
          color: '#ff3344',
          stroke: '#000',
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(1000);

      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `SCORE  ${this.score}`, {
          fontFamily: '"Courier New", monospace',
          fontSize: '34px',
          color: '#ffee55',
        })
        .setOrigin(0.5)
        .setDepth(1000);

      const prompt = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 88, 'PRESS SPACE TO TRY AGAIN', {
          fontFamily: '"Courier New", monospace',
          fontSize: '21px',
          color: '#aaaacc',
        })
        .setOrigin(0.5)
        .setDepth(1000);
      this.tweens.add({ targets: prompt, alpha: { from: 0.3, to: 1 }, duration: 600, yoyo: true, repeat: -1 });

      this.input.keyboard!.once('keydown-SPACE', () => this.scene.restart());
    });
  }

  private showVictory(): void {
    if (this.gameOverFlag) return;
    this.gameActive = false;

    const bg = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000020, 0)
      .setDepth(999);
    this.tweens.add({ targets: bg, alpha: 0.7, duration: 500 });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'VICTORY!', {
        fontFamily: '"Courier New", monospace',
        fontSize: '70px',
        color: '#44ff88',
        stroke: '#000',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(1000);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `FINAL SCORE  ${this.score}`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '32px',
        color: '#ffee55',
      })
      .setOrigin(0.5)
      .setDepth(1000);

    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 88, 'PRESS SPACE TO PLAY AGAIN', {
        fontFamily: '"Courier New", monospace',
        fontSize: '21px',
        color: '#aaffcc',
      })
      .setOrigin(0.5)
      .setDepth(1000);
    this.tweens.add({ targets: prompt, alpha: { from: 0.3, to: 1 }, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard!.once('keydown-SPACE', () => this.scene.restart());
  }

  // ── Shooting ──────────────────────────────────────────────────────────────

  private firePlayerBullet(): void {
    const g = this.add.graphics();
    g.setPosition(this.player.x, this.player.y - 34);
    const renderFn = resolveRenderScript(this.game, 'src/visuals/player-bullet.ts');
    if (renderFn) renderFn(g, { color: '#00eeff' });
    else { g.fillStyle(0x00eeff, 1); g.fillRect(-2, -10, 4, 20); }
    g.setDepth(4);

    this.physics.add.existing(g);
    const body = g.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(4, 20);
    body.setOffset(-2, -10);
    body.setVelocityY(-this.BULLET_SPEED);
    this.playerBullets.add(g);
  }

  private fireEnemyBullet(): void {
    const alive = this.enemies.getChildren().filter(e => e.active) as Phaser.GameObjects.Graphics[];
    if (alive.length === 0) return;

    const isBoss = this.currentWave === 3;
    const count  = isBoss ? 3 : 1;
    const shooter = alive[Phaser.Math.Between(0, alive.length - 1)];

    for (let i = 0; i < count; i++) {
      const spread = isBoss ? (i - 1) * (Math.PI / 10) : 0;
      const vx = Math.sin(spread) * this.ENEMY_BULLET_SPEED;
      const vy = Math.cos(spread) * this.ENEMY_BULLET_SPEED;

      const g = this.add.graphics();
      g.setPosition(shooter.x, shooter.y + 26);
      const renderFn = resolveRenderScript(this.game, 'src/visuals/enemy-bullet.ts');
      if (renderFn) renderFn(g, { color: '#ff4422' });
      else { g.fillStyle(0xff4422, 1); g.fillRect(-2.5, -7, 5, 14); }
      g.setDepth(4);

      this.physics.add.existing(g);
      const body = g.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setSize(5, 14);
      body.setOffset(-2.5, -7);
      body.setVelocity(vx, vy);
      this.enemyBullets.add(g);
    }
  }

  // ── Enemy movement ────────────────────────────────────────────────────────

  private readonly LEFT_WALL  = 55;
  private readonly RIGHT_WALL = GAME_WIDTH - 55;

  private updateEnemyMovement(delta: number): void {
    const alive = this.enemies.getChildren().filter(e => e.active) as Phaser.GameObjects.Graphics[];
    if (alive.length === 0) return;

    const dx = this.enemyVelX * (delta / 1000);
    alive.forEach(e => { e.x += dx; });

    let minX = Infinity;
    let maxX = -Infinity;
    alive.forEach(e => { if (e.x < minX) minX = e.x; if (e.x > maxX) maxX = e.x; });

    if (maxX > this.RIGHT_WALL && this.enemyVelX > 0) {
      this.enemyVelX = -Math.abs(this.enemyVelX);
      alive.forEach(e => { e.y += this.DROP_AMOUNT; });
      this.checkEnemiesAtBottom(alive);
    } else if (minX < this.LEFT_WALL && this.enemyVelX < 0) {
      this.enemyVelX = Math.abs(this.enemyVelX);
      alive.forEach(e => { e.y += this.DROP_AMOUNT; });
      this.checkEnemiesAtBottom(alive);
    }
  }

  private checkEnemiesAtBottom(alive: Phaser.GameObjects.Graphics[]): void {
    if (this.gameOverFlag) return;
    if (alive.some(e => e.y > GAME_HEIGHT - 120)) {
      this.lives = 0;
      this.refreshLives();
      this.triggerGameOver();
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    if (!this.gameActive || this.gameOverFlag) return;

    // Player movement
    const leftDown  = this.cursors.left.isDown  || this.keyA.isDown;
    const rightDown = this.cursors.right.isDown || this.keyD.isDown;
    if (leftDown)        this.playerBody.setVelocityX(-this.PLAYER_SPEED);
    else if (rightDown)  this.playerBody.setVelocityX(this.PLAYER_SPEED);
    else                 this.playerBody.setVelocityX(0);

    // Shooting
    if (
      (this.cursors.up.isDown || this.keySpace.isDown) &&
      time - this.lastPlayerShot > this.SHOOT_COOLDOWN
    ) {
      this.lastPlayerShot = time;
      this.firePlayerBullet();
    }

    // Enemy movement
    this.updateEnemyMovement(delta);

    // Enemy fire rate (boss fires faster)
    const fireInterval = this.currentWave === 3 ? 720 : 1350;
    if (time - this.lastEnemyFire > fireInterval) {
      this.lastEnemyFire = time;
      this.fireEnemyBullet();
    }

    // Cull off-screen bullets
    this.playerBullets.getChildren().forEach(b => {
      if ((b as Phaser.GameObjects.Graphics).y < -40) b.destroy();
    });
    this.enemyBullets.getChildren().forEach(b => {
      if ((b as Phaser.GameObjects.Graphics).y > GAME_HEIGHT + 40) b.destroy();
    });

    // Wave clear detection
    if (
      this.waveSpawnComplete &&
      !this.waveTransitioning &&
      this.enemies.getChildren().filter(e => e.active).length === 0
    ) {
      this.waveTransitioning = true;
      this.onWaveCleared();
    }
  }
}
