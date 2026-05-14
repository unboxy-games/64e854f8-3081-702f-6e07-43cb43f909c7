import Phaser from 'phaser';
import { loadWorldScene } from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const WORLD_W    = 4096;
const WORLD_H    = 720;
const GRAVITY    = 900;
const SPD        = 210;
const JUMP_VEL   = -560;
const GND_TOP    = 648;   // y of the ground surface
const FLAG_X     = WORLD_W - 280;

interface EnemyData {
  sprite: Phaser.Physics.Arcade.Sprite;
  dir: 1 | -1;
  speed: number;
  left: number;
  right: number;
  alive: boolean;
}

export class GameScene extends Phaser.Scene {
  private sceneId!: string;
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private enemies: EnemyData[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private score      = 0;
  private lives      = 3;
  private invincible = 0;
  private coyote     = 0;
  private isDead     = false;
  private levelDone  = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId?: string }): void {
    this.sceneId   = data?.sceneId ?? 'main';
    this.score     = 0;
    this.lives     = 3;
    this.invincible = 0;
    this.coyote    = 0;
    this.isDead    = false;
    this.levelDone = false;
    this.enemies   = [];
  }

  async create(): Promise<void> {
    await loadWorldScene(this, this.sceneId);

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.physics.world.gravity.y = GRAVITY;

    this.buildTextures();
    this.drawBackground();
    this.createPlatforms();
    this.createPlayer();
    this.createEnemies();
    this.createGoal();
    this.setupColliders();

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Hint text
    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28,
        '← → Move   |   ↑ / Space   Jump   |   Land on enemies to stomp them!',
        { fontSize: '15px', color: '#ffffffcc', fontFamily: 'sans-serif' })
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(20);
    this.time.delayedCall(4000, () => {
      this.tweens.add({ targets: hint, alpha: 0, duration: 700, onComplete: () => hint.destroy() });
    });

    this.events.emit('hud-update', { score: this.score, lives: this.lives });
  }

  // ─────────────────────────────────────── textures ──────────────────────────

  private buildTextures(): void {
    this.makePixelTex();
    this.makeMarioTex();
    this.makeGoombaTex();
    this.makePlatTex();
    this.makeFlagTex();
  }

  private makePixelTex(): void {
    if (this.textures.exists('px')) return;
    const g = this.make.graphics();
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('px', 4, 4);
    g.destroy();
  }

  private makeMarioTex(): void {
    if (this.textures.exists('mario')) return;
    const g = this.make.graphics();
    // Hat (red)
    g.fillStyle(0xdd2211);
    g.fillRect(6, 2, 28, 12);
    g.fillRect(2, 13, 36, 6);
    // Face (peach)
    g.fillStyle(0xffcc88);
    g.fillRect(8, 18, 24, 17);
    // Eyes
    g.fillStyle(0xffffff);
    g.fillCircle(15, 24, 4);
    g.fillCircle(25, 24, 4);
    g.fillStyle(0x111111);
    g.fillCircle(16, 25, 2.5);
    g.fillCircle(26, 25, 2.5);
    // Mustache
    g.fillStyle(0x662200);
    g.fillRect(9, 31, 9, 4);
    g.fillRect(22, 31, 9, 4);
    // Shirt (red)
    g.fillStyle(0xdd2211);
    g.fillRect(8, 35, 24, 9);
    // Overall straps (blue)
    g.fillStyle(0x3355dd);
    g.fillRect(8, 35, 7, 9);
    g.fillRect(25, 35, 7, 9);
    // Overalls
    g.fillRect(6, 44, 28, 10);
    // Buttons
    g.fillStyle(0xffffff);
    g.fillCircle(13, 48, 2);
    g.fillCircle(27, 48, 2);
    // Shoes (dark brown)
    g.fillStyle(0x332211);
    g.fillRect(4, 53, 14, 4);
    g.fillRect(22, 53, 14, 4);
    g.generateTexture('mario', 40, 57);
    g.destroy();
  }

  private makeGoombaTex(): void {
    if (this.textures.exists('goomba')) return;
    const g = this.make.graphics();
    // Main body (brown mushroom head)
    g.fillStyle(0xaa6633);
    g.fillEllipse(24, 20, 44, 36);
    // Darker belly
    g.fillStyle(0x883311);
    g.fillEllipse(24, 30, 36, 20);
    // White eyes
    g.fillStyle(0xffffff);
    g.fillCircle(15, 16, 7);
    g.fillCircle(33, 16, 7);
    // Black pupils (angled inward = angry)
    g.fillStyle(0x111111);
    g.fillCircle(17, 18, 4);
    g.fillCircle(31, 18, 4);
    // Angry eyebrows
    g.fillStyle(0x222222);
    g.fillRect(9, 10, 10, 3);
    g.fillRect(29, 10, 10, 3);
    // Fangs
    g.fillStyle(0xffffff);
    g.fillRect(16, 36, 4, 6);
    g.fillRect(28, 36, 4, 6);
    // Feet
    g.fillStyle(0x552211);
    g.fillEllipse(14, 45, 19, 11);
    g.fillEllipse(34, 45, 19, 11);
    g.generateTexture('goomba', 48, 48);
    g.destroy();
  }

  private makePlatTex(): void {
    if (this.textures.exists('plat32')) return;
    const g = this.make.graphics();
    // Grass top
    g.fillStyle(0x55cc44);
    g.fillRect(0, 0, 32, 12);
    g.fillStyle(0x77ee66);
    g.fillRect(0, 0, 32, 4);
    g.fillStyle(0x33aa33);
    g.fillRect(0, 8, 32, 4);
    // Dirt
    g.fillStyle(0x9b6e3c);
    g.fillRect(0, 12, 32, 20);
    // Dirt details
    g.fillStyle(0x7a5229);
    g.fillRect(4, 16, 7, 5);
    g.fillRect(16, 20, 5, 4);
    g.fillRect(22, 14, 5, 4);
    g.generateTexture('plat32', 32, 32);
    g.destroy();
  }

  private makeFlagTex(): void {
    if (!this.textures.exists('flagpole')) {
      const g = this.make.graphics();
      // Pole
      g.fillStyle(0xbbbbbb);
      g.fillRect(8, 0, 8, 210);
      // Shadow on pole
      g.fillStyle(0x999999);
      g.fillRect(8, 0, 3, 210);
      // Gold ball on top
      g.fillStyle(0xffdd00);
      g.fillCircle(12, 8, 11);
      g.fillStyle(0xffaa00);
      g.fillCircle(12, 10, 8);
      g.fillStyle(0xffee66);
      g.fillCircle(10, 6, 4);
      g.generateTexture('flagpole', 24, 210);
      g.destroy();
    }
    if (!this.textures.exists('flagflag')) {
      const g = this.make.graphics();
      g.fillStyle(0x22cc22);
      g.fillTriangle(0, 0, 52, 24, 0, 48);
      // Highlight
      g.fillStyle(0x44ee44);
      g.fillTriangle(0, 0, 26, 12, 0, 24);
      g.generateTexture('flagflag', 52, 48);
      g.destroy();
    }
  }

  // ─────────────────────────────────────── background ────────────────────────

  private drawBackground(): void {
    // Sky gradient fixed to camera
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-10);
    const strips = 24;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const r = Math.round(Phaser.Math.Linear(0x28, 0xaa, t));
      const gr = Math.round(Phaser.Math.Linear(0x60, 0xdd, t));
      const b = Math.round(Phaser.Math.Linear(0xcc, 0xff, t));
      sky.fillStyle(Phaser.Display.Color.GetColor(r, gr, b));
      sky.fillRect(0, Math.floor(i * GAME_HEIGHT / strips), GAME_WIDTH, Math.ceil(GAME_HEIGHT / strips) + 1);
    }

    // Distant mountains (slow parallax)
    const mtn = this.add.graphics().setScrollFactor(0.15).setDepth(-9);
    mtn.fillStyle(0x6688aa, 0.65);
    const mPts: Phaser.Geom.Point[] = [new Phaser.Geom.Point(0, GAME_HEIGHT)];
    ([ [0,460],[280,260],[540,360],[790,220],[1080,340],[1360,230],
       [1640,310],[1920,195],[2200,320],[2480,210],[2760,295],
       [3040,220],[3320,305],[3600,200],[3900,340],[4096,360],[4096,GAME_HEIGHT]
    ] as [number,number][]).forEach(([x,y]) => mPts.push(new Phaser.Geom.Point(x, y)));
    mtn.fillPoints(mPts, true);

    // Green hills (mid parallax)
    const hill = this.add.graphics().setScrollFactor(0.35).setDepth(-8);
    hill.fillStyle(0x44aa55, 0.82);
    const hPts: Phaser.Geom.Point[] = [new Phaser.Geom.Point(0, GAME_HEIGHT)];
    ([ [0,540],[240,410],[480,520],[720,390],[960,510],[1200,395],
       [1440,525],[1680,405],[1920,515],[2160,380],[2400,505],
       [2640,415],[2880,515],[3120,390],[3360,525],[3600,405],
       [3840,510],[4096,440],[4096,GAME_HEIGHT]
    ] as [number,number][]).forEach(([x,y]) => hPts.push(new Phaser.Geom.Point(x, y)));
    hill.fillPoints(hPts, true);

    // Clouds (gentle parallax)
    const cloudSeeds: [number, number, number][] = [
      [110,68,1.1],[370,50,0.9],[650,88,1.2],[920,52,0.85],[1200,78,1.0],
      [1480,58,1.1],[1760,84,0.95],[2040,62,1.15],[2320,74,1.0],[2600,50,0.9],
      [2880,88,1.1],[3160,68,0.95],[3440,78,1.0],[3720,55,1.2],
    ];
    for (const [cx, cy, sz] of cloudSeeds) {
      const cg = this.add.graphics().setScrollFactor(0.4).setDepth(-7);
      const r = 28 * sz;
      cg.fillStyle(0xffffff, 0.93);
      cg.fillEllipse(cx, cy, r * 2.5, r * 1.4);
      cg.fillEllipse(cx + r * 0.85, cy + 5, r * 1.9, r * 1.1);
      cg.fillEllipse(cx - r * 0.8, cy + 7, r * 1.6, r * 1.05);
      cg.fillEllipse(cx + r * 0.2, cy - r * 0.5, r * 1.4, r * 1.0);
    }
  }

  // ─────────────────────────────────────── platforms ─────────────────────────

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    // [left-x, top-y, width, height]
    const defs: [number, number, number, number][] = [
      [0,    GND_TOP, WORLD_W, WORLD_H - GND_TOP], // ground
      [160,  548,     160, 24],
      [400,  448,     160, 24],
      [640,  368,     120, 24],
      [840,  448,     160, 24],
      [1060, 548,     200, 24],
      [1320, 428,     160, 24],
      [1540, 348,     120, 24],
      [1720, 448,     160, 24],
      [1940, 528,     200, 24],
      [2200, 408,     160, 24],
      [2420, 328,     140, 24],
      [2620, 428,     160, 24],
      [2840, 548,     200, 24],
      [3100, 408,     160, 24],
      [3320, 328,     140, 24],
      [3520, 448,     160, 24],
      [3720, 368,     200, 24],
    ];

    for (const [px, py, pw, ph] of defs) {
      // Visual tiled sprite
      this.add.tileSprite(px, py, pw, ph, 'plat32').setOrigin(0, 0).setDepth(1);
      // Invisible static physics body
      const img = this.platforms.create(px + pw / 2, py + ph / 2, 'px') as Phaser.Physics.Arcade.Image;
      img.setDisplaySize(pw, ph);
      img.refreshBody();
      img.setAlpha(0);
    }
  }

  // ─────────────────────────────────────── player ─────────────────────────────

  private createPlayer(): void {
    this.player = this.physics.add.sprite(100, GND_TOP - 58, 'mario');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(3);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(28, 52);
    (this.player.body as Phaser.Physics.Arcade.Body).setOffset(6, 4);
  }

  // ─────────────────────────────────────── enemies ────────────────────────────

  private createEnemies(): void {
    this.enemyGroup = this.physics.add.group();

    const G = GND_TOP - 24;
    const spawns: { x: number; y: number; left: number; right: number; speed: number }[] = [
      // Ground patrols (spread across the world)
      { x: 340,  y: G,       left: 100,  right: 600,  speed: 62 },
      { x: 720,  y: G,       left: 600,  right: 1010, speed: 70 },
      { x: 1150, y: G,       left: 1010, right: 1390, speed: 65 },
      { x: 1720, y: G,       left: 1390, right: 2000, speed: 72 },
      { x: 2250, y: G,       left: 2000, right: 2540, speed: 75 },
      { x: 2790, y: G,       left: 2540, right: 3080, speed: 72 },
      { x: 3360, y: G,       left: 3080, right: 3640, speed: 80 },
      { x: 3830, y: G,       left: 3640, right: 3960, speed: 70 },
      // Platform enemies
      { x: 455,  y: 448-24,  left: 410,  right: 550,  speed: 52 },
      { x: 1100, y: 548-24,  left: 1070, right: 1250, speed: 55 },
      { x: 1360, y: 428-24,  left: 1330, right: 1470, speed: 52 },
      { x: 2250, y: 408-24,  left: 2210, right: 2350, speed: 55 },
      { x: 2880, y: 548-24,  left: 2850, right: 3030, speed: 52 },
      { x: 3760, y: 368-24,  left: 3730, right: 3910, speed: 60 },
    ];

    for (const s of spawns) {
      const spr = this.physics.add.sprite(s.x, s.y, 'goomba');
      spr.setDepth(2);
      spr.body.setSize(40, 42);
      spr.body.setOffset(4, 4);
      (spr.body as Phaser.Physics.Arcade.Body).setVelocityX(s.speed);
      this.enemyGroup.add(spr);
      this.enemies.push({
        sprite: spr, dir: 1, speed: s.speed,
        left: s.left, right: s.right, alive: true,
      });
    }
  }

  // ─────────────────────────────────────── goal ───────────────────────────────

  private createGoal(): void {
    this.add.image(FLAG_X, GND_TOP, 'flagpole').setDepth(1).setOrigin(0.5, 1);
    this.add.image(FLAG_X + 12, GND_TOP - 198, 'flagflag').setDepth(1).setOrigin(0, 0.5);
  }

  // ─────────────────────────────────────── colliders ─────────────────────────

  private setupColliders(): void {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemyGroup, this.platforms);
    this.physics.add.overlap(
      this.player, this.enemyGroup,
      (_p, enemy) => this.onPlayerEnemy(enemy as Phaser.Physics.Arcade.Sprite)
    );
  }

  private onPlayerEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    const eData = this.enemies.find(e => e.sprite === enemy && e.alive);
    if (!eData) return;

    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
    const stomping = pb.velocity.y > 40 && pb.bottom < enemyBody.center.y + 18;

    if (stomping) {
      this.stompEnemy(eData);
    } else if (this.invincible <= 0) {
      this.hurtPlayer(enemy);
    }
  }

  private stompEnemy(eData: EnemyData): void {
    eData.alive = false;
    const spr = eData.sprite;

    // Bounce player upward
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(-380);

    // Score
    this.score += 100;
    this.events.emit('hud-update', { score: this.score, lives: this.lives });

    // Floating score popup
    const popup = this.add
      .text(spr.x, spr.y - 18, '+100', {
        fontSize: '20px', color: '#ffdd00',
        fontFamily: 'Arial Black, sans-serif',
        stroke: '#000000', strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({
      targets: popup, y: popup.y - 58, alpha: 0, duration: 680,
      onComplete: () => popup.destroy(),
    });

    // Squish-squash death animation
    this.tweens.add({
      targets: spr, scaleY: 0.22, scaleX: 1.45, duration: 90,
      onComplete: () => {
        // Dust particle burst
        const burst = this.add.particles(spr.x, spr.y + 10, 'px', {
          speed: { min: 55, max: 160 },
          angle: { min: 0, max: 360 },
          scale: { start: 3.5, end: 0 },
          lifespan: 480,
          tint: [0xaa6633, 0x883311, 0xddbb44, 0xff9944],
          gravityY: 350,
          emitting: false,
        });
        burst.setDepth(5);
        burst.explode(16, spr.x, spr.y + 10);
        this.time.delayedCall(650, () => burst.destroy());
        spr.destroy();
      },
    });
  }

  private hurtPlayer(enemy: Phaser.Physics.Arcade.Sprite): void {
    this.lives--;
    this.invincible = 2400;
    this.events.emit('hud-update', { score: this.score, lives: this.lives });

    // Knockback away from enemy
    const kbDir = this.player.x >= enemy.x ? 1 : -1;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(kbDir * 230, -310);

    // Flash effect during invincibility
    this.tweens.add({
      targets: this.player, alpha: 0.25, duration: 90, yoyo: true,
      repeat: 11, onComplete: () => this.player.setAlpha(1),
    });

    // Hit flash on screen (brief red overlay)
    const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.25)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy(),
    });

    if (this.lives <= 0) {
      this.time.delayedCall(900, () => this.gameOver());
    }
  }

  private winLevel(): void {
    this.levelDone = true;
    this.score += 1000;
    this.events.emit('hud-update', { score: this.score, lives: this.lives });

    // Stop player
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    // Victory run toward flag, then celebrate
    this.time.delayedCall(300, () => {
      this.events.emit('level-complete', { score: this.score });
    });
  }

  private gameOver(): void {
    this.isDead = true;
    this.events.emit('game-over', { score: this.score });
  }

  // ─────────────────────────────────────── update ─────────────────────────────

  update(_time: number, delta: number): void {
    if (this.isDead || this.levelDone) return;

    // Fell into a pit
    if (this.player.y > WORLD_H + 100) {
      this.lives = Math.max(0, this.lives - 1);
      if (this.lives <= 0) { this.gameOver(); return; }
      this.player.setPosition(100, GND_TOP - 58);
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.events.emit('hud-update', { score: this.score, lives: this.lives });
      return;
    }

    // Reach flag zone
    if (!this.levelDone &&
        Math.abs(this.player.x - FLAG_X) < 55 &&
        this.player.y > GND_TOP - 220) {
      this.winLevel();
      return;
    }

    // Timers
    if (this.invincible > 0) this.invincible -= delta;

    // Coyote time (grace window after walking off a ledge)
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) this.coyote = 165;
    else if (this.coyote > 0) this.coyote -= delta;

    // Horizontal movement
    const goLeft  = this.cursors.left.isDown  || this.keyA.isDown;
    const goRight = this.cursors.right.isDown || this.keyD.isDown;
    const doJump  =
      Phaser.Input.Keyboard.JustDown(this.cursors.up)    ||
      Phaser.Input.Keyboard.JustDown(this.keyW)          ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space);

    if (goLeft) {
      body.setVelocityX(-SPD);
      this.player.setFlipX(true);
    } else if (goRight) {
      body.setVelocityX(SPD);
      this.player.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    if (doJump && this.coyote > 0) {
      body.setVelocityY(JUMP_VEL);
      this.coyote = 0;
      // Jump squish tween (one-shot)
      this.tweens.add({
        targets: this.player,
        scaleY: 0.72, scaleX: 1.18,
        duration: 70,
        yoyo: true,
      });
    }

    // Enemy patrol AI
    for (const e of this.enemies) {
      if (!e.alive || !e.sprite.active) continue;
      if (e.sprite.x <= e.left) {
        e.dir = 1;
        e.sprite.setFlipX(false);
      } else if (e.sprite.x >= e.right) {
        e.dir = -1;
        e.sprite.setFlipX(true);
      }
      (e.sprite.body as Phaser.Physics.Arcade.Body).setVelocityX(e.dir * e.speed);
    }
  }
}
