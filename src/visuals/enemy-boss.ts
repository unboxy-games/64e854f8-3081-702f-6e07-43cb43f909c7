import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyBossParams extends Record<string, unknown> {
  color?: string;
  eyeColor?: string;
  phase?: number;
}

export const defaultParams: EnemyBossParams = {
  color: '#cc1133',
  eyeColor: '#ff4488',
  phase: 1,
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyBossParams>['render'] = (g, params) => {
  g.clear();
  const body  = hex(params.color ?? '#cc1133');
  const eye   = hex(params.eyeColor ?? '#ff4488');
  const dark  = hex('#220011');
  const phase = (params.phase as number) ?? 1;

  // Outer aura ring
  g.lineStyle(3, phase <= 1 ? hex('#ff2244') : hex('#ff8800'), 0.25);
  g.strokeCircle(0, 0, 56);

  // Left cannon arm
  g.fillStyle(hex('#661122'), 1);
  g.fillRect(-58, -10, 24, 20);
  g.fillStyle(hex('#880022'), 1);
  g.fillRect(-64, -5, 10, 10);
  g.fillStyle(eye, 0.75);
  g.fillCircle(-57, 0, 4.5);

  // Right cannon arm
  g.fillStyle(hex('#661122'), 1);
  g.fillRect(34, -10, 24, 20);
  g.fillStyle(hex('#880022'), 1);
  g.fillRect(54, -5, 10, 10);
  g.fillStyle(eye, 0.75);
  g.fillCircle(57, 0, 4.5);

  // Main body — hex silhouette
  g.fillStyle(body, 1);
  g.fillPoints([
    { x:  0, y: -42 },
    { x: 34, y: -22 },
    { x: 34, y:  22 },
    { x:  0, y:  40 },
    { x: -34, y:  22 },
    { x: -34, y: -22 },
  ], true);

  // Inner hull plate
  g.fillStyle(hex('#aa0022'), 1);
  g.fillPoints([
    { x:  0, y: -32 },
    { x: 24, y: -16 },
    { x: 24, y:  16 },
    { x:  0, y:  30 },
    { x: -24, y:  16 },
    { x: -24, y: -16 },
  ], true);

  // Top spike
  g.fillStyle(hex('#ff2244'), 1);
  g.fillTriangle(-10, -37, 10, -37, 0, -52);

  // Side decorative spikes
  g.fillStyle(hex('#aa0022'), 1);
  g.fillTriangle(-29, -10, -40, 0, -29, 10);
  g.fillTriangle(29, -10, 40, 0, 29, 10);

  // Central eye
  g.fillStyle(dark, 1);
  g.fillCircle(0, -4, 20);
  g.fillStyle(eye, 1);
  g.fillCircle(0, -4, 14);
  g.fillStyle(phase <= 1 ? hex('#ff88aa') : hex('#ffcc00'), 0.9);
  g.fillCircle(0, -4, 9);
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(-3, -7, 4);

  // Bottom thrusters
  g.fillStyle(hex('#550011'), 1);
  g.fillRect(-20, 29, 10, 8);
  g.fillRect(-4, 29, 8, 8);
  g.fillRect(10, 29, 10, 8);
  g.fillStyle(hex('#ff6600'), 0.75);
  g.fillRect(-18, 35, 6, 4);
  g.fillRect(-2, 35, 4, 4);
  g.fillRect(12, 35, 6, 4);

  // Panel lines
  g.lineStyle(1, hex('#ff4455'), 0.35);
  g.lineBetween(-22, -20, 22, -20);
  g.lineBetween(-22, 12, 22, 12);

  // Hull outline
  g.lineStyle(2, hex('#ff2244'), 0.75);
  g.strokePoints([
    { x:  0, y: -42 },
    { x: 34, y: -22 },
    { x: 34, y:  22 },
    { x:  0, y:  40 },
    { x: -34, y:  22 },
    { x: -34, y: -22 },
  ], true);
};
