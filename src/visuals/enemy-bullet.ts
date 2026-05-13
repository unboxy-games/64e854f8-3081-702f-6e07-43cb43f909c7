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
  g.fillStyle(col, 0.25);
  g.fillRect(-5, -9, 10, 18);

  // Main bolt
  g.fillStyle(col, 1);
  g.fillRect(-3, -7, 6, 14);

  // Inner core
  g.fillStyle(0xffcc44, 0.6);
  g.fillRect(-1, -6, 2, 12);

  // Tip glow
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(-2, -8, 4, 3);
};
