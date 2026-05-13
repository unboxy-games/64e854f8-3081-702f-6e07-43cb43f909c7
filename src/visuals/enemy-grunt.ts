import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyGruntParams extends Record<string, unknown> {
  color?: string;
  eyeColor?: string;
}

export const defaultParams: EnemyGruntParams = {
  color: '#44ee55',
  eyeColor: '#ffff44',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyGruntParams>['render'] = (g, params) => {
  g.clear();
  const body = hex(params.color ?? '#44ee55');
  const eye  = hex(params.eyeColor ?? '#ffff44');
  const dark = hex('#225533');

  // Body blob
  g.fillStyle(body, 1);
  g.fillEllipse(0, 2, 34, 26);

  // Top dome
  g.fillStyle(hex('#66ff77'), 1);
  g.fillEllipse(0, -5, 26, 16);

  // Antennae
  g.lineStyle(2, body, 1);
  g.lineBetween(-7, -12, -11, -20);
  g.lineBetween(7, -12, 11, -20);
  // Antenna tips
  g.fillStyle(0xffff00, 1);
  g.fillCircle(-11, -21, 3);
  g.fillCircle(11, -21, 3);

  // Eyes socket
  g.fillStyle(dark, 1);
  g.fillEllipse(-8, -4, 10, 8);
  g.fillEllipse(8, -4, 10, 8);
  // Eye glow
  g.fillStyle(eye, 1);
  g.fillCircle(-8, -4, 3.5);
  g.fillCircle(8, -4, 3.5);
  // Pupils
  g.fillStyle(0x000000, 1);
  g.fillCircle(-7, -4, 1.5);
  g.fillCircle(9, -4, 1.5);

  // Bottom claws
  g.fillStyle(body, 1);
  g.fillTriangle(-16, 9, -9, 9, -14, 17);
  g.fillTriangle(16, 9, 9, 9, 14, 17);

  // Mouth slit
  g.lineStyle(2, dark, 0.9);
  g.lineBetween(-7, 5, 7, 5);

  // Outline
  g.lineStyle(1.5, hex('#00aa22'), 0.6);
  g.strokeEllipse(0, 2, 34, 26);
};
