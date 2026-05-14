import Phaser from 'phaser';

/**
 * UIScene — runs in parallel over GameScene.
 * HUD (score/lives) is managed by the manifest's game-hud.json via dynamic bindings.
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // HUD managed by manifest's game-hud.json
  }
}
