import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlayerBulletParams extends Record<string, unknown> {
  color?: string;
}

export const defaultParams: PlayerBulletParams = {
  color: '#00eeff',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<PlayerBulletParams>['render'] = (g, params) => {
  g.clear();
  const col = hex(params.color ?? '#00eeff');

  // Outer glow
  g.fillStyle(col, 0.28);
  g.fillRect(-4, -10, 8, 20);

  // Main bolt
  g.fillStyle(col, 1);
  g.fillRect(-2, -9, 4, 18);

  // Inner core
  g.fillStyle(0xffffff, 0.65);
  g.fillRect(-1, -8, 2, 16);

  // Tip spark
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(-2, -10, 4, 3);
};
