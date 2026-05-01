import Phaser from 'phaser';

/**
 * Player - the player's spaceship.
 * Uses the uploaded playerlife1_red.png sprite.
 * Supports arrow keys and WASD movement.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed = 260;
  private wasd?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'playerSprite');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(3);
    this.setScale(1.5);
  }

  setWASD(wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  }): void {
    this.wasd = wasd;
  }

  handleMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    this.setVelocity(0);

    const goLeft  = cursors.left.isDown  || (this.wasd?.left.isDown  ?? false);
    const goRight = cursors.right.isDown || (this.wasd?.right.isDown ?? false);
    const goUp    = cursors.up.isDown    || (this.wasd?.up.isDown    ?? false);
    const goDown  = cursors.down.isDown  || (this.wasd?.down.isDown  ?? false);

    if (goLeft)       this.setVelocityX(-this.speed);
    else if (goRight) this.setVelocityX(this.speed);

    if (goUp)         this.setVelocityY(-this.speed);
    else if (goDown)  this.setVelocityY(this.speed);

    // Always face straight up
    this.setAngle(0);
  }
}
