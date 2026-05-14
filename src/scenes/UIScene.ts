import Phaser from 'phaser';

const HEART_FULL  = '♥';
const HEART_EMPTY = '♡';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private score = 0;
  private lives = 3;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const panelH = 44;

    // HUD background strip
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.45);
    bg.fillRect(0, 0, 1280, panelH);
    bg.setDepth(0);

    // Score
    this.scoreText = this.add
      .text(16, 11, 'Score: 0', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setDepth(1);

    // Lives
    this.livesText = this.add
      .text(1264, 11, this.buildLivesString(3), {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ff5566',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0)
      .setDepth(1);

    // Listen for events from GameScene
    const gs = this.scene.get('GameScene');

    gs.events.on('scoreUpdate', (newScore: number) => {
      this.score = newScore;
      this.scoreText.setText(`Score: ${this.score}`);
      // Pop animation on score change
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 80,
        yoyo: true,
        ease: 'Cubic.Out',
      });
    });

    gs.events.on('lives', (newLives: number) => {
      this.lives = newLives;
      this.livesText.setText(this.buildLivesString(newLives));
      // Shake lives text on loss
      this.tweens.add({
        targets: this.livesText,
        x: { from: 1270, to: 1264 },
        ease: 'Bounce.Out',
        duration: 200,
      });
    });

    // Re-init when GameScene restarts
    gs.events.on('shutdown', () => {
      this.score = 0;
      this.lives = 3;
      this.scoreText.setText('Score: 0');
      this.livesText.setText(this.buildLivesString(3));
    });
  }

  private buildLivesString(lives: number): string {
    const max = 5;
    const clamped = Math.max(0, Math.min(max, lives));
    let str = '';
    for (let i = 0; i < max; i++) {
      str += i < clamped ? HEART_FULL : HEART_EMPTY;
      if (i < max - 1) str += ' ';
    }
    return str;
  }
}
