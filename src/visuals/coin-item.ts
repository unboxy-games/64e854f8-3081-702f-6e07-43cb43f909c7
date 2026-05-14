import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface CoinParams {
  color?: string;
}

export const render: RenderScriptModule['render'] = (g, _params) => {
  g.clear();

  // --- outer ring shadow ---
  g.fillStyle(0xa06800, 1);
  g.fillCircle(1, 1, 11);

  // --- outer ring ---
  g.fillStyle(0xd4a017, 1);
  g.fillCircle(0, 0, 11);

  // --- inner fill ---
  g.fillStyle(0xffd700, 1);
  g.fillCircle(0, 0, 9);

  // --- inner lighter center ---
  g.fillStyle(0xffe866, 1);
  g.fillCircle(-1, -1, 6);

  // --- star highlights ---
  g.fillStyle(0xfff4a0, 0.9);
  g.fillCircle(-3, -3, 2.5);

  // --- "$" shape made of two small arcs approximated by rects ---
  g.fillStyle(0xb8860b, 1);
  // vertical bar
  g.fillRect(-1, -5, 2, 10);
  // top arc
  g.fillStyle(0xb8860b, 1);
  g.fillRect(-3, -5, 6, 2);
  g.fillRect(-3, -2, 6, 2);
  g.fillRect(-3,  1, 6, 2);
  g.fillRect(-3,  4, 6, 2);

  // --- shine dot ---
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(-5, -5, 2);

  // --- border ---
  g.lineStyle(1.5, 0xa06800, 1);
  g.strokeCircle(0, 0, 11);
};
