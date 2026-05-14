import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private heartsContainer!: Phaser.GameObjects.Container;
  private lives  = 3;
  private score  = 0;
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // ── HUD panel ──────────────────────────────────────────────────────────
    const panel = this.add.graphics().setDepth(99);
    panel.fillStyle(0x000000, 0.55);
    panel.fillRoundedRect(10, 10, 290, 66, 12);

    this.add.text(24, 18, 'SCORE', {
      fontSize: '13px', color: '#ffdd00',
      fontFamily: 'Arial Black, sans-serif',
    }).setDepth(100);

    this.scoreText = this.add.text(24, 38, '000000', {
      fontSize: '24px', color: '#ffffff',
      fontFamily: 'Arial Black, sans-serif',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(100);

    this.add.text(175, 18, 'LIVES', {
      fontSize: '13px', color: '#ffdd00',
      fontFamily: 'Arial Black, sans-serif',
    }).setDepth(100);

    this.heartsContainer = this.add.container(175, 42).setDepth(100);
    this.drawHearts();

    // ── GameScene event hooks ──────────────────────────────────────────────
    const gs = this.scene.get('GameScene');

    gs.events.on('hud-update', (d: { score: number; lives: number }) => {
      this.score = d.score;
      this.lives = d.lives;
      this.scoreText.setText(String(d.score).padStart(6, '0'));
      // Score text pop
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.3, scaleY: 1.3,
        duration: 80, yoyo: true,
      });
      this.drawHearts();
    });

    gs.events.on('game-over', (d: { score: number }) => {
      this.showOverlay(false, d.score);
    });

    gs.events.on('level-complete', (d: { score: number }) => {
      this.showOverlay(true, d.score);
    });

    // ── Restart keys (only when overlay visible) ───────────────────────────
    this.input.keyboard!.on('keydown-SPACE', () => { if (this.overlay) this.restart(); });
    this.input.keyboard!.on('keydown-ENTER', () => { if (this.overlay) this.restart(); });
    this.input.keyboard!.on('keydown-R',     () => { if (this.overlay) this.restart(); });
  }

  // ─────────────────────────────────────── helpers ───────────────────────────

  private drawHearts(): void {
    this.heartsContainer.removeAll(true);
    for (let i = 0; i < 3; i++) {
      const filled = i < this.lives;
      const hg = this.add.graphics();
      const hx = i * 34;
      const hy = -10;
      hg.fillStyle(filled ? 0xff2244 : 0x664444);
      // Heart from two circles + downward triangle
      hg.fillCircle(hx + 5,  hy + 6,  6);
      hg.fillCircle(hx + 17, hy + 6,  6);
      hg.fillTriangle(hx, hy + 8, hx + 22, hy + 8, hx + 11, hy + 22);
      if (filled) {
        // Highlight
        hg.fillStyle(0xff6677);
        hg.fillCircle(hx + 5, hy + 4, 3);
      }
      this.heartsContainer.add(hg);
    }
  }

  private showOverlay(win: boolean, finalScore: number): void {
    if (this.overlay) { this.overlay.destroy(); this.overlay = undefined; }

    const W = 500, H = 300;
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    const bgCol  = win ? 0x003300 : 0x330000;
    const brdCol = win ? 0x44ff44 : 0xff4444;

    const bg = this.add.graphics();
    bg.fillStyle(bgCol, 0.92);
    bg.fillRoundedRect(cx - W / 2, cy - H / 2, W, H, 18);
    bg.lineStyle(3, brdCol, 1);
    bg.strokeRoundedRect(cx - W / 2, cy - H / 2, W, H, 18);

    const titleTxt = win ? '★  YOU WIN!  ★' : 'GAME OVER';
    const titleCol = win ? '#ffdd00' : '#ff4444';
    const titleSz  = win ? '50px'    : '56px';

    const title = this.add.text(cx, cy - 82, titleTxt, {
      fontSize: titleSz, color: titleCol,
      fontFamily: 'Arial Black, sans-serif',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    const sub = this.add.text(cx, cy + 8, `Final Score:  ${String(finalScore).padStart(6, '0')}`, {
      fontSize: '28px', color: '#ffffff',
      fontFamily: 'Arial Black, sans-serif',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    const instr = this.add.text(cx, cy + 82, 'Press  SPACE  or  R  to play again', {
      fontSize: '18px', color: '#aaaaaa',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    this.overlay = this.add.container(0, 0, [bg, title, sub, instr]).setDepth(1000);
    this.overlay.setAlpha(0);
    this.overlay.setScale(0.7);
    this.tweens.add({
      targets: this.overlay,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 350,
      ease: 'Back.Out',
    });
  }

  private restart(): void {
    if (this.overlay) { this.overlay.destroy(); this.overlay = undefined; }
    this.lives = 3;
    this.score = 0;
    this.scoreText.setText('000000');
    this.drawHearts();
    this.scene.get('GameScene').scene.restart({ sceneId: 'main' });
  }
}
