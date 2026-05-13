import Phaser from 'phaser';

/**
 * Player plasma bolt — cyan, travels upward.
 * Visual bounds: width 6 x height 20  →  x: -3..3, y: -10..10
 */
export function render(g: Phaser.GameObjects.Graphics, _params: Record<string, unknown>): void {
  // Outer glow
  g.fillStyle(0x006699, 0.35);
  g.fillRect(-4, -11, 8, 22);

  // Main bolt body
  g.fillStyle(0x00ddff);
  g.fillRect(-2, -10, 4, 20);

  // Bright inner core
  g.fillStyle(0xaaeeff, 0.9);
  g.fillRect(-1, -10, 2, 14);

  // Leading tip — hottest point
  g.fillStyle(0xffffff);
  g.fillRect(-1, -10, 2, 4);
}
