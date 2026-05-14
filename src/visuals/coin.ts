import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export const defaultParams = {};

export const render: RenderScriptModule<typeof defaultParams>['render'] = (g, _params) => {
  g.clear();

  // Outer dark-gold ring (border)
  g.fillStyle(0xB8860B, 1);
  g.fillCircle(0, 0, 12);

  // Main gold body
  g.fillStyle(0xFFD700, 1);
  g.fillCircle(0, 0, 10);

  // Inner detail ring
  g.lineStyle(1.5, 0xDAA520, 0.7);
  g.strokeCircle(0, 0, 7);

  // Bright inner highlight
  g.fillStyle(0xFFF0A0, 0.75);
  g.fillCircle(-1, -1, 5);

  // Shine sparkle
  g.fillStyle(0xFFFFF0, 1);
  g.fillCircle(-4, -4, 2.5);
  g.fillCircle(-5, -5, 1.2);
};
