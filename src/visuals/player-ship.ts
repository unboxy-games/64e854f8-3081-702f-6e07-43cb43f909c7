import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlayerShipParams extends Record<string, unknown> {
  bodyColor?: string;
  cockpitColor?: string;
  engineColor?: string;
}

export const defaultParams: PlayerShipParams = {
  bodyColor: '#00ddff',
  cockpitColor: '#aaffff',
  engineColor: '#ff8800',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<PlayerShipParams>['render'] = (g, params) => {
  g.clear();

  const body    = hex(params.bodyColor    ?? '#00ddff');
  const cockpit = hex(params.cockpitColor ?? '#aaffff');
  const engine  = hex(params.engineColor  ?? '#ff8800');

  // Engine exhaust glow
  g.fillStyle(0x0044ff, 0.22);
  g.fillEllipse(0, 32, 26, 16);

  // Wings
  g.fillStyle(0x005577, 1);
  g.fillTriangle(-18, 20, -40, 32, -10, 4);
  g.fillTriangle( 18, 20,  40, 32,  10, 4);

  // Wing accent
  g.fillStyle(0x0099bb, 0.55);
  g.fillTriangle(-18, 20, -30, 28, -12, 8);
  g.fillTriangle( 18, 20,  30, 28,  12, 8);

  // Body
  g.fillStyle(body, 1);
  g.fillTriangle(0, -36, -20, 22, 20, 22);

  // Body centre stripe (darker)
  g.fillStyle(0x007799, 1);
  g.fillTriangle(0, -22, -10, 16, 10, 16);

  // Cockpit dome
  g.fillStyle(cockpit, 0.95);
  g.fillEllipse(0, -14, 14, 20);
  g.fillStyle(0xffffff, 0.5);
  g.fillEllipse(-2, -19, 6, 9);

  // Engine nozzles
  g.fillStyle(engine, 0.95);
  g.fillRect(-11, 22, 8, 13);
  g.fillRect(  3, 22, 8, 13);
  const engineYellow = 0xffee00;
  g.fillStyle(engineYellow, 0.7);
  g.fillRect(-10, 27, 6, 6);
  g.fillRect(  4, 27, 6, 6);

  // Wing-tip cannons
  g.fillStyle(0x00bbdd, 1);
  g.fillRect(-40, 24, 5, 12);
  g.fillRect( 35, 24, 5, 12);
};
