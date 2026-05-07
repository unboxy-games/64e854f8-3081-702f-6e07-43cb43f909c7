import Phaser from 'phaser';
import { loadWorldScene, getEntityRegistry } from '@unboxy/phaser-sdk';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * GameScene - the main gameplay scene.
 * Layout (player position, etc.) is loaded from scene data.
 * Behavior (physics, input, tweens) lives here.
 */
export class GameScene extends Phaser.Scene {
  private sceneId!: string;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerSpeed = 200;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string }): void {
    this.sceneId = data.sceneId;
  }

  async create(): Promise<void> {
    // Set up input before async work so update() is safe from frame 1
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Gradient background (code-rendered — not a scene-data entity)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.setDepth(0);

    // Load all entities from scene data
    const { registry } = await loadWorldScene(this, this.sceneId);

    // Wire up behavior for the player entity
    const playerSprite = registry.byRole('player')[0] as Phaser.GameObjects.Sprite | undefined;
    if (playerSprite) {
      // Enable Arcade physics on the spawned sprite
      this.physics.add.existing(playerSprite);
      (playerSprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

      // Gentle idle bob tween (one-shot entry variant kept from original design)
      this.tweens.add({
        targets: playerSprite,
        y: playerSprite.y - 6,
        duration: 900,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    // Start the UI overlay scene in parallel
    this.scene.launch('UIScene');
  }

  update(_time: number, _delta: number): void {
    if (!this.cursors) return;

    const registry = getEntityRegistry(this);
    if (!registry) return;

    const playerSprite = registry.byRole('player')[0] as Phaser.GameObjects.Sprite | undefined;
    if (!playerSprite || !playerSprite.body) return;

    const body = playerSprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    if (this.cursors.left.isDown) {
      body.setVelocityX(-this.playerSpeed);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(this.playerSpeed);
    }

    if (this.cursors.up.isDown) {
      body.setVelocityY(-this.playerSpeed);
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(this.playerSpeed);
    }
  }
}
