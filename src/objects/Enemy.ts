import Phaser from 'phaser';

export interface EnemyConfig {
  type: string;
  frame: number;
  tint: number;
  hp: number;
  speed: number;
  reward: number;
  scale: number;
}

export const ENEMY_TYPES: Record<string, Omit<EnemyConfig, 'type'>> = {
  mouse: { frame: 833, tint: 0xaaaaaa, hp: 3, speed: 60, reward: 5, scale: 2.0 },
  rat: { frame: 833, tint: 0x8b6914, hp: 6, speed: 45, reward: 10, scale: 2.4 },
  bigrat: { frame: 833, tint: 0x553311, hp: 15, speed: 30, reward: 20, scale: 3.0 },
  raccoon: { frame: 882, tint: 0x666677, hp: 25, speed: 25, reward: 30, scale: 3.2 },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public hp: number;
  public maxHp: number;
  public speed: number;
  public reward: number;
  public enemyType: string;
  private waypoints: Phaser.Math.Vector2[] = [];
  private currentWP = 0;
  private hpBar!: Phaser.GameObjects.Graphics;
  public reachedEnd = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y, 'tiles1bit', config.frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.enemyType = config.type;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.speed = config.speed;
    this.reward = config.reward;

    this.setTint(config.tint);
    this.setScale(config.scale);
    this.setDepth(2);

    // HP bar
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(3);

    // Idle bobbing tween
    scene.tweens.add({
      targets: this,
      y: y - 3,
      duration: 300 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  setPath(waypoints: Phaser.Math.Vector2[]): void {
    this.waypoints = waypoints;
    this.currentWP = 0;
    this.moveToNext();
  }

  private moveToNext(): void {
    if (this.currentWP >= this.waypoints.length) {
      this.reachedEnd = true;
      this.scene.events.emit('enemyReachedEnd', this);
      this.die(false);
      return;
    }

    const target = this.waypoints[this.currentWP];
    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const duration = (dist / this.speed) * 1000;

    this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this.currentWP++;
        this.moveToNext();
      },
    });

    // Flip sprite based on direction
    if (target.x < this.x) {
      this.setFlipX(true);
    } else if (target.x > this.x) {
      this.setFlipX(false);
    }
  }

  takeDamage(amount: number): void {
    this.hp -= amount;

    // Flash white on hit
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) {
        const cfg = ENEMY_TYPES[this.enemyType];
        if (cfg) this.setTint(cfg.tint);
      }
    });

    if (this.hp <= 0) {
      this.die(true);
    }
  }

  die(killed: boolean): void {
    if (killed) {
      this.scene.events.emit('enemyKilled', this);

      // Death particles
      const particles = this.scene.add.particles(this.x, this.y, 'tiles1bit', {
        frame: 833,
        tint: ENEMY_TYPES[this.enemyType]?.tint ?? 0xaaaaaa,
        speed: { min: 30, max: 80 },
        scale: { start: 1.0, end: 0 },
        lifespan: 400,
        quantity: 6,
        emitting: false,
      });
      particles.setDepth(4);
      particles.explode(6);
      this.scene.time.delayedCall(500, () => particles.destroy());

      // Screen shake
      this.scene.cameras.main.shake(100, 0.005);
    }

    // Stop all tweens on this enemy
    this.scene.tweens.killTweensOf(this);

    this.hpBar.destroy();
    this.destroy();
  }

  update(): void {
    if (!this.active) return;
    // Draw HP bar
    this.hpBar.clear();
    const barW = 24;
    const barH = 4;
    const bx = this.x - barW / 2;
    const by = this.y - 20;
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    this.hpBar.fillStyle(0xff0000, 1);
    this.hpBar.fillRect(bx, by, barW, barH);
    this.hpBar.fillStyle(0x00ff00, 1);
    this.hpBar.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
  }
}
