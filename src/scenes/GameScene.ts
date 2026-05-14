import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry, spawnPrefab } from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// ── Constants ─────────────────────────────────────────────────────────────────
const WORLD_WIDTH = 5120;
const WORLD_HEIGHT = 720;
const PLAYER_SPEED = 220;
const JUMP_VELOCITY = -520;
const STARTING_LIVES = 3;
const GROUND_TOP = 656; // y coordinate of ground surface

// ── Goomba spawn positions [x, y] ─────────────────────────────────────────────
const GOOMBA_SPAWNS: [number, number][] = [
  // Ground-level (y = GROUND_TOP - bodyH/2 = 656 - 16 = 640)
  [350, 640],  [580, 640],  [920, 640],  [1150, 640],
  [1480, 640], [1720, 640], [2040, 640], [2540, 640],
  [2830, 640], [3100, 640], [3680, 640], [4000, 640],
  [4300, 640], [4750, 640],
  // Platform-top (platform_top - goomba_bodyH/2)
  [700,  452], // platform_02 top=470 → 470-16=454 ≈ 452
  [1840, 392], // platform_06 top=410 → 410-16=394 ≈ 392
  [2400, 362], // platform_08 top=380 → 380-16=364 ≈ 362
  [2960, 332], // platform_10 top=350 → 350-16=334 ≈ 332
  [3520, 352], // platform_12 top=370 → 370-16=354 ≈ 352
  [4080, 342], // platform_14 top=360 → 360-16=344 ≈ 342
];

// ── Coin spawn positions [x, y] (floating above platforms/ground) ─────────────
const COIN_SPAWNS: [number, number][] = [
  // Near start (ground)
  [200, 600], [240, 600], [280, 600],
  // Platform 01 (top=520)
  [360, 482], [400, 482], [440, 482],
  // Platform 02 (top=470)
  [660, 432], [700, 432], [740, 432],
  // Platform 03 (top=510)
  [960, 472], [1000, 472], [1040, 472],
  // Platform 04 (top=450)
  [1240, 412], [1280, 412], [1320, 412],
  // Platform 05 (top=490)
  [1520, 452], [1560, 452], [1600, 452],
  // Platform 06 (top=410)
  [1800, 372], [1840, 372], [1880, 372],
  // Platform 07 (top=460)
  [2080, 422], [2120, 422], [2160, 422],
  // Platform 08 (top=380)
  [2360, 342], [2400, 342], [2440, 342],
  // Platform 09 (top=440)
  [2640, 402], [2680, 402], [2720, 402],
  // Platform 10 (top=350)
  [2920, 312], [2960, 312], [3000, 312],
  // Platform 11 (top=410)
  [3200, 372], [3240, 372], [3280, 372],
  // Platform 12 (top=370)
  [3480, 332], [3520, 332], [3560, 332],
  // Platform 13 (top=440)
  [3760, 402], [3800, 402], [3840, 402],
  // Platform 14 (top=360)
  [4040, 322], [4080, 322], [4120, 322],
  // Platform 15 (top=440)
  [4320, 402], [4360, 402], [4400, 402],
  // Platform 16 (top=370)
  [4600, 332], [4640, 332], [4680, 332],
  // Platform 17 (top=450)
  [4880, 412], [4920, 412], [4960, 412],
  // Mid-level ground coins
  [1100, 600], [1380, 600], [2200, 600],
  [2500, 600], [3300, 600], [3640, 600], [4700, 600],
];

export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  private player!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Body;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private goombas!: Phaser.Physics.Arcade.Group;
  private coinObjects: Phaser.GameObjects.Graphics[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private lives = STARTING_LIVES;
  private score = 0;
  private isHurt = false;
  private isGameOver = false;
  private isWon = false;
  private spawnX = 120;
  private spawnY = 634;
  private facingRight = true;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
    // Reset state on restart
    this.lives = STARTING_LIVES;
    this.score = 0;
    this.isHurt = false;
    this.isGameOver = false;
    this.isWon = false;
    this.facingRight = true;
    this.coinObjects = [];
  }

  async create(): Promise<void> {
    // ── Physics world bounds ───────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // ── Sky + clouds background (fixed to camera) ─────────────────────────────
    this.drawBackground();

    // ── Load world scene (player, ground, platforms, flag) ────────────────────
    await loadWorldScene(this, this.sceneId);

    const registry = getEntityRegistry(this)!;

    // ── Player ─────────────────────────────────────────────────────────────────
    this.player = registry.byRole('player')[0] as Phaser.GameObjects.Graphics;
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setMaxVelocityY(900);

    // ── Platforms (static) ─────────────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup();
    const platformEntities = registry.byRole('platform');
    for (const p of platformEntities) {
      this.physics.add.existing(p as Phaser.GameObjects.GameObject, true);
      this.platforms.add(p as Phaser.GameObjects.GameObject, false);
    }

    // ── Goombas ────────────────────────────────────────────────────────────────
    this.goombas = this.physics.add.group();
    this.spawnGoombas();

    // ── Coins ──────────────────────────────────────────────────────────────────
    this.spawnCoins();

    // ── Colliders ──────────────────────────────────────────────────────────────
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.goombas, this.platforms);

    this.physics.add.collider(
      this.player,
      this.goombas,
      this.handlePlayerGoombaCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // ── Input ──────────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── Initial HUD emit ───────────────────────────────────────────────────────
    this.game.events.emit('lives', this.lives);
    this.game.events.emit('score', this.score);
  }

  // ── Background drawing ──────────────────────────────────────────────────────
  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.setScrollFactor(0);
    bg.setDepth(-10);

    // Sky gradient (two-tone rectangles)
    bg.fillStyle(0x87ceeb, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.55);
    bg.fillStyle(0xaee3f5, 1);
    bg.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);

    // Horizon haze
    bg.fillStyle(0xc8ecf8, 0.35);
    bg.fillRect(0, GAME_HEIGHT * 0.5, GAME_WIDTH, 60);

    // Clouds (a few, scrollFactor=0 so they don't move)
    const cloudPositions = [
      [80, 80], [260, 55], [480, 95], [700, 65], [920, 85],
      [1100, 50], [1200, 110],
    ];
    const clouds = this.add.graphics();
    clouds.setScrollFactor(0.15, 0);
    clouds.setDepth(-8);
    clouds.fillStyle(0xffffff, 0.88);
    for (const [cx, cy] of cloudPositions) {
      clouds.fillEllipse(cx, cy, 110, 48);
      clouds.fillEllipse(cx - 38, cy + 16, 80, 36);
      clouds.fillEllipse(cx + 40, cy + 12, 80, 36);
    }

    // Hill silhouettes at ground level (green hills, fixed)
    const hills = this.add.graphics();
    hills.setScrollFactor(0.4, 0);
    hills.setDepth(-5);
    hills.fillStyle(0x5a9e5a, 0.55);
    const hillData = [
      [100, 600, 180, 90], [340, 590, 200, 100], [590, 610, 160, 80],
      [800, 595, 220, 105], [1050, 605, 180, 90], [1260, 590, 200, 100],
    ];
    for (const [hx, hy, hw, hh] of hillData) {
      hills.fillEllipse(hx, hy, hw, hh);
    }
  }

  // ── Spawn goombas ───────────────────────────────────────────────────────────
  private spawnGoombas(): void {
    for (const [x, y] of GOOMBA_SPAWNS) {
      const g = spawnPrefab(this, 'goomba', x, y) as Phaser.GameObjects.Graphics;
      g.setDepth(2);
      g.setData('walkDir', Math.random() < 0.5 ? 1 : -1);
      this.goombas.add(g);
    }
  }

  // ── Spawn coins ─────────────────────────────────────────────────────────────
  private spawnCoins(): void {
    for (const [x, y] of COIN_SPAWNS) {
      const c = spawnPrefab(this, 'coin', x, y) as unknown as Phaser.GameObjects.Graphics;
      c.setDepth(2);
      this.coinObjects.push(c);
    }
  }

  // ── Player-Goomba collision ─────────────────────────────────────────────────
  private handlePlayerGoombaCollision(
    playerGo: Phaser.GameObjects.GameObject,
    goombaGo: Phaser.GameObjects.GameObject
  ): void {
    if (this.isHurt || this.isGameOver || this.isWon) return;

    const pb = (playerGo as Phaser.GameObjects.Graphics).body as Phaser.Physics.Arcade.Body;
    const gb = (goombaGo as Phaser.GameObjects.Graphics).body as Phaser.Physics.Arcade.Body;

    // Stomp: player falling AND player body-bottom is near goomba body-top
    const stompThreshold = gb.top + 12;
    if (pb.velocity.y > 30 && pb.bottom <= stompThreshold) {
      this.stompGoomba(goombaGo as Phaser.GameObjects.Graphics);
      pb.setVelocityY(-300); // bounce up
    } else {
      this.hurtPlayer();
    }
  }

  private stompGoomba(goomba: Phaser.GameObjects.Graphics): void {
    const props = goomba.getData('entityProperties') as { scoreValue?: number } | undefined;
    const points = props?.scoreValue ?? 100;
    this.addScore(points);

    // Squash tween → destroy
    this.tweens.add({
      targets: goomba,
      scaleY: 0.15,
      scaleX: 1.6,
      duration: 90,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.spawnParticles(goomba.x, goomba.y, 0x8B4513, 8);
        goomba.destroy();
      },
    });

    // Floating score popup
    this.showScorePopup(goomba.x, goomba.y, `+${points}`, '#ffdd00');
  }

  private hurtPlayer(): void {
    if (this.isHurt) return;
    this.isHurt = true;
    this.lives = Math.max(0, this.lives - 1);
    this.game.events.emit('lives', this.lives);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    // Knockback + flash
    this.playerBody.setVelocityY(-380);
    this.tweens.add({
      targets: this.player,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isHurt = false;
      },
    });
  }

  // ── Collect coin ────────────────────────────────────────────────────────────
  private collectCoin(coin: Phaser.GameObjects.Graphics): void {
    const props = coin.getData('entityProperties') as { scoreValue?: number } | undefined;
    const points = props?.scoreValue ?? 50;
    this.addScore(points);
    this.spawnParticles(coin.x, coin.y, 0xffd700, 6);
    this.showScorePopup(coin.x, coin.y, `+${points}`, '#ffd700');
    coin.destroy();
  }

  // ── Score helper ────────────────────────────────────────────────────────────
  private addScore(points: number): void {
    this.score += points;
    this.game.events.emit('score', this.score);
  }

  // ── Game over / win ─────────────────────────────────────────────────────────
  private triggerGameOver(): void {
    this.isGameOver = true;
    this.playerBody.setVelocity(0, 0);
    this.playerBody.setAllowGravity(false);

    this.tweens.add({
      targets: this.player,
      y: this.player.y + 20,
      alpha: 0,
      duration: 600,
      onComplete: () => this.game.events.emit('gameOver'),
    });
  }

  private triggerWin(): void {
    if (this.isWon) return;
    this.isWon = true;
    this.playerBody.setVelocityX(0);

    this.tweens.add({
      targets: this.player,
      y: this.player.y - 30,
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.game.events.emit('win', this.score),
    });

    // Celebration particles
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 150, () => {
        this.spawnParticles(
          this.player.x + Phaser.Math.Between(-20, 20),
          this.player.y + Phaser.Math.Between(-20, 20),
          [0xffd700, 0xff4444, 0x44ff88][i],
          12
        );
      });
    }
  }

  // ── Particles ───────────────────────────────────────────────────────────────
  private spawnParticles(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const p = this.add.graphics();
      p.fillStyle(color, 1);
      p.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      p.setPosition(x, y);
      p.setDepth(4);

      const angle = (i / count) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3);
      const speed = Phaser.Math.Between(50, 130);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed - Phaser.Math.Between(20, 60),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(300, 550),
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── Score popup ─────────────────────────────────────────────────────────────
  private showScorePopup(x: number, y: number, text: string, color: string): void {
    const t = this.add
      .text(x, y - 10, text, {
        fontSize: '16px',
        color,
        fontStyle: 'bold',
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
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  // ── Update loop ─────────────────────────────────────────────────────────────
  update(_time: number, _delta: number): void {
    if (this.isGameOver || this.isWon) return;
    if (!this.playerBody || !this.player.active) return;

    this.handlePlayerMovement();
    this.updateGoombas();
    this.checkCoinCollection();
    this.checkFallDeath();
    this.checkWinCondition();
  }

  private handlePlayerMovement(): void {
    const pb = this.playerBody;
    const left = this.cursors.left.isDown || this.wasd.a.isDown;
    const right = this.cursors.right.isDown || this.wasd.d.isDown;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.w) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    // Horizontal movement
    if (left) {
      pb.setVelocityX(-PLAYER_SPEED);
      this.facingRight = false;
    } else if (right) {
      pb.setVelocityX(PLAYER_SPEED);
      this.facingRight = true;
    } else {
      pb.setVelocityX(0);
    }

    // Flip player to face movement direction
    this.player.setScale(this.facingRight ? 1 : -1, 1);

    // Jump
    const onGround = pb.blocked.down;
    if (jumpPressed && onGround) {
      pb.setVelocityY(JUMP_VELOCITY);
      this.spawnParticles(this.player.x, this.player.y + 22, 0xddcc88, 5);
    }
  }

  private updateGoombas(): void {
    for (const go of this.goombas.getChildren()) {
      const goomba = go as Phaser.GameObjects.Graphics;
      if (!goomba.active) continue;
      const body = goomba.body as Phaser.Physics.Arcade.Body;
      const props = goomba.getData('entityProperties') as { walkSpeed?: number } | undefined;
      const speed = props?.walkSpeed ?? 75;

      let dir = (goomba.getData('walkDir') as number) ?? -1;
      if (body.blocked.left) dir = 1;
      if (body.blocked.right) dir = -1;
      goomba.setData('walkDir', dir);
      body.setVelocityX(dir * speed);

      // Mirror sprite by scale
      goomba.setScale(dir > 0 ? -1 : 1, 1);
    }
  }

  private checkCoinCollection(): void {
    this.coinObjects = this.coinObjects.filter(coin => {
      if (!coin.active) return false;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        coin.x, coin.y
      );
      if (dist < 26) {
        this.collectCoin(coin);
        return false;
      }
      return true;
    });
  }

  private checkFallDeath(): void {
    if (this.player.y > WORLD_HEIGHT + 80) {
      this.hurtPlayer();
      if (!this.isGameOver) {
        this.player.setPosition(this.spawnX, this.spawnY);
        this.playerBody.setVelocity(0, 0);
      }
    }
  }

  private checkWinCondition(): void {
    const registry = getEntityRegistry(this);
    if (!registry) return;
    const flagEntities = registry.byRole('goal');
    if (flagEntities.length === 0) return;
    const flag = flagEntities[0] as Phaser.GameObjects.Graphics;
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      flag.x, flag.y
    );
    if (dist < 55) {
      this.triggerWin();
    }
  }
}
