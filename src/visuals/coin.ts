import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface CoinParams extends Record<string, unknown> {
  radius?: number;
  color?: string;
  shine?: boolean;
}

export const defaultParams: CoinParams = {
  radius: 32,
  color: '#ffd700',
  shine: true,
};

function parseHex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<CoinParams>['render'] = (g, params) => {
  g.clear();

  const radius = params.radius ?? 32;
  const goldMain = parseHex(params.color ?? '#ffd700');
  const goldDark = 0xa67c00;
  const goldMid  = 0xe6b800;
  const shine    = params.shine !== false;

  // Outer dark ring (edge depth)
  g.fillStyle(goldDark, 1);
  g.fillCircle(0, 0, radius);

  // Main gold body (slightly inset)
  g.fillStyle(goldMain, 1);
  g.fillCircle(0, 0, radius - 3);

  // Inner mid-gold circle for a subtle beveled look
  g.fillStyle(goldMid, 0.45);
  g.fillCircle(0, 0, radius - 7);

  // Outer rim stroke
  g.lineStyle(3, goldDark, 1);
  g.strokeCircle(0, 0, radius);

  // Inner rim stroke
  g.lineStyle(1.5, goldDark, 0.5);
  g.strokeCircle(0, 0, radius - 6);

  // Shine highlight — soft oval in upper-left quadrant
  if (shine) {
    const shineOff = radius * 0.28;
    const shineR   = radius * 0.3;
    g.fillStyle(0xfffde0, 0.75);
    g.fillCircle(-shineOff, -shineOff, shineR);

    // Smaller bright specular dot
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(-shineOff * 0.6, -shineOff * 0.6, shineR * 0.42);
  }
};
