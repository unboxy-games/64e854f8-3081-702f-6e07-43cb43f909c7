import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Player } from '../objects/Player';

/**
 * GameScene - the main gameplay scene.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.setDepth(0);

    // Player in the centre
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.player.setDepth(2);

    // Gentle idle bob tween
    this.tweens.add({
      targets: this.player,
      y: GAME_HEIGHT / 2 - 6,
      duration: 900,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.cursors = this.input.keyboard!.createCursorKeys();

    // Start the UI overlay scene in parallel
    this.scene.launch('UIScene');
  }

  update(_time: number, _delta: number): void {
    this.player.handleMovement(this.cursors);
  }
}
