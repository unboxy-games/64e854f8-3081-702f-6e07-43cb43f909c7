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
  const body = hex(params.color     ?? '#ff8822');
  const glow = hex(params.glowColor ?? '#ffcc44');
  const dark = hex('#661100');
  const lite = hex('#ffaa44');

  // ── Outer aura ────────────────────────────────────────────────────────
  g.lineStyle(2, glow, 0.2);
  g.strokeEllipse(0, 0, 60, 52);

  // ── Main diamond body ─────────────────────────────────────────────────
  g.fillStyle(body, 1);
  g.fillPoints([
    { x: 0,   y: -25 },   // top tip
    { x: 29,  y: 0   },   // right wing
    { x: 0,   y: 22  },   // bottom
    { x: -29, y: 0   },   // left wing
  ], true);

  // ── Inner face plate ──────────────────────────────────────────────────
  g.fillStyle(lite, 1);
  g.fillPoints([
    { x: 0,   y: -16 },
    { x: 18,  y: 0   },
    { x: 0,   y: 14  },
    { x: -18, y: 0   },
  ], true);

  // ── Center energy core ────────────────────────────────────────────────
  g.fillStyle(glow, 1);
  g.fillCircle(0, 0, 9);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(-2, -2, 4);

  // ── Wing cannons ──────────────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillRect(-30, -5, 9, 10);   // left cannon
  g.fillRect(21,  -5, 9, 10);   // right cannon

  // ── Cannon glow tips ─────────────────────────────────────────────────
  g.fillStyle(glow, 0.75);
  g.fillCircle(-28, 0, 4);
  g.fillCircle(28,  0, 4);

  // ── Top fin ───────────────────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillTriangle(-5, -25, 5, -25, 0, -34);

  // ── Hull panel lines ─────────────────────────────────────────────────
  g.lineStyle(1, dark, 0.55);
  g.lineBetween(-8, -12, 8, -12);
  g.lineBetween(-8, 8,   8,  8);
};
