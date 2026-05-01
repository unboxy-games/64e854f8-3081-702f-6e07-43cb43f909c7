import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * BootScene - loads assets before the game starts.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Background while loading
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000010);

    // Loading bar
    const barBg = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 320, 20, 0x222244)
      .setOrigin(0.5);
    const bar = this.add
      .rectangle(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2, 0, 14, 0x4499ff)
      .setOrigin(0, 0.5);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 36, 'LOADING…', {
        fontSize: '18px',
        color: '#8899ff',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 320 * value;
    });

    // Player ship sprite
    this.load.image('playerSprite', 'uploaded/playerlife1_red.png');
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
