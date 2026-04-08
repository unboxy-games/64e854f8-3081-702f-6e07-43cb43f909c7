import Phaser from 'phaser';

/**
 * UIScene - runs in parallel over GameScene for HUD elements.
 * Add score displays, health bars, timers, etc. here.
 */
export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '20px',
      color: '#ffffff',
    });

    // Listen for score events from GameScene
    this.scene.get('GameScene').events.on('score', (points: number) => {
      this.score += points;
      this.scoreText.setText(`Score: ${this.score}`);
    });
  }
}
