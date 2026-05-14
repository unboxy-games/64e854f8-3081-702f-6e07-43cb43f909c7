import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry, spawnPrefab } from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

interface PatrolData {
  go: Phaser.GameObjects.Graphics;
  minX: number;
  maxX: number;
  speed: number;
}

export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  private player!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private enemies!: Phaser.Physics.Arcade.Group;
  private patrols: PatrolData[] = [];

  private score = 0;
  private lives = 3;
  private isDead = false;
  private gameOver = false;
  private gameWon = false;
  private respawnX = 80;
  private respawnY = 620;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
    // Reset state on restart
    this.score = 0;
    this.lives = 3;
    this.isDead = false;
    this.gameOver = false;
    this.gameWon = false;
    this.patrols = [];
  }

  async create(): Promise<void> {
    await loadWorldScene(this, this.sceneId);

    // Ensure gravity is set
    this.physics.world.gravity.y = 800;

    const reg = getEntityRegistry(this)!;

    // ── Background decoration ────────────────────────────────────────
    this.drawBackground();

    // ── Player ──────────────────────────────────────────────────────
    this.player = reg.byRole('player')[0] as Phaser.GameObjects.Graphics;
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    // Tight hitbox (visual 28×48; body 20×40 centred)
    this.playerBody.setSize(20, 40);
    this.playerBody.setOffset(4, 4);
    this.player.setDepth(3);

    // ── Platforms (static) ──────────────────────────────────────────
    const platformGOs = reg.byRole('platform');
    for (const p of platformGOs) {
      this.physics.add.existing(p, true);
    }

    // ── Coins ───────────────────────────────────────────────────────
    const coinGOs = reg.byRole('coin');
    for (const c of coinGOs) {
      this.physics.add.existing(c, true);
    }

    // ── Exit door ───────────────────────────────────────────────────
    const exitDoor = reg.byRole('exit')[0];
    this.physics.add.existing(exitDoor, true);

    // ── Enemies (prefab spawn) ───────────────────────────────────────
    this.enemies = this.physics.add.group();
    this.spawnEnemies();

    // ── Colliders ───────────────────────────────────────────────────
    for (const p of platformGOs) {
      this.physics.add.collider(this.player, p);
      this.physics.add.collider(this.enemies, p);
    }

    // ── Overlaps ────────────────────────────────────────────────────
    this.physics.add.overlap(
      this.player,
      coinGOs,
      (_pl, coin) => this.collectCoin(coin as Phaser.GameObjects.Graphics),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      exitDoor,
      () => this.reachExit(),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_pl, enemy) => this.touchEnemy(enemy as Phaser.GameObjects.Graphics),
      undefined,
      this
    );

    // ── Input ───────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── Initial HUD values ──────────────────────────────────────────
    this.registry.set('score', this.score);
    this.registry.set('lives', this.lives);
  }

  // ── Background ────────────────────────────────────────────────────
  private drawBackground(): void {
    const bg = this.add.graphics().setDepth(-2);

    // Sky gradient: dark navy top → deep blue bottom
    bg.fillGradientStyle(0x0d1b2a, 0x0d1b2a, 0x1a3352, 0x1a3352, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Crescent moon
    bg.fillStyle(0xfff0cc, 0.95);
    bg.fillCircle(1120, 80, 34);
    bg.fillStyle(0x0f2035, 1);
    bg.fillCircle(1136, 70, 30);

    // Stars (deterministic positions)
    const stars = [
      [60, 35, 2], [180, 95, 1.5], [310, 55, 2], [450, 120, 1],
      [580, 45, 1.5], [700, 85, 2], [820, 40, 1], [940, 110, 1.5],
      [1020, 28, 2], [120, 155, 1], [290, 195, 1.5], [480, 175, 1],
      [660, 210, 2], [860, 165, 1.5], [1010, 240, 1], [55, 240, 1.5],
      [370, 275, 1], [600, 265, 2], [1180, 155, 1],
    ];
    for (const [sx, sy, sr] of stars) {
      const alpha = 0.4 + (sx % 5) * 0.1;
      bg.fillStyle(0xffffff, alpha);
      bg.fillCircle(sx, sy, sr);
    }

    // Distant hills silhouette
    bg.fillStyle(0x162840, 1);
    bg.fillTriangle(0, 580, 180, 460, 360, 580);
    bg.fillTriangle(200, 580, 420, 500, 640, 580);
    bg.fillTriangle(500, 580, 700, 430, 900, 580);
    bg.fillTriangle(780, 580, 1000, 490, 1220, 580);
    bg.fillTriangle(1050, 580, 1280, 460, 1280, 580);
  }

  // ── Enemy spawning ────────────────────────────────────────────────
  private spawnEnemies(): void {
    // Enemy 1 — patrols Platform 1 (x: 140–420, platform top ~529)
    const e1 = spawnPrefab(this, 'enemy_patroller', 280, 500) as Phaser.GameObjects.Graphics;
    this.enemies.add(e1);
    const b1 = (e1 as unknown as { body: Phaser.Physics.Arcade.Body }).body;
    b1.setVelocityX(80);
    this.patrols.push({ go: e1, minX: 145, maxX: 415, speed: 80 });

    // Enemy 2 — patrols Platform 2 (x: 520–780, platform top ~389)
    const e2 = spawnPrefab(this, 'enemy_patroller', 650, 360) as Phaser.GameObjects.Graphics;
    this.enemies.add(e2);
    const b2 = (e2 as unknown as { body: Phaser.Physics.Arcade.Body }).body;
    b2.setVelocityX(-90);
    this.patrols.push({ go: e2, minX: 525, maxX: 775, speed: 90 });
  }

  // ── Coin collect ─────────────────────────────────────────────────
  private collectCoin(coin: Phaser.GameObjects.Graphics): void {
    if (!coin.active) return;
    const cx = coin.x;
    const cy = coin.y;
    coin.destroy();

    this.score += 100;
    this.registry.set('score', this.score);

    // Scale pop on player
    this.tweens.add({
      targets: this.player,
      scaleX: 1.25, scaleY: 1.25,
      duration: 80, ease: 'Sine.easeOut',
      yoyo: true,
    });

    // Floating score text
    this.spawnFloatingText(cx, cy, '+100', '#ffd700');

    // Gold particle burst
    this.spawnParticleBurst(cx, cy, 0xffd700);
  }

  // ── Touch enemy ──────────────────────────────────────────────────
  private touchEnemy(enemy: Phaser.GameObjects.Graphics): void {
    if (this.isDead || !enemy.active) return;

    // Stomp: player above enemy center and falling down
    const bodyVy = this.playerBody.velocity.y;
    if (bodyVy > 50 && this.player.y < enemy.y - 8) {
      // Stomp kill
      const ex = enemy.x;
      const ey = enemy.y;
      enemy.destroy();
      this.playerBody.setVelocityY(-450);
      this.score += 200;
      this.registry.set('score', this.score);
      this.spawnFloatingText(ex, ey, '+200', '#ff9944');
      this.spawnParticleBurst(ex, ey, 0xcc3344);
      return;
    }

    // Take damage
    this.isDead = true;
    this.lives--;
    this.registry.set('lives', this.lives);

    this.cameras.main.flash(180, 255, 40, 40, true);
    this.playerBody.setVelocityY(-380);

    // Brief red tint on player (alpha flash)
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => { this.player.setAlpha(1); },
    });

    if (this.lives <= 0) {
      this.time.delayedCall(1300, () => this.showGameOver());
    } else {
      this.time.delayedCall(1300, () => {
        this.player.setPosition(this.respawnX, this.respawnY);
        this.playerBody.setVelocity(0, 0);
        this.player.setScale(1, 1);
        this.isDead = false;
      });
    }
  }

  // ── Exit door ────────────────────────────────────────────────────
  private reachExit(): void {
    if (this.gameWon || this.isDead) return;
    this.gameWon = true;

    this.score += 500;
    this.registry.set('score', this.score);
    this.cameras.main.flash(400, 0, 255, 130, true);
    this.time.delayedCall(500, () => this.showWinScreen());
  }

  // ── Game Over screen ─────────────────────────────────────────────
  private showGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, 520, 220, 0x000000, 0.85).setDepth(1000);
    this.add.text(cx, cy - 55, 'GAME OVER', {
      fontSize: '52px', color: '#ff4444',
      fontStyle: 'bold', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(1001);
    this.add.text(cx, cy + 10, `Score: ${this.score}`, {
      fontSize: '26px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(1001);
    this.add.text(cx, cy + 60, 'Press  R  to try again', {
      fontSize: '20px', color: '#aaaaaa', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(1001);

    this.input.keyboard!.once('keydown-R', () => {
      this.scene.restart({ sceneId: this.sceneId });
    });
  }

  // ── Win screen ───────────────────────────────────────────────────
  private showWinScreen(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, 540, 240, 0x000000, 0.85).setDepth(1000);
    this.add.text(cx, cy - 70, '🎉  YOU WIN!', {
      fontSize: '50px', color: '#00ff88',
      fontStyle: 'bold', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(1001);
    this.add.text(cx, cy + 0, `Final Score: ${this.score}`, {
      fontSize: '30px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(1001);
    this.add.text(cx, cy + 60, 'Press  R  to play again', {
      fontSize: '20px', color: '#aaaaaa', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(1001);

    this.input.keyboard!.once('keydown-R', () => {
      this.scene.restart({ sceneId: this.sceneId });
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────
  private spawnFloatingText(x: number, y: number, msg: string, color: string): void {
    const txt = this.add.text(x, y, msg, {
      fontSize: '22px', color, fontStyle: 'bold', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: txt,
      y: y - 55,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
    this.tweens.add({
      targets: txt,
      scaleX: 1.4, scaleY: 1.4,
      duration: 120,
      yoyo: true,
    });
  }

  private spawnParticleBurst(x: number, y: number, color: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dot = this.add.graphics().setDepth(5);
      dot.fillStyle(color, 1);
      dot.fillCircle(0, 0, 4);
      dot.setPosition(x, y);

      const dist = 30 + (i % 3) * 15;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.2, scaleY: 0.2,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  // ── Update ───────────────────────────────────────────────────────
  update(_time: number, _delta: number): void {
    if (this.gameOver || this.gameWon) return;

    // Player input
    if (!this.isDead) {
      const speed = 210;

      if (this.cursors.left.isDown) {
        this.playerBody.setVelocityX(-speed);
        this.player.setScale(-1, 1);
      } else if (this.cursors.right.isDown) {
        this.playerBody.setVelocityX(speed);
        this.player.setScale(1, 1);
      } else {
        this.playerBody.setVelocityX(0);
      }

      const jumpPressed =
        Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.up);

      if (jumpPressed && this.playerBody.blocked.down) {
        this.playerBody.setVelocityY(-560);
      }
    }

    // Enemy patrol
    for (const p of this.patrols) {
      if (!p.go.active) continue;
      const body = (p.go as unknown as { body: Phaser.Physics.Arcade.Body }).body;
      if (!body) continue;

      if (p.go.x <= p.minX) {
        body.setVelocityX(p.speed);
        p.go.setScale(1, 1);
      } else if (p.go.x >= p.maxX) {
        body.setVelocityX(-p.speed);
        p.go.setScale(-1, 1);
      }
    }
  }
}
