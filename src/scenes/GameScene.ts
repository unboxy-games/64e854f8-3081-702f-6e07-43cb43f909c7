import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

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

  private score       = 0;
  private gameStarted = false;
  private isDead      = false;

  private scoreText!: Phaser.GameObjects.Text;
  private hintText!:  Phaser.GameObjects.Text;
  private gameOverBox!: Phaser.GameObjects.Container;
  private goScoreText!: Phaser.GameObjects.Text;

  private pipeTimer?: Phaser.Time.TimerEvent;
  private idleTween?: Phaser.Tweens.Tween;

  constructor() {
    super({ key: 'GameScene' });
  }

  // ─────────────────────────────────────────────
  create(): void {
    // Reset state (called again on scene.restart)
    this.score       = 0;
    this.gameStarted = false;
    this.isDead      = false;
    this.pipeData    = [];

    this._drawBackground();
    this._genBirdTexture();
    this._genPipeTexture();

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

    // Score display
    this.scoreText = this.add
      .text(GAME_WIDTH / 2, 55, '0', {
        fontSize: '68px', color: '#ffffff',
        stroke: '#444', strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Hint
    this.hintText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'Tap  or  SPACE  to  flap!', {
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

    // Input
    this.input.on('pointerdown', this._onInput, this);
    this.input.keyboard!.on('keydown-SPACE', this._onInput, this);

    // Keep UIScene score in sync
    this.scene.launch('UIScene');
    this.events.emit('resetScore');
  }

  // ─────────────────────────────────────────────
  update(_t: number, _d: number): void {
    if (!this.gameStarted || this.isDead) return;

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
  }

  // ─────────────────────────────────────────────
  private _onInput(): void {
    if (this.isDead) {
      this.scene.restart();
      return;
    }
    if (!this.gameStarted) this._startGame();
    this._flap();
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

    // Stop bird physics
    const bBody = this.bird.body as Phaser.Physics.Arcade.Body;
    bBody.setVelocityX(0);
    bBody.setVelocityY(0);
    bBody.setAllowGravity(false);

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
