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
      const body = playerSprite.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
    }

    // Spin tween for entity e-mowxj6d4-z3ct
    const spinSprite = registry.byId('e-mowxj6d4-z3ct') as Phaser.GameObjects.Sprite | undefined;
    if (spinSprite) {
      this.tweens.add({
        targets: spinSprite,
        angle: 360,
        duration: 1200,
        ease: 'Linear',
        repeat: -1,
      });
    }

    // Push current time to the HUD every second
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      this.registry.set('currentTime', `${hh}:${mm}:${ss}`);
    };
    updateTime(); // set immediately so HUD shows on frame 1
    this.time.addEvent({ delay: 1000, callback: updateTime, loop: true });

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
