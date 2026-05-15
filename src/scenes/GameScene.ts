import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const PLAYER_SPEED = 320;
const BULLET_SPEED = 700;
const BULLET_COOLDOWN = 200;
const ENEMY_MARGIN = 54;
const ENEMY_DROP = 24;
const ENEMY_BULLET_SPEED = 320;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerInvincible = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;

  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemyShootTimer!: Phaser.Time.TimerEvent;

  private score = 0;
  private lives = 3;
  private isGameOver = false;
  private waveNumber = 0;
  private lastShotTime = 0;
  private wavePending = false;

  // Enemy formation
  private formationDir = 1;
  private formationSpeed = 50;
  private flipCooldown = 0;

  // Stars
  private stars: Array<{ rect: Phaser.GameObjects.Rectangle; speed: number }> = [];

  // Game over UI
  private gameOverContainer!: Phaser.GameObjects.Container;
  private goScoreText!: Phaser.GameObjects.Text;
  private goWaveText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#00001a');
    this.buildTextures();
    this.buildStarfield();
    this.buildNebula();
    this.buildPlayer();
    this.buildGroups();
    this.buildInput();
    this.buildCollisions();
    this.buildGameOverUI();

    // Launch HUD overlay
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }

    this.spawnWave();

    // Emit initial HUD state (slight delay lets UIScene finish its create())
    this.time.delayedCall(50, () => {
      this.events.emit('updateScore', 0);
      this.events.emit('updateLives', 3);
    });
  }

  // ─── Texture generation ──────────────────────────────────────────────────

  private buildTextures(): void {
    this.makePlayerTexture();
    this.makeBulletTexture();
    for (let i = 0; i < 4; i++) this.makeEnemyTexture(i);
    this.makeSparkTexture();
    this.makeEnemyBulletTexture();
  }

  private makePlayerTexture(): void {
    if (this.textures.exists('player-ship')) return;
    const g = this.add.graphics().setVisible(false);
    // Main hull — deep blue upward triangle
    g.fillStyle(0x2277ee);
    g.fillTriangle(40, 5, 14, 60, 66, 60);
    // Left / right wings
    g.fillStyle(0x114499);
    g.fillTriangle(14, 60, 2, 72, 20, 48);
    g.fillTriangle(66, 60, 78, 72, 60, 48);
    // Cyan wing-tip stripes
    g.fillStyle(0x00ccff);
    g.fillRect(2, 66, 13, 5);
    g.fillRect(65, 66, 13, 5);
    // Central spine
    g.fillStyle(0x55aeff);
    g.fillRect(37, 7, 6, 52);
    // Cockpit dome
    g.fillStyle(0xddf2ff);
    g.fillEllipse(40, 36, 14, 22);
    // Cannon tip
    g.fillStyle(0x99ddff);
    g.fillRect(37, 2, 6, 9);
    // Engine glow
    g.fillStyle(0xff7700);
    g.fillRect(15, 58, 50, 8);
    g.fillStyle(0xffee44);
    g.fillRect(23, 60, 34, 4);
    g.generateTexture('player-ship', 80, 78);
    g.destroy();
  }

  private makeBulletTexture(): void {
    if (this.textures.exists('bullet')) return;
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0x00ffff);
    g.fillRect(2, 2, 4, 14);
    g.fillStyle(0xffffff);
    g.fillRect(3, 2, 2, 7);
    g.generateTexture('bullet', 8, 18);
    g.destroy();
  }

  private makeEnemyTexture(index: number): void {
    const key = `enemy-${index}`;
    if (this.textures.exists(key)) return;
    const palettes = [
      { hull: 0xdd2222, wing: 0x990000, glow: 0xff8800, pod: 0xff4400, cockpit: 0xffe0cc },
      { hull: 0xdd6600, wing: 0x993300, glow: 0xffcc00, pod: 0xff8800, cockpit: 0xfff0bb },
      { hull: 0xaa00cc, wing: 0x770099, glow: 0xff55ee, pod: 0xdd00ff, cockpit: 0xffbbff },
      { hull: 0x22aa44, wing: 0x117733, glow: 0x55ff88, pod: 0x00ee66, cockpit: 0xbbffdd },
    ];
    const c = palettes[index];
    const g = this.add.graphics().setVisible(false);
    // Inverted hull — alien ship pointing downward toward player
    g.fillStyle(c.hull);
    g.fillTriangle(32, 48, 8, 8, 56, 8);
    // Wings
    g.fillStyle(c.wing);
    g.fillTriangle(8, 8, 2, 20, 18, 22);
    g.fillTriangle(56, 8, 62, 20, 46, 22);
    // Cockpit dome
    g.fillStyle(c.cockpit);
    g.fillEllipse(32, 20, 14, 16);
    // Central gun barrel (points at player)
    g.fillStyle(c.glow);
    g.fillRect(28, 34, 8, 16);
    // Engine pods on top
    g.fillStyle(c.pod);
    g.fillRect(4, 4, 8, 5);
    g.fillRect(52, 4, 8, 5);
    // Wing accent lines
    g.fillStyle(c.glow);
    g.fillRect(3, 14, 14, 3);
    g.fillRect(47, 14, 14, 3);
    g.generateTexture(key, 64, 54);
    g.destroy();
  }

  private makeSparkTexture(): void {
    if (this.textures.exists('spark')) return;
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture('spark', 8, 8);
    g.destroy();
  }

  private makeEnemyBulletTexture(): void {
    if (this.textures.exists('enemy-bullet')) return;
    const g = this.add.graphics().setVisible(false);
    // Outer glow
    g.fillStyle(0xff4400);
    g.fillRect(1, 0, 6, 18);
    // Bright core
    g.fillStyle(0xffcc00);
    g.fillRect(2, 2, 4, 10);
    // Hot tip
    g.fillStyle(0xffffff);
    g.fillRect(3, 12, 2, 4);
    g.generateTexture('enemy-bullet', 8, 18);
    g.destroy();
  }

  // ─── Scene construction ──────────────────────────────────────────────────

  private buildStarfield(): void {
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const speed = Phaser.Math.FloatBetween(20, 110);
      const alpha = Phaser.Math.FloatBetween(0.2, 1.0);
      const rect = this.add
        .rectangle(x, y, size, size, 0xffffff, alpha)
        .setDepth(0);
      this.stars.push({ rect, speed });
    }
  }

  private buildNebula(): void {
    // Soft ambient gradient bands to break up the void
    const nebulaData = [
      { x: 200, y: 150, w: 500, h: 200, color: 0x110033, alpha: 0.35 },
      { x: 900, y: 420, w: 420, h: 160, color: 0x002211, alpha: 0.3 },
      { x: 600, y: 600, w: 600, h: 180, color: 0x220011, alpha: 0.25 },
    ];
    for (const n of nebulaData) {
      this.add
        .rectangle(n.x, n.y, n.w, n.h, n.color, n.alpha)
        .setDepth(0);
    }
  }

  private buildPlayer(): void {
    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'player-ship');
    this.player.setDepth(3);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(44, 28);
    body.setOffset(18, 32);
  }

  private buildGroups(): void {
    this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 15 });
    this.enemies = this.physics.add.group();
    this.enemyBullets = this.physics.add.group({ defaultKey: 'enemy-bullet', maxSize: 20 });
  }

  private buildInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  private buildCollisions(): void {
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.onPlayerHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.enemyBullets,
      this.player,
      this.onEnemyBulletHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  private buildGameOverUI(): void {
    // Dark overlay
    const bg = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8)
      .setOrigin(0, 0);

    // Decorative top/bottom bars
    const topBar = this.add.rectangle(0, 0, GAME_WIDTH, 6, 0xff2222, 1).setOrigin(0, 0);
    const botBar = this.add.rectangle(0, GAME_HEIGHT - 6, GAME_WIDTH, 6, 0xff2222, 1).setOrigin(0, 0);

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, 'GAME OVER', {
        fontSize: '76px',
        color: '#ff2222',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#550000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.goScoreText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, 'SCORE  00000', {
        fontSize: '38px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.goWaveText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 32, '', {
        fontSize: '24px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 108, '[ R ]  PLAY AGAIN', {
        fontSize: '30px',
        color: '#00ffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Blink restart hint
    this.tweens.add({ targets: hint, alpha: 0.1, duration: 500, yoyo: true, repeat: -1 });

    this.gameOverContainer = this.add.container(0, 0, [
      bg, topBar, botBar, title, this.goScoreText, this.goWaveText, hint,
    ]);
    this.gameOverContainer.setDepth(1000).setVisible(false);
  }

  // ─── Wave spawning ───────────────────────────────────────────────────────

  private spawnWave(): void {
    this.waveNumber++;
    this.formationDir = 1;
    this.formationSpeed = Math.min(50 + (this.waveNumber - 1) * 14, 200);
    this.flipCooldown = 0;
    this.wavePending = false;

    // Schedule enemy shooting — faster every wave (floor at 500 ms)
    if (this.enemyShootTimer) this.enemyShootTimer.remove();
    const shootInterval = Math.max(500, 1800 - (this.waveNumber - 1) * 120);
    this.enemyShootTimer = this.time.addEvent({
      delay: shootInterval,
      loop: true,
      callback: this.fireEnemyBullet,
      callbackScope: this,
    });

    const cols = Math.min(10, 6 + Math.floor((this.waveNumber - 1) / 2));
    const rows = Math.min(5, 2 + Math.floor((this.waveNumber - 1) / 3));
    const spacing = Math.max(60, 72 - this.waveNumber);
    const startX = (GAME_WIDTH - (cols - 1) * spacing) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacing;
        const y = 60 + row * 60;
        const type = row % 4;
        const enemy = this.physics.add.sprite(x, y, `enemy-${type}`);
        enemy.setDepth(2);
        enemy.setData('row', row);
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        body.setSize(44, 36);
        body.setOffset(10, 8);
        body.setVelocityX(this.formationSpeed);
        this.enemies.add(enemy);
      }
    }

    // Wave number banner
    const banner = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `— WAVE  ${this.waveNumber} —`, {
        fontSize: '54px',
        color: '#ffff00',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#333300',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(500)
      .setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      duration: 280,
      hold: 700,
      yoyo: true,
      onComplete: () => banner.destroy(),
    });
  }

  // ─── Main loop ───────────────────────────────────────────────────────────

  update(time: number, _delta: number): void {
    // Scrolling starfield
    for (const star of this.stars) {
      star.rect.y += star.speed * 0.016;
      if (star.rect.y > GAME_HEIGHT + 3) {
        star.rect.y = -3;
        star.rect.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    }

    if (this.isGameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) this.restartGame();
      return;
    }

    // ── Player movement ──
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    if (this.cursors.left.isDown) body.setVelocityX(-PLAYER_SPEED);
    else if (this.cursors.right.isDown) body.setVelocityX(PLAYER_SPEED);

    // ── Shooting ──
    if (this.spaceKey.isDown && time - this.lastShotTime >= BULLET_COOLDOWN) {
      this.fireBullet();
      this.lastShotTime = time;
    }

    // ── Cull off-screen bullets ──
    this.bullets.getChildren().forEach((b) => {
      const blt = b as Phaser.Physics.Arcade.Image;
      if (blt.active && blt.y < -20) {
        this.bullets.killAndHide(blt);
        (blt.body as Phaser.Physics.Arcade.Body).stop();
      }
    });

    // ── Cull off-screen enemy bullets ──
    this.enemyBullets.getChildren().forEach((b) => {
      const blt = b as Phaser.Physics.Arcade.Image;
      if (blt.active && blt.y > GAME_HEIGHT + 20) {
        this.enemyBullets.killAndHide(blt);
        (blt.body as Phaser.Physics.Arcade.Body).stop();
      }
    });

    // ── Enemy formation ──
    this.updateFormation(time);

    // ── Enemies reached the player zone → instant game over ──
    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite;
      if (enemy.active && enemy.y > GAME_HEIGHT - 100) {
        this.triggerGameOver();
      }
    });

    // ── Wave cleared ──
    if (this.enemies.countActive(true) === 0 && !this.wavePending) {
      this.wavePending = true;
      this.time.delayedCall(1100, () => {
        if (!this.isGameOver) this.spawnWave();
      });
    }
  }

  // ─── Combat ─────────────────────────────────────────────────────────────

  private fireBullet(): void {
    const bx = this.player.x;
    const by = this.player.y - 44;
    const bullet = this.bullets.get(bx, by, 'bullet') as Phaser.Physics.Arcade.Image | null;
    if (!bullet) return;
    bullet.setActive(true).setVisible(true).setDepth(4);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.reset(bx, by);
    body.setVelocityY(-BULLET_SPEED);

    // Muzzle flash
    const flash = this.add.rectangle(bx, by - 10, 6, 12, 0x00ffff).setDepth(5).setAlpha(0.9);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleY: 2.5,
      y: flash.y - 14,
      duration: 90,
      onComplete: () => flash.destroy(),
    });
  }

  private fireEnemyBullet(): void {
    if (this.isGameOver) return;

    // Collect active enemies and bucket them by column (approximate X bins of 60 px)
    const active = this.enemies.getChildren().filter((e) =>
      (e as Phaser.Physics.Arcade.Sprite).active
    ) as Phaser.Physics.Arcade.Sprite[];
    if (active.length === 0) return;

    // Build column map: bin x -> lowest enemy (highest y)
    const colMap = new Map<number, Phaser.Physics.Arcade.Sprite>();
    for (const enemy of active) {
      const bin = Math.round(enemy.x / 60);
      const prev = colMap.get(bin);
      if (!prev || enemy.y > prev.y) colMap.set(bin, enemy);
    }

    // Pick a random column shooter
    const shooters = Array.from(colMap.values());
    const shooter = shooters[Phaser.Math.Between(0, shooters.length - 1)];

    const bx = shooter.x;
    const by = shooter.y + 26; // just below the gun barrel tip
    const bullet = this.enemyBullets.get(bx, by, 'enemy-bullet') as Phaser.Physics.Arcade.Image | null;
    if (!bullet) return;
    bullet.setActive(true).setVisible(true).setDepth(4);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.reset(bx, by);
    body.setVelocityY(ENEMY_BULLET_SPEED);

    // Small muzzle flash at the enemy barrel
    const flash = this.add.rectangle(bx, by + 6, 6, 10, 0xff6600).setDepth(5).setAlpha(0.9);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleY: 2,
      y: flash.y + 10,
      duration: 80,
      onComplete: () => flash.destroy(),
    });
  }

  private onEnemyBulletHitPlayer(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    if (this.playerInvincible || this.isGameOver) return;

    const bullet = bulletObj as Phaser.Physics.Arcade.Image;
    this.enemyBullets.killAndHide(bullet);
    (bullet.body as Phaser.Physics.Arcade.Body).stop();

    this.lives = Math.max(0, this.lives - 1);
    this.events.emit('updateLives', this.lives);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    // Small hit flash at player position
    const flash = this.add
      .rectangle(this.player.x, this.player.y, 90, 60, 0xff4400, 0.55)
      .setDepth(6);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 130,
      onComplete: () => flash.destroy(),
    });

    // Flash invincibility
    this.playerInvincible = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.15,
      duration: 90,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        if (this.player?.active) {
          this.player.setAlpha(1);
          this.playerInvincible = false;
        }
      },
    });
  }

  private updateFormation(time: number): void {
    if (this.enemies.countActive(true) === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite;
      if (enemy.active) {
        minX = Math.min(minX, enemy.x);
        maxX = Math.max(maxX, enemy.x);
      }
    });

    const hitRight = this.formationDir === 1 && maxX >= GAME_WIDTH - ENEMY_MARGIN;
    const hitLeft = this.formationDir === -1 && minX <= ENEMY_MARGIN;

    if ((hitRight || hitLeft) && time > this.flipCooldown) {
      this.flipCooldown = time + 350;
      this.formationDir *= -1;
      this.formationSpeed = Math.min(this.formationSpeed + 5, 260);

      this.enemies.getChildren().forEach((e) => {
        const enemy = e as Phaser.Physics.Arcade.Sprite;
        if (!enemy.active) return;
        enemy.y += ENEMY_DROP;
        const b = enemy.body as Phaser.Physics.Arcade.Body;
        b.y += ENEMY_DROP;
        b.setVelocityX(this.formationSpeed * this.formationDir);
      });
    }
  }

  private onBulletHitEnemy(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Image;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    if (!bullet.active || !enemy.active) return;

    this.bullets.killAndHide(bullet);
    (bullet.body as Phaser.Physics.Arcade.Body).stop();

    this.blastEnemy(enemy);

    // Points: top rows are worth more (40 → 10)
    const row = (enemy.getData('row') as number) ?? 0;
    const pts = Math.max(10, 40 - (row % 4) * 10);
    this.score += pts;
    this.events.emit('updateScore', this.score);
    this.showScorePop(enemy.x, enemy.y, `+${pts}`);
  }

  private onPlayerHitEnemy(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    if (this.playerInvincible || this.isGameOver) return;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    this.blastEnemy(enemy);

    this.lives = Math.max(0, this.lives - 1);
    this.events.emit('updateLives', this.lives);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    // Flash invincibility
    this.playerInvincible = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.15,
      duration: 90,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        if (this.player?.active) {
          this.player.setAlpha(1);
          this.playerInvincible = false;
        }
      },
    });
  }

  private blastEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    this.spawnExplosion(enemy.x, enemy.y);
    enemy.setActive(false).setVisible(false);
    (enemy.body as Phaser.Physics.Arcade.Body).stop();
  }

  // ─── Effects ─────────────────────────────────────────────────────────────

  private spawnExplosion(x: number, y: number): void {
    const emitter = this.add.particles(x, y, 'spark', {
      speed: { min: 55, max: 210 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 520,
      tint: [0xff6600, 0xffcc00, 0xff2200, 0xffffff, 0xff8844],
      emitting: false,
    });
    emitter.setDepth(5);
    emitter.explode(14);
    this.time.delayedCall(750, () => {
      if (emitter?.active) emitter.destroy();
    });
  }

  private showScorePop(x: number, y: number, label: string): void {
    const txt = this.add
      .text(x, y - 8, label, {
        fontSize: '20px',
        color: '#ffee00',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#442200',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.tweens.add({
      targets: txt,
      y: y - 58,
      alpha: 0,
      duration: 680,
      ease: 'Power1',
      onComplete: () => txt.destroy(),
    });
  }

  // ─── Game over / restart ─────────────────────────────────────────────────

  private triggerGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.physics.pause();

    // Multi-explosion on player death
    this.spawnExplosion(this.player.x, this.player.y);
    this.time.delayedCall(120, () => {
      this.spawnExplosion(this.player.x - 28, this.player.y + 18);
    });
    this.time.delayedCall(240, () => {
      this.spawnExplosion(this.player.x + 28, this.player.y + 18);
    });
    this.player.setVisible(false);

    this.time.delayedCall(1000, () => {
      this.goScoreText.setText(`SCORE  ${String(this.score).padStart(5, '0')}`);
      this.goWaveText.setText(`Wave ${this.waveNumber} reached`);
      this.gameOverContainer.setVisible(true).setAlpha(0);
      this.tweens.add({ targets: this.gameOverContainer, alpha: 1, duration: 420 });
    });
  }

  private restartGame(): void {
    this.isGameOver = false;
    this.score = 0;
    this.lives = 3;
    this.waveNumber = 0;
    this.wavePending = false;
    this.playerInvincible = false;
    this.formationDir = 1;
    this.formationSpeed = 50;
    this.flipCooldown = 0;
    this.lastShotTime = 0;

    this.enemies.clear(true, true);
    this.bullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    if (this.enemyShootTimer) this.enemyShootTimer.remove();

    this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 80);
    this.player.setVisible(true).setAlpha(1);

    this.gameOverContainer.setVisible(false);
    this.physics.resume();

    this.events.emit('updateScore', 0);
    this.events.emit('updateLives', 3);

    this.spawnWave();
  }
}
