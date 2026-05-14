import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

const MAX_LIVES = 3;

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesLabel!: Phaser.GameObjects.Text;
  private lifeIcons: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // ── Score (top-left) ──
    this.add
      .text(20, 14, 'SCORE', {
        fontSize: '14px',
        color: '#8888aa',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        letterSpacing: 3,
      })
      .setDepth(200);

    this.scoreText = this.add
      .text(20, 32, '00000', {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setDepth(200);

    // ── Lives (top-right) ──
    this.livesLabel = this.add
      .text(GAME_WIDTH - 20, 14, 'LIVES', {
        fontSize: '14px',
        color: '#8888aa',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        letterSpacing: 3,
      })
      .setOrigin(1, 0)
      .setDepth(200);

    // Pre-create life ship icons (hide/show as needed)
    for (let i = 0; i < MAX_LIVES; i++) {
      const icon = this.makeShipIcon();
      icon.setDepth(200);
      this.lifeIcons.push(icon);
    }
    this.positionLifeIcons(MAX_LIVES);

    // ── Divider line ──
    const line = this.add.graphics().setDepth(199);
    line.lineStyle(1, 0x333366, 0.7);
    line.lineBetween(0, 68, GAME_WIDTH, 68);

    // ── Listen to GameScene ──
    const gs = this.scene.get('GameScene');
    gs.events.on('updateScore', (val: number) => {
      this.scoreText.setText(String(val).padStart(5, '0'));
      // Quick scale pop on score change
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 60,
        yoyo: true,
      });
    });
    gs.events.on('updateLives', (val: number) => {
      this.positionLifeIcons(val);
    });
  }

  // ─── Mini ship icon (drawn with graphics) ────────────────────────────────

  private makeShipIcon(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    // Hull
    g.fillStyle(0x2277ee);
    g.fillTriangle(0, -12, -8, 6, 8, 6);
    // Wing tips
    g.fillStyle(0x00ccff);
    g.fillRect(-10, 3, 5, 3);
    g.fillRect(5, 3, 5, 3);
    // Engine glow
    g.fillStyle(0xff7700);
    g.fillRect(-6, 6, 12, 3);
    return g;
  }

  private positionLifeIcons(count: number): void {
    const iconSpacing = 28;
    const rightEdge = GAME_WIDTH - 20;
    for (let i = 0; i < MAX_LIVES; i++) {
      const icon = this.lifeIcons[i];
      if (i < count) {
        icon.setVisible(true);
        icon.setPosition(
          rightEdge - (MAX_LIVES - 1 - i) * iconSpacing,
          48
        );
      } else {
        icon.setVisible(false);
      }
    }
  }
}
