import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesContainer!: Phaser.GameObjects.Container;
  private score = 0;
  private lives = 3;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.score = 0;
    this.lives = 3;

    // ── Score display ──────────────────────────────────────────────────────────
    this.scoreText = this.add
      .text(GAME_WIDTH - 20, 16, 'Score: 0', {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setDepth(100);

    // ── Lives display (heart icons) ────────────────────────────────────────────
    this.livesContainer = this.add.container(16, 16).setDepth(100);
    this.refreshLivesDisplay();

    // ── Listen to game events ──────────────────────────────────────────────────
    const onScore = (total: number) => {
      this.score = total;
      this.scoreText.setText(`Score: ${total}`);
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 90,
        yoyo: true,
      });
    };

    const onLives = (count: number) => {
      this.lives = count;
      this.refreshLivesDisplay();
    };

    const onGameOver = () => this.showGameOver();
    const onWin = (finalScore: number) => this.showWin(finalScore);

    this.game.events.on('score', onScore, this);
    this.game.events.on('lives', onLives, this);
    this.game.events.on('gameOver', onGameOver, this);
    this.game.events.on('win', onWin, this);

    this.events.once('shutdown', () => {
      this.game.events.off('score', onScore, this);
      this.game.events.off('lives', onLives, this);
      this.game.events.off('gameOver', onGameOver, this);
      this.game.events.off('win', onWin, this);
    });
  }

  // ── Draw heart icons for lives ─────────────────────────────────────────────
  private refreshLivesDisplay(): void {
    this.livesContainer.removeAll(true);
    for (let i = 0; i < 3; i++) {
      const heart = this.add.graphics();
      const x = i * 30;
      const filled = i < this.lives;
      heart.fillStyle(filled ? 0xff3333 : 0x444444, 1);
      // Heart shape: two circles + triangle
      heart.fillCircle(x - 5, 12, 7);
      heart.fillCircle(x + 5, 12, 7);
      heart.fillTriangle(x - 12, 15, x + 12, 15, x, 28);
      if (filled) {
        heart.fillStyle(0xff7777, 0.6);
        heart.fillCircle(x - 4, 10, 3);
      }
      this.livesContainer.add(heart);
    }
  }

  // ── Game Over overlay ──────────────────────────────────────────────────────
  private showGameOver(): void {
    // Darken overlay
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setDepth(990);

    this.tweens.add({ targets: overlay, fillAlpha: 0.72, duration: 500 });

    // Title
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, 'GAME OVER', {
        fontSize: '72px',
        color: '#ff3333',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1000);

    // Score summary
    const summary = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `Score: ${this.score}`, {
        fontSize: '32px',
        color: '#ffdd55',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1000);

    // Restart prompt
    const restartText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 65, 'Press R to Restart', {
        fontSize: '26px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1000);

    this.tweens.add({ targets: [title, summary, restartText], alpha: 1, duration: 500, delay: 300 });

    // Restart handler
    this.input.keyboard?.addKey('R').once('down', () => {
      this.restartGame();
    });
  }

  // ── Win overlay ────────────────────────────────────────────────────────────
  private showWin(finalScore: number): void {
    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x001133, 0)
      .setDepth(990);

    this.tweens.add({ targets: overlay, fillAlpha: 0.65, duration: 500 });

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'YOU WIN! 🎉', {
        fontSize: '68px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1000);

    const scoreDisplay = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 5, `Final Score: ${finalScore}`, {
        fontSize: '36px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1000);

    const restartText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 65, 'Press R to Play Again', {
        fontSize: '26px',
        color: '#aaffaa',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1000);

    this.tweens.add({ targets: [title, scoreDisplay, restartText], alpha: 1, duration: 600, delay: 200 });

    // Celebrate particles
    for (let burst = 0; burst < 5; burst++) {
      this.time.delayedCall(burst * 200, () => {
        this.spawnCelebrationParticles();
      });
    }

    this.input.keyboard?.addKey('R').once('down', () => {
      this.restartGame();
    });
  }

  private spawnCelebrationParticles(): void {
    const colors = [0xffd700, 0xff4444, 0x44ff88, 0x4488ff, 0xff88ff];
    for (let i = 0; i < 12; i++) {
      const p = this.add.graphics().setDepth(1001);
      p.fillStyle(colors[i % colors.length], 1);
      p.fillCircle(0, 0, 4);
      p.setPosition(
        Phaser.Math.Between(100, GAME_WIDTH - 100),
        Phaser.Math.Between(100, GAME_HEIGHT - 200)
      );
      this.tweens.add({
        targets: p,
        y: p.y + Phaser.Math.Between(80, 180),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(600, 1200),
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── Restart ────────────────────────────────────────────────────────────────
  private restartGame(): void {
    this.game.events.removeAllListeners('score');
    this.game.events.removeAllListeners('lives');
    this.game.events.removeAllListeners('gameOver');
    this.game.events.removeAllListeners('win');

    this.scene.stop('UIScene');
    this.scene.get('GameScene').scene.restart();
    this.scene.start('UIScene');
  }
}
