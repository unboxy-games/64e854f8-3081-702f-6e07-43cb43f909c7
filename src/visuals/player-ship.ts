import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlayerShipParams extends Record<string, unknown> {
  color?: string;
  cockpitColor?: string;
  engineColor?: string;
}

export const defaultParams: PlayerShipParams = {
  color: '#22ddff',
  cockpitColor: '#aaffff',
  engineColor: '#ff9922',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<PlayerShipParams>['render'] = (g, params) => {
  g.clear();
  const body    = hex(params.color        ?? '#22ddff');
  const cockpit = hex(params.cockpitColor ?? '#aaffff');
  const engine  = hex(params.engineColor  ?? '#ff9922');
  const dark    = 0x003344;
  const mid     = hex('#0d99cc');

  // ── Wing triangle (wide sweep, facing up) ─────────────────────────────
  g.fillStyle(body, 1);
  g.fillTriangle(-40, 32, 0, -22, 40, 32);

  // ── Wing accent lines ─────────────────────────────────────────────────
  g.lineStyle(1.5, hex('#44eeff'), 0.5);
  g.lineBetween(-24, 26, -6, -6);
  g.lineBetween(24, 26, 6, -6);

  // ── Fuselage center ───────────────────────────────────────────────────
  g.fillStyle(mid, 1);
  g.fillRect(-11, -28, 22, 58);

  // ── Fuselage highlight edge ───────────────────────────────────────────
  g.lineStyle(1, hex('#66eeff'), 0.55);
  g.lineBetween(-11, -28, -11, 30);
  g.lineBetween(11, -28, 11, 30);

  // ── Gun barrel ────────────────────────────────────────────────────────
  g.fillStyle(hex('#00ccee'), 1);
  g.fillRect(-4, -36, 8, 14);
  // Gun tip glow
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(-2, -36, 4, 4);

  // ── Cockpit dome ──────────────────────────────────────────────────────
  g.fillStyle(cockpit, 0.85);
  g.fillEllipse(0, -10, 18, 14);
  g.fillStyle(0xffffff, 0.25);
  g.fillEllipse(-3, -13, 6, 5);

  // ── Engine pods ───────────────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillRect(-38, 20, 14, 12);
  g.fillRect(24, 20, 14, 12);

  // ── Engine glow ───────────────────────────────────────────────────────
  g.fillStyle(engine, 0.95);
  g.fillRect(-35, 30, 8, 6);
  g.fillRect(27, 30, 8, 6);

  // ── Engine core ──────────────────────────────────────────────────────
  g.fillStyle(0xffcc44, 0.7);
  g.fillRect(-33, 32, 4, 4);
  g.fillRect(29, 32, 4, 4);
};
