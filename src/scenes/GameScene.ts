import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { unboxyReady } from '../main';

// ─── constants ──────────────────────────────────────────────────────────────
const PLAYER_SPEED        = 340;
const BULLET_SPEED_UP     = 770;
const BULLET_SPEED_ENEMY  = 280;
const FIRE_RATE_DEFAULT   = 185;
const FIRE_RATE_RAPID     = 100;
const MAX_LIVES           = 3;
const INV_DURATION_MS     = 2200;

// ─── types ──────────────────────────────────────────────────────────────────
interface EnemyData {
  type: number;          // 1 | 2 | 3 | 4(boss)
  health: number;
  sinOffset: number;
  sinAmplitude: number;
  isBoss: boolean;
}

// ─── scene ──────────────────────────────────────────────────────────────────
export class GameScene extends Phaser.Scene {

  // background tile-sprites for parallax scrolling
  private bgL1!: Phaser.GameObjects.TileSprite;
  private bgL2!: Phaser.GameObjects.TileSprite;
  private bgL3!: Phaser.GameObjects.TileSprite;

  // player
  private player!: Phaser.Physics.Arcade.Sprite;
  private engineTrail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private shieldSprite: Phaser.GameObjects.Sprite | null = null;

  // physics groups
  private pBullets!: Phaser.Physics.Arcade.Group;
  private enemies!:  Phaser.Physics.Arcade.Group;
  private eBullets!: Phaser.Physics.Arcade.Group;
  private powerups!: Phaser.Physics.Arcade.Group;

  // game state
  private score        = 0;
  private highScore    = 0;
  private lives        = MAX_LIVES;
  private level        = 1;
  private wave         = 0;
  private gameOver     = false;
  private isInvincible = false;
  private isShielded   = false;
  private isRapidFire  = false;
  private fireRate     = FIRE_RATE_DEFAULT;
  private lastFired    = 0;

  // input
  private cursors!:   Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!:  Record<string, Phaser.Input.Keyboard.Key>;
  private touchActive = false;
  private touchX      = GAME_WIDTH / 2;

  // timers
  private enemyFireEvent!:                               Phaser.Time.TimerEvent;
  private nextWaveTimer: Phaser.Time.TimerEvent | null = null;
  private rapidTimer:    Phaser.Time.TimerEvent | null = null;

  constructor() { super({ key: 'GameScene' }); }

  // ─── lifecycle ────────────────────────────────────────────────────────────

  create(): void {
    // reset every restart
    this.score = 0; this.lives = MAX_LIVES; this.level = 1; this.wave = 0;
    this.gameOver = false; this.isInvincible = false;
    this.isShielded = false; this.isRapidFire = false;
    this.fireRate = FIRE_RATE_DEFAULT; this.lastFired = 0;
    this.shieldSprite = null; this.nextWaveTimer = null; this.rapidTimer = null;

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.buildTextures();
    this.buildBackground();
    this.buildPlayer();
    this.buildGroups();
    this.buildInput();
    this.buildColliders();
    this.buildEnemyFireTimer();

    // Launch HUD
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }

    // Broadcast initial state
    this.events.emit('livesChange',     this.lives);
    this.events.emit('scoreChange',     0);
    this.events.emit('levelChange',     this.level);
    this.events.emit('highScoreChange', this.highScore);

    // Load saved high score, then kick off first wave
    this.loadHighScore().then(() => this.spawnWave());
  }

  // ─── texture factory ─────────────────────────────────────────────────────

  private buildTextures(): void {

    // player ship – sleek cyan triangle with swept wings
    if (!this.textures.exists('player')) {
      const g = this.add.graphics();
      g.fillStyle(0x00e5ff);
      g.fillTriangle(30, 0, 3, 72, 57, 72);          // fuselage
      g.fillStyle(0x0077bb);
      g.fillTriangle(3, 72, 0, 44, 22, 58);           // left wing
      g.fillTriangle(57, 72, 60, 44, 38, 58);          // right wing
      g.fillStyle(0xe0f7ff, 0.88);
      g.fillTriangle(30, 14, 24, 44, 36, 44);          // cockpit glass
      g.fillStyle(0x223344);
      g.fillRect(17, 68, 10, 8);                       // left thruster body
      g.fillRect(33, 68, 10, 8);                       // right thruster body
      g.fillStyle(0xff8800, 0.7);
      g.fillRect(19, 74, 6, 4);                        // flame-slot L
      g.fillRect(35, 74, 6, 4);                        // flame-slot R
      g.generateTexture('player', 60, 80);
      g.destroy();
    }

    // enemy type 1 – red inverted arrow
    if (!this.textures.exists('enemy1')) {
      const g = this.add.graphics();
      g.fillStyle(0xff3333);
      g.fillTriangle(24, 62, 0, 6, 48, 6);
      g.fillStyle(0xbb0000);
      g.fillTriangle(0, 6, 0, 34, 14, 20);
      g.fillTriangle(48, 6, 48, 34, 34, 20);
      g.fillStyle(0xff9999, 0.8);
      g.fillCircle(24, 24, 9);
      g.generateTexture('enemy1', 48, 64);
      g.destroy();
    }

    // enemy type 2 – orange diamond
    if (!this.textures.exists('enemy2')) {
      const g = this.add.graphics();
      g.fillStyle(0xff7700);
      g.fillTriangle(29, 0, 0, 32, 58, 32);
      g.fillTriangle(29, 64, 0, 32, 58, 32);
      g.fillStyle(0xffcc00, 0.75);
      g.fillCircle(29, 32, 11);
      g.generateTexture('enemy2', 58, 64);
      g.destroy();
    }

    // enemy type 3 – purple interceptor
    if (!this.textures.exists('enemy3')) {
      const g = this.add.graphics();
      g.fillStyle(0xbb00cc);
      g.fillRect(18, 12, 44, 54);
      g.fillTriangle(40, 0, 18, 16, 62, 16);
      g.fillStyle(0x880099);
      g.fillRect(0, 28, 18, 22);
      g.fillRect(62, 28, 18, 22);
      g.fillStyle(0xff44ff, 0.65);
      g.fillCircle(34, 58, 5);
      g.fillCircle(46, 58, 5);
      g.generateTexture('enemy3', 80, 68);
      g.destroy();
    }

    // boss – large dark-red dreadnought
    if (!this.textures.exists('boss')) {
      const g = this.add.graphics();
      g.fillStyle(0x880000);
      g.fillRect(30, 24, 100, 90);
      g.fillTriangle(80, 0, 30, 28, 130, 28);
      g.fillStyle(0x550000);
      g.fillRect(0, 54, 30, 50);
      g.fillRect(130, 54, 30, 50);
      g.fillStyle(0x2a2a2a);
      g.fillRect(10, 80, 12, 28);
      g.fillRect(138, 80, 12, 28);
      g.fillStyle(0xff3333, 0.9);
      g.fillCircle(80, 72, 24);
      g.fillStyle(0xffcc00, 0.9);
      g.fillCircle(80, 72, 10);
      g.generateTexture('boss', 160, 132);
      g.destroy();
    }

    // player bullet – cyan lance
    if (!this.textures.exists('pbullet')) {
      const g = this.add.graphics();
      g.fillStyle(0x00ffff);
      g.fillRect(3, 0, 6, 24);
      g.fillStyle(0xffffff);
      g.fillRect(5, 3, 2, 16);
      g.generateTexture('pbullet', 12, 24);
      g.destroy();
    }

    // enemy bullet – orange orb
    if (!this.textures.exists('ebullet')) {
      const g = this.add.graphics();
      g.fillStyle(0xff4400);
      g.fillCircle(7, 7, 7);
      g.fillStyle(0xffdd00, 0.8);
      g.fillCircle(7, 7, 3);
      g.generateTexture('ebullet', 14, 14);
      g.destroy();
    }

    // spark particle
    if (!this.textures.exists('spark')) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture('spark', 4, 4);
      g.destroy();
    }

    // three parallax star layers
    const starDefs: [string, number, number, number][] = [
      ['stars-far',  55, 0.25, 1.0],
      ['stars-mid',  38, 0.50, 1.5],
      ['stars-near', 18, 0.82, 2.5],
    ];
    for (const [key, count, baseAlpha, baseSize] of starDefs) {
      if (this.textures.exists(key)) continue;
      const g = this.add.graphics();
      for (let i = 0; i < count; i++) {
        const sx = Math.floor(Math.random() * GAME_WIDTH);
        const sy = Math.floor(Math.random() * GAME_HEIGHT);
        const sa = baseAlpha * (0.65 + Math.random() * 0.35);
        const ss = Math.random() < 0.25 ? baseSize + 1 : baseSize;
        g.fillStyle(0xffffff, sa);
        g.fillRect(sx, sy, ss, ss);
      }
      g.generateTexture(key, GAME_WIDTH, GAME_HEIGHT);
      g.destroy();
    }

    // power-up pickups
    if (!this.textures.exists('pup-rapid')) {
      const g = this.add.graphics();
      g.fillStyle(0x00ff88); g.fillCircle(14, 14, 14);
      // lightning bolt
      g.fillStyle(0x004422);
      g.fillTriangle(17, 4, 10, 16, 15, 16);
      g.fillTriangle(13, 14, 18, 14, 11, 24);
      g.generateTexture('pup-rapid', 28, 28);
      g.destroy();
    }
    if (!this.textures.exists('pup-shield')) {
      const g = this.add.graphics();
      g.fillStyle(0x4488ff); g.fillCircle(14, 14, 14);
      g.fillStyle(0x001144);
      g.fillRoundedRect(8, 5, 12, 16, 3);
      g.fillStyle(0x4488ff);
      g.fillRoundedRect(10, 7, 8, 11, 2);
      g.generateTexture('pup-shield', 28, 28);
      g.destroy();
    }

    // shield aura around player
    if (!this.textures.exists('shield-aura')) {
      const g = this.add.graphics();
      g.lineStyle(3, 0x44aaff, 0.85);
      g.strokeCircle(44, 48, 40);
      g.lineStyle(1.5, 0x88ccff, 0.35);
      g.strokeCircle(44, 48, 47);
      g.generateTexture('shield-aura', 88, 96);
      g.destroy();
    }
  }

  // ─── background ──────────────────────────────────────────────────────────

  private buildBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000010, 0x000010, 0x080028, 0x080028, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.setDepth(0);

    const neb = this.add.graphics();
    neb.fillStyle(0x1a0033, 0.2);  neb.fillEllipse(170, 380, 270, 190);
    neb.fillStyle(0x001133, 0.18); neb.fillEllipse(530, 900, 310, 230);
    neb.fillStyle(0x110022, 0.14); neb.fillEllipse(640, 240, 190, 270);
    neb.setDepth(0);

    this.bgL1 = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'stars-far').setDepth(1);
    this.bgL2 = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'stars-mid').setDepth(1);
    this.bgL3 = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'stars-near').setDepth(1);
  }

  // ─── player ──────────────────────────────────────────────────────────────

  private buildPlayer(): void {
    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 140, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setSize(44, 60);

    this.engineTrail = this.add.particles(0, 0, 'spark', {
      follow: this.player,
      followOffset: { x: 0, y: 36 },
      speed:    { min: 30, max: 90 },
      angle:    { min: 82, max: 98 },
      lifespan: { min: 110, max: 270 },
      scale:    { start: 0.9, end: 0 },
      alpha:    { start: 0.9, end: 0 },
      tint:     [0xff6600, 0xffaa00, 0xffee44],
      quantity:  1,
      frequency: 28,
    }).setDepth(9);
  }

  // ─── groups ──────────────────────────────────────────────────────────────

  private buildGroups(): void {
    this.pBullets = this.physics.add.group({ defaultKey: 'pbullet', maxSize: 40 });
    this.enemies  = this.physics.add.group();
    this.eBullets = this.physics.add.group({ defaultKey: 'ebullet', maxSize: 60 });
    this.powerups = this.physics.add.group({ maxSize: 10 });
  }

  // ─── input ───────────────────────────────────────────────────────────────

  private buildInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown) { this.touchActive = true; this.touchX = p.x; } });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { this.touchActive = true; this.touchX = p.x; });
    this.input.on('pointerup',   ()                         => { this.touchActive = false; });
  }

  // ─── colliders ───────────────────────────────────────────────────────────

  private buildColliders(): void {
    this.physics.add.overlap(this.pBullets, this.enemies,
      (b, e) => this.onBulletHitEnemy(b as Phaser.Physics.Arcade.Sprite, e as Phaser.Physics.Arcade.Sprite));

    this.physics.add.overlap(this.eBullets, this.player,
      (b) => this.onEnemyBulletHitPlayer(b as Phaser.Physics.Arcade.Sprite));

    this.physics.add.overlap(this.enemies, this.player,
      (e) => this.onEnemyRamPlayer(e as Phaser.Physics.Arcade.Sprite));

    this.physics.add.overlap(this.powerups, this.player,
      (pu) => this.onPickup(pu as Phaser.Physics.Arcade.Sprite));
  }

  // ─── enemy fire timer ────────────────────────────────────────────────────

  private buildEnemyFireTimer(): void {
    this.enemyFireEvent = this.time.addEvent({
      delay: 1050,
      loop: true,
      callback: this.fireEnemyBullets,
      callbackScope: this,
    });
  }

  private fireEnemyBullets(): void {
    if (this.gameOver) return;
    const all = this.enemies.getChildren().filter(e => e.active) as Phaser.Physics.Arcade.Sprite[];
    if (!all.length) return;

    const shooters = Phaser.Utils.Array.Shuffle([...all]).slice(0, Math.min(2, all.length));
    for (const enemy of shooters) {
      const bul = this.eBullets.get(enemy.x, enemy.y + 30, 'ebullet') as Phaser.Physics.Arcade.Sprite | null;
      if (!bul) continue;
      bul.setActive(true).setVisible(true).setDepth(9);
      (bul.body as Phaser.Physics.Arcade.Body).reset(enemy.x, enemy.y + 32);
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const mag = Math.hypot(dx, dy) || 1;
      const spd = BULLET_SPEED_ENEMY + this.level * 18;
      bul.setVelocity((dx / mag) * spd, (dy / mag) * spd);
    }
  }

  // ─── wave spawning ───────────────────────────────────────────────────────

  private spawnWave(): void {
    if (this.gameOver) return;
    this.wave++;
    if (this.wave % 5 === 0) {
      this.spawnBoss();
      this.events.emit('waveAnnounce', `⚠ BOSS WAVE ${this.wave} ⚠`);
    } else {
      const rows = Math.min(2 + Math.floor(this.wave / 3), 5);
      const cols = Math.min(4 + Math.floor((this.wave - 1) / 2), 9);
      this.spawnGrid(rows, cols);
      this.events.emit('waveAnnounce', `WAVE  ${this.wave}`);
    }
  }

  private spawnGrid(rows: number, cols: number): void {
    const typeIdx = Math.min(Math.ceil(this.wave / 2), 3);
    const key     = `enemy${typeIdx}`;
    const spacing = Math.min(72, (GAME_WIDTH - 80) / cols);
    const startX  = (GAME_WIDTH - spacing * (cols - 1)) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const e = this.enemies.create(startX + c * spacing, -58 - r * 68, key) as Phaser.Physics.Arcade.Sprite;
        e.setDepth(8);
        e.setData('ed', {
          type: typeIdx,
          health: 1 + Math.floor(this.wave / 4),
          sinOffset:    c * 0.38,
          sinAmplitude: 32 + Math.random() * 28,
          isBoss: false,
        } as EnemyData);
        e.setVelocityY(72 + this.level * 12 + this.wave * 4);
      }
    }
  }

  private spawnBoss(): void {
    const boss = this.enemies.create(GAME_WIDTH / 2, -165, 'boss') as Phaser.Physics.Arcade.Sprite;
    boss.setDepth(8);
    boss.setData('ed', {
      type: 4, isBoss: true,
      health: 24 + this.wave * 3,
      sinOffset: 0, sinAmplitude: 0,
    } as EnemyData);
    boss.setVelocityY(52);

    // red aura ring
    const aura = this.add.graphics().setDepth(7);
    aura.lineStyle(4, 0xff2200, 0.45);
    aura.strokeCircle(0, 0, 76);
    boss.setData('aura', aura);
  }

  // ─── player bullet ───────────────────────────────────────────────────────

  private fireBullet(): void {
    const now = this.time.now;
    if (now - this.lastFired < this.fireRate) return;
    this.lastFired = now;

    const shoot = (ox: number, oy: number, vx: number) => {
      const b = this.pBullets.get(this.player.x + ox, this.player.y + oy, 'pbullet') as Phaser.Physics.Arcade.Sprite | null;
      if (!b) return;
      b.setActive(true).setVisible(true).setDepth(9);
      (b.body as Phaser.Physics.Arcade.Body).reset(this.player.x + ox, this.player.y + oy);
      b.setVelocity(vx, -BULLET_SPEED_UP);
    };

    shoot(0, -38, 0);
    if (this.isRapidFire) {
      shoot(-16, -24, -85);
      shoot(+16, -24, +85);
    }
  }

  // ─── collision handlers ──────────────────────────────────────────────────

  private onBulletHitEnemy(bullet: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite): void {
    bullet.setActive(false).setVisible(false);
    (bullet.body as Phaser.Physics.Arcade.Body).reset(-300, -300);

    const ed = enemy.getData('ed') as EnemyData;
    ed.health--;
    this.tweens.add({ targets: enemy, alpha: 0.12, duration: 55, yoyo: true });

    if (ed.health <= 0) this.killEnemy(enemy, ed);
  }

  private onEnemyBulletHitPlayer(bullet: Phaser.Physics.Arcade.Sprite): void {
    if (this.isInvincible) return;
    bullet.setActive(false).setVisible(false);
    (bullet.body as Phaser.Physics.Arcade.Body).reset(-300, -300);
    if (this.isShielded) { this.breakShield(); return; }
    this.damagePlayer();
  }

  private onEnemyRamPlayer(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (this.isInvincible) return;
    const ed = enemy.getData('ed') as EnemyData;
    this.killEnemy(enemy, ed);
    if (this.isShielded) { this.breakShield(); return; }
    this.damagePlayer();
  }

  private onPickup(pu: Phaser.Physics.Arcade.Sprite): void {
    const puType = pu.getData('puType') as string;
    pu.destroy();
    this.applyPowerup(puType);
  }

  // ─── enemy destruction ───────────────────────────────────────────────────

  private killEnemy(enemy: Phaser.Physics.Arcade.Sprite, ed: EnemyData): void {
    const { x, y } = enemy;
    const aura = enemy.getData('aura') as Phaser.GameObjects.Graphics | undefined;
    if (aura) aura.destroy();
    enemy.destroy();

    this.explode(x, y, ed.isBoss);
    const pts = ed.isBoss ? 1000 : ed.type * 60 + 40;
    this.addScore(pts);
    this.floatScore(x, y, pts);

    if (Math.random() < 0.12) this.dropPowerup(x, y);

    // wave clear?
    if (this.enemies.getChildren().length === 0) {
      this.nextWaveTimer = this.time.delayedCall(1600, () => { if (!this.gameOver) this.spawnWave(); });
    }
  }

  // ─── player damage ───────────────────────────────────────────────────────

  private damagePlayer(): void {
    this.lives--;
    this.events.emit('livesChange', this.lives);
    this.screenFlash(0xff0000, 0.35, 180);
    this.explode(this.player.x, this.player.y, false);

    if (this.lives <= 0) { this.triggerGameOver(); return; }

    this.isInvincible = true;
    this.player.setAlpha(0.5);
    let tick = 0;
    const blink = this.time.addEvent({
      delay: 100, repeat: 21,
      callback: () => { tick++; if (this.player?.active) this.player.setAlpha(tick % 2 === 0 ? 0.5 : 1); },
    });
    this.time.delayedCall(INV_DURATION_MS, () => {
      blink.destroy();
      this.isInvincible = false;
      if (this.player?.active) this.player.setAlpha(1);
    });
  }

  private breakShield(): void {
    this.isShielded = false;
    if (this.shieldSprite) {
      this.tweens.add({
        targets: this.shieldSprite, alpha: 0, duration: 240,
        onComplete: () => { this.shieldSprite?.destroy(); this.shieldSprite = null; },
      });
    }
    this.screenFlash(0x4488ff, 0.4, 200);
  }

  // ─── power-ups ───────────────────────────────────────────────────────────

  private dropPowerup(x: number, y: number): void {
    const key = Math.random() < 0.5 ? 'pup-rapid' : 'pup-shield';
    const pu  = this.powerups.get(x, y, key) as Phaser.Physics.Arcade.Sprite | null;
    if (!pu) return;
    pu.setActive(true).setVisible(true).setDepth(9);
    (pu.body as Phaser.Physics.Arcade.Body).reset(x, y);
    pu.setVelocityY(72);
    pu.setData('puType', key);
    // entry pop
    this.tweens.add({ targets: pu, scaleX: 1.3, scaleY: 1.3, duration: 180, yoyo: true });
    // continuous pulse signals "collectible"
    this.time.delayedCall(250, () => {
      if (pu.active) this.tweens.add({ targets: pu, scaleX: 1.14, scaleY: 1.14, duration: 440, yoyo: true, repeat: -1 });
    });
  }

  private applyPowerup(key: string): void {
    this.screenFlash(0xffffff, 0.42, 250);
    if (key === 'pup-rapid') {
      this.isRapidFire = true;
      this.fireRate = FIRE_RATE_RAPID;
      if (this.rapidTimer) this.rapidTimer.destroy();
      this.rapidTimer = this.time.delayedCall(8000, () => { this.isRapidFire = false; this.fireRate = FIRE_RATE_DEFAULT; });
      this.events.emit('powerupText', '⚡ RAPID FIRE!');
    } else {
      this.isShielded = true;
      if (this.shieldSprite) this.shieldSprite.destroy();
      this.shieldSprite = this.add.sprite(this.player.x, this.player.y, 'shield-aura').setDepth(11).setAlpha(0);
      this.tweens.add({ targets: this.shieldSprite, alpha: 1, duration: 280 });
      this.events.emit('powerupText', '🛡 SHIELD!');
    }
  }

  // ─── score / level ───────────────────────────────────────────────────────

  private addScore(pts: number): void {
    this.score += pts;
    this.events.emit('scoreChange', this.score);
    const newLevel = Math.floor(this.score / 1500) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.events.emit('levelChange', this.level);
    }
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.events.emit('highScoreChange', this.highScore);
      this.saveHighScore();
    }
  }

  // ─── persistence ─────────────────────────────────────────────────────────

  private async loadHighScore(): Promise<void> {
    try {
      const unboxy = await unboxyReady;
      if (unboxy) {
        const val = await unboxy.saves.get<number>('highScore');
        if (typeof val === 'number') { this.highScore = val; this.events.emit('highScoreChange', val); }
      }
    } catch (e) { console.warn('[saves] load failed', e); }
  }

  private async saveHighScore(): Promise<void> {
    try {
      const unboxy = await unboxyReady;
      if (unboxy) await unboxy.saves.set('highScore', this.highScore);
    } catch (e) { console.warn('[saves] save failed', e); }
  }

  // ─── game over ───────────────────────────────────────────────────────────

  private triggerGameOver(): void {
    this.gameOver = true;
    this.enemyFireEvent?.destroy();
    this.nextWaveTimer?.destroy();
    this.engineTrail?.stop();
    this.player.setActive(false).setVisible(false);
    this.explode(this.player.x, this.player.y, true);

    this.time.delayedCall(700, () => {
      this.events.emit('gameOver', this.score, this.highScore);
      this.showGameOverOverlay();
    });
  }

  private showGameOverOverlay(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setDepth(200);
    this.tweens.add({ targets: overlay, fillAlpha: 0.78, duration: 420 });

    const addTxt = (y: number, s: string, size: string, col: string) =>
      this.add.text(GAME_WIDTH / 2, y, s, {
        fontSize: size, color: col, fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(201).setAlpha(0);

    const title   = addTxt(GAME_HEIGHT / 2 - 155, 'GAME  OVER',               '56px', '#ff3333');
    const scoreLn = addTxt(GAME_HEIGHT / 2 -  50, `SCORE   ${this.score}`,    '30px', '#ffffff');
    const bestLn  = addTxt(GAME_HEIGHT / 2 +   8, `BEST    ${this.highScore}`, '24px', '#ffd700');
    const waveLn  = addTxt(GAME_HEIGHT / 2 +  58, `WAVE   ${this.wave}`,      '22px', '#aaaaff');
    const retry   = addTxt(GAME_HEIGHT / 2 + 130, 'TAP TO PLAY AGAIN',        '24px', '#00ff88');

    this.tweens.add({ targets: [title, scoreLn, bestLn, waveLn, retry], alpha: 1, duration: 360, delay: 360 });

    this.time.delayedCall(1100, () => {
      this.input.once('pointerdown',       () => this.restartGame());
      this.input.keyboard!.once('keydown', () => this.restartGame());
    });
  }

  private restartGame(): void {
    this.scene.stop('UIScene');
    this.scene.restart();
  }

  // ─── FX helpers ──────────────────────────────────────────────────────────

  private explode(x: number, y: number, big: boolean): void {
    const n   = big ? 44 : 18;
    const lif = big ? 780 : 470;
    const spd = big ? { min: 85, max: 290 } : { min: 50, max: 165 };

    const burst = this.add.particles(x, y, 'spark', {
      speed: spd, lifespan: lif,
      scale: { start: big ? 2.4 : 1.7, end: 0 },
      alpha: { start: 1, end: 0 },
      tint:  [0xff4400, 0xffaa00, 0xffffff],
      angle: { min: 0, max: 360 },
      emitting: false,
    }).setDepth(15);
    burst.explode(n, x, y);
    this.time.delayedCall(950, () => burst.destroy());

    if (big) {
      const ring = this.add.graphics().setDepth(14);
      ring.lineStyle(4, 0xff8800, 1);
      ring.strokeCircle(x, y, 12);
      this.tweens.add({
        targets: ring, scaleX: 9, scaleY: 9, alpha: 0, duration: 620, ease: 'Power2',
        onComplete: () => ring.destroy(),
      });
    }
  }

  private screenFlash(color: number, alpha: number, duration: number): void {
    const f = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, alpha).setDepth(100);
    this.tweens.add({ targets: f, alpha: 0, duration, onComplete: () => f.destroy() });
  }

  private floatScore(x: number, y: number, pts: number): void {
    const t = this.add.text(x, y, `+${pts}`, {
      fontSize: '20px', color: '#ffff00', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 65, alpha: 0, duration: 860, ease: 'Power2', onComplete: () => t.destroy() });
  }

  // ─── update ──────────────────────────────────────────────────────────────

  update(time: number, _delta: number): void {
    if (this.gameOver) return;

    // parallax stars
    this.bgL1.tilePositionY -= 0.26;
    this.bgL2.tilePositionY -= 0.62;
    this.bgL3.tilePositionY -= 1.38;

    // player movement
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown  || this.wasdKeys.left.isDown)  vx = -PLAYER_SPEED;
    else if (this.cursors.right.isDown || this.wasdKeys.right.isDown) vx = PLAYER_SPEED;
    if (this.cursors.up.isDown    || this.wasdKeys.up.isDown)    vy = -PLAYER_SPEED * 0.65;
    else if (this.cursors.down.isDown  || this.wasdKeys.down.isDown)  vy =  PLAYER_SPEED * 0.65;

    // touch steering (horizontal only)
    if (this.touchActive) {
      const dx = this.touchX - this.player.x;
      if (Math.abs(dx) > 8) vx = Math.sign(dx) * PLAYER_SPEED;
    }

    this.player.setVelocity(vx, vy);
    this.player.setAngle(vx * 0.038);

    // auto-fire (rate-limited by lastFired)
    this.fireBullet();

    // keep shield sprite on player
    if (this.shieldSprite?.active) {
      this.shieldSprite.setPosition(this.player.x, this.player.y);
    }

    // update enemies
    (this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]).forEach(e => {
      if (!e.active) return;
      const ed = e.getData('ed') as EnemyData;

      // sine drift for non-boss enemies type 2+
      if (!ed.isBoss && ed.type >= 2) {
        e.setVelocityX(Math.sin(time * 0.0019 + ed.sinOffset) * ed.sinAmplitude * 2.6);
      }

      // boss: settle and patrol
      if (ed.isBoss) {
        if (e.y > 195) (e.body as Phaser.Physics.Arcade.Body).setVelocityY(0);
        if (e.y >= 195) e.setVelocityX(Math.sin(time * 0.0008) * 165);
        const aura = e.getData('aura') as Phaser.GameObjects.Graphics | undefined;
        if (aura) aura.setPosition(e.x, e.y);
      }

      // cull below screen
      if (e.y > GAME_HEIGHT + 110) {
        const aura = e.getData('aura') as Phaser.GameObjects.Graphics | undefined;
        if (aura) aura.destroy();
        e.destroy();
        if (this.enemies.getChildren().length === 0) {
          this.nextWaveTimer = this.time.delayedCall(1600, () => { if (!this.gameOver) this.spawnWave(); });
        }
      }
    });

    // cull player bullets out of bounds
    (this.pBullets.getChildren() as Phaser.Physics.Arcade.Sprite[]).forEach(b => {
      if (b.active && b.y < -30) {
        b.setActive(false).setVisible(false);
        (b.body as Phaser.Physics.Arcade.Body).reset(-300, -300);
      }
    });
    // cull enemy bullets out of bounds
    (this.eBullets.getChildren() as Phaser.Physics.Arcade.Sprite[]).forEach(b => {
      if (b.active && (b.y > GAME_HEIGHT + 40 || b.x < -40 || b.x > GAME_WIDTH + 40)) {
        b.setActive(false).setVisible(false);
        (b.body as Phaser.Physics.Arcade.Body).reset(-300, -300);
      }
    });
    // cull fallen powerups
    (this.powerups.getChildren() as Phaser.Physics.Arcade.Sprite[]).forEach(p => {
      if (p.active && (p as Phaser.Physics.Arcade.Sprite).y > GAME_HEIGHT + 60) p.destroy();
    });
  }
}
