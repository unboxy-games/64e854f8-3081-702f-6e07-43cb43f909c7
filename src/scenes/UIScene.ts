import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveLabel!: Phaser.GameObjects.Text;
  private score = 0;
  private lives = 3;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.score = 0;
    this.lives = 3;

    // ── Score (top-left) ──────────────────────────────────────────
    this.scoreText = this.add.text(20, 16, 'SCORE  0', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#00eeff',
      stroke: '#003355',
      strokeThickness: 3,
    }).setDepth(100);

    // ── Lives (top-right) ─────────────────────────────────────────
    this.livesText = this.add.text(GAME_WIDTH - 20, 16, this.livesStr(3), {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ff4466',
      stroke: '#330011',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(100);

    // ── Controls hint (bottom-left) ───────────────────────────────
    this.waveLabel = this.add.text(20, 690, 'W/S or ↑↓ to move   SPACE to shoot', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#556688',
    }).setDepth(100);

    // ── Events from GameScene ─────────────────────────────────────
    const gs = this.scene.get('GameScene');

    gs.events.on('hudScore', (s: number) => {
      this.score = s;
      this.scoreText.setText(`SCORE  ${s}`);
      this.tweens.add({
        targets: this.scoreText, scaleX: 1.18, scaleY: 1.18,
        duration: 80, yoyo: true, ease: 'Power1',
      });
    });

    gs.events.on('hudLives', (l: number) => {
      this.lives = l;
      this.livesText.setText(this.livesStr(l));
      this.tweens.add({
        targets: this.livesText, scaleX: 1.2, scaleY: 1.2,
        duration: 80, yoyo: true, ease: 'Power1',
      });
    });

    gs.events.on('scorePopup', (label: string) => {
      this.showPopup(label);
    });

    gs.events.on('hudReset', () => {
      this.score = 0;
      this.lives = 3;
      this.scoreText.setText('SCORE  0');
      this.livesText.setText(this.livesStr(3));
    });

    gs.events.on('gameOver', (_s: number) => {
      // Controls hint fades out on game over
      this.tweens.add({ targets: this.waveLabel, alpha: 0, duration: 400 });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private livesStr(n: number): string {
    return `LIVES  ${'♥'.repeat(Math.max(0, n))}`;
  }

  private showPopup(label: string): void {
    const x = Phaser.Math.Between(200, GAME_WIDTH - 200);
    const y = Phaser.Math.Between(80, 200);
    const t = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffdd44',
      stroke: '#553300',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScale(0.6);

    this.tweens.add({
      targets: t,
      alpha: 1, scaleX: 1, scaleY: 1,
      y: y - 30,
      duration: 280,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: t, alpha: 0, y: y - 70,
          duration: 500, delay: 300,
          onComplete: () => t.destroy(),
        });
      },
    });
  }
}
