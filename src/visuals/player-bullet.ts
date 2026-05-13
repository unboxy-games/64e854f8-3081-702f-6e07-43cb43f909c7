import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlayerBulletParams extends Record<string, unknown> {
  color?: string;
}

export const defaultParams: PlayerBulletParams = { color: '#00eeff' };

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<PlayerBulletParams>['render'] = (g, params) => {
  g.clear();
  const c = hex(params.color ?? '#00eeff');

  // Outer glow
  g.fillStyle(c, 0.25);
  g.fillRect(-4, -11, 8, 22);

  // Core bolt
  g.fillStyle(c, 1);
  g.fillRect(-2, -11, 4, 22);

  // Bright tip
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(-1, -11, 2, 5);

  // Inner highlight line
  g.fillStyle(0xffffff, 0.35);
  g.fillRect(-1, -6, 2, 14);
};
