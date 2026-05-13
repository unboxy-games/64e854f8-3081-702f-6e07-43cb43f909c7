import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyBomberParams extends Record<string, unknown> {
  color?: string;
  accentColor?: string;
}

export const defaultParams: EnemyBomberParams = {
  color: '#ff8822',
  accentColor: '#ffcc44',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyBomberParams>['render'] = (g, params) => {
  g.clear();
  const c      = hex(params.color       ?? '#ff8822');
  const acc    = hex(params.accentColor ?? '#ffcc44');
  const dark   = hex('#661100');
  const mid    = hex('#cc5500');

  // ── Left engine pod ──────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillRect(-29, -8, 12, 22);
  g.fillStyle(mid, 1);
  g.fillRect(-28, -7, 10, 18);
  g.fillStyle(acc, 0.8);
  g.fillCircle(-23, 14, 5);

  // ── Right engine pod ─────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillRect(17, -8, 12, 22);
  g.fillStyle(mid, 1);
  g.fillRect(18, -7, 10, 18);
  g.fillStyle(acc, 0.8);
  g.fillCircle(23, 14, 5);

  // ── Wing connectors ──────────────────────────────────────────
  g.fillStyle(mid, 0.8);
  g.fillRect(-17, 2, 10, 8);
  g.fillRect(7,   2, 10, 8);

  // ── Main diamond body ────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillPoints(
    [
      { x: 0,   y: -24 },
      { x: 22,  y: 0   },
      { x: 0,   y: 22  },
      { x: -22, y: 0   },
    ],
    true,
  );
  g.fillStyle(c, 1);
  g.fillPoints(
    [
      { x: 0,   y: -21 },
      { x: 19,  y: 0   },
      { x: 0,   y: 19  },
      { x: -19, y: 0   },
    ],
    true,
  );

  // ── Hull panels ──────────────────────────────────────────────
  g.fillStyle(acc, 0.2);
  g.fillPoints(
    [
      { x: 0,  y: -21 },
      { x: 19, y: 0   },
      { x: 0,  y: 0   },
    ],
    true,
  );
  g.lineStyle(1, acc, 0.4);
  g.lineBetween(-14, 0, 14, 0);
  g.lineBetween(0, -15, 0, 15);

  // ── Front cannon ─────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillRect(-5, -27, 10, 8);
  g.fillStyle(acc, 0.9);
  g.fillRect(-3, -28, 6, 6);

  // ── Central visor ────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillEllipse(0, -5, 16, 10);
  g.fillStyle(acc, 0.7);
  g.fillEllipse(0, -6, 11, 7);
  g.fillStyle(0xffffff, 0.4);
  g.fillEllipse(-2, -8, 5, 3);

  // ── Outline ──────────────────────────────────────────────────
  g.lineStyle(1.5, hex('#ffaa33'), 0.6);
  g.strokePoints(
    [
      { x: 0,   y: -21 },
      { x: 19,  y: 0   },
      { x: 0,   y: 19  },
      { x: -19, y: 0   },
    ],
    true,
  );
};
