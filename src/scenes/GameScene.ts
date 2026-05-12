import Phaser from 'phaser';
import { loadWorldScene } from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const PLAYER_SPEED   = 290;
const SHOOT_COOLDOWN = 180;   // ms between player shots
const ENEMY_BULLET_SPD = 340;
const PLAYER_BULLET_SPD = 620;
const BASE_SPAWN_MS  = 2400;

interface CloudData { obj: Phaser.GameObjects.Graphics; speed: number }

export class GameScene extends Phaser.Scene {
  // ── Core objects ──────────────────────────────────────────────────
  private player!: Phaser.Physics.Arcade.Image;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;

  // ── Input ─────────────────────────────────────────────────────────
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // ── State ─────────────────────────────────────────────────────────
  private score        = 0;
  private lives        = 3;
  private shootTimer   = 0;
  private spawnTimer   = 0;
  private invincible   = false;
  private invTimer     = 0;
  private gameOver     = false;
  private killCount    = 0;
  private clouds: CloudData[] = [];

  // ── Stars (one-time static graphics) ─────────────────────────────
  private starGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  // ─────────────────────────────────────────────────────────────────
  async create(): Promise<void> {
    await loadWorldScene(this, 'main');

    this.generateTextures();
    this.buildBackground();

    // Player
    this.player = this.physics.add.image(150, GAME_HEIGHT / 2, 'planeTex_player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(3);

    // Physics groups
    this.playerBullets = this.physics.add.group();
    this.enemyBullets  = this.physics.add.group();
    this.enemies       = this.physics.add.group();

    // Input
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.keyW     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Overlaps
    this.physics.add.overlap(
      this.playerBullets, this.enemies,
      (blt, enm) => this.hitEnemy(
        blt as Phaser.Physics.Arcade.Image,
        enm as Phaser.Physics.Arcade.Image
      )
    );

    this.physics.add.overlap(
      this.enemyBullets, this.player,
      (_, blt) => {
        if (!this.invincible) {
          (blt as Phaser.Physics.Arcade.Image).destroy();
          this.onPlayerHit();
        }
      }
    );

    this.physics.add.overlap(
      this.enemies, this.player,
      (enm) => {
        if (!this.invincible) {
          const e = enm as Phaser.Physics.Arcade.Image;
          this.spawnExplosion(e.x, e.y);
          e.destroy();
          this.onPlayerHit();
        }
      }
    );

    // Launch HUD
    this.scene.launch('UIScene');
    this.events.emit('hudLives', this.lives);
    this.events.emit('hudScore', this.score);
  }

  // ─────────────────────────────────────────────────────────────────
  // Texture generation
  // ─────────────────────────────────────────────────────────────────
  private generateTextures(): void {
    // ── Player plane (pointing right, cyan/blue) ──────────────────
    {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const W = 72, H = 48;

      // Main body – tapered fuselage
      g.fillStyle(0x00ccff);
      g.fillPoints([
        { x: W - 2, y: H / 2 },     // nose
        { x: 46,    y: 14 },
        { x: 8,     y: 16 },
        { x: 0,     y: H / 2 },
        { x: 8,     y: H - 16 },
        { x: 46,    y: H - 14 },
      ], true);

      // Wings
      g.fillStyle(0x0088cc);
      g.fillTriangle(38, 14, 12, 2,  12, 14);   // top wing
      g.fillTriangle(38, H - 14, 12, H - 2, 12, H - 14); // bottom wing

      // Wing edge highlight
      g.fillStyle(0x00eeff);
      g.fillRect(14, 4, 16, 3);
      g.fillRect(14, H - 7, 16, 3);

      // Cockpit surround
      g.fillStyle(0x004466);
      g.fillEllipse(52, H / 2, 22, 16);
      // Cockpit glass
      g.fillStyle(0x22ddff);
      g.fillEllipse(51, H / 2 - 1, 15, 10);

      // Engine exhaust
      g.fillStyle(0xff6600);
      g.fillRect(0, H / 2 - 7, 6, 14);
      g.fillStyle(0xffbb00);
      g.fillRect(0, H / 2 - 4, 4, 8);

      g.generateTexture('planeTex_player', W, H);
      g.destroy();
    }

    // ── Enemy plane (pointing left, red/orange) ───────────────────
    {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const W = 72, H = 48;

      g.fillStyle(0xff2222);
      g.fillPoints([
        { x: 2,     y: H / 2 },
        { x: 26,    y: 14 },
        { x: 64,    y: 16 },
        { x: W,     y: H / 2 },
        { x: 64,    y: H - 16 },
        { x: 26,    y: H - 14 },
      ], true);

      // Wings
      g.fillStyle(0xbb0000);
      g.fillTriangle(34, 14, 60, 2,  60, 14);
      g.fillTriangle(34, H - 14, 60, H - 2, 60, H - 14);

      // Wing highlight
      g.fillStyle(0xff6666);
      g.fillRect(42, 4, 16, 3);
      g.fillRect(42, H - 7, 16, 3);

      // Cockpit
      g.fillStyle(0x440000);
      g.fillEllipse(20, H / 2, 22, 16);
      g.fillStyle(0xff5555);
      g.fillEllipse(21, H / 2 - 1, 15, 10);

      // Engine exhaust (right side)
      g.fillStyle(0xff6600);
      g.fillRect(W - 6, H / 2 - 7, 6, 14);
      g.fillStyle(0xffbb00);
      g.fillRect(W - 4, H / 2 - 4, 4, 8);

      g.generateTexture('planeTex_enemy', W, H);
      g.destroy();
    }

    // ── Player bullet ─────────────────────────────────────────────
    {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffff44);
      g.fillRect(0, 1, 18, 4);
      g.fillStyle(0xffffff);
      g.fillRect(0, 2, 10, 2);
      g.generateTexture('bulletTex_player', 18, 6);
      g.destroy();
    }

    // ── Enemy bullet ──────────────────────────────────────────────
    {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xff5500);
      g.fillRect(0, 1, 16, 4);
      g.fillStyle(0xffaa44);
      g.fillRect(5, 2, 8, 2);
      g.generateTexture('bulletTex_enemy', 16, 6);
      g.destroy();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Background
  // ─────────────────────────────────────────────────────────────────
  private buildBackground(): void {
    // Gradient sky
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x03050f, 0x03050f, 0x071630, 0x071630, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    this.starGfx = this.add.graphics().setDepth(0);
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const bright = Math.random();
      const sz = bright > 0.8 ? 2 : 1;
      this.starGfx.fillStyle(0xffffff, 0.2 + bright * 0.7);
      this.starGfx.fillRect(x, y, sz, sz);
    }

    // Distant glow strip (horizon)
    const glow = this.add.graphics().setDepth(0);
    glow.fillGradientStyle(0x0055aa, 0x0055aa, 0x001144, 0x001144, 0.3);
    glow.fillRect(0, GAME_HEIGHT / 2 - 60, GAME_WIDTH, 120);

    // Seed initial clouds
    for (let i = 0; i < 7; i++) this.spawnCloud(true);
  }

  private spawnCloud(initial = false): void {
    const x     = initial ? Phaser.Math.Between(-60, GAME_WIDTH + 60) : GAME_WIDTH + 100;
    const y     = Phaser.Math.Between(20, GAME_HEIGHT - 20);
    const speed = Phaser.Math.Between(25, 75);
    const s     = 0.5 + Math.random() * 1.2;
    const alpha = 0.08 + Math.random() * 0.14;

    const g = this.add.graphics().setDepth(1).setAlpha(alpha);
    g.fillStyle(0x3366aa);
    g.fillRoundedRect(-60 * s, -18 * s, 120 * s, 36 * s, 18 * s);
    g.fillStyle(0x4488bb);
    g.fillRoundedRect(-40 * s, -28 * s, 80 * s, 30 * s, 15 * s);
    g.x = x; g.y = y;

    this.clouds.push({ obj: g, speed });
  }

  // ─────────────────────────────────────────────────────────────────
  // Shooting
  // ─────────────────────────────────────────────────────────────────
  private firePlayerBullet(): void {
    const b = this.physics.add.image(
      this.player.x + 38, this.player.y, 'bulletTex_player'
    );
    b.setDepth(2);
    (b.body as Phaser.Physics.Arcade.Body).setVelocityX(PLAYER_BULLET_SPD);
    this.playerBullets.add(b);
  }

  private fireEnemyBullet(x: number, y: number): void {
    const b = this.physics.add.image(x - 38, y, 'bulletTex_enemy');
    b.setDepth(2);
    (b.body as Phaser.Physics.Arcade.Body).setVelocityX(-ENEMY_BULLET_SPD);
    this.enemyBullets.add(b);
  }

  // ─────────────────────────────────────────────────────────────────
  // Enemies
  // ─────────────────────────────────────────────────────────────────
  private spawnEnemy(): void {
    const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
    const e = this.physics.add.image(GAME_WIDTH + 48, y, 'planeTex_enemy');
    e.setDepth(3);

    const speed = 110 + Math.min(this.killCount * 2, 120);
    (e.body as Phaser.Physics.Arcade.Body).setVelocityX(-speed);

    e.setData('hp',         2);
    e.setData('shootMs',    Phaser.Math.Between(1000, 2500));
    this.enemies.add(e);
  }

  private hitEnemy(
    blt: Phaser.Physics.Arcade.Image,
    enm: Phaser.Physics.Arcade.Image
  ): void {
    blt.destroy();
    const hp = (enm.getData('hp') as number) - 1;
    if (hp <= 0) {
      this.spawnExplosion(enm.x, enm.y);
      enm.destroy();
      this.killCount++;
      this.score += 100;
      this.events.emit('hudScore', this.score);

      // Score pop in UIScene
      const uiScene = this.scene.get('UIScene') as Phaser.Scene;
      uiScene.events.emit('scorePopup', '+100');
    } else {
      enm.setData('hp', hp);
      // Damage flash
      this.tweens.add({
        targets: enm, alpha: 0.25, duration: 55, yoyo: true,
        onComplete: () => { if (enm.active) enm.setAlpha(1); },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Player damage
  // ─────────────────────────────────────────────────────────────────
  private onPlayerHit(): void {
    if (this.invincible || this.gameOver) return;
    this.lives--;
    this.events.emit('hudLives', this.lives);

    if (this.lives <= 0) {
      this.doGameOver();
      return;
    }

    this.invincible = true;
    this.invTimer   = 2200;
    this.tweens.add({
      targets: this.player, alpha: 0, duration: 90,
      yoyo: true, repeat: 11,
      onComplete: () => { if (this.player.active) this.player.setAlpha(1); },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Explosion particles
  // ─────────────────────────────────────────────────────────────────
  private spawnExplosion(x: number, y: number): void {
    const palette = [0xff4400, 0xff8800, 0xffcc00, 0xffffff, 0xff2222];
    for (let i = 0; i < 14; i++) {
      const col = palette[Math.floor(Math.random() * palette.length)];
      const sz  = 4 + Math.floor(Math.random() * 6);
      const p   = this.add.rectangle(x, y, sz, sz, col).setDepth(5);
      const ang = Math.random() * Math.PI * 2;
      const spd = 70 + Math.random() * 200;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * spd * 0.45,
        y: y + Math.sin(ang) * spd * 0.45,
        alpha: 0, scaleX: 0.1, scaleY: 0.1,
        duration: 350 + Math.random() * 250,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    // Central flash
    const flash = this.add.circle(x, y, 28, 0xffffff, 0.9).setDepth(5);
    this.tweens.add({
      targets: flash, alpha: 0, scaleX: 2.2, scaleY: 2.2,
      duration: 200, ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Game Over
  // ─────────────────────────────────────────────────────────────────
  private doGameOver(): void {
    this.gameOver = true;
    this.spawnExplosion(this.player.x, this.player.y);
    this.player.destroy();

    // Darken overlay
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setAlpha(0).setDepth(50);
    this.tweens.add({ targets: overlay, alpha: 0.65, duration: 500 });

    // GAME OVER title
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '68px', color: '#ff2222',
      stroke: '#880000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(51).setAlpha(0);
    this.tweens.add({
      targets: title, alpha: 1, y: GAME_HEIGHT / 2 - 70,
      duration: 500, ease: 'Back.Out',
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `Score: ${this.score}`, {
      fontFamily: 'monospace', fontSize: '32px', color: '#ffdd44',
    }).setOrigin(0.5).setDepth(51);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 65, 'Press SPACE to restart', {
      fontFamily: 'monospace', fontSize: '22px', color: '#aaaacc',
    }).setOrigin(0.5).setDepth(51);

    this.events.emit('gameOver', this.score);
  }

  // ─────────────────────────────────────────────────────────────────
  // Update loop
  // ─────────────────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    // ── Restart ────────────────────────────────────────────────────
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.scene.restart();
        const ui = this.scene.get('UIScene') as Phaser.Scene & { resetHUD?: () => void };
        ui.events.emit('hudReset');
      }
      return;
    }

    // ── Player movement ───────────────────────────────────────────
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let vy = 0;
    if (this.cursors.up.isDown   || this.keyW.isDown) vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown || this.keyS.isDown) vy =  PLAYER_SPEED;
    body.setVelocityY(vy);

    // ── Shooting ──────────────────────────────────────────────────
    this.shootTimer -= delta;
    if ((this.cursors.space?.isDown || this.keySpace.isDown) && this.shootTimer <= 0) {
      this.firePlayerBullet();
      this.shootTimer = SHOOT_COOLDOWN;
    }

    // ── Invincibility timer ───────────────────────────────────────
    if (this.invincible) {
      this.invTimer -= delta;
      if (this.invTimer <= 0) {
        this.invincible = false;
        if (this.player.active) this.player.setAlpha(1);
      }
    }

    // ── Scroll clouds ─────────────────────────────────────────────
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      c.obj.x -= c.speed * (delta / 1000);
      if (c.obj.x < -150) {
        c.obj.destroy();
        this.clouds.splice(i, 1);
        this.spawnCloud();
      }
    }

    // ── Enemy spawn ───────────────────────────────────────────────
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      const interval = Math.max(700, BASE_SPAWN_MS - this.score * 0.4);
      this.spawnTimer = interval;
    }

    // ── Enemy AI ──────────────────────────────────────────────────
    const enemyList = [...this.enemies.getChildren()] as Phaser.Physics.Arcade.Image[];
    for (const e of enemyList) {
      if (!e.active) continue;
      const eb = e.body as Phaser.Physics.Arcade.Body;

      // Track player vertically
      if (this.player.active) {
        const dy = this.player.y - e.y;
        eb.setVelocityY(Math.sign(dy) * 90);
      }

      // Enemy shoot timer
      let sMs = (e.getData('shootMs') as number) - delta;
      if (sMs <= 0) {
        this.fireEnemyBullet(e.x, e.y);
        sMs = Phaser.Math.Between(1200, 2800);
      }
      e.setData('shootMs', sMs);

      // Off screen cleanup
      if (e.x < -80) e.destroy();
    }

    // ── Bullet cleanup ────────────────────────────────────────────
    for (const b of [...this.playerBullets.getChildren()] as Phaser.Physics.Arcade.Image[]) {
      if (b.x > GAME_WIDTH + 30) b.destroy();
    }
    for (const b of [...this.enemyBullets.getChildren()] as Phaser.Physics.Arcade.Image[]) {
      if (b.x < -30) b.destroy();
    }
  }
}
