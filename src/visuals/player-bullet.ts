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
  g.fillStyle(col, 0.25);
  g.fillRect(-4, -11, 8, 22);

  // Core bolt
  g.fillStyle(col, 1);
  g.fillRect(-2, -10, 4, 20);

  // Bright tip
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(-1, -11, 2, 4);
};
