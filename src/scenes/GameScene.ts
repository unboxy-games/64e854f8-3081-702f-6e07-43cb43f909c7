import Phaser from 'phaser';
import {
  loadWorldScene,
  getEntityRegistry,
  spawnPrefab,
  getRule,
} from '@unboxy/phaser-sdk';

const WORLD_W = 3840;
const WORLD_H = 720;
const GROUND_TOP = 696; // y of ground surface (ground center 708, height 24 → top = 708-12=696)

export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  // Core objects
  private player!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // State
  private lives!: number;
  private score!: number;
  private invincible = false;
  private jumpPressed = false;
  private gameOver = false;

  // Tuning (from rules.json)
  private playerSpeed!: number;
  private jumpVelocity!: number;
  private stompBounce!: number;
  private scorePerCoin!: number;
  private scorePerEnemy!: number;
  private invincibleMs!: number;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
    this.score = 0;
    this.gameOver = false;
    this.invincible = false;
    this.jumpPressed = false;
  }

  async create(): Promise<void> {
    // ── Physics world ──────────────────────────────────────────
    const arcadeWorld = this.physics.world as Phaser.Physics.Arcade.World;
    arcadeWorld.gravity.y = getRule(this, 'physics.gravity', 1000);
    arcadeWorld.setBounds(0, 0, WORLD_W, WORLD_H + 200);

    // ── Load rules ─────────────────────────────────────────────
    this.playerSpeed  = getRule(this, 'physics.playerSpeed',  220);
    this.jumpVelocity = getRule(this, 'physics.jumpVelocity', 600);
    this.stompBounce  = getRule(this, 'physics.stompBounce',  380);
    this.scorePerCoin = getRule(this, 'balance.scorePerCoin', 100);
    this.scorePerEnemy = getRule(this, 'balance.scorePerEnemy', 200);
    this.invincibleMs = getRule(this, 'balance.invincibleMs', 1500);
    this.lives        = getRule(this, 'balance.startLives',   3);

    // ── Draw sky + decorations ─────────────────────────────────
    this.drawBackground();

    // ── Load world scene (player + platforms) ──────────────────
    await loadWorldScene(this, this.sceneId);
    const registry = getEntityRegistry(this)!;

    // ── Platforms static group ──────────────────────────────────
    this.platforms = this.physics.add.staticGroup();
    for (const p of registry.byRole('platform')) {
      const go = p as Phaser.GameObjects.GameObject;
      this.physics.add.existing(go, true);
      this.platforms.add(go);
    }

    // ── Player physics ──────────────────────────────────────────
    const playerGo = registry.byRole('player')[0] as Phaser.GameObjects.Graphics;
    this.player = playerGo;
    this.physics.add.existing(playerGo, false);
    this.playerBody = playerGo.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(false);
    this.playerBody.setMaxVelocityY(900);
    this.playerBody.setDragX(800);

    // ── Dynamic groups ─────────────────────────────────────────
    this.enemies = this.physics.add.group();
    this.coins   = this.physics.add.group();

    this.spawnEnemies();
    this.spawnCoins();

    // ── Colliders ──────────────────────────────────────────────
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.enemies,
      (pObj, eObj) => {
        this.handlePlayerEnemyOverlap(
          pObj as Phaser.GameObjects.Graphics,
          eObj as Phaser.GameObjects.Graphics,
        );
      },
    );

    this.physics.add.overlap(
      this.player,
      this.coins,
      (_p, cObj) => {
        this.collectCoin(cObj as Phaser.GameObjects.Graphics);
      },
    );

    // ── Camera ─────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(playerGo, true, 0.12, 0.1);

    // ── Input ──────────────────────────────────────────────────
    const kb = this.input.keyboard!;
    this.cursors  = kb.createCursorKeys();
    this.keyW     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── Launch HUD ─────────────────────────────────────────────
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }
    // Give UIScene one tick to set up listeners before emitting
    this.time.delayedCall(50, () => {
      this.events.emit('lives', this.lives);
      this.events.emit('scoreUpdate', this.score);
    });
  }

  // ─── Background ────────────────────────────────────────────────────────────

  private drawBackground(): void {
    const bg = this.add.graphics().setDepth(0).setScrollFactor(0);

    // Gradient sky (horizontal bands darkening toward top)
    const bands = 16;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const r = Math.round(70  + t * 90);
      const g = Math.round(130 + t * 80);
      const b = Math.round(220 + t * 30);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, i * (WORLD_H / bands), 1280, Math.ceil(WORLD_H / bands) + 1);
    }

    // Clouds (in world-space so they scroll naturally)
    const skyBg = this.add.graphics().setDepth(0);
    skyBg.fillStyle(0x5c9de8, 1);
    skyBg.fillRect(0, 0, WORLD_W, WORLD_H);

    this.addCloud(skyBg, 240, 110, 70);
    this.addCloud(skyBg, 620, 80, 55);
    this.addCloud(skyBg, 1100, 120, 80);
    this.addCloud(skyBg, 1600, 90, 65);
    this.addCloud(skyBg, 2050, 105, 75);
    this.addCloud(skyBg, 2500, 85, 60);
    this.addCloud(skyBg, 2950, 115, 80);
    this.addCloud(skyBg, 3400, 95, 70);
    this.addCloud(skyBg, 3750, 100, 60);
  }

  private addCloud(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
    g.fillStyle(0xffffff, 0.88);
    g.fillCircle(x,        y,       r * 0.55);
    g.fillCircle(x + r * 0.45, y,   r * 0.45);
    g.fillCircle(x - r * 0.35, y,   r * 0.38);
    g.fillCircle(x + r * 0.12, y - r * 0.28, r * 0.42);
    // flat bottom
    g.fillStyle(0xffffff, 0.88);
    g.fillRect(x - r * 0.55, y, r * 1.15, r * 0.45);
  }

  // ─── Spawning ───────────────────────────────────────────────────────────────

  private spawnEnemies(): void {
    const enemySpeed = getRule(this, 'physics.enemySpeed', 80);

    // Ground enemies — y slightly above ground surface so they land cleanly
    const groundY = GROUND_TOP - 26;
    const groundXs = [420, 760, 1080, 1650, 2250, 2750, 3240, 3620];
    groundXs.forEach((x, i) => {
      const e = spawnPrefab(this, 'enemy_goomba', x, groundY) as Phaser.GameObjects.Graphics;
      const body = e.body as Phaser.Physics.Arcade.Body;
      const dir = i % 2 === 0 ? 1 : -1;
      body.setVelocityX(enemySpeed * dir);
      e.setData('dir', dir);
      e.setDepth(2);
      this.enemies.add(e);
    });

    // Platform enemies (on top of specific platforms)
    // Platform centers: plat-03(980,400), plat-05(1540,440), plat-07(2100,500), plat-11(3160,380)
    const platformEnemies = [
      { x: 980,  y: 400 - 12 - 26 },
      { x: 1540, y: 440 - 12 - 26 },
      { x: 2100, y: 500 - 12 - 26 },
      { x: 3160, y: 380 - 12 - 26 },
    ];
    platformEnemies.forEach(({ x, y }, i) => {
      const e = spawnPrefab(this, 'enemy_goomba', x, y) as Phaser.GameObjects.Graphics;
      const body = e.body as Phaser.Physics.Arcade.Body;
      const dir = i % 2 === 0 ? 1 : -1;
      body.setVelocityX(enemySpeed * dir);
      e.setData('dir', dir);
      e.setDepth(2);
      this.enemies.add(e);
    });
  }

  private spawnCoins(): void {
    // Coins above platforms (platform_center_y - 12 - 44)
    const platCoins: { x: number; y: number }[] = [
      // plat-01 (440,560)
      { x: 416, y: 496 }, { x: 448, y: 496 }, { x: 480, y: 496 },
      // plat-02 (700,480)
      { x: 676, y: 416 }, { x: 708, y: 416 }, { x: 740, y: 416 },
      // plat-03 (980,400)
      { x: 956, y: 336 }, { x: 988, y: 336 }, { x: 1020, y: 336 },
      // plat-04 (1260,520)
      { x: 1236, y: 456 }, { x: 1268, y: 456 }, { x: 1300, y: 456 },
      // plat-05 (1540,440)
      { x: 1516, y: 376 }, { x: 1548, y: 376 }, { x: 1580, y: 376 },
      // plat-06 (1820,360)
      { x: 1796, y: 296 }, { x: 1828, y: 296 }, { x: 1860, y: 296 },
      // plat-07 (2100,500)
      { x: 2076, y: 436 }, { x: 2108, y: 436 }, { x: 2140, y: 436 },
      // plat-08 (2380,420)
      { x: 2356, y: 356 }, { x: 2388, y: 356 }, { x: 2420, y: 356 },
      // plat-09 (2640,340)
      { x: 2616, y: 276 }, { x: 2648, y: 276 }, { x: 2680, y: 276 },
      // plat-10 (2900,460)
      { x: 2876, y: 396 }, { x: 2908, y: 396 }, { x: 2940, y: 396 },
      // plat-11 (3160,380)
      { x: 3136, y: 316 }, { x: 3168, y: 316 }, { x: 3200, y: 316 },
      // plat-12 (3440,520)
      { x: 3416, y: 456 }, { x: 3448, y: 456 }, { x: 3480, y: 456 },
      // plat-13 (3700,640)
      { x: 3668, y: 576 }, { x: 3700, y: 576 }, { x: 3732, y: 576 },
    ];
    // Ground coins
    const groundCoins: { x: number; y: number }[] = [
      { x: 240, y: 656 }, { x: 280, y: 656 }, { x: 320, y: 656 },
      { x: 560, y: 656 }, { x: 600, y: 656 },
      { x: 1850, y: 656 }, { x: 1890, y: 656 },
      { x: 3020, y: 656 }, { x: 3060, y: 656 },
    ];

    for (const { x, y } of [...platCoins, ...groundCoins]) {
      const c = spawnPrefab(this, 'coin', x, y) as Phaser.GameObjects.Graphics;
      const body = c.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      c.setDepth(2);
      this.coins.add(c);
    }
  }

  // ─── Overlap handlers ───────────────────────────────────────────────────────

  private handlePlayerEnemyOverlap(
    _player: Phaser.GameObjects.Graphics,
    enemy: Phaser.GameObjects.Graphics,
  ): void {
    if (this.invincible || this.gameOver) return;

    // Stomp: player falling AND player's lower edge is near enemy's upper edge
    const playerBottom = this.player.y + 24; // visual half-height
    const enemyTop     = enemy.y - 18;        // half of goomba visual height
    const falling      = this.playerBody.velocity.y > 60;

    if (falling && playerBottom <= enemyTop + 20) {
      this.stompEnemy(enemy);
    } else {
      this.hurtPlayer();
    }
  }

  private stompEnemy(enemy: Phaser.GameObjects.Graphics): void {
    const props = enemy.getData('entityProperties') as { scoreValue?: number } | undefined;
    const points = props?.scoreValue ?? this.scorePerEnemy;
    this.score += points;
    this.events.emit('scoreUpdate', this.score);

    // Squish animation then destroy
    this.tweens.add({
      targets: enemy,
      scaleX: 1.8,
      scaleY: 0.15,
      alpha: 0.6,
      duration: 120,
      onComplete: () => enemy.destroy(),
    });

    // Bounce player up
    this.playerBody.setVelocityY(-this.stompBounce);

    // Dust particles
    this.spawnDustBurst(enemy.x, enemy.y, 0x8b4513, 8);

    // Floating score text
    this.floatText(enemy.x, enemy.y - 20, `+${points}`, '#ffee44');
  }

  private hurtPlayer(): void {
    this.invincible = true;
    this.lives--;
    this.events.emit('lives', this.lives);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    // Knockback
    const kbDir = this.playerBody.velocity.x >= 0 ? -1 : 1;
    this.playerBody.setVelocityY(-350);
    this.playerBody.setVelocityX(200 * kbDir);

    // Blink invincibility
    this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      duration: 80,
      yoyo: true,
      repeat: Math.floor(this.invincibleMs / 160),
      onComplete: () => {
        this.player.setAlpha(1);
        this.invincible = false;
      },
    });
  }

  private collectCoin(coin: Phaser.GameObjects.Graphics): void {
    const props = coin.getData('entityProperties') as { value?: number } | undefined;
    const points = props?.value ?? this.scorePerCoin;
    this.score += points;
    this.events.emit('scoreUpdate', this.score);

    this.spawnDustBurst(coin.x, coin.y, 0xffd700, 6);
    this.floatText(coin.x, coin.y - 16, `+${points}`, '#ffd700');
    coin.destroy();
  }

  // ─── Game over / win ────────────────────────────────────────────────────────

  private triggerGameOver(): void {
    this.gameOver = true;
    this.playerBody.setVelocity(0, 0);
    this.playerBody.setAllowGravity(false);

    // Red flash
    this.cameras.main.flash(300, 200, 0, 0);

    const cam = this.cameras.main;
    const cx = cam.scrollX + 640;
    const cy = cam.scrollY + 360;

    // Dark overlay
    const overlay = this.add.graphics().setDepth(900);
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(cx - 640, cy - 360, 1280, 720);

    this.add.text(cx, cy - 60, 'GAME OVER', {
      fontFamily: 'sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ff3333',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(901);

    this.add.text(cx, cy + 20, `Score: ${this.score}`, {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(901);

    this.add.text(cx, cy + 80, 'Press SPACE to retry', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(901);

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.restart({ sceneId: this.sceneId });
    });
  }

  // ─── Effects ────────────────────────────────────────────────────────────────

  private spawnDustBurst(
    x: number,
    y: number,
    color: number,
    count: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 25 + Math.random() * 20;
      const dot = this.add.graphics().setDepth(4);
      dot.fillStyle(color, 1);
      dot.fillCircle(0, 0, 3 + Math.random() * 3);
      dot.setPosition(x, y);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed - 10,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 280,
        ease: 'Cubic.Out',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const t = this.add
      .text(x, y, text, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.tweens.add({
      targets: t,
      y: y - 55,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.Out',
      onComplete: () => t.destroy(),
    });
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  update(_time: number, _delta: number): void {
    if (this.gameOver) return;

    this.handlePlayerMovement();
    this.handleEnemyAI();
    this.checkFallDeath();
  }

  private handlePlayerMovement(): void {
    const onGround = this.playerBody.blocked.down;

    const goLeft  = this.cursors.left.isDown  || this.keyA.isDown;
    const goRight = this.cursors.right.isDown || this.keyD.isDown;
    const jumpKey = this.cursors.up.isDown    || this.keyW.isDown || this.keySpace.isDown;

    if (goLeft) {
      this.playerBody.setVelocityX(-this.playerSpeed);
      this.player.setScale(-1, 1); // flip to face left
    } else if (goRight) {
      this.playerBody.setVelocityX(this.playerSpeed);
      this.player.setScale(1, 1);  // face right
    }
    // (dragX handles deceleration when no key is held)

    // Jump — only on ground, only on fresh press
    if (jumpKey && onGround && !this.jumpPressed) {
      this.playerBody.setVelocityY(-this.jumpVelocity);
      this.jumpPressed = true;
    }
    if (!jumpKey) {
      this.jumpPressed = false;
    }

    // Variable-height jump: cut upward velocity when key released mid-air
    if (!jumpKey && this.playerBody.velocity.y < -150) {
      this.playerBody.setVelocityY(this.playerBody.velocity.y * 0.88);
    }
  }

  private handleEnemyAI(): void {
    this.enemies.getChildren().forEach(go => {
      const e = go as Phaser.GameObjects.Graphics;
      const body = e.body as Phaser.Physics.Arcade.Body;
      if (!body) return;

      const dir = (e.getData('dir') as number) ?? 1;
      const speed = getRule(this, 'physics.enemySpeed', 80);

      // Flip on wall hit
      const eg = e as Phaser.GameObjects.Graphics;
      if (body.blocked.right && dir > 0) {
        e.setData('dir', -1);
        body.setVelocityX(-speed);
        eg.setScale(-1, 1);
      } else if (body.blocked.left && dir < 0) {
        e.setData('dir', 1);
        body.setVelocityX(speed);
        eg.setScale(1, 1);
      } else {
        body.setVelocityX(speed * dir);
      }
    });
  }

  private checkFallDeath(): void {
    if (this.player.y > WORLD_H + 80) {
      if (this.invincible) return; // already processing a death

      if (this.lives > 1) {
        this.invincible = true;
        this.lives--;
        this.events.emit('lives', this.lives);
        // Respawn at start
        this.player.setPosition(150, 672);
        this.playerBody.setVelocity(0, 0);
        this.time.delayedCall(100, () => { this.invincible = false; });
      } else {
        this.lives = 0;
        this.events.emit('lives', this.lives);
        this.triggerGameOver();
      }
    }
  }
}
