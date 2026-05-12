import type Phaser from 'phaser';
import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlayerShipParams extends Record<string, unknown> {
  color?: string;
  engineColor?: string;
  wingColor?: string;
}

export const defaultParams: PlayerShipParams = {
  color: '#4499dd',
  engineColor: '#00eeff',
  wingColor: '#1a5599',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<PlayerShipParams>['render'] = (g, params) => {
  g.clear();

  const body = hex(params.color ?? '#4499dd');
  const engine = hex(params.engineColor ?? '#00eeff');
  const wing = hex(params.wingColor ?? '#1a5599');

  // ── Engine exhaust glow ─────────────────────────────────────────────────
  g.fillStyle(engine, 0.22);
  g.fillEllipse(0, 30, 46, 22);

  // ── Main hull ───────────────────────────────────────────────────────────
  g.fillStyle(body, 1);
  // Centre triangular body
  g.fillTriangle(0, -42, -26, 26, 26, 26);

  // ── Wings ───────────────────────────────────────────────────────────────
  g.fillStyle(wing, 1);
  g.fillTriangle(-26, 26, -50, 14, -18, 4);
  g.fillTriangle(26, 26, 50, 14, 18, 4);

  // Wing accent lines
  g.lineStyle(1, engine, 0.55);
  g.lineBetween(-42, 18, -26, 8);
  g.lineBetween(42, 18, 26, 8);

  // ── Cockpit ─────────────────────────────────────────────────────────────
  g.fillStyle(engine, 0.88);
  g.fillEllipse(0, -10, 18, 28);

  // Highlight
  g.fillStyle(0xffffff, 0.28);
  g.fillEllipse(-3, -16, 7, 10);

  // ── Engine nozzle ───────────────────────────────────────────────────────
  g.fillStyle(wing, 1);
  g.fillRect(-11, 18, 22, 12);

  g.fillStyle(engine, 1);
  g.fillRect(-8, 20, 16, 10);

  g.fillStyle(0xffffff, 0.72);
  g.fillRect(-5, 22, 10, 6);

  // ── Hull stripe detail ──────────────────────────────────────────────────
  g.lineStyle(1, 0x88ccff, 0.4);
  g.lineBetween(-12, -8, -12, 16);
  g.lineBetween(12, -8, 12, 16);
};
