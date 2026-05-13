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
  const dark = hex('#114422');
  const lite = hex('#66ff77');

  // ── Antenna stalks ────────────────────────────────────────────────────
  g.lineStyle(2, body, 0.9);
  g.lineBetween(-7, -14, -11, -22);
  g.lineBetween(7, -14, 11, -22);
  // Antenna tips
  g.fillStyle(hex('#ffff00'), 1);
  g.fillCircle(-11, -23, 3);
  g.fillCircle(11, -23, 3);

  // ── Main body blob ────────────────────────────────────────────────────
  g.fillStyle(body, 1);
  g.fillEllipse(0, 4, 38, 26);

  // ── Top dome ──────────────────────────────────────────────────────────
  g.fillStyle(lite, 1);
  g.fillEllipse(0, -7, 28, 18);

  // ── Eye sockets ───────────────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillEllipse(-9, -4, 12, 9);
  g.fillEllipse(9, -4, 12, 9);

  // ── Irises ────────────────────────────────────────────────────────────
  g.fillStyle(eye, 1);
  g.fillCircle(-9, -4, 4);
  g.fillCircle(9, -4, 4);

  // ── Pupils ────────────────────────────────────────────────────────────
  g.fillStyle(0x000000, 1);
  g.fillCircle(-8, -4, 2);
  g.fillCircle(10, -4, 2);

  // ── Side claws ────────────────────────────────────────────────────────
  g.fillStyle(body, 1);
  g.fillTriangle(-22, 4, -14, 4, -20, 16);
  g.fillTriangle(22, 4, 14, 4, 20, 16);

  // ── Belly mouth slit ─────────────────────────────────────────────────
  g.lineStyle(2, dark, 0.8);
  g.lineBetween(-9, 8, 9, 8);

  // ── Outline ───────────────────────────────────────────────────────────
  g.lineStyle(1.2, hex('#00aa22'), 0.65);
  g.strokeEllipse(0, 4, 38, 26);
};
