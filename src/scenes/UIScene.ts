import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class UIScene extends Phaser.Scene {
  private hpDisplay!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private powerUpBadge!: Phaser.GameObjects.Text;
  private gameOverGroup!: Phaser.GameObjects.Group;
  private finalScoreText!: Phaser.GameObjects.Text;
  private gameOverVisible: boolean = false;

  private pauseButton!: Phaser.GameObjects.Text;
  private pauseOverlayGroup!: Phaser.GameObjects.Group;
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.gameOverVisible = false;
    this.isPaused = false;

    // ── Score (top-left) ─────────────────────────────────────────────────
    this.scoreText = this.add.text(22, 18, 'SCORE: 0', {
      fontSize: '24px', fontFamily: 'monospace',
      color: '#00e5ff',
      stroke: '#000033', strokeThickness: 4,
    }).setDepth(10);

    // ── Wave (below score) ───────────────────────────────────────────────
    this.waveText = this.add.text(22, 52, 'WAVE  1', {
      fontSize: '18px', fontFamily: 'monospace',
      color: '#ffaa00',
      stroke: '#000033', strokeThickness: 3,
    }).setDepth(10);

    // ── HP (top-right) ───────────────────────────────────────────────────
    this.hpDisplay = this.add.text(GAME_WIDTH - 18, 18, '♥♥♥♥♥♥', {
      fontSize: '26px', fontFamily: 'monospace',
      color: '#ff4455',
      stroke: '#000033', strokeThickness: 3,
    }).setDepth(10).setOrigin(1, 0);

    // ── Active power-up badge (top-center) ───────────────────────────────
    this.powerUpBadge = this.add.text(GAME_WIDTH / 2, 18, '', {
      fontSize: '18px', fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(10).setOrigin(0.5, 0).setAlpha(0);

    // ── Controls hint (bottom-center) ────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, 'WASD / ARROWS to move   •   Mouse to aim & auto-shoot   •   P = Pause', {
      fontSize: '13px', fontFamily: 'monospace',
      color: '#334466',
    }).setDepth(10).setOrigin(0.5, 1);

    this.buildGameOverScreen();
    this.buildPauseScreen();
    this.createPauseButton();
    this.registerEvents();
  }

  // ─── Game over screen ────────────────────────────────────────────────────

  private buildGameOverScreen(): void {
    this.gameOverGroup = this.add.group();

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000011, 0.78
    ).setDepth(18);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, 'GAME OVER', {
      fontSize: '70px', fontFamily: 'monospace',
      color: '#ff2200',
      stroke: '#000000', strokeThickness: 7,
    }).setDepth(20).setOrigin(0.5);

    this.finalScoreText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'SCORE: 0', {
      fontSize: '34px', fontFamily: 'monospace',
      color: '#00e5ff',
    }).setDepth(20).setOrigin(0.5);

    const restart = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 55, '[ PRESS  R  TO  RESTART ]', {
      fontSize: '26px', fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(20).setOrigin(0.5);

    // Blink the restart prompt
    this.tweens.add({
      targets: restart, alpha: 0,
      duration: 550, yoyo: true, repeat: -1,
    });

    this.gameOverGroup.addMultiple([overlay, title, this.finalScoreText, restart]);
    this.gameOverGroup.setVisible(false);

    // Restart key
    this.input.keyboard!.on('keydown-R', () => {
      if (!this.gameOverVisible) return;
      this.gameOverGroup.setVisible(false);
      this.gameOverVisible = false;
      // Reset pause state in case player had paused before dying
      this.isPaused = false;
      this.pauseOverlayGroup.setVisible(false);
      this.pauseButton.setText('⏸  PAUSE').setColor('#556677');
      // Reset HUD to initial values immediately
      this.refreshHP(6, 6);
      this.refreshScore(0);
      this.refreshWave(1);
      this.powerUpBadge.setAlpha(0).setText('');
      // Restart GameScene (UIScene stays alive)
      this.scene.get('GameScene').scene.restart();
    });
  }

  // ─── Event wiring (global game events, survive GameScene restart) ────────

  private registerEvents(): void {
    this.game.events.on('game:updateHP',      this.refreshHP,       this);
    this.game.events.on('game:updateScore',   this.refreshScore,    this);
    this.game.events.on('game:updateWave',    this.refreshWave,     this);
    this.game.events.on('game:powerUpActive', this.showPowerUp,     this);
    this.game.events.on('game:powerUpExpired',this.hidePowerUp,     this);
    this.game.events.on('game:over',          this.showGameOver,    this);
    this.game.events.on('game:paused',        this.showPause,       this);
    this.game.events.on('game:resumed',       this.hidePause,       this);
  }

  shutdown(): void {
    this.game.events.off('game:updateHP',       this.refreshHP,       this);
    this.game.events.off('game:updateScore',    this.refreshScore,    this);
    this.game.events.off('game:updateWave',     this.refreshWave,     this);
    this.game.events.off('game:powerUpActive',  this.showPowerUp,     this);
    this.game.events.off('game:powerUpExpired', this.hidePowerUp,     this);
    this.game.events.off('game:over',           this.showGameOver,    this);
    this.game.events.off('game:paused',         this.showPause,       this);
    this.game.events.off('game:resumed',        this.hidePause,       this);
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  private refreshHP(hp: number, maxHP: number): void {
    const filled = '♥'.repeat(hp);
    const empty  = '♡'.repeat(maxHP - hp);
    this.hpDisplay.setText(filled + empty);
    this.tweens.add({
      targets: this.hpDisplay,
      scaleX: 1.35, scaleY: 1.35,
      duration: 90, yoyo: true,
    });
  }

  private refreshScore(score: number): void {
    this.scoreText.setText(`SCORE: ${score}`);
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.18, scaleY: 1.18,
      duration: 80, yoyo: true,
    });
  }

  private refreshWave(wave: number): void {
    this.waveText.setText(`WAVE  ${wave}`);
    this.tweens.add({
      targets: this.waveText,
      scaleX: 1.5, scaleY: 1.5,
      duration: 280, yoyo: true,
    });

    if (wave === 1) return; // no notification on first wave (startup)

    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `— WAVE ${wave} —`, {
      fontSize: '52px', fontFamily: 'monospace',
      color: '#ffaa00',
      stroke: '#000000', strokeThickness: 6,
    }).setDepth(15).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1, scaleX: 1.15, scaleY: 1.15,
      duration: 350, yoyo: true, hold: 700,
      onComplete: () => banner.destroy(),
    });
  }

  private showPowerUp(type: string): void {
    const labels: Record<string, string> = {
      shield: '[ SHIELD ACTIVE ]',
      rapid:  '[ RAPID FIRE ]',
      spread: '[ SPREAD SHOT ]',
    };
    const colors: Record<string, string> = {
      shield: '#00ffff',
      rapid:  '#ff8800',
      spread: '#00ff44',
    };
    this.powerUpBadge
      .setText(labels[type] ?? '')
      .setColor(colors[type] ?? '#ffffff')
      .setAlpha(1);
    this.tweens.add({
      targets: this.powerUpBadge,
      scaleX: 1.25, scaleY: 1.25,
      duration: 200, yoyo: true,
    });
  }

  private hidePowerUp(_type: string): void {
    this.tweens.add({
      targets: this.powerUpBadge,
      alpha: 0, duration: 300,
    });
  }

  // ─── Pause screen ────────────────────────────────────────────────────────

  private buildPauseScreen(): void {
    this.pauseOverlayGroup = this.add.group();

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000022, 0.72
    ).setDepth(16);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'PAUSED', {
      fontSize: '72px', fontFamily: 'monospace',
      color: '#00e5ff',
      stroke: '#000000', strokeThickness: 8,
    }).setDepth(17).setOrigin(0.5);

    // Subtle glow pulse on title
    this.tweens.add({
      targets: title,
      alpha: 0.6,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '[ PRESS  P  TO  RESUME ]', {
      fontSize: '24px', fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(17).setOrigin(0.5);

    this.tweens.add({
      targets: hint, alpha: 0,
      duration: 600, yoyo: true, repeat: -1,
    });

    this.pauseOverlayGroup.addMultiple([overlay, title, hint]);
    this.pauseOverlayGroup.setVisible(false);
  }

  private createPauseButton(): void {
    this.pauseButton = this.add.text(
      GAME_WIDTH - 18, GAME_HEIGHT - 40,
      '⏸  PAUSE', {
        fontSize: '14px', fontFamily: 'monospace',
        color: '#556677',
        stroke: '#000033', strokeThickness: 2,
        backgroundColor: '#00000066',
        padding: { x: 8, y: 4 },
      }
    ).setDepth(10).setOrigin(1, 1).setInteractive({ useHandCursor: true });

    this.pauseButton.on('pointerover', () => {
      if (!this.gameOverVisible) this.pauseButton.setColor('#aaccee');
    });
    this.pauseButton.on('pointerout', () => {
      this.pauseButton.setColor(this.isPaused ? '#ffff88' : '#556677');
    });
    this.pauseButton.on('pointerdown', () => {
      if (!this.gameOverVisible) this.game.events.emit('ui:togglePause');
    });
  }

  private showPause(): void {
    this.isPaused = true;
    this.pauseOverlayGroup.setVisible(true);
    this.pauseButton.setText('▶  RESUME').setColor('#ffff88');
    // Pop-in tween
    this.pauseOverlayGroup.getChildren().forEach((c) => {
      const go = c as Phaser.GameObjects.GameObject & { setAlpha: (a: number) => void };
      go.setAlpha(0);
    });
    this.tweens.add({
      targets: this.pauseOverlayGroup.getChildren(),
      alpha: 1, duration: 250,
    });
  }

  private hidePause(): void {
    this.isPaused = false;
    this.tweens.add({
      targets: this.pauseOverlayGroup.getChildren(),
      alpha: 0, duration: 180,
      onComplete: () => this.pauseOverlayGroup.setVisible(false),
    });
    this.pauseButton.setText('⏸  PAUSE').setColor('#556677');
  }

  private showGameOver(score: number): void {
    this.finalScoreText.setText(`SCORE: ${score}`);
    this.gameOverGroup.setVisible(true);
    this.gameOverVisible = true;
    // Fade in
    this.gameOverGroup.getChildren().forEach((c) => {
      const go = c as Phaser.GameObjects.GameObject & { setAlpha: (a: number) => void };
      go.setAlpha(0);
    });
    this.tweens.add({
      targets: this.gameOverGroup.getChildren(),
      alpha: 1, duration: 500,
    });
  }
}
