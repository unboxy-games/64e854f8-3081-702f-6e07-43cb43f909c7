import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 1-bit tilesheet — 49 cols × 22 rows, 16×16px, white on transparent
    this.load.spritesheet('tiles1bit', 'http://localhost:3001/assets/kenney/sprites/tiles/1bit-sheet.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    // UI buttons
    this.load.image('btn_blue', 'http://localhost:3001/assets/kenney/sprites/ui/blue/button_rectangle_depth_flat.png');
    this.load.image('btn_green', 'http://localhost:3001/assets/kenney/sprites/ui/green/button_rectangle_depth_flat.png');
    this.load.image('btn_red', 'http://localhost:3001/assets/kenney/sprites/ui/red/button_rectangle_depth_flat.png');

    // Loading bar
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const bar = this.add.graphics();
    const box = this.add.graphics();
    box.fillStyle(0x222222, 0.8);
    box.fillRect(w / 2 - 160, h / 2 - 15, 320, 30);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x8bc34a, 1);
      bar.fillRect(w / 2 - 155, h / 2 - 10, 310 * value, 20);
    });

    this.load.on('complete', () => {
      bar.destroy();
      box.destroy();
    });
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
