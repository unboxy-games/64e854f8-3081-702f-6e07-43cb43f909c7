import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyBomberParams extends Record<string, unknown> {
  color?: string;
  glowColor?: string;
}

export const defaultParams: EnemyBomberParams = {
  color: '#ff8822',
  glowColor: '#ffcc44',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyBomberParams>['render'] = (g, params) => {
  g.clear();
  const body = hex(params.color ?? '#ff8822');
  const glow = hex(params.glowColor ?? '#ffcc44');
  const dark = hex('#441100');

  // Left wing
  g.fillStyle(hex('#cc5500'), 1);
  g.fillTriangle(-26, 16, -12, -14, -12, 16);
  // Right wing
  g.fillStyle(hex('#cc5500'), 1);
  g.fillTriangle(26, 16, 12, -14, 12, 16);

  // Wing ribs
  g.lineStyle(1.5, hex('#ff9944'), 0.55);
  g.lineBetween(-24, 14, -14, -8);
  g.lineBetween(24, 14, 14, -8);

  // Central body
  g.fillStyle(body, 1);
  g.fillEllipse(0, 0, 28, 36);

  // Nose cone (pointing downward — fires bombs)
  g.fillStyle(hex('#ffaa33'), 1);
  g.fillTriangle(-9, -14, 9, -14, 0, -26);

  // Cockpit
  g.fillStyle(dark, 1);
  g.fillEllipse(0, -3, 16, 11);
  g.fillStyle(glow, 0.7);
  g.fillEllipse(0, -3, 10, 7);

  // Bomb orb
  g.fillStyle(glow, 0.9);
  g.fillCircle(0, 8, 6);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(-2, 6, 2);

  // Bomb racks
  g.fillStyle(dark, 1);
  g.fillRect(-22, 8, 8, 5);
  g.fillRect(14, 8, 8, 5);

  // Exhaust ports
  g.fillStyle(hex('#ff4400'), 0.8);
  g.fillRect(-5, 17, 4, 4);
  g.fillRect(1, 17, 4, 4);

  // Outline
  g.lineStyle(1.5, hex('#ffaa44'), 0.6);
  g.strokeEllipse(0, 0, 28, 36);
};
