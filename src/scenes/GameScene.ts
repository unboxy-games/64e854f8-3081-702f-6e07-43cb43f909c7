import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

type EnemyType = 'bird' | 'bee' | 'bat';
interface EnemyEntry {
  sprite: Phaser.Physics.Arcade.Image;
  type: EnemyType;
  baseY: number;
  phase: number;
  wingTween?: Phaser.Tweens.Tween;
}

const BIRD_GRAVITY   = 1400;
const FLAP_VELOCITY  = -460;
const PIPE_SPEED     = -230;
const PIPE_GAP       = 190;
const PIPE_W         = 72;
const PIPE_H         = 580;   // tall enough to cover either end of screen
const GROUND_H       = 64;
const PIPE_INTERVAL  = 1800;  // ms between pipe pairs

export class GameScene extends Phaser.Scene {
  private bird!: Phaser.Physics.Arcade.Image;
  private pipes!: Phaser.Physics.Arcade.Group;
  private pipeData: { ref: Phaser.Physics.Arcade.Image; scored: boolean }[] = [];

  private score        = 0;
  private lives        = 6;
  private gameStarted  = false;
  private isDead       = false;
  private isPaused     = false;
  private isInvincible = false;

  private scoreText!:    Phaser.GameObjects.Text;
  private hintText!:     Phaser.GameObjects.Text;
  private gameOverBox!:  Phaser.GameObjects.Container;
  private goScoreText!:  Phaser.GameObjects.Text;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private pauseBtn!:     Phaser.GameObjects.Container;
  private livesContainer!: Phaser.GameObjects.Container;

  // Hit area for pause button (top-right corner)
  private readonly PAUSE_BTN_X = GAME_WIDTH - 52;
  private readonly PAUSE_BTN_Y = 52;
  private readonly PAUSE_BTN_R = 24;

  private pipeTimer?: Phaser.Time.TimerEvent;
  private idleTween?: Phaser.Tweens.Tween;

  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyData: EnemyEntry[] = [];
  private enemyTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameScene' });
  }

  // ─────────────────────────────────────────────
  create(): void {
    // Reset state (called again on scene.restart)
    this.score        = 0;
    this.lives        = 6;
    this.gameStarted  = false;
    this.isDead       = false;
    this.isPaused     = false;
    this.isInvincible = false;
    this.pipeData     = [];
    this.enemyData    = [];

    this._drawBackground();
    this._genBirdTexture();
    this._genPipeTexture();
    this._genEnemyTextures();

    // Ground
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - GROUND_H / 2,  GAME_WIDTH, GROUND_H, 0xC8A96E).setDepth(1);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - GROUND_H,       GAME_WIDTH, 16,       0x7EC850).setDepth(1);

    // Bird
    this.bird = this.physics.add.image(220, GAME_HEIGHT / 2, 'bird').setDepth(3);
    const bBody = this.bird.body as Phaser.Physics.Arcade.Body;
    bBody.setGravityY(BIRD_GRAVITY);
    bBody.setAllowGravity(false);
    bBody.setSize(32, 30);

    // Pipes group (dynamic but immovable)
    this.pipes = this.physics.add.group();

    // Overlap: we handle death manually, no physics separation
    this.physics.add.overlap(this.bird, this.pipes, () => this._die(), undefined, this);

    // Enemy group + collision (enemy hit reduces life; pipe/ground kills instantly)
    this.enemies = this.physics.add.group();
    this.physics.add.overlap(this.bird, this.enemies, () => this._hitEnemy(), undefined, this);

    // Score display
    this.scoreText = this.add
      .text(GAME_WIDTH / 2, 55, '0', {
        fontSize: '68px', color: '#ffffff',
        stroke: '#444', strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Lives display (hearts, top-left)
    this._buildLivesDisplay();

    // Hint
    this.hintText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'Tap to start z', {
        fontSize: '26px', color: '#ffffff',
        stroke: '#333', strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Game-over overlay (hidden until death)
    const panel = this.add.rectangle(0, 0, 360, 210, 0x000000, 0.65).setOrigin(0.5);
    const goTitle = this.add.text(0, -68, 'Game Over', {
      fontSize: '42px', color: '#FF5555', stroke: '#222', strokeThickness: 6,
    }).setOrigin(0.5);
    this.goScoreText = this.add.text(0, -8, '', {
      fontSize: '26px', color: '#FFD700', stroke: '#333', strokeThickness: 4,
    }).setOrigin(0.5);
    const restart = this.add.text(0, 50, 'Tap to restart', {
      fontSize: '22px', color: '#ffffff', stroke: '#333', strokeThickness: 4,
    }).setOrigin(0.5);

    this.gameOverBox = this.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [panel, goTitle, this.goScoreText, restart])
      .setDepth(20)
      .setVisible(false);

    // Idle bob while waiting to start
    this.idleTween = this.tweens.add({
      targets: this.bird, y: this.bird.y + 18,
      duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Pause button (top-right) ──────────────────────────────────────
    this.pauseBtn = this._buildPauseButton();

    // ── Pause overlay ─────────────────────────────────────────────────
    const dimRect = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0);
    const pPanel  = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 340, 180, 0x1a1a2e, 0.92).setOrigin(0.5);
    const pTitle  = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 38, 'PAUSED', {
      fontSize: '52px', color: '#FFD700', stroke: '#333', strokeThickness: 7,
    }).setOrigin(0.5);
    const pHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, 'Click  or  P  to  resume', {
      fontSize: '22px', color: '#ffffff', stroke: '#333', strokeThickness: 4,
    }).setOrigin(0.5);
    this.pauseOverlay = this.add
      .container(0, 0, [dimRect, pPanel, pTitle, pHint])
      .setDepth(30)
      .setVisible(false);

    // Input
    this.input.on('pointerdown', this._onInput, this);
    this.input.keyboard!.on('keydown-SPACE', this._onInput, this);
    this.input.keyboard!.on('keydown-P', this._onPKey, this);

    // Keep UIScene score in sync
    this.scene.launch('UIScene');
    this.events.emit('resetScore');
  }

  // ─────────────────────────────────────────────
  update(time: number, _d: number): void {
    if (!this.gameStarted || this.isDead || this.isPaused) return;

    // Ground / ceiling kill
    if (this.bird.y > GAME_HEIGHT - GROUND_H - 16 || this.bird.y < -10) {
      this._die();
      return;
    }

    // Smoothly tilt bird downward when falling
    const vy = (this.bird.body as Phaser.Physics.Arcade.Body).velocity.y;
    if (vy > 60) {
      const target = Phaser.Math.Clamp(vy * 0.075, 0, 82);
      this.bird.angle = Phaser.Math.Linear(this.bird.angle, target, 0.12);
    }

    // Score: when bird passes the centre of a top pipe
    for (const d of this.pipeData) {
      if (!d.scored && d.ref.x < this.bird.x) {
        d.scored = true;
        this.score++;
        this.scoreText.setText(String(this.score));
        this.events.emit('score', 1);
        this.tweens.add({
          targets: this.scoreText,
          scale: 1.35, duration: 80, yoyo: true, ease: 'Power2',
        });
      }
    }

    // Destroy pipes that have scrolled off-screen
    const children = this.pipes.getChildren().slice() as Phaser.Physics.Arcade.Image[];
    for (const p of children) {
      if (p.x < -PIPE_W - 20) {
        this.pipes.remove(p, true, true);
      }
    }
    this.pipeData = this.pipeData.filter(d => d.ref.active);

    // ── Enemy movement & cleanup ───────────────────────────────────────
    const t = time * 0.001; // convert ms → seconds for sine waves
    for (const e of this.enemyData) {
      const body = e.sprite.body as Phaser.Physics.Arcade.Body;
      switch (e.type) {
        case 'bird':
          // Gentle sine bob  (A=28px, ω=2.5 rad/s → vy = A·ω·cos)
          body.setVelocityY(70 * Math.cos(2.5 * t + e.phase));
          break;
        case 'bee':
          // Faster zigzag  (A=55px, ω=4 rad/s)
          body.setVelocityY(220 * Math.cos(4 * t + e.phase));
          break;
        case 'bat': {
          // Home toward bird Y with a spring-like velocity
          const dy = this.bird.y - e.sprite.y;
          body.setVelocityY(Phaser.Math.Clamp(dy * 2.8, -220, 220));
          e.sprite.angle = Phaser.Math.Clamp(dy * 0.18, -28, 28);
          break;
        }
      }
    }
    // Clean up off-screen enemies
    const eChildren = this.enemies.getChildren().slice() as Phaser.Physics.Arcade.Image[];
    for (const s of eChildren) {
      if (s.x < -70) {
        const entry = this.enemyData.find(e => e.sprite === s);
        entry?.wingTween?.stop();
        this.enemies.remove(s, true, true);
      }
    }
    this.enemyData = this.enemyData.filter(e => e.sprite.active);
  }

  // ─────────────────────────────────────────────
  private _onInput(pointer?: Phaser.Input.Pointer): void {
    // Check if the click landed on the pause button
    if (pointer) {
      const dx = pointer.x - this.PAUSE_BTN_X;
      const dy = pointer.y - this.PAUSE_BTN_Y;
      if (Math.sqrt(dx * dx + dy * dy) <= this.PAUSE_BTN_R + 6) {
        if (this.gameStarted && !this.isDead) this._togglePause();
        return;
      }
    }

    // While paused, any click/tap resumes the game
    if (this.isPaused) {
      this._togglePause();
      return;
    }

    if (this.isDead) {
      this.scene.restart();
      return;
    }
    if (!this.gameStarted) this._startGame();
    this._flap();
  }

  private _onPKey(): void {
    if (this.gameStarted && !this.isDead) this._togglePause();
  }

  private _togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      if (this.pipeTimer) this.pipeTimer.paused = true;
      if (this.enemyTimer) this.enemyTimer.paused = true;
      this.enemyData.forEach(e => e.wingTween?.pause());
      this.pauseOverlay.setVisible(true).setAlpha(0);
      this.tweens.add({ targets: this.pauseOverlay, alpha: 1, duration: 180, ease: 'Sine.easeOut' });
      // Animate pause button icon to "play" state
      this._updatePauseBtnIcon(true);
    } else {
      this.physics.resume();
      if (this.pipeTimer) this.pipeTimer.paused = false;
      if (this.enemyTimer) this.enemyTimer.paused = false;
      this.enemyData.forEach(e => e.wingTween?.resume());
      this.tweens.add({
        targets: this.pauseOverlay, alpha: 0, duration: 140, ease: 'Sine.easeIn',
        onComplete: () => this.pauseOverlay.setVisible(false),
      });
      this._updatePauseBtnIcon(false);
    }
  }

  private _flap(): void {
    (this.bird.body as Phaser.Physics.Arcade.Body).setVelocityY(FLAP_VELOCITY);
    this.tweens.killTweensOf(this.bird);
    this.tweens.add({ targets: this.bird, angle: -22, duration: 110, ease: 'Power2' });
  }

  private _startGame(): void {
    this.gameStarted = true;
    this.hintText.setVisible(false);
    this.idleTween?.stop();
    this.tweens.killTweensOf(this.bird);
    this.bird.setAngle(0);
    (this.bird.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);

    // Spawn first pair immediately, then on interval
    this._spawnPipe();
    this.pipeTimer = this.time.addEvent({
      delay: PIPE_INTERVAL,
      callback: this._spawnPipe,
      callbackScope: this,
      loop: true,
    });

    // Enemies: first one after 3 s, then every 2.8 s
    this.enemyTimer = this.time.addEvent({
      delay: 2800,
      callback: this._spawnEnemy,
      callbackScope: this,
      loop: true,
    });
  }

  private _spawnPipe(): void {
    const minGapY = 160;
    const maxGapY = GAME_HEIGHT - GROUND_H - PIPE_GAP - 160;
    const gapTop  = Phaser.Math.Between(minGapY, maxGapY); // y where gap begins
    const spawnX  = GAME_WIDTH + PIPE_W;

    // Top pipe — flip Y so the cap faces downward into the gap
    const topPipe = this.pipes.create(spawnX, gapTop - PIPE_H / 2, 'pipe') as Phaser.Physics.Arcade.Image;
    topPipe.setFlipY(true).setDepth(2);
    const tBody = topPipe.body as Phaser.Physics.Arcade.Body;
    tBody.setVelocityX(PIPE_SPEED);
    tBody.setAllowGravity(false);
    tBody.setImmovable(true);

    // Bottom pipe — cap faces upward into the gap
    const botPipe = this.pipes.create(spawnX, gapTop + PIPE_GAP + PIPE_H / 2, 'pipe') as Phaser.Physics.Arcade.Image;
    botPipe.setDepth(2);
    const bBody = botPipe.body as Phaser.Physics.Arcade.Body;
    bBody.setVelocityX(PIPE_SPEED);
    bBody.setAllowGravity(false);
    bBody.setImmovable(true);

    // Track the top pipe for scoring (bird passes centre)
    this.pipeData.push({ ref: topPipe, scored: false });
  }

  private _die(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.pipeTimer?.remove();
    this.enemyTimer?.remove();
    this.enemyData.forEach(e => e.wingTween?.stop());

    // Freeze the entire physics world — stops pipes, enemies, and the bird
    this.physics.pause();

    // Flash red
    this.tweens.add({
      targets: this.bird, alpha: 0.15,
      duration: 90, yoyo: true, repeat: 3,
      onComplete: () => this.bird.setAlpha(1),
    });

    // Tilt & fall animation
    this.tweens.add({ targets: this.bird, angle: 85, duration: 280, ease: 'Power2' });

    // Show game-over panel after a short pause
    this.time.delayedCall(550, () => {
      this.goScoreText.setText(`Score: ${this.score}`);
      this.gameOverBox.setVisible(true).setScale(0.5).setAlpha(0);
      this.tweens.add({
        targets: this.gameOverBox,
        scale: 1, alpha: 1, duration: 280, ease: 'Back.easeOut',
      });
    });
  }

  // ─────────────────────────────────────────────
  /** Draw a heart at local (ox, oy) on graphics g; filled=red, empty=dark */
  private _drawHeart(g: Phaser.GameObjects.Graphics, ox: number, oy: number, filled: boolean): void {
    const r = 10;
    const color = filled ? 0xFF3355 : 0x443344;
    const alpha = filled ? 1 : 0.45;
    g.fillStyle(color, alpha);
    // Two overlapping circles form the top bumps
    g.fillCircle(ox + r * 0.6,  oy + r * 0.55, r * 0.72);
    g.fillCircle(ox + r * 1.4,  oy + r * 0.55, r * 0.72);
    // Triangle for the bottom point
    g.fillTriangle(
      ox,          oy + r,
      ox + r * 2,  oy + r,
      ox + r,      oy + r * 2.15,
    );
    // Shine on filled hearts
    if (filled) {
      g.fillStyle(0xFF99BB, 0.65);
      g.fillCircle(ox + r * 0.75, oy + r * 0.42, r * 0.3);
    }
  }

  private _buildLivesDisplay(): void {
    const items: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 5; i++) {
      const hg = this.add.graphics();
      this._drawHeart(hg, 0, 0, true);
      items.push(hg);
    }
    // Space hearts 44 px apart; anchor the container at top-left
    this.livesContainer = this.add.container(28, 20, items).setDepth(10);
    items.forEach((hg, i) => { hg.x = i * 44; });
  }

  private _updateLivesDisplay(): void {
    const children = this.livesContainer.getAll() as Phaser.GameObjects.Graphics[];
    children.forEach((hg, i) => {
      hg.clear();
      this._drawHeart(hg, 0, 0, i < this.lives);
    });
  }

  /** Called when the bird touches an enemy — lose one life, not instant death */
  private _hitEnemy(): void {
    if (this.isDead || this.isInvincible) return;

    this.lives = Math.max(0, this.lives - 1);
    this._updateLivesDisplay();

    // Pop-out tween on the heart that just turned empty
    const lostHeart = this.livesContainer.getAt(this.lives) as Phaser.GameObjects.Graphics;
    this.tweens.add({
      targets: lostHeart,
      scaleX: 1.7, scaleY: 1.7,
      duration: 120, yoyo: true, ease: 'Power3',
    });

    if (this.lives <= 0) {
      this._die();
      return;
    }

    // Brief invincibility so one enemy can't drain all hearts at once
    this.isInvincible = true;

    // Rapid blink to signal invincibility
    this.tweens.add({
      targets: this.bird,
      alpha: 0.2,
      duration: 70, yoyo: true, repeat: 7,
      ease: 'Sine.easeInOut',
      onComplete: () => this.bird.setAlpha(1),
    });

    // Subtle camera shake for impact
    this.cameras.main.shake(180, 0.007);

    // End invincibility after 1.4 s
    this.time.delayedCall(1400, () => { this.isInvincible = false; });
  }

  // ─────────────────────────────────────────────
  private _buildPauseButton(): Phaser.GameObjects.Container {
    const bx = this.PAUSE_BTN_X;
    const by = this.PAUSE_BTN_Y;

    // Background circle
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.45);
    bg.fillCircle(0, 0, this.PAUSE_BTN_R);
    bg.lineStyle(2, 0xffffff, 0.55);
    bg.strokeCircle(0, 0, this.PAUSE_BTN_R);

    // Pause icon: two vertical bars
    const icon = this.add.graphics();
    this._drawPauseIcon(icon, false);

    const container = this.add.container(bx, by, [bg, icon]).setDepth(15);

    // Hover glow
    const hitZone = this.add.zone(bx, by, this.PAUSE_BTN_R * 2 + 12, this.PAUSE_BTN_R * 2 + 12)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.15, duration: 100, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 100, ease: 'Sine.easeIn' });
    });

    return container;
  }

  private _drawPauseIcon(g: Phaser.GameObjects.Graphics, showPlay: boolean): void {
    g.clear();
    g.fillStyle(0xffffff, 0.95);
    if (showPlay) {
      // Play triangle
      g.fillTriangle(-6, -10, -6, 10, 10, 0);
    } else {
      // Two bars
      g.fillRect(-8, -9, 5, 18);
      g.fillRect(3, -9, 5, 18);
    }
  }

  private _updatePauseBtnIcon(paused: boolean): void {
    // icon is the second child (index 1) in the pauseBtn container
    const icon = this.pauseBtn.getAt(1) as Phaser.GameObjects.Graphics;
    this._drawPauseIcon(icon, paused);
  }

  // ─────────────────────────────────────────────
  private _drawBackground(): void {
    const sky = this.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x4BA8C8, 0x4BA8C8, 0xBBE9F8, 0xBBE9F8, 1);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Simple static clouds
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xffffff, 0.78);
    ([ [175,82,36],[235,70,50],[298,82,33],
       [640,108,40],[702,93,52],[770,108,37],
       [1040,75,38],[1105,62,50],[1175,75,36] ] as number[][])
      .forEach(([x, y, r]) => g.fillCircle(x, y, r));
  }

  private _genBirdTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const cx = 24, cy = 22;
    g.fillStyle(0xFFD700, 1);  g.fillCircle(cx, cy, 20);         // body
    g.fillStyle(0xFFEC6E, 1);  g.fillCircle(cx + 5, cy + 6, 12); // belly
    g.fillStyle(0xF0A500, 1);  g.fillEllipse(cx - 7, cy + 6, 18, 10); // wing
    g.fillStyle(0xffffff, 1);  g.fillCircle(cx + 10, cy - 5, 7); // eye white
    g.fillStyle(0x111111, 1);  g.fillCircle(cx + 12, cy - 5, 4); // pupil
    g.fillStyle(0xffffff, 1);  g.fillCircle(cx + 14, cy - 7, 2); // shine
    g.fillStyle(0xFF8C00, 1);  g.fillTriangle(cx + 17, cy - 2, cx + 27, cy + 2, cx + 17, cy + 7); // beak
    g.generateTexture('bird', 50, 44);
    g.destroy();
  }

  private _spawnEnemy(): void {
    if (this.isDead) return;
    const types: EnemyType[] = ['bird', 'bee', 'bat'];
    const type = types[Phaser.Math.Between(0, 2)];

    const minY = 90;
    const maxY = GAME_HEIGHT - GROUND_H - 70;
    const spawnY = Phaser.Math.Between(minY, maxY);
    const spawnX = GAME_WIDTH + 60;

    const sprite = this.enemies.create(spawnX, spawnY, `enemy_${type}`) as Phaser.Physics.Arcade.Image;
    sprite.setDepth(2.5);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(false);

    const speeds: Record<EnemyType, number> = { bird: PIPE_SPEED, bee: PIPE_SPEED * 0.72, bat: PIPE_SPEED * 1.15 };
    body.setVelocityX(speeds[type]);

    // Body hit-boxes (smaller than visual for fairness)
    const hitSizes: Record<EnemyType, [number, number]> = { bird: [34, 26], bee: [28, 18], bat: [26, 22] };
    body.setSize(...hitSizes[type]);

    // Enemy birds face left
    if (type === 'bird') sprite.setFlipX(true);

    // Wing-flap tween
    let wingTween: Phaser.Tweens.Tween | undefined;
    if (type === 'bird') {
      wingTween = this.tweens.add({
        targets: sprite, scaleY: 0.72, duration: 190, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else if (type === 'bee') {
      wingTween = this.tweens.add({
        targets: sprite, scaleY: 0.78, duration: 75, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else {
      // Bat: wings fold and spread (scaleX pulse)
      wingTween = this.tweens.add({
        targets: sprite, scaleX: 0.82, duration: 280, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    this.enemyData.push({ sprite, type, baseY: spawnY, phase: Math.random() * Math.PI * 2, wingTween });
  }

  private _genEnemyTextures(): void {
    // ── Enemy Bird (red, same layout as player, will be flipped) ──────
    {
      const g = this.make.graphics({ x: 0, y: 0 });
      const cx = 24, cy = 22;
      g.fillStyle(0xCC2233, 1); g.fillCircle(cx, cy, 20);           // body
      g.fillStyle(0xFF7788, 1); g.fillCircle(cx + 5, cy + 6, 12);   // belly
      g.fillStyle(0x991122, 1); g.fillEllipse(cx - 7, cy + 6, 18, 10); // wing
      g.fillStyle(0xffffff, 1); g.fillCircle(cx + 10, cy - 5, 7);   // eye white
      g.fillStyle(0x111111, 1); g.fillCircle(cx + 12, cy - 5, 4);   // pupil
      g.fillStyle(0xffffff, 1); g.fillCircle(cx + 14, cy - 7, 2);   // shine
      g.fillStyle(0xFF6600, 1);
      g.fillTriangle(cx + 17, cy - 2, cx + 27, cy + 2, cx + 17, cy + 7); // beak
      // Angry eyebrow
      g.lineStyle(3, 0x330000, 1);
      g.beginPath(); g.moveTo(cx + 6, cy - 12); g.lineTo(cx + 16, cy - 10); g.strokePath();
      g.generateTexture('enemy_bird', 50, 44);
      g.destroy();
    }

    // ── Bee ──────────────────────────────────────────────────────────
    {
      const g = this.make.graphics({ x: 0, y: 0 });
      const cx = 26, cy = 17;
      // Wings (behind body)
      g.fillStyle(0xCCEEFF, 0.75); g.fillEllipse(cx - 9, cy - 10, 22, 12); // left wing
      g.fillStyle(0xCCEEFF, 0.75); g.fillEllipse(cx + 9, cy - 10, 22, 12); // right wing
      // Wing outline
      g.lineStyle(1, 0x88AACC, 0.6);
      g.strokeEllipse(cx - 9, cy - 10, 22, 12);
      g.strokeEllipse(cx + 9, cy - 10, 22, 12);
      // Body
      g.fillStyle(0xFFD700, 1); g.fillEllipse(cx, cy + 3, 36, 24);
      // Black stripes
      g.fillStyle(0x111111, 0.85);
      g.fillRect(cx - 14, cy - 4, 6, 16);
      g.fillRect(cx - 4,  cy - 4, 6, 16);
      g.fillRect(cx + 6,  cy - 4, 6, 16);
      // Head
      g.fillStyle(0xFFD700, 1); g.fillCircle(cx - 18, cy + 2, 10);
      // Eye
      g.fillStyle(0x111111, 1); g.fillCircle(cx - 22, cy, 3.5);
      g.fillStyle(0xffffff, 1); g.fillCircle(cx - 23, cy - 1, 1.5);
      // Antennae
      g.lineStyle(2, 0x333300, 1);
      g.beginPath(); g.moveTo(cx - 20, cy - 8); g.lineTo(cx - 26, cy - 18); g.strokePath();
      g.beginPath(); g.moveTo(cx - 14, cy - 8); g.lineTo(cx - 14, cy - 20); g.strokePath();
      g.fillStyle(0x333300, 1); g.fillCircle(cx - 26, cy - 18, 2.5);
      g.fillStyle(0x333300, 1); g.fillCircle(cx - 14, cy - 20, 2.5);
      // Stinger
      g.fillStyle(0x333300, 1);
      g.fillTriangle(cx + 16, cy, cx + 26, cy + 3, cx + 16, cy + 7);
      g.generateTexture('enemy_bee', 52, 34);
      g.destroy();
    }

    // ── Bat ───────────────────────────────────────────────────────────
    {
      const g = this.make.graphics({ x: 0, y: 0 });
      const cx = 30, cy = 19;
      // Left wing (two segments)
      g.fillStyle(0x7B2FBE, 1);
      g.fillTriangle(cx - 2, cy + 2, cx - 28, cy - 16, cx - 22, cy + 12);
      g.fillTriangle(cx - 2, cy + 2, cx - 22, cy + 12, cx - 14, cy + 22);
      // Right wing
      g.fillTriangle(cx + 2, cy + 2, cx + 28, cy - 16, cx + 22, cy + 12);
      g.fillTriangle(cx + 2, cy + 2, cx + 22, cy + 12, cx + 14, cy + 22);
      // Wing membrane lines
      g.lineStyle(1, 0x9B4FDE, 0.55);
      g.beginPath(); g.moveTo(cx - 2, cy + 2); g.lineTo(cx - 28, cy - 16); g.strokePath();
      g.beginPath(); g.moveTo(cx - 2, cy + 2); g.lineTo(cx - 14, cy + 22); g.strokePath();
      g.beginPath(); g.moveTo(cx + 2, cy + 2); g.lineTo(cx + 28, cy - 16); g.strokePath();
      g.beginPath(); g.moveTo(cx + 2, cy + 2); g.lineTo(cx + 14, cy + 22); g.strokePath();
      // Body
      g.fillStyle(0x4A1A7E, 1); g.fillEllipse(cx, cy + 4, 18, 22);
      // Ears
      g.fillStyle(0x7B2FBE, 1);
      g.fillTriangle(cx - 6, cy - 3, cx - 12, cy - 18, cx - 2, cy - 3);
      g.fillTriangle(cx + 6, cy - 3, cx + 12, cy - 18, cx + 2, cy - 3);
      g.fillStyle(0xFF5577, 0.7);
      g.fillTriangle(cx - 5, cy - 4, cx - 10, cy - 14, cx - 2, cy - 4);
      g.fillTriangle(cx + 5, cy - 4, cx + 10, cy - 14, cx + 2, cy - 4);
      // Glowing red eyes
      g.fillStyle(0xFF2222, 1); g.fillCircle(cx - 4, cy + 3, 3);
      g.fillStyle(0xFF2222, 1); g.fillCircle(cx + 4, cy + 3, 3);
      g.fillStyle(0xFF8888, 1); g.fillCircle(cx - 5, cy + 2, 1.5);
      g.fillStyle(0xFF8888, 1); g.fillCircle(cx + 3, cy + 2, 1.5);
      // Fangs
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(cx - 3, cy + 12, cx - 1, cy + 18, cx + 1, cy + 12);
      g.fillTriangle(cx + 3, cy + 12, cx + 5, cy + 18, cx + 7, cy + 12);
      g.generateTexture('enemy_bat', 60, 38);
      g.destroy();
    }
  }

  private _genPipeTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // body
    g.fillStyle(0x4DB050, 1);  g.fillRect(0, 0, PIPE_W, PIPE_H);
    // left highlight
    g.fillStyle(0x70D673, 1);  g.fillRect(0, 0, 11, PIPE_H);
    // right shadow
    g.fillStyle(0x2D8030, 1);  g.fillRect(PIPE_W - 11, 0, 11, PIPE_H);
    // cap at top of texture (becomes bottom when top pipe is flipY'd)
    g.fillStyle(0x3A9040, 1);  g.fillRect(0, 0, PIPE_W, 30);
    g.fillStyle(0x5CC860, 1);  g.fillRect(0, 0, 14, 30);
    g.fillStyle(0x256828, 1);  g.fillRect(PIPE_W - 14, 0, 14, 30);
    g.generateTexture('pipe', PIPE_W, PIPE_H);
    g.destroy();
  }
}
