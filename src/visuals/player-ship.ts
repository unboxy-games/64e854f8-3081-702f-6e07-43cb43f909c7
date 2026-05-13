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
  const body = hex(params.color ?? '#22ddff');
  const cockpit = hex(params.cockpitColor ?? '#aaffff');
  const engine = hex(params.engineColor ?? '#ff9922');

  // Main hull — triangle pointing up
  g.fillStyle(body, 1);
  g.fillTriangle(-22, 26, 22, 26, 0, -30);

  // Left wing
  g.fillStyle(hex('#1199cc'), 1);
  g.fillTriangle(-22, 26, -38, 18, -22, -2);

  // Right wing
  g.fillStyle(hex('#1199cc'), 1);
  g.fillTriangle(22, 26, 38, 18, 22, -2);

  // Fuselage stripe
  g.fillStyle(hex('#88eeff'), 0.4);
  g.fillRect(-5, -26, 10, 44);

  // Cockpit window
  g.fillStyle(cockpit, 0.9);
  g.fillCircle(0, -10, 8);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(-2, -13, 3);

  // Wing tip lights
  g.fillStyle(hex('#ff4444'), 1);
  g.fillRect(-40, 16, 5, 7);
  g.fillRect(35, 16, 5, 7);

  // Engine nozzle
  g.fillStyle(hex('#334455'), 1);
  g.fillRect(-10, 24, 20, 5);

  // Engine glow
  g.fillStyle(engine, 0.9);
  g.fillRect(-7, 28, 14, 5);

  // Outline
  g.lineStyle(1.5, hex('#66ffff'), 0.7);
  g.strokeTriangle(-22, 26, 22, 26, 0, -30);
};
