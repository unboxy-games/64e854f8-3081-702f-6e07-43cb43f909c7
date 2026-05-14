import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export const defaultParams = {};

export const render: RenderScriptModule<typeof defaultParams>['render'] = (g, _params) => {
  g.clear();

  // === BASE ===
  g.fillStyle(0x666666, 1);
  g.fillRect(-8, 55, 16, 8);
  g.fillStyle(0x888888, 1);
  g.fillRect(-10, 58, 20, 5);

  // === POLE ===
  g.fillStyle(0xBBBBBB, 1);
  g.fillRect(-3, -62, 6, 120);
  // Pole shine
  g.fillStyle(0xDDDDDD, 0.55);
  g.fillRect(-1, -60, 2, 116);
  // Pole shadow
  g.fillStyle(0x888888, 0.4);
  g.fillRect(1, -60, 2, 116);

  // === FLAG BANNER (two-stripe) ===
  g.fillStyle(0x00cc44, 1);
  g.fillRect(3, -60, 34, 22); // top green stripe
  g.fillStyle(0xffffff, 1);
  g.fillRect(3, -38, 34, 22); // bottom white stripe

  // === FLAG STRIPE DETAIL ===
  g.fillStyle(0x009933, 0.5);
  g.fillRect(3, -54, 34, 4);
  g.fillStyle(0xeee, 0.3);
  g.fillRect(3, -32, 34, 4);

  // === FLAG RIGHT EDGE SHADOW ===
  g.fillStyle(0x000000, 0.12);
  g.fillRect(34, -60, 3, 44);

  // === TOP BALL ===
  g.fillStyle(0xffd700, 1);
  g.fillCircle(-1, -63, 5);
  g.fillStyle(0xffec6a, 0.7);
  g.fillCircle(-3, -65, 2);
};
