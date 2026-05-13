import Phaser from 'phaser';

/**
 * Enemy Bomber — orange angular diamond ship. HP 2, 300 pts.
 * Visual bounds: width 60 x height 50  →  x: -30..30, y: -25..25
 */
export function render(g: Phaser.GameObjects.Graphics, _params: Record<string, unknown>): void {
  // Engine exhaust glow (drawn first, behind body)
  g.fillStyle(0xff6600, 0.4);
  g.fillEllipse(0, 22, 18, 10);
  g.fillStyle(0xffaa00, 0.25);
  g.fillEllipse(0, 26, 10, 8);

  // Left wing cannon housing
  g.fillStyle(0xcc4400);
  g.fillRoundedRect(-30, -2, 14, 9, 2);

  // Right wing cannon housing
  g.fillStyle(0xcc4400);
  g.fillRoundedRect(16, -2, 14, 9, 2);

  // Cannon barrels
  g.fillStyle(0x882200);
  g.fillRect(-27, 5, 8, 7);
  g.fillRect(19, 5, 8, 7);

  // Cannon muzzle glow
  g.fillStyle(0xff8800, 0.8);
  g.fillRect(-26, 10, 6, 3);
  g.fillRect(20, 10, 6, 3);

  // Main diamond body — left half
  g.fillStyle(0xff6600);
  g.fillTriangle(0, -25, -28, 6, 0, 22);

  // Main diamond body — right half
  g.fillStyle(0xff7722);
  g.fillTriangle(0, -25, 28, 6, 0, 22);

  // Body shadow seam
  g.lineStyle(1, 0xcc3300, 0.7);
  g.lineBetween(0, -25, 0, 22);

  // Cockpit recess
  g.fillStyle(0x221100);
  g.fillEllipse(0, -6, 20, 13);

  // Cockpit glow
  g.fillStyle(0xff9900, 0.55);
  g.fillEllipse(0, -7, 12, 8);
  g.fillStyle(0xffdd44, 0.3);
  g.fillEllipse(0, -8, 6, 5);

  // Panel lines
  g.lineStyle(1, 0xffaa33, 0.4);
  g.lineBetween(-22, 2, 0, -20);
  g.lineBetween(22, 2, 0, -20);
}
