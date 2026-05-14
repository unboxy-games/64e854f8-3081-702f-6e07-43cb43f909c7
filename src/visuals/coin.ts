import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export type CoinParams = Record<string, unknown> & {
  color?: string;
};

export const defaultParams: CoinParams = {
  color: '#ffd700',
};

export const render: RenderScriptModule<CoinParams>['render'] = (g, _params) => {
  g.clear();

  // Outer shadow ring
  g.fillStyle(0x996600, 1);
  g.fillCircle(0, 1, 12);

  // Main gold body
  g.fillStyle(0xffd700, 1);
  g.fillCircle(0, 0, 11);

  // Inner highlight band
  g.fillStyle(0xffe566, 1);
  g.fillCircle(0, 0, 8);

  // Rim detail
  g.lineStyle(1.5, 0xcc9900, 1);
  g.strokeCircle(0, 0, 11);

  // Dollar symbol cross
  g.fillStyle(0xcc8800, 1);
  g.fillRect(-1.5, -5, 3, 10);   // vertical bar
  g.fillRect(-4, -1.5, 8, 3);    // horizontal bar

  // Shine spot
  g.fillStyle(0xfffacc, 0.75);
  g.fillCircle(-4, -4, 2.5);
};
