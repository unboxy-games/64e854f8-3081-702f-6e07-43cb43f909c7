import Phaser from 'phaser';

/**
 * Enemy Grunt — lime-green crab alien. HP 1, 100 pts.
 * Visual bounds: width 50 x height 40  →  x: -25..25, y: -20..20
 */
export function render(g: Phaser.GameObjects.Graphics, _params: Record<string, unknown>): void {
  // Antennae
  g.lineStyle(2, 0x55ff77, 1);
  g.lineBetween(-8, -14, -14, -21);
  g.lineBetween(8, -14, 14, -21);
  // Antenna tips
  g.fillStyle(0xffffff);
  g.fillCircle(-14, -21, 2);
  g.fillCircle(14, -21, 2);

  // Body shell
  g.fillStyle(0x22dd44);
  g.fillRoundedRect(-20, -14, 40, 29, 7);

  // Carapace highlight (top plate)
  g.fillStyle(0x44ff66);
  g.fillRoundedRect(-16, -12, 32, 12, 4);

  // Dark belly stripe
  g.fillStyle(0x119933);
  g.fillRoundedRect(-14, 10, 28, 6, 3);

  // Left claw
  g.fillStyle(0x1fcc3f);
  g.fillTriangle(-21, -2, -25, -7, -25, 4);
  g.fillTriangle(-21, 8, -25, 4, -25, 12);

  // Right claw
  g.fillStyle(0x1fcc3f);
  g.fillTriangle(21, -2, 25, -7, 25, 4);
  g.fillTriangle(21, 8, 25, 4, 25, 12);

  // Eyes (red, glowing)
  g.fillStyle(0xff2222);
  g.fillCircle(-8, -7, 5);
  g.fillCircle(8, -7, 5);

  // Eye pupils (white dot = menacing glare)
  g.fillStyle(0xffffff);
  g.fillCircle(-7, -8, 2);
  g.fillCircle(9, -8, 2);

  // Eye shine
  g.fillStyle(0xffbbbb, 0.5);
  g.fillCircle(-9, -9, 1);
  g.fillCircle(7, -9, 1);

  // Underbelly legs
  g.lineStyle(2, 0x1fcc3f, 0.9);
  g.lineBetween(-12, 15, -16, 20);
  g.lineBetween(0, 15, 0, 21);
  g.lineBetween(12, 15, 16, 20);
}
