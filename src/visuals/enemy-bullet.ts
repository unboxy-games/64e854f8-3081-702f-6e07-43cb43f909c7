import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyBulletParams extends Record<string, unknown> {
  color?: string;
}

export const defaultParams: EnemyBulletParams = { color: '#ff5500' };

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyBulletParams>['render'] = (g, params) => {
  g.clear();
  const c = hex(params.color ?? '#ff5500');

  // Outer glow
  g.fillStyle(c, 0.25);
  g.fillEllipse(0, 0, 8, 16);

  // Body
  g.fillStyle(c, 1);
  g.fillEllipse(0, 0, 5, 13);

  // Bright inner core
  g.fillStyle(hex('#ffcc44'), 0.85);
  g.fillEllipse(0, -1, 2.5, 7);

  // Tip glow
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(0, -5, 1.5);
};
