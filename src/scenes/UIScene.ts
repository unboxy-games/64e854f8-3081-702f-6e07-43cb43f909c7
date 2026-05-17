import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

/**
 * UIScene — always-on HUD overlay.
 * Reads score and lives from the shared registry so it survives GameScene restarts.
 */
export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // ── HUD bar ──────────────────────────────────────────────────
    const bar = this.add.graphics().setDepth(100);
    bar.fillStyle(0x000000, 0.6);
    bar.fillRect(0, 0, GAME_WIDTH, 62);
    // Bottom edge line
    bar.lineStyle(1, 0x223355, 1);
    bar.strokeLineShape(new Phaser.Geom.Line(0, 62, GAME_WIDTH, 62));

    // Small decorative dots in the corners
    bar.fillStyle(0x00aacc, 0.5);
    bar.fillCircle(10, 10, 3);
    bar.fillCircle(GAME_WIDTH - 10, 10, 3);

    // ── Score text ───────────────────────────────────────────────
    this.scoreText = this.add
      .text(22, 16, 'SCORE  0', {
        fontSize: '26px',
        color: '#00eeff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setDepth(101);

    // ── Lives text ───────────────────────────────────────────────
    this.livesText = this.add
      .text(GAME_WIDTH - 22, 16, this.heartString(3), {
        fontSize: '26px',
        color: '#ff4455',
        fontFamily: 'monospace',
      })
      .setOrigin(1, 0)
      .setDepth(101);

    // ── Registry listeners (survive GameScene restarts) ──────────
    this.registry.events.on(
      'changedata',
      (_parent: unknown, key: string, value: number) => {
        if (key === 'score') {
          this.scoreText.setText(`SCORE  ${value}`);
          // Bounce feedback
          this.tweens.add({
            targets: this.scoreText,
            scaleX: 1.18,
            scaleY: 1.18,
            duration: 65,
            yoyo: true,
          });
        }
        if (key === 'lives') {
          this.livesText.setText(this.heartString(value));
          // Camera shake on hit
          if (value < 3) {
            this.cameras.main.shake(130, 0.006);
          }
        }
      },
      this,
    );
  }

  private heartString(lives: number): string {
    if (lives <= 0) return '  ✕';
    return ('♥ ').repeat(lives).trimEnd();
  }
}
