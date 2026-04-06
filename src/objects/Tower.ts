import Phaser from 'phaser';
import { Enemy } from './Enemy';

export interface TowerConfig {
  type: string;
  name: string;
  frame: number;
  tint: number;
  range: number;
  damage: number;
  fireRate: number; // ms between shots
  cost: number;
  scale: number;
  projectileColor: number;
}

export const TOWER_TYPES: Record<string, TowerConfig> = {
  basic: {
    type: 'basic',
    name: 'Tabby Cat',
    frame: 735,
    tint: 0xf5a623,
    range: 100,
    damage: 1,
    fireRate: 800,
    cost: 15,
    scale: 2.2,
    projectileColor: 0xf5a623,
  },
  sniper: {
    type: 'sniper',
    name: 'Siamese Cat',
    frame: 735,
    tint: 0xe8dcc8,
    range: 180,
    damage: 3,
    fireRate: 1500,
    cost: 30,
    scale: 2.2,
    projectileColor: 0x5599ff,
  },
  splash: {
    type: 'splash',
    name: 'Black Cat',
    frame: 735,
    tint: 0x333344,
    range: 90,
    damage: 2,
    fireRate: 1200,
    cost: 40,
    scale: 2.4,
    projectileColor: 0xaa44ff,
  },
};

export class Tower extends Phaser.GameObjects.Sprite {
  public config: TowerConfig;
  private lastFired = 0;
  private rangeCircle: Phaser.GameObjects.Graphics;
  public gridX: number;
  public gridY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: TowerConfig, gridX: number, gridY: number) {
    super(scene, x, y, 'tiles1bit', config.frame);
    scene.add.existing(this);

    this.config = config;
    this.gridX = gridX;
    this.gridY = gridY;

    this.setTint(config.tint);
    this.setScale(config.scale);
    this.setDepth(2);

    // Range circle (semi-transparent)
    this.rangeCircle = scene.add.graphics();
    this.rangeCircle.lineStyle(1, 0xffffff, 0.15);
    this.rangeCircle.strokeCircle(x, y, config.range);
    this.rangeCircle.setDepth(1);

    // Place tween — bouncy entrance
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scale: config.scale,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Idle bobbing
    scene.tweens.add({
      targets: this,
      y: y - 2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Math.random() * 500,
    });
  }

  tryShoot(enemies: Enemy[], time: number): void {
    if (time - this.lastFired < this.config.fireRate) return;

    // Find closest enemy in range
    let closest: Enemy | null = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active || enemy.reachedEnd) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist <= this.config.range && dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }

    if (!closest) return;
    this.lastFired = time;
    this.fireAt(closest);
  }

  private fireAt(target: Enemy): void {
    // Recoil tween
    this.scene.tweens.add({
      targets: this,
      scaleX: this.config.scale * 1.3,
      scaleY: this.config.scale * 0.8,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Create projectile
    const proj = this.scene.add.circle(this.x, this.y - 8, 4, this.config.projectileColor);
    proj.setDepth(4);

    const targetRef = target;

    this.scene.tweens.add({
      targets: proj,
      x: targetRef.x,
      y: targetRef.y,
      duration: 200,
      ease: 'Linear',
      onComplete: () => {
        // Hit effect
        if (targetRef.active) {
          targetRef.takeDamage(this.config.damage);

          // Splash damage
          if (this.config.type === 'splash') {
            const allEnemies = this.scene.children.list.filter(
              (c) => c instanceof Enemy && c.active && c !== targetRef
            ) as Enemy[];
            for (const e of allEnemies) {
              const d = Phaser.Math.Distance.Between(targetRef.x, targetRef.y, e.x, e.y);
              if (d < 50) {
                e.takeDamage(Math.ceil(this.config.damage * 0.5));
              }
            }
          }
        }

        // Impact particle
        const burst = this.scene.add.circle(proj.x, proj.y, 6, this.config.projectileColor, 0.8);
        burst.setDepth(4);
        this.scene.tweens.add({
          targets: burst,
          scale: 2.5,
          alpha: 0,
          duration: 200,
          onComplete: () => burst.destroy(),
        });

        proj.destroy();
      },
    });
  }

  showRange(show: boolean): void {
    this.rangeCircle.setAlpha(show ? 1 : 0);
  }

  destroyTower(): void {
    this.rangeCircle.destroy();
    this.scene.tweens.killTweensOf(this);
    this.destroy();
  }
}
