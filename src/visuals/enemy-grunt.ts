import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyGruntParams extends Record<string, unknown> {
  color?: string;
  eyeColor?: string;
}

export const defaultParams: EnemyGruntParams = {
  color: '#44ee55',
  eyeColor: '#ffff44',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyGruntParams>['render'] = (g, params) => {
  g.clear();
  const body = hex(params.color    ?? '#44ee55');
  const eye  = hex(params.eyeColor ?? '#ffff44');
  const dark = hex('#1a4422');
  const mid  = hex('#33cc44');

  // ── Leg claws (bottom) ───────────────────────────────────────
  g.fillStyle(body, 0.9);
  g.fillTriangle(-22, 8,  -14, 8,  -20, 19);
  g.fillTriangle(-13, 10, -6,  10, -10, 19);
  g.fillTriangle(6,   10,  13, 10,  10, 19);
  g.fillTriangle(14,  8,   22, 8,   20, 19);

  // ── Body blob ────────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillEllipse(0, 4, 40, 28);
  g.fillStyle(body, 1);
  g.fillEllipse(0, 3, 36, 24);

  // ── Top dome ─────────────────────────────────────────────────
  g.fillStyle(mid, 1);
  g.fillEllipse(0, -8, 28, 20);
  g.fillStyle(hex('#66ff77'), 0.6);
  g.fillEllipse(-4, -11, 14, 9);

  // ── Antennae ─────────────────────────────────────────────────
  g.lineStyle(2, body, 1);
  g.lineBetween(-7, -16, -10, -24);
  g.lineBetween(7,  -16,  10, -24);
  g.fillStyle(hex('#ffff00'), 1);
  g.fillCircle(-10, -25, 3);
  g.fillCircle(10,  -25, 3);

  // ── Eye sockets ──────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillEllipse(-9, -5, 13, 10);
  g.fillEllipse(9,  -5, 13, 10);
  g.fillStyle(eye, 1);
  g.fillCircle(-9, -5, 5);
  g.fillCircle(9,  -5, 5);
  g.fillStyle(0x000000, 1);
  g.fillCircle(-8, -5, 2);
  g.fillCircle(10, -5, 2);
  // highlight
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(-10, -7, 1.5);
  g.fillCircle(8,   -7, 1.5);

  // ── Mouth ────────────────────────────────────────────────────
  g.lineStyle(2, dark, 0.9);
  g.lineBetween(-7, 5, 7, 5);
  g.fillStyle(dark, 0.5);
  g.fillEllipse(0, 5, 12, 4);

  // ── Outline ──────────────────────────────────────────────────
  g.lineStyle(1.5, hex('#00cc22'), 0.6);
  g.strokeEllipse(0, 3, 36, 24);
};
