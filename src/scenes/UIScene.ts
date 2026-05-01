import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * UIScene - HUD overlay running in parallel with GameScene.
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Controls hint at the bottom of the screen
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 18, 'Arrow Keys / WASD — move   |   Space — shoot', {
        fontSize: '14px',
        color: '#556688',
      })
      .setOrigin(0.5, 1)
      .setDepth(10);
  }
}
