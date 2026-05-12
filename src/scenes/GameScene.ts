import Phaser from 'phaser';
import {
  loadWorldScene,
  getEntityRegistry,
  getManifest,
  applyAssetHitbox,
} from '@unboxy/phaser-sdk';
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
  private lastDirection: 'down' | 'up' | 'left' | 'right' = 'down';
  private wellSprite?: Phaser.GameObjects.Sprite;

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
    const manifest = getManifest(this);

    // Helper: look up the asset record so we can hand it to applyAssetHitbox.
    // The slice-1 spawnEntity stashes the assetId on the GO's data manager;
    // the manifest is loaded by BootScene and accessible via getManifest.
    const assetFor = (sprite: Phaser.GameObjects.Sprite) => {
      const id = sprite.getData('entityAssetId') as string | undefined;
      if (!id || !manifest?.assets) return undefined;
      return manifest.assets.find((a) => a.id === id);
    };

    // Wire up behavior for the player entity
    const playerSprite = registry.byRole('player')[0] as Phaser.GameObjects.Sprite | undefined;
    if (playerSprite) {
      // Enable Arcade physics on the spawned sprite
      this.physics.add.existing(playerSprite);
      const body = playerSprite.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      // Slice 8: apply the vision-derived foot footprint from manifest metadata
      // instead of hardcoding numbers. Falls through silently if no hitbox set.
      const playerAsset = assetFor(playerSprite);
      if (playerAsset) applyAssetHitbox(playerSprite, playerAsset);
      // Seed the HUD bar with the player's starting position
      this.registry.set('playerX', playerSprite.x);
    }

    // Wire the water well — static obstacle + Y-sorted
    const wellSprite = registry.byRole('well')[0] as Phaser.GameObjects.Sprite | undefined;
    if (wellSprite) {
      this.wellSprite = wellSprite;
      this.physics.add.existing(wellSprite, true); // true = static body
      // Slice 8: apply the vision-derived well-base footprint.
      const wellAsset = assetFor(wellSprite);
      if (wellAsset) applyAssetHitbox(wellSprite, wellAsset);
    }

    // Player ↔ well solid collision
    if (playerSprite && wellSprite) {
      this.physics.add.collider(playerSprite, wellSprite);
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

    let vx = 0;
    let vy = 0;
    let dir: 'down' | 'up' | 'left' | 'right' | null = null;

    // Check all four directions — last one evaluated wins when multiple held
    if (this.cursors.left.isDown)  { vx = -this.playerSpeed; dir = 'left'; }
    if (this.cursors.right.isDown) { vx =  this.playerSpeed; dir = 'right'; }
    if (this.cursors.up.isDown)    { vy = -this.playerSpeed; dir = 'up'; }
    if (this.cursors.down.isDown)  { vy =  this.playerSpeed; dir = 'down'; }

    body.setVelocity(vx, vy);

    if (dir !== null) {
      this.lastDirection = dir;
      playerSprite.play(`walk-${dir}`, true);
    } else {
      // Basic spritesheet has no idle anims — freeze on the last walked frame
      if (playerSprite.anims.isPlaying) {
        playerSprite.anims.stop();
      }
    }

    // Update the HUD position bar every frame
    this.registry.set('playerX', playerSprite.x);
  }
}
