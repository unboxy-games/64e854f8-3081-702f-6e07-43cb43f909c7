import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface CoinParams {
  color?: string;
  [key: string]: unknown;
}

export const defaultParams: CoinParams = {
  color: '#ffd700',
};

export const render: RenderScriptModule<CoinParams>['render'] = (g, _params) => {
  g.clear();

  // Outer dark ring
  g.fillStyle(0xcc8800, 1);
  g.fillCircle(0, 0, 12);

  // Main gold body
  g.fillStyle(0xffd700, 1);
  g.fillCircle(0, 0, 10);

  // Inner bright yellow
  g.fillStyle(0xffee44, 1);
  g.fillCircle(0, 0, 7);

  // Dollar sign / center detail — two vertical lines
  g.fillStyle(0xcc8800, 1);
  g.fillRect(-1, -5, 2, 10);

  // Shine highlight
  g.fillStyle(0xffffcc, 0.8);
  g.fillCircle(-4, -4, 3);
};
