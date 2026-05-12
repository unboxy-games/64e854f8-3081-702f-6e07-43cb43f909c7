import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry } from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// ─── Tuning constants ────────────────────────────────────────────────────────
const PLAYER_SPEED = 340;
const BULLET_SPEED = 700;
const ENEMY_BULLET_SPEED = 290;
const SHOOT_COOLDOWN = 210; // ms between player shots
const ROWS = 3;
const COLS = 6;
const H_SPACING = 90;
const V_SPACING = 72;
const BASE_ENEMY_SPEED = 55;
const ENEMY_DROP = 26; // px dropped each time enemies reverse
// ─────────────────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private sceneId!: string;

  // Player
  private playerGO!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.Physics.Arcade.Body;

  // Groups (runtime-spawned entities — not in scene data)
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // HUD
  private scoreTxt!: Phaser.GameObjects.Text;
  private livesTxt!: Phaser.GameObjects.Text;
  private waveTxt!: Phaser.GameObjects.Text;

  // State (reset in init so scene.restart() works cleanly)
  private score = 0;
  private lives = 3;
  private wave = 1;
  private enemyDir = 1;
  private enemySpeed = BASE_ENEMY_SPEED;
  private lastShot = 0;
  private lastEnemyShot = 0;
  private enemyShotInterval = 2400;
  private gameOver = false;
  private invincible = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.gameOver = false;
    this.invincible = false;
    this.lastShot = 0;
    this.lastEnemyShot = 0;
    this.enemyShotInterval = 2400;
    this.enemyDir = 1;
    this.enemySpeed = BASE_ENEMY_SPEED;
  }

  async create(): Promise<void> {
    await loadWorldScene(this, this.sceneId);

    this.drawBackground();

    // ── Player ───────────────────────────────────────────────────────────────
    const registry = getEntityRegistry(this)!;
    this.playerGO = registry.byRole('player')[0] as Phaser.GameObjects.Graphics;
    this.physics.add.existing(this.playerGO);
    this.playerBody = this.playerGO.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setSize(54, 68);
    this.playerBody.setOffset(-27, -42);
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.allowGravity = false;

    // ── Physics groups ───────────────────────────────────────────────────────
    this.bullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

    // ── Input ────────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── HUD ──────────────────────────────────────────────────────────────────
    this.setupHUD();

    // ── First wave ───────────────────────────────────────────────────────────
    this.spawnWave();

    // ── Collisions ───────────────────────────────────────────────────────────
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      (b, e) => this.onBulletHitEnemy(
        b as Phaser.GameObjects.Graphics,
        e as Phaser.GameObjects.Graphics,
      ),
    );
    this.physics.add.overlap(
      this.enemyBullets,
      this.playerGO,
      (eb) => this.onEnemyBulletHitPlayer(eb as Phaser.GameObjects.Graphics),
    );
    this.physics.add.overlap(
      this.enemies,
      this.playerGO,
      () => { if (!this.invincible) this.loseLife(); },
    );
  }

  // ── Background ─────────────────────────────────────────────────────────────
  private drawBackground(): void {
    const bg = this.add.graphics().setDepth(-1);
    bg.fillGradientStyle(0x050510, 0x050510, 0x090920, 0x090920, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Nebula blobs
    const neb = this.add.graphics().setDepth(0);
    neb.fillStyle(0x12003a, 0.45);
    neb.fillEllipse(160, 380, 300, 220);
    neb.fillStyle(0x00122a, 0.38);
    neb.fillEllipse(580, 920, 320, 240);
    neb.fillStyle(0x001f0a, 0.3);
    neb.fillEllipse(360, 660, 260, 180);

    // Seeded starfield — deterministic
    const stars = this.add.graphics().setDepth(0);
    const rng = new Phaser.Math.RandomDataGenerator(['shooter-stars-v1']);
    for (let i = 0; i < 180; i++) {
      const x = rng.between(0, GAME_WIDTH);
      const y = rng.between(0, GAME_HEIGHT);
      const r = rng.realInRange(0.4, 1.9);
      const a = rng.realInRange(0.25, 1.0);
      stars.fillStyle(0xffffff, a);
      stars.fillCircle(x, y, r);
    }

    // Subtle horizon glow
    const glow = this.add.graphics().setDepth(0);
    glow.fillStyle(0x003366, 0.18);
    glow.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  private setupHUD(): void {
    const mono = { fontFamily: '"Courier New", Courier, monospace', fontSize: '22px' };
    this.scoreTxt = this.add
      .text(16, 20, 'SCORE: 0', { ...mono, color: '#00eeff' })
      .setDepth(10);
    this.waveTxt = this.add
      .text(GAME_WIDTH / 2, 20, 'WAVE 1', { ...mono, color: '#ffff55' })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.livesTxt = this.add
      .text(GAME_WIDTH - 16, 20, '♥ ♥ ♥', { ...mono, color: '#ff4466', fontSize: '20px' })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  // ── Wave spawning ──────────────────────────────────────────────────────────
  private spawnWave(): void {
    this.enemies.clear(true, true);

    const startX = GAME_WIDTH / 2 - ((COLS - 1) * H_SPACING) / 2;
    const startY = 220;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = startX + col * H_SPACING;
        const y = startY + row * V_SPACING;

        const g = this.add.graphics().setDepth(2);
        g.setPosition(x, y);
        this.drawEnemy(g, row);
        (g as any).hp = row === 2 ? 2 : 1;
        (g as any).row = row;

        this.physics.add.existing(g);
        const body = g.body as Phaser.Physics.Arcade.Body;
        body.setSize(46, 30);
        body.setOffset(-23, -15);
        body.allowGravity = false;

        this.enemies.add(g);
      }
    }

    this.enemyDir = 1;
    this.enemySpeed = BASE_ENEMY_SPEED + (this.wave - 1) * 18;
    this.enemyShotInterval = Math.max(650, 2400 - (this.wave - 1) * 280);
    this.setEnemyVelocityX(this.enemySpeed);
    this.waveTxt.setText(`WAVE ${this.wave}`);

    // Wave banner — one-shot entry/exit tween
    const banner = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `— WAVE ${this.wave} —`, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '44px',
        color: '#ffff00',
      })
      .setOrigin(0.5)
      .setDepth(500)
      .setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 280,
      hold: 700,
      yoyo: true,
      onComplete: () => banner.destroy(),
    });
  }

  // ── Enemy visuals ──────────────────────────────────────────────────────────
  private drawEnemy(g: Phaser.GameObjects.Graphics, row: number): void {
    g.clear();

    if (row === 0) {
      // Top row: green insect
      g.fillStyle(0x00ee77, 1);
      g.fillEllipse(0, 2, 38, 24);
      g.fillStyle(0x009944, 1);
      g.fillEllipse(-22, 2, 20, 11);
      g.fillEllipse(22, 2, 20, 11);
      g.fillStyle(0xff2244, 1);
      g.fillCircle(-7, -4, 5);
      g.fillCircle(7, -4, 5);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(-5, -6, 2);
      g.fillCircle(9, -6, 2);
      g.lineStyle(2, 0x00ee77, 1);
      g.lineBetween(-6, -10, -11, -19);
      g.lineBetween(6, -10, 11, -19);
    } else if (row === 1) {
      // Middle row: blue crab
      g.fillStyle(0x3377ff, 1);
      g.fillEllipse(0, 4, 42, 26);
      g.fillStyle(0x1155cc, 1);
      g.fillTriangle(-26, -2, -20, 10, -14, -2);
      g.fillTriangle(26, -2, 20, 10, 14, -2);
      g.fillStyle(0xeeeeff, 1);
      g.fillCircle(-8, -2, 6);
      g.fillCircle(8, -2, 6);
      g.fillStyle(0x000055, 1);
      g.fillCircle(-8, -2, 3);
      g.fillCircle(8, -2, 3);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(-6, -4, 1.5);
      g.fillCircle(10, -4, 1.5);
    } else {
      // Bottom row: red armoured — 2 HP
      g.fillStyle(0xdd2200, 1);
      g.fillRect(-22, -8, 44, 24);
      g.fillStyle(0xaa1100, 1);
      g.fillRect(-16, -18, 32, 12);
      g.fillStyle(0xff6600, 1);
      g.fillRect(-12, -18, 7, 12);
      g.fillRect(5, -18, 7, 12);
      g.fillStyle(0xff4400, 0.85);
      g.fillCircle(-8, 4, 5);
      g.fillCircle(8, 4, 5);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(-8, 4, 2);
      g.fillCircle(8, 4, 2);
    }
  }

  // ── Enemy velocity helper ──────────────────────────────────────────────────
  private setEnemyVelocityX(vx: number): void {
    this.enemies.getChildren().forEach((e) => {
      ((e as Phaser.GameObjects.Graphics).body as Phaser.Physics.Arcade.Body).setVelocityX(vx);
    });
  }

  // ── Player shooting ────────────────────────────────────────────────────────
  private fireBullet(): void {
    const now = this.time.now;
    if (now - this.lastShot < SHOOT_COOLDOWN) return;
    this.lastShot = now;

    const bx = this.playerGO.x;
    const by = this.playerGO.y - 44;

    const b = this.add.graphics().setDepth(3);
    b.fillStyle(0x00ffff, 1);
    b.fillRect(-3, -16, 6, 32);
    b.fillStyle(0xffffff, 0.85);
    b.fillRect(-1, -16, 2, 32);
    b.setPosition(bx, by);

    this.physics.add.existing(b);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setSize(6, 32);
    body.setOffset(-3, -16);
    body.setVelocityY(-BULLET_SPEED);
    body.allowGravity = false;

    this.bullets.add(b);

    // Muzzle flash — one-shot
    const fl = this.add.graphics().setDepth(5);
    fl.fillStyle(0x00ffff, 0.9);
    fl.fillCircle(bx, by - 6, 10);
    fl.fillStyle(0xffffff, 0.7);
    fl.fillCircle(bx, by - 6, 5);
    this.tweens.add({
      targets: fl,
      alpha: 0,
      scaleX: 2.8,
      scaleY: 2.8,
      duration: 85,
      onComplete: () => fl.destroy(),
    });
  }

  // ── Enemy shooting ─────────────────────────────────────────────────────────
  private fireEnemyBullet(): void {
    const now = this.time.now;
    if (now - this.lastEnemyShot < this.enemyShotInterval) return;
    this.lastEnemyShot = now;

    const list = this.enemies.getChildren();
    if (list.length === 0) return;

    const shooter = list[Phaser.Math.Between(0, list.length - 1)] as Phaser.GameObjects.Graphics;

    const b = this.add.graphics().setDepth(3);
    b.fillStyle(0xff5500, 1);
    b.fillRect(-4, -14, 8, 28);
    b.fillStyle(0xffaa00, 0.8);
    b.fillCircle(0, -14, 5);
    b.setPosition(shooter.x, shooter.y + 22);

    this.physics.add.existing(b);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setSize(8, 28);
    body.setOffset(-4, -14);
    body.setVelocityY(ENEMY_BULLET_SPEED);
    body.allowGravity = false;

    this.enemyBullets.add(b);
  }

  // ── Collision handlers ─────────────────────────────────────────────────────
  private onBulletHitEnemy(
    bullet: Phaser.GameObjects.Graphics,
    enemy: Phaser.GameObjects.Graphics,
  ): void {
    bullet.destroy();

    const hp = ((enemy as any).hp as number) - 1;
    (enemy as any).hp = hp;

    if (hp <= 0) {
      this.spawnExplosion(enemy.x, enemy.y);
      const pts = (enemy as any).row === 2 ? 30 : (enemy as any).row === 1 ? 20 : 10;
      enemy.destroy();
      this.addScore(pts);

      if (this.enemies.getLength() === 0) {
        this.wave++;
        this.time.delayedCall(1400, () => { if (!this.gameOver) this.spawnWave(); });
      }
    } else {
      // One-shot damage flash
      this.tweens.add({ targets: enemy, alpha: 0.1, duration: 55, yoyo: true });
    }
  }

  private onEnemyBulletHitPlayer(bullet: Phaser.GameObjects.Graphics): void {
    bullet.destroy();
    if (!this.invincible) this.loseLife();
  }

  // ── Life loss ──────────────────────────────────────────────────────────────
  private loseLife(): void {
    if (this.invincible || this.gameOver) return;
    this.invincible = true;
    this.lives = Math.max(0, this.lives - 1);
    this.updateLivesHUD();

    this.spawnExplosion(this.playerGO.x, this.playerGO.y);

    // One-shot blink (not a looping tween)
    this.tweens.add({
      targets: this.playerGO,
      alpha: 0,
      duration: 90,
      repeat: 8,
      yoyo: true,
      onComplete: () => {
        this.playerGO.setAlpha(1);
        this.time.delayedCall(350, () => { this.invincible = false; });
      },
    });

    if (this.lives <= 0) {
      this.time.delayedCall(700, () => this.triggerGameOver());
    }
  }

  // ── Game over ──────────────────────────────────────────────────────────────
  private triggerGameOver(): void {
    this.gameOver = true;
    this.enemies.getChildren().forEach((e) => {
      ((e as Phaser.GameObjects.Graphics).body as Phaser.Physics.Arcade.Body).setVelocity(0);
    });

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.74).setDepth(1000);

    const goTxt = this.add
      .text(cx, cy - 100, 'GAME OVER', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '58px',
        color: '#ff2200',
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setScale(0.5);

    // Entry pop — one-shot
    this.tweens.add({ targets: goTxt, scaleX: 1, scaleY: 1, duration: 320, ease: 'Back.Out' });

    this.add
      .text(cx, cy, `SCORE: ${this.score}`, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(1001);

    this.add
      .text(cx, cy + 64, `WAVE REACHED: ${this.wave}`, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '22px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setDepth(1001);

    const restartTxt = this.add
      .text(cx, cy + 160, 'TAP TO PLAY AGAIN', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '22px',
        color: '#ffff00',
      })
      .setOrigin(0.5)
      .setDepth(1001);

    // Looping blink — intentional UI affordance (tap prompt)
    this.tweens.add({ targets: restartTxt, alpha: 0.2, duration: 650, yoyo: true, repeat: -1 });

    this.time.delayedCall(1100, () => {
      this.input.once('pointerdown', () => {
        this.scene.restart({ sceneId: this.sceneId });
      });
    });
  }

  // ── Score ──────────────────────────────────────────────────────────────────
  private addScore(pts: number): void {
    this.score += pts;
    this.scoreTxt.setText(`SCORE: ${this.score}`);
    // One-shot pop on change
    this.tweens.add({ targets: this.scoreTxt, scaleX: 1.22, scaleY: 1.22, duration: 70, yoyo: true });
  }

  private updateLivesHUD(): void {
    const hearts = '♥ '.repeat(Math.max(0, this.lives)).trimEnd();
    this.livesTxt.setText(hearts || '');
  }

  // ── Explosion VFX ──────────────────────────────────────────────────────────
  private spawnExplosion(x: number, y: number): void {
    const palette = [0xff6600, 0xffcc00, 0xff2200, 0xffaa00, 0xffffff];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.DegToRad((360 / count) * i + Phaser.Math.Between(-10, 10));
      const dist = Phaser.Math.Between(10, 52);
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      const color = palette[i % palette.length];

      const dot = this.add.graphics().setDepth(4);
      dot.fillStyle(color, 1);
      dot.fillCircle(0, 0, Phaser.Math.Between(3, 7));
      dot.setPosition(px, py);

      this.tweens.add({
        targets: dot,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: Phaser.Math.Between(220, 440),
        onComplete: () => dot.destroy(),
      });
    }

    // Central white flash — one-shot
    const flash = this.add.graphics().setDepth(5);
    flash.fillStyle(0xffffff, 1);
    flash.fillCircle(x, y, 18);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 3.5,
      scaleY: 3.5,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  // ── Main update loop ───────────────────────────────────────────────────────
  update(_time: number, _delta: number): void {
    if (this.gameOver) return;

    // Player movement
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;

    if (left) this.playerBody.setVelocityX(-PLAYER_SPEED);
    else if (right) this.playerBody.setVelocityX(PLAYER_SPEED);
    else this.playerBody.setVelocityX(0);

    if (this.cursors.up.isDown || this.keySpace.isDown) this.fireBullet();

    // Cull off-screen bullets
    [...this.bullets.getChildren()].forEach((b) => {
      if ((b as Phaser.GameObjects.Graphics).y < -40) b.destroy();
    });
    [...this.enemyBullets.getChildren()].forEach((b) => {
      if ((b as Phaser.GameObjects.Graphics).y > GAME_HEIGHT + 40) b.destroy();
    });

    // Enemy edge reversal
    let hitEdge = false;
    this.enemies.getChildren().forEach((e) => {
      const gx = (e as Phaser.GameObjects.Graphics).x;
      if (
        (gx >= GAME_WIDTH - 52 && this.enemyDir > 0) ||
        (gx <= 52 && this.enemyDir < 0)
      ) {
        hitEdge = true;
      }
    });

    if (hitEdge) {
      this.enemyDir *= -1;
      this.enemies.getChildren().forEach((e) => {
        const g = e as Phaser.GameObjects.Graphics;
        g.y += ENEMY_DROP;
        (g.body as Phaser.Physics.Arcade.Body).reset(g.x, g.y);
      });
      this.setEnemyVelocityX(this.enemySpeed * this.enemyDir);

      // Breach check
      this.enemies.getChildren().forEach((e) => {
        if ((e as Phaser.GameObjects.Graphics).y > GAME_HEIGHT - 220) {
          this.triggerGameOver();
        }
      });
    }

    // Enemy return fire
    this.fireEnemyBullet();
  }
}
