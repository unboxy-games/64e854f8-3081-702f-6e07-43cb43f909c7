import Phaser from 'phaser';
import {
  loadWorldScene,
  getEntityRegistry,
  spawnPrefab,
  getRule,
} from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  // entities
  private player!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private door!: Phaser.GameObjects.Graphics;
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private coinGroup!: Phaser.Physics.Arcade.Group;
  private enemyGroup!: Phaser.Physics.Arcade.Group;

  // state
  private score = 0;
  private lives = 3;
  private coinsCollected = 0;
  private readonly totalCoins = 3;
  private isGameOver = false;
  private isWon = false;
  private isInvincible = false;
  private invincibleTimer = 0;

  // rules
  private playerSpeed = 220;
  private jumpVelocity = 590;

  // input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
    // reset state on restart
    this.score = 0;
    this.lives = 3;
    this.coinsCollected = 0;
    this.isGameOver = false;
    this.isWon = false;
    this.isInvincible = false;
    this.invincibleTimer = 0;
  }

  async create(): Promise<void> {
    // Draw sky / background before entities spawn
    this.drawBackground();

    await loadWorldScene(this, this.sceneId);

    const reg = getEntityRegistry(this)!;

    // Read tunable rules
    this.lives = getRule(this, 'balance.lives', 3);
    this.playerSpeed = getRule(this, 'balance.playerSpeed', 220);
    this.jumpVelocity = getRule(this, 'balance.jumpVelocity', 590);

    // Seed HUD registry bindings
    this.registry.set('score', 0);
    this.registry.set('lives', this.lives);
    this.registry.set('coins', 0);

    // ── Entity lookup ──────────────────────────────────────────────────
    this.player = reg.byRole('player')[0] as Phaser.GameObjects.Graphics;
    this.door   = reg.byRole('door')[0]   as Phaser.GameObjects.Graphics;
    const ground    = reg.byRole('ground')[0]    as Phaser.GameObjects.Rectangle;
    const platforms = reg.byRole('platform')      as Phaser.GameObjects.Rectangle[];
    const coins     = reg.byRole('coin')          as Phaser.GameObjects.Graphics[];

    // ── Depth layering ──────────────────────────────────────────────────
    ground.setDepth(1);
    platforms.forEach(p => p.setDepth(1));
    this.door.setDepth(2);
    coins.forEach(c => c.setDepth(2));
    this.player.setDepth(3);

    // ── Platform static physics ─────────────────────────────────────────
    this.platformGroup = this.physics.add.staticGroup();
    this.platformGroup.add(ground);
    platforms.forEach(p => this.platformGroup.add(p));
    this.platformGroup.refresh();

    // ── Player physics ──────────────────────────────────────────────────
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    // Player visual: 32×56. Tight body: 22×46
    this.playerBody.setSize(22, 46);
    this.playerBody.setOffset((32 - 22) / 2, (56 - 46) / 2);
    this.playerBody.setCollideWorldBounds(true);

    // ── Coin physics ────────────────────────────────────────────────────
    this.coinGroup = this.physics.add.group();
    coins.forEach(c => {
      this.physics.add.existing(c);
      const cb = c.body as Phaser.Physics.Arcade.Body;
      cb.setSize(20, 20);
      cb.setOffset((24 - 20) / 2, (24 - 20) / 2);
      cb.setAllowGravity(false);
      cb.setImmovable(true);
      this.coinGroup.add(c);
    });

    // Gentle float tween for coins
    coins.forEach((c, i) => {
      this.tweens.add({
        targets: c,
        y: c.y - 6,
        duration: 900 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // ── Door physics ────────────────────────────────────────────────────
    this.physics.add.existing(this.door);
    const doorBody = this.door.body as Phaser.Physics.Arcade.Body;
    doorBody.setAllowGravity(false);
    doorBody.setImmovable(true);
    // Door visual: 50×72. Tight body: 42×66
    doorBody.setSize(42, 66);
    doorBody.setOffset((50 - 42) / 2, (72 - 66) / 2);

    // Door glow pulse (one-shot fade-in only, no continuous loop)
    this.tweens.add({
      targets: this.door,
      alpha: { from: 0.5, to: 1 },
      duration: 600,
      ease: 'Sine.Out',
    });

    // ── Enemy group + spawn ─────────────────────────────────────────────
    this.enemyGroup = this.physics.add.group();

    const enemySpeed = getRule(this, 'balance.enemySpeed', 80);

    // Enemy 1 — patrols platform 1 (centred x=260, top=529)
    const e1 = spawnPrefab(this, 'enemy', 220, 500) as Phaser.GameObjects.Graphics;
    e1.setData('patrolLeft', 140);
    e1.setData('patrolRight', 370);
    e1.setDepth(3);
    (e1.body as Phaser.Physics.Arcade.Body).setVelocityX(enemySpeed);
    this.enemyGroup.add(e1);

    // Enemy 2 — patrols platform 2 (centred x=640, top=389)
    const e2 = spawnPrefab(this, 'enemy', 680, 360) as Phaser.GameObjects.Graphics;
    e2.setData('patrolLeft', 510);
    e2.setData('patrolRight', 760);
    e2.setDepth(3);
    (e2.body as Phaser.Physics.Arcade.Body).setVelocityX(-enemySpeed);
    this.enemyGroup.add(e2);

    // ── Physics colliders ───────────────────────────────────────────────
    this.physics.add.collider(this.player, this.platformGroup);
    this.physics.add.collider(this.enemyGroup, this.platformGroup);

    // ── Overlap handlers ────────────────────────────────────────────────
    this.physics.add.overlap(
      this.player, this.coinGroup,
      (_p, coin) => this.collectCoin(coin as Phaser.GameObjects.Graphics),
    );

    this.physics.add.overlap(
      this.player, this.enemyGroup,
      () => this.hitByEnemy(),
    );

    this.physics.add.overlap(
      this.player, this.door,
      () => this.reachDoor(),
    );

    // ── Input ───────────────────────────────────────────────────────────
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  // ── Background drawing ────────────────────────────────────────────────
  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.setDepth(0);

    // Gradient sky (3 bands)
    bg.fillStyle(0x060d1c, 1);
    bg.fillRect(0, 0, GAME_WIDTH, 280);
    bg.fillStyle(0x0d1b3a, 1);
    bg.fillRect(0, 280, GAME_WIDTH, 220);
    bg.fillStyle(0x162848, 1);
    bg.fillRect(0, 500, GAME_WIDTH, 220);

    // Stars
    const starData = [
      [60,18],[140,52],[310,28],[480,72],[660,44],[820,20],[960,60],
      [1100,30],[1210,55],[1260,15],[380,120],[100,130],[750,100],
      [560,15],[1020,140],[200,90],[900,85],
    ];
    bg.fillStyle(0xffffff, 1);
    for (const [sx, sy] of starData) {
      const r = (sx + sy) % 3 === 0 ? 2 : 1.2;
      bg.fillCircle(sx, sy, r);
    }

    // Distant moon
    bg.fillStyle(0xeef4ff, 1);
    bg.fillCircle(1160, 80, 28);
    bg.fillStyle(0x0d1b3a, 1);
    bg.fillCircle(1172, 74, 24); // crescent cutout

    // Background hills silhouette
    bg.fillStyle(0x0e2a0e, 0.7);
    bg.fillEllipse(140, 670, 380, 130);
    bg.fillEllipse(580, 690, 320, 110);
    bg.fillEllipse(1000, 675, 360, 120);
    bg.fillEllipse(1220, 685, 200, 90);
  }

  // ── Collect coin ───────────────────────────────────────────────────────
  private collectCoin(coin: Phaser.GameObjects.Graphics): void {
    if (!coin.active) return;

    this.tweens.killTweensOf(coin);
    // Pop-then-fade
    this.tweens.add({
      targets: coin,
      scaleX: 1.6, scaleY: 1.6,
      alpha: 0,
      duration: 220,
      ease: 'Back.Out',
      onComplete: () => coin.destroy(),
    });

    // Score ring burst (Graphics circles)
    for (let i = 0; i < 6; i++) {
      const ring = this.add.graphics();
      ring.setDepth(5);
      const angle = (i / 6) * Math.PI * 2;
      const tx = coin.x + Math.cos(angle) * 28;
      const ty = coin.y + Math.sin(angle) * 28;
      ring.fillStyle(0xffd700, 1);
      ring.fillCircle(0, 0, 4);
      ring.setPosition(coin.x, coin.y);
      this.tweens.add({
        targets: ring,
        x: tx, y: ty,
        alpha: 0,
        duration: 350,
        ease: 'Quad.Out',
        onComplete: () => ring.destroy(),
      });
    }

    this.coinsCollected++;
    this.score += getRule(this, 'balance.scorePerCoin', 100);
    this.registry.set('score', this.score);
    this.registry.set('coins', this.coinsCollected);

    // Score bounce pop on HUD handled by binding; add a world score popup
    const popup = this.add.text(coin.x, coin.y - 10, `+${getRule(this, 'balance.scorePerCoin', 100)}`, {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
    this.tweens.add({
      targets: popup,
      y: popup.y - 40, alpha: 0,
      duration: 700,
      ease: 'Sine.Out',
      onComplete: () => popup.destroy(),
    });
  }

  // ── Hit by enemy ──────────────────────────────────────────────────────
  private hitByEnemy(): void {
    if (this.isInvincible || this.isGameOver || this.isWon) return;

    this.isInvincible = true;
    this.invincibleTimer = 2000; // 2s invincibility

    this.lives--;
    this.registry.set('lives', this.lives);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    // Respawn at start
    this.playerBody.reset(80, 630);

    // Camera red flash
    this.cameras.main.flash(250, 255, 40, 40);

    // Flicker tween (one-shot, fires on damage)
    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.3, to: 1 },
      duration: 140,
      yoyo: true,
      repeat: 6,
      onComplete: () => { this.player.setAlpha(1); },
    });
  }

  // ── Reach exit door ───────────────────────────────────────────────────
  private reachDoor(): void {
    if (this.isWon || this.isGameOver) return;
    this.isWon = true;

    this.cameras.main.flash(500, 200, 255, 180);

    // Freeze player
    this.playerBody.setVelocity(0, 0);

    this.time.delayedCall(300, () => {
      this.showEndScreen(true);
    });
  }

  // ── Game over ─────────────────────────────────────────────────────────
  private triggerGameOver(): void {
    this.isGameOver = true;
    this.playerBody.setVelocity(0, 0);
    this.cameras.main.flash(400, 255, 30, 30);

    this.time.delayedCall(400, () => {
      this.showEndScreen(false);
    });
  }

  // ── Shared end screen ─────────────────────────────────────────────────
  private showEndScreen(won: boolean): void {
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0,
    ).setDepth(1000);

    this.tweens.add({
      targets: overlay,
      alpha: 0.72,
      duration: 350,
      onComplete: () => {
        const titleText = won ? '✦ YOU WIN! ✦' : 'GAME OVER';
        const titleColor = won ? '#ffd700' : '#ff4444';

        const title = this.add.text(
          GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70,
          titleText,
          { fontSize: '68px', color: titleColor, fontStyle: 'bold', stroke: '#000', strokeThickness: 8 },
        ).setOrigin(0.5).setDepth(1001).setAlpha(0);

        this.add.text(
          GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10,
          `Score: ${this.score}`,
          { fontSize: '36px', color: '#ffffff', stroke: '#000', strokeThickness: 5 },
        ).setOrigin(0.5).setDepth(1001);

        const coinsLabel = this.add.text(
          GAME_WIDTH / 2, GAME_HEIGHT / 2 + 58,
          `Coins: ${this.coinsCollected} / ${this.totalCoins}`,
          { fontSize: '26px', color: '#ffd700', stroke: '#000', strokeThickness: 4 },
        ).setOrigin(0.5).setDepth(1001);

        this.add.text(
          GAME_WIDTH / 2, GAME_HEIGHT / 2 + 108,
          'Press SPACE to play again',
          { fontSize: '22px', color: '#aaaacc', stroke: '#000', strokeThickness: 3 },
        ).setOrigin(0.5).setDepth(1001);

        // Entry fade-in for title
        this.tweens.add({
          targets: [title, coinsLabel],
          alpha: 1,
          scaleX: { from: 0.6, to: 1 },
          scaleY: { from: 0.6, to: 1 },
          duration: 300,
          ease: 'Back.Out',
        });

        this.input.keyboard!.once('keydown-SPACE', () => {
          this.scene.restart({ sceneId: this.sceneId });
        });
      },
    });
  }

  // ── Update loop ───────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    if (this.isGameOver || this.isWon) return;

    // ── Player movement ────────────────────────────────────────────────
    if (this.cursors.left.isDown) {
      this.playerBody.setVelocityX(-this.playerSpeed);
      this.player.setScale(-1, 1); // face left
    } else if (this.cursors.right.isDown) {
      this.playerBody.setVelocityX(this.playerSpeed);
      this.player.setScale(1, 1);  // face right
    } else {
      this.playerBody.setVelocityX(0);
    }

    // ── Jump ───────────────────────────────────────────────────────────
    if (
      Phaser.Input.Keyboard.JustDown(this.spaceKey) &&
      this.playerBody.blocked.down
    ) {
      this.playerBody.setVelocityY(-this.jumpVelocity);
    }

    // ── Invincibility countdown ────────────────────────────────────────
    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.player.setAlpha(1);
      }
    }

    // ── Enemy patrol ───────────────────────────────────────────────────
    const enemySpeed = getRule(this, 'balance.enemySpeed', 80);
    for (const go of this.enemyGroup.getChildren()) {
      const e = go as Phaser.GameObjects.Graphics & { body: Phaser.Physics.Arcade.Body };
      const eb = e.body as Phaser.Physics.Arcade.Body;
      const left  = e.getData('patrolLeft')  as number;
      const right = e.getData('patrolRight') as number;

      if (e.x <= left) {
        eb.setVelocityX(enemySpeed);
        e.setScale(1, 1);
      } else if (e.x >= right) {
        eb.setVelocityX(-enemySpeed);
        e.setScale(-1, 1);
      }
    }
  }
}
