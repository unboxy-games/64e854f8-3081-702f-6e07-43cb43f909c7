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
  const body  = hex(params.color    ?? '#cc1133');
  const eye   = hex(params.eyeColor ?? '#ff4488');
  const dark  = hex('#220011');
  const mid   = hex('#aa0022');
  const lite  = hex('#ff2244');
  const phase = params.phase ?? 1;

  // ── Outer aura ring ───────────────────────────────────────────────────
  g.lineStyle(3, phase <= 1 ? lite : hex('#ff8800'), 0.22);
  g.strokeCircle(0, 0, 52);

  // ── Left cannon arm ───────────────────────────────────────────────────
  g.fillStyle(mid, 1);
  g.fillRect(-56, -10, 26, 20);
  // Left barrel
  g.fillStyle(hex('#880022'), 1);
  g.fillRect(-62, -5, 10, 10);
  g.fillStyle(eye, 0.75);
  g.fillCircle(-56, 0, 5);

  // ── Right cannon arm ──────────────────────────────────────────────────
  g.fillStyle(mid, 1);
  g.fillRect(30, -10, 26, 20);
  g.fillStyle(hex('#880022'), 1);
  g.fillRect(52, -5, 10, 10);
  g.fillStyle(eye, 0.75);
  g.fillCircle(56, 0, 5);

  // ── Main hexagonal body ───────────────────────────────────────────────
  g.fillStyle(body, 1);
  g.fillPoints([
    { x:  0,  y: -40 },
    { x:  32, y: -22 },
    { x:  32, y:  22 },
    { x:  0,  y:  38 },
    { x: -32, y:  22 },
    { x: -32, y: -22 },
  ], true);

  // ── Inner hull plate ─────────────────────────────────────────────────
  g.fillStyle(mid, 1);
  g.fillPoints([
    { x:  0,  y: -30 },
    { x:  22, y: -16 },
    { x:  22, y:  16 },
    { x:  0,  y:  28 },
    { x: -22, y:  16 },
    { x: -22, y: -16 },
  ], true);

  // ── Top spike ────────────────────────────────────────────────────────
  g.fillStyle(lite, 1);
  g.fillTriangle(-10, -38, 10, -38, 0, -52);

  // ── Side spikes ──────────────────────────────────────────────────────
  g.fillStyle(mid, 1);
  g.fillTriangle(-28, -12, -40, 0, -28, 12);
  g.fillTriangle(28, -12, 40, 0, 28, 12);

  // ── Central eye socket ────────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillCircle(0, -4, 20);
  g.fillStyle(eye, 1);
  g.fillCircle(0, -4, 14);
  // Eye iris
  g.fillStyle(phase <= 1 ? hex('#ff88aa') : hex('#ffcc00'), 0.95);
  g.fillCircle(0, -4, 9);
  // Pupil highlight
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(-3, -7, 5);

  // ── Bottom thruster nozzles ───────────────────────────────────────────
  g.fillStyle(hex('#550011'), 1);
  g.fillRect(-20, 28, 11, 9);
  g.fillRect(-4,  28, 8,  9);
  g.fillRect(9,   28, 11, 9);
  // Thruster glow
  g.fillStyle(hex('#ff6600'), 0.7);
  g.fillRect(-18, 35, 7, 5);
  g.fillRect(-2,  35, 4, 5);
  g.fillRect(11,  35, 7, 5);

  // ── Panel lines ───────────────────────────────────────────────────────
  g.lineStyle(1.2, lite, 0.35);
  g.lineBetween(-20, -18, 20, -18);
  g.lineBetween(-20, 10,  20,  10);

  // ── Outer outline ─────────────────────────────────────────────────────
  g.lineStyle(2, lite, 0.7);
  g.strokePoints([
    { x:  0,  y: -40 },
    { x:  32, y: -22 },
    { x:  32, y:  22 },
    { x:  0,  y:  38 },
    { x: -32, y:  22 },
    { x: -32, y: -22 },
  ], true);
};
