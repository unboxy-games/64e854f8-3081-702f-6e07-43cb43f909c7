import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Player } from '../objects/Player';

/**
 * GameScene - Space shooter main scene.
 * Currently: player movement with parallax starfield and thruster effect.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private stars: { obj: Phaser.GameObjects.Rectangle; speed: number }[] = [];
  private thrusterEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.createBackground();
    this.createStarLayers();
    this.createPlayer();
    this.createThruster();
    this.setupInput();
    this.scene.launch('UIScene');
  }

  // ─── Background ────────────────────────────────────────────────────────────

  private createBackground(): void {
    // Deep space gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000010, 0x000010, 0x06001e, 0x06001e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.setDepth(0);

    // Subtle nebula blobs
    const nebula = this.add.graphics();
    nebula.setDepth(0);
    nebula.fillStyle(0x1a004a, 0.22);
    nebula.fillEllipse(260, 170, 480, 230);
    nebula.fillStyle(0x001840, 0.18);
    nebula.fillEllipse(980, 430, 540, 270);
    nebula.fillStyle(0x200015, 0.16);
    nebula.fillEllipse(640, 610, 400, 200);
  }

  // ─── Parallax star layers ───────────────────────────────────────────────────

  private createStarLayers(): void {
    const configs = [
      { count: 90,  w: 1,   h: 1,   alpha: 0.35, speed: 0.2  },  // far
      { count: 55,  w: 1.5, h: 2,   alpha: 0.60, speed: 0.70 },  // mid
      { count: 22,  w: 2,   h: 3.5, alpha: 0.95, speed: 1.8  },  // near
    ];

    for (const cfg of configs) {
      for (let i = 0; i < cfg.count; i++) {
        const star = this.add
          .rectangle(
            Phaser.Math.Between(0, GAME_WIDTH),
            Phaser.Math.Between(0, GAME_HEIGHT),
            cfg.w,
            cfg.h,
            0xffffff,
          )
          .setAlpha(cfg.alpha)
          .setDepth(1);
        this.stars.push({ obj: star, speed: cfg.speed });
      }
    }
  }

  // ─── Player ─────────────────────────────────────────────────────────────────

  private createPlayer(): void {
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT - 110);
  }

  // ─── Thruster particles ──────────────────────────────────────────────────────

  private createThruster(): void {
    // Generate a tiny soft-glow circle texture for the particles
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff);
    g.fillCircle(5, 5, 5);
    g.generateTexture('thrusterParticle', 10, 10);
    g.destroy();

    this.thrusterEmitter = this.add.particles(
      this.player.x,
      this.player.y + 20,
      'thrusterParticle',
      {
        speed:    { min: 45, max: 90 },
        angle:    { min: 82, max: 98 },   // mostly downward
        scale:    { start: 0.9, end: 0 },
        alpha:    { start: 0.85, end: 0 },
        lifespan: 260,
        quantity: 3,
        tint:     [0xffcc00, 0xff8800, 0xff4400],
        blendMode: 'ADD',
      },
    );
    this.thrusterEmitter.setDepth(2);
  }

  // ─── Input ──────────────────────────────────────────────────────────────────

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.player.setWASD(this.wasd);
  }

  // ─── Update loop ─────────────────────────────────────────────────────────────

  update(_time: number, _delta: number): void {
    // Scroll stars downward (ship flying up through space)
    for (const star of this.stars) {
      star.obj.y += star.speed;
      if (star.obj.y > GAME_HEIGHT + 4) {
        star.obj.y = -4;
        star.obj.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    }

    // Player movement
    this.player.handleMovement(this.cursors);

    // Keep thruster anchored just behind the ship's exhaust
    this.thrusterEmitter.setPosition(this.player.x, this.player.y + 20);
  }
}
