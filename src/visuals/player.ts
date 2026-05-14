import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export type PlayerParams = Record<string, unknown> & {
  bodyColor?: string;
  skinColor?: string;
};

export const defaultParams: PlayerParams = {
  bodyColor: '#3a7bd5',
  skinColor: '#f4c58a',
};

function h(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<PlayerParams>['render'] = (g, params) => {
  g.clear();

  const bodyCol = h(params.bodyColor ?? '#3a7bd5');
  const skinCol = h(params.skinColor ?? '#f4c58a');
  const darkBody = 0x1a3a7a;

  // --- Legs ---
  g.fillStyle(darkBody, 1);
  g.fillRoundedRect(-9, 9, 7, 13, 2);  // left leg
  g.fillRoundedRect(2, 9, 7, 13, 2);   // right leg

  // --- Shoes ---
  g.fillStyle(0x222222, 1);
  g.fillRoundedRect(-11, 19, 9, 5, 2);  // left shoe
  g.fillRoundedRect(2, 19, 9, 5, 2);    // right shoe

  // --- Body ---
  g.fillStyle(bodyCol, 1);
  g.fillRoundedRect(-10, -6, 20, 17, 4);

  // Body highlight
  g.fillStyle(0xffffff, 0.15);
  g.fillRoundedRect(-8, -4, 16, 7, 3);

  // Belt
  g.fillStyle(0x222244, 1);
  g.fillRect(-10, 8, 20, 3);

  // --- Head ---
  g.fillStyle(skinCol, 1);
  g.fillCircle(0, -16, 10);

  // Hair
  g.fillStyle(0x3a2010, 1);
  g.fillRect(-10, -26, 20, 10);
  g.fillRoundedRect(-10, -24, 20, 8, 4);

  // --- Eyes ---
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-4, -17, 3);
  g.fillCircle(4, -17, 3);

  g.fillStyle(0x1a3a70, 1);
  g.fillCircle(-4, -17, 1.8);
  g.fillCircle(4, -17, 1.8);

  g.fillStyle(0xffffff, 1);
  g.fillCircle(-3, -18, 0.8);
  g.fillCircle(5, -18, 0.8);

  // --- Outline ---
  g.lineStyle(1.5, 0x0d1a40, 0.8);
  g.strokeRoundedRect(-10, -6, 20, 17, 4);
  g.strokeCircle(0, -16, 10);
};
