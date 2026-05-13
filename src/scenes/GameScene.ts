import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry, spawnPrefab } from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// ─── Tunable constants ────────────────────────────────────────────────────────
const PLAYER_SPEED       = 340;
const SHOOT_COOLDOWN_MS  = 270;
const BULLET_SPEED       = 700;
const ENEMY_BULLET_SPEED = 290;
const LIVES_START        = 3;

// Enemy fire intervals (ms)
const GRUNT_FIRE_INTERVAL  = 1300;
const BOMBER_FIRE_INTERVAL = 1000;
const BOSS_FIRE_INTERVAL   = 560;

// Enemy movement
const BASE_SPEED: Record<number, number> = { 1: 72, 2: 95, 3: 55 };
const DROP_AMOUNT = 32;
const EDGE_L = 60;
const EDGE_R = 660;
const GAME_OVER_Y = 1060;   // if enemies reach here → game over

// ─── Scene ────────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  // Player
  private player!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Body;

  // Groups
  private playerBullets!: Phaser.GameObjects.Group;
  private enemyBullets!:  Phaser.GameObjects.Group;
  private enemies!:        Phaser.GameObjects.Group;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!:  Phaser.GameObjects.Text;

  // Pause button
  private pauseBtnGfx!: Phaser.GameObjects.Graphics;
  private pauseOverlayContainer: Phaser.GameObjects.Container | null = null;

  // State
  private score = 0;
  private lives = LIVES_START;
  private currentWave    = 0;
  private waveSpawnDone  = false;
  private waveClearLock  = false;
  private gameOverFlag   = false;
  private gameActive     = false;
  private invincible     = false;
  private paused         = false;

  // Enemy movement
  private enemyDirX  = 1;    // +1 right, -1 left
  private enemySpeed = BASE_SPEED[1];

  // Timing
  private lastShotTime     = 0;
  private lastEnemyFireMs  = 0;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!:    Phaser.Input.Keyboard.Key;
  private keyD!:    Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyP!:    Phaser.Input.Keyboard.Key;
  private keyEsc!:  Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId       = data.sceneId;
    this.score         = 0;
    this.lives         = LIVES_START;
    this.currentWave   = 0;
    this.waveSpawnDone = false;
    this.waveClearLock = false;
    this.gameOverFlag  = false;
    this.gameActive    = false;
    this.invincible    = false;
    this.paused        = false;
    this.pauseOverlayContainer = null;
    this.enemyDirX     = 1;
    this.enemySpeed    = BASE_SPEED[1];
    this.lastShotTime  = 0;
    this.lastEnemyFireMs = 0;
  }

  async create(): Promise<void> {
    await loadWorldScene(this, this.sceneId);

    this.drawBackground();
    this.setupPlayer();
    this.setupGroups();
    this.setupInput();
    this.setupColliders();
    this.createHUD();
    this.createPauseButton();

    this.time.delayedCall(500, () => this.startWave(1));
    this.gameActive = true;
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground(): void {
    const g = this.add.graphics().setDepth(0);
    // Deep space gradient
    g.fillGradientStyle(0x000008, 0x000008, 0x050118, 0x050118, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars (seeded for determinism)
    const rng = new Phaser.Math.RandomDataGenerator(['si-stars-v1']);
    for (let i = 0; i < 180; i++) {
      const x = rng.integerInRange(0, GAME_WIDTH);
      const y = rng.integerInRange(0, GAME_HEIGHT);
      const r = rng.realInRange(0.4, 2.2);
      g.fillStyle(0xffffff, rng.realInRange(0.15, 0.85));
      g.fillCircle(x, y, r);
    }

    // Nebula wisps
    const nb = this.add.graphics().setDepth(0);
    nb.fillStyle(0x1a0055, 0.09);
    nb.fillEllipse(560, 300, 340, 130);
    nb.fillStyle(0x002255, 0.08);
    nb.fillEllipse(130, 700, 260, 110);
    nb.fillStyle(0x110033, 0.07);
    nb.fillEllipse(380, 950, 300, 90);

    // Player zone divider
    const line = this.add.graphics().setDepth(1);
    line.lineStyle(1, 0x1a3a5a, 0.45);
    line.lineBetween(0, GAME_HEIGHT - 130, GAME_WIDTH, GAME_HEIGHT - 130);
  }

  // ── Player ────────────────────────────────────────────────────────────────

  private setupPlayer(): void {
    const reg = getEntityRegistry(this)!;
    this.player = reg.byRole('player')[0] as Phaser.GameObjects.Graphics;
    this.player.setDepth(3);

    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setSize(40, 36);
    this.playerBody.setOffset(-20, -18);
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
    this.keyP     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyEsc   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  // ── Colliders ─────────────────────────────────────────────────────────────

  private setupColliders(): void {
    this.physics.add.overlap(
      this.playerBullets, this.enemies,
      this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );
    this.physics.add.overlap(
      this.enemyBullets, this.player,
      this.onEnemyBulletHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );
    this.physics.add.overlap(
      this.enemies, this.player,
      this.onEnemyTouchPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  private createHUD(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#00ddff',
      stroke: '#000011',
      strokeThickness: 3,
    };

    this.scoreText = this.add
      .text(18, 14, 'SCORE  0', style)
      .setDepth(10);

    this.waveText = this.add
      .text(GAME_WIDTH / 2, 14, 'WAVE 1', { ...style, color: '#ffee55' })
      .setOrigin(0.5, 0)
      .setDepth(10);

    this.livesText = this.add
      .text(GAME_WIDTH - 18, 14, '♥ ♥ ♥', { ...style, color: '#ff6677' })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  private createPauseButton(): void {
    const bx = GAME_WIDTH - 44;
    const by = GAME_HEIGHT - 44;

    this.pauseBtnGfx = this.add.graphics().setPosition(bx, by).setDepth(100);
    this.drawPauseIcon(false);

    const zone = this.add.zone(bx, by, 48, 48).setDepth(101).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => this.drawPauseIcon(true));
    zone.on('pointerout',  () => this.drawPauseIcon(false));
    zone.on('pointerdown', () => this.togglePause());
  }

  private drawPauseIcon(hover: boolean): void {
    const g = this.pauseBtnGfx;
    g.clear();
    // Background pill
    g.fillStyle(hover ? 0x003366 : 0x001122, hover ? 0.92 : 0.72);
    g.lineStyle(hover ? 2 : 1.5, hover ? 0x00ccff : 0x00aaff, hover ? 1 : 0.55);
    g.fillRoundedRect(-22, -22, 44, 44, 9);
    g.strokeRoundedRect(-22, -22, 44, 44, 9);
    // Icon — two bars when active, play triangle when paused
    g.fillStyle(hover ? 0xffffff : 0x00ddff, 1);
    if (this.paused) {
      g.fillTriangle(-7, -11, -7, 11, 12, 0);
    } else {
      g.fillRect(-9, -10, 6, 20);
      g.fillRect(3, -10, 6, 20);
    }
  }

  private togglePause(): void {
    if (this.gameOverFlag || !this.gameActive) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.showPauseOverlay();
    } else {
      this.physics.resume();
      this.hidePauseOverlay();
    }
    this.drawPauseIcon(false);
  }

  private showPauseOverlay(): void {
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000011, 0.76);

    const title = this.add.text(0, -90, 'PAUSED', {
      fontFamily: '"Courier New", monospace',
      fontSize: '72px',
      color: '#00ddff',
      stroke: '#000022',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const sub = this.add.text(0, 18, 'PRESS P, ESC, OR TAP ▶ TO RESUME', {
      fontFamily: '"Courier New", monospace',
      fontSize: '17px',
      color: '#88bbcc',
    }).setOrigin(0.5);

    this.pauseOverlayContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [bg, title, sub]);
    this.pauseOverlayContainer.setDepth(500);

    // Fade in
    this.pauseOverlayContainer.setAlpha(0);
    this.tweens.add({ targets: this.pauseOverlayContainer, alpha: 1, duration: 180 });

    // Tap overlay to resume
    bg.setInteractive();
    bg.on('pointerdown', () => { if (this.paused) this.togglePause(); });
  }

  private hidePauseOverlay(): void {
    if (!this.pauseOverlayContainer) return;
    const c = this.pauseOverlayContainer;
    this.pauseOverlayContainer = null;
    this.tweens.add({
      targets: c, alpha: 0, duration: 150,
      onComplete: () => c.destroy(),
    });
  }

  private refreshLives(): void {
    const n = Math.max(0, this.lives);
    this.livesText.setText(n > 0 ? Array(n + 1).join('♥ ').trim() : '---');
  }

  // ── Enemy spawning ────────────────────────────────────────────────────────

  private spawnEnemyAt(
    prefabId: 'enemy_grunt' | 'enemy_bomber' | 'enemy_boss',
    x: number,
    y: number,
  ): Phaser.GameObjects.Graphics {
    const go = spawnPrefab(this, prefabId, x, y) as Phaser.GameObjects.Graphics;
    go.setDepth(2);

    // Copy prefab HP into a mutable data slot
    const props = go.getData('entityProperties') as { hp: number; scoreValue: number };
    go.setData('hp', props.hp);

    // Physics body: gravity already 0 globally; no extra allow-gravity calls needed
    const body = go.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    this.enemies.add(go);
    return go;
  }

  // ── Wave management ───────────────────────────────────────────────────────

  private startWave(wave: number): void {
    if (this.gameOverFlag) return;
    this.currentWave   = wave;
    this.waveSpawnDone = false;
    this.waveClearLock = false;
    this.enemyDirX     = 1;
    this.enemySpeed    = BASE_SPEED[wave] ?? 70;
    this.waveText.setText(`WAVE ${wave}`);
    this.showWaveBanner(`— WAVE ${wave} —`);

    if (wave === 1) this.spawnWave1();
    else if (wave === 2) this.spawnWave2();
    else if (wave === 3) this.spawnWave3();
  }

  /** Wave 1 — 3 rows × 4 cols grunts */
  private spawnWave1(): void {
    const cols = 4, rows = 3;
    const spacingX = 120, spacingY = 90;
    const startX = GAME_WIDTH / 2 - ((cols - 1) / 2) * spacingX;
    const startY = 130;
    let delay = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX;
        const y = startY + r * spacingY;
        this.time.delayedCall(delay, () => {
          if (this.gameOverFlag) return;
          this.spawnEnemyAt('enemy_grunt', x, y);
        });
        delay += 75;
      }
    }
    this.time.delayedCall(delay + 120, () => { this.waveSpawnDone = true; });
  }

  /** Wave 2 — 6 bombers in V-formation (tip at center-top, wings down-out) */
  private spawnWave2(): void {
    // V-shape pointing up: center pair closest to top, wings diverge downward
    const positions: Array<[number, number]> = [
      [150, 130],   // far left outer
      [250, 210],   // left mid
      [340, 290],   // left inner
      [380, 290],   // right inner
      [470, 210],   // right mid
      [570, 130],   // far right outer
    ];
    let delay = 0;
    for (const [x, y] of positions) {
      this.time.delayedCall(delay, () => {
        if (this.gameOverFlag) return;
        this.spawnEnemyAt('enemy_bomber', x, y);
      });
      delay += 180;
    }
    this.time.delayedCall(delay + 120, () => { this.waveSpawnDone = true; });
  }

  /** Wave 3 — single boss */
  private spawnWave3(): void {
    this.time.delayedCall(400, () => {
      if (this.gameOverFlag) return;
      this.spawnEnemyAt('enemy_boss', GAME_WIDTH / 2, 170);
      this.waveSpawnDone = true;
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
    enemy:  Phaser.GameObjects.GameObject,
  ): void {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();

    const curHp = (enemy.getData('hp') as number) - 1;
    enemy.setData('hp', curHp);

    if (curHp > 0) {
      // Hit flash
      this.tweens.add({
        targets: enemy, alpha: { from: 0.15, to: 1 },
        duration: 50, yoyo: true, repeat: 1,
      });
    } else {
      const props = enemy.getData('entityProperties') as { hp: number; scoreValue: number };
      this.score += props.scoreValue;
      this.scoreText.setText(`SCORE  ${this.score}`);
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.18, scaleY: 1.18,
        duration: 65, yoyo: true,
      });

      const isBoss = this.currentWave === 3;
      const ex = (enemy as Phaser.GameObjects.Graphics).x;
      const ey = (enemy as Phaser.GameObjects.Graphics).y;
      this.spawnExplosion(ex, ey, isBoss);
      enemy.destroy();

      // Survivors accelerate
      const alive = this.enemies.getChildren().filter(e => e.active).length;
      if (alive > 0) {
        const killFraction = (alive + 1 - alive) / (alive + 1);
        const boost = 1 + killFraction * 2.2;
        this.enemySpeed = Math.abs(this.enemySpeed) * boost;
      }
    }
  }

  private onEnemyBulletHitPlayer(
    bullet:  Phaser.GameObjects.GameObject,
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
    this.refreshLives();
    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      this.invincible = true;
      this.time.delayedCall(2200, () => { this.invincible = false; });
      this.tweens.add({
        targets: this.player,
        alpha: { from: 0.1, to: 1 },
        duration: 110, yoyo: true, repeat: 9,
      });
    }
  }

  // ── Explosion ─────────────────────────────────────────────────────────────

  private spawnExplosion(x: number, y: number, big = false): void {
    const count   = big ? 18 : 10;
    const palette = big
      ? [0xff2244, 0xff8800, 0xffcc00, 0xff4488, 0xffffff]
      : [0xffaa22, 0xff6600, 0xffee44, 0xffffff];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = Phaser.Math.Between(big ? 90 : 55, big ? 240 : 150);
      const col   = palette[i % palette.length];
      const r     = Phaser.Math.Between(2, big ? 9 : 5);
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

    const ring = this.add.graphics().setDepth(5).setPosition(x, y);
    ring.lineStyle(big ? 4 : 2.5, big ? 0xff2244 : 0xffdd44, 1);
    ring.strokeCircle(0, 0, big ? 10 : 6);
    this.tweens.add({
      targets: ring,
      scaleX: big ? 8 : 5,
      scaleY: big ? 8 : 5,
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
        fontSize: '58px',
        color: '#ffee55',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0);
    this.tweens.add({
      targets: t,
      alpha: 1,
      duration: 260,
      hold: 850,
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
      this.tweens.add({ targets: bg, alpha: 0.65, duration: 420 });

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'GAME OVER', {
        fontFamily: '"Courier New", monospace',
        fontSize: '64px',
        color: '#ff3344',
        stroke: '#000',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(1000);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, `SCORE  ${this.score}`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '34px',
        color: '#ffee55',
      }).setOrigin(0.5).setDepth(1000);

      const prompt = this.add.text(
        GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70,
        'PRESS SPACE TO TRY AGAIN',
        { fontFamily: '"Courier New", monospace', fontSize: '22px', color: '#aaaacc' },
      ).setOrigin(0.5).setDepth(1000);
      this.tweens.add({ targets: prompt, alpha: { from: 0.25, to: 1 }, duration: 550, yoyo: true, repeat: -1 });

      this.input.keyboard!.once('keydown-SPACE', () => this.scene.restart());
    });
  }

  private showVictory(): void {
    if (this.gameOverFlag) return;
    this.gameActive = false;

    const bg = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000020, 0)
      .setDepth(999);
    this.tweens.add({ targets: bg, alpha: 0.68, duration: 500 });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'VICTORY!', {
      fontFamily: '"Courier New", monospace',
      fontSize: '70px',
      color: '#44ff88',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(1000);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, `FINAL SCORE  ${this.score}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '34px',
      color: '#ffee55',
    }).setOrigin(0.5).setDepth(1000);

    const prompt = this.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70,
      'PRESS SPACE TO PLAY AGAIN',
      { fontFamily: '"Courier New", monospace', fontSize: '22px', color: '#aaffcc' },
    ).setOrigin(0.5).setDepth(1000);
    this.tweens.add({ targets: prompt, alpha: { from: 0.25, to: 1 }, duration: 550, yoyo: true, repeat: -1 });

    this.input.keyboard!.once('keydown-SPACE', () => this.scene.restart());
  }

  // ── Shooting ──────────────────────────────────────────────────────────────

  private firePlayerBullet(): void {
    const go = spawnPrefab(this, 'player_bullet', this.player.x, this.player.y - 38) as Phaser.GameObjects.Graphics;
    go.setDepth(4);
    const body = go.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(-BULLET_SPEED);
    this.playerBullets.add(go);
  }

  private fireEnemyBullet(time: number): void {
    const alive = this.enemies.getChildren().filter(e => e.active) as Phaser.GameObjects.Graphics[];
    if (alive.length === 0) return;

    const isBoss  = this.currentWave === 3;
    const count   = isBoss ? 3 : 1;
    const shooter = alive[Math.floor(Math.random() * alive.length)];
    this.lastEnemyFireMs = time;

    for (let i = 0; i < count; i++) {
      const spread = isBoss ? (i - 1) * (Math.PI / 9) : 0;
      const vx = Math.sin(spread) * ENEMY_BULLET_SPEED;
      const vy = Math.cos(spread) * ENEMY_BULLET_SPEED;

      const go = spawnPrefab(this, 'enemy_bullet', shooter.x, shooter.y + 28) as Phaser.GameObjects.Graphics;
      go.setDepth(4);
      const body = go.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setVelocity(vx, vy);
      this.enemyBullets.add(go);
    }
  }

  // ── Enemy movement ────────────────────────────────────────────────────────

  private updateEnemyMovement(delta: number): void {
    const alive = this.enemies.getChildren().filter(e => e.active) as Phaser.GameObjects.Graphics[];
    if (alive.length === 0) return;

    const dx = this.enemyDirX * this.enemySpeed * (delta / 1000);
    alive.forEach(e => { e.x += dx; });

    let minX = Infinity, maxX = -Infinity;
    alive.forEach(e => {
      if (e.x < minX) minX = e.x;
      if (e.x > maxX) maxX = e.x;
    });

    if (maxX > EDGE_R && this.enemyDirX > 0) {
      this.enemyDirX = -1;
      alive.forEach(e => { e.y += DROP_AMOUNT; });
      this.checkEnemiesBottom(alive);
    } else if (minX < EDGE_L && this.enemyDirX < 0) {
      this.enemyDirX = 1;
      alive.forEach(e => { e.y += DROP_AMOUNT; });
      this.checkEnemiesBottom(alive);
    }
  }

  private checkEnemiesBottom(alive: Phaser.GameObjects.Graphics[]): void {
    if (this.gameOverFlag) return;
    if (alive.some(e => e.y > GAME_OVER_Y)) {
      this.lives = 0;
      this.refreshLives();
      this.triggerGameOver();
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    // Pause toggle — checked even when paused so P/Esc can unpause
    if (this.gameActive && !this.gameOverFlag) {
      if (Phaser.Input.Keyboard.JustDown(this.keyP) || Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
        this.togglePause();
      }
    }

    if (!this.gameActive || this.gameOverFlag || this.paused) return;

    // ── Player movement ─────────────────────────────────────────────────
    const goLeft  = this.cursors.left.isDown  || this.keyA.isDown;
    const goRight = this.cursors.right.isDown || this.keyD.isDown;
    if (goLeft)       this.playerBody.setVelocityX(-PLAYER_SPEED);
    else if (goRight) this.playerBody.setVelocityX(PLAYER_SPEED);
    else              this.playerBody.setVelocityX(0);

    // ── Player shooting ─────────────────────────────────────────────────
    const wantFire = this.cursors.up.isDown || this.keySpace.isDown;
    if (wantFire && time - this.lastShotTime > SHOOT_COOLDOWN_MS) {
      this.lastShotTime = time;
      this.firePlayerBullet();
    }

    // ── Enemy movement ──────────────────────────────────────────────────
    this.updateEnemyMovement(delta);

    // ── Enemy fire ──────────────────────────────────────────────────────
    const fireInterval = this.currentWave === 1
      ? GRUNT_FIRE_INTERVAL
      : this.currentWave === 2
        ? BOMBER_FIRE_INTERVAL
        : BOSS_FIRE_INTERVAL;

    if (time - this.lastEnemyFireMs > fireInterval) {
      this.fireEnemyBullet(time);
    }

    // ── Cull off-screen bullets ─────────────────────────────────────────
    this.playerBullets.getChildren().forEach(b => {
      if ((b as Phaser.GameObjects.Graphics).y < -30) b.destroy();
    });
    this.enemyBullets.getChildren().forEach(b => {
      if ((b as Phaser.GameObjects.Graphics).y > GAME_HEIGHT + 30) b.destroy();
    });

    // ── Wave-clear detection ────────────────────────────────────────────
    if (
      this.waveSpawnDone &&
      !this.waveClearLock &&
      this.enemies.getChildren().filter(e => e.active).length === 0
    ) {
      this.waveClearLock = true;
      this.onWaveCleared();
    }
  }
}
