import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export type EnemyPatrollerParams = Record<string, unknown> & {
  bodyColor?: string;
};

export const defaultParams: EnemyPatrollerParams = {
  bodyColor: '#cc3344',
};

function h(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyPatrollerParams>['render'] = (g, params) => {
  g.clear();

  const bodyCol = h(params.bodyColor ?? '#cc3344');
  const darkCol = 0x771122;

  // Shadow under feet
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(0, 19, 26, 5);

  // --- Feet ---
  g.fillStyle(darkCol, 1);
  g.fillRoundedRect(-13, 9, 10, 10, 3);   // left foot
  g.fillRoundedRect(3, 9, 10, 10, 3);     // right foot

  // Foot claws
  g.fillStyle(0x440011, 1);
  g.fillTriangle(-14, 19, -11, 19, -12, 23);
  g.fillTriangle(-8, 19, -5, 19, -7, 23);
  g.fillTriangle(3, 19, 6, 19, 4, 23);
  g.fillTriangle(9, 19, 12, 19, 10, 23);

  // --- Main body ---
  g.fillStyle(bodyCol, 1);
  g.fillRoundedRect(-14, -16, 28, 27, 6);

  // Body highlight
  g.fillStyle(0xff7788, 0.35);
  g.fillRoundedRect(-11, -13, 20, 10, 4);

  // --- White eyes ---
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-6, -8, 7);
  g.fillCircle(6, -8, 7);

  // --- Pupils (angry / looking forward) ---
  g.fillStyle(0x111111, 1);
  g.fillCircle(-5, -8, 4);
  g.fillCircle(7, -8, 4);

  // --- Eye shine ---
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-7, -10, 1.5);
  g.fillCircle(5, -10, 1.5);

  // --- Angry eyebrows ---
  g.lineStyle(3, darkCol, 1);
  g.lineBetween(-13, -17, -2, -13);  // left brow (inner high = angry)
  g.lineBetween(13, -17, 2, -13);    // right brow

  // --- Spiky horns on top ---
  g.fillStyle(darkCol, 1);
  g.fillTriangle(-10, -16, -6, -16, -8, -24);
  g.fillTriangle(6, -16, 10, -16, 8, -24);

  // --- Outline ---
  g.lineStyle(2, 0x440011, 0.9);
  g.strokeRoundedRect(-14, -16, 28, 27, 6);
};
