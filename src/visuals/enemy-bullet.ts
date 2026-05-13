import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyBulletParams extends Record<string, unknown> {
  color?: string;
}

export const defaultParams: EnemyBulletParams = {
  color: '#ff4422',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyBulletParams>['render'] = (g, params) => {
  g.clear();
  const col = hex(params.color ?? '#ff4422');

  // Outer glow
  g.fillStyle(col, 0.2);
  g.fillRect(-4, -8, 8, 16);

  // Core
  g.fillStyle(col, 1);
  g.fillRect(-2.5, -7, 5, 14);

  // Hot tip
  g.fillStyle(0xffee22, 0.9);
  g.fillCircle(0, 7, 3);
};
