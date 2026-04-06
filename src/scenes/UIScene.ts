import Phaser from 'phaser';

/**
 * UIScene - HUD overlay running in parallel with GameScene.
 * For Flappy Bird the score is drawn in GameScene itself,
 * so this scene is kept minimal.
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Nothing needed — GameScene owns the score display.
  }
}
