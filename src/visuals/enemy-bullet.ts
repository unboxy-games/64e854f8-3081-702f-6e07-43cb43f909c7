import Phaser from 'phaser';

/**
 * Enemy plasma bolt — red, travels downward.
 * Visual bounds: width 8 x height 16  →  x: -4..4, y: -8..8
 */
export function render(g: Phaser.GameObjects.Graphics, _params: Record<string, unknown>): void {
  // Outer heat glow
  g.fillStyle(0x880000, 0.45);
  g.fillEllipse(0, 1, 12, 18);

  // Diamond body — left
  g.fillStyle(0xff2200);
  g.fillTriangle(0, -8, -4, 2, 0, 8);

  // Diamond body — right (slightly lighter)
  g.fillStyle(0xff4422);
  g.fillTriangle(0, -8, 4, 2, 0, 8);

  // Bright core streak
  g.fillStyle(0xff8855, 0.85);
  g.fillRect(-1, -5, 2, 9);

  // Hot tip
  g.fillStyle(0xffddaa, 0.7);
  g.fillCircle(0, -7, 1);
}
