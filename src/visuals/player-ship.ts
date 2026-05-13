import Phaser from 'phaser';

/**
 * Player ship — pointing upward, centered at (0, 0).
 * Visual bounds: width 64 x height 56  →  x: -32..32, y: -28..28
 */
export function render(g: Phaser.GameObjects.Graphics, _params: Record<string, unknown>): void {
  // Shadow / glow ring
  g.fillStyle(0x0044aa, 0.22);
  g.fillEllipse(0, 16, 62, 20);

  // Main fuselage — blue triangle
  g.fillStyle(0x1a5fe0);
  g.fillTriangle(0, -28, -18, 22, 18, 22);

  // Cockpit dome
  g.fillStyle(0x55aaff);
  g.fillTriangle(0, -16, -9, 10, 9, 10);

  // Cockpit bright core
  g.fillStyle(0xaaddff, 0.75);
  g.fillEllipse(0, -4, 10, 14);

  // Left wing
  g.fillStyle(0x0f3da8);
  g.fillTriangle(-18, 16, -32, 24, -12, 22);

  // Right wing
  g.fillStyle(0x0f3da8);
  g.fillTriangle(18, 16, 12, 22, 32, 24);

  // Wing accent stripes
  g.fillStyle(0x4488ff, 0.6);
  g.fillRect(-28, 18, 10, 3);
  g.fillRect(18, 18, 10, 3);

  // Left engine pod
  g.fillStyle(0x0a2870);
  g.fillRect(-13, 14, 8, 10);

  // Right engine pod
  g.fillStyle(0x0a2870);
  g.fillRect(5, 14, 8, 10);

  // Left engine glow
  g.fillStyle(0xff5500, 0.95);
  g.fillRect(-12, 22, 6, 5);
  g.fillStyle(0xffcc00, 0.85);
  g.fillRect(-11, 23, 4, 4);

  // Right engine glow
  g.fillStyle(0xff5500, 0.95);
  g.fillRect(6, 22, 6, 5);
  g.fillStyle(0xffcc00, 0.85);
  g.fillRect(7, 23, 4, 4);

  // Nose tip highlight
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(-1, -28, 2, 5);
}
