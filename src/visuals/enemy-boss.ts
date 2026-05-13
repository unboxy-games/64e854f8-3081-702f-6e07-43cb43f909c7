import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyBossParams extends Record<string, unknown> {
  color?: string;
  eyeColor?: string;
}

export const defaultParams: EnemyBossParams = {
  color: '#cc1133',
  eyeColor: '#ff4488',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyBossParams>['render'] = (g, params) => {
  g.clear();
  const c    = hex(params.color    ?? '#cc1133');
  const eye  = hex(params.eyeColor ?? '#ff4488');
  const dark = hex('#220011');
  const mid  = hex('#990022');
  const lite = hex('#ff2244');

  // ── Outer aura ───────────────────────────────────────────────
  g.lineStyle(3, lite, 0.18);
  g.strokeCircle(0, 0, 54);
  g.lineStyle(2, lite, 0.10);
  g.strokeCircle(0, 0, 60);

  // ── Left cannon assembly ─────────────────────────────────────
  g.fillStyle(hex('#551122'), 1);
  g.fillRect(-58, -14, 20, 28);
  g.fillStyle(mid, 1);
  g.fillRect(-56, -12, 16, 24);
  // Barrel
  g.fillStyle(hex('#880022'), 1);
  g.fillRect(-62, -7, 10, 14);
  // Muzzle glow
  g.fillStyle(eye, 0.65);
  g.fillCircle(-57, 0, 6);
  // Detail stripes
  g.lineStyle(1, lite, 0.4);
  g.lineBetween(-56, -5, -40, -5);
  g.lineBetween(-56, 5,  -40, 5 );

  // ── Right cannon assembly ────────────────────────────────────
  g.fillStyle(hex('#551122'), 1);
  g.fillRect(38, -14, 20, 28);
  g.fillStyle(mid, 1);
  g.fillRect(40, -12, 16, 24);
  g.fillStyle(hex('#880022'), 1);
  g.fillRect(52, -7, 10, 14);
  g.fillStyle(eye, 0.65);
  g.fillCircle(57, 0, 6);
  g.lineStyle(1, lite, 0.4);
  g.lineBetween(40, -5, 56, -5);
  g.lineBetween(40, 5,  56, 5 );

  // ── Main hexagonal body ──────────────────────────────────────
  const hexPts = [
    { x: 0,  y: -45 },
    { x: 36, y: -22 },
    { x: 36, y:  22 },
    { x: 0,  y:  45 },
    { x: -36, y: 22 },
    { x: -36, y: -22 },
  ];
  g.fillStyle(dark, 1);
  g.fillPoints(hexPts, true);
  g.fillStyle(c, 1);
  const innerHex = [
    { x: 0,   y: -42 },
    { x: 33,  y: -20 },
    { x: 33,  y:  20 },
    { x: 0,   y:  42 },
    { x: -33, y:  20 },
    { x: -33, y: -20 },
  ];
  g.fillPoints(innerHex, true);

  // ── Hull plates (lighter inner layer) ────────────────────────
  g.fillStyle(mid, 1);
  const plateHex = [
    { x: 0,   y: -34 },
    { x: 26,  y: -16 },
    { x: 26,  y:  16 },
    { x: 0,   y:  34 },
    { x: -26, y:  16 },
    { x: -26, y: -16 },
  ];
  g.fillPoints(plateHex, true);

  // ── Top spike ────────────────────────────────────────────────
  g.fillStyle(lite, 1);
  g.fillTriangle(-10, -40, 10, -40, 0, -58);

  // ── Side spikes ──────────────────────────────────────────────
  g.fillStyle(mid, 1);
  g.fillTriangle(-32, -14, -44, 0, -32, 14);
  g.fillTriangle(32,  -14,  44, 0,  32, 14);

  // ── Central eye ──────────────────────────────────────────────
  g.fillStyle(dark, 1);
  g.fillCircle(0, -5, 20);
  g.fillStyle(eye, 1);
  g.fillCircle(0, -5, 15);
  g.fillStyle(hex('#ff88aa'), 0.9);
  g.fillCircle(0, -5, 10);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(0, -5, 5);
  // Iris highlight
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(-4, -9, 3.5);

  // ── Bottom thruster row ──────────────────────────────────────
  g.fillStyle(hex('#440011'), 1);
  g.fillRect(-20, 32, 12, 10);
  g.fillRect(-5,  32, 10, 10);
  g.fillRect(8,   32, 12, 10);
  g.fillStyle(hex('#ff6600'), 0.75);
  g.fillRect(-18, 39, 8, 5);
  g.fillRect(-3,  39, 6, 5);
  g.fillRect(10,  39, 8, 5);

  // ── Panel lines ──────────────────────────────────────────────
  g.lineStyle(1, lite, 0.3);
  g.lineBetween(-24, -22, 24, -22);
  g.lineBetween(-24,  10, 24,  10);
  g.lineBetween(-20, -10, 20, -10);

  // ── Outline ──────────────────────────────────────────────────
  g.lineStyle(2, lite, 0.75);
  g.strokePoints(innerHex, true);
};
