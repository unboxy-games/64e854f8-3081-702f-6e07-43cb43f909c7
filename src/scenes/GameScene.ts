import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

type EnemyType = 'small' | 'big';
type PowerUpType = 'shield' | 'rapid' | 'spread';

interface StarData {
  x: number;
  y: number;
  vy: number;
  size: number;
  alpha: number;
}

export class GameScene extends Phaser.Scene {
  // --- Player ---
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerHP: number = 5;
  private readonly MAX_HP: number = 5;
  private playerInvincible: boolean = false;
  private invincibleTimer: number = 0;

  // --- Groups ---
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private powerUps!: Phaser.Physics.Arcade.Group;

  // --- Shield visual ---
  private shieldGraphics!: Phaser.GameObjects.Graphics;

  // --- Input ---
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;

  // --- Shooting ---
  private lastShotTime: number = 0;
  private spreadActive: boolean = false;
  private spreadTimer: number = 0;
  private rapidActive: boolean = false;
  private rapidTimer: number = 0;
  private shieldActive: boolean = false;
  private shieldTimer: number = 0;

  // --- Game state ---
  private score: number = 0;
  private gameRunning: boolean = false;

  // --- Difficulty ---
  private spawnTimer: number = 0;
  private spawnInterval: number = 1800;
  private difficultyTimer: number = 0;
  private enemySpeedMult: number = 1.0;
  private wave: number = 1;

  // --- Starfield ---
  private stars: StarData[] = [];
  private starGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameRunning = true;
    this.playerHP = this.MAX_HP;
    this.score = 0;
    this.spawnInterval = 1800;
    this.enemySpeedMult = 1.0;
    this.wave = 1;
    this.difficultyTimer = 0;
    this.spawnTimer = 0;
    this.spreadActive = false;
    this.rapidActive = false;
    this.shieldActive = false;
    this.playerInvincible = false;
    this.lastShotTime = 0;

    this.createTextures();
    this.createStarfield();
    this.createBackground();
    this.createPlayer();
    this.createGroups();
    this.setupInput();
    this.setupCollisions();

    // Emit initial state so UIScene can sync
    this.game.events.emit('game:updateHP', this.playerHP, this.MAX_HP);
    this.game.events.emit('game:updateScore', this.score);
    this.game.events.emit('game:updateWave', this.wave);
  }

  // ─── Texture Generation ───────────────────────────────────────────────────

  private createTextures(): void {
    // Player ship — cyan retro arcade triangle
    if (!this.textures.exists('player')) {
      const g = this.add.graphics();
      // Main hull
      g.fillStyle(0x00e5ff);
      g.fillTriangle(32, 2, 4, 60, 60, 60);
      // Wing flares
      g.fillStyle(0x0077aa);
      g.fillRect(0, 44, 20, 14);
      g.fillRect(44, 44, 20, 14);
      // Cockpit dome
      g.fillStyle(0xffffff);
      g.fillCircle(32, 28, 9);
      g.fillStyle(0x003355);
      g.fillCircle(32, 28, 6);
      // Engine glow
      g.fillStyle(0xff8800);
      g.fillRect(20, 57, 24, 5);
      g.fillStyle(0xffff00);
      g.fillRect(25, 60, 14, 3);
      g.generateTexture('player', 64, 64);
      g.destroy();
    }

    // Small enemy — fast red angular fighter
    if (!this.textures.exists('enemy_small')) {
      const g = this.add.graphics();
      g.fillStyle(0xff2200);
      g.fillTriangle(20, 2, 0, 38, 40, 38);
      g.fillStyle(0xaa1100);
      g.fillRect(0, 22, 12, 14);
      g.fillRect(28, 22, 12, 14);
      g.fillStyle(0xff8800);
      g.fillCircle(20, 20, 5);
      g.fillStyle(0x330000);
      g.fillCircle(20, 20, 3);
      g.generateTexture('enemy_small', 40, 40);
      g.destroy();
    }

    // Big enemy — slow orange bruiser
    if (!this.textures.exists('enemy_big')) {
      const g = this.add.graphics();
      g.fillStyle(0xff6600);
      g.fillRoundedRect(4, 4, 64, 64, 10);
      g.fillStyle(0xcc4400);
      g.fillRect(0, 18, 10, 36);
      g.fillRect(62, 18, 10, 36);
      g.fillStyle(0xff2200);
      g.fillCircle(36, 36, 20);
      g.fillStyle(0xff8800);
      g.fillCircle(36, 36, 12);
      g.fillStyle(0xffff00);
      g.fillCircle(36, 36, 5);
      g.generateTexture('enemy_big', 72, 72);
      g.destroy();
    }

    // Bullet — bright yellow bolt
    if (!this.textures.exists('bullet')) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff);
      g.fillRect(1, 0, 4, 14);
      g.fillStyle(0xffff44);
      g.fillRect(2, 1, 2, 11);
      g.generateTexture('bullet', 6, 14);
      g.destroy();
    }

    // Particle — white glow dot
    if (!this.textures.exists('particle')) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff);
      g.fillCircle(4, 4, 4);
      g.generateTexture('particle', 8, 8);
      g.destroy();
    }

    // Power-up: shield (cyan)
    if (!this.textures.exists('pu_shield')) {
      const g = this.add.graphics();
      g.fillStyle(0x001a1a);
      g.fillCircle(16, 16, 14);
      g.lineStyle(2, 0x00ffff, 1);
      g.strokeCircle(16, 16, 14);
      g.fillStyle(0x00ffff);
      // Shield icon
      g.fillTriangle(16, 6, 7, 14, 25, 14);
      g.fillRect(7, 13, 18, 8);
      g.fillTriangle(7, 20, 16, 28, 25, 20);
      g.generateTexture('pu_shield', 32, 32);
      g.destroy();
    }

    // Power-up: rapid fire (orange)
    if (!this.textures.exists('pu_rapid')) {
      const g = this.add.graphics();
      g.fillStyle(0x1a0800);
      g.fillCircle(16, 16, 14);
      g.lineStyle(2, 0xff8800, 1);
      g.strokeCircle(16, 16, 14);
      g.fillStyle(0xff8800);
      // Bolt icon
      g.fillTriangle(20, 4, 11, 17, 17, 17);
      g.fillTriangle(15, 15, 9, 28, 21, 15);
      g.generateTexture('pu_rapid', 32, 32);
      g.destroy();
    }

    // Power-up: spread shot (green)
    if (!this.textures.exists('pu_spread')) {
      const g = this.add.graphics();
      g.fillStyle(0x001a00);
      g.fillCircle(16, 16, 14);
      g.lineStyle(2, 0x00ff44, 1);
      g.strokeCircle(16, 16, 14);
      g.fillStyle(0x00ff44);
      // Three bullet icons
      g.fillRect(14, 5, 4, 10);
      g.fillRect(6, 7, 4, 10);
      g.fillRect(22, 7, 4, 10);
      g.generateTexture('pu_spread', 32, 32);
      g.destroy();
    }
  }

  // ─── Scene Setup ─────────────────────────────────────────────────────────

  private createStarfield(): void {
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, GAME_WIDTH),
        y: Phaser.Math.Between(0, GAME_HEIGHT),
        vy: Phaser.Math.FloatBetween(0.08, 0.7),
        size: Phaser.Math.Between(1, 3),
        alpha: Phaser.Math.FloatBetween(0.15, 1.0),
      });
    }
    this.starGraphics = this.add.graphics().setDepth(0);
    this.renderStars();
  }

  private renderStars(): void {
    this.starGraphics.clear();
    for (const s of this.stars) {
      const b = Math.round(s.alpha * 200 + 55);
      this.starGraphics.fillStyle(Phaser.Display.Color.GetColor(b - 30, b - 20, b), s.alpha);
      this.starGraphics.fillRect(s.x, s.y, s.size, s.size);
    }
  }

  private createBackground(): void {
    // Subtle dark blue gradient at depth 0 (behind stars)
    const bg = this.add.graphics().setDepth(-1);
    bg.fillGradientStyle(0x000011, 0x000011, 0x000622, 0x000622, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player');
    this.player.setDepth(3);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // Shield visual (drawn around player)
    this.shieldGraphics = this.add.graphics().setDepth(2);

    // Idle pulse tween
    this.tweens.add({
      targets: this.player,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createGroups(): void {
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      defaultKey: 'bullet',
      runChildUpdate: false,
    });
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: false,
    });
    this.powerUps = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: false,
    });
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      (b, e) => {
        this.onBulletHitEnemy(
          b as Phaser.Physics.Arcade.Sprite,
          e as Phaser.Physics.Arcade.Sprite
        );
      }
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_p, e) => {
        this.onPlayerHitEnemy(e as Phaser.Physics.Arcade.Sprite);
      }
    );
    this.physics.add.overlap(
      this.player,
      this.powerUps,
      (_p, pu) => {
        this.onPickupPowerUp(pu as Phaser.Physics.Arcade.Sprite);
      }
    );
  }

  // ─── Update Loop ─────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    if (!this.gameRunning) return;

    this.scrollStars(delta);
    this.movePlayer();
    this.autoShoot(time);
    this.steerEnemies();
    this.tickDifficulty(delta);
    this.tickPowerUpTimers(delta);
    this.tickInvincibility(delta);
    this.drawShield();

    // Spawn enemies on interval
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Cull out-of-bounds bullets
    this.bullets.getChildren().forEach((obj) => {
      const b = obj as Phaser.Physics.Arcade.Sprite;
      if (
        b.active &&
        (b.x < -30 || b.x > GAME_WIDTH + 30 || b.y < -30 || b.y > GAME_HEIGHT + 30)
      ) {
        b.destroy();
      }
    });
  }

  // ─── Stars ────────────────────────────────────────────────────────────────

  private scrollStars(delta: number): void {
    for (const s of this.stars) {
      s.y += s.vy * (delta / 16);
      if (s.y > GAME_HEIGHT + 2) {
        s.y = -2;
        s.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    }
    this.renderStars();
  }

  // ─── Player Movement ─────────────────────────────────────────────────────

  private movePlayer(): void {
    const SPEED = 290;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.keyA.isDown) vx = -SPEED;
    else if (this.cursors.right.isDown || this.keyD.isDown) vx = SPEED;

    if (this.cursors.up.isDown || this.keyW.isDown) vy = -SPEED;
    else if (this.cursors.down.isDown || this.keyS.isDown) vy = SPEED;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
  }

  // ─── Shooting ────────────────────────────────────────────────────────────

  private autoShoot(time: number): void {
    const cooldown = this.rapidActive ? 130 : 280;
    if (time - this.lastShotTime < cooldown) return;

    const target = this.nearestEnemy();
    if (!target) return;

    this.lastShotTime = time;
    const angle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y,
      target.x, target.y
    );
    const SPEED = 620;

    if (this.spreadActive) {
      const spread = 0.22;
      for (let i = -1; i <= 1; i++) this.fireBullet(angle + i * spread, SPEED);
    } else {
      this.fireBullet(angle, SPEED);
    }
  }

  private fireBullet(angle: number, speed: number): void {
    const b = this.bullets.create(
      this.player.x, this.player.y, 'bullet'
    ) as Phaser.Physics.Arcade.Sprite;
    if (!b) return;
    b.setDepth(4);
    b.setRotation(angle + Math.PI / 2);
    (b.body as Phaser.Physics.Arcade.Body).setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
  }

  private nearestEnemy(): Phaser.Physics.Arcade.Sprite | null {
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let best = Infinity;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      if (!e.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < best) { best = d; nearest = e; }
    });
    return nearest;
  }

  // ─── Enemy Spawning & Steering ───────────────────────────────────────────

  private spawnEnemy(): void {
    const edge = Phaser.Math.Between(0, 3);
    const pad = 70;
    let x = 0, y = 0;
    switch (edge) {
      case 0: x = Phaser.Math.Between(0, GAME_WIDTH); y = -pad; break;
      case 1: x = GAME_WIDTH + pad;  y = Phaser.Math.Between(0, GAME_HEIGHT); break;
      case 2: x = Phaser.Math.Between(0, GAME_WIDTH); y = GAME_HEIGHT + pad; break;
      default: x = -pad; y = Phaser.Math.Between(0, GAME_HEIGHT); break;
    }

    const isBig = Math.random() < 0.25;
    const type: EnemyType = isBig ? 'big' : 'small';
    const key = isBig ? 'enemy_big' : 'enemy_small';
    const baseSpeed = isBig ? 72 : 158;
    const hp = isBig ? 4 : 1;

    const e = this.enemies.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
    e.setDepth(2);
    e.setData('type', type);
    e.setData('hp', hp);
    e.setData('speed', baseSpeed * this.enemySpeedMult);

    // Idle pulse
    this.tweens.add({
      targets: e,
      scaleX: 1.06, scaleY: 1.06,
      duration: 500 + Math.random() * 400,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private steerEnemies(): void {
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      if (!e.active) return;
      const speed = e.getData('speed') as number;
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        (e.body as Phaser.Physics.Arcade.Body).setVelocity(
          (dx / len) * speed, (dy / len) * speed
        );
        e.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
      }
    });
  }

  // ─── Difficulty Scaling ──────────────────────────────────────────────────

  private tickDifficulty(delta: number): void {
    this.difficultyTimer += delta;
    if (this.difficultyTimer < 20000) return;
    this.difficultyTimer = 0;
    this.wave++;
    this.enemySpeedMult += 0.14;
    this.spawnInterval = Math.max(550, this.spawnInterval - 180);
    // Update existing enemies
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      const baseSpeed = e.getData('type') === 'big' ? 72 : 158;
      e.setData('speed', baseSpeed * this.enemySpeedMult);
    });
    this.game.events.emit('game:updateWave', this.wave);
  }

  // ─── Power-Up Timers ─────────────────────────────────────────────────────

  private tickPowerUpTimers(delta: number): void {
    if (this.rapidActive) {
      this.rapidTimer -= delta;
      if (this.rapidTimer <= 0) {
        this.rapidActive = false;
        this.game.events.emit('game:powerUpExpired', 'rapid');
      }
    }
    if (this.spreadActive) {
      this.spreadTimer -= delta;
      if (this.spreadTimer <= 0) {
        this.spreadActive = false;
        this.game.events.emit('game:powerUpExpired', 'spread');
      }
    }
    if (this.shieldActive) {
      this.shieldTimer -= delta;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this.playerInvincible = false;
        this.game.events.emit('game:powerUpExpired', 'shield');
      }
    }
  }

  private tickInvincibility(delta: number): void {
    if (!this.playerInvincible || this.shieldActive) return;
    this.invincibleTimer -= delta;
    // Flicker
    this.player.setAlpha(Math.floor(this.invincibleTimer / 80) % 2 === 0 ? 0.25 : 1);
    if (this.invincibleTimer <= 0) {
      this.playerInvincible = false;
      this.player.setAlpha(1);
    }
  }

  private drawShield(): void {
    this.shieldGraphics.clear();
    if (!this.shieldActive) return;
    const pct = this.shieldTimer / 4000;
    this.shieldGraphics.lineStyle(2, 0x00ffff, 0.6 + 0.3 * Math.sin(this.time.now * 0.005));
    this.shieldGraphics.strokeCircle(this.player.x, this.player.y, 46);
    this.shieldGraphics.fillStyle(0x00ffff, 0.06 * pct);
    this.shieldGraphics.fillCircle(this.player.x, this.player.y, 46);
  }

  // ─── Collision Handlers ──────────────────────────────────────────────────

  private onBulletHitEnemy(
    bullet: Phaser.Physics.Arcade.Sprite,
    enemy: Phaser.Physics.Arcade.Sprite
  ): void {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();

    const hp = (enemy.getData('hp') as number) - 1;
    if (hp <= 0) {
      const isBig = enemy.getData('type') === 'big';
      this.explode(enemy.x, enemy.y, isBig);
      this.addScore(isBig ? 30 : 10);
      // Power-up drop
      const dropRate = isBig ? 0.45 : 0.14;
      if (Math.random() < dropRate) this.dropPowerUp(enemy.x, enemy.y);
      enemy.destroy();
    } else {
      enemy.setData('hp', hp);
      this.tweens.add({
        targets: enemy, alpha: 0.15,
        duration: 55, yoyo: true, ease: 'Linear',
      });
    }
  }

  private onPlayerHitEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (this.playerInvincible || this.shieldActive) return;
    const dmg = enemy.getData('type') === 'big' ? 2 : 1;
    this.explode(enemy.x, enemy.y, false);
    enemy.destroy();
    this.takeDamage(dmg);
  }

  private onPickupPowerUp(pu: Phaser.Physics.Arcade.Sprite): void {
    if (!pu.active) return;
    const type = pu.getData('type') as PowerUpType;
    // Collect burst
    this.tweens.add({
      targets: pu, scaleX: 2.2, scaleY: 2.2, alpha: 0,
      duration: 180,
      onComplete: () => { if (pu.active) pu.destroy(); },
    });

    switch (type) {
      case 'shield':
        this.shieldActive = true;
        this.playerInvincible = true;
        this.shieldTimer = 4000;
        break;
      case 'rapid':
        this.rapidActive = true;
        this.rapidTimer = 5000;
        break;
      case 'spread':
        this.spreadActive = true;
        this.spreadTimer = 5000;
        break;
    }
    this.game.events.emit('game:powerUpActive', type);
  }

  // ─── Damage & Score ──────────────────────────────────────────────────────

  private takeDamage(amount: number): void {
    this.playerHP = Math.max(0, this.playerHP - amount);
    this.game.events.emit('game:updateHP', this.playerHP, this.MAX_HP);
    this.cameras.main.shake(160, 0.012);
    this.tweens.add({
      targets: this.player, alpha: 0.15,
      duration: 90, yoyo: true, repeat: 2,
    });
    this.playerInvincible = true;
    this.invincibleTimer = 1400;
    if (this.playerHP <= 0) this.doGameOver();
  }

  private addScore(pts: number): void {
    this.score += pts;
    this.game.events.emit('game:updateScore', this.score);
  }

  // ─── Power-up drop ───────────────────────────────────────────────────────

  private dropPowerUp(x: number, y: number): void {
    const r = Math.random();
    let type: PowerUpType;
    let key: string;
    if (r < 0.33) { type = 'shield'; key = 'pu_shield'; }
    else if (r < 0.66) { type = 'rapid'; key = 'pu_rapid'; }
    else { type = 'spread'; key = 'pu_spread'; }

    const pu = this.powerUps.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
    pu.setDepth(1);
    pu.setData('type', type);
    (pu.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    // Float & spin
    this.tweens.add({
      targets: pu, y: pu.y - 12,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: pu, angle: 360,
      duration: 1800, repeat: -1, ease: 'Linear',
    });
    // Auto-expire after 9s
    this.time.delayedCall(9000, () => { if (pu.active) pu.destroy(); });
  }

  // ─── Explosion Particles ─────────────────────────────────────────────────

  private explode(x: number, y: number, large: boolean): void {
    const count = large ? 16 : 8;
    const tints = large
      ? [0xff6600, 0xff2200, 0xffaa00, 0xffffff]
      : [0xff4400, 0xffff00, 0xff8800];

    const emitter = this.add.particles(x, y, 'particle', {
      speed: { min: large ? 90 : 55, max: large ? 210 : 130 },
      scale: { start: large ? 1.3 : 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: large ? 520 : 320,
      tint: tints,
      emitting: false,
    });
    emitter.setDepth(5);
    emitter.explode(count);
    this.time.delayedCall(700, () => { if (emitter) emitter.destroy(); });
  }

  // ─── Game Over ───────────────────────────────────────────────────────────

  private doGameOver(): void {
    this.gameRunning = false;
    this.player.setActive(false).setVisible(false);
    this.shieldGraphics.clear();
    this.enemies.clear(true, true);
    this.bullets.clear(true, true);
    this.powerUps.clear(true, true);
    this.game.events.emit('game:over', this.score);
  }
}
