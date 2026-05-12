import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

/**
 * UIScene — HUD overlay displayed on top of GameScene.
 * Shows score, best score, lives, level, wave announcements, and powerup notices.
 */
export class UIScene extends Phaser.Scene {

  private scoreText!:  Phaser.GameObjects.Text;
  private bestText!:   Phaser.GameObjects.Text;
  private levelText!:  Phaser.GameObjects.Text;
  private livesText!:  Phaser.GameObjects.Text;
  private waveText!:   Phaser.GameObjects.Text;
  private powerupText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'UIScene' }); }

  create(): void {
    const game = this.scene.get('GameScene');

    // ── score (top-left) ────────────────────────────────────────────────────
    this.scoreText = this.add.text(16, 18, 'SCORE\n0', {
      fontSize: '19px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
      lineSpacing: 2,
    }).setDepth(10);

    // ── best (top-right) ────────────────────────────────────────────────────
    this.bestText = this.add.text(GAME_WIDTH - 16, 18, 'BEST\n0', {
      fontSize: '19px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
      align: 'right', lineSpacing: 2,
    }).setOrigin(1, 0).setDepth(10);

    // ── level (top-center) ──────────────────────────────────────────────────
    this.levelText = this.add.text(GAME_WIDTH / 2, 18, 'LVL 1', {
      fontSize: '18px', color: '#aaaaff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(10);

    // ── lives (below score) ─────────────────────────────────────────────────
    this.livesText = this.add.text(16, 86, '▲ ▲ ▲', {
      fontSize: '22px', color: '#00e5ff',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(10);

    // ── wave announce (centre, fades out) ───────────────────────────────────
    this.waveText = this.add.text(GAME_WIDTH / 2, 210, '', {
      fontSize: '34px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setDepth(50);

    // ── powerup notify (below wave text, fades out) ─────────────────────────
    this.powerupText = this.add.text(GAME_WIDTH / 2, 272, '', {
      fontSize: '28px', color: '#00ff88', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(50);

    // ── wire GameScene events ────────────────────────────────────────────────
    game.events.on('scoreChange', (val: number) => {
      this.scoreText.setText(`SCORE\n${val}`);
    }, this);

    game.events.on('highScoreChange', (val: number) => {
      this.bestText.setText(`BEST\n${val}`);
    }, this);

    game.events.on('livesChange', (val: number) => {
      this.livesText.setText('▲ '.repeat(Math.max(0, val)).trim() || '');
    }, this);

    game.events.on('levelChange', (val: number) => {
      this.levelText.setText(`LVL ${val}`);
      this.tweens.add({ targets: this.levelText, scaleX: 1.55, scaleY: 1.55, duration: 140, yoyo: true });
    }, this);

    game.events.on('waveAnnounce', (txt: string) => {
      this.waveText.setText(txt).setAlpha(1).setScale(1.0);
      this.tweens.killTweensOf(this.waveText);
      this.tweens.add({ targets: this.waveText, alpha: 0, delay: 1900, duration: 600 });
    }, this);

    game.events.on('powerupText', (txt: string) => {
      this.powerupText.setText(txt).setAlpha(1);
      this.tweens.killTweensOf(this.powerupText);
      this.tweens.add({ targets: this.powerupText, alpha: 0, delay: 1600, duration: 500 });
    }, this);
  }
}
