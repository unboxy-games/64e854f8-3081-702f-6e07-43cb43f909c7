import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlayerShipParams extends Record<string, unknown> {
  color?: string;
  cockpitColor?: string;
  engineColor?: string;
}

export const defaultParams: PlayerShipParams = {
  color: '#22ccff',
  cockpitColor: '#aaffff',
  engineColor: '#ff9922',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<PlayerShipParams>['render'] = (g, params) => {
  g.clear();
  const c    = hex(params.color        ?? '#22ccff');
  const cock = hex(params.cockpitColor ?? '#aaffff');
  const eng  = hex(params.engineColor  ?? '#ff9922');
  const dark = hex('#0a4460');

  // ── Engine nozzle glow (bottom) ──────────────────────────────
  g.fillStyle(eng, 0.35);
  g.fillEllipse(0, 38, 26, 14);

  // ── Exhaust nozzle ───────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillRect(-10, 28, 20, 8);

  // ── Engine accent ────────────────────────────────────────────
  g.fillStyle(eng, 0.85);
  g.fillRect(-7, 29, 14, 5);

  // ── Left swept wing ──────────────────────────────────────────
  g.fillStyle(hex('#1890bb'), 1);
  g.fillTriangle(-8, 0, -30, 22, -16, 28);
  g.fillStyle(c, 0.7);
  g.fillTriangle(-8, 0, -28, 18, -15, 24);

  // ── Right swept wing ─────────────────────────────────────────
  g.fillStyle(hex('#1890bb'), 1);
  g.fillTriangle(8, 0, 30, 22, 16, 28);
  g.fillStyle(c, 0.7);
  g.fillTriangle(8, 0, 28, 18, 15, 24);

  // ── Main hull ────────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillPoints(
    [
      { x: 0,   y: -35 },
      { x: 17,  y: -8  },
      { x: 18,  y: 24  },
      { x: 0,   y: 30  },
      { x: -18, y: 24  },
      { x: -17, y: -8  },
    ],
    true,
  );
  g.fillStyle(c, 1);
  g.fillPoints(
    [
      { x: 0,   y: -33 },
      { x: 15,  y: -7  },
      { x: 16,  y: 22  },
      { x: 0,   y: 27  },
      { x: -16, y: 22  },
      { x: -15, y: -7  },
    ],
    true,
  );

  // ── Hull panel lines ─────────────────────────────────────────
  g.lineStyle(1, hex('#aaeeff'), 0.3);
  g.lineBetween(-12, 5, 12, 5);
  g.lineBetween(-10, 14, 10, 14);

  // ── Cockpit ──────────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillEllipse(0, -16, 20, 16);
  g.fillStyle(cock, 0.85);
  g.fillEllipse(0, -17, 16, 12);
  g.fillStyle(0xffffff, 0.45);
  g.fillEllipse(-3, -19, 6, 5);

  // ── Nose tip ─────────────────────────────────────────────────
  g.fillStyle(hex('#88eeff'), 1);
  g.fillCircle(0, -33, 3);

  // ── Wing cannon tips ─────────────────────────────────────────
  g.fillStyle(hex('#88ccee'), 1);
  g.fillRect(-29, 18, 5, 6);
  g.fillRect(24, 18, 5, 6);

  // ── Outline ──────────────────────────────────────────────────
  g.lineStyle(1.5, hex('#55ddff'), 0.5);
  g.strokePoints(
    [
      { x: 0,   y: -33 },
      { x: 15,  y: -7  },
      { x: 16,  y: 22  },
      { x: 0,   y: 27  },
      { x: -16, y: 22  },
      { x: -15, y: -7  },
    ],
    true,
  );
};
